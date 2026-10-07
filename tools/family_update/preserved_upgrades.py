"""Reviewed whole-pack dependency upgrades; never approve or mutate live drift.

The original supplied archive, complete original inventory and four stable
foreign identities are explicit inputs. This is not a packaging transform.
"""
import hashlib
import json
import zipfile
from pathlib import Path
from family_update import common as c

TARGETS = {
    'cd107d2a-333f-4347-ab54-6917142be0d7': ('behavior', [2, 6, 22], 'BP/'),
    '994f73a2-05ec-41ce-876c-d388a526d9f5': ('resource', [2, 6, 22], 'RP/'),
    '379931a2-7419-40fb-90fb-34288ab4e971': ('behavior', [1, 5, 13], 'NOVELTY_BP/'),
    'ea8da0de-83d7-4ae2-aa43-bbcd4192e0c7': ('resource', [1, 5, 13], 'NOVELTY_RP/'),
}


def review(inventory):
    path = c.CONFIG.get('preserved_upgrades')
    if not path:
        return {}
    proof = c.read(Path(path))
    assert proof.get('schema') == 1 and proof.get('profile') == 'amw2622-novelty1513', 'Unknown preserved upgrade review'
    assert proof.get('source_provenance') and proof.get('review_reason'), 'Archive provenance and review reason required'
    assert proof['before_inventory'] == inventory, 'Reviewed full original inventory changed'
    assert proof['authorization'] == c.report_ref(c.AUTHORIZATION), 'Preserved upgrade authorization changed'
    policy = c.read(c.Q / 'senluo-policy.json')
    assert not set(TARGETS).intersection(policy['managed_uuids']), 'Owned family packages cannot use this foreign upgrade profile'
    expected = {p['uuid']: p for p in c.read(Path(policy['approved_receipt']))['packs']}
    prior = {p['uuid']: p for p in inventory['packs']}
    assert set(proof['packs']) == set(TARGETS), 'Complete reviewed AMW/Novelty pairs required'
    artifact = proof['archive']
    assert c.sha(artifact['path']) == artifact['sha256'], 'Supplied upgrade archive changed'
    selected = {}
    with zipfile.ZipFile(artifact['path']) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), 'Duplicate original archive members'
        for uid, (side, version, prefix) in TARGETS.items():
            assert uid in prior and expected[uid]['source']['owner'] == 'preserved'
            old = prior[uid]
            assert old['side'] == side and old['version'] < version, 'Foreign identity/upgrade direction differs'
            assert old['files'] == expected[uid]['files'] and old['version'] == expected[uid]['version'], 'Do not approve pre-existing foreign drift'
            row = proof['packs'][uid]
            root = Path(row['path']).resolve()
            assert Path(row['path']).is_absolute() and not Path(row['path']).is_symlink()
            for protected in [c.B, c.W, c.Q, c.R, *c.SOURCES.values()]:
                assert root != protected and not root.is_relative_to(protected) and not protected.is_relative_to(root), 'Upgrade source overlaps live/source/output'
            for entry in root.rglob('*'):
                assert not entry.is_symlink(), 'Symlink in reviewed external input'
            originals = {}
            for name in names:
                if not name.startswith(prefix) or name.endswith('/'):
                    continue
                rel = name[len(prefix):]
                assert rel and '..' not in Path(rel).parts and not Path(rel).is_absolute(), 'Invalid supplied pack member'
                originals[rel] = hashlib.sha256(archive.read(name)).hexdigest()
            assert originals and originals == row['files'] == c.hashes(root), 'Upgrade must be the exact complete supplied pack'
            manifest = c.read(root / 'manifest.json')
            assert manifest['header']['uuid'] == uid and manifest['header']['version'] == version
            assert all(m['version'] == version for m in manifest['modules']), 'New foreign module versions differ'
            for dep in manifest.get('dependencies', []):
                if dep.get('uuid') in TARGETS:
                    assert dep['version'] == TARGETS[dep['uuid']][1], 'Supplied foreign pair dependency differs'
            selected[uid] = {'uuid': uid, 'side': side, 'version': version, 'path': str(root), 'files': originals}
    return selected


def select_inputs(preserved, inventory):
    upgrades = review(inventory)
    if not upgrades:
        return [Path(p['path']) for p in preserved]
    assert set(upgrades).issubset({p['uuid'] for p in preserved}), 'Upgrade target not in preserved inventory'
    return [Path(upgrades.get(p['uuid'], p)['path']) for p in preserved]


def verify_candidate(receipt, inventory):
    upgrades = review(inventory)
    if not upgrades:
        return {}
    by_id = {p['uuid']: p for p in receipt['packs']}
    for uid, row in upgrades.items():
        pack = by_id[uid]
        assert pack['source']['owner'] == 'preserved' and pack['side'] == row['side']
        assert pack['version'] == row['version'] and pack['files'] == row['files'], 'Candidate foreign upgrade differs from reviewed archive'
    return upgrades
