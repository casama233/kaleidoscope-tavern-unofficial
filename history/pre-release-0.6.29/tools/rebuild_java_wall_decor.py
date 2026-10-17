#!/usr/bin/env python3
"""Java wall decorations: one local coordinate system, one orientation transform.
Reference: PaintingBlock, ChalkboardBlock, SandwichBoardBlock and their models.
Legacy block IDs/state numbers are kept so existing worlds retain their objects.
"""
import copy,json
from pathlib import Path
R=Path(__file__).resolve().parents[1];RT=R/'runtime';BP=RT/'BP';RP=RT/'RP';NS='kaleidoscope_tavern'
def read(p):return json.loads(p.read_text())
def write(p,j):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
def box(origin,size):return {'origin':origin,'size':size}
def shapes(b):return {'minecraft:collision_box':copy.deepcopy(b),'minecraft:selection_box':copy.deepcopy(b)}
def model(name,cube,w,h):
 ident='geometry.kt_java.'+name
 write(RP/f'models/entity/java_{name}.geo.json',{'format_version':'1.21.0','minecraft:geometry':[{'description':{'identifier':ident,'texture_width':w,'texture_height':h,'visible_bounds_width':2,'visible_bounds_height':2,'visible_bounds_offset':[0,.5,0]},'bones':[{'name':'root','pivot':[0,0,0],'cubes':[cube]}]}]})
 return ident
# Java painting collision and mesh share these exact local boxes.
# No direction-specific world-space boxes are subsequently rotated again.
for p in (BP/'blocks').glob('*_painting.json'):
 j=read(p);b=j['minecraft:block'];perms=[]
 for attach,geometry,bounds in [(0,'geometry.kt_runtime.painting_wall',box([-7,1,7],[14,14,1])),(1,'geometry.kt_assets_a13.painting_base',box([-7,0,-7],[14,1,14])),(2,'geometry.kt_runtime.painting_ceiling',box([-7,15,-7],[14,1,14]))]:
  for facing in range(4):
   # Generated Java ceiling blockstates add 180 degrees to their Y angle.
   yaw=(-90*facing+(180 if attach==2 else 0))%360
   perms.append({'condition':f"q.block_state('{NS}:attach_face') == {attach} && q.block_state('{NS}:facing') == {facing}",'components':{
    'minecraft:geometry':{'identifier':geometry},'minecraft:transformation':{'rotation':[0,yaw,0]},**shapes(bounds)}})
 b['permutations']=perms;write(p,j)
# Split the Java 16x28 or 48x28 board into legal, per-cell meshes. UVs are
# cropped, not rescaled; the border remains continuous across all six cells.
geometries={}
for kind,width,texW in [('small',16,64),('large',48,128)]:
 for segment in range(1 if kind=='small' else 3):
  for half in range(2):
   x0=segment*16;y0=15 if half==0 else 1
   cube={'origin':[-8,2 if half==0 else 0,7],'size':[16,14,1],
    'uv':{'north':{'uv':[1+x0,y0],'uv_size':[16,14]},'south':{'uv':[2+width+(width-16-x0),y0],'uv_size':[16,14]}}}
   # Only outer edges get side/top/bottom pixels; internal seams are hidden.
   if segment==0:cube['uv']['west']={'uv':[0,y0],'uv_size':[1,14]}
   if segment==(0 if kind=='small' else 2):cube['uv']['east']={'uv':[1+width,y0],'uv_size':[1,14]}
   if half==1:cube['uv']['up']={'uv':[1+x0,0],'uv_size':[16,1]}
   if half==0:cube['uv']['down']={'uv':[1+width+x0,0],'uv_size':[16,1]}
   geometries[kind,segment,half]=model(f'chalk_{kind}_{segment}_{half}',cube,texW,64)
p=BP/'blocks/chalkboard.json';j=read(p);b=j['minecraft:block']
b['components'].update({'minecraft:geometry':{'identifier':geometries['small',0,0]},**shapes(box([-8,2,7],[16,14,1]))})
b['permutations']=[]
for position in range(4):
 for half in range(2):
  kind='small' if position==0 else 'large';segment=0 if position==0 else position-1
  b['permutations'].append({'condition':f"q.block_state('{NS}:position') == {position} && q.block_state('{NS}:half') == {half}",'components':{
   'minecraft:geometry':{'identifier':geometries[kind,segment,half]},
   'minecraft:material_instances':{'*':{'texture':'kt_assets_a17_chalkboard_'+kind,'render_method':'alpha_test'}},
   **shapes(box([-8,2 if half==0 else 0,7],[16,14,1]))}})
for face,angle in [('north',0),('east',270),('south',180),('west',90)]:
 b['permutations'].append({'condition':f"q.block_state('minecraft:cardinal_direction') == '{face}'",'components':{'minecraft:transformation':{'rotation':[0,angle,0]}}})
write(p,j)
# Sandwich Java shapes stay axis aligned at all sixteen rotations. Rotate only
# the source mesh bone, never a collision-box-containing block component.
for p in (BP/'blocks').glob('*_sandwich_board.json'):
 style=p.stem.removesuffix('_sandwich_board');j=read(p);b=j['minecraft:block'];source=read(RP/f'models/entity/sandwich_board_{style}_assembled.geo.json')
 b['components'].update(shapes(box([-6,0,-6],[12,16,12])))
 b['components'].pop('minecraft:transformation',None);b['permutations']=[]
 for rot in range(16):
  geo=copy.deepcopy(source);g=geo['minecraft:geometry'][0];identifier=f'geometry.kt_java.sandwich_{style}_{rot}';g['description']['identifier']=identifier
  root=next(bone for bone in g['bones'] if bone['name']=='assembly');root['rotation']=[0,22.5*rot,0]
  write(RP/f'models/entity/java_sandwich_{style}_{rot}.geo.json',geo)
  if rot==0:b['components']['minecraft:geometry']={'identifier':identifier}
  b['permutations'].append({'condition':f"q.block_state('{NS}:half') == 0 && q.block_state('{NS}:rotation') == {rot}",'components':{'minecraft:geometry':{'identifier':identifier}}})
 b['permutations'].append({'condition':f"q.block_state('{NS}:half') == 1",'components':{
  'minecraft:geometry':{'identifier':'geometry.kt_runtime.board_blank'},'minecraft:material_instances':{'*':{'texture':'kt_runtime_board_blank','render_method':'alpha_test'}},**shapes(box([-6,0,-6],[12,6,12]))}})
 write(p,j)
# Every generated/source file is explicitly included by the pinned build.
p=R.parent/'tavern-runtime-overrides.json';entries=set(read(p));entries.update(str(p.relative_to(RT)) for p in (RP/'models/entity').glob('java_*.geo.json'))
for name in ['core/java-placement','core/furniture','core/boards','bedrock/writing-boards','bedrock/board-text','bedrock/decorations']:
 entries.add('BP/scripts/'+name+'.js')
entries.update(['RP/models/entity/board_glyph_line.geo.json','RP/animations/board_glyph_line.animation.json','RP/entity/board_glyph_visual.entity.json','RP/render_controllers/board_glyph_visual.render_controllers.json','BP/entities/board_glyph_visual.json'])
write(p,sorted(entries));print('Rebuilt 14 paintings, small/large chalkboard cells, and all 14 × 16 standing-board orientations.')
