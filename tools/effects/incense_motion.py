"""Discrete Java motion translated to documented particle Molang components.
Particle creation initializes state; per-render advances only missed 20 Hz steps,
not one random walk step per render frame. No gravity on the two custom walkers.
"""
import copy

def walker(effect, *, firefly=False, ambient=False):
    e=effect['particle_effect'];c=e['components']
    for k in ('minecraft:particle_motion_dynamic','minecraft:particle_motion_collision','minecraft:particle_initial_spin'):
        c.pop(k,None)
    for k in list(c):
        if k.startswith('minecraft:emitter_shape_'):del c[k]
    c['minecraft:emitter_shape_point']={'offset':[0,0,0]}
    c['minecraft:particle_initial_speed']=0
    init='variable.kt_tick=0;'
    for axis in 'xyz':
        start='0'
        if ambient:
            start='math.random(-16,16)' if axis!='y' else 'math.random(-0.67,4.66)'
        init+=f'variable.kt_{axis}={start};variable.kt_old{axis}=variable.kt_{axis};'
    if firefly:
        init+='variable.kt_dx=0;variable.kt_dy=0;variable.kt_dz=0;'
        step='variable.kt_dx=variable.kt_dx+(math.random(-0.001,0.001));variable.kt_dz=variable.kt_dz+(math.random(-0.001,0.001));variable.kt_dy=variable.kt_dy+(math.random(-0.00025,0.00025));'
        friction=.96
        c.pop('minecraft:particle_appearance_lighting',None)
        c['minecraft:particle_appearance_billboard']['size']=['0.08+variable.particle_random_3*0.04']*2
        c['minecraft:particle_lifetime_expression']={'max_lifetime':'(60+math.floor(variable.particle_random_1*40))/20'}
        alpha='0.9*(0.6+0.4*math.sin(variable.kt_tick*(0.3+variable.particle_random_4*0.4)*57.29577951308232))*math.clamp((1-variable.kt_tick/(variable.particle_lifetime*20))*5,0,1)'
    else:
        gauss='math.sqrt(-2*math.ln(math.max(0.000000000001,math.random(0,1))))*math.cos(math.random(0,360))*0.01'
        init+=f'variable.kt_dx={gauss};variable.kt_dz={gauss};variable.kt_dy=math.random(0.02,0.03);'
        step='variable.kt_dx=variable.kt_dx+(math.random(-0.0005,0.0005));variable.kt_dz=variable.kt_dz+(math.random(-0.0005,0.0005));'
        friction=.95
        c['minecraft:particle_lifetime_expression']={'max_lifetime':'(40+math.floor(variable.particle_random_1*20))/20'}
        c['minecraft:particle_appearance_billboard']['size']=['0.15+variable.particle_random_3*0.05']*2
        alpha='0.8*math.clamp((1-variable.kt_tick/(variable.particle_lifetime*20))*4,0,1)'
    updates=''.join(f'variable.kt_old{a}=variable.kt_{a};' for a in 'xyz')+step
    updates+=''.join(f'variable.kt_{a}=variable.kt_{a}+(variable.kt_d{a});' for a in 'xyz')
    updates+=f'variable.kt_dx=variable.kt_dx*({friction});variable.kt_dz=variable.kt_dz*({friction});variable.kt_tick=variable.kt_tick+(1);'
    e.setdefault('events',{})['kt_motion_init']={'expression':init}
    c['minecraft:particle_lifetime_events']={'creation_event':'kt_motion_init'}
    c['minecraft:particle_initialization']={'per_render_expression':f'loop(math.max(0,math.min(math.floor(variable.particle_age*20)+1,variable.particle_lifetime*20)-variable.kt_tick), {{{updates}}});'}
    c['minecraft:particle_motion_parametric']={'relative_position':[f'variable.kt_old{a}+(variable.kt_{a}-variable.kt_old{a})*math.mod(variable.particle_age*20,1)' for a in 'xyz']}
    c['minecraft:particle_appearance_tinting']={'color':[1,1,1,alpha]}
    return effect
