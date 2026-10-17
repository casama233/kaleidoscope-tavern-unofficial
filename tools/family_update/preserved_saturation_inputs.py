"""Two exact P41 Saturation successors; the earlier five-pack HUD profile stays fixed."""
import copy
import json
import subprocess
from pathlib import Path
from family_update import common as c
from family_update.preserved_hud_inputs import checked

PROFILE='senluo-saturation-scheduling-20261015'
RECIPE='companion-sources/saturation-scheduling-20261015/recipe.json'
PRODUCER='companion-sources/hud-coexistence-20261012/recipe.json'
PRODUCER_SHA='3d7d20c210ce5b0c28dfaff22f85dba2dc4fa00f5720e5f6739fba9aac509393'
DIAGNOSIS='companion-sources/saturation-scheduling-20261015/source-diagnosis.json'
AUTHOR_BOUNDARY='companion-sources/saturation-scheduling-20261015/author-file-boundary.json'
AUTHOR_ARCHIVE='42084b762ef1508a1918dcd9d39f17fb418fd02887e589d47c6e3cc8936d3434'
AUTHOR_SCRIPT='4e93448c67b25c73ef8d75bbbea1d1a75b7bc9814bf9d1ab4fd26a6004ecd296'
SCRIPT='scripts/saturation.js'
BEFORE='system.runJob(saturation());'
AFTER='for (const _ of saturation()) {}'
SCRIPT_BEFORE='cf864a46c391a5946f5a87270809cf2af8ba2deda3e7ea88c7268b2a9eeb9c54'
SCRIPT_AFTER='319e8d35736cc3d8669f3a470ef6dd80a852acb6909b8be8489c44ac14990efe'
PACKS={'JS_BP':('f65e943a-2128-4da8-9196-e9bf5b86739d','behavior',[1,5,5],[1,5,6]),
       'JS_RP':('9071b6bc-915d-4d26-8486-05bb8db48762','resource',[1,5,5],[1,5,6])}
MANIFESTS={'JS_BP':('efa573666a295049cf2f782fcd8f4afe778f73fa12b4afa5eb6dfc3223ffe66c','47e37bbe20cd03c01cff83f949ccb54d59b0ec017df247c0bda6650737bf31d4'),
           'JS_RP':('31542d8a1395554de8a74948d601a4427ff82b4cd307defdbbaf7dd63f58492f','e1cd222cece4fc328cba1c76962820fc3de8e6f46bff56d570541809754d77b7')}


def is_profile(review):return review.get('profile')==PROFILE


def validate_recipe(recipe,old,current):
    assert recipe['schema']==1 and recipe['profile']==PROFILE and recipe['source_package_version']==[1,0,41]
    assert recipe['producer_recipe']==PRODUCER and recipe['producer_recipe_sha256']==PRODUCER_SHA
    assert recipe['operation']=={'path':SCRIPT,'before':BEFORE,'after':AFTER,'generator_body_unchanged':True}
    assert recipe['client'] is False and recipe['production_ready'] is False
    assert all(set(recipe[key])==set(PACKS) for key in ['uuids','before_versions','versions','input_hashes','output_hashes','changed'])
    for name,(uid,side,before_version,version) in PACKS.items():
        assert recipe['uuids'][name]==uid and recipe['before_versions'][name]==before_version and recipe['versions'][name]==version
        assert old[uid]['source']['owner']=='preserved' and old[uid]['side']==side and old[uid]['version']==before_version
        assert all(current[uid][key]==old[uid][key] for key in ['side','files','version']), 'Saturation cannot reconcile installed drift'
        before,after=recipe['input_hashes'][name],recipe['output_hashes'][name]
        assert before==old[uid]['files'] and set(before)==set(after), 'Saturation input/output inventory differs'
        changed={p for p in before if before[p]!=after[p]}
        assert changed==set(recipe['changed'][name])==({'manifest.json',SCRIPT} if name=='JS_BP' else {'manifest.json'})
        assert (before['manifest.json'],after['manifest.json'])==MANIFESTS[name]
        if name=='JS_BP':assert before[SCRIPT]==SCRIPT_BEFORE and after[SCRIPT]==SCRIPT_AFTER
        assert all(recipe['changed'][name][p]=={'before':before[p],'after':after[p]} for p in changed)


def validate_manifest(name,manifest,prior):
    uid,_,old_version,version=PACKS[name]
    assert manifest['header']['uuid']==prior['header']['uuid']==uid
    assert manifest['header']['version']==version and prior['header']['version']==old_version
    assert '1.5.5' in prior['header']['name'] and manifest['header']['name']==prior['header']['name'].replace('1.5.5','1.5.6')
    value=copy.deepcopy(manifest);value['header']['name']=prior['header']['name'];value['header']['version']=old_version
    assert len(value['modules'])==len(prior['modules'])
    for row,old in zip(value['modules'],prior['modules'],strict=True):
        assert row['version']==version and old['version']==old_version;row['version']=old_version
    assert len(value.get('dependencies',[]))==len(prior.get('dependencies',[]))
    for row,old in zip(value.get('dependencies',[]),prior.get('dependencies',[]),strict=True):
        expected=copy.deepcopy(old)
        if old.get('uuid') in {p[0] for p in PACKS.values()}:
            assert old['version']==old_version;expected['version']=version
        assert row==expected, 'Saturation dependency changed beyond exact paired version'
        if 'version' in old:row['version']=old['version']
    assert value==prior, 'Saturation manifest changed beyond paired identity'


def report_facts(report,log,recipe):
    assert report['schema']==1 and report['kind']=='senluo_saturation_scheduling' and report['profile']==PROFILE
    assert report['canonical_repository']=='casama233/senluo-family-integration-private' and report['canonical_repository_id']==1406868911
    assert report['repository']=='local/senluo-amw-cuisine' and report['version']==[1,0,41]
    for key in ['producer_recipe_sha256','uuids','versions','before_versions','input_hashes','output_hashes','changed']:assert report[key]==recipe[key]
    assert report['test_command']==['node','companion-sources/saturation-scheduling-20261015/scheduling-fixture.mjs'] and report['test_exit_code']==0 and report['checks_passed']==12
    assert all(report[name] is False for name in ['client','simulated_players','native_loading','production_ready','working_source_diagnostic_only'])
    assert all(report['facts'][name] is True for name in ['unique_bootstrap_replacement','generator_body_byte_preserved','ordinary_trace_equal','current_and_clean_author16_reproduced','one_score_step_per_player_tick','no_deferred_jobs'])
    clean=report['clean_author_reproduction']
    assert clean['file_id']==9071891 and clean['version']=='1.6' and clean['installed'] is False
    assert clean['archive_sha256']==AUTHOR_ARCHIVE and clean['archive_bytes']==28351
    assert clean['script_sha256']==AUTHOR_SCRIPT and clean['member']=='Java Saturation BE/scripts/saturation.js'
    actual=json.loads(log);assert actual['scenarios']==report['source_operations']
    assert actual['input_metadata']['current_private_patch_sha256']==SCRIPT_BEFORE and actual['input_metadata']['candidate_sha256']==SCRIPT_AFTER
    assert actual['input_metadata']['clean_author_script_sha256']==clean['script_sha256']
    cases=report['source_operations'];assert set(cases)=={'current_private_1_5_5','clean_author_1_6'}
    for source in cases.values():
        assert set(source)=={'normal','constrained','recovery','peaceful','creative','death_leave'}
        for name,row in source.items():
            after=row['after'];assert row['players']==10 and after['max_score_advances_per_player_tick']<=1
            assert after['max_attribute_reads_per_player_tick']<=3 and after['peak_jobs']==after['remaining_jobs']==after['jobs_started']==0
            if name in ['normal','peaceful','creative','death_leave']:assert row['trace_identical_when_budget_finishes_per_tick'] is True
        recovery=source['recovery'];before,after=recovery['before'],recovery['after']
        assert before['last_player_advances_at_recovery']==20 and after['last_player_advances_at_recovery']==1
        assert before['last_player_heals_at_recovery']>0 and after['last_player_heals_at_recovery']==0
        assert before['max_attribute_reads_per_tick']==300 and after['max_attribute_reads_per_tick']==30
        assert before['attribute_reads']==after['attribute_reads']==1200
        assert source['death_leave']['after']['invalid_player_attribute_reads_after_leave']==source['death_leave']['after']['dead_player_heals_after_death']==0


def author_boundary(report,boundary):
    assert report['official_file_boundary']['path']==AUTHOR_BOUNDARY
    assert boundary['schema']==1 and boundary['official_matches_api_length_sha1_md5'] is True
    assert boundary['exact_script_equal_across_containers'] is True and boundary['historical_reports_unchanged'] is True
    api=boundary['official_api'];official=boundary['downloads'][0]
    assert api['id']==9071891 and api['modId']==1197934 and api['fileLength']==28351
    assert api['downloadUrl']=='https://edge.forgecdn.net/files/9071/891/Java%20Saturation%20V1.6(NEW).mcaddon'
    hashes={row['algo']:row['value'] for row in api['hashes']}
    assert hashes=={1:'389286567776c72a987950adcedf602913d1ab40',2:'5208ebef540fd40daa88e846b8149ae9'}
    assert official['role']=='official_api_download' and official['bytes']==28351 and official['sha256']==AUTHOR_ARCHIVE
    assert official['sha1']==hashes[1] and official['md5']==hashes[2] and official['zip_members']==18
    assert official['script_sha256']==AUTHOR_SCRIPT and official['script_member']==report['clean_author_reproduction']['member']
    assert all(boundary[name] is False for name in ['client','native_loading','production_ready'])


def source_evidence(review,recipe):
    from family_update.extension_validation import source_binding
    from family_update.freezer_performance_validation import verified_log,PREVIOUS
    assert c.CONFIG.get('extension_performance_validation'), 'Saturation successor requires the exact P41 source profile'
    report=checked(review['source_validation']);baseline=c.read(c.EXTENSION/'baseline.json')
    binding=source_binding(report,baseline)
    assert review['source_commit']==binding['actual_current_source_commit'] and report['git_tree']==binding['current_source_tree_oid']
    assert c.git(c.EXTENSION,'rev-parse',report['source_commit']+'^{tree}')==binding['current_source_tree_oid']
    assert report['recipe_sha256']==review['recipe']['sha256']
    producer=c.EXTENSION/PRODUCER
    assert producer.read_bytes()==subprocess.check_output(['git','show',PREVIOUS+':'+PRODUCER],cwd=c.EXTENSION)
    assert c.sha(producer)==PRODUCER_SHA
    producer_recipe=c.read(producer)
    assert recipe['input_hashes']=={name:producer_recipe['output_hashes'][name] for name in PACKS}, 'Historical HUD producer input changed'
    assert report['original_diagnosis']['path']==DIAGNOSIS and report['original_diagnosis']['sha256']==c.sha(c.EXTENSION/DIAGNOSIS)
    boundary=c.EXTENSION/AUTHOR_BOUNDARY
    assert report['official_file_boundary']=={'path':AUTHOR_BOUNDARY,'sha256':c.sha(boundary)}
    author_boundary(report,c.read(boundary))
    path=Path(review['source_validation']['path']);log=verified_log(path,report)
    report_facts(report,log.read_text(),recipe)
    return binding,c.report_ref(log),c.report_ref(c.EXTENSION/DIAGNOSIS),c.report_ref(boundary)


def input_refs(review,path,recipe):
    from family_update.freezer_performance_validation import verified_log
    report=checked(review['source_validation']);log=verified_log(Path(review['source_validation']['path']),report)
    return {'prospective_preserved_inputs':c.sha(path),'prospective_recipe':c.sha(recipe),'prospective_source_validation':review['source_validation']['sha256'],
            'prospective_saturation_log':c.sha(log),'prospective_saturation_diagnosis':c.sha(c.EXTENSION/DIAGNOSIS),
            'prospective_saturation_author_boundary':c.sha(c.EXTENSION/AUTHOR_BOUNDARY)}


def select(preserved,original,path,review):
    from family_update.prospective_preserved_inputs import committed,recipe_path,separate
    assert c.EXTENSION and not any(c.CONFIG.get(k) for k in ['approved_runtime_retention','extension_hold','held_sources','preserved_reconciliation','preserved_additions'])
    assert set(review)=={'schema','profile','source_commit','recipe','source_validation','packs'} and review['schema']==1 and is_profile(review)
    assert set(review['recipe'])==set(review['source_validation'])=={'path','sha256'}
    assert set(review['packs'])==set(PACKS) and not c.git(c.EXTENSION,'status','--porcelain') and Path(path).is_absolute()
    for source in [c.EXTENSION,*c.SOURCES.values()]:assert not Path(path).resolve().is_relative_to(Path(source).resolve())
    committed(c.EXTENSION/'baseline.json','baseline.json');recipe_pathname,relative=recipe_path(review);assert relative==RECIPE
    committed(recipe_pathname,relative);recipe=checked({'path':str(recipe_pathname),'sha256':review['recipe']['sha256']})
    old,current={p['uuid']:p for p in original['packs']},{p['uuid']:p for p in preserved}
    approved_path=Path(c.read(c.R/'production-before/senluo-policy.json')['approved_receipt']);approved=c.read(approved_path)
    admitted={p['uuid']:p for p in approved['packs']}
    assert len(old)==len(original['packs']) and len(current)==len(preserved) and len(admitted)==len(approved['packs'])
    assert set(old)==set(admitted) and set(current)=={uid for uid,row in admitted.items() if row['source']['owner']=='preserved'}
    assert all(all(old[u][k]==admitted[u][k] for k in ['side','version','files']) for u in old), 'Captured family changed since admission'
    assert recipe['approved_input_receipt_sha256']==c.sha(approved_path)
    validate_recipe(recipe,admitted,current);binding,log,diagnosis,boundary=source_evidence(review,recipe)
    protected=[c.B,c.W,c.Q,c.R,c.C,c.EXTENSION,*c.SOURCES.values()];roots=[];outputs={}
    for name,(uid,side,_,version) in PACKS.items():
        row=review['packs'][name];assert set(row)=={'path','uuid'} and row['uuid']==uid
        root=separate(Path(row['path']),protected);assert all(root!=p and root not in p.parents and p not in root.parents for p in roots);roots.append(root)
        assert c.hashes(root)==recipe['output_hashes'][name]
        prior=Path(current[uid]['path']);assert c.sha(prior/'manifest.json')==current[uid]['files']['manifest.json']
        validate_manifest(name,c.read(root/'manifest.json'),c.read(prior/'manifest.json'))
        if name=='JS_BP':
            before,after=(prior/SCRIPT).read_bytes(),(root/SCRIPT).read_bytes()
            assert before.count(BEFORE.encode())==1 and AFTER.encode() not in before
            assert after==before.replace(BEFORE.encode(),AFTER.encode(),1), 'Saturation generator/HUD body changed'
        outputs[name]={'uuid':uid,'side':side,'version':version,'path':str(root)}
    evidence={'schema':1,'profile':PROFILE,'review':c.report_ref(path),'source_commit':review['source_commit'],**binding,'version':[1,0,41],
              'recipe':c.report_ref(recipe_pathname),'source_validation':review['source_validation'],'source_log':log,'source_diagnosis':diagnosis,'author_file_boundary':boundary,
              'packs':outputs,'current_live_reconciled':False,'full_family_acceptance_still_required':True,'client':False,'production_ready':False}
    assert c.git(c.EXTENSION,'rev-parse','HEAD')==review['source_commit'] and not c.git(c.EXTENSION,'status','--porcelain')
    replacements={p['uuid']:Path(p['path']) for p in outputs.values()}
    return [replacements.get(p['uuid'],Path(p['path'])) for p in preserved],evidence


def verify_candidate(receipt,selected):
    assert is_profile(selected) and selected['version']==[1,0,41] and set(selected['packs'])==set(PACKS)
    recipe=checked(selected['recipe']);assert recipe['profile']==PROFILE and set(recipe['output_hashes'])==set(PACKS)
    rows={p['uuid']:p for p in receipt['packs']};assert len(rows)==len(receipt['packs'])
    for name,(uid,side,_,version) in PACKS.items():
        row,expected=rows[uid],selected['packs'][name]
        assert row['source']['owner']=='preserved' and row['files']==recipe['output_hashes'][name]
        assert all(row[k]==expected[k]==value for k,value in [('uuid',uid),('side',side),('version',version)])


def bind_native(receipt,evidence):
    if not c.CONFIG.get('prospective_preserved_inputs'):return
    review=c.read(Path(c.CONFIG['prospective_preserved_inputs']))
    if not is_profile(review):return
    selected=c.read(c.R/'prospective-preserved-inputs-check.json');verify_candidate(receipt,selected)
    assert selected['review']==c.report_ref(Path(c.CONFIG['prospective_preserved_inputs'])) and selected['source_validation']==review['source_validation']
    assert c.git(c.EXTENSION,'rev-parse','HEAD')==selected['source_commit'] and c.git(c.EXTENSION,'rev-parse','HEAD^{tree}')==selected['current_source_tree_oid']
    assert evidence['candidate_receipt_sha256']==c.sha(c.C/'family-receipt.json')
    assert evidence['fresh_stopped_backup'] and evidence['exact_files_checked'] and evidence['bds'] and evidence['saved_world_migration']
    assert evidence['client'] is False and evidence['simulated_players'] is False and evidence['test_only_overlays']==[]
    assert [p['phase'] for p in evidence['runs']]==['first','restart'] and all(p['ok'] and not p['errors'] for p in evidence['runs'])
    checked(selected['source_validation']);checked(selected['source_log'])
    c.atomic(c.R/'saturation-scheduling-native-validation.json',{'schema':1,'source':selected['source_validation'],'recipe':selected['recipe'],
             'fresh_native':c.report_ref(c.R/'saved-world-report.json'),'candidate_receipt_sha256':evidence['candidate_receipt_sha256'],
             'source_commit':selected['source_commit'],'source_tree_oid':selected['current_source_tree_oid'],'version':[1,0,41],
             'packs':selected['packs'],'native_loading':True,'saved_world_migration':True,'client':False,'production_ready':False})


def verify_installation(receipt,selected):
    verify_candidate(receipt,selected);native=c.read(c.R/'saturation-scheduling-native-validation.json')
    assert native['source']==selected['source_validation'] and native['recipe']==selected['recipe'] and native['packs']==selected['packs']
    assert native['source_commit']==selected['source_commit'] and native['source_tree_oid']==selected['current_source_tree_oid']
    assert native['candidate_receipt_sha256']==c.sha(c.C/'family-receipt.json') and native['fresh_native']==c.report_ref(c.R/'saved-world-report.json')
    assert native['native_loading'] is True and native['saved_world_migration'] is True and native['client'] is False and native['production_ready'] is False
