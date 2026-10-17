"""Exact P40 -> P41 freezer scheduling repair; source CI is not native/client QA."""
import copy
import hashlib
import json
import re
from pathlib import Path
from family_update import common as c
from family_update.cookery_cache_validation import tree

LOGICAL='local/senluo-amw-cuisine'
REPOSITORY='casama233/senluo-family-integration-private'
REPOSITORY_ID=1406868911
PREVIOUS='963833faedee0a42830bf006a0da493de8327157'
OLD,VERSION,LOCAL=[1,0,40],[1,0,41],[1,0,10441]
HELPER='scripts/compat/native-freezer-storage.js'
TARGET='scripts/_senluo/native-freezer-storage.js'
FREEZER='host-extensions/chinesefood-freezer-storage.json'
RENDERER='host-extensions/chinesefood-doll-renderer.json'
HELPER_BEFORE='60a5f429ea10ab6ab831a43700ceb536b995cf7dd7f4c8e02f80069fda85ef3e'
HELPER_AFTER='7d9330b7746d92fea892f8603aa7684319d01fa7af9d1ab331bbf29cca1043f5'
STARTUP='[Senluo native freezer 1.0.1] storage registered'
ARCHIVE='63bd2eb2ee2819c985d7c484df633c913cbb995abf3162aa68c997c24ef607f2'
HOST_BP='b3c9db76-4ae6-4986-a380-90a4025d95a9'
HOST_RP='b20a91d2-f099-4293-8a7f-46bf7fbc6017'
AUTHOR_FILES={'BP/manifest.json':'9deba367bb3aa84b90dff37bae8df245a73953ed36f73066676d5312ebf5eb1c',
              'RP/manifest.json':'164a4c18b280dfe6163d1f0bd45c7a078a5d18934083482c71f29db6b826e7fc',
              'RP/blocks.json':'a66b3053dfbb173ce12a7bd53beb9827bdd1d952c6b92a83d37d2d15387c0fe4'}
RENDERED_FILES={'BP/manifest.json':'63b21ab7df2f2973dbd833c8cfb2bb25616514bc07cbd1ec260d1c6318d4218f',
                'RP/manifest.json':'84a1a29c18837645fe840935c6aaccefeab574dd8813822edd812dcaada40ac3',
                'RP/blocks.json':'51756e55a09a2896a801fcfce599ee53272e1722821fb447c54de8e744dd1fc3'}
PROVIDERS={'c2990d50-2cf7-59f7-886a-0f2d0240d156':([0,6,167],[0,6,168]),
           'bbbd2d60-52e5-53a6-8b9a-c09b0f516389':([2,8,143],[2,8,144]),
           'a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8':([0,1,145],[0,1,146]),
           '9071b6bc-915d-4d26-8486-05bb8db48762':([1,5,5],[1,5,6])}
RETAINED={'source_commit':'8d05a3da291861048dc7e759be3ba96fde45ebb8',
          'spec_sha256':'292e337a073ea713c22c84c66f85a2c8cb9d2d5c453c308b1569107d2656b703'}


def identity_projection(manifest,own,side):
    value=copy.deepcopy(manifest)
    assert value['header']['version']==VERSION
    assert value['header']['name'].count('1.0.41')==1
    value['header']['version']=OLD
    value['header']['name']=value['header']['name'].replace('1.0.41','1.0.40',1)
    for row in value['modules']:
        assert row['version']==VERSION
        row['version']=OLD
    changed=set()
    for row in value.get('dependencies',[]):
        if row.get('uuid') in own:
            assert row['version']==VERSION
            row['version']=OLD
        elif row.get('uuid') in PROVIDERS:
            assert side=='RP' and row['uuid'] not in changed and row['version']==PROVIDERS[row['uuid']][1]
            changed.add(row['uuid']);row['version']=PROVIDERS[row['uuid']][0]
    assert changed==(set(PROVIDERS) if side=='RP' else set())
    return value


def conserved_packs(before,after,old_config,config,manifests):
    assert old_config['repository']==config['repository']==LOGICAL
    assert old_config['version']==OLD and config['version']==VERSION
    assert old_config.get('retained_renderer_profile')==RETAINED and 'retained_renderer_profile' not in config
    own={row['uuid'] for row in config['packs'].values()}
    assert set(before)==set(after)==own
    projected=copy.deepcopy(config);projected['version']=OLD
    projected['source_trees']=old_config['source_trees'];projected['retained_renderer_profile']=RETAINED
    for side in ['BP','RP']:
        uid=config['packs'][side]['uuid'];a,b=before[uid],after[uid]
        assert a['version']==OLD and b['version']==VERSION
        assert a['side']==b['side']==('behavior' if side=='BP' else 'resource')
        assert tree(a['files'])==old_config['source_trees'][side] and tree(b['files'])==config['source_trees'][side]
        assert set(a['files'])==set(b['files']), 'Unexpected private file addition/removal'
        allowed={'manifest.json',HELPER,FREEZER,RENDERER} if side=='BP' else {'manifest.json'}
        assert all(a['files'][name]==b['files'][name] for name in a['files'] if name not in allowed), 'Unrelated private runtime changed'
        if side=='BP':
            assert a['files'][HELPER]==HELPER_BEFORE and b['files'][HELPER]==HELPER_AFTER
        old_manifest,new_manifest=manifests[side]
        assert identity_projection(new_manifest,own,side)==old_manifest, 'Private identity/provider scope differs'
        assert config['packs'][side]['dependencies']==new_manifest.get('dependencies',[])
        projected['packs'][side]['dependencies']=old_config['packs'][side]['dependencies']
    assert projected==old_config, 'Private baseline changed beyond exact P41 scope'


def conserved_specs(old_freezer,freezer,old_renderer,renderer):
    assert old_freezer['version']==[1,0,0] and freezer['version']==[1,0,1]
    projected=copy.deepcopy(freezer);projected['version']=[1,0,0]
    assert projected==old_freezer, 'Freezer declaration changed beyond repair identity'
    assert freezer['host_uuid']==HOST_BP and freezer['archive_sha256']==ARCHIVE
    assert old_renderer['owner_version']==[1,0,32] and old_renderer['local_pack_version']==[1,0,10432]
    assert renderer['owner_version']==VERSION and renderer['local_pack_version']==LOCAL
    assert renderer['host_uuid']==HOST_RP and renderer['behavior_uuid']==HOST_BP and renderer['archive_sha256']==ARCHIVE
    assert old_renderer['original_files']==renderer['original_files']==AUTHOR_FILES
    assert renderer['patched_files']==RENDERED_FILES
    assert old_renderer['patched_files']['RP/blocks.json']==RENDERED_FILES['RP/blocks.json']
    projected=copy.deepcopy(renderer)
    for key in ['owner_version','local_pack_version','patched_files']:projected[key]=old_renderer[key]
    assert projected==old_renderer, 'Renderer changed beyond exact owner/paired manifests'


def report_facts(proof,log,config,current_tree,specs):
    assert proof['schema']==1 and proof['kind']=='native_freezer_performance'
    assert proof['repository']==LOGICAL and proof['canonical_repository']==REPOSITORY and proof['canonical_repository_id']==REPOSITORY_ID
    assert proof['version']==config['version']==VERSION and proof['source_trees']==config['source_trees'] and proof['git_tree']==current_tree
    assert proof['previous_commit']==PREVIOUS and proof['helper_source']==HELPER and proof['helper_target']==TARGET
    assert proof['helper_sha256']==HELPER_AFTER and proof['original_helper_sha256']==HELPER_BEFORE
    assert proof['freezer_version']==[1,0,1] and proof['owner_version']==VERSION and proof['local_pack_version']==LOCAL
    assert proof['freezer_spec_sha256']==specs[FREEZER] and proof['renderer_spec_sha256']==specs[RENDERER]
    assert proof['native_startup_marker']==STARTUP and proof['test_command']==['node','tools/native-freezer-scheduling.test.mjs']
    assert proof['test_exit_code']==0 and proof['tests_passed']==7
    assert all(proof[name] is False for name in ['client','simulated_players','native_loading','production_ready'])
    operations=proof['source_operations']
    expected={'component_ticks':41,'healthy_recipe_reads':41,'failed_recipe_reads':41,'error_logs':41,'hopper_neighbor_reads':0,'recipe_completed_at_tick':2}
    assert operations['original_failure']==expected
    assert operations['repaired']==[{'upper_corrupt':bad,'component_ticks':41,'healthy_recipe_reads':3,'upper_recipe_reads':3,'hopper_neighbor_reads':72,'error_logs':int(bad),'recipe_completed_at_tick':40} for bad in [False,True]]
    for marker,expected_rows in [('ORIGINAL_FREEZER_FAILURE',[expected]),('REPAIRED_FREEZER_COUNTS',operations['repaired'])]:
        assert [json.loads(line.split(marker+' ',1)[1]) for line in log.splitlines() if line.startswith(marker+' ')]==expected_rows, 'Source operation facts differ from executed TAP'
    for name,count in [('tests',7),('pass',7),('fail',0)]:
        assert re.search(r'^# '+name+' '+str(count)+r'$',log,re.M), 'Actual source TAP summary missing'


def candidate_hosts(receipt,prior,freezer,renderer,specs,source_commit,owned_files):
    packs={p['uuid']:p for p in receipt['packs']}
    for uid,side in [(HOST_BP,'behavior'),(HOST_RP,'resource')]:
        host=packs[uid];old=prior[uid];source=host['source']
        assert host['side']==side and old['version']==[1,0,10432] and host['version']==LOCAL
        assert source['owner']=='upstream_extended' and source['archive_sha256']==ARCHIVE
        assert set(old['files'])==set(host['files']), 'Unexpected ChineseFood file addition/removal'
        allowed={'manifest.json',TARGET} if side=='behavior' else {'manifest.json'}
        assert all(old['files'][p]==host['files'][p] for p in old['files'] if p not in allowed), 'Unrelated author host changed'
        repairs=source['reviewed_extensions'];rows=[p for p in repairs if p.get('id')==renderer['id']]
        assert len(rows)==1;row=rows[0]
        assert row['owner_version']==VERSION and row['source_package_version']==VERSION and row['local_pack_version']==LOCAL
        assert row['spec_sha256']==specs[RENDERER] and row['commit']==source_commit and row['repository']==LOGICAL and row['working_candidate'] is False
        assert 'retained_renderer_profile' not in row and row['official_author_release'] is False
        assert row['original_files']==AUTHOR_FILES and row['patched_files']==RENDERED_FILES
        assert host['files']['manifest.json']==RENDERED_FILES[('BP' if side=='behavior' else 'RP')+'/manifest.json']
        if side=='resource':assert host['files']['blocks.json']==RENDERED_FILES['RP/blocks.json']
    host=packs[HOST_BP];rows=[p for p in host['source']['reviewed_extensions'] if p.get('id')==freezer['id']]
    assert len(rows)==1;row=rows[0]
    assert row['version']==[1,0,1] and row['owner_version']==VERSION and row['spec_sha256']==specs[FREEZER]
    assert row['commit']==source_commit and row['repository']==LOGICAL and row['working_candidate'] is False
    assert row['original_files']==freezer['original_files'] and row['patched_files']==freezer['patched_files']
    copies={target:{'source':source,'sha256':owned_files[source]} for source,target in freezer['copies'].items()}
    assert row['copies']==copies and copies[TARGET]=={'source':HELPER,'sha256':HELPER_AFTER}
    assert all(host['files'][target]==proof['sha256'] for target,proof in copies.items()), 'Injected helper copy differs'
    assert all(host['files'][name]==digest for name,digest in freezer['patched_files'].items())


def verified_log(path,proof):
    name=proof['test_log']['name'];assert Path(name).name==name
    log=path.parent/name
    assert not log.is_symlink() and log.resolve().parent==path.parent.resolve() and c.sha(log)==proof['test_log']['sha256']
    return log


def verify_static(receipt,prior):
    from family_update.extension_validation import source_binding
    from family_update.cookery_cache_validation import private_ci_records
    from family_update.workflow import gh_json
    path=Path(c.CONFIG['extension_performance_validation']);hud_path=Path(c.CONFIG['extension_hud_validation'])
    proof,hud,config=c.read(path),c.read(hud_path),c.read(c.EXTENSION/'baseline.json')
    binding=source_binding(proof,config);hud_binding=source_binding(hud,config)
    current=binding['actual_current_source_commit'];current_tree=binding['current_source_tree_oid']
    assert hud_binding['current_source_tree_oid']==current_tree and hud['git_tree']==current_tree
    assert hud['kind']=='explicit_family_hud' and hud['canonical_repository']==REPOSITORY and hud['canonical_repository_id']==REPOSITORY_ID
    assert hud['previous_commit']==PREVIOUS and hud['test_exit_code']==0 and hud['test_command']==['python','tools/test_family_hud_host.py']
    assert hud['native_controls']==29 and hud['literal_owned_roots']==2 and hud['native_and_amw_conserved'] and hud['dependency_bound']
    assert hud['typed_empty_fallback'] and hud['fallback_base']=='hud.kt_family_empty'
    assert all(hud[name] is False for name in ['client','simulated_players','native_loading','production_ready'])
    assert c.git(c.EXTENSION,'merge-base',PREVIOUS,current)==PREVIOUS
    metadata=c.read(c.EXTENSION/'.repo-target.json');assert metadata['repository']==REPOSITORY and metadata['repository_id']==REPOSITORY_ID and metadata['private'] is True
    repo=gh_json('repos/'+REPOSITORY);assert repo['id']==REPOSITORY_ID and repo['full_name']==REPOSITORY and repo['private'] is True
    pr=gh_json(f'repos/{REPOSITORY}/pulls/{c.CONFIG["extension_hud_pull_request"]}')
    assert pr['merged'] is True and pr['state']=='closed' and pr['base']['ref']=='main'
    assert pr['head']['repo']['id']==pr['base']['repo']['id']==REPOSITORY_ID
    assert c.git(c.EXTENSION,'merge-base',pr['merge_commit_sha'],current)==pr['merge_commit_sha']
    for commit in [current,pr['head']['sha'],proof['source_commit'],hud['source_commit']]:
        assert gh_json(f'repos/{REPOSITORY}/git/commits/{commit}')['tree']['sha']==current_tree, 'Private source/CI full tree differs'
    checks,statuses,unavailable=private_ci_records(REPOSITORY,current)
    old_config=json.loads(c.git(c.EXTENSION,'show',PREVIOUS+':baseline.json'))
    after={p['uuid']:p for p in receipt['packs'] if p['source'].get('repository')==LOGICAL}
    before={uid:prior[uid] for uid in after}
    manifests={side:(json.loads(c.git(c.EXTENSION,'show',PREVIOUS+':'+relative+'/manifest.json')),c.read(c.EXTENSION/relative/'manifest.json')) for side,relative in config['runtime'].items()}
    conserved_packs(before,after,old_config,config,manifests)
    for side in ['BP','RP']:
        uid=config['packs'][side]['uuid']
        assert hud['previous_files'][side]==before[uid]['files'] and hud['files'][side]==after[uid]['files']
    bp=c.EXTENSION/config['runtime']['BP'];old_bp=old_config['runtime']['BP']
    old_specs={name:json.loads(c.git(c.EXTENSION,'show',PREVIOUS+':'+old_bp+'/'+name)) for name in [FREEZER,RENDERER]}
    specs={name:c.read(bp/name) for name in [FREEZER,RENDERER]};hashes={name:c.sha(bp/name) for name in specs}
    conserved_specs(old_specs[FREEZER],specs[FREEZER],old_specs[RENDERER],specs[RENDERER])
    assert c.sha(bp/HELPER)==HELPER_AFTER
    log,hud_log=verified_log(path,proof),verified_log(hud_path,hud)
    report_facts(proof,log.read_text(),config,current_tree,hashes)
    candidate_hosts(receipt,prior,specs[FREEZER],specs[RENDERER],hashes,current,after[config['packs']['BP']['uuid']]['files'])
    from family_update import preserved_saturation_inputs as saturation
    selected=c.read(c.R/'prospective-preserved-inputs-check.json')
    assert c.CONFIG.get('prospective_preserved_inputs') and saturation.is_profile(selected)
    assert selected['source_commit']==current and selected['current_source_tree_oid']==current_tree
    assert selected['review']==c.report_ref(Path(c.CONFIG['prospective_preserved_inputs']))
    saturation.verify_candidate(receipt,selected)
    assert c.sha(c.C/'behavior_packs'/HOST_BP/TARGET)==HELPER_AFTER, 'Actual injected helper bytes differ'
    for dependency in manifests['RP'][1]['dependencies']:
        if dependency.get('uuid') in PROVIDERS:
            provider=next(p for p in receipt['packs'] if p['uuid']==dependency['uuid'])
            assert provider['side']=='resource' and provider['version']==dependency['version']
    for side,uid in [('BP',HOST_BP),('RP',HOST_RP)]:
        manifest=c.read(c.C/('behavior_packs' if side=='BP' else 'resource_packs')/uid/'manifest.json')
        assert c.sha(c.C/('behavior_packs' if side=='BP' else 'resource_packs')/uid/'manifest.json')==RENDERED_FILES[side+'/manifest.json']
        assert manifest['header']['uuid']==uid and manifest['header']['version']==LOCAL
        assert all(row['version']==LOCAL for row in manifest['modules'])
        other=HOST_RP if side=='BP' else HOST_BP
        assert [row['version'] for row in manifest['dependencies'] if row.get('uuid')==other]==[LOCAL]
    target=c.R/'freezer-performance-static-validation.json'
    c.atomic(target,{'schema':1,**binding,'candidate_receipt_sha256':c.sha(c.C/'family-receipt.json'),'version':VERSION,
                    'source':c.report_ref(path),'hud_source':c.report_ref(hud_path),'checks':checks,'statuses':statuses,
                    'unavailable_paid_service':unavailable,'helper_sha256':HELPER_AFTER,'native_startup_marker':STARTUP,
                    'packs':{uid:p['files'] for uid,p in after.items()},'client':False,'production_ready':False})
    return [c.report_ref(p) for p in [path,hud_path,log,hud_log,target]]


def bind_native(receipt,evidence):
    if not c.CONFIG.get('extension_performance_validation'):return
    static=c.read(c.R/'freezer-performance-static-validation.json')
    assert static['candidate_receipt_sha256']==evidence['candidate_receipt_sha256']==c.sha(c.C/'family-receipt.json')
    assert static['version']==VERSION and static['helper_sha256']==HELPER_AFTER and STARTUP in c.CONFIG['startup_markers']
    assert static['packs']=={p['uuid']:p['files'] for p in receipt['packs'] if p['source'].get('repository')==LOGICAL}
    assert evidence['fresh_stopped_backup'] and evidence['exact_files_checked'] and evidence['bds'] and evidence['saved_world_migration']
    assert evidence['client'] is False and evidence['simulated_players'] is False and evidence['test_only_overlays']==[]
    containers=c.read(c.R/'saved-world-container-inventories.json')
    assert containers['retained'] is True and all(containers['after'].get(k)==v for k,v in containers['before'].items()), 'Original container inventory was lost'
    assert [r['phase'] for r in evidence['runs']]==['first','restart']
    assert all(r['ok'] and not r['errors'] and r['real_player_connections']==0 and r['custom_container_inventories_retained'] and r['native_freezer_inputs_retained'] for r in evidence['runs'])
    c.atomic(c.R/'freezer-performance-native-validation.json',{'schema':1,'static':c.report_ref(c.R/'freezer-performance-static-validation.json'),
             'fresh_native':c.report_ref(c.R/'saved-world-report.json'),'candidate_receipt_sha256':evidence['candidate_receipt_sha256'],
             'container_preservation':c.report_ref(c.R/'saved-world-container-inventories.json'),
             'version':VERSION,'native_loading':True,'saved_world_migration':True,'scope':'Exact P41 loaded/restarted on this stopped save; scheduling counts remain source-CI evidence, not an engine benchmark',
             'client':False,'production_ready':False})


def evidence_paths():
    paths=[Path(c.CONFIG[name]) for name in ['extension_performance_validation','extension_hud_validation']]
    return [*paths,*(verified_log(path,c.read(path)) for path in paths),
            c.R/'freezer-performance-static-validation.json',c.R/'freezer-performance-native-validation.json']


def verify_installation(receipt):
    static=c.read(c.R/'freezer-performance-static-validation.json');native=c.read(c.R/'freezer-performance-native-validation.json')
    assert static['source']==c.report_ref(Path(c.CONFIG['extension_performance_validation']))
    assert static['hud_source']==c.report_ref(Path(c.CONFIG['extension_hud_validation']))
    assert static['packs']=={p['uuid']:p['files'] for p in receipt['packs'] if p['source'].get('repository')==LOGICAL}
    assert static['candidate_receipt_sha256']==native['candidate_receipt_sha256']==c.sha(c.C/'family-receipt.json')
    assert static['version']==native['version']==VERSION and static['helper_sha256']==HELPER_AFTER
    assert native['static']==c.report_ref(c.R/'freezer-performance-static-validation.json') and native['fresh_native']==c.report_ref(c.R/'saved-world-report.json')
    assert native['container_preservation']==c.report_ref(c.R/'saved-world-container-inventories.json')
    assert native['native_loading'] is True and native['saved_world_migration'] is True and native['client'] is False and native['production_ready'] is False
