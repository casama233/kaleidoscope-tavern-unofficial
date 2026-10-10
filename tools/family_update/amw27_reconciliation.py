"""Conserve the reviewed friend's AMW26→27 repair without approving old drift."""
import copy
import hashlib
import json
import subprocess
from pathlib import Path
from family_update import common as c
from family_update.amw25_reconciliation import AMW, PRIVATE, snapshots, validate_delta

PROFILE = 'amw-server-2627'
SNAPSHOT_COMMIT = '8a4b4f48f029a7b25c0cda02cea123b8e09b67a2'
REVIEW_SHA256 = 'cad6d94f64a013b48c82252592414cce92ef79f6f061bc45df18e126be3ec3de'
REVIEW_PATH = 'companion-sources/amw-server-2627/review.json'
BASE_COMMIT = '60650543fd75f732e8377a4bc3bb661da31c6d6c'
BASE_PREFIX = 'companion-sources/amw2626-startup-reconciliation/observed26'
DELTA_PREFIX = 'companion-sources/amw-server-2627/observed'
ADDED = {'scripts/lib/audience-response.js', 'scripts/lib/boss-diagnostics.js'}
PATHS = {
    'BP': {'AMW_RUNTIME_BUILD.json', 'entities/troupe_zombie.json', 'manifest.json',
           'scripts/amethyst_encounter.js', 'scripts/interesing_combat.js',
           'scripts/main.bundle.js', 'scripts/phase_c/main.js',
           'scripts/rimefang_combat.js'} | ADDED,
    'RP': {'manifest.json'},
}


def conserved_after(before, delta, pins):
    """Apply only the stored sparse delta; unchanged bytes come from reviewed26."""
    assert set(delta) == set(pins), 'AMW27 sparse source omits or adds a reviewed path'
    after = {**before, **delta}
    a, b, changed = validate_delta(before, after, pins)
    return after, a, b, changed


def reconcile_amw27(inventory, expected, proof, path):
    assert proof.get('schema') == 1 and proof.get('profile') == PROFILE
    assert proof.get('source_provenance') and proof.get('review_reason')
    assert proof['observed_inventory'] == inventory, 'AMW27 observed full inventory changed'
    source = Path(proof['source_path'])
    head = proof['source_commit']
    target = c.read(source / '.repo-target.json')
    assert target['repository'] == PRIVATE and target['repository_id'] == 1406868911 and target['private'] is True, 'AMW27 source must remain private'
    assert source == c.EXTENSION and c.git(source, 'branch', '--show-current') == 'main' and not c.git(source, 'status', '--porcelain')
    assert c.git(source, 'rev-parse', 'HEAD') == head == c.git(source, 'ls-remote', 'origin', 'refs/heads/main').split()[0]
    c.git(source, 'merge-base', '--is-ancestor', BASE_COMMIT, SNAPSHOT_COMMIT)
    c.git(source, 'merge-base', '--is-ancestor', SNAPSHOT_COMMIT, head)
    raw = subprocess.check_output(['git', '-C', str(source), 'show', SNAPSHOT_COMMIT + ':' + REVIEW_PATH])
    assert hashlib.sha256(raw).hexdigest() == REVIEW_SHA256, 'AMW27 committed review changed'
    review = json.loads(raw)
    assert review['schema'] == 1 and review['profile'] == PROFILE
    assert (review['base_commit'], review['base_prefix'], review['delta_prefix']) == (BASE_COMMIT, BASE_PREFIX, DELTA_PREFIX)
    assert review['before_version'] == [2, 6, 26] and review['observed_version'] == [2, 6, 27]
    assert review.get('source_provenance') and review.get('review_reason')
    assert set(review['changed']) == {'BP', 'RP'}
    adjusted, pins, rows = copy.deepcopy(expected), {}, []
    for live in inventory['packs']:
        uid = live['uuid']
        if uid not in AMW:
            continue
        old, side = expected[uid], AMW[uid]
        assert old['source']['owner'] == 'preserved' and old['version'] == [2, 6, 26]
        assert live['side'] == old['side'] and live['version'] == [2, 6, 27]
        before = snapshots(source, BASE_COMMIT, BASE_PREFIX + '/' + side)
        delta = snapshots(source, SNAPSHOT_COMMIT, DELTA_PREFIX + '/' + side)
        assert set(review['changed'][side]) == PATHS[side], 'AMW27 review exceeds the fixed repair scope'
        after, a, b, changed = conserved_after(before, delta, review['changed'][side])
        assert set(after) - set(before) == (ADDED if side == 'BP' else set())
        assert a == old['files'] and b == live['files'], 'AMW27 original or observed bytes differ from conserved Git'
        original, current = json.loads(before['manifest.json']), json.loads(after['manifest.json'])
        assert original['header']['uuid'] == current['header']['uuid'] == uid
        assert current['header']['version'] == [2, 6, 27] and all(m['version'] == [2, 6, 27] for m in current['modules'])
        normalized = copy.deepcopy(current)
        for field in ['version', 'name', 'description']:
            normalized['header'][field] = original['header'][field]
        for module, prior in zip(normalized['modules'], original['modules'], strict=True):
            module['version'] = prior['version']
        for dependency in normalized.get('dependencies', []):
            if dependency.get('uuid') in AMW:
                assert dependency['version'] == [2, 6, 27]
                dependency['version'] = [2, 6, 26]
        assert normalized == original, 'AMW27 API, identity or unrelated dependency drift'
        adjusted[uid] = {**old, 'files': b, 'version': [2, 6, 27]}
        pins[uid] = [2, 6, 27]
        rows.append({'uuid': uid, 'changed': sorted(changed), 'local_server_release': True, 'author_release': False})
    assert len(rows) == 2 and set(pins) == set(AMW), 'AMW27 requires its complete pair'

    def checked(ref):
        assert c.sha(ref['path']) == ref['sha256'], 'AMW27 native evidence changed'
        return c.read(Path(ref['path']))

    tested, native = checked(proof['tested_family_receipt']), checked(proof['native_report'])
    validation = c.read(Path(c.CONFIG['extension_validation']))
    assert validation['source_commit'] == head and validation['version'] == [1, 0, 32]
    assert validation['tested_family_receipt'] == proof['tested_family_receipt'] and validation['preservation']['report'] == proof['native_report'], 'AMW27 must share the exact private32 native run'
    assert validation['preservation']['logs'] == proof['native_logs']
    tested_rows = {p['uuid']: p for p in tested['packs']}
    assert all(tested_rows[u]['files'] == adjusted[u]['files'] and tested_rows[u]['version'] == [2, 6, 27] for u in AMW)
    assert native['native_family_receipt'] == proof['tested_family_receipt'] and native['overlays'] == []
    assert native['test_world_only'] and native['client'] is False and native['simulated_players'] is False
    assert [r['phase'] for r in native['runs']] == ['first', 'restart']
    for run, ref in zip(native['runs'], proof['native_logs'], strict=True):
        assert run['ok'] and run['started'] and run['family_initialized'] and run['exit_code'] == 0 and not run['errors'] and run['real_player_connections'] == 0
        assert c.sha(ref['path']) == ref['sha256'] == run['log_sha256']
        text = Path(ref['path']).read_text()
        assert all(marker in text for marker in ['Server started.', '[MagicDatabase]', '[AMW Boss Debug] {"type":"ready"'])
    world = Path(proof['native_world'])
    assert world == Path(proof['native_report']['path']).parent / 'engine/worlds/Storage QA'
    for uid, side in AMW.items():
        assert c.hashes(world / ('behavior_packs' if side == 'BP' else 'resource_packs') / uid) == adjusted[uid]['files'], 'AMW27 native world bytes differ'
    c.atomic(c.R / 'preserved-reconciliation-check.json', {
        'source': c.report_ref(Path(path)), 'reviewed_changes': rows, 'source_commit': head,
        'conserved_source_commit': SNAPSHOT_COMMIT, 'conserved_review_sha256': REVIEW_SHA256,
        'old_drift_receipt_approved': False, 'policy_changed': False,
        'new_full_family_acceptance_still_required': True, 'client': False,
        'native_scope': 'Shared private32 zero-player startup/API initialization and restart; no boss combat or client acceptance',
    })
    return adjusted, pins
