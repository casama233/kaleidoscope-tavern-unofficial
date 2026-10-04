"""Bounded native observations; no simulated players or camera calibration.

Production trusts an independently supplied local human-review registry. File
hashes, decoder checks and coverage bind evidence; they cannot prove that a
dishonest reviewer recorded Minecraft. Synthetic unit records are inadmissible.
"""
import datetime,hashlib,itertools,json,math,re,subprocess,uuid
from pathlib import Path,PurePosixPath

POLICY='shaker-native-visual-v1'
AXES=(('classic','slim'),('original','wide'),('low','60','high'),
      ('fp','tp_front','tp_rear'),('level','up_limit','down_limit'),('standing','walking'))
ROLES=('left_edge','right_edge','top_edge','bottom_edge','use_entry','shake_sample','return_idle',
       'skin_setting','fov_setting','viewport_setting','pack_stack')
FINDINGS=('contour','viewport','transitions','size_behavior','attachment','render_errors')
SHA=re.compile(r'[0-9a-f]{64}\Z');COMMIT=re.compile(r'[0-9a-f]{40}\Z')

class Blocked(ValueError):pass
def need(condition,code):
 if not condition:raise Blocked(code)
def digest(data):return hashlib.sha256(data).hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
def read_hashed(path):
 def unique(pairs):
  result={}
  for key,value in pairs:
   need(key not in result,'duplicate_json_key');result[key]=value
  return result
 try:
  data=Path(path).read_bytes()
  value=json.loads(data.decode('utf-8-sig'),object_pairs_hook=unique,
                  parse_constant=lambda value:(_ for _ in ()).throw(Blocked('nonfinite_json')))
  return value,digest(data)
 except (OSError,UnicodeError,json.JSONDecodeError):raise Blocked('missing_or_invalid_json') from None

def read(path):return read_hashed(path)[0]
def file_hash(path):
 need(Path(path).is_file() and not Path(path).is_symlink(),'missing_or_linked_file')
 h=hashlib.sha256()
 with Path(path).open('rb') as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def integer(v):return type(v) is int
def number(v):return type(v) in (int,float) and math.isfinite(v)
def sha(v):return isinstance(v,str) and SHA.fullmatch(v) is not None
def tree(rows):return {'sha256':digest(canonical(rows)),'files':len(rows)}
def file_rows(root):
 root=Path(root);need(root.is_dir() and not root.is_symlink(),'missing_or_linked_tree')
 rows={}
 for p in sorted(root.rglob('*')):
  need(not p.is_symlink(),'linked_tree_entry')
  if p.is_file():rows[p.relative_to(root).as_posix()]=file_hash(p)
 need(bool(rows),'empty_tree');return rows
def git(repo,*args):
 p=subprocess.run(['git','-C',str(repo),*args],capture_output=True)
 need(p.returncode==0,'git_identity_check_failed');return p.stdout
def doc_change(path):
 return path in ('baseline.json','release-history.json') or path.startswith('docs/') or path.endswith('.md')
def git_runtime(repo,commit):
 entries=git(repo,'ls-tree','-rz',commit,'--','runtime/BP','runtime/RP').split(b'\0')
 rows={'BP':{},'RP':{}}
 process=subprocess.Popen(['git','-C',str(repo),'cat-file','--batch'],stdin=subprocess.PIPE,
                          stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
 try:
  for entry in filter(None,entries):
   meta,path=entry.split(b'\t',1);mode,kind,oid=meta.split()
   need(mode in (b'100644',b'100755') and kind==b'blob','nonregular_git_runtime')
   relative=path.decode('utf-8');parts=relative.split('/',2)
   need(len(parts)==3 and parts[1] in rows,'invalid_git_runtime_path')
   process.stdin.write(oid+b'\n');process.stdin.flush()
   header=process.stdout.readline().split();need(len(header)==3 and header[1]==b'blob','git_blob_missing')
   size=int(header[2]);data=process.stdout.read(size)
   need(len(data)==size and process.stdout.read(1)==b'\n','git_blob_truncated')
   rows[parts[1]][parts[2]]=digest(data)
  process.stdin.close();need(process.wait()==0,'git_blob_reader_failed')
 finally:
  if process.poll() is None:process.kill();process.wait()
  process.stdout.close()
 need(all(rows.values()),'missing_complete_bp_rp');return rows
def candidate_binding(repo,receipt):
 tested=receipt.get('tested_commit');need(isinstance(tested,str) and COMMIT.fullmatch(tested),'missing_tested_commit')
 head=git(repo,'rev-parse','HEAD').decode().strip()
 git(repo,'merge-base','--is-ancestor',tested,head)
 changes=git(repo,'diff','--name-only',tested,head).decode().splitlines()
 need(all(doc_change(p) for p in changes),'successor_not_doc_or_freeze_only')
 dirty=git(repo,'diff','HEAD','--name-only').decode().splitlines()
 need(all(doc_change(p) for p in dirty),'uncommitted_source_change')
 expected=git_runtime(repo,tested)
 current=git_runtime(repo,head)
 need(current==expected,'git_runtime_changed_since_test')
 actual={side:file_rows(Path(repo)/'runtime'/side) for side in ('BP','RP')}
 need(actual==expected,'canonical_runtime_bytes_differ')
 fingerprints={side:tree(rows) for side,rows in actual.items()}
 need(receipt.get('runtime_trees')==fingerprints,'complete_runtime_fingerprint_mismatch')
 return head,fingerprints
def family_contract(receipt):
 need(isinstance(receipt,dict) and isinstance(receipt.get('packs'),list) and receipt['packs'],'missing_family_packs')
 packs=[];seen=set()
 for p in receipt['packs']:
  need(isinstance(p,dict) and p.get('side') in ('behavior','resource'),'invalid_family_pack')
  uid=p.get('uuid')
  try:need(str(uuid.UUID(uid))==uid,'invalid_pack_uuid')
  except (ValueError,TypeError,AttributeError):raise Blocked('invalid_pack_uuid') from None
  need(uid not in seen,'duplicate_family_pack');seen.add(uid)
  files=p.get('files');need(isinstance(files,dict) and files,'empty_family_pack')
  for name,value in files.items():
   n=PurePosixPath(name)
   need(isinstance(name,str) and not n.is_absolute() and '..' not in n.parts and '\\' not in name and sha(value),'unsafe_family_inventory')
  need(isinstance(p.get('version'),list) and len(p['version'])==3 and all(integer(x) and x>=0 for x in p['version']),'invalid_pack_version')
  packs.append({k:p[k] for k in ('uuid','side','version','files')})
 order=receipt.get('order');need(isinstance(order,dict) and set(order)=={'behavior','resource'},'invalid_family_order')
 for side in order:
  need(isinstance(order[side],list) and len(order[side])==len(set(order[side]))
       and set(order[side])=={p['uuid'] for p in packs if p['side']==side},'incomplete_family_order')
 return {'packs':sorted(packs,key=lambda p:p['uuid']),'order':order}
def verify_family(root,contract):
 root=Path(root)
 for p in contract['packs']:
  need(file_rows(root/(p['side']+'_packs')/p['uuid'])==p['files'],'family_pack_bytes_changed')
  manifest=read(root/(p['side']+'_packs')/p['uuid']/'manifest.json')
  need(manifest.get('header',{}).get('uuid')==p['uuid'] and manifest['header'].get('version')==p['version'],'family_manifest_identity_mismatch')
 for side,order in contract['order'].items():
  by_uuid={p['uuid']:p for p in contract['packs']}
  expected=[{'pack_id':uid,'version':by_uuid[uid]['version']} for uid in order]
  need(read(root/('world_'+side+'_packs.json'))==expected,'installed_stack_changed')
def bind_family_to_canonical(repo,contract):
 config=read(Path(repo)/'baseline.json')
 for side,label in (('BP','behavior'),('RP','resource')):
  uid=config['packs'][side]['uuid'];matches=[p for p in contract['packs'] if p['uuid']==uid and p['side']==label]
  need(len(matches)==1 and matches[0]['files']==file_rows(Path(repo)/'runtime'/side),'family_not_current_tavern')
def verify_exports(wanted,exports):
 need(isinstance(wanted,dict) and wanted and set(wanted)==set(exports),'missing_complete_export_bindings')
 for eid,value in wanted.items():
  need(isinstance(eid,str) and re.fullmatch(r'export[0-9]{1,4}',eid) and sha(value) and file_hash(exports[eid])==value,'export_bytes_changed')
def required_cases():
 return {':'.join(values):dict(zip(('skin','viewport','fov','view','pitch','motion'),values))
         for values in itertools.product(*AXES)}
def settings_check(settings):
 need(isinstance(settings,dict),'missing_settings')
 low=settings.get('fov_low');high=settings.get('fov_high')
 need(number(low) and number(high) and 0<low<60<high<180,'unrecorded_fov_endpoints')
 wide=settings.get('wide_viewport')
 need(isinstance(wide,list) and len(wide)==2 and all(integer(v) for v in wide)
      and wide[0]>=640 and wide[1]>=360 and abs(wide[0]*9-wide[1]*16)<=16,'unrecorded_wide_viewport')
 for key in ('view_bobbing','dynamic_fov'):
  need(type(settings.get(key)) is bool,'unrecorded_client_setting')
def case_identity(case,expected,settings,contract_sha):
 context=case.get('context');need(isinstance(context,dict),'missing_case_context')
 for key in ('skin','view','pitch','motion'):need(context.get(key)==expected[key],'case_context_mismatch')
 viewport=[1180,792] if expected['viewport']=='original' else settings['wide_viewport']
 fov={'low':settings['fov_low'],'60':60,'high':settings['fov_high']}[expected['fov']]
 need(context.get('viewport')==viewport and context.get('world_fov')==fov,'case_viewport_or_fov_mismatch')
 need(context.get('family_contract_sha256')==contract_sha,'case_stack_mismatch')
 need(context.get('hand')=='main_right' and context.get('graphics_mode') in ('standard','vibrant_visuals'),'unrecorded_hand_or_graphics')
 for key in ('view_bobbing','dynamic_fov'):need(context.get(key)==settings[key],'case_setting_mismatch')
 return context
def interval(value,total):
 need(isinstance(value,list) and len(value)==2 and all(integer(x) for x in value)
      and 0<=value[0]<=value[1]<total,'invalid_frame_interval');return value
def coverage(intervals,wanted,total):
 need(isinstance(intervals,list) and intervals,'missing_review_coverage')
 spans=sorted(interval(v,total) for v in intervals);cursor=wanted[0]
 for a,b in spans:
  need(wanted[0]<=a<=b<=wanted[1] and a==cursor,'review_gap_overlap_or_outside')
  cursor=b+1
 need(cursor==wanted[1]+1,'review_gap_overlap_or_outside')
 return cursor-wanted[0]
def case_observations(case,expected,settings,contract_sha,media):
 context=case_identity(case,expected,settings,contract_sha)
 need(case.get('outcome')=='observed_pass','case_not_observed_pass')
 video_id=case.get('video_id');need(video_id in media and media[video_id]['kind']=='native_recording','missing_native_recording')
 video=media[video_id];pts=video['pts'];whole=interval(case.get('frame_range'),len(pts))
 reviewed=coverage(case.get('reviewed_intervals'),whole,len(pts))
 need(case.get('reviewed_frame_count')==reviewed,'review_count_mismatch')
 rect=context.get('viewport_rect')
 need(isinstance(rect,list) and len(rect)==4 and all(integer(x) for x in rect)
      and rect[2:]==context['viewport'] and min(rect[:2])>=0 and rect[0]+rect[2]<=video['width']
      and rect[1]+rect[3]<=video['height'],'invalid_actual_viewport_rect')
 times=pts[whole[0]:whole[1]+1]
 need(len(times)>1 and max(b-a for a,b in zip(times,times[1:]))<=1/12+.001,'undersampled_or_gapped_recording')
 segments=case.get('segments');need(isinstance(segments,dict),'missing_action_segments')
 for action in ('idle','use_start','shaking','return_idle'):
  a,b=interval(segments.get(action),len(pts));need(whole[0]<=a<=b<=whole[1],'action_outside_case')
 need(segments['idle'][1]<segments['use_start'][0]<=segments['use_start'][1]<segments['shaking'][0]
      and segments['shaking'][1]<segments['return_idle'][0],'action_order_mismatch')
 need(pts[segments['shaking'][1]]-pts[segments['shaking'][0]]>=3,'insufficient_shake_cycles')
 if expected['pitch']=='level' and expected['motion']=='standing':
  for action in ('cancel','natural_completion','re_equip'):
   interval(segments.get(action),len(pts))
   need(whole[0]<=segments[action][0]<=segments[action][1]<=whole[1],'action_outside_case')
 review=case.get('review');need(isinstance(review,dict),'missing_reviewer')
 reviewer=review.get('reviewer_id');need(isinstance(reviewer,str) and re.fullmatch(r'r[0-9]{3,8}',reviewer),'missing_reviewer')
 need(review.get('findings')=={k:'observed_pass' for k in FINDINGS},'failed_or_missing_review_finding')
 gaps=review.get('edge_gaps_px');uncertainty=review.get('measurement_uncertainty_px')
 need(isinstance(gaps,dict) and set(gaps)=={'left','right','top','bottom'} and number(uncertainty) and uncertainty>=0
      and all(number(v) and v>uncertainty for v in gaps.values()),'clipped_or_unresolved_boundary')
 refs=case.get('frame_refs');need(isinstance(refs,list) and {r.get('role') for r in refs}==set(ROLES)
                                  and len(refs)==len(ROLES),'missing_raw_frame_roles')
 hashes=[]
 for ref in refs:
  frame=media.get(ref.get('evidence_id'));need(frame is not None and frame['kind']=='raw_video_frame','missing_raw_frame')
  need(frame['video_id']==video_id and integer(frame['frame_index']) and 0<=frame['frame_index']<len(pts),'frame_recording_link_mismatch')
  role=ref['role'];index=frame['frame_index']
  if role in ('use_entry','shake_sample','return_idle'):
   action={'use_entry':'use_start','shake_sample':'shaking','return_idle':'return_idle'}[role]
   need(segments[action][0]<=index<=segments[action][1],'frame_action_mismatch')
  elif role.endswith('_edge'):need(whole[0]<=index<=whole[1],'edge_frame_outside_case')
  hashes.append(frame['sha256'])
 return {'case_id':case['id'],'outcome':'observed_pass','reviewer_id':reviewer,
         'video_sha256':video['sha256'],'raw_frame_sha256':hashes,'reviewed_frames':reviewed,
         'captured_frame_range':whole,'recorded_seconds':[pts[whole[0]],pts[whole[1]]],
         'max_recorded_frame_gap_seconds':max(b-a for a,b in zip(times,times[1:])),
         'world_fov':context['world_fov'],'viewport':context['viewport'],'viewport_rect':rect,
         'graphics_mode':context['graphics_mode'],'hand':'main_right',
         'edge_gaps_px':gaps,'measurement_uncertainty_px':uncertainty}
def distinct_case_ranges(cases,media):
 # Different matrix contexts cannot claim the same captured action frames.
 # Bind by content hash as aliases may give one recording multiple catalog IDs.
 recordings={}
 for case in cases:
  video=media.get(case.get('video_id'))
  need(isinstance(video,dict) and video.get('kind')=='native_recording','missing_native_video')
  span=case.get('frame_range')
  need(isinstance(span,list) and len(span)==2 and all(integer(i) for i in span),'invalid_case_frame_range')
  recordings.setdefault(video['sha256'],[]).append((span[0],span[1]))
 for spans in recordings.values():
  spans.sort()
  need(all(left[1]<right[0] for left,right in zip(spans,spans[1:])),'overlapping_case_recording_ranges')

def private_path(root,relative):
 need(isinstance(relative,str) and relative and not PurePosixPath(relative).is_absolute()
      and '..' not in PurePosixPath(relative).parts and '\\' not in relative and ':' not in relative,'unsafe_private_evidence_path')
 p=Path(root)/relative
 need(not p.is_symlink() and p.resolve().is_relative_to(Path(root).resolve()),'linked_or_escaped_evidence')
 return p
def run_media(command,code):
 try:p=subprocess.run(command,capture_output=True,timeout=300)
 except (OSError,subprocess.TimeoutExpired):raise Blocked(code) from None
 need(p.returncode==0,code);return p.stdout
def decode_evidence(catalog,evidence_root,ffprobe,ffmpeg):
 from PIL import Image
 need(isinstance(catalog,dict) and catalog,'missing_evidence_catalog')
 result={};paths={}
 for eid,row in catalog.items():
  try:need(str(uuid.UUID(eid))==eid,'invalid_evidence_identity')
  except (ValueError,TypeError,AttributeError):raise Blocked('invalid_evidence_identity') from None
  need(isinstance(row,dict) and row.get('kind') in ('native_recording','raw_video_frame'),'contact_sheet_or_invalid_evidence')
  p=private_path(evidence_root,row.get('path'));need(sha(row.get('sha256')) and file_hash(p)==row['sha256'],'evidence_hash_mismatch')
  paths[eid]=p;result[eid]={'kind':row['kind'],'sha256':row['sha256']}
  if row['kind']=='native_recording':
   need(row.get('origin')=='native_client_capture','synthetic_or_unrecorded_video_origin')
   probe=run_media([str(ffprobe),'-v','error','-select_streams','v:0','-show_frames','-show_entries',
    'stream=width,height:frame=best_effort_timestamp_time,width,height','-of','json',str(p)],'native_video_probe_failed')
   try:data=json.loads(probe);stream=data['streams'][0];frames=data['frames']
   except (ValueError,KeyError,IndexError,TypeError):raise Blocked('invalid_video_metadata') from None
   try:pts=[float(f['best_effort_timestamp_time']) for f in frames]
   except (ValueError,KeyError,TypeError):raise Blocked('missing_video_timestamps') from None
   need(len(pts)>1 and all(math.isfinite(v) for v in pts) and all(a<b for a,b in zip(pts,pts[1:])),'invalid_video_timestamps')
   need(integer(stream.get('width')) and integer(stream.get('height'))
        and all(f.get('width')==stream['width'] and f.get('height')==stream['height'] for f in frames),'variable_or_missing_capture_dimensions')
   result[eid].update({'pts':pts,'width':stream['width'],'height':stream['height']})
 for video_id,video in list(result.items()):
  if video['kind']!='native_recording':continue
  linked=[(eid,row) for eid,row in catalog.items() if row['kind']=='raw_video_frame' and row.get('video_id')==video_id]
  need(linked,'video_without_raw_frames');indices=sorted({r.get('frame_index') for _,r in linked if integer(r.get('frame_index'))})
  need(indices and all(0<=i<len(video['pts']) for i in indices),'invalid_raw_frame_index')
  decoded={}
  for offset in range(0,len(indices),200):
   batch=indices[offset:offset+200];select='+'.join('eq(n\\,'+str(i)+')' for i in batch)
   output=run_media([str(ffmpeg),'-v','error','-i',str(paths[video_id]),'-map','0:v:0','-an',
    '-vf','select='+select,'-fps_mode','passthrough','-pix_fmt','rgb24','-f','framehash','-hash','sha256','-'],
    'native_video_frame_decode_failed').decode('ascii')
   hashes=[line.split(',')[-1].strip() for line in output.splitlines() if line and not line.startswith('#')]
   need(len(hashes)==len(batch) and all(sha(h) for h in hashes),'decoded_frame_count_mismatch');decoded.update(zip(batch,hashes))
  for eid,row in linked:
   need(row.get('origin')=='decoded_native_recording' and integer(row.get('frame_index')),'synthetic_or_invalid_frame_origin')
   try:
    with Image.open(paths[eid]) as image:
     need(image.format=='PNG' and image.size==(video['width'],video['height']),'cropped_or_contact_sheet_frame')
     pixels=digest(image.convert('RGB').tobytes())
   except (OSError,ValueError):raise Blocked('invalid_native_frame') from None
   need(pixels==decoded.get(row['frame_index']),'raw_frame_not_from_recording')
   result[eid].update({'video_id':video_id,'frame_index':row['frame_index']})
 need(all(row['kind']!='raw_video_frame' or 'video_id' in row for row in result.values()),'orphan_raw_frame')
 # Reject replacement during decode/review. Never trust a prior cached hash.
 for eid,row in catalog.items():need(file_hash(paths[eid])==row['sha256'],'evidence_changed_during_validation')
 return result
def reviewer_binding(registry_path,receipt_sha,case_results,repo,evidence_root):
 registry_path=Path(registry_path)
 need(not registry_path.resolve().is_relative_to(Path(repo).resolve())
      and not registry_path.resolve().is_relative_to(Path(evidence_root).resolve()),'review_registry_not_independent_private_input')
 registry,registry_sha=read_hashed(registry_path)
 need(registry.get('schema')==1 and registry.get('kind')=='native_review_registry','synthetic_or_invalid_review_registry')
 approvals=registry.get('approved_reviews');need(isinstance(approvals,dict),'missing_trusted_review_registry')
 approval=approvals.get(receipt_sha);need(isinstance(approval,dict),'receipt_not_independently_reviewed')
 review_path=private_path(registry_path.parent,approval.get('record_path'))
 need(sha(approval.get('record_sha256')) and file_hash(review_path)==approval['record_sha256'],'review_record_hash_mismatch')
 record,record_sha=read_hashed(review_path)
 need(record_sha==approval['record_sha256'],'review_record_hash_mismatch')
 need(record.get('schema')==1 and record.get('kind')=='human_native_review'
      and record.get('receipt_sha256')==receipt_sha and record.get('decision')=='approve_scoped_observations','invalid_human_review_record')
 need(isinstance(record.get('reviewer_identity'),str) and record['reviewer_identity'].strip(),'untraceable_reviewer')
 reviewer=record.get('reviewer_id');need(all(c['reviewer_id']==reviewer for c in case_results),'reviewer_identity_mismatch')
 need(record.get('case_ids')==sorted(c['case_id'] for c in case_results),'review_record_incomplete_scope')
 try:date=datetime.datetime.fromisoformat(record.get('reviewed_at','').replace('Z','+00:00'))
 except (ValueError,TypeError):raise Blocked('missing_review_timestamp') from None
 need(date.tzinfo is not None and date<=datetime.datetime.now(datetime.timezone.utc),'invalid_review_timestamp')
 need(file_hash(registry_path)==registry_sha and file_hash(review_path)==approval['record_sha256'],'review_changed_during_validation')
 return {'reviewer_id':reviewer,'review_record_sha256':approval['record_sha256'],
         'registry_sha256':registry_sha}
def validate(receipt_path,repo,family_path,tested_family_path,family_root,installed_root,exports,evidence_root,registry_path,ffprobe,ffmpeg):
 receipt,receipt_sha=read_hashed(receipt_path)
 need(receipt.get('schema')==1 and receipt.get('kind')=='native_client_visual_evidence','synthetic_or_invalid_production_receipt')
 need(set(receipt)<=set(pending_template()),'unknown_production_receipt_fields')
 need(receipt.get('policy')==POLICY,'unsupported_visual_policy')
 need(not Path(receipt_path).resolve().is_relative_to(Path(repo).resolve())
      and not Path(evidence_root).resolve().is_relative_to(Path(repo).resolve()),'private_evidence_inside_public_repository')
 head,runtime=candidate_binding(repo,receipt)
 tested_family,tested_family_sha=read_hashed(tested_family_path)
 original=family_contract(tested_family);current=family_contract(read(family_path))
 need(receipt.get('tested_family_receipt_sha256')==tested_family_sha,'tested_family_receipt_identity_mismatch')
 contract_sha=digest(canonical(original))
 need(current==original and receipt.get('family_contract_sha256')==contract_sha,'paired_family_contract_changed')
 verify_family(family_root,current);verify_family(installed_root,current);bind_family_to_canonical(repo,current)
 wanted=receipt.get('exports');verify_exports(wanted,exports)
 client=receipt.get('client');need(isinstance(client,dict) and isinstance(client.get('version'),str)
  and re.fullmatch(r'[0-9]+(?:\.[0-9]+){1,3}',client['version']) and client.get('platform') in ('windows','linux','android','ios','console'),'unrecorded_native_client')
 need(receipt.get('camera_calibration')=='unknown','visual_receipt_cannot_calibrate_camera')
 settings=receipt.get('settings');settings_check(settings)
 cases=receipt.get('cases');need(isinstance(cases,list) and all(isinstance(c,dict) for c in cases),'missing_visual_cases')
 required=required_cases();by_id={c.get('id'):c for c in cases}
 need(len(by_id)==len(cases) and set(by_id)==set(required),'missing_duplicate_or_unexpected_case')
 need(all(c.get('outcome')=='observed_pass' for c in cases),'case_not_observed_pass')
 media=decode_evidence(receipt.get('evidence'),evidence_root,ffprobe,ffmpeg)
 distinct_case_ranges(cases,media)
 results=[case_observations(by_id[cid],expected,settings,contract_sha,media) for cid,expected in sorted(required.items())]
 review=reviewer_binding(registry_path,receipt_sha,results,repo,evidence_root)
 need(file_hash(receipt_path)==receipt_sha,'receipt_changed_during_validation')
 # Repeat full package/stack/export comparisons after potentially long decode.
 need(candidate_binding(repo,receipt)[0]==head,'candidate_changed_during_validation')
 verify_family(family_root,current);verify_family(installed_root,current)
 need(family_contract(read(family_path))==current and file_hash(tested_family_path)==receipt['tested_family_receipt_sha256'],'family_changed_during_validation')
 verify_exports(wanted,exports)
 return {'schema':1,'policy':POLICY,'status':'observed_scope_pass','native_visual_scope_pass':True,
  'camera_calibration':'unknown','full_clip_volume_proved':False,'tested_commit':receipt['tested_commit'],
  'current_commit':head,'runtime_trees':runtime,'family_contract_sha256':contract_sha,
  'current_family_receipt_sha256':file_hash(family_path),'tested_family_receipt_sha256':receipt['tested_family_receipt_sha256'],
  'exports':wanted,'private_receipt_sha256':receipt_sha,'human_review':review,
  'client':{k:client[k] for k in ('version','platform')},
  'settings':{k:settings[k] for k in ('fov_low','fov_high','wide_viewport','view_bobbing','dynamic_fov')},'cases':results,
  'limits':['Recorded/reviewed observations only; no exact camera/near-plane or continuous-time proof.',
            'No arbitrary custom skin, VR, offhand, other platforms or untested intermediate FOV claim.']}
def pending_template():
 cases=[]
 for cid,expected in required_cases().items():
  cases.append({'id':cid,'outcome':'not_run','context':{**{k:expected[k] for k in ('skin','view','pitch','motion')},
   'viewport':[1180,792] if expected['viewport']=='original' else None,'world_fov':60 if expected['fov']=='60' else None,
   'viewport_rect':None,'family_contract_sha256':None,'hand':'main_right','graphics_mode':None,
   'view_bobbing':None,'dynamic_fov':None},'video_id':None,'frame_range':None,'segments':{},
   'reviewed_intervals':[],'reviewed_frame_count':0,'frame_refs':[],
   'review':{'reviewer_id':None,'findings':{},'edge_gaps_px':None,'measurement_uncertainty_px':None}})
 return {'schema':1,'kind':'native_client_visual_evidence','policy':POLICY,'tested_commit':None,
  'runtime_trees':None,'tested_family_receipt_sha256':None,'family_contract_sha256':None,'exports':{},
  'client':{'version':None,'platform':None},'camera_calibration':'unknown',
  'settings':{'fov_low':None,'fov_high':None,'wide_viewport':None,'view_bobbing':None,'dynamic_fov':None},
  'cases':cases,'evidence':{}}
