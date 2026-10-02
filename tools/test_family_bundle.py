import contextlib,io,json,tempfile,unittest
from pathlib import Path
from family_bundle import assemble,files_hash,read_definition

class PreservedDependencyTests(unittest.TestCase):
 def test_preserved_jsonc_bytes_and_complete_dependency_closure(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);a=root/'a';b=root/'b';a.mkdir();b.mkdir()
   am={'header':{'uuid':'a','version':[1,0,0]},'modules':[{'type':'data'}],'dependencies':[{'uuid':'b','version':[1,0,0]}]}
   bm={'header':{'uuid':'b','version':[1,0,0]},'modules':[{'type':'resources'}]}
   (a/'manifest.json').write_text(json.dumps(am));(b/'manifest.json').write_text(json.dumps(bm))
   (a/'entity.json').write_text('// preserved author bytes\n{"minecraft:entity":{"description":{"identifier":"external:test","text":"literal ,} // text",},},}')
   lock={'owned':[],'upstream':[],'order':{'behavior':[],'resource':[]}}
   with contextlib.redirect_stdout(io.StringIO()):r=assemble(lock,{},[],root/'candidate',preserved=[a,b])
   self.assertEqual(files_hash(a),files_hash(root/'candidate/behavior_packs/a'));self.assertEqual(len(r['packs']),2)
   self.assertFalse(r['production_ready'])
   with self.assertRaises(SystemExit):assemble(lock,{},[],root/'missing-dependency',preserved=[a])
 def test_jsonc_does_not_rewrite_text_tokens(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'x.json';p.write_text('{"text":"/* quoted */ ,} // quoted", /* comment */ "list":[1,2,],}')
   self.assertEqual(read_definition(p,True),{'text':'/* quoted */ ,} // quoted','list':[1,2]})
   with self.assertRaises(json.JSONDecodeError):read_definition(p,False)

class ReviewedHostExtensionTests(unittest.TestCase):
 def test_exact_insertions_copies_and_immutable_author_identity(self):
  import hashlib
  from host_extensions import apply_host_extension
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);own=root/'own';host=root/'host';(own/'scripts').mkdir(parents=True);(host/'scripts').mkdir(parents=True)
   p=host/'scripts/entry.js';p.write_text('function run(){return 1;}\n');(own/'scripts/api.js').write_text('export const api=1;\n')
   h=lambda x:hashlib.sha256(x.encode()).hexdigest()
   spec={'schema':1,'id':'own:api','version':[0,1,0],'expires':'2099-01-01','feedback':'docs/proposal.md','authorization':'explicit request','removal_condition':'author adopts API','original_files':{'scripts/entry.js':h(p.read_text())},'patched_files':{'scripts/entry.js':h('function run(){api();return 1;}\n')},'imports':{},'insertions':[{'path':'scripts/entry.js','anchor':'function run(){','position':'after','text':'api();'}],'copies':{'scripts/api.js':'scripts/api.js'},'archive_sha256':'pinned'}
   source={'owner':'upstream','archive_sha256':'pinned'}
   for key,bad in [('expires','2000-01-01'),('archive_sha256','wrong')]:
    broken={**spec,key:bad}
    with self.assertRaises(ValueError):apply_host_extension(broken,own,host,source)
   broken={**spec,'copies':{'../secrets.js':'scripts/api.js'}}
   with self.assertRaises(ValueError):apply_host_extension(broken,own,host,source)
   # Failed path validation must happen before mutations (use a fresh host below).
   p.write_text('function run(){return 1;}\n')
   proof=apply_host_extension(spec,own,host,source)
   self.assertEqual(proof['version'],[0,1,0]);self.assertEqual(p.read_text(),'function run(){api();return 1;}\n');self.assertEqual((host/'scripts/api.js').read_bytes(),(own/'scripts/api.js').read_bytes())
   with self.assertRaises(ValueError):apply_host_extension(spec,own,host,source)

class AdditiveHostItemCapabilityTests(unittest.TestCase):
 def test_only_pinned_additive_offhand_capability_is_accepted(self):
  import hashlib,copy
  from host_extensions import apply_host_extension
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);own=root/'own';host=root/'host';own.mkdir();(host/'items').mkdir(parents=True)
   p=host/'items/pot.json';original={'minecraft:item':{'description':{'identifier':'author:pot'},'components':{'minecraft:max_stack_size':1}}};before=json.dumps(original,indent=2)+'\n';p.write_text(before)
   changed=copy.deepcopy(original);changed['minecraft:item']['components']['minecraft:allow_off_hand']=True
   h=lambda text:hashlib.sha256(text.encode()).hexdigest();name='items/pot.json'
   op={'path':name,'pointer':['minecraft:item','components','minecraft:allow_off_hand'],'value':True}
   spec={'schema':1,'id':'own:api','version':[0,2,0],'expires':'2099-01-01','feedback':'docs/proposal.md','authorization':'explicit request','removal_condition':'author adds capability','archive_sha256':'pinned','original_files':{name:h(before)},'patched_files':{name:h(json.dumps(changed,ensure_ascii=False,indent=2)+'\n')},'imports':{},'insertions':[],'copies':{},'json_updates':[op]}
   source={'owner':'upstream','archive_sha256':'pinned'}
   for pointer,value in [(['minecraft:item','components','minecraft:max_stack_size'],64),(op['pointer'],False)]:
    bad={**spec,'json_updates':[{**op,'pointer':pointer,'value':value}]}
    with self.assertRaises(ValueError):apply_host_extension(bad,own,host,source)
    self.assertEqual(p.read_text(),before)
   proof=apply_host_extension(spec,own,host,source);self.assertEqual(proof['version'],[0,2,0]);self.assertEqual(json.loads(p.read_text()),changed)

if __name__=='__main__':unittest.main()
