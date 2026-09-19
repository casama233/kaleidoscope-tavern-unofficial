"""Single entry point for offline checks/builds. Does not install packages or access the network."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
from interface_common import ROOT, dump


def run(*args):
    subprocess.run(list(args), cwd=ROOT, check=True)

def main():
    p=argparse.ArgumentParser(description=__doc__); sub=p.add_subparsers(dest='cmd',required=True)
    sub.add_parser('check'); build=sub.add_parser('build');build.add_argument('--force',action='store_true')
    sub.add_parser('test'); export=sub.add_parser('package');export.add_argument('--out',type=Path,default=ROOT/'dist')
    export.add_argument('--profile',choices=['lab','production'],default='lab')
    a=p.parse_args()
    try:
        if a.cmd=='build':
            run(sys.executable,str(ROOT/'tools/build_assets.py'),*(['--force'] if a.force else []))
        if a.cmd in ('check','build'):
            run(sys.executable,str(ROOT/'tools/verify_assets.py'))
            run(sys.executable,str(ROOT/'tools/validate_interfaces.py'))
            run(sys.executable,'-m','unittest','discover','-s','tests','-p','test_a*_assets.py')
            run(sys.executable,str(ROOT/'tools/release_gate.py'),'--profile','lab')
        if a.cmd=='test':
            run(sys.executable,'-m','unittest','discover','-s','tests','-p','test_*.py','-v')
            node=shutil.which('node')
            if not node:raise RuntimeError('Node.js is required for SDK tests; no automatic download is performed')
            run(node,'--test','tests/interfaces.test.mjs','tests/visual-state.test.mjs')
            compiler=shutil.which('tsc')
            if compiler:run(compiler,'-p','tests/tsconfig.json')
            else:print('TypeScript check NOT RUN: tsc is not installed')
        if a.cmd=='package':
            run(sys.executable,str(ROOT/'tools/package_assets.py'),'--out',str(a.out),'--profile',a.profile)
        return 0
    except (subprocess.CalledProcessError,RuntimeError,ValueError) as e:
        print('ERROR:',e,file=sys.stderr);return 2

if __name__=='__main__':raise SystemExit(main())
