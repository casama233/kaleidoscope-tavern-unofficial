#!/usr/bin/env python3
"""Package the committed runtime, without private server paths or old patches.

Release identity (runtime == frozen baseline and release history) is enforced
when --identity is passed or when running inside the publish workflow; ordinary
CI packaging only proves the runtime packages and exports exactly.
"""
import argparse, hashlib, json, os, shutil, tempfile, zipfile
from pathlib import Path
from baseline_gate import check as baseline_check, read as baseline_read
from vibrant_audit import audit, source_records, verify_export
ROOT=Path(__file__).resolve().parents[1]
PUBLISH_WORKFLOW='Publish verified Tavern release'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist')
    parser.add_argument('--identity',action='store_true',help='enforce release identity (automatic in the publish workflow)')
    args=parser.parse_args();out=args.output.resolve()
    identity=args.identity or os.getenv('GITHUB_WORKFLOW')==PUBLISH_WORKFLOW
    baseline_check(baseline_read(ROOT/'baseline.json'),release=True,identity=identity)
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
    baseline_check(baseline_read(ROOT/'baseline.json'),archive=target,identity=identity)
    sha=hashlib.sha256(target.read_bytes()).hexdigest()
    (out/'SHA256SUMS').write_text(f'{sha}  {name}\n')
    shutil.copy2(ROOT/f"docs/RELEASE-NOTES-{config['version']}.md",out/'RELEASE-NOTES.md')
    print(json.dumps({'archive':str(target),'sha256':sha,'bytes':target.stat().st_size,'vibrant_manifest_export_checked':True,'release_identity_enforced':identity}))
if __name__=='__main__':main()
