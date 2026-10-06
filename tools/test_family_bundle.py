import contextlib,io,json,tempfile,unittest
from pathlib import Path
from family_bundle import assemble,files_hash,read_definition

class PreservedDependencyTests(unittest.TestCase):
 def test_reviewed_interleaving_controls_world_refs_receipt_and_effective_priority(self):
  import zipfile,hashlib
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);preserved=[];official=[];archive=root/'author.mcaddon'
   with zipfile.ZipFile(archive,'w') as z:
    for uid,side in [('host-b','data'),('host-r','resources')]:
     manifest={'header':{'uuid':uid,'version':[1,0,0]},'modules':[{'type':side}]}
     official.append({'uuid':uid,'version':[1,0,0]})
     z.writestr(uid+'/manifest.json',json.dumps(manifest))
     kind='minecraft:entity' if side=='data' else 'minecraft:client_entity'
     z.writestr(uid+'/overlap.json',json.dumps({kind:{'description':{'identifier':'external:overlap'}}}))
   for uid,side in [('late-b','data'),('first-r','resources'),('first-b','data'),('late-r','resources')]:
    path=root/uid;path.mkdir();preserved.append(path)
    (path/'manifest.json').write_text(json.dumps({'header':{'uuid':uid,'version':[1,0,0]},'modules':[{'type':side}]}))
    kind='minecraft:entity' if side=='data' else 'minecraft:client_entity'
    (path/'overlap.json').write_text(json.dumps({kind:{'description':{'identifier':'external:overlap'}}}))
   order={'behavior':['first-b','host-b','late-b'],'resource':['first-r','host-r','late-r']}
   lock={'owned':[],'upstream':[{'name':'host','sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'project_id':1,'file_id':2,'packs':official}],'order':{'behavior':['host-b'],'resource':['host-r']}}
   original=json.loads(json.dumps(lock));reviewed=json.loads(json.dumps(order))
   with contextlib.redirect_stdout(io.StringIO()):receipt=assemble(lock,{},[archive],root/'out',preserved=preserved,reviewed_order=order)
   self.assertEqual(lock,original);self.assertEqual(order,reviewed);self.assertEqual(receipt['order'],reviewed)
   for side in order:
    refs=json.loads((root/'out'/('world_'+side+'_packs.json')).read_text())
    self.assertEqual([ref['pack_id'] for ref in refs],order[side])
   overlaps=receipt['definition_overlaps'];self.assertEqual(len(overlaps),4)
   self.assertEqual({row['effective_uuid'] for row in overlaps},{'first-b','first-r'})
   self.assertFalse(receipt['production_ready'])
 def test_reviewed_order_rejects_unknown_missing_duplicate_and_wrong_side(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);pack=root/'pack';pack.mkdir()
   (pack/'manifest.json').write_text(json.dumps({'header':{'uuid':'a','version':[1,0,0]},'modules':[{'type':'data'}]}))
   lock={'owned':[],'upstream':[],'order':{'behavior':[],'resource':[]}}
   cases=[{'behavior':['unknown'],'resource':[]},{'behavior':[],'resource':[]},{'behavior':['a','a'],'resource':[]},{'behavior':[],'resource':['a']},{'behavior':['a']}]
   for index,order in enumerate(cases):
    with self.subTest(order=order),self.assertRaises(SystemExit):
     assemble(lock,{},[],root/('out'+str(index)),preserved=[pack],reviewed_order=order)
 def test_competing_behavior_players_fail_and_single_definition_is_receipted(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);packs=[]
   for uid in ['a','b']:
    p=root/uid;p.mkdir();packs.append(p)
    (p/'manifest.json').write_text(json.dumps({'header':{'uuid':uid,'version':[1,0,0]},'modules':[{'type':'data'}]}))
    (p/'player.json').write_text(json.dumps({'minecraft:entity':{'description':{'identifier':'minecraft:player'}}}))
   lock={'owned':[],'upstream':[],'order':{'behavior':[],'resource':[]}}
   with self.assertRaisesRegex(SystemExit,'competing behavior minecraft:player'):
    assemble(lock,{},[],root/'conflict',preserved=packs)
   with contextlib.redirect_stdout(io.StringIO()):r=assemble(lock,{},[],root/'single',preserved=packs[:1])
   self.assertEqual(r['behavior_player_definition']['uuid'],'a')
   self.assertEqual(r['behavior_player_definition']['sha256'],files_hash(packs[0])['player.json'])
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
 def test_freezer_storage_is_additive_and_other_blocks_or_capabilities_fail(self):
  import hashlib,copy
  from host_extensions import apply_host_extension
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);own=root/'own';host=root/'host';own.mkdir();(host/'blocks/kitchen').mkdir(parents=True)
   name='blocks/kitchen/freezer.json';p=host/name
   original={'minecraft:block':{'description':{'identifier':'kaleidoscope_chinesefood:freezer'},'components':{}}}
   before=json.dumps(original,indent=2)+'\n';p.write_text(before)
   native={'container':{'slot_count':54},'dynamic_properties':True};changed=copy.deepcopy(original);changed['minecraft:block']['components']['minecraft:block_entity']=native
   h=lambda x:hashlib.sha256(x.encode()).hexdigest();op={'path':name,'pointer':['minecraft:block','components','minecraft:block_entity'],'value':native}
   spec={'schema':1,'id':'own:freezer','version':[1,0,0],'expires':'2099-01-01','feedback':'report','authorization':'repair','removal_condition':'author restores storage','archive_sha256':'pinned','original_files':{name:h(before)},'patched_files':{name:h(json.dumps(changed,ensure_ascii=False,indent=2)+'\n')},'insertions':[],'imports':{},'copies':{},'json_updates':[op]}
   for value in [{'container':{'slot_count':999}},True]:
    with self.assertRaises(ValueError):apply_host_extension({**spec,'json_updates':[{**op,'value':value}]},own,host,{'owner':'upstream','archive_sha256':'pinned'})
    self.assertEqual(p.read_text(),before)
   apply_host_extension(spec,own,host,{'owner':'upstream','archive_sha256':'pinned'})
   self.assertEqual(json.loads(p.read_text()),changed)
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


class RecoveryCapabilityTests(unittest.TestCase):
 def test_recovery_is_pinned_and_cannot_replace_identity_or_freezers(self):
  import copy,hashlib
  from host_extensions import apply_host_extension
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);host=root/'host';own=root/'own';own.mkdir();(host/'blocks').mkdir(parents=True)
   name='blocks/jar.json';path=host/name;value={'minecraft:block':{'description':{'identifier':'kaleidoscope_chinesefood:pickle_jar'},'components':{'minecraft:tick':{'interval_range':[20,20]}}}}
   raw=json.dumps(value,ensure_ascii=False,indent=2)+'\n';path.write_text(raw)
   changed=copy.deepcopy(value);changed['minecraft:block']['components']['minecraft:tick']={'interval_range':[8,8]}
   h=lambda text:hashlib.sha256(text.encode()).hexdigest();pin='63bd2eb2ee2819c985d7c484df633c913cbb995abf3162aa68c997c24ef607f2'
   op={'path':name,'pointer':['minecraft:block','components','minecraft:tick'],'value':{'interval_range':[8,8]},'mode':'reviewed_set'}
   spec={'schema':1,'kind':'chinesefood-reviewed-repairs','id':'own:recovery','version':[1,0,0],'host_uuid':'b3c9db76-4ae6-4986-a380-90a4025d95a9','expires':'2099-01-01','feedback':'review','authorization':'user restoration','removal_condition':'author implements equivalent','archive_sha256':pin,'original_files':{name:h(raw)},'patched_files':{name:h(json.dumps(changed,ensure_ascii=False,indent=2)+'\n')},'imports':{},'insertions':[],'copies':{},'json_updates':[op]}
   source={'owner':'upstream_extended','archive_sha256':pin}
   for pointer in [None,[],['minecraft:block','description','identifier'],['minecraft:block','components','minecraft:block_entity']]:
    bad={**spec,'json_updates':[{**op,'pointer':pointer}]}
    with self.assertRaises(ValueError):apply_host_extension(bad,own,host,source)
    self.assertEqual(path.read_text(),raw)
   with self.assertRaises(ValueError):apply_host_extension({**spec,'host_uuid':'wrong'},own,host,source)
   apply_host_extension(spec,own,host,source);self.assertEqual(json.loads(path.read_text()),changed)
 def test_dough_profile_rejects_unrelated_files_and_capabilities(self):
  from host_extensions import apply_host_extension
  pin='9e5b617cc4c7a08ecd429fb9e42ec10e8d40a1ed5fc1f6f6687c3aff8a45a5d5'
  spec={'schema':1,'kind':'cookery-mooncake-dough-repair','id':'own:dough','version':[1,0,0],'host_uuid':'d322809c-a51e-4742-bfc4-16d3c1491c9d','expires':'2099-01-01','feedback':'review','authorization':'restore','removal_condition':'author fixes','archive_sha256':pin,'original_files':{'scripts/unrelated.js':'x'},'patched_files':{},'imports':{},'insertions':[],'copies':{}}
  with tempfile.TemporaryDirectory() as tmp:
   with self.assertRaisesRegex(ValueError,'unexpected file inventory'):apply_host_extension(spec,Path(tmp),Path(tmp),{'owner':'upstream_extended','archive_sha256':pin})

if __name__=='__main__':unittest.main()
