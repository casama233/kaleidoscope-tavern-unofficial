#!/usr/bin/env python3
"""Replay current tests against pinned pre-touch and pre-rotation runtime code.

Requires LIQUOR_SOURCE. Never a native client/BDS acceptance test. This tool replaces
only two runtime files temporarily, restores their exact bytes in finally, and keeps
all test sources unchanged. Run in an isolated checkout, not a deployed server pack.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE = '8add56c2bb8a9d5a6de18dee176cdf88bf87b08b'
AIM = 'runtime/BP/scripts/core/aim-hit.js'
ROUTER = 'runtime/BP/scripts/bedrock/stateful-storage-router.js'
BEFORE = {
    AIM: 'd2e1a00a85c508780acedea80922f8ff2877e0057fc07218b12472c1e0d860b5',
    ROUTER: 'd8cea39e9b6728b0a720ff6f622e49e6875e94b53dbc7bbf649659efae7706bb',
}


def run_suite(label, command, output):
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=120)
    text = result.stdout + result.stderr
    (output / (label + '.tap')).write_text(text, encoding='utf-8')
    metrics = {'exit': result.returncode}
    for key in ('tests', 'pass', 'fail', 'skipped', 'cancelled'):
        value = re.search(r'^# ' + key + r' (\d+)$', text, re.M)
        assert value, f'{label}: missing TAP summary, see evidence log'
        metrics[key] = int(value[1])
    metrics['failures'] = re.findall(r'^not ok \d+ - (.*)$', text, re.M)
    assert metrics['skipped'] == metrics['cancelled'] == 0, label
    return metrics


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--evidence',type=Path,required=True)
    args=parser.parse_args();output=args.evidence.resolve();output.mkdir(parents=True,exist_ok=True)
    assert os.environ.get('LIQUOR_SOURCE'),'LIQUOR_SOURCE must name the pinned companion checkout'
    previous='c34490c06c4c8fb1bc1c0444405181da90bbf932'
    old_router=subprocess.check_output(['git','show',previous+':'+ROUTER],cwd=ROOT)
    assert hashlib.sha256(old_router).hexdigest()=='251fd95b6b727ecef87349908a539b3a00ab4b40f035e6e6b6fc59bdce8d78ce'
    old_aim=subprocess.check_output(['git','show',BASE+':'+AIM],cwd=ROOT)
    assert hashlib.sha256(old_aim).hexdigest()==BEFORE[AIM]
    fixed={name:(ROOT/name).read_bytes() for name in (AIM,ROUTER)}
    evidence={'previous':previous,'geometryBaseline':BASE,'clientTested':False,'testsUse':'current production adapters with deterministic API doubles','runs':{}}
    loader=['node','--experimental-loader','./tools/pickup/mock-loader.mjs']
    try:
        for label,router in [('previous-baseline',old_router),('fixed',fixed[ROUTER])]:
            (ROOT/ROUTER).write_bytes(router)
            evidence['runs'][label+'-routing']=run_suite(label+'-routing',loader+['--test','tools/glassware/storage-routing.test.mjs'],output)
            replay=subprocess.run(loader+['tools/glassware/replay-storage-touch.mjs'],cwd=ROOT,text=True,capture_output=True,timeout=30,check=True)
            row=json.loads(replay.stdout);(output/(label+'-replay.json')).write_text(json.dumps(row,indent=2)+'\n')
            assert row['selected']['slot']==row['committed']['slot']==(0 if label=='previous-baseline' else 2)
            log=next(x for x in row['logs'] if x.startswith('[Tavern storage aim] '))
            assert json.loads(log[len('[Tavern storage aim] '):])['used']==('aim' if label=='previous-baseline' else 'event-world')
        (ROOT/AIM).write_bytes(old_aim)
        evidence['runs']['old-geometry']=run_suite('old-geometry',['node','--test','tools/glassware/aim-hit.test.mjs'],output)
        (ROOT/AIM).write_bytes(fixed[AIM])
        evidence['runs']['fixed-geometry']=run_suite('fixed-geometry',['node','--test','tools/glassware/aim-hit.test.mjs','tools/glassware/block-hit.test.mjs'],output)
    finally:
        for name,raw in fixed.items():(ROOT/name).write_bytes(raw)
    runs=evidence['runs']
    assert runs['previous-baseline-routing']['exit']==1 and runs['previous-baseline-routing']['fail']>0
    assert any('routed inventory + visual anchors' in name and 'Touch' in name for name in runs['previous-baseline-routing']['failures'])
    assert runs['old-geometry']['exit']==1 and runs['old-geometry']['fail']>0
    assert runs['fixed-routing']['exit']==runs['fixed-geometry']['exit']==0
    (output/'counterfactual-summary.json').write_text(json.dumps(evidence,indent=2)+'\n')
    print(json.dumps({name:{k:v for k,v in row.items() if k!='failures'} for name,row in runs.items()},indent=2))

if __name__=='__main__':main()
