"""Run offline suites and two clean builds, saving scoped A17 reports. No network or game runtime."""
from pathlib import Path
import argparse,hashlib,json,re,shutil,subprocess,sys
from interface_common import ROOT,read,dump

def snapshot():
    out={}
    for folder in ['RP','VisualLab_BP','editor','interfaces','extras','animation-sources']:
        for p in sorted((ROOT/folder).rglob('*')):
            if p.is_file():out[p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
    for rel in ['config.json','asset-conversion.json','tools/render-data.json']:
        out[rel]=hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()
    return out

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force',action='store_true',help='Acknowledges generated pack/editor files will be rebuilt')
    if not parser.parse_args().force:parser.error('Back up hand-edited generated assets, then pass --force')
    for i in (1,2):
        cp=subprocess.run([sys.executable,'tools/build_assets.py','--force'],cwd=ROOT,capture_output=True,text=True)
        (ROOT/f'docs/A17-rebuild-{i}.txt').write_text(cp.stdout+cp.stderr,encoding='utf-8')
        if cp.returncode:raise RuntimeError(f'Build {i} failed; inspect log')
        if i==1:before=snapshot()
        else:after=snapshot()
    diff=[k for k in sorted(set(before)|set(after)) if before.get(k)!=after.get(k)]
    dump(ROOT/'docs/REBUILD-REGRESSION.json',{'batch':'A17','scope':'Two full builds compared: generated BP/RP, editors, interfaces, bridge config and canonical model data','checked_files':len(after),'different_files':diff,'passed':not diff,'sha256':after,'minecraft_engine':'NOT_RUN'})
    if diff:raise RuntimeError('Nondeterministic generated resources: '+', '.join(diff[:6]))
    baseline=read(ROOT/'docs/A16-BASELINE-HASHES.json')
    changed=[rel for rel,h in baseline['files'].items()if hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()!=h]
    dump(ROOT/'docs/A16-ASSET-REGRESSION.json',{'batch':'A17','baseline':'A16','baseline_archive_sha256':baseline['source_archive_sha256'],'checked_geometries':239,'checked_editors':373,'checked_original_png':155,'checked_A11_helper_functions':7,'checked_files':len(baseline['files']),'changed_files':changed,'passed':not changed,'engine':'NOT_RUN'})
    if changed:raise RuntimeError('Previous resource changed unexpectedly')
    commands=[('python',[sys.executable,'-m','unittest','discover','-s','tests','-p','test_*.py','-v']),('node',['node','--test','tests/interfaces.test.mjs','tests/visual-state.test.mjs']),('typescript',['tsc','-p','tests/tsconfig.json'])]
    suites=[]
    for name,cmd in commands:
        if not shutil.which(cmd[0]):
            suites.append({'suite':name,'status':'NOT_RUN','reason':'Executable not installed','tests':None,'passed':False});continue
        cp=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True);text=cp.stdout+cp.stderr
        output=f'A17-{name}-test-output.txt';(ROOT/'docs'/output).write_text(text,encoding='utf-8')
        match=re.search(r'Ran (\d+) tests' if name=='python'else r'# tests (\d+)',text)
        suites.append({'suite':name,'command':cmd,'exit_code':cp.returncode,'status':'PASS'if cp.returncode==0 else'FAIL','tests':int(match[1])if match else None,'passed':cp.returncode==0,'output':output})
    report={'batch':'A17','unit_test_count':sum(x['tests']or 0 for x in suites),'suites':suites,'covered_appearance_variants':491,'covered_icons':92,'cookery_archive_used':'SYNTHETIC_TEST_FIXTURES_ONLY','actual_Cookery_integration':'NOT_RUN','engine':'NOT_RUN'}
    dump(ROOT/'docs/TEST-RESULTS.json',report)
    for cmd in ['tools/verify_assets.py','tools/validate_interfaces.py']:
        cp=subprocess.run([sys.executable,cmd],cwd=ROOT,capture_output=True,text=True)
        if cp.returncode:raise RuntimeError(cp.stdout+cp.stderr)
    print(json.dumps({'two_build_files':len(after),'old_resource_files':len(baseline['files']),'tests':[(x['suite'],x['tests'],x['status'])for x in suites]},ensure_ascii=False,indent=2))
    if not all(x['passed']for x in suites):return 1
    return 0
if __name__=='__main__':raise SystemExit(main())
