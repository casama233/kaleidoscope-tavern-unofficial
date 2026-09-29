#!/usr/bin/env python3
"""One-time, narrowly scoped source repair for PR #102; no source export.

The input bytes are pinned to the reviewed PR101 snapshot. Original historical
before/beforeProjected hashes are preserved, not replaced by a new baseline.
This does not merge PRs, modify main, publish a release, or touch a game world.
"""
from pathlib import Path
import difflib
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
ORIGINAL = '81473f23682ed171dad238532050dcb07678745a'
ADAPTER = 'runtime/BP/scripts/bedrock/machines.js'
CORE = 'runtime/BP/scripts/core/machines.js'
EXPECTED = {
    ADAPTER: 'e17c852bebd00927e07c98f44373d929afc78fda04a3707758a8f2a71921f7d0',
    CORE: 'abf40c10e549114b7f3abb7ef9659d2a69cd799efa0d90a45aa831ed4814075c',
}
CURRENT_CORE = '2c4c1a9ce2c50d3444a6363e679db4b00169db5eb80c31cf873e97caa284fd26'
sha = lambda data: hashlib.sha256(data).hexdigest()

def original(path):
    data = subprocess.check_output(['git', 'show', f'{ORIGINAL}:{path}'], cwd=ROOT)
    if sha(data) != EXPECTED[path]:
        raise RuntimeError(f'Unexpected reviewed source: {path}')
    return data

def main():
    old = {path: original(path) for path in EXPECTED}
    adapter = ROOT / ADAPTER
    if adapter.read_bytes() != old[ADAPTER]:
        raise RuntimeError('Callback source has moved; review and reconcile instead of overwriting it')
    if sha((ROOT / CORE).read_bytes()) != CURRENT_CORE:
        raise RuntimeError('Ingredient/core repair differs from reviewed PR102 source')
    text = old[ADAPTER].decode('utf-8')
    replacements = [
        ('statusText,filledItem,NS}', 'statusText,filledItem,NS,BARREL_CHECK_INTERVAL}'),
        ('onTick:ev=>tickBarrel(ev.block,20)', 'onTick:ev=>tickBarrel(ev.block,BARREL_CHECK_INTERVAL)'),
    ]
    for before, after in replacements:
        if text.count(before) != 1:
            raise RuntimeError(f'Expected exactly one callback repair site: {before}')
        text = text.replace(before, after)
    revised = {ADAPTER: text.encode('utf-8'), CORE: (ROOT / CORE).read_bytes()}
    ledger_path = ROOT / 'data/launch-repair-reference.json'
    ledger = json.loads(ledger_path.read_text())
    rows = []
    for path, after in revised.items():
        row = ledger['reviewedChanges'].get(path)
        if row is not None:
            if row['after'] != EXPECTED[path]:
                raise RuntimeError(f'Review ledger moved: {path}')
            historical = {k: row[k] for k in ('before', 'beforeProjected')}
            row['after'] = sha(after)
            reason = (' Match the real 97-tick block callback to the shared Java cadence.'
                      if path == ADAPTER else
                      ' Accept ordinary non-fluid ingredients; unmatched recipes retain the vinegar fallback.')
            row['reason'] += reason
            if any(row[k] != v for k, v in historical.items()):
                raise RuntimeError('Historical proof changed')
        elif path in ledger.get('newRuntimeFiles', {}):
            if ledger['newRuntimeFiles'][path] != EXPECTED[path]:
                raise RuntimeError(f'New-file ledger moved: {path}')
            ledger['newRuntimeFiles'][path] = sha(after)
        else:
            # Previously unchanged core source: prove its exact historical bytes.
            baseline = subprocess.check_output(['git', 'show', f"{ledger['baselineCommit']}:{path}"], cwd=ROOT)
            if baseline != old[path]:
                raise RuntimeError(f'Unlisted historical source difference: {path}')
            ledger['reviewedChanges'][path] = {
                'before': sha(baseline), 'beforeProjected': sha(baseline),
                'after': sha(after),
                'reason': 'Reviewed mechanics repair: ordinary barrel inputs and one shared 97-tick cadence. No creative-menu projection applies to this core JS module.',
            }
        rows.append({'path': path, 'sourceCommit': ORIGINAL,
                     'beforeRepair': sha(old[path]), 'afterRepair': sha(after),
                     'patch': ''.join(difflib.unified_diff(old[path].decode().splitlines(True), after.decode().splitlines(True), fromfile=path, tofile=path))})
    adapter.write_bytes(revised[ADAPTER])
    ledger_path.write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + '\n')
    report = {'sourceCommit': ORIGINAL, 'historicalBaseline': ledger['baselineCommit'],
              'originalHistoricalHashesPreserved': True, 'reviewedChanges': rows,
              'nativeBds': 'NOT_RUN', 'clientAcceptance': 'NOT_RUN', 'releasePublished': False}
    (ROOT / 'data/mechanics-repair-20260929.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print('Applied exactly two adapter substitutions; preserved historical before hashes; wrote auditable repair deltas.')

if __name__ == '__main__':
    main()
