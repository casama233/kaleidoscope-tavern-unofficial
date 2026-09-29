#!/usr/bin/env python3
"""Create opt-in replacement files from the owner's exact public add-on ZIP.
No vendor script is bundled here. Never alters the input, an installed world,
manifest identities, items, assets, or the user's enabled-pack list.
"""
import argparse, hashlib, json, re, zipfile
from pathlib import Path, PurePosixPath

SPECS = {
 'cookery': {
  'version':'1.0.8','archive_sha256':'9e5b617cc4c7a08ecd429fb9e42ec10e8d40a1ed5fc1f6f6687c3aff8a45a5d5',
  'member':'Kaleidoscope Cookery v1.0.8 [BP]/scripts/api/guidebookExtensionRegistry.js',
  'file_sha256':'664964a32be1038d3bc9be3d9e0fb460d77b65aa20f2c78d5efb9d12099dbf07',
  'edits': [('const safeLocale=cleanToken(locale);', 'const safeLocale=/^[a-z]{2,3}_[A-Z]{2}$/.test(locale)?locale:"";')]
 },
 'immersive-eating': {
  'version':'1.0','archive_sha256':'a3a8c7f9e6229808a620b3d261bb6d63319abdf1e578c163586cbc906c4956d9',
  'member':'Kaleidoscope Immersive Eating v1.0.0 [BP]/scripts/main.js',
  'file_sha256':'f606466ef760114dee9bebd2ca6a9c08dfd4fff93e6cdc29888662a090c5dc91',
  'edits': [
   ('world.gameRules.sendCommandFeedback = false;', '/* Family compatibility: do not silence the entire world. */'),
   ('world.gameRules.sendCommandFeedback = restoreTo;', '/* Family compatibility: do not restore a stale global setting. */')
  ]
 }
}

def sha(raw): return hashlib.sha256(raw).hexdigest()

def patched_bytes(key, raw):
 spec=SPECS[key]
 if sha(raw)!=spec['file_sha256']:raise ValueError('Unsupported or already edited source script; reconcile manually, never force it')
 text=raw.decode('utf-8')
 for old,new in spec['edits']:
  if text.count(old)!=1:raise ValueError('Source pattern is not unique: '+old)
  text=text.replace(old,new,1)
 if key=='immersive-eating' and re.search(r'world\.gameRules\.sendCommandFeedback\s*=(?!=)',text):
  raise ValueError('Global gamerule writer remains')
 return text.encode('utf-8')

def replacements(key, archive):
 spec=SPECS[key];raw=archive.read_bytes()
 if sha(raw)!=spec['archive_sha256']:raise ValueError('Only the audited public '+key+' '+spec['version']+' ZIP is accepted')
 with zipfile.ZipFile(archive) as z:
  names=z.namelist()
  if len(names)!=len(set(names)):raise ValueError('Duplicate ZIP entries')
  for info in z.infolist():
   p=PurePosixPath(info.filename)
   if p.is_absolute() or '..' in p.parts or '\\' in info.filename or ':' in p.parts[0] or ((info.external_attr>>16)&0o170000)==0o120000:raise ValueError('Unsafe ZIP entry')
  old=z.read(spec['member']);new=patched_bytes(key,old)
  receipt={'package':key,'version':spec['version'],'inputArchiveSha256':sha(raw),
    'changedFiles':[{'member':spec['member'],'beforeSha256':sha(old),'afterSha256':sha(new)}],
    'allOtherFilesUnmodified':True,'uuidOrVersionChanged':False,
    'isStandaloneAddon':False,'requiresOfflineManualReplacement':True,'clientTest':False}
  return {spec['member']:new},receipt

def apply_to_test_copy(key, archive, copy_root):
 """Native harness only: caller makes and owns this disposable extracted copy."""
 files,receipt=replacements(key,archive)
 for name,raw in files.items():
  p=copy_root/name
  if not p.is_file() or p.is_symlink() or sha(p.read_bytes())!=SPECS[key]['file_sha256']:raise ValueError('Test copy differs')
  p.write_bytes(raw)
 return receipt

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('package',choices=SPECS);p.add_argument('archive',type=Path)
 p.add_argument('--output',type=Path,required=True,help='New, nonexistent directory for replacement files only')
 a=p.parse_args()
 if a.output.exists():p.error('Output already exists; input and existing files will never be overwritten')
 files,receipt=replacements(a.package,a.archive)
 a.output.mkdir(parents=True)
 for name,raw in files.items():
  dest=a.output/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
 (a.output/'PATCH-RECEIPT.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(receipt,ensure_ascii=False))

if __name__=='__main__':main()
