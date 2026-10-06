#!/usr/bin/env python3
"""Read-only current Java release tracking; no JAR download, source-lock mutation or deploy."""
import argparse,datetime,json,os,urllib.request
from pathlib import Path

def latest(files,minecraft,loader,stable=False):
 rows=[f for f in files if f.get('isAvailable',True) and minecraft in f.get('gameVersions',[]) and loader in f.get('gameVersions',[]) and (not stable or f.get('releaseType')==1)]
 return max(rows,key=lambda f:(f['fileDate'],f['id'])) if rows else None

def watch(config,get):
 rows=[]
 for source in config['projects']:
  base={'name':source['name'],'project_id':source['project_id'],'parity_verified':False}
  try:
   project=get('mods/'+str(source['project_id']))
   assert project['id']==source['project_id'] and source['author_id'] in {a['id'] for a in project['authors']}, 'Java project/author identity changed'
   files=[]
   for index in range(0,1000,50):
    page=get(f"mods/{source['project_id']}/files?pageSize=50&index={index}")
    files.extend(page)
    if len(page)<50:break
   else:raise ValueError('File pagination exceeds reviewed limit; cannot claim latest')
   for branch in source['branches']:
    row={**base,'minecraft':branch['minecraft'],'loader':branch['loader'],'source_reference_file_ids':branch['source_reference_file_ids'],'source_scope':branch['source_scope']}
    for label,stable in [('newest_author_file',False),('newest_stable_file',True)]:
     f=latest(files,branch['minecraft'],branch['loader'],stable)
     row[label]={k:f.get(k) for k in ['id','displayName','fileDate','releaseType']} if f else None
    if not row['newest_author_file']:raise ValueError('No available file for a maintained Java branch')
    row['status']='reference_metadata_current_parity_pending' if row['newest_stable_file'] and row['newest_stable_file']['id'] in branch['source_reference_file_ids'] else 'new_release_requires_adaptation'
    if row['newest_author_file']['releaseType']!=1:row['preview_review_required']=True
    rows.append(row)
  except Exception as error:rows.append({**base,'status':'check_failed','error':str(error)})
 return {'schema':1,'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'read_only':True,'automatic_deployment':False,'downloads':False,'all_reference_release_metadata_current':bool(rows) and all(r['status']=='reference_metadata_current_parity_pending' and not r.get('preview_review_required') for r in rows),'full_java_parity_verified':False,'projects':rows}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--sources',type=Path,required=True);p.add_argument('--config',type=Path);p.add_argument('--report',type=Path,required=True);a=p.parse_args()
 key=os.environ.get('CURSEFORGE_API_KEY') or (json.loads(a.config.read_text())['cf_api_key'] if a.config else None)
 if not key:raise SystemExit('CurseForge credential missing')
 def get(path):
  request=urllib.request.Request('https://api.curseforge.com/v1/'+path,headers={'x-api-key':key,'Accept':'application/json','User-Agent':'SenluoJavaReadOnlyWatch/1'})
  with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)['data']
 report=watch(json.loads(a.sources.read_text()),get);a.report.parent.mkdir(parents=True,exist_ok=True);temp=a.report.with_suffix(a.report.suffix+'.tmp');temp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');os.replace(temp,a.report)
 print(json.dumps({'checked_at':report['checked_at'],'branches':len(report['projects']),'adaptation_required':[r['name']+':'+r.get('minecraft','check')+':'+r.get('loader','failed') for r in report['projects'] if r['status']!='reference_metadata_current_parity_pending']}));return 0 if report['all_reference_release_metadata_current'] else 1
if __name__=='__main__':raise SystemExit(main())
