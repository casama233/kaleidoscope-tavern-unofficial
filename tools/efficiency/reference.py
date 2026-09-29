"""Hash-chained efficiency review layered over the unchanged integration ledger.

The original baseline/before/beforeProjected hashes and all existing assertions
remain authoritative. Overrides must start at exactly the previously reviewed
SHA-256, and every resulting runtime file is still checked by check_launch.py.
"""
import copy
import hashlib
import json
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def apply_efficiency_reference(reference, root):
    review = json.loads((root / 'data/efficiency-repair-reference.json').read_text())
    assert review['schema'] == 1
    result = copy.deepcopy(reference)
    for name, row in review['reviewedChanges'].items():
        assert name.startswith('runtime/BP/scripts/') and row['reason']
        assert row['before'] != row['after']
        assert digest(root / name) == row['after'], ('Efficiency source mutated', name)
        if name in result['reviewedChanges']:
            old = result['reviewedChanges'][name]
            assert old['after'] == row['before'], ('Efficiency review chain broken', name)
            old['after'] = row['after']
            old['reason'] += ' Efficiency review: ' + row['reason']
        else:
            assert result['newRuntimeFiles'].get(name) == row['before'], ('Efficiency review chain broken', name)
            result['newRuntimeFiles'][name] = row['after']
    for name, row in review['newRuntimeFiles'].items():
        assert name.startswith('runtime/BP/scripts/') and row['reason']
        assert name not in result['newRuntimeFiles'] and name not in result['reviewedChanges'] and name not in result.get('removedRuntimeFiles', {})
        assert digest(root / name) == row['after'], ('Efficiency addition mutated', name)
        result['newRuntimeFiles'][name] = row['after']
    return result


if __name__ == '__main__':
    import subprocess
    import sys
    root = Path(__file__).resolve().parents[2]
    original = json.loads((root / 'data/launch-repair-reference.json').read_text())
    apply_efficiency_reference(original, root)
    review = json.loads((root / 'data/efficiency-repair-reference.json').read_text())
    if len(sys.argv) > 1:
        baseline = Path(sys.argv[1])
        actual = subprocess.check_output(['git', '-C', str(baseline), 'rev-parse', 'HEAD'], text=True).strip()
        assert actual == review['againstCommit'], 'Incorrect efficiency baseline revision'
        for name, row in review['reviewedChanges'].items():
            assert digest(baseline / name) == row['before'], ('Incorrect efficiency before hash', name)
        for name in review['newRuntimeFiles']:
            assert not (baseline / name).exists(), ('Efficiency addition already exists', name)
    print('Efficiency source hash chain: PASS')
