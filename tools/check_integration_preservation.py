"""Verify immutable source provenance without replacing historical hash guards."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MAIN = '8d00a9c0399ab3812fa161a39c9254aed21876f2'


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def blob(commit, name):
    result = subprocess.run(['git', '-C', str(ROOT), 'show', commit + ':' + name], capture_output=True)
    return result.stdout if result.returncode == 0 else None


def sha(data):
    return hashlib.sha256(data).hexdigest() if data is not None else None


def original_bytes(row):
    if row['before'] is None:
        return None
    if 'beforeGzipBase64' in row:
        return gzip.decompress(base64.b64decode(row['beforeGzipBase64']))
    return row['beforeContent'].encode()


def check():
    review = json.loads((ROOT/'data/integration-preservation-review-20261004.json').read_text(encoding='utf-8'))
    assert review['schema'] == 1 and review['mainCommit'] == MAIN
    source = review['integratedSourceCommit']
    main = json.loads(blob(MAIN, 'data/baseline-reconciliation.json'))
    ledger = json.loads((ROOT/'data/baseline-reconciliation.json').read_text(encoding='utf-8'))
    assert ledger['againstCommit'] == main['againstCommit'] and ledger['testOnly'] is True
    for name, old in main['files'].items():
        current = ledger['files'][name]
        for field, value in old.items():
            if field not in {'after', 'reason'}:
                assert current[field] == value, ('Historical preimage/metadata changed',name,field)
    changed = set(git('diff','--name-only',MAIN,source,'--','runtime').decode().splitlines())
    assert set(review['files']) == changed, 'Incomplete integration review'
    for name, row in review['files'].items():
        current = (ROOT/name).read_bytes()
        old = blob(MAIN,name)
        assert sha(old) == row['mainSha256'], ('Wrong main source',name)
        assert sha(blob(source,name)) == row['currentSha256'] == sha(current), ('Integrated source mutated',name)
        historical = ledger['files'][name]
        assert historical['after'] == row['currentSha256']
        assert sha(original_bytes(historical)) == historical['before'] == row['historicalBeforeSha256']
        if name not in main['files']:
            assert original_bytes(historical) == old, ('New preimage differs from main',name)
        for origin in row['sourceChanges']:
            parent = git('rev-parse',origin['commit']+'^').decode().strip()
            assert origin['parent'] == parent
            assert sha(blob(parent,name)) == origin['beforeSha256']
            assert sha(blob(origin['commit'],name)) == origin['afterSha256']
            assert origin['beforeSha256'] != origin['afterSha256']
    for name, row in review['preservationAnchors'].items():
        assert sha(blob(MAIN,name)) == row['mainSha256']
        assert sha((ROOT/name).read_bytes()) == row['currentSha256'] == sha(blob(source,name))
        if 'historicalCommit' in row:
            assert sha(blob(row['historicalCommit'],name)) == row['historicalBeforeSha256']
            assert ledger['files'][name]['before'] == row['historicalBeforeSha256']
        if 'efficiencyBeforeCommit' in row:
            assert sha(blob(row['efficiencyBeforeCommit'],name)) == row['efficiencyBeforeSha256']
    # These content files must survive main verbatim; only the shared payload's
    # version is intentionally changed and covered by the runtime review above.
    for name in ['core/guide-preparation-text.js','core/guide-preparation.js',
                 'core/standalone-guide-model.js','data/guide-catalog.js','data/guide-native-names.js']:
        path = 'runtime/BP/scripts/' + name
        assert (ROOT/path).read_bytes() == blob(MAIN,path), ('Main guide repair lost',path)
    from efficiency.reference import apply_efficiency_reference
    from baseline_reference import previous_bytes
    reference = json.loads((ROOT/'data/launch-repair-reference.json').read_text(encoding='utf-8'))
    apply_efficiency_reference(reference,ROOT)
    for name in ledger['files']:
        previous_bytes(ROOT,ROOT/name)
    print(f'Integration provenance and original preimages: PASS ({len(changed)} runtime changes, 3 preservation anchors).')


if __name__ == '__main__':
    check()
