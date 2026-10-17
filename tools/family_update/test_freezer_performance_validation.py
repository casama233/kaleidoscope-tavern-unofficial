"""P41's named repair cannot admit other source, storage, renderer or QA claims."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import freezer_performance_validation as m
from family_update import extension_validation


def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()


def specs():
    old={'id':'senluo:chinesefood-native-freezer-storage','version':[1,0,0],
         'host_uuid':m.HOST_BP,'archive_sha256':m.ARCHIVE,'original_files':{'author.js':'original'},
         'patched_files':{'author.js':'patched'},'imports':{'author.js':'kept'},'insertions':['kept'],
         'copies':{m.HELPER:m.TARGET,'loot.json':'loot.json'},'json_updates':['kept']}
    new={**old,'version':[1,0,1]}
    renderer={'id':'senluo:chinesefood-doll-renderer-cleanup','host_uuid':m.HOST_RP,'behavior_uuid':m.HOST_BP,
              'owner_version':[1,0,32],'local_pack_version':[1,0,10432],'archive_sha256':m.ARCHIVE,
              'original_files':dict(m.AUTHOR_FILES),'patched_files':{**m.RENDERED_FILES,'BP/manifest.json':'old-bp','RP/manifest.json':'old-rp'}}
    repaired={**renderer,'owner_version':m.VERSION,'local_pack_version':m.LOCAL,'patched_files':dict(m.RENDERED_FILES)}
    return tuple(copy.deepcopy(value) for value in (old,new,renderer,repaired))


def private_fixture():
    before,after,manifests={}, {}, {}
    old={'repository':m.LOGICAL,'version':m.OLD,'runtime':{'BP':'runtime/BP','RP':'runtime/RP'},
         'retained_renderer_profile':m.RETAINED,'packs':{},'source_trees':{}}
    new={**copy.deepcopy(old),'version':m.VERSION,'packs':{},'source_trees':{}}
    del new['retained_renderer_profile']
    for side,uid,other in [('BP','owned-bp','owned-rp'),('RP','owned-rp','owned-bp')]:
        manifest={'header':{'uuid':uid,'version':m.OLD,'name':'Owned 1.0.40'},'modules':[{'type':side,'version':m.OLD}],
                  'dependencies':[{'uuid':other,'version':m.OLD}]}
        if side=='RP':manifest['dependencies'] += [{'uuid':uid,'version':pair[0]} for uid,pair in m.PROVIDERS.items()]+[{'uuid':'foreign','version':[1,5,5]}]
        changed=copy.deepcopy(manifest);changed['header'].update(version=m.VERSION,name='Owned 1.0.41')
        changed['modules'][0]['version']=m.VERSION;changed['dependencies'][0]['version']=m.VERSION
        for row in changed['dependencies']:
            if row['uuid'] in m.PROVIDERS:row['version']=m.PROVIDERS[row['uuid']][1]
        files={'manifest.json':digest(manifest),'untouched':digest('gameplay/assets/HUD')}
        changed_files={**files,'manifest.json':digest(changed)}
        if side=='BP':
            files.update({m.HELPER:m.HELPER_BEFORE,m.FREEZER:digest('old-freezer'),m.RENDERER:digest('old-renderer')})
            changed_files.update({m.HELPER:m.HELPER_AFTER,m.FREEZER:digest('new-freezer'),m.RENDERER:digest('new-renderer')})
        before[uid]={'uuid':uid,'side':'behavior' if side=='BP' else 'resource','version':m.OLD,'files':files}
        after[uid]={**before[uid],'version':m.VERSION,'files':changed_files}
        old['packs'][side]={'uuid':uid,'dependencies':manifest['dependencies']};new['packs'][side]={'uuid':uid,'dependencies':changed['dependencies']}
        old['source_trees'][side]=m.tree(files);new['source_trees'][side]=m.tree(changed_files)
        manifests[side]=(manifest,changed)
    return before,after,old,new,manifests


class FreezerScopeTests(unittest.TestCase):
    def test_exact_five_runtime_paths_and_existing_provider_identity_updates(self):
        m.conserved_packs(*private_fixture());m.conserved_specs(*specs())

    def test_other_runtime_baseline_retention_and_provider_changes_rejected(self):
        for change in ['script','new-file','removed-file','helper','retention','provider','foreign-provider','module','baseline']:
            with self.subTest(change=change):
                args=private_fixture();before,after,old,new,manifests=args
                if change in ['script','new-file','removed-file','helper']:
                    rows=after['owned-bp']['files']
                    if change=='script':rows['untouched']=digest('unrelated storage')
                    if change=='new-file':rows['scripts/foreign.js']=digest('added')
                    if change=='removed-file':del rows['untouched']
                    if change=='helper':rows[m.HELPER]=digest('unreviewed helper')
                    new['source_trees']['BP']=m.tree(rows)
                elif change=='retention':new['retained_renderer_profile']=m.RETAINED
                elif change=='provider':manifests['RP'][1]['dependencies'][1]['version']=[0,6,169]
                elif change=='foreign-provider':manifests['RP'][1]['dependencies'][-1]['version']=[1,5,6]
                elif change=='module':manifests['BP'][1]['modules'][0]['type']='other'
                else:new['unreviewed-setting']=True
                with self.assertRaises(AssertionError):m.conserved_packs(*args)

    def test_author_preimages_imports_copy_targets_renderer_assets_and_owner_pair_are_immutable(self):
        for change in ['author','imports','copy','updates','renderer-author','renderer-assets','owner','pair','manifest']:
            with self.subTest(change=change):
                old,new,renderer,repaired=specs()
                if change=='author':new['original_files']['author.js']='different'
                elif change=='imports':new['imports']['author.js']='different'
                elif change=='copy':new['copies'][m.HELPER]='scripts/elsewhere.js'
                elif change=='updates':new['json_updates'].append('other')
                elif change=='renderer-author':repaired['original_files']['BP/manifest.json']='different'
                elif change=='renderer-assets':repaired['patched_files']['RP/blocks.json']='different'
                elif change=='owner':repaired['owner_version']=m.OLD
                elif change=='pair':repaired['local_pack_version']=[1,0,10432]
                else:repaired['patched_files']['BP/manifest.json']='different'
                with self.assertRaises(AssertionError):m.conserved_specs(old,new,renderer,repaired)

    def host_fixture(self):
        _,freezer,_,renderer=specs();source='a'*40;hashes={m.FREEZER:'freezer-spec',m.RENDERER:'renderer-spec'}
        owned={m.HELPER:m.HELPER_AFTER,'loot.json':'loot'}
        render_proof={**renderer,'source_package_version':m.VERSION,'spec_sha256':hashes[m.RENDERER],
                      'commit':source,'repository':m.LOGICAL,'working_candidate':False,'official_author_release':False}
        storage_proof={**freezer,'owner_version':m.VERSION,'spec_sha256':hashes[m.FREEZER],'commit':source,'repository':m.LOGICAL,
                       'working_candidate':False,'copies':{target:{'source':name,'sha256':owned[name]} for name,target in freezer['copies'].items()}}
        prior={};packs=[]
        for uid,side in [(m.HOST_BP,'behavior'),(m.HOST_RP,'resource')]:
            files={'manifest.json':'previous','untouched':'original'}
            if side=='behavior':files.update({m.TARGET:m.HELPER_BEFORE,'loot.json':'loot','author.js':'patched'})
            else:files['blocks.json']=m.RENDERED_FILES['RP/blocks.json']
            prior[uid]={'version':[1,0,10432],'files':files}
            after={**files,'manifest.json':m.RENDERED_FILES[('BP' if side=='behavior' else 'RP')+'/manifest.json']}
            if side=='behavior':after[m.TARGET]=m.HELPER_AFTER
            packs.append({'uuid':uid,'side':side,'version':m.LOCAL,'files':after,'source':{'owner':'upstream_extended','archive_sha256':m.ARCHIVE,
                          'reviewed_extensions':[copy.deepcopy(render_proof)]+([copy.deepcopy(storage_proof)] if side=='behavior' else [])}})
        return {'packs':packs},prior,freezer,renderer,hashes,source,owned

    def test_injected_helper_provenance_paired_host_and_unchanged_author_files(self):
        m.candidate_hosts(*self.host_fixture())
        for change in ['copy','owner','manifest','author','source','retained']:
            with self.subTest(change=change):
                args=self.host_fixture();host=args[0]['packs'][0]
                if change=='copy':host['files'][m.TARGET]='different'
                elif change=='owner':host['source']['reviewed_extensions'][0]['owner_version']=m.OLD
                elif change=='manifest':host['version']=[1,0,10432]
                elif change=='author':host['files']['untouched']='different'
                elif change=='source':host['source']['owner']='preserved'
                else:host['source']['reviewed_extensions'][0]['retained_renderer_profile']=m.RETAINED
                with self.assertRaises(AssertionError):m.candidate_hosts(*args)

    def facts(self):
        config={'version':m.VERSION,'source_trees':{'BP':'source','RP':'source'}};hashes={m.FREEZER:'freezer-spec',m.RENDERER:'renderer-spec'}
        original={'component_ticks':41,'healthy_recipe_reads':41,'failed_recipe_reads':41,'error_logs':41,'hopper_neighbor_reads':0,'recipe_completed_at_tick':2}
        repaired=[{'upper_corrupt':bad,'component_ticks':41,'healthy_recipe_reads':3,'upper_recipe_reads':3,'hopper_neighbor_reads':72,'error_logs':int(bad),'recipe_completed_at_tick':40} for bad in [False,True]]
        log='ORIGINAL_FREEZER_FAILURE '+json.dumps(original)+'\n'+''.join('REPAIRED_FREEZER_COUNTS '+json.dumps(row)+'\n' for row in repaired)+'# tests 7\n# pass 7\n# fail 0\n'
        proof={'schema':1,'kind':'native_freezer_performance','repository':m.LOGICAL,'canonical_repository':m.REPOSITORY,'canonical_repository_id':m.REPOSITORY_ID,
               **config,'git_tree':'tree','previous_commit':m.PREVIOUS,'helper_source':m.HELPER,'helper_target':m.TARGET,
               'helper_sha256':m.HELPER_AFTER,'original_helper_sha256':m.HELPER_BEFORE,'freezer_version':[1,0,1],'owner_version':m.VERSION,'local_pack_version':m.LOCAL,
               'freezer_spec_sha256':hashes[m.FREEZER],'renderer_spec_sha256':hashes[m.RENDERER],'native_startup_marker':m.STARTUP,
               'test_command':['node','tools/native-freezer-scheduling.test.mjs'],'test_exit_code':0,'tests_passed':7,
               'source_operations':{'original_failure':original,'repaired':repaired},'client':False,'simulated_players':False,'native_loading':False,'production_ready':False}
        return proof,log,config,'tree',hashes

    def test_executed_counts_and_seven_cases_are_source_evidence_only(self):
        m.report_facts(*self.facts())
        for field,value in [('helper_sha256','other'),('client',True),('native_loading',True),('tests_passed',6),('git_tree','other')]:
            with self.subTest(field=field):
                args=list(self.facts());args[0][field]=value
                with self.assertRaises(AssertionError):m.report_facts(*args)
        args=list(self.facts());args[0]['source_operations']['repaired'][0]['recipe_completed_at_tick']=2
        with self.assertRaises(AssertionError):m.report_facts(*args)
        args=list(self.facts());args[1]=args[1].replace('# fail 0','# fail 1')
        with self.assertRaises(AssertionError):m.report_facts(*args)

    def test_performance_dispatch_precedes_hud_profile_without_extending_its_scope(self):
        receipt={'packs':[{'uuid':'private','source':{'owner':'owned','repository':m.LOGICAL}}]}
        with patch.object(extension_validation,'CONFIG',{'extension_performance_validation':'proof','extension_hud_validation':'hud'}), \
             patch.object(m,'verify_static',return_value=['performance']) as verify:
            self.assertEqual(extension_validation.verify_extension(receipt,{}),['performance']);verify.assert_called_once_with(receipt,{})

    def test_common_native_binding_requires_exact_candidate_first_restart_and_original_inventory(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);receipt={'packs':[{'uuid':'private','source':{'repository':m.LOGICAL},'files':{'manifest.json':'same'}}]}
            static={'candidate_receipt_sha256':'receipt','version':m.VERSION,'helper_sha256':m.HELPER_AFTER,'packs':{'private':{'manifest.json':'same'}}}
            containers={'retained':True,'before':{'old':'full typed item'},'after':{'old':'full typed item','new':'allowed new container'}}
            evidence={'candidate_receipt_sha256':'receipt','fresh_stopped_backup':True,'exact_files_checked':True,'bds':True,'saved_world_migration':True,
                      'client':False,'simulated_players':False,'test_only_overlays':[],'runs':[{'phase':phase,'ok':True,'errors':[],
                      'real_player_connections':0,'custom_container_inventories_retained':True,'native_freezer_inputs_retained':True} for phase in ['first','restart']]}
            with patch.multiple(m.c,CONFIG={'extension_performance_validation':'proof','startup_markers':[m.STARTUP]},R=root,C=root), \
                 patch.object(m.c,'read',side_effect=lambda path:static if path.name=='freezer-performance-static-validation.json' else containers), \
                 patch.object(m.c,'sha',return_value='receipt'),patch.object(m.c,'report_ref',side_effect=lambda path:{'path':str(path)}),patch.object(m.c,'atomic') as write:
                m.bind_native(receipt,evidence);self.assertTrue(write.called)
                for field,value in [('candidate_receipt_sha256','other'),('client',True),('test_only_overlays',['probe'])]:
                    changed={**evidence,field:value}
                    with self.assertRaises(AssertionError):m.bind_native(receipt,changed)
                changed={**evidence,'runs':evidence['runs'][:1]}
                with self.assertRaises(AssertionError):m.bind_native(receipt,changed)
                containers['after']['old']='lost metadata'
                with self.assertRaises(AssertionError):m.bind_native(receipt,evidence)


if __name__=='__main__':unittest.main()
