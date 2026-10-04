#!/usr/bin/env python3
"""Verify private native evidence; publish only a hash-bound scope summary."""
import argparse,json,shutil,sys
from pathlib import Path
from shaker_visual_evidence import (Blocked,POLICY,candidate_binding,canonical,digest,family_contract,
 file_hash,git,git_runtime,need,pending_template,read,tree,validate,verify_family,bind_family_to_canonical)

ROOT=Path(__file__).resolve().parents[1]
CONFIG_KEYS={'schema','kind','receipt','evidence_root','review_registry','family_receipt',
 'tested_family_receipt','family_root','installed_family_root','exports','ffprobe','ffmpeg'}

def load_config(path):
 path=Path(path).resolve();config=read(path)
 need(config.get('schema')==1 and config.get('kind')=='native_visual_check_config'
      and set(config)<=CONFIG_KEYS,'invalid_native_check_config')
 need(not path.is_relative_to(ROOT),'private_config_inside_public_repository')
 def location(key,default=None):
  value=config.get(key,default);need(isinstance(value,str) and value,'missing_'+key)
  p=Path(value);return p if p.is_absolute() else path.parent/p
 fields={key:location(key) for key in ('receipt','evidence_root','review_registry','family_receipt','family_root','installed_family_root')}
 fields['tested_family_receipt']=location('tested_family_receipt',config['family_receipt'])
 exports=config.get('exports');need(isinstance(exports,dict) and exports,'missing_exports')
 need(all(isinstance(value,str) and value for value in exports.values()),'invalid_export_paths')
 fields['exports']={key:Path(value) if Path(value).is_absolute() else path.parent/value for key,value in exports.items()}
 for name in ('ffprobe','ffmpeg'):
  value=config.get(name) or shutil.which(name)
  need(value is None or isinstance(value,str),'invalid_decoder_path')
  fields[name]=value
 return fields

def prepare(fields):
 target=fields['receipt'];need(not target.exists(),'receipt_already_exists')
 need(not target.resolve().is_relative_to(ROOT),'private_receipt_inside_public_repository')
 receipt=pending_template();receipt['tested_commit']=git(ROOT,'rev-parse','HEAD').decode().strip()
 receipt['runtime_trees']={side:tree(rows) for side,rows in git_runtime(ROOT,receipt['tested_commit']).items()}
 candidate_binding(ROOT,receipt)
 tested=family_contract(read(fields['tested_family_receipt']));current=family_contract(read(fields['family_receipt']))
 need(current==tested,'paired_family_contract_changed')
 verify_family(fields['family_root'],current);verify_family(fields['installed_family_root'],current)
 bind_family_to_canonical(ROOT,current)
 receipt['tested_family_receipt_sha256']=file_hash(fields['tested_family_receipt'])
 receipt['family_contract_sha256']=digest(canonical(tested))
 receipt['exports']={eid:file_hash(path) for eid,path in fields['exports'].items()}
 for case in receipt['cases']:case['context']['family_contract_sha256']=receipt['family_contract_sha256']
 target.parent.mkdir(parents=True,exist_ok=True)
 target.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
 return {'schema':1,'policy':POLICY,'status':'pending_not_run','native_visual_scope_pass':False,
         'camera_calibration':'unknown','required_cases':len(receipt['cases']),
         'private_receipt_sha256':file_hash(target),'tested_commit':receipt['tested_commit']}

def main(argv=None):
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('operation',choices=('check','prepare','template'))
 parser.add_argument('--config',type=Path)
 parser.add_argument('--output',type=Path,help='Private pending template output; never an acceptance')
 parser.add_argument('--summary',type=Path,help='Public-safe validation summary without private media/paths')
 args=parser.parse_args(argv);code=0;approved_summary_target=False
 try:
  if args.operation=='template':
   need(args.output is not None and not args.output.exists(),'new_template_output_required')
   need(not args.output.resolve().is_relative_to(ROOT),'private_template_output_required')
   args.output.parent.mkdir(parents=True,exist_ok=True)
   args.output.write_text(json.dumps(pending_template(),indent=2)+'\n',encoding='utf-8',newline='\n')
   result={'status':'pending_not_run','native_visual_scope_pass':False,'required_cases':216,'camera_calibration':'unknown'}
  else:
   need(args.config is not None,'private_config_required');fields=load_config(args.config)
   if args.summary:
    need(not args.summary.exists(),'new_summary_output_required')
    need(not args.summary.resolve().is_relative_to(ROOT/'runtime') and not args.summary.resolve().is_relative_to(ROOT/'.git'),'unsafe_summary_target')
    inputs={args.config.resolve(),*[p.resolve() for p in fields.values() if isinstance(p,Path)],*[p.resolve() for p in fields['exports'].values()]}
    need(args.summary.resolve() not in inputs,'summary_overwrites_input')
    approved_summary_target=True
   result=prepare(fields) if args.operation=='prepare' else validate(fields['receipt'],ROOT,
    fields['family_receipt'],fields['tested_family_receipt'],fields['family_root'],fields['installed_family_root'],
    fields['exports'],fields['evidence_root'],fields['review_registry'],fields['ffprobe'],fields['ffmpeg'])
 except (Blocked,OSError,ValueError,KeyError,TypeError) as error:
  result={'schema':1,'policy':POLICY,'status':'blocked','native_visual_scope_pass':False,
          'camera_calibration':'unknown','blocker':str(error) if isinstance(error,Blocked) else 'invalid_or_unavailable_input'}
  code=2
 if args.summary and approved_summary_target:
  # Never replace an input or an earlier immutable result, even on failure.
  if not args.summary.exists() and not args.summary.resolve().is_relative_to(ROOT/'runtime') and not args.summary.resolve().is_relative_to(ROOT/'.git'):
   args.summary.parent.mkdir(parents=True,exist_ok=True)
   with args.summary.open('x',encoding='utf-8',newline='\n') as output:
    output.write(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:v for k,v in result.items() if k not in ('cases',)},sort_keys=True))
 return code

if __name__=='__main__':sys.exit(main())
