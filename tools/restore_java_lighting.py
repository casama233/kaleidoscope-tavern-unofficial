#!/usr/bin/env python3
"""Preserve Java unshaded faces and build localized PBR emission masks.
No invented emission for ordinary drinks: only existing light-producing blocks
and the luminous glow-berry fluid receive emissive PBR maps.
"""
import json,math,copy
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];RP=ROOT/'runtime/RP';BP=ROOT/'runtime/BP'
def read(p):return json.loads(p.read_text())
def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
geo={g['description']['identifier']:g for p in (RP/'models').rglob('*.json') for g in read(p).get('minecraft:geometry',[])}
terrain=read(RP/'textures/terrain_texture.json')['texture_data'];masks={};blocks=[];restored=0
for p in (BP/'blocks').glob('*.json'):
 j=read(p);b=j['minecraft:block'];base=b['components'];variants=[base]+[{**base,**x['components']} for x in b.get('permutations',[])];changed=False
 for i,c in enumerate(variants):
  target=base if i==0 else b['permutations'][i-1]['components']
  for visual,actual in [(c,target),(c.get('minecraft:item_visual',{}),target.get('minecraft:item_visual',{}))]:
   gid=visual.get('minecraft:geometry',visual.get('geometry',{}));gid=gid.get('identifier') if isinstance(gid,dict) else gid
   if gid not in geo:continue
   key='minecraft:material_instances' if 'minecraft:material_instances' in visual else 'material_instances';mats=copy.deepcopy(visual.get(key,{}));g=geo[gid]
   for bone in g['bones']:
    for cube in bone.get('cubes',[]):
     if not isinstance(cube.get('uv'),dict):continue
     for face in cube['uv'].values():
      name=face.get('material_instance','*')
      if 'unshaded' not in name:continue
      material=mats.get(name) or mats.get(name.removesuffix('_unshaded')) or mats.get('*')
      if not material:continue
      if name not in mats or mats[name].get('face_dimming',True):
       mats[name]={**material,'face_dimming':False,'ambient_occlusion':0.0};changed=True;restored+=1
      # Only Java light sources glow; shade=false alone is not a light source.
      if c.get('minecraft:light_emission',0)<=0:continue
      tex=terrain.get(material['texture'],{}).get('textures')
      if isinstance(tex,list):tex=tex[0]
      if not isinstance(tex,str):continue
      image=Image.open(RP/(tex+'.png')).convert('RGBA');mask=masks.setdefault(tex,Image.new('L',image.size))
      u,v=face['uv'];w,h=face['uv_size'];sx=image.width/g['description']['texture_width'];sy=image.height/g['description']['texture_height']
      x0,x1=sorted([u*sx,(u+w)*sx]);y0,y1=sorted([v*sy,(v+h)*sy])
      if x1>x0 and y1>y0:ImageDraw.Draw(mask).rectangle((math.floor(x0),math.floor(y0),math.ceil(x1)-1,math.ceil(y1)-1),fill=180)
   if mats and mats!=visual.get(key,{}):actual[key]=mats
  if c.get('minecraft:light_emission',0)>0:blocks.append({'block':b['description']['identifier'],'light':c['minecraft:light_emission']})
 if changed:write(p,j)
# Luminous fluid input retains its glow in barrel/tub entity surfaces.
for p in (RP/'textures').rglob('*glow_berries*png'):
 if 'juice' in p.name:masks[str(p.relative_to(RP).with_suffix(''))]=Image.new('L',Image.open(p).size,180)
for tex,mask in masks.items():
 p=RP/(tex+'.png');im=Image.open(p).convert('RGBA');alpha=im.getchannel('A');mask=Image.eval(mask,lambda v:v);mask.paste(0,(0,0),Image.eval(alpha,lambda a:255 if a==0 else 0))
 mer=Image.new('RGB',im.size,(0,0,150));mer.putalpha(255);mer=Image.merge('RGB',(Image.new('L',im.size,0),mask,Image.new('L',im.size,150)));mer.save(p.with_name(p.stem+'_mer.png'),optimize=True)
 write(p.with_suffix('.texture_set.json'),{'format_version':'1.16.100','minecraft:texture_set':{'color':p.stem,'metalness_emissive_roughness':p.stem+'_mer'}})
write(ROOT/'data/java-lighting-audit.json',{'javaSource':'KaleidoscopeTavern c4ec1880bd44cf3139d3ba744ab30bb379cf1416','blockLightLevels':list({(x['block'],x['light']):x for x in blocks}.values()),'restoredUnshadedMaterials':restored,'emissiveTextures':sorted(masks),'ordinaryDrinks':'No block light emission in Java; unshaded surfaces retained without inventing illumination.'})
print('Restored',restored,'unshaded material bindings;',len(masks),'PBR emission masks.')
