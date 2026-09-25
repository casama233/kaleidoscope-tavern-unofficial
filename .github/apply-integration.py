"""Apply reviewed line edits to pinned sources; verify exact before/after and Git trees."""
import base64,hashlib,json,lzma,subprocess,sys
from pathlib import Path
sha=lambda b:hashlib.sha256(b).hexdigest()
raw=base64.b64decode(''.join(Path('delivery/.github/integration-part'+str(i)).read_text() for i in (1,2,3)))
assert sha(raw)=='44b6df004ee6280913a74ec5a9dcc834f52233a6d3c53460ec250af26e8fa48a'
bundle=json.loads(lzma.decompress(raw))
for repo,rows in bundle.items():
 root=Path(repo)
 for n,row in rows['files'].items():
  assert not Path(n).is_absolute() and '..' not in Path(n).parts and not n.startswith('.github/')
  source=row['source']
  before=(root/n).read_bytes() if source=='main' else (Path('pr88')/n).read_bytes() if source=='pr88' else b''
  assert sha(before)==row['before'],('Wrong source',repo,n)
  lines=before.decode().splitlines(keepends=True)
  for start,end,text in reversed(row['ops']):lines[start:end]=[text]
  after=''.join(lines).encode();assert sha(after)==row['after'],('Corrupt edit',repo,n)
  p=root/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(after)
# Preserve the exact source ledger and all tracked historical assets.
sys.path.insert(0,str(Path('tavern/tools').resolve()))
from creative.historical import LegacyMenuProjection
B=Path('baseline');T=Path('tavern');projection=LegacyMenuProjection(B)
ref=json.loads(Path('pr88/data/launch-repair-reference.json').read_text())
ref['baselineCommit']='cedfaedf6140bae61b24afb658869b1d0e6ea1a9';ref['reviewedChanges']={};ref['newRuntimeFiles']={}
for p in sorted((T/'runtime').rglob('*')):
 if not p.is_file():continue
 n=p.relative_to(T).as_posix();old=B/n
 if not old.exists():ref['newRuntimeFiles'][n]=sha(p.read_bytes())
 elif p.read_bytes()!=old.read_bytes():ref['reviewedChanges'][n]={'before':sha(old.read_bytes()),'beforeProjected':sha(projection.read_bytes(old)),'after':sha(p.read_bytes()),'reason':'Reviewed reconciliation of PRs #25/#50/#69/#88 and paired version bump; preserves native pick, storage and creative metadata.'}
(T/'data/launch-repair-reference.json').write_text(json.dumps(ref,ensure_ascii=False,indent=2)+'\n')
expected={'tavern':'8c25a176bbdf74d63cf88e27668667c9064adbd8','liquor':'bccba30898525efd42beb63fb2c4af41c664c1ac'}
for repo,rows in bundle.items():
 paths=list(rows['files'])+(['data/launch-repair-reference.json'] if repo=='tavern' else [])
 subprocess.run(['git','-C',repo,'add','--',*paths],check=True)
 actual=subprocess.check_output(['git','-C',repo,'write-tree'],text=True).strip()
 assert actual==expected[repo],('Tree differs from locally tested source',repo,actual,expected[repo])
 print(repo,actual)
