#!/usr/bin/env python3
"""0.6.39 structural regression audit, without any engine or player emulation."""
import hashlib,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
baseline=read(ROOT/'docs/REPAIR-BASELINE-0.6.39.json')
from reviewed_changes import historical_digest
for name,expected in baseline['unchangedSha256'].items():
 # Explicit, exact-hash reviewed changes retain the original immutable baseline.
 assert historical_digest(ROOT/name)==expected,('Unexpected change to preserved file',name)
animations=read(ROOT/'runtime/RP/animations/runtime_shaker.animation.json')['animations']
# The player arm was explicitly repaired in 0.6.58; verify its perspective
# behavior with the pose matrix, while retaining all other baseline checks.
from check_shaker_first_person import check as check_shaker_first_person
check_shaker_first_person(ROOT)
for name,expected in baseline['unchangedShakerAnimations'].items():
    if name not in {'animation.kt_mixology.player_shake','animation.kt_mixology.hold_first','animation.kt_mixology.hold_third','animation.kt_mixology.shake_first'}:
        assert animations[name]==expected,('First-person/shared animation changed',name)
third=animations['animation.kt_mixology.hold_third']['bones']['grip']
from shaker_held_frames import expected
assert third==expected()['animation.kt_mixology.hold_third']['bones']['grip']
identifiers=set()
for p in (ROOT/'runtime/RP/particles').glob('*.json'):
 ident=read(p)['particle_effect']['description']['identifier'];assert ident not in identifiers,(p,'Duplicate particle ID');identifiers.add(ident)
# The 2026-09-28 source repair replaces one-second steady emitters with exact
# per-sample bursts. Keep the prior immutable fingerprints above; validate the
# new bounded source contract rather than disabling this historical gate.
for kind in ('sakura','pine','ginkgo','spore','catnip','snow','butterfly','firefly'):
 for layer in ('plume','ambient'):
  p=ROOT/f'runtime/RP/particles/{kind}_incense_{layer}.json';effect=read(p)['particle_effect'];c=effect['components']
  assert effect['description']['identifier']==f'kt_assets_a17:{kind}_incense_{layer}'
  assert c['minecraft:emitter_lifetime_once']['active_time']==0.01
  assert c['minecraft:particle_appearance_billboard']['facing_camera_mode']=='lookat_xyz'
  assert 'minecraft:emitter_lifetime_looping' not in c and 'minecraft:emitter_rate_steady' not in c
  assert c['minecraft:emitter_rate_instant']=={'num_particles':'variable.kt_spawn_count'}
  assert c['minecraft:emitter_shape_point']['offset']==[0,0,0]
  assert c['minecraft:particle_lifetime_events']['creation_event']=='kt_motion_init'
  motion=c['minecraft:particle_initialization']['per_render_expression']
  init=effect['events']['kt_motion_init']['expression']
  assert 'variable.particle_age*20' in motion and 'variable.kt_tick=variable.kt_tick+(1)' in motion
  assert 'math.min(' in motion and 'variable.kt_tick=0;' in init
  assert 'minecraft:particle_motion_parametric' in c
  texture=effect['description']['basic_render_parameters']['texture']
  assert (ROOT/'runtime/RP'/(texture+'.png')).exists(),texture
  if layer=='plume':
   assert 'variable.kt_dx=variable.kt_dx*(0.95)' in motion and 'variable.kt_dz=variable.kt_dz*(0.95)' in motion
   assert c['minecraft:particle_lifetime_expression']['max_lifetime']=='(40+math.floor(variable.particle_random_1*20))/20'
  else:
   assert 'math.random(-16,16)' in init
   if kind=='firefly':
    assert 'minecraft:particle_appearance_lighting' not in c
    assert 'math.random(-0.67,4.66)' in init
    assert 'variable.kt_dx=variable.kt_dx*(0.96)' in motion and 'variable.kt_dz=variable.kt_dz*(0.96)' in motion
   elif kind in ('sakura','pine','ginkgo','snow'):
    assert 'math.random(-2,14)' in init
    assert c['minecraft:particle_lifetime_expression']['max_lifetime']=='(300)/20'
    assert 'variable.kt_dy=variable.kt_dy-(0.00075)' in motion
    assert c['minecraft:particle_motion_collision']['expire_on_contact']
  block=read(ROOT/f'runtime/BP/blocks/{kind}_incense.json')['minecraft:block']
  assert block['components']['minecraft:tick']['interval_range']==[20,20]
source=(ROOT/'runtime/BP/scripts/bedrock/decorations.js').read_text()
assert "emit('plume',1)" in source and "emit('ambient',5)" in source
assert 'Math.floor(Math.random()*3)===0' in source
assert 'registerJavaAmbient(block,emitIncenseSample)' in source
# The registered cup retains native empty-hand use and absence-only repair.
# T132's shared adapter additionally accepts station ingredients and suppresses
# post-consumption echoes; the cup's own block handler still refuses held use.
source=(ROOT/'runtime/BP/scripts/bedrock/mixology.js').read_text()
assert "cupStore.raw(key)===undefined" in source
assert "cupBlock(saved.item)===block.typeId" in source
components=source.split('export function registerMixologyComponents(',1)[1].split('export function beforeShakerUse(',1)[0]
assert "cocktail_cup',{\n  onPlayerInteract:nativeMixologyBlockUse" in components
assert "shaker_station',{onPlayerInteract:nativeMixologyBlockUse}" in components
native_use=source.split('function nativeMixologyBlockUse(event){',1)[1].split('\n}',1)[0]
assert 'if(event?.cancel||!player||!block)return false;' in native_use
assert 'if(current===undefined)return false;' in native_use
assert native_use.index('if(completedMixologyEcho(player,block,current))return false;') < native_use.index('return nativeBlockUse(event);')
block_use=source.split('registerJavaBlockUseHandler(event=>{',1)[1].split('registerJavaOffhandUseOnHandler(',1)[0]
assert 'if(javaSecondaryBypass(event.player,held))return;' in block_use
assert 'if(block.typeId!==STATION&&held)return;' in block_use
assert 'if(id!==STATION)return takeCup(event.player,current);' in block_use
assert "locks.with([key,player.id]" in source
assert "id:'mixology-v22',guard:safely" in source
assert not (ROOT/'runtime/RP/entity/player.entity.json').exists()
version=read(ROOT/'release.json')['version']
report={'version':version,'baselineCommit':baseline['upstreamCommit'],'preservedFileHashes':len(baseline['unchangedSha256']),
'preservedAnimations':list(baseline['unchangedShakerAnimations']),'thirdPersonCandidate':third,
'finiteParticleEmitters':16,'nativeRegistrationTickInterval':20,'ambientSamplingTickInterval':1,'emissionMode':'recipient-local source-sampled bursts','plumeParticlesPerSecondMaximumMean':20*667*(1/4096+1/32768)/3,'ambientParticlesPerSecondMaximumMean':20*667*(1/4096+1/32768)*5,
'cupAbsentRecordRecovery':'structural checks passed; real event execution not tested',
'newPlayerEntityOverride':False,'playerSimulation':False,'bdsTest':'NOT_RUN','clientVisualTest':'NOT_RUN'}
(ROOT/f'docs/REPAIR-STATIC-{version}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
