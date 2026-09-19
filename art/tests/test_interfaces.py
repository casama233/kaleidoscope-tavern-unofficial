from __future__ import annotations
import copy
from contextlib import contextmanager
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
import subprocess
import tempfile
import unittest
from unittest import mock
import uuid
import zipfile
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from interface_common import ROOT, read, dump, InterfaceError, within, transaction
from dependency_overlay import plan_bind, apply_report, verify_item_map, validate_report
from cookery_dependency import inspect, AuditError
from build_interfaces import compile_registry
from validate_interfaces import validate
from compare_release import compare
import interface_common


def fixture_pack(role, *, pack_uuid=None, v=(1,0,5)):
    return {'format_version':2,'header':{'name':'SYNTHETIC Cookery '+role,'uuid':pack_uuid or str(uuid.uuid4()),'version':list(v),'min_engine_version':[1,26,50]},
            'modules':[{'type':'data' if role=='behavior' else 'resources','uuid':str(uuid.uuid4()),'version':list(v)}]}


def archive(path, *, extra=None, nested=False):
    manifests={r:fixture_pack(r) for r in ('behavior','resource')}
    def body(z,r,prefix=''):
        z.writestr(prefix+'manifest.json',json.dumps(manifests[r]))
        if r=='behavior':z.writestr(prefix+'items/rice.json',json.dumps({'minecraft:item':{'description':{'identifier':'synthetic_cookery:rice'}}}))
    with zipfile.ZipFile(path,'w') as z:
        for r in manifests:
            if nested:
                buff=io.BytesIO()
                with zipfile.ZipFile(buff,'w') as zz:body(zz,r)
                z.writestr(r+'.mcpack',buff.getvalue())
            else:body(z,r,r+'/')
        if extra:z.writestr(*extra)
    return manifests


def small_project(path):
    path.mkdir(exist_ok=True)
    dump(path/'config.json',{'packs':{'behaviorPack':'VisualLab_BP','resourcePack':'RP'}})
    for role,folder in [('behavior','VisualLab_BP'),('resource','RP')]:
        pack=fixture_pack(role);pack['header']['name']='Tavern test';dump(path/folder/'manifest.json',pack)
    dump(path/'cookery.requirement.json',{'required_for_production':True,'bound':False})
    dump(path/'compat/cookery/item-map.json',{'schema_version':1,'items':{}})
    dump(path/'interfaces/cookery-contract.json',{'schema_version':1,'binding_status':'UNBOUND'})


class CookeryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.project=self.root/'project';small_project(self.project)
        self.file=self.root/'cookery.mcaddon';self.original=archive(self.file);self.report=inspect(self.file)
    def tearDown(self):self.tmp.cleanup()
    def test_header_uuid_and_internal_version_not_module_or_filename(self):
        manifest=self.original['behavior'];r=self.report['behavior']
        self.assertEqual(r['uuid'],manifest['header']['uuid']);self.assertNotEqual(r['uuid'],manifest['modules'][0]['uuid']);self.assertEqual(r['version'],[1,0,5])
    def test_nested_mcpack(self):
        archive(self.file,nested=True);self.assertEqual(len(inspect(self.file)['behavior']['identifiers']['items']),1)
    def test_dry_run_changes_nothing(self):
        before={str(p):p.read_bytes() for p in self.project.rglob('*') if p.is_file()}
        plan_bind(self.project,self.report)
        self.assertEqual(before,{str(p):p.read_bytes() for p in self.project.rglob('*') if p.is_file()})
    def test_applied_manifest_and_requirement_agree(self):
        apply_report(self.project,self.report)
        self.assertTrue(read(self.project/'cookery.requirement.json')['bound'])
        self.assertEqual(read(self.project/'VisualLab_BP/manifest.json')['dependencies'],[{'uuid':self.report['behavior']['uuid'],'version':[1,0,5]}])
        self.assertEqual(read(self.project/'compat/cookery.lock.json')['archive_sha256'],hashlib.sha256(self.file.read_bytes()).hexdigest())
    def test_repeated_bind_is_idempotent(self):
        apply_report(self.project,self.report);self.assertEqual(apply_report(self.project,self.report),[])
    def test_keep_unrelated_dependencies_and_own_ids(self):
        p=self.project/'VisualLab_BP/manifest.json';m=read(p);old=m['header']['uuid'];m['dependencies']=[{'module_name':'@minecraft/server','version':'2.9.0'}];dump(p,m)
        apply_report(self.project,self.report);after=read(p);self.assertEqual(after['header']['uuid'],old);self.assertIn(m['dependencies'][0],after['dependencies'])
    def test_dependency_upgrade_replaces_old_binding_not_duplicates(self):
        apply_report(self.project,self.report);changed=copy.deepcopy(self.report);changed['behavior']['version']=[1,1,9]
        apply_report(self.project,changed);deps=read(self.project/'VisualLab_BP/manifest.json')['dependencies'];self.assertEqual(len(deps),1);self.assertEqual(deps[0]['version'],[1,1,9])
    def test_refuse_self_binding(self):
        p=self.project/'VisualLab_BP/manifest.json';m=read(p);m['header']['uuid']=self.report['behavior']['uuid'];dump(p,m)
        with self.assertRaises(InterfaceError):plan_bind(self.project,self.report)
    def test_refuse_module_collision(self):
        p=self.project/'VisualLab_BP/manifest.json';m=read(p);m['modules'][0]['uuid']=self.report['resource']['modules'][0]['uuid'];dump(p,m)
        with self.assertRaises(InterfaceError):plan_bind(self.project,self.report)
    def test_refuse_dependency_cycle(self):
        r=copy.deepcopy(self.report);r['behavior']['dependencies']=[{'uuid':read(self.project/'RP/manifest.json')['header']['uuid'],'version':[1,0,0]}]
        with self.assertRaises(InterfaceError):plan_bind(self.project,r)
    def test_refuse_invalid_version(self):
        for v in ([True,0,1],[-1,0,1],[1,2],'1.0.5'):
            r=copy.deepcopy(self.report);r['behavior']['version']=v
            with self.assertRaises(InterfaceError):plan_bind(self.project,r)
    def test_item_mapping_checks_exact_registry(self):
        p=self.project/'compat/cookery/item-map.json';dump(p,{'schema_version':1,'items':{'rice':'invented:rice'}})
        self.assertTrue(verify_item_map(self.project,self.report));dump(p,{'schema_version':1,'items':{'rice':'synthetic_cookery:rice'}});self.assertEqual(verify_item_map(self.project,self.report),[])
    def test_unbound_nonempty_mapping_refused(self):
        dump(self.project/'compat/cookery/item-map.json',{'schema_version':1,'items':{'rice':'invented:rice'}})
        self.assertTrue(verify_item_map(self.project,None))
    def test_archive_traversal_refused(self):
        archive(self.file,extra=('../escape.txt','x'))
        with self.assertRaises(AuditError):inspect(self.file)
    def test_path_escape_refused(self):
        with self.assertRaises(InterfaceError):within(self.project,'../secret')
    def test_json_duplicate_keys_refused(self):
        p=self.root/'bad.json';p.write_text('{"a":1,"a":2}')
        with self.assertRaises(InterfaceError):read(p)
    def test_multifile_write_failure_rolls_back(self):
        a=self.root/'a';b=self.root/'b';a.write_bytes(b'old a');b.write_bytes(b'old b');real=interface_common.atomic
        def fail_second(path,data):
            if path==b and data==b'new b':raise OSError('Injected write failure')
            real(path,data)
        with mock.patch.object(interface_common,'atomic',side_effect=fail_second):
            with self.assertRaises(OSError):transaction({a:b'new a',b:b'new b'},self.root/'backups')
        self.assertEqual(a.read_bytes(),b'old a');self.assertEqual(b.read_bytes(),b'old b')


class ReleaseComparisonTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.jar=self.root/'sample.jar'
        paths=['src/main/resources/assets/example/a.json','src/generated/resources/assets/example/b.json']
        dump(self.root/'sources.lock.json',{'commit':'0'*40,'assets':[{'path':p,'local_sha256':hashlib.sha256(b'{}').hexdigest()} for p in paths]})
    def tearDown(self):self.tmp.cleanup()
    def test_main_and_generated_both_compared(self):
        with zipfile.ZipFile(self.jar,'w') as z:z.writestr('assets/example/a.json','{}');z.writestr('assets/example/b.json','{}')
        r=compare(self.root,self.jar);self.assertTrue(r['all_selected_resources_equal']);self.assertEqual(r['selected_resource_count'],2)
    def test_missing_generated_file_fails(self):
        with zipfile.ZipFile(self.jar,'w') as z:z.writestr('assets/example/a.json','{}')
        self.assertFalse(compare(self.root,self.jar)['all_selected_resources_equal'])
    def test_changed_resource_fails(self):
        with zipfile.ZipFile(self.jar,'w') as z:z.writestr('assets/example/a.json','{}');z.writestr('assets/example/b.json','[]')
        self.assertFalse(compare(self.root,self.jar)['all_selected_resources_equal'])


class ProjectLinkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory();cls.root=Path(cls.tmp.name)/'project'
        shutil.copytree(ROOT,cls.root,ignore=shutil.ignore_patterns('dist','previews','editor','tests','__pycache__'))
        # Editing models needed for reference checks, not their textures duplicated in memory.
        shutil.copytree(ROOT/'editor',cls.root/'editor')
    @classmethod
    def tearDownClass(cls):cls.tmp.cleanup()
    @contextmanager
    def change(self,rel,mutate):
        path=self.root/rel;raw=path.read_bytes();doc=read(path);mutate(doc);dump(path,doc)
        try:yield
        finally:path.write_bytes(raw)
    def test_registry_deterministic(self):
        self.assertEqual(compile_registry(self.root),read(self.root/'interfaces/asset-registry.json'))
    def test_all_links_valid(self):self.assertEqual(validate(self.root)['failed'],0)
    def test_stale_registry_detected(self):
        with self.change('VisualLab_BP/blocks/wine_1.json',lambda d:d['minecraft:block']['components']['minecraft:material_instances']['*'].update(render_method='blend')):
            self.assertGreater(validate(self.root)['failed'],0)
    def test_missing_texture_detected(self):
        p=self.root/'RP/textures/kaleidoscope_tavern/block/brew/wine.png';bak=p.with_suffix('.bak');p.rename(bak)
        try:self.assertGreater(validate(self.root)['failed'],0)
        finally:bak.rename(p)
    def test_missing_explicit_inventory_binding_detected(self):
        with self.change('VisualLab_BP/blocks/wine_1.json',lambda d:d['minecraft:block']['components'].pop('minecraft:item_visual')):
            self.assertGreater(validate(self.root)['failed'],0)
    def test_bridge_missing_type_detected(self):
        with self.change('config.json',lambda d:d.pop('type')):
            self.assertGreater(validate(self.root)['failed'],0)
    def test_wrong_render_controller_alias_detected(self):
        path='RP/render_controllers/static.render_controllers.json'
        with self.change(path,lambda d:d['render_controllers']['controller.render.kt_assets_a1.static'].update(textures=['Texture.not_real'])):
            self.assertGreater(validate(self.root)['failed'],0)
    def test_binding_survives_full_rebuild(self):
        with tempfile.TemporaryDirectory() as tmp:
            project=Path(tmp)/'bound-project'
            shutil.copytree(self.root,project,ignore=shutil.ignore_patterns('__pycache__'))
            package=Path(tmp)/'SYNTHETIC-Cookery.mcaddon';archive(package);report=inspect(package)
            apply_report(project,report)
            result=subprocess.run([sys.executable,str(project/'tools/build_assets.py'),'--force'],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            for role,folder in [('behavior','VisualLab_BP'),('resource','RP')]:
                self.assertIn({'uuid':report[role]['uuid'],'version':[1,0,5]},read(project/folder/'manifest.json')['dependencies'])
                self.assertEqual(read(project/folder/'manifest.json')['header']['version'],[0,18,0])
            self.assertEqual(validate(project)['failed'],0)
    def test_production_packaging_refuses_before_writing_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            result=subprocess.run([sys.executable,str(self.root/'tools/package_assets.py'),'--profile','production','--out',tmp],capture_output=True,text=True)
            self.assertEqual(result.returncode,2,result.stderr)
            self.assertEqual(list(Path(tmp).rglob('*.mcaddon')),[])
    def test_production_gate_stays_closed(self):
        from release_gate import evaluate
        r=evaluate(self.root,'production');self.assertFalse(r['allowed']);codes={b['code'] for b in r['blockers']}
        self.assertIn('COOKERY_UNBOUND',codes);self.assertIn('GAMEPLAY_NOT_IMPLEMENTED',codes);self.assertIn('ENGINE_ACCEPTANCE_NOT_RUN',codes)

if __name__=='__main__':unittest.main(verbosity=2)
