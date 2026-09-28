"""Source-constructor free-flight models; collision/light-map parity needs a client.
References: original custom particle classes and Mojang 1.20.1 CherryParticle,
SuspendedParticle.SporeBlossomAirProvider. No unsupported initialization fields.
"""
from .build_feedback_particles import super_velocity,ATLAS

def _base(effect,ambient,life,size):
 e=effect['particle_effect'];c=e['components']
 for k in list(c):
  if k.startswith('minecraft:emitter_shape_') or k in ('minecraft:particle_motion_dynamic','minecraft:particle_initial_spin','minecraft:particle_motion_collision','minecraft:particle_motion_parametric','minecraft:particle_initialization','minecraft:emitter_initialization'):del c[k]
 c['minecraft:emitter_shape_point']={'offset':[0,0,0]}
 c['minecraft:emitter_local_space']={'position':False,'rotation':False};c['minecraft:particle_initial_speed']=0
 c['minecraft:particle_lifetime_expression']={'max_lifetime':f'({life})/20'}
 c['minecraft:particle_appearance_billboard']['size']=[size]*2
 c['minecraft:particle_appearance_billboard']['facing_camera_mode']='lookat_xyz'
 c['minecraft:particle_appearance_lighting']={}
 init=f'variable.kt_tick=0;variable.kt_life={life};'
 for a in 'xyz':
  start=('math.random(-2,14)' if a=='y' else 'math.random(-16,16)') if ambient else '0'
  init+=f'variable.kt_{a}={start};variable.kt_old{a}=variable.kt_{a};'
 return e,c,init

def _finish(e,c,init,step,rotate=False):
 old=''.join(f'variable.kt_old{a}=variable.kt_{a};' for a in 'xyz')
 if rotate:old+='variable.kt_oldroll=variable.kt_roll;'
 update=old+step+'variable.kt_tick+=1;'
 e.setdefault('events',{})['kt_motion_init']={'expression':init}
 c['minecraft:particle_lifetime_events']={'creation_event':'kt_motion_init'}
 c['minecraft:particle_initialization']={'per_render_expression':f'loop(math.max(0,math.min(math.floor(variable.particle_age*20)+1,variable.kt_life)-variable.kt_tick), {{{update}}});'}
 c['minecraft:particle_motion_parametric']={'relative_position':[f'variable.kt_old{a}+(variable.kt_{a}-variable.kt_old{a})*math.mod(variable.particle_age*20,1)' for a in 'xyz']}
 if rotate:c['minecraft:particle_motion_parametric']['rotation']='variable.kt_oldroll+(variable.kt_roll-variable.kt_oldroll)*math.mod(variable.particle_age*20,1)'

def suspended(effect,kind,ambient=False):
 e,c,init=_base(effect,ambient,'500+math.floor(variable.particle_random_1*501)','(0.1+variable.particle_random_2*0.1)*(0.6+variable.particle_random_3*0.6)')
 init+='variable.kt_y-=0.125;variable.kt_oldy=variable.kt_y;'+super_velocity({'x':'0','y':'-0.8','z':'0'})
 step='variable.kt_dy-=0.0004;'+''.join(f'variable.kt_{a}+=variable.kt_d{a};' for a in 'xyz')
 c['minecraft:particle_appearance_tinting']={'color':[.32,.5,.22,1] if kind=='spore' else [1,1,1,1]}
 if kind=='spore':
  e['description']['basic_render_parameters']={'material':'particles_alpha','texture':ATLAS}
  c['minecraft:particle_appearance_billboard']['uv']={'texture_width':512,'texture_height':512,'uv':[32,192],'uv_size':[8,8]}
 elif kind=='butterfly':
  c['minecraft:particle_appearance_billboard']['uv']={'texture_width':7,'texture_height':21,'uv':[0,'math.mod(math.floor(variable.particle_age*4),3)*7'],'uv_size':[7,7]}
 _finish(e,c,init,step)
 return effect

def cherry(effect,kind,ambient=False):
 scale=1.5 if kind=='ginkgo' else 1
 e,c,init=_base(effect,ambient,'300',f'(variable.particle_random_2<0.5?0.05:0.075)*{scale}')
 init+='variable.kt_dx=0;variable.kt_dy=0;variable.kt_dz=0;variable.kt_roll=0;variable.kt_oldroll=0;variable.kt_angle=math.random(0,60);variable.kt_rs=math.random(0,1)<0.5?-30:30;variable.kt_ra=math.random(0,1)<0.5?-5:5;'
 uv=c['minecraft:particle_appearance_billboard']['uv']
 if kind=='sakura':
  e['description']['basic_render_parameters']={'material':'particles_alpha','texture':ATLAS};frames=12
  uv={'texture_width':512,'texture_height':512,'uv':['variable.kt_frame*32',256],'uv_size':[8,8]}
 else:
  # Existing derived atlases preserve each original sprite at native resolution.
  frames=int(uv['texture_height']/uv['uv_size'][1]);uv['uv']=[0,f'variable.kt_frame*{uv["uv_size"][1]}']
 init+=f'variable.kt_frame=math.floor(math.floor(math.random(0,12))*{frames-1}/12);'
 c['minecraft:particle_appearance_billboard']['uv']=uv
 c['minecraft:particle_appearance_tinting']={'color':[1,1,1,1]}
 step='variable.kt_wind=0.005*math.pow(math.min((variable.kt_tick+1)/300,1),1.25);variable.kt_dx+=math.cos(variable.kt_angle)*variable.kt_wind;variable.kt_dz+=math.sin(variable.kt_angle)*variable.kt_wind;variable.kt_dy-=0.00075;variable.kt_rs+=variable.kt_ra/20;variable.kt_roll+=variable.kt_rs/20;'
 step+=''.join(f'variable.kt_{a}+=variable.kt_d{a};' for a in 'xyz')
 _finish(e,c,init,step,True)
 # Terrain contact is an explicit approximation, not Java's exact AABB response.
 c['minecraft:particle_motion_collision']={'enabled':True,'collision_radius':.075*scale,'expire_on_contact':True}
 return effect
