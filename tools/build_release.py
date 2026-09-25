#!/usr/bin/env python3
"""Package the committed runtime, without private server paths or old patches."""
import argparse, hashlib, json, shutil, tempfile, zipfile
from pathlib import Path
from vibrant_audit import audit, source_records, verify_export
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist')
    args=parser.parse_args();out=args.output.resolve()
    if out==ROOT or ROOT/'runtime'==out or (ROOT/'runtime') in out.parents:
        raise SystemExit('Output must not replace source runtime')
    # Gate the standalone build, not just CI. A declaration cannot disappear
    # in an exported package while only the source manifest is checked.
    report=audit(source_records([ROOT/'runtime']))
    if not report['ok']:raise SystemExit('\n'.join(report['errors']))
    out.mkdir(parents=True,exist_ok=True)
    config=json.loads((ROOT/'release.json').read_text())
    name=f"Kaleidoscope_Tavern_Unofficial_{config['version']}_{config.get('artifact_suffix','rc1')}.mcaddon"
    target=out/name
    with tempfile.NamedTemporaryFile(dir=out,suffix='.mcaddon.tmp',delete=False) as f:
        staged=Path(f.name)
    try:
        with zipfile.ZipFile(staged,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
            for p in sorted((ROOT/'runtime').rglob('*')):
                if not p.is_file():continue
                if p.is_symlink():raise SystemExit(f'Symlink in runtime: {p}')
                info=zipfile.ZipInfo(p.relative_to(ROOT/'runtime').as_posix(),(2026,9,24,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
                z.writestr(info,p.read_bytes())
        verify_export([ROOT/'runtime'],staged)
        staged.replace(target)
    finally:
        staged.unlink(missing_ok=True)
    sha=hashlib.sha256(target.read_bytes()).hexdigest()
    (out/'SHA256SUMS').write_text(f'{sha}  {name}\n')
    shutil.copy2(ROOT/f"docs/RELEASE-NOTES-{config['version']}.md",out/'RELEASE-NOTES.md')
    print(json.dumps({'archive':str(target),'sha256':sha,'bytes':target.stat().st_size,'vibrant_manifest_export_checked':True}))
if __name__=='__main__':main()
