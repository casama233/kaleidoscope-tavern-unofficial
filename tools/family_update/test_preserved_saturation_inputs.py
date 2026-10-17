"""Exact successor admission, using small synthetic records and no game process."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import preserved_saturation_inputs as m
from family_update import prospective_preserved_inputs as prospective
from family_update import deploy_live


def recipe_fixture():
    recipe={'schema':1,'profile':m.PROFILE,'source_package_version':[1,0,41],
            'producer_recipe':m.PRODUCER,'producer_recipe_sha256':m.PRODUCER_SHA,
            'operation':{'path':m.SCRIPT,'before':m.BEFORE,'after':m.AFTER,'generator_body_unchanged':True},
            'client':False,'production_ready':False,**{key:{} for key in ['uuids','before_versions','versions','input_hashes','output_hashes','changed']}}
    old={}
    for name,(uid,side,before_version,version) in m.PACKS.items():
        before={'manifest.json':m.MANIFESTS[name][0],'untouched':'unchanged'}
        if name=='JS_BP':before[m.SCRIPT]=m.SCRIPT_BEFORE
        after={**before,'manifest.json':m.MANIFESTS[name][1]}
        if name=='JS_BP':after[m.SCRIPT]=m.SCRIPT_AFTER
        for key,value in [('uuids',uid),('before_versions',before_version),('versions',version),('input_hashes',before),('output_hashes',after)]:recipe[key][name]=copy.deepcopy(value)
        recipe['changed'][name]={p:{'before':before[p],'after':after[p]} for p in before if before[p]!=after[p]}
        old[uid]={'source':{'owner':'preserved'},'side':side,'version':before_version,'files':copy.deepcopy(before)}
    return recipe,old,copy.deepcopy(old)


def facts_fixture():
    recipe,_,_=recipe_fixture()
    cases={}
    for source in ['current_private_1_5_5','clean_author_1_6']:
        cases[source]={}
        for name in ['normal','constrained','recovery','peaceful','creative','death_leave']:
            after={'max_score_advances_per_player_tick':1,'max_attribute_reads_per_player_tick':3,
                   'peak_jobs':0,'remaining_jobs':0,'jobs_started':0,'last_player_advances_at_recovery':1,
                   'last_player_heals_at_recovery':0,'max_attribute_reads_per_tick':30,'attribute_reads':1200,
                   'invalid_player_attribute_reads_after_leave':0,'dead_player_heals_after_death':0}
            before={'last_player_advances_at_recovery':20,'last_player_heals_at_recovery':1,
                    'max_attribute_reads_per_tick':300,'attribute_reads':1200}
            cases[source][name]={'players':10,'before':before,'after':after,'trace_identical_when_budget_finishes_per_tick':True}
    report={'schema':1,'kind':'senluo_saturation_scheduling','profile':m.PROFILE,
            'repository':'local/senluo-amw-cuisine','canonical_repository':'casama233/senluo-family-integration-private',
            'canonical_repository_id':1406868911,'version':[1,0,41],
            **{k:copy.deepcopy(recipe[k]) for k in ['producer_recipe_sha256','uuids','versions','before_versions','input_hashes','output_hashes','changed']},
            'test_command':['node','companion-sources/saturation-scheduling-20261015/scheduling-fixture.mjs'],'test_exit_code':0,'checks_passed':12,
            **{k:False for k in ['client','simulated_players','native_loading','production_ready','working_source_diagnostic_only']},
            'facts':{k:True for k in ['unique_bootstrap_replacement','generator_body_byte_preserved','ordinary_trace_equal','current_and_clean_author16_reproduced','one_score_step_per_player_tick','no_deferred_jobs']},
            'clean_author_reproduction':{'file_id':9071891,'version':'1.6','archive_sha256':m.AUTHOR_ARCHIVE,'archive_bytes':28351,
                                         'script_sha256':m.AUTHOR_SCRIPT,'member':'Java Saturation BE/scripts/saturation.js','installed':False},
            'official_file_boundary':{'path':m.AUTHOR_BOUNDARY,'sha256':'boundary'},'source_operations':cases}
    log={'scenarios':copy.deepcopy(cases),'input_metadata':{'current_private_patch_sha256':m.SCRIPT_BEFORE,
         'candidate_sha256':m.SCRIPT_AFTER,'clean_author_script_sha256':m.AUTHOR_SCRIPT}}
    return report,log,recipe


class SaturationTests(unittest.TestCase):
    def test_two_successors_require_admitted_input_and_only_exact_bootstrap_and_pair(self):
        m.validate_recipe(*recipe_fixture())
        for kind in ['drift','script','hud','extra-file','extra-pack','provider-version']:
            with self.subTest(kind=kind):
                recipe,old,current=recipe_fixture();uid=m.PACKS['JS_BP'][0]
                if kind=='drift':current[uid]['files']['untouched']='drift'
                elif kind=='script':
                    recipe['output_hashes']['JS_BP'][m.SCRIPT]='forged'
                    recipe['changed']['JS_BP'][m.SCRIPT]['after']='forged'
                elif kind=='hud':
                    recipe['output_hashes']['JS_RP']['untouched']='forged'
                    recipe['changed']['JS_RP']['untouched']={'before':'unchanged','after':'forged'}
                elif kind=='extra-file':recipe['output_hashes']['JS_BP']['added.js']='extra'
                elif kind=='extra-pack':recipe['uuids']['other']='extra'
                else:recipe['versions']['JS_BP']=[1,5,7]
                with self.assertRaises(AssertionError):m.validate_recipe(recipe,old,current)

    def test_manifest_projection_cannot_hide_other_header_module_or_dependency_edits(self):
        for name,(uid,_,before_version,version) in m.PACKS.items():
            other=next(row[0] for row in m.PACKS.values() if row[0]!=uid)
            old={'header':{'uuid':uid,'name':'Saturation 1.5.5','version':before_version,'description':'kept'},
                 'modules':[{'uuid':'module','type':'script','version':before_version}],
                 'dependencies':[{'uuid':other,'version':before_version},{'module_name':'@minecraft/server','version':'2.0.0'}]}
            new=copy.deepcopy(old);new['header'].update(name='Saturation 1.5.6',version=version)
            new['modules'][0]['version']=version;new['dependencies'][0]['version']=version
            m.validate_manifest(name,new,old)
            for kind in ['description','module','dependency']:
                changed=copy.deepcopy(new)
                if kind=='description':changed['header']['description']='changed'
                elif kind=='module':changed['modules'][0]['uuid']='different'
                else:changed['dependencies'][1]['version']='3.0.0'
                with self.assertRaises(AssertionError):m.validate_manifest(name,changed,old)

    def test_actual_dual_source_counts_require_source_only_flags_and_matching_log(self):
        report,log,recipe=facts_fixture();m.report_facts(report,json.dumps(log),recipe)
        for kind in ['client','working_source_diagnostic_only','archive','count','trace','log']:
            with self.subTest(kind=kind):
                report,log,recipe=facts_fixture()
                if kind in ['client','working_source_diagnostic_only']:report[kind]=True
                elif kind=='archive':report['clean_author_reproduction']['archive_sha256']='historical-container'
                elif kind=='count':report['source_operations']['clean_author_1_6']['recovery']['after']['last_player_advances_at_recovery']=2
                elif kind=='trace':report['source_operations']['current_private_1_5_5']['normal']['trace_identical_when_budget_finishes_per_tick']=False
                else:log['input_metadata']['candidate_sha256']='wrong'
                with self.assertRaises(AssertionError):m.report_facts(report,json.dumps(log),recipe)

    def test_official_archive_boundary_cannot_substitute_historical_container_or_other_author(self):
        report,_,_=facts_fixture()
        boundary={'schema':1,'official_matches_api_length_sha1_md5':True,'exact_script_equal_across_containers':True,'historical_reports_unchanged':True,
                  'official_api':{'id':9071891,'modId':1197934,'fileLength':28351,
                   'downloadUrl':'https://edge.forgecdn.net/files/9071/891/Java%20Saturation%20V1.6(NEW).mcaddon',
                   'hashes':[{'algo':1,'value':'389286567776c72a987950adcedf602913d1ab40'},{'algo':2,'value':'5208ebef540fd40daa88e846b8149ae9'}]},
                  'downloads':[{'role':'official_api_download','bytes':28351,'sha256':m.AUTHOR_ARCHIVE,'sha1':'389286567776c72a987950adcedf602913d1ab40',
                   'md5':'5208ebef540fd40daa88e846b8149ae9','zip_members':18,'script_sha256':m.AUTHOR_SCRIPT,'script_member':report['clean_author_reproduction']['member']}],
                  'client':False,'native_loading':False,'production_ready':False}
        m.author_boundary(report,boundary)
        for section,key,value in [('official_api','fileLength',27310),('official_api','modId',1),('download','sha256','historical'),('download','script_sha256','wrong')]:
            changed=copy.deepcopy(boundary);(changed['downloads'][0] if section=='download' else changed[section])[key]=value
            with self.assertRaises(AssertionError):m.author_boundary(report,changed)

    def candidate(self):
        recipe,_,_=recipe_fixture();selected={'profile':m.PROFILE,'version':[1,0,41],'recipe':{'path':'recipe','sha256':'recipe'},'packs':{}}
        receipt={'packs':[]}
        for name,(uid,side,_,version) in m.PACKS.items():
            row={'uuid':uid,'side':side,'version':version};selected['packs'][name]=row
            receipt['packs'].append({**row,'source':{'owner':'preserved'},'files':copy.deepcopy(recipe['output_hashes'][name])})
        return recipe,selected,receipt

    def test_candidate_route_requires_complete_two_packs_and_exact_bytes(self):
        recipe,selected,receipt=self.candidate()
        with patch.object(m,'checked',return_value=recipe):
            prospective.verify_candidate(receipt,selected)
            receipt['packs'][0]['files'][m.SCRIPT]='changed'
            with self.assertRaises(AssertionError):prospective.verify_candidate(receipt,selected)
            recipe,selected,receipt=self.candidate();selected['packs'].pop('JS_RP')
            with self.assertRaises(AssertionError):prospective.verify_candidate(receipt,selected)

    def test_native_binding_and_installation_require_same_candidate_source_and_first_restart(self):
        recipe,selected,receipt=self.candidate()
        selected.update(source_commit='commit',current_source_tree_oid='tree',source_validation={'path':'proof','sha256':'proof'},source_log={'path':'log','sha256':'log'})
        review={'profile':m.PROFILE,'source_validation':selected['source_validation']}
        selected['review']={'path':'review'}
        evidence={'candidate_receipt_sha256':'receipt','fresh_stopped_backup':True,'exact_files_checked':True,'bds':True,'saved_world_migration':True,
                  'client':False,'simulated_players':False,'test_only_overlays':[],'runs':[{'phase':p,'ok':True,'errors':[]} for p in ['first','restart']]}
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);store={}
            def read(path):
                if str(path)=='review':return review
                if path.name=='prospective-preserved-inputs-check.json':return selected
                return store[path.name]
            with patch.multiple(m.c,CONFIG={'prospective_preserved_inputs':'review'},EXTENSION=root,R=root,C=root), \
                 patch.object(m.c,'read',side_effect=read),patch.object(m.c,'sha',return_value='receipt'), \
                 patch.object(m.c,'report_ref',side_effect=lambda p:{'path':str(p)}), \
                 patch.object(m.c,'git',side_effect=lambda p,*args:'tree' if args[-1].endswith('^{tree}') else 'commit'), \
                 patch.object(m.c,'atomic',side_effect=lambda p,v:store.update({p.name:v})), \
                 patch.object(m,'checked',side_effect=lambda ref:recipe if ref['path']=='recipe' else {}):
                m.bind_native(receipt,evidence);m.verify_installation(receipt,selected)
                for kind in ['cross-candidate','client','first-only','overlay']:
                    changed=copy.deepcopy(evidence)
                    if kind=='cross-candidate':changed['candidate_receipt_sha256']='other'
                    elif kind=='client':changed['client']=True
                    elif kind=='first-only':changed['runs']=changed['runs'][:1]
                    else:changed['test_only_overlays']=['probe']
                    with self.assertRaises(AssertionError):m.bind_native(receipt,changed)
                store['saturation-scheduling-native-validation.json']['source_commit']='other'
                with self.assertRaises(AssertionError):m.verify_installation(receipt,selected)

    def test_final_reviewed_receipt_keeps_both_profiles_and_all_source_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);proof={'profile':m.PROFILE,**{k:{'path':str(root/k)} for k in ['review','recipe','source_validation','source_log','source_diagnosis','author_file_boundary']}}
            raw={'packs':[]};written={};freezer_paths=[root/name for name in ['freezer.json','freezer.tap','hud.json','hud.log','freezer-performance-static-validation.json','freezer-performance-native-validation.json']]
            with patch.multiple(deploy_live,R=root,C=root,CONFIG={'extension_performance_validation':'freezer','prospective_preserved_inputs':'review'}), \
                 patch.object(deploy_live,'read',side_effect=lambda p:proof if p.name=='prospective-preserved-inputs-check.json' else copy.deepcopy(raw)), \
                 patch.object(deploy_live,'sha',return_value='receipt'),patch.object(deploy_live,'report_ref',side_effect=lambda p:{'path':str(p)}), \
                 patch.object(deploy_live,'atomic',side_effect=lambda p,v:written.update({p.name:v})),patch.object(deploy_live,'audit_candidate'), \
                 patch('family_update.workflow.verify_native',return_value={}),patch('family_update.freezer_performance_validation.evidence_paths',return_value=freezer_paths):
                result=deploy_live.finalize_receipt()
            refs={row['path'] for row in result['evidence']['reports']}
            self.assertTrue({str(p) for p in freezer_paths}<=refs)
            self.assertTrue({str(root/name) for name in ['saturation-scheduling-native-validation.json','source_validation','source_log','source_diagnosis','author_file_boundary']}<=refs)
            self.assertFalse(result['acceptance']['client']);self.assertFalse(result['production_ready'])

    def test_installation_cannot_skip_performance_native_gate(self):
        with patch.object(deploy_live,'CONFIG',{'extension_performance_validation':'proof'}), \
             patch('family_update.freezer_performance_validation.verify_installation',side_effect=FileNotFoundError('native missing')) as guard:
            with self.assertRaises(FileNotFoundError):deploy_live.installation_selection({'packs':[]},{'packs':[]})
            guard.assert_called_once()


if __name__=='__main__':unittest.main()
