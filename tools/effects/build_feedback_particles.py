#!/usr/bin/env python3
"""Generate the source-counted feedback particles. No global vanilla overrides.

The 20 Hz free-flight recurrences are explicit; this does NOT certify collision,
fluid intersection, camera-dependent alpha or light-map parity. See the audit.
Build normally offline; --reference refreshes the tiny sprite atlas from the
hash-verified, development-only 1.20.1 reference produced by collect_reference.py.
"""
import argparse,copy,hashlib,json,math
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];RP=ROOT/'runtime/RP';OUT=RP/'particles'
ATLAS='textures/kaleidoscope_tavern/particle/java_feedback'
GROUPS={
 'wax':['glow'], 'bubble_pop':[f'bubble_pop_{i}' for i in range(5)],
 'spell':[f'effect_{i}' for i in range(7,-1,-1)],
 'cloud':[f'generic_{i}' for i in range(7,-1,-1)],
 'endrod':[f'glitter_{i}' for i in range(7,-1,-1)],
 'rain':[f'splash_{i}' for i in range(4)],
 'drip':['drip_hang','drip_fall','drip_land','flame'],
 'sonic':[f'sonic_boom_{i}' for i in range(16)],
 'cherry':[f'cherry_{i}' for i in range(12)],
}
BASESIZE='(0.1+math.random(0,0.1))'
PACK={a:f'(variable.kt_v{a} ?? 0)/20' for a in 'xyz'}

def save(name,data):
 (OUT/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def uv(group,frame=None):
 names=GROUPS[group];row=list(GROUPS).index(group);size=16 if group=='bubble_pop' else 32 if group=='sonic' else 8
 if frame is None:frame=f'math.min({len(names)-1},math.floor(variable.kt_age*{len(names)-1}/variable.kt_life))'
 return {'texture_width':512,'texture_height':512,'uv':[f'({frame})*32',row*32],'uv_size':[size,size]}

def particle(name,group,life,size=BASESIZE,color=None,frame=None,lit=True):
 c={'minecraft:emitter_lifetime_once':{'active_time':0.01},'minecraft:emitter_rate_instant':{'num_particles':1},'minecraft:emitter_shape_point':{'offset':[0,0,0]},'minecraft:emitter_local_space':{'position':False,'rotation':False},'minecraft:particle_initial_speed':0,
 'minecraft:particle_lifetime_expression':{'max_lifetime':'variable.kt_life/20'},
 'minecraft:particle_appearance_billboard':{'size':['variable.kt_size']*2,'facing_camera_mode':'lookat_xyz','uv':uv(group,frame)},
 'minecraft:particle_appearance_tinting':{'color':color or [1,1,1,1]}}
 if lit:c['minecraft:particle_appearance_lighting']={}
 e={'description':{'identifier':'kaleidoscope_tavern:fx_'+name,'basic_render_parameters':{'material':'particles_alpha','texture':ATLAS}},'components':c,'events':{}}
 e['_init']=f'variable.kt_life={life};variable.kt_size={size};'
 return {'format_version':'1.10.0','particle_effect':e}

def super_velocity(inputs=None):
 inputs=inputs or {a:'0' for a in 'xyz'}
 text=''.join(f'variable.kt_d{a}=({inputs[a]})+math.random(-0.4,0.4);' for a in 'xyz')
 text+='variable.kt_scale=(math.random(0,1)+math.random(0,1)+1)*0.06/math.max(0.000000000001,math.sqrt(variable.kt_dx*variable.kt_dx+variable.kt_dy*variable.kt_dy+variable.kt_dz*variable.kt_dz));'
 text+=''.join(f'variable.kt_d{a}*=variable.kt_scale;' for a in 'xyz')
 return text+'variable.kt_dy+=0.1;'

def motion(p,initial=None,gravity=0,friction=.98,position=None,extra_init='',step_extra='',collision=False):
 e=p['particle_effect'];c=e['components'];c['minecraft:emitter_initialization']={'creation_expression':e.pop('_init','')}
 init='variable.kt_tick=0;variable.kt_age=0;'
 position=position or {a:'0' for a in 'xyz'}
 init+=''.join(f'variable.kt_{a}={position[a]};variable.kt_old{a}=variable.kt_{a};' for a in 'xyz')
 init+=initial or ''.join(f'variable.kt_d{a}={PACK[a]};' for a in 'xyz')
 init+=extra_init
 step=''.join(f'variable.kt_old{a}=variable.kt_{a};' for a in 'xyz')
 step+=f'variable.kt_dy-={gravity};'+step_extra
 step+=''.join(f'variable.kt_{a}+=variable.kt_d{a};variable.kt_d{a}*={friction};' for a in 'xyz')+'variable.kt_tick+=1;'
 e['events']['kt_init']={'expression':init}
 c['minecraft:particle_lifetime_events']={'creation_event':'kt_init'}
 c['minecraft:particle_initialization']={'per_render_expression':f'variable.kt_age=math.floor(variable.particle_age*20);loop(math.max(0,math.min(variable.kt_age+1,variable.kt_life)-variable.kt_tick), {{{step}}});'}
 c['minecraft:particle_motion_parametric']={'relative_position':[f'variable.kt_old{a}+(variable.kt_{a}-variable.kt_old{a})*math.mod(variable.particle_age*20,1)' for a in 'xyz']}
 if collision:
  # Bedrock terrain collision is not Java's AABB/onGround/fluid algorithm.
  c['minecraft:particle_motion_collision']={'enabled':True,'collision_radius':.01,'coefficient_of_restitution':0,'expire_on_contact':True}
 return p

def atlas(reference):
 src=reference/'assets/minecraft/textures/particle';im=Image.new('RGBA',(512,512));rows=[]
 for row,(group,names) in enumerate(GROUPS.items()):
  for col,name in enumerate(names):
   path=src/(name+'.png');frame=Image.open(path).convert('RGBA');im.paste(frame,(col*32,row*32))
   rows.append({'source':'assets/minecraft/textures/particle/'+name+'.png','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'destination':[col*32,row*32,*frame.size]})
 out=RP/(ATLAS+'.png');out.parent.mkdir(parents=True,exist_ok=True);im.save(out)
 (ROOT/'tools/effects/feedback-atlas-sources.json').write_text(json.dumps({'source_version':'1.20.1','atlas':ATLAS+'.png','assets':rows},indent=2)+'\n')

def build():
 # GlowParticle.WaxOn/OffProvider overrides the randomized superclass velocity.
 for name,col in [('wax_on',[.91,.55,.08,1]),('wax_off',[1,.9,1,1])]:
  p=particle(name,'wax','10+math.floor(math.random(0,30))',BASESIZE+'*0.75',col)
  init=''.join(f'variable.kt_d{a}=({PACK[a]})*{.01 if a=="y" else .005};' for a in 'xyz')
  save('fx_'+name,motion(p,init,friction=.96))
 p=particle('bubble_pop','bubble_pop','4')
 save('fx_bubble_pop',motion(p,gravity=.008,friction=1))
 p=particle('spell','spell','math.floor(8/(math.random(0,1)*0.8+0.2))',BASESIZE+'*0.75')
 init=super_velocity({'x':'0.5-math.random(0,1)','y':PACK['y'],'z':'0.5-math.random(0,1)'})+'variable.kt_dy*=0.2;'
 init+='variable.kt_slow=((variable.kt_vx ?? 0)==0 && (variable.kt_vz ?? 0)==0)?0.1:1;variable.kt_dx*=variable.kt_slow;variable.kt_dz*=variable.kt_slow;'
 save('fx_spell',motion(p,init,gravity=-.004,friction=.96))
 p=particle('cloud','cloud','math.max(1,math.floor(math.floor(8/(math.random(0,1)*0.8+0.3))*2.5))',BASESIZE+'*1.875',['variable.kt_gray']*3+[1])
 c=p['particle_effect']['components'];c['minecraft:particle_appearance_billboard']['size']=['variable.kt_size*math.clamp(variable.particle_age*20/variable.kt_life*32,0,1)']*2
 init=super_velocity()+''.join(f'variable.kt_d{a}=variable.kt_d{a}*0.1+({PACK[a]});' for a in 'xyz')
 save('fx_cloud',motion(p,init,gravity=0,friction=.96,extra_init='variable.kt_gray=1-math.random(0,0.3);'))
 target=[(15916745>>b&255)/255 for b in (16,8,0)]
 colors=[f'1+({v}-1)*(1-math.pow(0.8,math.max(0,variable.kt_age-math.floor(variable.kt_life/2))))' for v in target]
 colors+=['1-math.max(0,variable.kt_age-math.floor(variable.kt_life/2))/variable.kt_life']
 p=particle('endrod','endrod','60+math.floor(math.random(0,12))',BASESIZE+'*0.75',colors,lit=False)
 save('fx_endrod',motion(p,gravity=.0005,friction=.91))
 p=particle('rain','rain','math.floor(8/(math.random(0,1)*0.8+0.2))',frame='variable.kt_frame')
 init=super_velocity()+'variable.kt_dx*=0.3;variable.kt_dz*=0.3;variable.kt_dy=math.random(0.1,0.3);'
 save('fx_rain',motion(p,init,gravity=.06,friction=.98,extra_init='variable.kt_frame=math.floor(math.random(0,4));',collision=True))
 p=particle('flame','drip','math.floor(8/(math.random(0,1)*0.8+0.2))+4',frame='3')
 p['particle_effect']['components']['minecraft:particle_appearance_billboard']['size']=['variable.kt_size*(1-0.5*math.pow(variable.particle_age*20/variable.kt_life,2))']*2
 init=super_velocity(PACK)+''.join(f'variable.kt_d{a}=variable.kt_d{a}*0.01+({PACK[a]});' for a in 'xyz')
 save('fx_flame',motion(p,init,gravity=0,friction=.96,position={a:'(math.random(0,1)-math.random(0,1))*0.05' for a in 'xyz'}))
 p=particle('smoke','cloud','math.max(1,math.floor(8/(math.random(0,1)*0.8+0.2)))',BASESIZE+'*0.75',['variable.kt_gray']*3+[1])
 p['particle_effect']['components']['minecraft:particle_appearance_billboard']['size']=['variable.kt_size*math.clamp(variable.particle_age*20/variable.kt_life*32,0,1)']*2
 init=super_velocity()+''.join(f'variable.kt_d{a}=variable.kt_d{a}*0.1+({PACK[a]});' for a in 'xyz')
 save('fx_smoke',motion(p,init,gravity=-.004,friction=.96,extra_init='variable.kt_gray=math.random(0,0.3);',collision=True))
 p=particle('sonic','sonic','16','1.5',['variable.kt_gray']*3+[1],lit=False)
 save('fx_sonic',motion(p,'variable.kt_dx=0;variable.kt_dy=0;variable.kt_dz=0;',gravity=0,friction=1,extra_init='variable.kt_gray=math.random(0.4,1);'))
 # Item fragments use the real input sprite, not one burst of generic dust.
 for oldpath in sorted(OUT.glob('pressed_*.json')):
  name=oldpath.stem;old=json.loads(oldpath.read_text());p=particle(name,'wax','math.floor(4/(math.random(0,1)*0.9+0.1))',BASESIZE+'*0.5')
  e=p['particle_effect'];e['description']['basic_render_parameters']=old['particle_effect']['description']['basic_render_parameters']
  e['components']['minecraft:particle_appearance_billboard']['uv']={'texture_width':16,'texture_height':16,'uv':['variable.kt_u','variable.kt_v'],'uv_size':[4,4]}
  init=super_velocity()+''.join(f'variable.kt_d{a}=variable.kt_d{a}*0.1+({PACK[a]});' for a in 'xyz')
  save('fx_'+name,motion(p,init,gravity=.04,friction=.98,extra_init='variable.kt_u=math.random(0,12);variable.kt_v=math.random(0,12);',collision=True))
 # TapDripParticle preMoveUpdate invokes the child even on the terminal call.
 offsets=[];y=0.;dy=0.
 for n in range(19):
  offsets.append(y)
  if n<18:dy-=.0012;y+=dy;dy*=.02*.98
 (ROOT/'tools/effects/tap-drip-reference.json').write_text(json.dumps({'lifetime':18,'preMoveChildCount':19,'gravityPerTick':.0012,'postMoveRetention':.0196,'childOffsetsY':offsets},indent=2)+'\n')
 for fluid,color in [('water',[.2,.3,1,1]),('lava',[1,1,1,1])]:
  stem=fluid+'_tap_drip';p=particle(stem,'drip','18',color=color,frame='0');motion(p,'variable.kt_dx=0;variable.kt_dy=0;variable.kt_dz=0;',gravity=.0012,friction=.0196)
  e=p['particle_effect'];e['description']['identifier']='kt_assets_a17:'+stem;c=e['components']
  c['minecraft:emitter_lifetime_once']['active_time']=.96
  c['minecraft:particle_lifetime_expression']['max_lifetime']=.95
  c['minecraft:particle_motion_parametric']['relative_position']=[f'variable.particle_age*20>=18?variable.kt_{a}:(variable.kt_old{a}+(variable.kt_{a}-variable.kt_old{a})*math.mod(variable.particle_age*20,1))' for a in 'xyz']
  c['minecraft:emitter_lifetime_events']={'timeline':{f'{(i+1)/20:.2f}':f'drip_{i:02}' for i in range(19)}}
  for i,offset in enumerate(offsets):e['events'][f'drip_{i:02}']={'particle_effect':{'effect':'kt_assets_a17:'+stem+'_child','type':'emitter','pre_effect_expression':f'variable.kt_origin_y={offset:.17g};'}}
  save(stem,p)
  p=particle(stem+'_child','drip','math.floor(64/(math.random(0,1)*0.8+0.2))',color=color if fluid=='water' else [1,.2857143,.083333336,1],frame='1')
  motion(p,'variable.kt_dx=0;variable.kt_dy=0;variable.kt_dz=0;',gravity=.06,friction=.98,position={'x':'0','y':'variable.kt_origin_y ?? 0','z':'0'},collision=True)
  p['particle_effect']['description']['identifier']='kt_assets_a17:'+stem+'_child';save(stem+'_child',p)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--reference',type=Path);args=parser.parse_args()
 if args.reference:atlas(args.reference)
 build();print('Built feedback, fragment and tap resources; native rendering is not certified.')
