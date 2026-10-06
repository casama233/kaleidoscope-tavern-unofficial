"""Reviewed author identity changes, confined to a fresh stopped-world copy."""
from pathlib import Path
from family_update.common import CONFIG, T, R, W, read, sha, hashes, atomic, report_ref


def validate_plan(spec, receipt, original):
    assert spec['schema'] == 1 and spec['kind'] == 'author_uuid_owner_migration'
    assert spec['authorization'] and spec['project_id'] == 1673664
    old = {p['uuid']: p for p in original['packs']}
    new = {p['uuid']: p for p in receipt['packs']}
    swaps = spec['packs']
    assert len(swaps) == 2 and {p['side'] for p in swaps} == {'behavior', 'resource'}
    before = {p['old_uuid'] for p in swaps}; after = {p['new_uuid'] for p in swaps}
    assert len(before) == len(after) == 2 and not before & after
    assert set(old) - before == set(new) - after, 'Unreviewed identity additions/removals'
    for swap in swaps:
        a, b = old[swap['old_uuid']], new[swap['new_uuid']]
        assert a['side'] == b['side'] == swap['side']
        assert a['version'] == swap['old_version'] and b['version'] == swap['new_version']
        assert a['files']['manifest.json'] == swap['old_manifest_sha256']
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
    return validate_plan(read(path), receipt, original)


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
