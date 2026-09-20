#!/usr/bin/env python3
from pathlib import Path
import argparse, shutil, subprocess, json, zipfile, hashlib, os, sys
STAGES=['A17','C1','C2','C3','C4','C5','C6','C7']
DATES={'A17':'2026-09-19T11:55:21Z','C1':'2026-09-19T12:44:16Z','C2':'2026-09-19T13:38:09Z','C3':'2026-09-19T14:53:13Z','C4':'2026-09-19T15:32:06Z','C5':'2026-09-19T16:31:19Z','C6':'2026-09-19T17:16:26Z','C7':'2026-09-20T06:48:53Z'}
MSGS={
'A17':'A17: complete source art baseline and code handoff',
'C1':'C1: independent guide, extension API and first brewing runtime',
'C2':'C2: cultivation, quality bottles and native drink effects',
'C3':'C3: shaker, twelve cocktails and signature mixing',
'C4':'C4: portable shaker and immersive animation feedback',
'C5':'C5: native use lifecycle, potion data and custom effects',
'C6':'C6: sonic effect, stools and string lights gameplay',
'C7':'C7: furniture, text, worldgen, Molotov and source-style tap flow'}
PROHIBITED={'.jar','.class','.ttf','.otf','.ttc','.woff','.woff2'}

def run(cmd,cwd,env=None):
    print('+',*map(str,cmd),flush=True)
    subprocess.run([str(x) for x in cmd],cwd=cwd,env=env,check=True)

def overlay(stage, delta):
    f=delta/'files'
    if f.exists():
        for p in sorted(f.rglob('*')):
            if p.is_file():
                q=stage/p.relative_to(f);q.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,q)

def clean_prohibited(stage):
    bad=[]
    for p in stage.rglob('*'):
        if p.is_file() and p.suffix.lower() in PROHIBITED:bad.append(p)
    for p in bad:p.unlink()
    # never vendor Cookery archives/binaries even if a future snapshot accidentally includes one
    for p in list(stage.rglob('*')):
        if p.is_file() and 'cookery' in p.name.lower() and p.suffix.lower() in {'.mcaddon','.mcpack','.zip','.jar'}:p.unlink()
    return len(bad)

def fast_copytree(src,dst):
    dst.mkdir(parents=True,exist_ok=True)
    subprocess.run(['cp','-a','--reflink=auto',str(src)+'/.',str(dst)],check=True)

def prepare_a17(dest,boot,jar,upstream):
    overlay(dest,boot/'stages/A17')
    lock=json.loads((dest/'sources.lock.json').read_text())
    assert lock['commit']=='6b0d619145316492f055e03d70427107cd73efa8'
    for row in lock['assets']:
        src=upstream/row['path'];dst=dest/'upstream'/row['path']
        if not src.is_file():raise FileNotFoundError(src)
        raw=src.read_bytes();sha=hashlib.sha256(raw).hexdigest()
        if sha!=row['local_sha256']:raise ValueError(f"source sha mismatch {row['path']} {sha}")
        dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(raw)
    jar_sha=hashlib.sha256(jar.read_bytes()).hexdigest();assert jar_sha=='03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff',jar_sha
    with zipfile.ZipFile(jar) as z:
        chosen=[n for n in z.namelist() if n.startswith('assets/kaleidoscope_tavern/') and not n.endswith('/')]
        assert len(chosen)==1295,len(chosen)
        for n in chosen:
            q=dest/'upstream/uploaded-jar'/n;q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(z.read(n))
    run([sys.executable,'tools/build_assets.py','--force'],dest)
    # Rebuild the offline gallery; the preview directory is generated, not source input.
    (dest/'previews').mkdir(parents=True,exist_ok=True)
    if not os.environ.get('SKIP_PREVIEWS') and (dest/'tools/render_a17_preview.py').exists():
        try: run([sys.executable,'tools/render_a17_preview.py'],dest)
        except subprocess.CalledProcessError: print('WARN A17 preview renderer failed',file=sys.stderr)
    clean_prohibited(dest)

def prepare_c1(dest,a17,boot,jar):
    # C1 intentionally nests the frozen A17 project at art/ and keeps shared license files at root.
    fast_copytree(a17,dest/'art')
    for name in ['LICENSE-ASSETS','LICENSE-CODE','CREDITS.md']:
        if (a17/name).is_file():shutil.copy2(a17/name,dest/name)
    overlay(dest,boot/'stages/C1')
    # Runtime RP starts from exact A17 RP; generator then adds C1 resources without repainting art.
    fast_copytree(dest/'art/RP',dest/'runtime/RP')
    # Historical generator uses this absolute location for first recipe acquisition.
    Path('/mnt/data').mkdir(parents=True,exist_ok=True)
    target=Path('/mnt/data/kaleidoscopetavern-1.2.0-neoforge+mc1.21.1.jar')
    if not target.exists():shutil.copy2(jar,target)
    run([sys.executable,'tools/build_runtime.py'],dest)
    clean_prohibited(dest)

def prepare_next(label,dest,prev,boot):
    fast_copytree(prev,dest)
    # Apply explicit removals first, then changed source files.
    dfile=boot/f'stages/{label}/deletes.json'
    if dfile.exists():
        for rel in json.loads(dfile.read_text()):
            p=dest/rel
            if p.is_file():p.unlink()
            elif p.is_dir():shutil.rmtree(p)
    overlay(dest,boot/f'stages/{label}')
    run([sys.executable,'tools/build_runtime.py'],dest)
    # Keep current static validation and unit-test reports in each historical commit.
    if (dest/'tools/validate_runtime.py').exists():run([sys.executable,'tools/validate_runtime.py'],dest)
    test=dest/f'tools/test_{label.lower()}.py'
    if test.exists():run([sys.executable,str(test.relative_to(dest))],dest)
    for renderer in ['render_c4_motion.py','render_c6_preview.py','render_c7_preview.py']:
        if not os.environ.get('SKIP_PREVIEWS') and (dest/'tools'/renderer).exists():
            try:run([sys.executable,'tools/'+renderer],dest)
            except subprocess.CalledProcessError:
                # Preview renderers are supplemental; source/runtime history remains valid.
                print('WARN preview renderer failed:',renderer,file=sys.stderr)
    clean_prohibited(dest)

def sync_tree(src,repo):
    for p in list(repo.iterdir()):
        if p.name=='.git':continue
        if p.is_dir():shutil.rmtree(p)
        else:p.unlink()
    for p in src.iterdir():
        if p.name=='.git':continue
        q=repo/p.name
        if p.is_dir():shutil.copytree(p,q,symlinks=True)
        else:shutil.copy2(p,q)

def commit_stage(label,stage,repo):
    sync_tree(stage,repo)
    run(['git','add','-A'],repo)
    env=os.environ.copy();env.update(GIT_AUTHOR_DATE=DATES[label],GIT_COMMITTER_DATE=DATES[label],GIT_AUTHOR_NAME='Kaleidoscope Tavern Unofficial',GIT_AUTHOR_EMAIL='97009482+casama233@users.noreply.github.com',GIT_COMMITTER_NAME='Kaleidoscope Tavern Unofficial',GIT_COMMITTER_EMAIL='97009482+casama233@users.noreply.github.com')
    run(['git','commit','-m',MSGS[label]],repo,env)
    run(['git','tag','-f',label.lower()],repo)
    return subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--bootstrap',type=Path,required=True);ap.add_argument('--jar',type=Path,required=True);ap.add_argument('--upstream',type=Path,required=True);ap.add_argument('--work',type=Path,required=True);ap.add_argument('--git-repo',type=Path);a=ap.parse_args()
    shutil.rmtree(a.work,ignore_errors=True);a.work.mkdir(parents=True)
    built={}
    a17=a.work/'A17';a17.mkdir();prepare_a17(a17,a.bootstrap,a.jar,a.upstream);built['A17']=a17
    c1=a.work/'C1';c1.mkdir();prepare_c1(c1,a17,a.bootstrap,a.jar);built['C1']=c1
    prev=c1
    for label in STAGES[2:]:
        cur=a.work/label;cur.mkdir();prepare_next(label,cur,prev,a.bootstrap);built[label]=cur;prev=cur
    if a.git_repo:
        commits={}
        for label in STAGES:commits[label]=commit_stage(label,built[label],a.git_repo)
        print(json.dumps(commits,indent=2))
    else:
        print(json.dumps({k:sum(p.is_file() for p in v.rglob('*')) for k,v in built.items()},indent=2))
if __name__=='__main__':main()