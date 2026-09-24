#!/usr/bin/env python3
"""Package the committed runtime, without private server paths or old patches."""
import argparse, hashlib, json, shutil, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist')
    args=parser.parse_args();out=args.output.resolve()
    if out==ROOT or ROOT/'runtime'==out or (ROOT/'runtime') in out.parents:
        raise SystemExit('Output must not replace source runtime')
    out.mkdir(parents=True,exist_ok=True)
    config=json.loads((ROOT/'release.json').read_text())
    name=f"Kaleidoscope_Tavern_Unofficial_{config['version']}_rc1.mcaddon"
    target=out/name
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted((ROOT/'runtime').rglob('*')):
            if not p.is_file():continue
            if p.is_symlink():raise SystemExit(f'Symlink in runtime: {p}')
            info=zipfile.ZipInfo(p.relative_to(ROOT/'runtime').as_posix(),(2026,9,24,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
            z.writestr(info,p.read_bytes())
    sha=hashlib.sha256(target.read_bytes()).hexdigest()
    (out/'SHA256SUMS').write_text(f'{sha}  {name}\n')
    shutil.copy2(ROOT/f"docs/RELEASE-NOTES-{config['version']}.md",out/'RELEASE-NOTES.md')
    print(json.dumps({'archive':str(target),'sha256':sha,'bytes':target.stat().st_size}))
if __name__=='__main__':main()
