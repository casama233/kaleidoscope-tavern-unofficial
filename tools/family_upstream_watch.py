#!/usr/bin/env python3
"""Read-only author release checks; never download, install or rewrite a lock."""
import argparse,datetime,hashlib,json,os,urllib.request
from pathlib import Path
API='https://api.curseforge.com/v1/'
def latest(files,stable=False):
 available=[f for f in files if f.get('isAvailable',True) and (not stable or f.get('releaseType')==1)]
 return max(available,key=lambda f:(f['fileDate'],f['id'])) if available else None
def watch(lock,get):
 rows=[]
 for pin in lock['upstream']:
  row={'name':pin['name'],'project_id':pin['project_id'],'locked_file_id':pin['file_id']}
  try:
   project=get('mods/'+str(pin['project_id']))
   if project['id']!=pin['project_id'] or not any(a.get('name')=='Loyallay' for a in project['authors']):raise ValueError('project/Bedrock author identity changed; review required')
   files=get('mods/'+str(pin['project_id'])+'/files?pageSize=50')
   for label,stable in [('newest_author_file',False),('newest_stable_file',True)]:
    f=latest(files,stable);row[label]={k:f.get(k) for k in ['id','displayName','fileDate','releaseType']} if f else None
   if row['newest_author_file'] is None:raise ValueError('no available author files')
   row['status']='current' if row['newest_author_file']['id']==pin['file_id'] else 'review_required'
  except Exception as e:row['status']='check_failed';row['error']=str(e)
  rows.append(row)
 return {'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'read_only':True,'automatic_deployment':False,'all_pins_latest':all(r['status']=='current' for r in rows),'projects':rows}
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lock',type=Path,required=True);p.add_argument('--config',type=Path,help='Private BSM config containing cf_api_key; never copied to Git');p.add_argument('--report',type=Path,required=True);a=p.parse_args()
 key=os.environ.get('CURSEFORGE_API_KEY') or (json.loads(a.config.read_text())['cf_api_key'] if a.config else None)
 if not key:raise SystemExit('CurseForge API credential missing')
 def get(path):
  request=urllib.request.Request(API+path,headers={'x-api-key':key,'Accept':'application/json','User-Agent':'SenluoFamilyReadOnlyWatch/1'})
  with urllib.request.urlopen(request,timeout=20) as r:return json.load(r)['data']
 raw=a.lock.read_bytes();report=watch(json.loads(raw),get);report['lock_file_sha256']=hashlib.sha256(raw).hexdigest();report['tool_sha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
 a.report.parent.mkdir(parents=True,exist_ok=True);temp=a.report.with_suffix(a.report.suffix+'.tmp');temp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');os.replace(temp,a.report)
 print(json.dumps(report,ensure_ascii=False));raise SystemExit(0 if report['all_pins_latest'] else 1)
if __name__=='__main__':main()
