#!/usr/bin/env python3
"""0.6.39 structural regression audit, without any engine or player emulation."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
baseline=read(ROOT/'docs/REPAIR-BASELINE-0.6.39.json')
for name,expected in baseline['unchangedSha256'].items():
 assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,('Unexpected change to preserved file',name)
animations=read(ROOT/'runtime/RP/animations/runtime_shaker.animation.json')['animations']
for name,expected in baseline['unchangedShakerAnimations'].items():assert animations[name]==expected,('First-person/shared animation changed',name)
third=animations['animation.kt_mixology.hold_third']['bones']['grip']
assert third=={'position':[0,-0.25,-1],'rotation':[90,0,0],'scale':0.5}
identifiers=set()
for p in (ROOT/'runtime/RP/particles').glob('*.json'):
 ident=read(p)['particle_effect']['description']['identifier'];assert ident not in identifiers,(p,'Duplicate particle ID');identifiers.add(ident)
for kind in ('sakura','pine','ginkgo','spore','catnip','snow','butterfly','firefly'):
 for layer,rate in [('plume',2),('ambient',20)]:
  p=ROOT/f'runtime/RP/particles/{kind}_incense_{layer}.json';effect=read(p)['particle_effect'];c=effect['components']
  assert effect['description']['identifier']==f'kt_assets_a17:{kind}_incense_{layer}'
  assert c['minecraft:emitter_lifetime_once']['active_time']==1
  assert 'minecraft:emitter_lifetime_looping' not in c and 'minecraft:emitter_rate_instant' not in c
  assert c['minecraft:emitter_rate_steady']=={'spawn_rate':rate,'max_particles':rate+2}
  texture=effect['description']['basic_render_parameters']['texture']
  assert texture in ('textures/particle/cherry_petal_atlas','textures/particle/particles') or (ROOT/'runtime/RP'/(texture+'.png')).exists(),texture
  if layer=='ambient':
   shape=c['minecraft:emitter_shape_box'];assert shape['half_dimensions'][0]==shape['half_dimensions'][2]==16
   if kind=='firefly':
    assert 'minecraft:particle_appearance_lighting' not in c
    assert shape['half_dimensions'][1]==5.33/2
   else:assert shape['half_dimensions'][1]==8
  block=read(ROOT/f'runtime/BP/blocks/{kind}_incense.json')['minecraft:block']
  assert block['components']['minecraft:tick']['interval_range']==[20,20]
# The registered component must retain native empty-hand callbacks and absence-only repair.
source=(ROOT/'runtime/BP/scripts/bedrock/mixology.js').read_text()
assert "cupStore.raw(key)===undefined" in source
assert "cupBlock(saved.item)===block.typeId" in source
assert "cocktail_cup',{\n  onPlayerInteract:nativeEmptyHandBlockUse" in source
assert "locks.with([key,player.id]" in source
assert "id:'mixology-v22',guard:safely" in source
assert not (ROOT/'runtime/RP/entity/player.entity.json').exists()
report={'version':'0.6.39','baselineCommit':baseline['upstreamCommit'],'preservedFileHashes':len(baseline['unchangedSha256']),
'preservedAnimations':list(baseline['unchangedShakerAnimations']),'thirdPersonCandidate':third,
'finiteParticleEmitters':16,'scriptTickInterval':20,'plumeParticlesPerSecond':2,'ambientParticlesPerSecond':20,
'cupAbsentRecordRecovery':'structural checks passed; real event execution not tested',
'newPlayerEntityOverride':False,'playerSimulation':False,'bdsTest':'NOT_RUN','clientVisualTest':'NOT_RUN'}
(ROOT/'docs/REPAIR-STATIC-0.6.39.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
