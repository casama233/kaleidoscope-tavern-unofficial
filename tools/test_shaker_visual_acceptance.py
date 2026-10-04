"""SYNTHETIC UNIT fixtures only; never a native player/visual acceptance.

Positive assertions exercise pure binding/coverage/decoder-format helpers, not
production admission. Full production validation rejects these fixture records.
"""
import copy,json,shutil,subprocess,sys,tempfile,unittest,uuid
from pathlib import Path
from unittest.mock import patch
from PIL import Image
import shaker_visual_evidence as v

FIXTURE_KIND='synthetic_unit_fixture'
BP='11111111-1111-4111-8111-111111111111';RP='22222222-2222-4222-8222-222222222222'
def write(path,value):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value),encoding='utf-8',newline='\n')
def unit_case():
 """Internal arithmetic fixture; no production receipt or real client claim."""
 cid='classic:original:60:fp:level:standing';expected=v.required_cases()[cid]
 settings={'fov_low':35,'fov_high':110,'wide_viewport':[1180,663],'view_bobbing':True,'dynamic_fov':True}
 video_id=str(uuid.uuid4());media={video_id:{'kind':'native_recording','sha256':'a'*64,
  'pts':[i/60 for i in range(400)],'width':1180,'height':792}}
 case={'id':cid,'outcome':'observed_pass','context':{'skin':'classic','view':'fp','pitch':'level','motion':'standing',
  'viewport':[1180,792],'viewport_rect':[0,0,1180,792],'world_fov':60,'family_contract_sha256':'f'*64,
  'hand':'main_right','graphics_mode':'standard','view_bobbing':True,'dynamic_fov':True},
  'video_id':video_id,'frame_range':[0,399],'reviewed_intervals':[[0,399]],'reviewed_frame_count':400,
  'segments':{'idle':[0,59],'use_start':[60,61],'shaking':[62,242],'return_idle':[243,399],
              'cancel':[250,260],'natural_completion':[270,280],'re_equip':[290,300]},
  'review':{'reviewer_id':'r001','findings':{k:'observed_pass' for k in v.FINDINGS},
             'edge_gaps_px':{k:12 for k in ('left','right','top','bottom')},'measurement_uncertainty_px':1},'frame_refs':[]}
 for role in v.ROLES:
  eid=str(uuid.uuid4());index={'use_entry':60,'shake_sample':100,'return_idle':250}.get(role,1)
  media[eid]={'kind':'raw_video_frame','sha256':'b'*64,'video_id':video_id,'frame_index':index}
  case['frame_refs'].append({'role':role,'evidence_id':eid})
 return case,expected,settings,media

class SyntheticVisualCoreTests(unittest.TestCase):
 def test_fixed_matrix_cannot_be_self_reduced(self):
  self.assertEqual(len(v.required_cases()),216)
  self.assertIn('slim:wide:high:tp_rear:down_limit:walking',v.required_cases())
  pending=v.pending_template();self.assertEqual(len(pending['cases']),216)
  self.assertTrue(all(c['outcome']=='not_run' for c in pending['cases']))
 def test_complete_internal_case_and_coverage(self):
  case,expected,settings,media=unit_case()
  result=v.case_observations(case,expected,settings,'f'*64,media)
  self.assertEqual(result['reviewed_frames'],400);self.assertNotIn('path',json.dumps(result))
 def test_failure_pending_flags_and_absent_findings_block(self):
  for status in ('fail','inconclusive','not_run','missing',True,None):
   case,e,s,m=unit_case();case['outcome']=status
   with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
  case,e,s,m=unit_case();case['review']['findings']['contour']='inconclusive'
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
 def test_each_context_dimension_is_bound(self):
  for key,value in (('skin','slim'),('view','tp_front'),('motion','walking'),('pitch','up_limit'),
                    ('world_fov',70),('viewport',[1920,1080]),('hand','off_hand'),('family_contract_sha256','0'*64)):
   case,e,s,m=unit_case();case['context'][key]=value
   with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
 def test_missing_video_contactsheet_and_raw_frame_links_block(self):
  case,e,s,m=unit_case();m[case['video_id']]['kind']='contact_sheet'
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
  case,e,s,m=unit_case();case['frame_refs'].pop()
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
  case,e,s,m=unit_case();m[case['frame_refs'][0]['evidence_id']]['video_id']='other'
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
 def test_gapped_overlapping_count_and_sparse_capture_block(self):
  for spans in ([[0,200],[202,399]],[[0,200],[200,399]],[[0,398]],[[0,400]]):
   case,e,s,m=unit_case();case['reviewed_intervals']=spans
   with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
  case,e,s,m=unit_case();case['reviewed_frame_count']=399
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
  case,e,s,m=unit_case();m[case['video_id']]['pts']=[i/4 for i in range(400)]
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
 def test_action_order_short_shake_and_uncertain_boundary_block(self):
  case,e,s,m=unit_case();case['segments']['shaking']=[62,200]
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
  case,e,s,m=unit_case();case['segments']['use_start']=[1,2]
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
  case,e,s,m=unit_case();case['review']['edge_gaps_px']['bottom']=1
  with self.assertRaises(v.Blocked):v.case_observations(case,e,s,'f'*64,m)
 def test_cross_case_recording_reuse_blocks_even_with_aliased_ids(self):
  case,e,s,m=unit_case();second=copy.deepcopy(case)
  with self.assertRaisesRegex(v.Blocked,'overlapping_case_recording_ranges'):v.distinct_case_ranges([case,second],m)
  alias=str(uuid.uuid4());m[alias]=copy.deepcopy(m[case['video_id']]);second['video_id']=alias
  with self.assertRaises(v.Blocked):v.distinct_case_ranges([case,second],m)
  second['frame_range']=[400,799];v.distinct_case_ranges([case,second],m)
 def test_source_of_private_evidence_cannot_escape(self):
  with tempfile.TemporaryDirectory() as d:
   for path in ('../outside','/absolute','C:/private','a\\b'):
    with self.assertRaises(v.Blocked):v.private_path(d,path)
 def test_parsed_identity_hash_uses_the_same_bytes(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'unit.json';p.write_bytes(b'{"synthetic_unit":true}')
   value,identity=v.read_hashed(p)
   self.assertTrue(value['synthetic_unit']);self.assertEqual(identity,v.digest(p.read_bytes()))
 def test_duplicate_json_and_nonfinite_values_block(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'bad.json'
   for body in ('{"outcome":false,"outcome":true}','{"gap":NaN}'):
    p.write_text(body)
    with self.assertRaises(v.Blocked):v.read(p)

class SyntheticCandidateBindingTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.repo=self.root/'repo';self.repo.mkdir()
  self.command('init','-q')
  for side,uid in (('BP',BP),('RP',RP)):
   write(self.repo/'runtime'/side/'manifest.json',{'header':{'uuid':uid,'version':[0,0,1]}})
   (self.repo/'runtime'/side/'fixture.txt').write_bytes(b'SYNTHETIC UNIT DATA, NOT MINECRAFT')
  write(self.repo/'baseline.json',{'packs':{'BP':{'uuid':BP},'RP':{'uuid':RP}}})
  self.commit('synthetic unit initial');self.tested=self.command('rev-parse','HEAD').strip()
  self.receipt={'tested_commit':self.tested,'runtime_trees':{s:v.tree(v.file_rows(self.repo/'runtime'/s)) for s in ('BP','RP')}}
 def tearDown(self):self.temp.cleanup()
 def command(self,*args):
  result=subprocess.run(['git','-C',str(self.repo),*args],capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stderr);return result.stdout
 def commit(self,message):
  self.command('add','--all');self.command('-c','user.name=SyntheticUnit','-c','user.email=unit@example.invalid','commit','-qm',message)
 def test_freeze_document_successor_retains_full_identity(self):
  write(self.repo/'docs/freeze.json',{'synthetic_unit':True});self.commit('synthetic docs only')
  current,_=v.candidate_binding(self.repo,self.receipt);self.assertNotEqual(current,self.tested)
 def test_commit_ancestor_alone_and_tiny_file_changes_are_insufficient(self):
  (self.repo/'runtime/BP/fixture.txt').write_bytes(b'changed unrelated runtime')
  self.commit('synthetic runtime mutation')
  with self.assertRaises(v.Blocked):v.candidate_binding(self.repo,self.receipt)
 def test_untracked_or_dirty_runtime_bytes_block(self):
  (self.repo/'runtime/RP/new.txt').write_bytes(b'extra')
  with self.assertRaises(v.Blocked):v.candidate_binding(self.repo,self.receipt)
  (self.repo/'runtime/RP/new.txt').unlink();(self.repo/'runtime/RP/fixture.txt').write_bytes(b'edited')
  with self.assertRaises(v.Blocked):v.candidate_binding(self.repo,self.receipt)
 def test_source_successor_is_not_document_only(self):
  write(self.repo/'tools/new.json',{'unit':True});self.commit('synthetic source change')
  with self.assertRaises(v.Blocked):v.candidate_binding(self.repo,self.receipt)
 def test_unrelated_commit_and_forged_runtime_hash_block(self):
  self.receipt['tested_commit']='0'*40
  with self.assertRaises(v.Blocked):v.candidate_binding(self.repo,self.receipt)
  self.receipt['tested_commit']=self.tested;self.receipt['runtime_trees']['BP']['sha256']='a'*64
  with self.assertRaises(v.Blocked):v.candidate_binding(self.repo,self.receipt)
 def test_complete_family_files_stack_and_exports(self):
  family=self.root/'family';packs=[]
  for side,label,uid in (('BP','behavior',BP),('RP','resource',RP)):
   dest=family/(label+'_packs')/uid;dest.parent.mkdir(parents=True,exist_ok=True)
   shutil.copytree(self.repo/'runtime'/side,dest)
   packs.append({'uuid':uid,'side':label,'version':[0,0,1],'files':v.file_rows(dest)})
   write(family/('world_'+label+'_packs.json'),[{'pack_id':uid,'version':[0,0,1]}])
  source={'packs':packs,'order':{'behavior':[BP],'resource':[RP]}}
  contract=v.family_contract(source);v.verify_family(family,contract);v.bind_family_to_canonical(self.repo,contract)
  other=copy.deepcopy(source);other['source_commit']='doc-freeze-successor'
  self.assertEqual(contract,v.family_contract(other))
  (family/'resource_packs'/RP/'extra.txt').write_bytes(b'changed paired family')
  with self.assertRaises(v.Blocked):v.verify_family(family,contract)
  (family/'resource_packs'/RP/'extra.txt').unlink();write(family/'world_resource_packs.json',[])
  with self.assertRaises(v.Blocked):v.verify_family(family,contract)
  archive=self.root/'unit-export.zip';archive.write_bytes(b'SYNTHETIC UNIT EXPORT')
  wanted={'export1':v.file_hash(archive)};v.verify_exports(wanted,{'export1':archive})
  archive.write_bytes(b'changed export even if runtime same')
  with self.assertRaises(v.Blocked):v.verify_exports(wanted,{'export1':archive})
 def test_production_always_rejects_declared_synthetic_fixture(self):
  p=self.root/'unit.json';write(p,{'schema':1,'kind':FIXTURE_KIND,'passed':True})
  with self.assertRaisesRegex(v.Blocked,'synthetic_or_invalid_production_receipt'):
   v.validate(p,self.repo,None,None,None,None,{},None,None,None,None)

class SyntheticCliSafetyTests(unittest.TestCase):
 def test_rejected_summary_never_creates_missing_input_or_export(self):
  import check_shaker_visual_acceptance as cli
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);config=root/'config.json'
   fields={k:root/k for k in ('receipt','evidence_root','review_registry','family_receipt','family_root','installed_family_root')}
   fields['exports']={'export1':root/'export.zip'}
   write(config,{'schema':1,'kind':'native_visual_check_config',**{k:str(p) for k,p in fields.items() if isinstance(p,Path)},
                 'exports':{'export1':str(fields['exports']['export1'])}})
   for target in (fields['receipt'],fields['exports']['export1']):
    with patch('builtins.print'):
     self.assertEqual(cli.main(['check','--config',str(config),'--summary',str(target)]),2)
    self.assertFalse(target.exists())
 def test_top_level_true_and_relabelled_fixture_cannot_admit(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);receipt=root/'fixture.json'
   for value in ({'schema':1,'kind':FIXTURE_KIND,'passed':True},
                 {**v.pending_template(),'native_visual_scope_pass':True},
                 {**v.pending_template(),'fixture_purpose':'synthetic_unit_fixture'}):
    write(receipt,value)
    with self.assertRaises(v.Blocked):v.validate(receipt,root/'repo',None,None,None,None,{},root/'media',None,None,None)

class SyntheticDecoderAndReviewTests(unittest.TestCase):
 def test_real_file_hash_and_mock_decoder_pixel_links(self):
  # Decoder metadata is mocked SYNTHETIC UNIT output, never admitted by CLI.
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);video=root/'unit.mp4';video.write_bytes(b'SYNTHETIC UNIT NOT A VIDEO')
   image=Image.new('RGB',(2,2),(1,2,3));image.save(root/'frame.png')
   vid=str(uuid.uuid4());fid=str(uuid.uuid4())
   catalog={vid:{'kind':'native_recording','origin':'native_client_capture','path':'unit.mp4','sha256':v.file_hash(video)},
    fid:{'kind':'raw_video_frame','origin':'decoded_native_recording','path':'frame.png','sha256':v.file_hash(root/'frame.png'),'video_id':vid,'frame_index':0}}
   probe=json.dumps({'streams':[{'width':2,'height':2}],'frames':[
    {'width':2,'height':2,'best_effort_timestamp_time':'0'},
    {'width':2,'height':2,'best_effort_timestamp_time':'.02'}]}).encode()
   pixels=v.digest(image.tobytes());decoded=('#format: frame checksums\n0, 0, 0, 1, 12, '+pixels+'\n').encode()
   with patch.object(v,'run_media',side_effect=[probe,decoded]):
    result=v.decode_evidence(catalog,root,'MOCK_UNIT_PROBE','MOCK_UNIT_DECODER');self.assertEqual(result[fid]['video_id'],vid)
   with patch.object(v,'run_media',side_effect=[probe,b'0,0,0,1,12,'+b'0'*64+b'\n']):
    with self.assertRaisesRegex(v.Blocked,'raw_frame_not_from_recording'):v.decode_evidence(catalog,root,'UNIT','UNIT')
   catalog[fid]['sha256']='f'*64
   with patch.object(v,'run_media',return_value=probe):
    with self.assertRaisesRegex(v.Blocked,'evidence_hash_mismatch'):v.decode_evidence(catalog,root,'UNIT','UNIT')
 def test_missing_decoder_and_contactsheet_are_not_accepted(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'unit.png';Image.new('RGB',(2,2)).save(p)
   catalog={str(uuid.uuid4()):{'kind':'contact_sheet','path':'unit.png','sha256':v.file_hash(p)}}
   with self.assertRaises(v.Blocked):v.decode_evidence(catalog,d,'missing','missing')
   with self.assertRaises(v.Blocked):v.run_media(['ABSENT_SYNTHETIC_UNIT_EXECUTABLE'],'decoder_unavailable')
 def test_trust_registry_is_external_and_pins_exact_review(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);repo=root/'repo';repo.mkdir();evidence=root/'media';evidence.mkdir();trust=root/'trust';trust.mkdir()
   registry=trust/'registry.json';receipt_sha='a'*64;cases=[{'case_id':'unit_case','reviewer_id':'r001'}]
   write(trust/'review.json',{'schema':1,'kind':'human_native_review','receipt_sha256':receipt_sha,
    'decision':'approve_scoped_observations','reviewer_identity':'SYNTHETIC UNIT TESTER, NOT NATIVE REVIEW',
    'reviewer_id':'r001','case_ids':['unit_case'],'reviewed_at':'2020-01-01T00:00:00Z'})
   write(registry,{'schema':1,'kind':'native_review_registry','approved_reviews':{receipt_sha:
    {'record_path':'review.json','record_sha256':v.file_hash(trust/'review.json')}}})
   result=v.reviewer_binding(registry,receipt_sha,cases,repo,evidence)
   self.assertNotIn('SYNTHETIC',json.dumps(result));self.assertNotIn(str(root),json.dumps(result))
   with self.assertRaises(v.Blocked):v.reviewer_binding(registry,'b'*64,cases,repo,evidence)
   shutil.copy(registry,evidence/'registry.json')
   with self.assertRaises(v.Blocked):v.reviewer_binding(evidence/'registry.json',receipt_sha,cases,repo,evidence)

if __name__=='__main__':unittest.main()
