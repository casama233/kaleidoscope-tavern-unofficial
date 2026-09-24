#!/usr/bin/env python3
"""Build the board renderer from Minecraft 1.20.1's bitmap/Unihex providers.
Coordinates are Java font pixels; only the final pixels-to-world scale differs
between SandwichBlockEntityRender (.01) and ChalkboardBlockEntityRender (.012).
"""
import json,zipfile,math,copy
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
ROOT=Path(__file__).resolve().parents[1]; RP=ROOT/'runtime/RP'; BP=ROOT/'runtime/BP'
FONT=ROOT.parent/'java-font-1.20.1';ASSETS=FONT/'assets/minecraft';OUT=RP/'textures/board_font'
def write(p,j):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
bold_offsets={};glyphs={};advances={32:4,0x200c:0};provider=json.loads((ASSETS/'font/include/unifont.json').read_text())['providers'][0]
with zipfile.ZipFile(FONT/'unifont.zip') as z:
 (RP/'font/NOTICE-Unifont.txt').write_bytes(z.read('LICENSE.txt'))
 for line in z.read(next(n for n in z.namelist() if n.endswith('.hex'))).decode().splitlines():
  code,data=line.split(':');cp=int(code,16)
  if cp>65535:continue
  width=len(data)//4;bits=bytes.fromhex(data);im=Image.frombytes('1',(width,16),bits).convert('L');bbox=im.getbbox()
  left,right=(bbox[0],bbox[2]-1) if bbox else (0,-1)
  for row in provider['size_overrides']:
   if ord(row['from'])<=cp<=ord(row['to']):left,right=row['left'],row['right'];break
  cell=Image.new('L',(32,32));w=right-left+1
  if w>0:cell.paste(im.crop((left,0,right+1,16)),(0,0))
  glyphs[cp]=cell;advances[cp]=w//2+1;bold_offsets[cp]=.5
# Bitmap providers have higher priority than Unihex, preserving vanilla ASCII.
providers=json.loads((ASSETS/'font/include/default.json').read_text())['providers']
for provider in reversed(providers):
 if provider['type']!='bitmap':continue
 src=Image.open(ASSETS/('textures/'+provider['file'].split(':')[1])).convert('RGBA').getchannel('A')
 rows=provider['chars'];cw=src.width//len(rows[0]);ch=src.height//len(rows);scale=provider.get('height',8)/ch
 for y,row in enumerate(rows):
  for x,char in enumerate(row):
   cp=ord(char)
   if not cp:continue
   im=src.crop((x*cw,y*ch,(x+1)*cw,(y+1)*ch));bbox=im.getbbox();w=bbox[2] if bbox else 0
   cell=Image.new('L',(32,32));im=im.resize((round(cw*scale*2),round(ch*scale*2)),Image.Resampling.NEAREST)
   cell.paste(im,(0,round((7-provider['ascent'])*2)));glyphs[cp]=cell;advances[cp]=math.floor(w*scale+.5)+1;bold_offsets[cp]=1
advances[32]=4;advances[0x200c]=0
glyphs[32]=Image.new('L',(32,32));glyphs[0x200c]=Image.new('L',(32,32))
missing=Image.new('L',(32,32));ImageDraw.Draw(missing).rectangle((0,0,9,13),outline=255,width=2)
OUT.mkdir(exist_ok=True,parents=True)
for page in range(256):
 normal=Image.new('L',(256,256))
 for low in range(256):
  im=glyphs.get(page*256+low,missing);x=(low%16)*16;y=(low//16)*16
  normal.paste(im.crop((0,0,16,16)),(x,y))
 out=Image.new('RGBA',(256,256),(255,255,255,0));out.putalpha(normal);out.save(OUT/f'glyph_{page:02X}.png',optimize=True)
for p in OUT.glob('*_bold.png'):p.unlink()
metrics=[advances.get(cp,6) for cp in range(65536)]
(BP/'scripts/data/board-font.js').write_text('// Minecraft Java 1.20.1 default font advances, in Java font pixels.\nexport const FONT_ADVANCES='+json.dumps(metrics,separators=(',',':'))+';\nexport const FONT_BOLD_OFFSETS='+json.dumps([bold_offsets.get(cp,1) for cp in range(65536)],separators=(',',':'))+';\n')
# A glyph has one front face and one controller. Separate glyph entities avoid
# shared-bone visibility and UV state across twelve render passes on mobile.
textures={f'page_{page}':f'textures/board_font/glyph_{page:02X}' for page in range(256)}
quad={'origin':[-8,-8,0],'size':[8,8,0],'uv':{'north':{'uv':[0,0],'uv_size':[16,16]}}}
bold=copy.deepcopy(quad);bold['origin']=[-8,-8,-.02]
bones=[{'name':'ink','pivot':[0,0,0]},
 {'name':'glyph','parent':'ink','pivot':[0,0,0],'cubes':[quad]},
 {'name':'bold','parent':'ink','pivot':[0,0,0],'cubes':[bold]}]
code="q.property('kaleidoscope_tavern:char_0')"
controller={'arrays':{'textures':{'Array.pages':[f'Texture.page_{p}' for p in range(256)]},'materials':{'Array.ink':['Material.default','Material.glow']}},
 'geometry':f'Array.cells[math.mod({code}, 256)]','part_visibility':[{'bold':"q.property('kaleidoscope_tavern:bold') == 1"}],
 'materials':[{'*':"Array.ink[q.property('kaleidoscope_tavern:glowing')]"}],
 'textures':[f"Array.pages[math.floor({code} / 256)]"],
 'color':{c:f"q.property('kaleidoscope_tavern:{k}') / 255" for c,k in [('r','red'),('g','green'),('b','blue')]}}
controller['color']['a']=1
controller['arrays']['geometries']={'Array.cells':[f'Geometry.cell_{i}' for i in range(256)]}
geo={'format_version':'1.21.0','minecraft:geometry':[{'description':{'identifier':'geometry.kt_runtime.board_glyph_line','texture_width':256,'texture_height':256,'visible_bounds_width':1,'visible_bounds_height':1,'visible_bounds_offset':[0,0,0]},'bones':bones}]}
models=[]
for i in range(256):
 g=copy.deepcopy(geo['minecraft:geometry'][0]);g['description']['identifier']=f'geometry.kt_runtime.board_glyph_cell_{i}'
 for bone in g['bones']:
  for cube in bone.get('cubes',[]):cube['uv']['north']['uv']=[(i%16)*16,(i//16)*16]
 models.append(g)
geo['minecraft:geometry']=models
write(RP/'models/entity/board_glyph_line.geo.json',geo)
write(RP/'animations/board_glyph_line.animation.json',{'format_version':'1.8.0','animations':{'animation.kt_runtime.board_glyph_line':{'loop':True,'bones':{'ink':{'rotation':["q.property('kaleidoscope_tavern:tilt')",0,0]},'bold':{'position':["-q.property('kaleidoscope_tavern:bold_offset')",0,0]}}}}})
write(RP/'render_controllers/board_glyph_visual.render_controllers.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_runtime.board_glyph':controller}})
p=RP/'entity/board_glyph_visual.entity.json';j=json.loads(p.read_text());d=j['minecraft:client_entity']['description'];d['textures']=textures;d['geometry']={f'cell_{i}':f'geometry.kt_runtime.board_glyph_cell_{i}' for i in range(256)};d['scripts']={'animate':['layout'],'scale':"q.property('kaleidoscope_tavern:font_scale')"};d['render_controllers']=['controller.render.kt_runtime.board_glyph'];write(p,j)
p=BP/'entities/board_glyph_visual.json';j=json.loads(p.read_text());props=j['minecraft:entity']['description']['properties']
for name,typ,rng,default in [('font_scale','float',[.16,.192],.16),('tilt','float',[-22.5,22.5],0),('bold','int',[0,1],0),('bold_offset','float',[.5,1],.5)]:props['kaleidoscope_tavern:'+name]={'type':typ,'range':rng,'default':default,'client_sync':True}
# 31 properties stays within Bedrock's 32-property entity limit.
assert len(props)==32,len(props)
write(p,j)
p=ROOT.parent/'tavern-runtime-overrides.json';entries={x for x in json.loads(p.read_text()) if not (x.startswith('RP/textures/board_font/') and x.endswith('_bold.png'))};entries.update(str(p.relative_to(ROOT/'runtime')) for p in OUT.glob('*.png'));entries.update(['BP/scripts/data/board-font.js','RP/font/NOTICE-Unifont.txt']);write(p,sorted(entries))
print('Java font: bitmap + Unihex, single-face glyphs, exact advance widths, one render pass per glyph, legacy property compatibility.')
