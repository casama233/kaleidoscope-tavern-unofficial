"""Synthetic fail-closed admission tests; no private host payload is published."""
import copy
import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import millstone_extension as repair
import stable_host_profiles as stable
from host_extensions import apply_host_extension

def digest(raw):return hashlib.sha256(raw).hexdigest()

class MillstoneAdmission(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        self.root=Path(temp.name);self.path=self.root/repair.PATH
        self.path.parent.mkdir(parents=True)
        original=b'guard1 guard2 guard3\nfunction target() {}\n'
        self.expected=b'fixed1 fixed2 fixed3\nhelper\nfunction target() {}\n'
        self.path.write_bytes(original)
        self.spec={'schema':1,'kind':repair.KIND,'id':'senluo:'+repair.KIND,
            'version':[1,0,1],'owner_version':[1,0,50],'host_uuid':'host',
            'archive_sha256':'archive','expires':'2099-01-01','authorization':'reviewed',
            'feedback':'reviewed','removal_condition':'upstream fix',
            'original_files':{repair.PATH:digest(original)},'patched_files':{repair.PATH:digest(self.expected)},
            'imports':{},'copies':{},'json_updates':[],
            'text_replacements':[dict(path=repair.PATH,before=f'guard{i}',after=f'fixed{i}') for i in range(1,4)],
            'insertions':[dict(path=repair.PATH,anchor='function target()',position='before',text='helper\n')]}
        self.receipt={'id':'public','version':[1],'original_files':{},'patched_files':{},'copies':{}}
        self.profile={'id':self.spec['id'],'host_uuid':'host','archive_sha256':'archive','owner_version':[1,0,50],
            'spec_sha256':stable.declaration_sha(self.spec),'source_owner':'upstream_extended','required_extensions':['public-api'],'copies':{}}
        catalog={'profiles':{'synthetic':self.profile},'public_api':self.receipt,'public_api_profile':{'id':'other','host_uuid':'other'}}
        for p in [patch.object(repair,'PREIMAGE',digest(original)),patch.object(repair,'POSTIMAGE',digest(self.expected)),
                  patch.object(stable,'PROFILES',catalog['profiles']),patch.object(stable,'CATALOG',catalog)]:
            p.start();self.addCleanup(p.stop)
        self.source={'owner':'upstream_extended','archive_sha256':'archive','reviewed_extensions':[copy.deepcopy(self.receipt)]}
    def apply(self):return apply_host_extension(self.spec,self.root,self.root,self.source)
    def reject(self):
        before=self.path.read_bytes()
        with self.assertRaises(ValueError):self.apply()
        self.assertEqual(before,self.path.read_bytes())
    def test_exact_output_and_receipt(self):
        proof=self.apply();self.assertEqual(self.path.read_bytes(),self.expected);self.assertEqual(proof['owner_version'],[1,0,50])
    def test_reject_second_application(self):self.apply();self.reject()
    def test_reject_changed_declaration(self):self.spec['text_replacements'][0]['after']='unexpected';self.reject()
    def test_reject_missing_preceding_api(self):self.source['reviewed_extensions']=[];self.reject()
    def test_reject_changed_preimage(self):self.path.write_bytes(self.path.read_bytes()+b'changed');self.reject()
    def test_reject_wrong_output_pin(self):
        with patch.object(repair,'POSTIMAGE','0'*64):self.reject()
    def test_reject_symlink(self):
        other=self.path.with_suffix('.original');self.path.rename(other);self.path.symlink_to(other);self.reject()
    def test_reject_wrong_owner_and_expiry(self):
        self.spec['owner_version']=[1,0,51];self.reject()
        self.spec['owner_version']=[1,0,50];self.spec['expires']='2000-01-01';self.reject()
    def test_owner_admission(self):
        repair.validate_millstone_owner({'repository':'local/senluo-amw-cuisine','version':[1,0,50]},self.spec)
        for config in [{'repository':'other','version':[1,0,50]},{'repository':'local/senluo-amw-cuisine','version':[1,0,51]}]:
            with self.assertRaises(ValueError):repair.validate_millstone_owner(config,self.spec)

if __name__=='__main__':unittest.main()
