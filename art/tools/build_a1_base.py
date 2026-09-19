"""Build an ASSET-ONLY lab from hash-locked upstream assets.
No network, no gameplay scripts. Python 3.10+ and Pillow are required.
"""
from pathlib import Path
import base64, copy, hashlib, json, math, re, shutil, uuid
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
UP=ROOT/'upstream'
AS=UP/'src/main/resources/assets/kaleidoscope_tavern'
RP=ROOT/'RP'
BP=ROOT/'VisualLab_BP'
NS='kt_assets_a1'
NAMESPACE_UUID=uuid.UUID('6c4393db-33ce-454b-8fa1-6ee77e54e361')
def uid(key):return str(uuid.uuid5(NAMESPACE_UUID,key))
def dump(p,obj):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def rd(p):return json.loads(p.read_text(encoding='utf-8'))
def clean(v):return [0 if abs(x)<1e-9 else round(x,7) for x in v]
def filehash(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate_sources():
 rows=rd(ROOT/'sources.lock.json')['assets']
 for r in rows:
  p=UP/r['path']; b=p.read_bytes()
  assert filehash(p)==r['local_sha256'],f"Source changed: {p}"
  actual=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
  assert actual==r['git_blob_sha1'],f"Upstream SHA mismatch: {p}"
 return len(rows)

def texture_ref(model):
 values=model['textures']; refs={}
 for k,v in values.items():
  while v.startswith('#'):v=values[v[1:]]
  refs[k]=v
 unique=set(v for k,v in refs.items() if k!='particle')
 if len(unique)!=1:raise ValueError('This A1 converter only accepts single-texture models')
 return next(iter(unique)).split(':',1)[1]

def from_java_json(path, name):
 """Canonical editor space matches Java block model space, centered on X/Z."""
 m=rd(path); tex=texture_ref(m); texpath=AS/'textures'/f'{tex}.png'
 with Image.open(texpath) as im:wh=im.size
 cubes=[]; issues=[]
 for i,e in enumerate(m['elements']):
  a=[e['from'][0]-8,e['from'][1],e['from'][2]-8]
  b=[e['to'][0]-8,e['to'][1],e['to'][2]-8]
  if any(y<x for x,y in zip(a,b)):issues.append(f'element {i}: reversed size retained in editor source; no engine geometry generated')
  rot=e.get('rotation',{}); angle=rot.get('angle',0)
  if rot.get('rescale'):raise ValueError(f'{path}: rescale needs explicit implementation')
  rotations=[0.,0.,0.];rotations['xyz'.index(rot.get('axis','y'))]=angle
  pivot=rot.get('origin',[8,0,8]);pivot=[pivot[0]-8,pivot[1],pivot[2]-8]
  f={}
  for face,val in e['faces'].items():
   uv=val.get('uv')
   if uv is None:raise ValueError('Implicit UV not supported in this batch')
   f[face]={'uv':[uv[0]*wh[0]/16,uv[1]*wh[1]/16,uv[2]*wh[0]/16,uv[3]*wh[1]/16], 'rotation':val.get('rotation',0)}
  cubes.append({'name':f'{e.get("name",name)}_{i}','from':a,'to':b,'origin':pivot,'rotation':rotations,'faces':f,'box_uv':False})
 return {'name':name,'texture':tex,'texture_size':list(wh),'source':str(path.relative_to(UP)), 'bones':[{'name':'root','origin':[0,0,0],'rotation':[0,0,0],'cubes':cubes}], 'issues':issues,'java_display':m.get('display',{})}


def parse_barrel():
 path=UP/'src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/model/brew/BarrelModel.java'
 text=path.read_text();bones=[]; offsets={}
 rx=r'PartDefinition (\w+) = (\w+)\.addOrReplaceChild\("([^\"]+)", (.*?), PartPose\.(offsetAndRotation|offset)\((.*?)\)\);'
 for var,parent,name,construction,posekind,pose in re.findall(rx,text,re.S):
  nums=[float(v.strip().rstrip('F')) for v in pose.split(',')]
  off=nums[:3];prev=offsets.get(parent,[0,0,0]);full=[prev[i]+off[i] for i in range(3)];offsets[var]=full
  rot=nums[3:] if len(nums)>3 else [0,0,0]
  origin=[-full[0],24-full[1],full[2]]
  bone={'name':name,'origin':origin,'rotation':clean([-math.degrees(rot[0]),-math.degrees(rot[1]),math.degrees(rot[2])]),'cubes':[]}
  if parent!='partdefinition':bone['parent']=parent
  pattern=r'\.texOffs\((\d+), (\d+)\)(\.mirror\(\))?\.addBox\((.*?), new CubeDeformation\((.*?)\)\)'
  for idx,(u,v,mirror,box,deform) in enumerate(re.findall(pattern,construction,re.S)):
   vals=[float(v.strip().rstrip('F')) for v in box.split(',')];x,y,z,w,h,d=vals
   assert float(deform.rstrip('F'))==0
   gx,gy,gz=[full[i]+vals[i] for i in range(3)]
   bone['cubes'].append({'name':f'{name}_{idx}','from':[-gx-w,24-gy-h,gz],'to':[-gx,24-gy,gz+d], 'origin':origin[:],'rotation':[0,0,0],'box_uv':True,'uv_offset':[int(u),int(v)],'mirror_uv':bool(mirror)})
  bones.append(bone)
 assert len(bones)==6 and sum(len(b['cubes']) for b in bones)==15,'Unexpected ModelPart structure'
 return {'name':'barrel_master','texture':'entity/brew/barrel','texture_size':[256,256],'source':str(path.relative_to(UP)), 'bones':bones,'issues':[], 'java_display':{},'render_transform':{'north':{'translation':[0.5,1.5,0.5],'rotation_z':180},'runtime_facing_not_implemented':True}}


def to_geo(model):
 """Serialize editor coordinates using Bedrock's X/rotation and top/bottom UV conventions.
Conventions checked against Blockbench's Bedrock codec. Geometry is a candidate
until independently loaded into the Minecraft engine (see docs/VALIDATION).
"""
 bones=[]
 for b in model['bones']:
  bone={'name':b['name'],'pivot':clean([-b['origin'][0],b['origin'][1],b['origin'][2]])}
  if 'parent' in b:bone['parent']=b['parent']
  if any(b['rotation']):bone['rotation']=clean([-b['rotation'][0],-b['rotation'][1],b['rotation'][2]])
  cs=[]
  for c in b['cubes']:
   size=[c['to'][i]-c['from'][i] for i in range(3)]
   if min(size)<0:raise ValueError('Do not silently normalize reversed cubes')
   o={'origin':clean([-c['to'][0],c['from'][1],c['from'][2]]),'size':clean(size)}
   if any(c['rotation']):
    o['pivot']=clean([-c['origin'][0],c['origin'][1],c['origin'][2]])
    o['rotation']=clean([-c['rotation'][0],-c['rotation'][1],c['rotation'][2]])
   if c['box_uv']:
    o['uv']=c['uv_offset'][:]
    if c.get('mirror_uv'):o['mirror']=True
   else:
    o['uv']={}
    for face,f in c['faces'].items():
     u,v,uu,vv=f['uv']
     rect={'uv':[u,v],'uv_size':[uu-u,vv-v]}
     if face in ('up','down'):rect={'uv':[uu,vv],'uv_size':[u-uu,v-vv]}
     if f['rotation']:rect['uv_rotation']=f['rotation']
     o['uv'][face]=rect
   cs.append(o)
  if cs:bone['cubes']=cs
  bones.append(bone)
 barrel=model['name'].startswith('barrel')
 return {'format_version':'1.21.0','minecraft:geometry':[{'description':{'identifier':'geometry.'+NS+'.'+model['name'], 'texture_width':model['texture_size'][0], 'texture_height':model['texture_size'][1], 'visible_bounds_width':6 if barrel else 2,'visible_bounds_height':6 if barrel else 3,'visible_bounds_offset':[0,1.5 if barrel else .5,0]}, 'bones':bones}]}


def to_bbmodel(model):
 """Portable editor model with exact source textures embedded; no user fonts/assets."""
 elements=[]; groups={};root=[]; order=[]
 for b in model['bones']:
  g={'name':b['name'],'origin':b['origin'],'rotation':b['rotation'],'uuid':uid(model['name']+'/bone/'+b['name']), 'export':True,'isOpen':True,'visibility':True,'children':[]}
  groups[b['name']]=g;order.append(b)
  for c in b['cubes']:
   ident=uid(model['name']+'/'+b['name']+'/'+c['name']);g['children'].append(ident)
   e={'name':c['name'],'type':'cube','uuid':ident,'from':c['from'],'to':c['to'],'origin':c['origin'],'rotation':c['rotation'],'box_uv':c['box_uv'],'autouv':0,'export':True}
   if c['box_uv']:
    e['uv_offset']=c['uv_offset'];e['mirror_uv']=c.get('mirror_uv',False)
    e['faces']={f:{'uv':[0,0,0,0],'texture':0} for f in ['north','east','south','west','up','down']}
   else:
    e['faces']={f:({'uv':c['faces'][f]['uv'],'rotation':c['faces'][f]['rotation'],'texture':0} if f in c['faces'] else {'uv':[0,0,0,0],'texture':None}) for f in ['north','east','south','west','up','down']}
   elements.append(e)
 for b in order:
  (groups[b['parent']]['children'] if 'parent' in b else root).append(groups[b['name']])
 img=(ROOT/model["texture_file"]) if model.get("texture_file") else AS/'textures'/f"{model['texture']}.png"
 return {'meta':{'format_version':'4.10','model_format':'bedrock','box_uv':False},'name':model['name'], 'model_identifier':NS+'.'+model['name'],'visible_box':[6,6,1.5] if model['name'].startswith('barrel') else [2,3,.5], 'resolution':{'width':model['texture_size'][0],'height':model['texture_size'][1]},'elements':elements,'outliner':root,'textures':[{'name':img.name,'id':'0','uuid':uid(model['name']+'/texture'),'width':model['texture_size'][0],'height':model['texture_size'][1],'uv_width':model['texture_size'][0],'uv_height':model['texture_size'][1],'source':'data:image/png;base64,'+base64.b64encode(img.read_bytes()).decode(),'mode':'bitmap','saved':False,'render_mode':'normal'}]}


def build(overwrite=False):
 source_count=validate_sources()
 if not overwrite and any(p.exists() for p in (RP,BP)):
  raise FileExistsError("RP or VisualLab_BP exists. Back up edits; use --force to regenerate outputs.")
 for p in (RP,BP):
  if p.exists():shutil.rmtree(p)
 for rel in ('models/entity','textures/kaleidoscope_tavern','entity','render_controllers','texts'): (RP/rel).mkdir(parents=True,exist_ok=True)
 models=[]
 selections=[('pressing_tub','models/block/brew/pressing_tub.json'),('pressing_tub_tilt','models/block/brew/tilt_pressing_tub.json'),('tap_closed','models/block/brew/tap/close.json'),('tap_open','models/block/brew/tap/open.json')]+[(f'wine_{i}','models/block/brew/drink/wine/count%d.json'%i) for i in range(1,5)]+[('empty_bottle','models/block/brew/empty_bottle.json')]
 for name,path in selections:models.append(from_java_json(AS/path,name))
 master=parse_barrel()
 dump(ROOT/'editor/barrel_master.bbmodel',to_bbmodel(master))
 for state in ['closed','open']:
  model=copy.deepcopy(master);model['name']='barrel_'+state
  model['bones']=[b for b in model['bones'] if b['name'] not in (['open','open_r1','open_r2'] if state=='closed' else ['close'])]
  models.append(model)
 for src in (AS/'textures').rglob('*.png'):
  dst=RP/'textures/kaleidoscope_tavern'/src.relative_to(AS/'textures');dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
 manifest_common={'format_version':2}
 dump(RP/'manifest.json',{**manifest_common,'header':{'name':'Tavern A1 | Original Asset Visual Lab RP','description':'Real upstream assets. VISUAL LAB ONLY. Not a gameplay port. CC BY-NC-SA 4.0.','uuid':uid('rp'),'version':[0,2,0],'min_engine_version':[1,26,50]},'modules':[{'type':'resources','uuid':uid('rp.module'),'version':[0,2,0]}]})
 dump(BP/'manifest.json',{**manifest_common,'header':{'name':'Tavern A1 | Visual Lab BP','description':'Static appearance test fixtures; no gameplay scripts. Cookery integration remains pending.','uuid':uid('bp'),'version':[0,2,0],'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':uid('bp.module'),'version':[0,2,0]}],'dependencies':[{'uuid':uid('rp'),'version':[0,2,0]}]})
 dump(ROOT/'config.json',{'name':'Tavern A1 Original Asset Lab','namespace':NS,'targetVersion':'1.26.50','packs':{'behaviorPack':'./VisualLab_BP','resourcePack':'./RP'},'experimentalGameplay':{}})
 terrain={}; labels={'en_US':{},'zh_CN':{},'zh_TW':{}}
 names={'pressing_tub':('Pressing Tub','壓榨桶'), 'pressing_tub_tilt':('Tilted Pressing Tub','傾斜壓榨桶'),'tap_closed':('Closed Tap','龍頭・關閉'),'tap_open':('Open Tap','龍頭・開啟'),'barrel_closed':('Closed Barrel','大酒桶・關蓋'),'barrel_open':('Open Barrel','大酒桶・開蓋')}
 records=[]
 for m in models:
  name=m['name']; dump(ROOT/f'editor/{name}.bbmodel',to_bbmodel(m))
  record={'id':name,'source':m['source'],'cubes':sum(len(b['cubes']) for b in m['bones']),'bones':len(m['bones']),'texture':m['texture'],'texture_size':m['texture_size'], 'issues':m['issues'],'editor_model':f'editor/{name}.bbmodel','engine_visual_test':'NOT_RUN','canonical_model':m}
  if m['issues']:
   record['status']='EDITOR_SOURCE_ONLY_BLOCKED';records.append(record);continue
  geo=to_geo(m);dump(RP/f'models/entity/{name}.geo.json',geo);record['status']='CONVERTED_CANDIDATE';record['geometry']=f'RP/models/entity/{name}.geo.json'
  identifier=NS+':'+name;tex=f'textures/kaleidoscope_tavern/{m["texture"]}'
  eng,zh=names.get(name,(f'Wine | {name.split("_")[-1]} bottles',f'葡萄酒・{name.split("_")[-1]} 瓶'))
  if name.startswith('barrel'):
   dump(BP/f'entities/{name}.json',{'format_version':'1.21.0','minecraft:entity':{'description':{'identifier':identifier,'is_spawnable':False,'is_summonable':True,'is_experimental':False},'components':{'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':.1,'height':.1},'minecraft:health':{'value':1,'max':1},'minecraft:persistent':{},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False}}}})
   dump(RP/f'entity/{name}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':identifier,'materials':{'default':'entity_alphatest'},'textures':{'default':tex},'geometry':{'default':geo['minecraft:geometry'][0]['description']['identifier']},'render_controllers':['controller.render.kt_assets_a1.static']}}})
   for lang in labels:labels[lang]['entity.'+identifier+'.name']=eng if lang=='en_US' else zh
  else:
   terrain[NS+'_'+name]={'textures':tex}
   # Display fixtures intentionally have no gameplay interactions or real machine storage.
   block={'format_version':'1.26.50','minecraft:block':{'description':{'identifier':identifier,'menu_category':{'category':'construction'}},'components':{'minecraft:geometry':{'identifier':geo['minecraft:geometry'][0]['description']['identifier']},'minecraft:material_instances':{'*':{'texture':NS+'_'+name,'render_method':'alpha_test','ambient_occlusion':0.0,'face_dimming':True}},'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}}
   dump(BP/f'blocks/{name}.json',block)
   for lang in labels:labels[lang]['tile.'+identifier+'.name']=(eng if lang=='en_US' else zh)+' [A1]'
  records.append(record)
 dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a1','texture_name':'atlas.terrain','texture_data':terrain})
 dump(RP/'render_controllers/static.render_controllers.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_assets_a1.static':{'geometry':'Geometry.default','materials':[{'*':'Material.default'}],'textures':['Texture.default']}}})
 dump(BP/'items/grape.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':NS+':grape','menu_category':{'category':'items'}},'components':{'minecraft:icon':'kt_a1_grape','minecraft:display_name':{'value':'item.'+NS+':grape.name'},'minecraft:max_stack_size':64}}})
 dump(RP/'textures/item_texture.json',{'resource_pack_name':'tavern_a1','texture_name':'atlas.items','texture_data':{'kt_a1_grape':{'textures':'textures/kaleidoscope_tavern/item/grape'}}})
 for lang in labels:
  labels[lang]['item.'+NS+':grape.name']='Grape [A1 sprite]' if lang=='en_US' else '葡萄 [A1 圖示]'
  (RP/'texts'/f'{lang}.lang').write_text('## A1 labels are local test labels, not a full upstream localization.\n'+'\n'.join(k+'='+v for k,v in labels[lang].items())+'\n',encoding='utf-8')
 dump(RP/'texts/languages.json',list(labels))
 dump(ROOT/'asset-conversion.json',{'source_files_verified':source_count,'models':[{k:v for k,v in r.items() if k!='canonical_model'} for r in records]})
 dump(ROOT/'tools/render-data.json',[r['canonical_model'] for r in records if r['status']=='CONVERTED_CANDIDATE'])
 dump(ROOT/'cookery.requirement.json',{'required_for_production':True,'author':'Loyallay','target_reference':'Kaleidoscope Cookery (Unofficial) v1.0.5','identity_status':'UNVERIFIED_PACKAGE_NOT_OBTAINED','bound':False,'lab_exception':'This separate visual fixture is not the production Tavern addon. No Cookery APIs or assets are copied or referenced.'})
 for package in (RP,BP):
  for name in ("LICENSE-ASSETS","LICENSE-CODE","CREDITS.md"):
   source=ROOT/name
   if source.exists():shutil.copy2(source,package/name)
 return records
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--force',action='store_true',help='Replace generated RP and VisualLab_BP. Back up any edits first.')
 args=parser.parse_args()
 records=build(overwrite=args.force); print('built',len(records),'model records;',sum(r['status']=='CONVERTED_CANDIDATE' for r in records),'geometry candidates')
