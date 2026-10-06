"""Review already-installed, unrelated packs without approving old-family drift.

Only an exact original single-pack archive may explain an addition. Existing
identities, bytes and relative order remain under the immutable prior receipt.
The review permits candidate assembly, never policy or live-file writes.
"""
import copy
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile
from family_update import common as c


def review(inventory, expected, order, managed):
    path = c.CONFIG.get('preserved_additions')
    actual = {p['uuid']: p for p in inventory['packs']}
    assert len(actual) == len(inventory['packs']), 'Duplicate live identity'
    added = set(actual) - set(expected)
    assert set(expected) <= set(actual), 'Preserved review cannot remove packs'
    if not added:
        assert not path, 'An additions review cannot be reused for another stack'
        return expected, order
    assert path, 'Complete stack changed; review original addition archives'
    proof = c.read(Path(path))
    assert proof.get('schema') == 1 and proof.get('source_provenance') and proof.get('review_reason'), 'Addition provenance and review reason required'
    assert proof['observed_inventory'] == inventory, 'Reviewed complete inventory changed'
    assert set(proof['packs']) == added and not (added & set(managed)), 'Only new unrelated identities may be reviewed'
    adjusted = copy.deepcopy(expected)
    reviewed_order = copy.deepcopy(order)
    for side in ['behavior', 'resource']:
        refs = inventory['refs'][side]
        uids = [r['pack_id'] for r in refs]
        assert len(uids) == len(set(uids)), 'Duplicate pack reference'
        assert [uid for uid in uids if uid not in added] == order[side], 'Existing relative order changed'
        assert set(uids) == {uid for uid, p in actual.items() if p['side'] == side}, 'References differ from inventory'
        assert all(r['version'] == actual[r['pack_id']]['version'] for r in refs), 'Reference version differs'
        reviewed_order[side] = uids
    for uid in sorted(added):
        row = proof['packs'][uid]
        assert row.get('reason'), 'Each addition needs a recorded review'
        artifact = row['artifact']
        assert c.sha(artifact['path']) == artifact['sha256'], 'Reviewed original archive changed'
        with zipfile.ZipFile(artifact['path']) as archive:
            infos = [i for i in archive.infolist() if not i.is_dir()]
            assert len(infos) <= 10000 and sum(i.file_size for i in infos) <= 200 * 1024**2, 'Oversized preserved archive'
            names = [i.filename for i in infos]
            assert len(names) == len(set(names)), 'Duplicate archive entry'
            for info in infos:
                name = PurePosixPath(info.filename)
                assert not name.is_absolute() and '..' not in name.parts and '\\' not in info.filename, 'Unsafe archive path'
                assert not stat.S_ISLNK(info.external_attr >> 16), 'Archive links are forbidden'
            manifests = [name for name in names if PurePosixPath(name).name == 'manifest.json']
            assert len(manifests) == 1, 'Review one original pack per archive'
            prefix = manifests[0].removesuffix('manifest.json')
            assert all(name.startswith(prefix) for name in names), 'Files outside original pack'
            files = {name[len(prefix):]: hashlib.sha256(archive.read(name)).hexdigest() for name in names}
            manifest = json.loads(archive.read(manifests[0]))
        live = actual[uid]
        assert not c.G['family_pack'](live, {'managed_uuids': list(managed)}), 'Family definitions or dependencies need canonical adaptation'
        assert manifest['header']['uuid'] == uid and manifest['header']['version'] == live['version'], 'Original identity differs'
        side = 'resource' if all(m['type'] == 'resources' for m in manifest['modules']) else 'behavior'
        assert live['side'] == side and files == live['files'], 'Observed addition differs from original archive'
        assert all(m['version'] == live['version'] for m in manifest['modules']), 'Original module release differs'
        adjusted[uid] = {**live, 'source': {'owner': 'preserved', 'archive': artifact, 'review_reason': row['reason']}}
    c.atomic(c.R / 'preserved-additions-check.json', {
        'source': c.report_ref(Path(path)), 'added_uuids': sorted(added),
        'prior_receipt_changed': False, 'policy_changed': False,
        'new_full_family_acceptance_still_required': True, 'client': False,
    })
    return adjusted, reviewed_order
