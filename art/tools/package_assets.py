"""Deterministic A17 ZIP/mcaddon export with preflight. No production bypass switch."""
from pathlib import Path
import hashlib
import io
import json
import subprocess
import sys
import zipfile
import argparse
from interface_common import ROOT, dump
from release_gate import evaluate

BAD={'.pyc','.ttf','.otf','.ttc','.woff','.woff2','.jar','.class','.mcaddon','.mcpack','.zip'}
EXCLUDED={'__pycache__','.git','dist','node_modules','.dependency-backups','.pytest_cache','_intake_failed','external','dependencies'}
def allowed(p):
    return p.is_file() and not p.is_symlink() and p.suffix.lower() not in BAD and not any(x in EXCLUDED for x in p.parts)
def add(z,name,data):
    info=zipfile.ZipInfo(name,date_time=(2026,9,19,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
    z.writestr(info,data)
def pack_bytes(folder):
    buff=io.BytesIO()
    with zipfile.ZipFile(buff,'w') as z:
        for path in sorted(folder.rglob('*')):
            if allowed(path):add(z,path.relative_to(folder).as_posix(),path.read_bytes())
    return buff.getvalue()
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',type=Path,default=ROOT/'dist')
    p.add_argument('--profile',choices=['lab','production'],default='lab');a=p.parse_args()
    preflight=evaluate(ROOT,a.profile);dump(ROOT/f'docs/PREFLIGHT-{a.profile.upper()}.json',preflight)
    if not preflight['allowed']:
        print(json.dumps(preflight,ensure_ascii=False,indent=2));return 2
    subprocess.run([sys.executable,str(ROOT/'tools/verify_assets.py')],check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/validate_interfaces.py')],check=True)
    subprocess.run([sys.executable,'-m','unittest','discover','-s',str(ROOT/'tests'),'-p','test_a*_assets.py'],check=True)
    out=a.out.resolve()
    if out==ROOT or out in ROOT.parents:raise ValueError('Output must not be the project root or its ancestor')
    out.mkdir(parents=True,exist_ok=True)
    source=out/'Tavern-Assets-A17.zip';addon=out/'Tavern-A17-VisualLab.mcaddon'
    with zipfile.ZipFile(addon,'w') as z:
        add(z,'Tavern_A17_BP.mcpack',pack_bytes(ROOT/'VisualLab_BP'))
        add(z,'Tavern_A17_RP.mcpack',pack_bytes(ROOT/'RP'))
    pose=out/'Tavern-A17-PoseLab-OPTIONAL.mcpack'
    pose.write_bytes(pack_bytes(ROOT/'extras/PoseLab_RP'))
    with zipfile.ZipFile(source,'w') as z:
        for path in sorted(ROOT.rglob('*')):
            if allowed(path) and not path.is_relative_to(out):add(z,'Tavern-Assets-A17/'+path.relative_to(ROOT).as_posix(),path.read_bytes())
    records=[{'file':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in (source,addon,pose)]
    (out/'Tavern-A17-artifacts.sha256').write_text(''.join(r['sha256']+'  '+r['file']+'\n' for r in records))
    print(json.dumps(records,indent=2));return 0
if __name__=='__main__':raise SystemExit(main())
