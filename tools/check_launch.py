#!/usr/bin/env python3
"""Source, native-resource and pure launch-rule checks; no player/world mocks."""
import argparse,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--java-source',type=Path)
    parser.add_argument('--baseline',type=Path)
    args=parser.parse_args()
    ref=read(ROOT/'data/launch-repair-reference.json')
    assert ref['rules']['tipsy']['visualFixAccepted'] is False
    verified=0
    if args.java_source:
        for name,digest in ref['javaSources'].items():
            raw=(args.java_source/name).read_bytes().replace(b'\r\n',b'\n')
            assert hashlib.sha256(raw).hexdigest()==digest,('Java source mismatch',name)
            verified+=1
    for name,row in ref['reviewedChanges'].items():
        assert sha(ROOT/name)==row['after'],('Audited source mutated',name)
        assert row['before']!=row['after'] and row['reason']
        if args.baseline:
            from creative.historical import LegacyMenuProjection
            assert sha(args.baseline/name)==row['before'],('Incorrect before hash',name)
            assert hashlib.sha256(LegacyMenuProjection(args.baseline).read_bytes(args.baseline/name)).hexdigest()==row['beforeProjected'],('Incorrect projected hash',name)
    for name,digest in ref['newRuntimeFiles'].items():assert sha(ROOT/name)==digest,('New runtime file differs',name)
    unchanged=0
    if args.baseline:
        old_names={p.relative_to(args.baseline).as_posix() for p in (args.baseline/'runtime').rglob('*') if p.is_file()}
        new_names={p.relative_to(ROOT).as_posix() for p in (ROOT/'runtime').rglob('*') if p.is_file()}
        assert new_names==old_names|set(ref['newRuntimeFiles']),'Unlisted runtime addition or removal'
        for old in (args.baseline/'runtime').rglob('*'):
            if not old.is_file():continue
            name=old.relative_to(args.baseline).as_posix()
            if name not in ref['reviewedChanges']:
                assert (ROOT/name).read_bytes()==old.read_bytes(),('Unreviewed existing-runtime change',name)
                unchanged+=1
    components=read(ROOT/'runtime/BP/items/molotov.json')['minecraft:item']['components']
    use=components['minecraft:throwable']
    assert components['minecraft:use_animation']=='spear'
    assert use['min_draw_duration']==.5 and use['max_draw_duration']==3600
    assert use['scale_power_by_draw_duration'] is False
    assert use['launch_power_scale']==1 and use['max_launch_power']==1
    assert components['minecraft:use_modifiers']['use_duration']==3600
    assert components['minecraft:projectile']['projectile_entity']=='kaleidoscope_tavern:thrown_molotov'
    definition=read(ROOT/'runtime/BP/entities/thrown_molotov.json')['minecraft:entity']
    c=definition['components'];p=c['minecraft:projectile']
    assert p['anchor']=='eye_height' and p['offset']==[0,-.1,0]
    assert p['power']==.8 and p['gravity']==.03 and p['inertia']==.99 and p['liquid_inertia']==.8
    assert p['uncertainty_base']==1 and p['uncertainty_multiplier']==0
    assert p['shoot_target'] is False and p['angle_offset']==0
    assert 'catch_fire' not in p and p.get('on_hit',{})=={}
    assert 'minecraft:timer' not in c
    assert not any('minecraft:instant_despawn' in x for x in definition.get('component_groups',{}).values())
    projectile=(ROOT/'runtime/BP/scripts/bedrock/storage-projectile.js').read_text()
    assert projectile.count('.shoot(velocity,{uncertainty:0})')==2 and 'runTimeout' not in projectile
    assert 'getAABB()' in projectile and 'splashTicks' in projectile and 'instantHealthDelta' in projectile
    assert projectile.count('rowsPayload(itemId,rng)')==2 # definition and one launch call
    assert 'rowsPayload(itemId,rng)' not in projectile[projectile.index('export function resolveThrownDrinkImpact'):]
    for filename,family in [('holder.js','holder'),('tilted-rack.js','tilted_rack')]:
        text=(ROOT/'runtime/BP/scripts/bedrock'/filename).read_text()
        assert f"return rackLaunch(block.location,block.permutation.getState(FACING)??0,'{family}',rng());" in text
        assert 'onRedstoneUpdate:e=>routeStatefulStorageRedstone' in text
    router=(ROOT/'runtime/BP/scripts/bedrock/stateful-storage-router.js').read_text()
    assert 'event?.firstUpdate===true' in router and 'now<=0||previous>0' in router
    assert "if(bottle.base==='empty_bottle')return {status:'NON_DRINK'" in router
    assert "if(bottle.base!=='molotov')try{block.dimension.playSound" in router
    assert router.index('projectile=spawn(')<router.index('store.save(key,next,state.revision)')
    assert 'projectile?.remove()' in router and 'store.restore(key,raw)' in router
    impact=(ROOT/'runtime/BP/scripts/bedrock/molotov.js').read_text()
    taps=(ROOT/'runtime/BP/scripts/bedrock/tap-sources.js').read_text()
    main=(ROOT/'runtime/BP/scripts/main.js').read_text()
    assert 'projectileHitBlock' not in taps and 'projectileHitEntity' not in taps
    assert impact.count('.subscribe(resolveMolotovImpact)')==2
    assert 'entity.setDynamicProperty(RESOLVED,true)' in impact
    assert 'igniteMolotov(entity.dimension,{...entity.location})' in impact
    assert "['minecraft:basic_flame_particle',30]" in impact and "['minecraft:basic_smoke_particle',20]" in impact
    assert 'spawnEntity(' not in impact and 'setItem(' not in impact and 'applyImpulse(' not in impact
    assert 'installMolotovEvents();' in main
    tipsy=(ROOT/'runtime/BP/scripts/bedrock/tipsy-visual.js').read_text()
    assert 'track.failed' not in tipsy and 'track.retryAt=now+' in tipsy
    assert 'exactJavaRoll:false' in tipsy and 'clientConfirmed:false' in tipsy
    assert 'serverReadbackIsNotCameraProof:true' in tipsy
    assert 'setRotation(step.rotation)' in tipsy # existing yaw adapter only; NOT acceptance
    for forbidden in ('.teleport(','.setCamera(','.addShake(','.stopShaking(','Math.random(','.addEffect('):
        assert forbidden not in tipsy,('Unreviewed Tipsy substitute',forbidden)
    assert not (ROOT/'runtime/RP/entity/player.entity.json').exists()
    for file in ['kt_tipsy_diagnose','kt_molotov_diagnose']:
        text=(ROOT/'runtime/BP/functions'/f'{file}.mcfunction').read_text()
        assert 'scriptevent ' in text and all(not line.startswith(('give ','effect ','camera ','tp ')) for line in text.splitlines())
    pure=json.loads(subprocess.check_output(['node','tools/check_launch_rules.mjs'],cwd=ROOT,text=True))
    version=read(ROOT/'release.json')['version']
    report={'version':version,'baseline':ref['baselineCommit'],'javaSourceFilesVerified':verified,
        'reviewedChanges':sorted(ref['reviewedChanges']),'unchangedExistingRuntimeFiles':unchanged if args.baseline else None,
        'pureRules':pure,'nativeMolotovResources':'source/schema aligned; device acceptance pending',
        'tipsyCameraOnlyRoll':'NOT_RESTORED','tipsyChanges':'diagnostics, immediate status hook and bounded transient-error retry only',
        'bdsTest':'NOT_RUN','clientTest':'NOT_RUN','simulatedPlayerTests':False,'limits':ref['limits']}
    (ROOT/f'docs/LAUNCH-VALIDATION-{version}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
