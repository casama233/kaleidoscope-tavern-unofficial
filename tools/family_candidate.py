#!/usr/bin/env python3
"""Read-only candidate checks + deterministic packaging. No player simulations.
The release publisher is intentionally NOT triggered by this candidate tool.
"""
import argparse, hashlib, json, re, subprocess, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def digest(records):
    h=hashlib.sha256()
    for name,raw in sorted(records.items()):
        h.update(name.encode()+b'\0'+hashlib.sha256(raw).hexdigest().encode()+b'\n')
    return h.hexdigest()
def check(syntax=True):
    c=read(ROOT/'compat/family/candidate.json');allowed=set(c['allowedRuntimeChanges'])
    files={}
    manifests={side:read(ROOT/path/'manifest.json') for side,path in c['packs'].items()}
    for side,path in c['packs'].items():
        m=manifests[side];old=c['baselineManifests'][side]
        assert m['header']['version']==list(map(int,c['version'].split('.')))
        assert m['header']['uuid']==old['header']['uuid']
        assert all(x['version']==m['header']['version'] for x in m['modules'])
        # Normalize only the explicitly allowed version/dependency changes.
        normalized=json.loads(json.dumps(m));normalized['header']['version']=old['header']['version']
        normalized['dependencies']=old['dependencies']
        for module,prior in zip(normalized['modules'],old['modules']):module['version']=prior['version']
        assert normalized==old, 'Manifest identities/capabilities/engine requirements changed'
        expected=c['expectedDependencies'][side]
        assert m['dependencies']==expected, 'Unexpected dependency or unpaired pack version'
        for p in (ROOT/path).rglob('*'):
            if not p.is_file():continue
            assert not p.is_symlink()
            name=p.relative_to(ROOT).as_posix();raw=p.read_bytes();files[name]=raw
            if p.suffix=='.json':json.loads(raw.decode('utf-8-sig'))
            if p.suffix=='.js':
                for spec in re.findall(r"(?:from\s+|import\s*)['\"](\.[^'\"]+)['\"]",raw.decode()):
                    assert (p.parent/spec).resolve().is_file(), (name,spec)
                if syntax:subprocess.run(['node','--check',str(p)],capture_output=True,check=True)
    untouched={k:v for k,v in files.items() if k not in allowed}
    assert len(untouched)==c['untouchedCount']
    assert digest(untouched)==c['untouchedDigest'], 'Unrelated runtime content changed'
    assert allowed<=files.keys(), 'An explicitly preserved file was deleted'
    report={'version':c['version'],'baselineCommit':c['baselineCommit'],'files':len(files),
            'untouchedFiles':len(untouched),'untouchedDigest':digest(untouched),'allowedRuntimeChanges':sorted(allowed),
            'syntaxChecked':syntax,'nativeLoadTest':False,'clientTest':False,'simulatedPlayerTest':False,
            'automaticCookeryMigration':False,'wholeFamilyCompatible':False}
    return c,report

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--build',action='store_true');p.add_argument('--no-syntax',action='store_true');p.add_argument('--output',type=Path,default=ROOT/'dist/family');a=p.parse_args()
    c,r=check(not a.no_syntax)
    if a.build:
        output=a.output.resolve()
        assert output!=ROOT and all((ROOT/x).resolve()!=output and (ROOT/x).resolve() not in output.parents for x in c['packs'].values())
        output.mkdir(parents=True,exist_ok=True);target=output/c['archive']
        with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            for side,folder in c['packs'].items():
                for source in sorted((ROOT/folder).rglob('*')):
                    if not source.is_file():continue
                    name=side+'/'+source.relative_to(ROOT/folder).as_posix()
                    info=zipfile.ZipInfo(name,(2026,9,29,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
                    z.writestr(info,source.read_bytes())
        expected={side+'/'+f.relative_to(ROOT/path).as_posix():f.read_bytes() for side,path in c['packs'].items() for f in (ROOT/path).rglob('*') if f.is_file()}
        with zipfile.ZipFile(target) as z:
            assert len(z.namelist())==len(set(z.namelist())) and set(z.namelist())==set(expected)
            assert all(z.read(n)==raw for n,raw in expected.items())
        r.update(archive=target.name,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),archiveFullRuntimeMatch=True)
        (output/'VALIDATION.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
        (output/'SHA256SUMS').write_text(r['sha256']+'  '+target.name+'\n')
    print(json.dumps(r,ensure_ascii=False))
if __name__=='__main__':main()
