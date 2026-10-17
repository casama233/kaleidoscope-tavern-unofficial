"""Synthetic same-host-copy tests keep author/private model bodies out of Git."""
import copy,hashlib,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import held_geometry_extension as repair
import stable_host_profiles as stable
from host_extensions import apply_host_extension

def sha(raw):return hashlib.sha256(raw).hexdigest()
class HeldGeometryAdmission(unittest.TestCase):
 def setUp(self):
  t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);self.root=Path(t.name)
  self.spec={'schema':1,'kind':repair.KIND,'id':'senluo:'+repair.KIND,'version':[1,0,1],'owner_version':[1,0,50],
    'host_uuid':'synthetic','archive_sha256':'archive','expires':'2099-01-01','official_author_release':False,
    'authorization':'reviewed','feedback':'reviewed','removal_condition':'upstream fix',
    'original_files':{},'patched_files':{},'host_copies':{},'imports':{},'insertions':[],'text_replacements':[],'copies':{},'json_updates':[]}
  for dst,src in repair.PATHS.items():
   def model(v):return json.dumps({'minecraft:geometry':[{'description':{'identifier':src},'value':v}]}).encode()
   for name,data in [(dst,model(0)),(src,model(1))]:
    p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
   self.spec['original_files'][dst]=sha(model(0));self.spec['patched_files'][dst]=sha(model(1));self.spec['host_copies'][dst]={'source':src,'sha256':sha(model(1))}
  self.profile={'id':self.spec['id'],'host_uuid':'synthetic','archive_sha256':'archive','owner_version':[1,0,50],
   'spec_sha256':stable.declaration_sha(self.spec),'source_owner':'upstream','required_extensions':[],'copies':{}}
  cat={'profiles':{'fixture':self.profile},'public_api_profile':{'id':'other','host_uuid':'other'}}
  for p in [patch.object(stable,'PROFILES',cat['profiles']),patch.object(stable,'CATALOG',cat)]:p.start();self.addCleanup(p.stop)
  self.source={'owner':'upstream','archive_sha256':'archive'}
 def apply(self):return apply_host_extension(self.spec,self.root,self.root,self.source)
 def reject(self):
  before={p:p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
  with self.assertRaises(ValueError):self.apply()
  self.assertEqual(before,{p:p.read_bytes() for p in self.root.rglob('*') if p.is_file()})
 def test_exact_copies_preserve_source_and_ids(self):
  self.apply()
  for dst,src in repair.PATHS.items():self.assertEqual((self.root/dst).read_bytes(),(self.root/src).read_bytes())
 def test_failed_last_source_does_not_write_first_target(self):
  (self.root/list(repair.PATHS.values())[-1]).write_bytes(b'changed');self.reject()
 def test_failed_last_target_does_not_write_first_target(self):
  (self.root/list(repair.PATHS)[-1]).write_bytes(b'changed');self.reject()
 def test_changed_copy_declaration_rejected(self):
  self.spec['host_copies'][next(iter(repair.PATHS))]['source']='elsewhere';self.reject()
 def test_reject_host_source_and_owner_drift(self):
  self.source['owner']='upstream_extended';self.reject()
  self.source['owner']='upstream';self.spec['owner_version']=[1,0,51];self.reject()
 def test_symlink_rejected(self):
  p=self.root/next(iter(repair.PATHS));q=p.with_suffix('.saved');p.rename(q);p.symlink_to(q);self.reject()
 def test_owner_gate(self):
  repair.validate_held_geometry_owner({'repository':'local/senluo-amw-cuisine','version':[1,0,50]},self.spec)
  with self.assertRaises(ValueError):repair.validate_held_geometry_owner({'repository':'foreign','version':[1,0,50]},self.spec)
if __name__=='__main__':unittest.main()
