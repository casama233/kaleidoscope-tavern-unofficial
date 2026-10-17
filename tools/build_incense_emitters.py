#!/usr/bin/env python3
"""Sampled client emitters; one Java animateTick emits 0/1 plume and 5 ambient particles.
See docs/REPAIR-0.6.39.md for pinned Java and Bedrock references.
"""
import copy,json,math
from effects.incense_motion import walker
from effects.molang_syntax import validate as validate_molang
from effects.incense_large_motion import suspended,cherry
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RP=ROOT/'runtime/RP/particles'
KINDS=('sakura','pine','ginkgo','spore','catnip','snow','butterfly','firefly')
def write(name,data):
 validate_molang(data,name)
 (RP/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def finite(data,name,rate):
 d=copy.deepcopy(data);e=d['particle_effect'];e['description']['identifier']='kt_assets_a17:'+name;c=e['components']
 for key in list(c):
  if key.startswith(('minecraft:emitter_rate_','minecraft:emitter_lifetime_','minecraft:emitter_shape_')):del c[key]
 c['minecraft:emitter_lifetime_once']={'active_time':0.01}
 c['minecraft:emitter_rate_instant']={'num_particles':'variable.kt_spawn_count'}
 c['minecraft:emitter_local_space']={'position':False,'rotation':False}
 # Face the viewer like Java TextureSheetParticle. rotate_xyz leaves thin
 # cards edge-on from most viewing directions, so increased rates alone fail.
 c['minecraft:particle_appearance_billboard']['facing_camera_mode']='lookat_xyz'
 # Replace obsolete motion before applying the bounded 20 Hz source recurrence.
 c.pop('minecraft:particle_initialization',None);c.pop('minecraft:particle_motion_parametric',None)
 return d,c
for kind in KINDS:
 stem=kind+'_incense';small=json.loads((RP/(stem+'.json')).read_text())
 plume,c=finite(small,stem+'_plume',2)
 c['minecraft:emitter_shape_point']={'offset':[0,0,0],'direction':['math.random(-0.35,0.35)',1,'math.random(-0.35,0.35)']}
 c['minecraft:particle_initial_speed']='0.4 + variable.particle_random_1 * 0.2'
 c['minecraft:particle_lifetime_expression']={'max_lifetime':'(40 + math.floor(variable.particle_random_2 * 20)) / 20'}
 c['minecraft:particle_motion_dynamic']={'linear_acceleration':[0,0,0],'linear_drag_coefficient':0}
 c['minecraft:particle_appearance_billboard']['size']=['0.15 + variable.particle_random_3 * 0.05']*2
 c['minecraft:particle_appearance_tinting']={'color':[1,1,1,'0.8 * math.clamp((1 - variable.particle_age / variable.particle_lifetime) * 4, 0, 1)']}
 walker(plume)
 write(stem+'_plume',plume)
 # Keep the registered base particle consistent as well as the active emitter.
 walker(small);write(stem,small)
 base=RP/(stem+'_large.json');base=json.loads(base.read_text()) if base.exists() else small
 ambient,c=finite(base,stem+'_ambient',19)
 offset,half=(-0.67,5.33) if kind=='firefly' else (-2,16)
 c['minecraft:emitter_shape_box']={'offset':[0,offset+half/2,0],'half_dimensions':[16,half/2,16],'surface_only':False,'direction':[0,-1,0]}
 c['minecraft:particle_initial_speed']=0.16
 c['minecraft:particle_motion_dynamic']={'linear_acceleration':[0,-0.008,0],'linear_drag_coefficient':0}
 c['minecraft:particle_lifetime_expression']={'max_lifetime':'(500 + math.floor(variable.particle_random_1 * 501)) / 20'}
 c['minecraft:particle_appearance_tinting']={'color':[1,1,1,1]}
 if kind in ('catnip','butterfly'):
  # Reuse the particle's fixed random values in each axis; initialization has
  # no creation_expression field. Split random_4 into two uniform fractions.
  vx='(variable.particle_random_1 * 0.8 - 0.4)';vy='(variable.particle_random_2 * 0.8 - 1.2)';vz='(variable.particle_random_3 * 0.8 - 0.4)'
  norm=f'math.sqrt({vx}*{vx} + {vy}*{vy} + {vz}*{vz})'
  speed='((math.floor(variable.particle_random_4 * 256) / 256 + math.mod(variable.particle_random_4 * 256, 1) + 1) * 1.2)'
  c['minecraft:particle_initial_speed']=[f'{vx} / {norm} * {speed}',f'{vy} / {norm} * {speed} + 2',f'{vz} / {norm} * {speed}']
  c['minecraft:particle_motion_dynamic']={'linear_acceleration':[0,-0.16,0],'linear_drag_coefficient':0}
  c['minecraft:emitter_shape_box']['offset'][1]-=0.125
 if kind=='firefly':
  c.pop('minecraft:particle_appearance_lighting',None)
  c['minecraft:emitter_shape_box']['direction']=['math.random(-1,1)','math.random(-0.2,0.2)','math.random(-1,1)']
  c['minecraft:particle_initial_speed']=0.06
  c['minecraft:particle_motion_dynamic']={'linear_acceleration':[0,0,0],'linear_drag_coefficient':0.1}
  c['minecraft:particle_lifetime_expression']={'max_lifetime':'(60 + math.floor(variable.particle_random_1 * 40)) / 20'}
  c['minecraft:particle_appearance_tinting']={'color':[1,1,1,'0.9 * (0.6 + 0.4 * math.sin(variable.particle_age * 20 * (0.3 + variable.particle_random_4 * 0.4) * 57.2957795)) * math.clamp((1 - variable.particle_age / variable.particle_lifetime) * 5, 0, 1)']}
 if kind in ('sakura','pine','ginkgo','snow'):
  # Java explicitly uses native CHERRY_LEAVES, NOT its small incense sprite.
  if kind=='sakura':ambient['particle_effect']['description']['basic_render_parameters']={'material':'particles_alpha','texture':'textures/particle/cherry_petal_atlas'}
  old_uv=c['minecraft:particle_appearance_billboard']['uv']
  c['minecraft:particle_appearance_billboard']={'size':['variable.particle_random_1 > 0.5 ? 0.05 : 0.075']*2,'facing_camera_mode':'lookat_xyz','uv':{'texture_width':12,'texture_height':9,'uv':['math.floor(variable.particle_random_1 * 4) * 3','math.floor(variable.particle_random_2 * 3) * 3'],'uv_size':[3,3]}}
  if kind!='sakura':c['minecraft:particle_appearance_billboard']['uv']=old_uv
  if kind=='ginkgo':c['minecraft:particle_appearance_billboard']['size']=['variable.particle_random_1 > 0.5 ? 0.075 : 0.1125']*2
  c['minecraft:particle_initial_speed']=0
  c['minecraft:particle_initial_spin']={'rotation':'math.random(0,360)','rotation_rate':'math.random(-30,30)'}
  c['minecraft:particle_lifetime_expression']={'max_lifetime':15}
  c['minecraft:particle_motion_dynamic']={'linear_acceleration':['math.cos(variable.particle_random_3 * 60) * 2 * math.pow(math.min(15, variable.particle_age) / 15, 1.25)',-0.3,'math.sin(variable.particle_random_3 * 60) * 2 * math.pow(math.min(15, variable.particle_age) / 15, 1.25)'],'rotation_acceleration':'variable.particle_random_4 > 0.5 ? -5 : 5'}
  c['minecraft:particle_motion_collision']={'collision_drag':10,'collision_radius':0.075,'expire_on_contact':True}
 if kind=='spore':
  # Native spore atlas/tint, rather than a rising small incense puff.
  ambient['particle_effect']['description']['basic_render_parameters']={'material':'particles_alpha','texture':'textures/particle/particles'}
  c['minecraft:particle_appearance_billboard']={'size':[0.15,0.15],'facing_camera_mode':'lookat_xyz','uv':{'texture_width':128,'texture_height':128,'uv':[8,56],'uv_size':[8,8]}}
  c['minecraft:particle_appearance_tinting']={'color':[0.32,0.5,0.22,1]}
 if kind=='firefly':
  walker(ambient,firefly=True,ambient=True)
  walker(base,firefly=True);write(stem+'_large',base)
 if kind in ('catnip','butterfly','spore'):
  suspended(ambient,kind,ambient=True)
  if kind!='spore':suspended(base,kind);write(stem+'_large',base)
 if kind in ('sakura','pine','ginkgo','snow'):
  cherry(ambient,kind,ambient=True)
  if kind!='sakura':cherry(base,kind);write(stem+'_large',base)
 write(stem+'_ambient',ambient)
print('Built 8 source-sampled plumes + 8 source-sampled ambient incense emitters.')
