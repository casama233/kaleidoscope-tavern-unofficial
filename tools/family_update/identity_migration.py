"""Reviewed author identity changes, confined to a fresh stopped-world copy."""
from pathlib import Path
import re
from family_update.common import CONFIG, T, R, W, read, sha, hashes, atomic, report_ref


def validate_plan(spec, receipt, original):
    assert spec['schema'] == 1 and spec['kind'] == 'author_uuid_owner_migration'
    assert spec['authorization']
    pins = [p for p in read(T / 'family/upstream.lock.json')['upstream']
            if p['project_id'] == spec['project_id']]
    assert len(pins) == 1, 'Author migration must use one canonical upstream project'
    pin = pins[0]
    assert pin['file_id'] == spec['new_file_id'] and pin['sha256'] == spec['new_archive_sha256'], 'Author migration differs from the canonical release pin'
    old = {p['uuid']: p for p in original['packs']}
    new = {p['uuid']: p for p in receipt['packs']}
    swaps = spec['packs']
    assert all(re.fullmatch(r'[0-9a-f]{64}', value or '') for value in
               [spec['old_archive_sha256'], spec['new_archive_sha256'],
                *(p['old_manifest_sha256'] for p in swaps)]), 'Migration requires complete SHA256 values'
    assert len(swaps) == 2 and {p['side'] for p in swaps} == {'behavior', 'resource'}
    before = {p['old_uuid'] for p in swaps}; after = {p['new_uuid'] for p in swaps}
    assert len(before) == len(after) == 2 and not before & after
    assert {p['uuid'] for p in pin['packs']} == after, 'Migration must replace the complete pinned author pair'
    assert set(old) - before == set(new) - after, 'Unreviewed identity additions/removals'
    for swap in swaps:
        a, b = old[swap['old_uuid']], new[swap['new_uuid']]
        assert a['side'] == b['side'] == swap['side']
        assert a['version'] == swap['old_version'] and b['version'] == swap['new_version']
        assert a['files']['manifest.json'] == swap['old_manifest_sha256']
        prior_source = a['source']
        assert prior_source['owner'] in ['upstream', 'upstream_extended']
        assert prior_source['project_id'] == spec['project_id'] and prior_source['file_id'] == spec['old_file_id']
        assert prior_source['archive_sha256'] == spec['old_archive_sha256'], 'Original author archive differs from the reviewed migration'
        source = b['source']
        assert source['owner'] in ['upstream', 'upstream_extended']
        assert source['project_id'] == spec['project_id'] and source['file_id'] == spec['new_file_id']
        assert source['archive_sha256'] == spec['new_archive_sha256']
    expected = {p['old_uuid']: p['new_uuid'] for p in swaps if p['side'] == 'behavior'}
    assert spec['dynamic_property_owners'] == expected, 'Only author BP owns migrated data'
    return spec


def candidate_plan(receipt, original):
    location = CONFIG.get('identity_migration')
    if not location:
        assert {p['uuid'] for p in original['packs']} == {p['uuid'] for p in receipt['packs']}, 'UUID change needs a canonical reviewed migration'
        return None
    path = Path(location).resolve()
    assert path.parent == (T / 'family/identity-migrations').resolve(), 'Migration declaration must belong to canonical Git'
    return validate_plan(read(path), receipt, admitted_original(original))


def admitted_original(original):
    """Inventory has no provenance; bind it to the captured installed receipt."""
    policy = read(R / 'production-before/senluo-policy.json')
    path = Path(policy['approved_receipt'])
    assert str(path) == policy['installed']['receipt'] and sha(path) == policy['installed']['receipt_sha256'], 'Original admitted receipt identity changed'
    approved = read(path)
    rows = {p['uuid']: p for p in approved['packs']}
    assert len(rows) == len(approved['packs']) and set(rows) == {p['uuid'] for p in original['packs']}, 'Original inventory differs from admitted identities'
    packs = []
    for pack in original['packs']:
        prior = rows[pack['uuid']]
        assert all(pack[k] == prior[k] for k in ['side', 'version', 'files']), 'Original inventory differs from admitted contents'
        packs.append({**pack, 'source': prior['source']})
    return {**original, 'packs': packs}


def assembly_order(original):
    """Keep the reviewed complete stack; declared UUID swaps stay in place.

    Full archive/manifest/ownership validation still runs through candidate_plan
    immediately after assembly. This function never changes the world or policy.
    """
    order = {side: [ref['pack_id'] for ref in original['refs'][side]] for side in ['behavior', 'resource']}
    location = CONFIG.get('identity_migration')
    if not location:
        return order
    path = Path(location).resolve()
    assert path.parent == (T / 'family/identity-migrations').resolve(), 'Migration declaration must belong to canonical Git'
    spec = read(path)
    assert spec['schema'] == 1 and spec['kind'] == 'author_uuid_owner_migration'
    swaps = spec['packs']
    assert len(swaps) == 2 and {row['side'] for row in swaps} == {'behavior', 'resource'}
    for row in swaps:
        uids = order[row['side']]
        assert uids.count(row['old_uuid']) == 1 and row['new_uuid'] not in uids, 'Migration must replace one reviewed identity in place'
        uids[uids.index(row['old_uuid'])] = row['new_uuid']
    return order


def prepare_world(snapshot, receipt, original):
    spec = candidate_plan(receipt, original)
    if not spec:
        return snapshot, None
    assert not CONFIG.get('container_recovery_plan'), 'Review combined recovery and UUID migration separately'
    from family_saved_world import migrate
    target = R / 'reviewed-identity-world'
    result = migrate(snapshot, target, spec['dynamic_property_owners'])
    result.update(identity_spec=report_ref(Path(CONFIG['identity_migration'])), candidate_receipt_sha256=sha(R / 'release-candidate/family-receipt.json'), database_files=hashes(target / 'db'))
    atomic(R / 'saved-world-identity-migration.json', result)
    return target, result


def adopt_world(receipt, original):
    import os, shutil
    spec = candidate_plan(receipt, original)
    if not spec:
        return
    proof = read(R / 'saved-world-identity-migration.json')
    assert proof['identity_spec'] == report_ref(Path(CONFIG['identity_migration']))
    assert proof['candidate_receipt_sha256'] == sha(R / 'release-candidate/family-receipt.json')
    assert proof['uuid_mapping'] == spec['dynamic_property_owners'] and proof['unrelated_records_preserved']
    base = R / 'reviewed-identity-world'
    assert hashes(base / 'db') == proof['database_files'], 'Offline migrated database changed after rehearsal'
    assert hashes(W / 'db') == hashes(R / 'production-snapshot/db'), 'Adopt only this maintenance window database'
    stage = R / 'identity-adoption-stage'; stage.mkdir()
    shutil.copytree(base / 'db', stage / 'db')
    assert hashes(stage / 'db') == proof['database_files']
    # After the first rename, failure recovery must keep the compatible family
    # stopped. Never restart old owners or overwrite later player progress.
    atomic(R / 'production-identity-migration.json', {'state': 'adoption_started', 'proof': report_ref(R / 'saved-world-identity-migration.json'), 'database_files': proof['database_files']})
    os.replace(W / 'db', R / 'production-original-db')
    os.replace(stage / 'db', W / 'db')
    assert hashes(W / 'db') == proof['database_files']
    atomic(R / 'production-identity-migration.json', {'state': 'adopted_stopped', 'proof': report_ref(R / 'saved-world-identity-migration.json'), 'database_files': proof['database_files'], 'original_database': str(R / 'production-original-db')})
