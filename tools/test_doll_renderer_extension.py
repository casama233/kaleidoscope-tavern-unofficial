"""Scoped renderer repair retains original assets and advances client cache identity."""
import copy,hashlib,json,tempfile,unittest
from pathlib import Path
from doll_renderer_extension import BP,RP,ARCHIVE,cleanup_blocks,patch_manifests,apply_renderer_extension

class RendererTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.bp=self.root/'BP';self.rp=self.root/'RP';self.version=[1,0,12]
  def write(p,obj):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
  self.write=write
  for root,uid,other in [(self.bp,BP,RP),(self.rp,RP,BP)]:write(root/'manifest.json',{'header':{'uuid':uid,'version':[1,0,4],'name':'Author','min_engine_version':[1,26,30]},'modules':[{'uuid':uid+'module','version':[1,0,4],'type':'data'}],'dependencies':[{'uuid':other,'version':[1,0,4]},{'module_name':'unchanged','version':'2.7.0'}]})
  blocks={'format_version':[1,1,0],'untouched:block':{'sound':'stone','textures':'other'}};terrain={};models=[]
  for i in range(1,7):
   ident='kaleidoscope_chinesefood:doll_'+str(i);alias='kcf_block_doll_'+str(i);geometry='geometry.doll_'+str(i);blocks[ident]={'sound':'cloth','textures':alias};terrain[alias]={'textures':'textures/blocks/doll_'+str(i)};models.append({'description':{'identifier':geometry}})
   write(self.bp/('blocks/decor/doll_'+str(i)+'.json'),{'minecraft:block':{'description':{'identifier':ident},'components':{'minecraft:geometry':geometry,'minecraft:material_instances':{'*':{'texture':alias}}}}})
  write(self.rp/'blocks.json',blocks);write(self.rp/'textures/terrain_texture.json',{'texture_data':terrain});write(self.rp/'models/dolls.json',{'minecraft:geometry':models})
  manifests=patch_manifests(json.loads((self.bp/'manifest.json').read_text()),json.loads((self.rp/'manifest.json').read_text()),[1,0,10412],self.version)
  self.originals={'BP/manifest.json':self.bp/'manifest.json','RP/manifest.json':self.rp/'manifest.json','RP/blocks.json':self.rp/'blocks.json'};values={'BP/manifest.json':manifests[0],'RP/manifest.json':manifests[1],'RP/blocks.json':cleanup_blocks(blocks)}
  sha=lambda raw:hashlib.sha256(raw).hexdigest();self.spec={'schema':1,'kind':'chinesefood-doll-renderer-cleanup','id':'cleanup','host_uuid':RP,'behavior_uuid':BP,'owner_version':self.version,'local_pack_version':[1,0,10412],'archive_sha256':ARCHIVE,'expires':'2099-01-01','removal_condition':'author repair','feedback':'reviewed report','authorization':'user instruction','original_files':{n:sha(p.read_bytes()) for n,p in self.originals.items()},'patched_files':{n:sha((json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()) for n,v in values.items()}}
  self.source={'owner':'upstream','archive_sha256':ARCHIVE}
 def apply(self):return apply_renderer_extension(self.spec,self.bp,self.rp,self.source,self.source,self.version)
 def test_only_duplicate_textures_and_paired_cache_metadata_change(self):
  original={p:p.read_bytes() for p in self.root.rglob('*') if p.is_file()};self.apply();changed={p for p,raw in original.items() if p.read_bytes()!=raw};self.assertEqual(changed,set(self.originals.values()))
  blocks=json.loads((self.rp/'blocks.json').read_text());self.assertEqual(blocks['untouched:block'],{'sound':'stone','textures':'other'})
  for i in range(1,7):self.assertEqual(blocks['kaleidoscope_chinesefood:doll_'+str(i)],{'sound':'cloth'})
  for root,uid,other in [(self.bp,BP,RP),(self.rp,RP,BP)]:
   manifest=json.loads((root/'manifest.json').read_text());self.assertEqual(manifest['header']['uuid'],uid);self.assertEqual(manifest['header']['version'],[1,0,10412]);self.assertIn('作者原版 1.0.4',manifest['header']['name']);self.assertEqual(manifest['dependencies'][0],{'uuid':other,'version':[1,0,10412]});self.assertEqual(manifest['dependencies'][1]['version'],'2.7.0')
 def test_renderer_variant_cannot_reuse_another_owner_release(self):
  self.spec['local_pack_version']=[1,0,10411]
  with self.assertRaisesRegex(ValueError,'advance'):self.apply()
 def test_clean_original_preimages_are_required(self):
  (self.rp/'blocks.json').write_text('{}')
  with self.assertRaisesRegex(ValueError,'original'):self.apply()
 def test_missing_original_geometry_binding_is_rejected_before_writes(self):
  before=(self.rp/'manifest.json').read_bytes();self.write(self.rp/'models/dolls.json',{'minecraft:geometry':[]})
  with self.assertRaisesRegex(ValueError,'binding'):self.apply()
  self.assertEqual(before,(self.rp/'manifest.json').read_bytes())
 def test_identity_dependency_and_extra_paths_are_rejected(self):
  self.spec['host_uuid']='foreign'
  with self.assertRaisesRegex(ValueError,'target'):self.apply()
  self.spec['host_uuid']=RP;self.spec['original_files']['script.js']='foreign'
  with self.assertRaisesRegex(ValueError,'inventory'):self.apply()
 def test_expired_unpinned_and_unreviewed_output_are_rejected(self):
  self.spec['expires']='2000-01-01'
  with self.assertRaisesRegex(ValueError,'expired'):self.apply()
  self.spec['expires']='2099-01-01';self.source['archive_sha256']='unknown'
  with self.assertRaisesRegex(ValueError,'pinned'):self.apply()
  self.source['archive_sha256']=ARCHIVE;self.spec['patched_files']['RP/blocks.json']='unreviewed'
  with self.assertRaisesRegex(ValueError,'output'):self.apply()
 def test_arbitrary_legacy_entries_are_not_rewritten(self):
  with self.assertRaises(ValueError):cleanup_blocks({'other:block':{'textures':'other'}})

if __name__=='__main__':unittest.main()
