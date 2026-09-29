#!/usr/bin/env python3
"""Replay the same current tests with pinned old, partial, and fixed runtime code.

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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-dir', type=Path, help='Optional exported main source, still hash-verified')
    parser.add_argument('--evidence', type=Path, required=True)
    args = parser.parse_args()
    assert os.environ.get('LIQUOR_SOURCE'), 'LIQUOR_SOURCE must name the pinned companion checkout'
    output = args.evidence.resolve()
    output.mkdir(parents=True, exist_ok=True)
    before = {}
    for name, digest in BEFORE.items():
        raw = (args.baseline_dir / name).read_bytes() if args.baseline_dir else subprocess.check_output(['git', 'show', BASE + ':' + name], cwd=ROOT)
        assert hashlib.sha256(raw).hexdigest() == digest, ('Incorrect original source', name)
        before[name] = raw
    fixed = {name: (ROOT / name).read_bytes() for name in BEFORE}
    assert all(fixed[name] != before[name] for name in BEFORE), 'Expected both reviewed fixes'
    evidence = {'baseline': BASE, 'clientTested': False,
                'testsUse': 'current production adapters with deterministic API doubles', 'runs': {}}
    loader = ['node', '--experimental-loader', './tools/pickup/mock-loader.mjs']
    try:
        for scenario in ('original-main', 'router-only', 'fixed'):
            for name in BEFORE:
                raw = before[name] if scenario == 'original-main' or (scenario == 'router-only' and name == AIM) else fixed[name]
                (ROOT / name).write_bytes(raw)
            evidence['runs'][scenario + '-routing'] = run_suite(scenario + '-routing', loader + ['--test', 'tools/glassware/storage-routing.test.mjs'], output)
            evidence['runs'][scenario + '-aim'] = run_suite(scenario + '-aim', ['node', '--test', 'tools/glassware/aim-hit.test.mjs'], output)
            replay = subprocess.run(loader + ['tools/glassware/replay-storage-touch.mjs'], cwd=ROOT, text=True, capture_output=True, timeout=30, check=True)
            row = json.loads(replay.stdout)
            (output / (scenario + '-replay.json')).write_text(json.dumps(row, indent=2) + '\n')
            assert row['selected']['slot'] == row['committed']['slot'] == (0 if scenario == 'original-main' else 2)
            aim_log = next(s for s in row['logs'] if s.startswith('[Tavern storage aim] '))
            assert json.loads(aim_log[len('[Tavern storage aim] '):])['used'] == 'aim'
    finally:
        for name, raw in fixed.items():
            (ROOT / name).write_bytes(raw)
    runs = evidence['runs']
    assert runs['original-main-routing']['exit'] == 1 and runs['original-main-routing']['fail'] > 0
    assert any('handoff replay reaches BOTH consumers' in s for s in runs['original-main-routing']['failures'])
    assert runs['original-main-aim']['exit'] == runs['router-only-aim']['exit'] == 1
    assert runs['original-main-aim']['fail'] == runs['router-only-aim']['fail'] > 0
    assert runs['router-only-routing']['failures'] == [
        'routed inventory + visual anchors: kaleidoscope_tavern:tilted_rack facing 1 Touch',
        'routed inventory + visual anchors: kaleidoscope_tavern:tilted_rack facing 3 Touch',
    ], 'The geometry fix must explain precisely the two remaining rack cases'
    assert runs['router-only-routing']['exit'] == 1
    assert runs['fixed-routing']['exit'] == runs['fixed-aim']['exit'] == 0
    assert runs['fixed-routing']['fail'] == runs['fixed-aim']['fail'] == 0
    (output / 'counterfactual-summary.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps({name: {k: v for k, v in row.items() if k != 'failures'} for name, row in runs.items()}, indent=2))


if __name__ == '__main__':
    main()
