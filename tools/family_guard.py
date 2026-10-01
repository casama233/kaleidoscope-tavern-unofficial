#!/usr/bin/env python3
"""BSM admission and read-only drift checks for a reviewed family deployment.

The policy file is server configuration, not a mutable pack or a build input.
Existing mixed packs can be recorded as quarantined; that never approves updates.
"""
from pathlib import Path
import argparse,datetime,hashlib,json,os,re,sys
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def hashes(root):
 root=Path(root)
 if root.is_symlink():raise ValueError('pack root is a symlink')
 rows={}
 for path in sorted(root.rglob('*')):
  if path.is_symlink():raise ValueError('pack contains a symlink')
  if path.is_file():rows[path.relative_to(root).as_posix()]=hashlib.sha256(path.read_bytes()).hexdigest()
 return rows
def family_pack(pack,policy):
 if pack['uuid'] in policy['managed_uuids']:return True
 if not pack.get('path'):return False
 root=Path(pack['path']);manifest=root/'manifest.json'
 if manifest.exists() and any(d.get('uuid') in policy['managed_uuids'] for d in read(manifest).get('dependencies',[])):return True
 # An unregistered UUID must not disguise another family runtime/overlay.
 for directory in ['blocks','items','entities','entity']:
  for path in (root/directory).rglob('*.json'):
   # Bedrock definitions can be JSONC. Remove comments without touching quoted
   # strings; finding the reserved identifier needs no JSON reserialization.
   content=path.read_text(encoding='utf-8-sig')
   content=re.sub(r'"(?:\\.|[^"\\])*"|//[^\n]*|/\*.*?\*/',lambda m:m[0] if m[0].startswith('"') else '',content,flags=re.S)
   if re.search(r'"identifier"\s*:\s*"(?:kaleidoscope_|kt_assets_)',content):return True
 return False
def validate_incoming(incoming,policy_path):
 policy=read(policy_path);ids={p['uuid'] for p in incoming}
 if not any(family_pack(p,policy) for p in incoming):return
 approved=policy.get('approved_receipt')
 if not approved:raise ValueError('森羅家族更新已攔截：需整套 Git 基線、官方來源鎖及存檔遷移驗收；不能個別覆蓋本地包。')
 receipt=read(approved);gates=receipt.get('acceptance',{})
 complete=receipt.get('production_ready') is True and all(gates.get(k) is True for k in ['static','bds','client','saved_world_migration'])
 # A user may explicitly defer client acceptance for one exact candidate.
 # Keep client=false and production_ready=false; never manufacture evidence.
 deferred=policy.get('deferred_client_acceptance',{})
 pending=(receipt.get('production_ready') is False and gates.get('client') is False
  and all(gates.get(k) is True for k in ['static','bds','saved_world_migration'])
  and deferred.get('source')=='explicit_user_instruction'
  and bool(deferred.get('instruction')) and bool(deferred.get('recorded_at'))
  and deferred.get('receipt_sha256')==hashlib.sha256(Path(approved).read_bytes()).hexdigest())
 if not complete and not pending:raise ValueError('森羅部署缺少 BDS／用戶端／存檔遷移驗收')
 expected={p['uuid']:p for p in receipt['packs']}
 if ids!=set(expected):raise ValueError('森羅更新必須提交完整的已驗收家族包')
 for p in incoming:
  row=expected[p['uuid']]
  if p['version']!=row['version'] or hashes(p['path'])!=row['files']:raise ValueError('森羅更新內容與已驗收 Git／官方來源雜湊不符：'+p['uuid'])
  if row['source']['owner']=='owned' and (row['source'].get('working_candidate') or not row['source'].get('commit')):raise ValueError('自移植包必須來自已提交的 Git')
def audit(world,policy):
 world=Path(world);errors=[]
 for p in policy['installed']['packs']:
  actual=hashes(world/(p['side']+'_packs')/p['directory']);wanted=p['files']
  changed=sorted(k for k in actual.keys()&wanted.keys() if actual[k]!=wanted[k]);missing=sorted(wanted.keys()-actual.keys());extra=sorted(actual.keys()-wanted.keys())
  if changed or missing or extra:errors.append({'uuid':p['uuid'],'changed':changed,'missing':missing,'extra':extra})
 for side,wanted in policy['installed']['refs'].items():
  # Other add-ons may change; preserve the managed subsequence and its versions.
  actual=[p for p in read(world/('world_'+side+'_packs.json')) if p['pack_id'] in policy['managed_uuids']]
  if actual!=wanted:errors.append({'side':side,'error':'managed pack order/version changed'})
  active={p['pack_id'] for p in read(world/('world_'+side+'_packs.json'))}
  for root in (world/(side+'_packs')).iterdir():
   manifest=root/'manifest.json'
   if not manifest.is_file():continue
   uid=read(manifest).get('header',{}).get('uuid')
   if uid in active and uid not in policy['managed_uuids'] and family_pack({'uuid':uid,'path':str(root)},policy):errors.append({'side':side,'uuid':uid,'error':'unregistered family definition/dependency overlay'})
 return {'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ok':not errors,'installed_status':policy['installed'].get('status','quarantined'),'errors':errors,'production_candidate_approved':bool(policy.get('approved_receipt'))}
def atomic(path,obj):
 path=Path(path);temp=path.with_suffix(path.suffix+'.tmp');temp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n');os.replace(temp,path)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--world',type=Path,required=True);p.add_argument('--policy',type=Path,required=True);p.add_argument('--report',type=Path);a=p.parse_args()
 result=audit(a.world,read(a.policy))
 if a.report:atomic(a.report,result)
 print(json.dumps(result,ensure_ascii=False));sys.exit(0 if result['ok'] else 1)
if __name__=='__main__':main()
