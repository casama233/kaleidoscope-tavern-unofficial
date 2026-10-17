"""Admit the exact versioned HUD repair, conserving prior gameplay/assets."""
import copy
import hashlib
import json
from pathlib import Path
from family_update import common as c

PRIVATE = 'local/senluo-amw-cuisine'
REPOSITORY = 'casama233/senluo-family-integration-private'
PREVIOUS = 'be7cf5287be8d6982052e409de6f9efc28d5cc0c'
VERSION = [1, 0, 35]
PROFILES = {
    (1, 0, 35): (PREVIOUS, [1, 0, 34]),
    (1, 0, 36): ('45ccf212681fcf429cb6b512ad6f09400eefc180', [1, 0, 35]),
    (1, 0, 37): ('aaeaacf28883d1aeb4a21cdde0dd0aa9e4ab5f56', [1, 0, 36]),
    (1, 0, 38): ('ef4a55dfc0d7b6ca6e2974950fe3685f695e7d53', [1, 0, 37]),
    (1, 0, 39): ('323470dfe1f20f2c31df20edebb77dce960bf18a', [1, 0, 38]),
    (1, 0, 40): ('fe9eef1cbf9a8bf4f73ace503b76160cb3e6dfc3', [1, 0, 39]),
    (1, 0, 42): ('dd8a0070231b9cac1a436f897bf41d036612f186', [1, 0, 41]),
}
PAIR_VERSION = [1, 0, 42]
PAIR_LOCAL = [1, 0, 10442]
PAIR_PROVIDER_VERSIONS = {
    'c2990d50-2cf7-59f7-886a-0f2d0240d156': ([0, 6, 168], [0, 6, 169]),
    'a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8': ([0, 1, 146], [0, 1, 147]),
}
PAIR_RENDERED_FILES = {
    'BP/manifest.json': 'c53ecdbd9c29e9afc8e6deb133a4f03f25037bfb1b886f365a817cf1cfc32ae5',
    'RP/manifest.json': '19b3e6c960e36a62da6d6b9a8c715ae154857cc95e006cc61b90568aaf8bf6e7',
    'RP/blocks.json': '51756e55a09a2896a801fcfce599ee53272e1722821fb447c54de8e744dd1fc3',
}
PAIR_RENDERER_SHA256 = 'cf51c3bff47fe0b2ab2e7eb228ecbe9b5c9a69fa1b7dcf54298a27c0e1b7126e'
EMPTY_CONTROL = {'type': 'panel', 'size': [0, 0]}
ACTIONBAR_LEAVES = ('hud_actionbar_text', 'hud_actionbar_text/actionbar_message')
STABLE_ACTIONBAR_FILTER = "((($kt_family_actionbar_text - 'KT_HUD!') = $kt_family_actionbar_text) and (($kt_family_actionbar_text - 'KG_HUD!') = $kt_family_actionbar_text) and (not (('%.4s' * $kt_family_actionbar_text) = '!js.')))"
STABLE_PROVIDER_VERSIONS = {
    'c2990d50-2cf7-59f7-886a-0f2d0240d156': ([0, 6, 163], [0, 6, 164]),
    'bbbd2d60-52e5-53a6-8b9a-c09b0f516389': ([2, 8, 138], [2, 8, 140]),
    'a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8': ([0, 1, 141], [0, 1, 142]),
}
DEPENDENCY_ONLY_PROVIDER_VERSIONS = {
    'c2990d50-2cf7-59f7-886a-0f2d0240d156': ([0, 6, 164], [0, 6, 165]),
    'bbbd2d60-52e5-53a6-8b9a-c09b0f516389': ([2, 8, 140], [2, 8, 141]),
    'a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8': ([0, 1, 142], [0, 1, 143]),
}
PRUNING_PROVIDER_VERSIONS = {
    'c2990d50-2cf7-59f7-886a-0f2d0240d156': ([0, 6, 165], [0, 6, 166]),
    'bbbd2d60-52e5-53a6-8b9a-c09b0f516389': ([2, 8, 141], [2, 8, 142]),
    'a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8': ([0, 1, 143], [0, 1, 144]),
}
VISIBLE_REPAIR_PROVIDER_VERSIONS = {
    'c2990d50-2cf7-59f7-886a-0f2d0240d156': ([0, 6, 166], [0, 6, 167]),
    'bbbd2d60-52e5-53a6-8b9a-c09b0f516389': ([2, 8, 142], [2, 8, 143]),
    'a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8': ([0, 1, 144], [0, 1, 145]),
}
PROVIDERS = {'c2990d50-2cf7-59f7-886a-0f2d0240d156', 'bbbd2d60-52e5-53a6-8b9a-c09b0f516389',
             'a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8', '994f73a2-05ec-41ce-876c-d388a526d9f5',
             '9071b6bc-915d-4d26-8486-05bb8db48762'}


def conserved_pair_renderer(old, new):
    from family_update import freezer_performance_validation as previous
    assert isinstance(old, dict) and isinstance(new, dict), 'P42 requires both exact renderer declarations'
    assert old['owner_version'] == [1, 0, 41] and old['local_pack_version'] == previous.LOCAL
    assert old['patched_files'] == previous.RENDERED_FILES
    assert new['owner_version'] == PAIR_VERSION and new['local_pack_version'] == PAIR_LOCAL
    assert set(PAIR_RENDERED_FILES) == {'BP/manifest.json', 'RP/manifest.json', 'RP/blocks.json'}
    assert PAIR_RENDERED_FILES['RP/blocks.json'] == previous.RENDERED_FILES['RP/blocks.json']
    assert new['patched_files'] == PAIR_RENDERED_FILES, 'Paired author manifest hashes differ'
    projected = copy.deepcopy(new)
    for key in ['owner_version', 'local_pack_version', 'patched_files']:
        projected[key] = old[key]
    assert projected == old, 'Renderer changed beyond exact owner/paired manifests'


def conserved_scope(old, new, old_manifest, new_manifest, side, own_uuids, version=VERSION, old_hud=None, new_hud=None, old_renderer=None, new_renderer=None):
    _, previous_version = PROFILES[tuple(version)]
    fallback_repair = version == [1, 0, 36]
    stable_filter_repair = version == [1, 0, 37]
    dependency_only_update = version in [[1, 0, 38], [1, 0, 39], [1, 0, 40], PAIR_VERSION]
    before, after = dict(old), dict(new)
    additions = {'ui/hud_screen.json', 'ui/_global_variables.json'} if side == 'RP' and version == VERSION else set()
    assert set(after) - set(before) == additions and not set(before) - set(after), 'Unexpected private runtime addition/removal'
    for name in additions:
        after.pop(name)
    allowed = {'manifest.json'}
    if side == 'BP' and version == PAIR_VERSION:
        conserved_pair_renderer(old_renderer, new_renderer)
        allowed.add('host-extensions/chinesefood-doll-renderer.json')
    if side == 'RP' and fallback_repair:
        projected_hud = copy.deepcopy(new_hud)
        assert projected_hud.pop('kt_family_empty') == EMPTY_CONTROL, 'Private HUD fallback differs'
        assert projected_hud == old_hud and 'kt_family_empty' not in old_hud, 'Private HUD changes beyond the missing fallback'
        allowed.add('ui/hud_screen.json')
    if side == 'RP' and stable_filter_repair:
        assert old_hud['kt_family_empty'] == new_hud['kt_family_empty'] == EMPTY_CONTROL, 'Private HUD fallback changed'
        projected_hud = copy.deepcopy(new_hud)
        for leaf in ACTIONBAR_LEAVES:
            assert projected_hud[leaf]['visible'] == STABLE_ACTIONBAR_FILTER, 'Private native actionbar filter differs'
            projected_hud[leaf]['visible'] = old_hud[leaf]['visible']
        assert projected_hud == old_hud, 'Private HUD changes beyond the two native filters'
        allowed.add('ui/hud_screen.json')
    assert all(before[name] == after[name] for name in before if name not in allowed), 'Private gameplay/storage/assets changed'
    projected = copy.deepcopy(new_manifest)
    assert projected['header']['version'] == version
    if version == PAIR_VERSION:
        assert projected['header']['name'].count('1.0.42') == 1
    projected['header']['version'] = previous_version
    projected['header']['name'] = projected['header']['name'].replace('.'.join(map(str, version)), '.'.join(map(str, previous_version)))
    for module in projected['modules']:
        assert module['version'] == version
        module['version'] = previous_version
    if side == 'RP':
        companions = [row for row in projected['dependencies'] if row.get('uuid') in PROVIDERS]
        assert len(companions) == len(PROVIDERS) and {row['uuid'] for row in companions} == PROVIDERS
        if version == VERSION:
            projected['dependencies'] = [row for row in projected['dependencies'] if row.get('uuid') not in PROVIDERS]
        elif stable_filter_repair or dependency_only_update:
            provider_versions = DEPENDENCY_ONLY_PROVIDER_VERSIONS if dependency_only_update else STABLE_PROVIDER_VERSIONS
            if version == [1, 0, 39]:
                provider_versions = PRUNING_PROVIDER_VERSIONS
            elif version == [1, 0, 40]:
                provider_versions = VISIBLE_REPAIR_PROVIDER_VERSIONS
            elif version == PAIR_VERSION:
                provider_versions = PAIR_PROVIDER_VERSIONS
            for dependency in companions:
                if dependency['uuid'] in provider_versions:
                    old_version, new_version = provider_versions[dependency['uuid']]
                    assert dependency['version'] == new_version, 'Private owned HUD provider version differs'
                    dependency['version'] = old_version
    for dependency in projected['dependencies']:
        if dependency.get('uuid') in own_uuids:
            assert dependency['version'] == version
            dependency['version'] = previous_version
    assert projected == old_manifest, 'Private manifest changes beyond identity/HUD dependencies'


def conserved_pair_baseline(old, new):
    assert old['repository'] == new['repository'] == PRIVATE
    assert old['version'] == [1, 0, 41] and new['version'] == PAIR_VERSION
    projected = copy.deepcopy(new)
    projected['version'] = old['version']
    projected['source_trees'] = old['source_trees']
    for side in ['BP', 'RP']:
        projected['packs'][side]['dependencies'] = old['packs'][side]['dependencies']
    assert projected == old, 'Private baseline changed beyond P42 identity/dependencies'


def conserved_pair_hosts(receipt, prior, renderer, freezer, spec_hashes, source_commit, owned_files):
    from family_update import freezer_performance_validation as previous
    packs = {row['uuid']: row for row in receipt['packs']}
    for uid, side in [(previous.HOST_BP, 'behavior'), (previous.HOST_RP, 'resource')]:
        host, old = packs[uid], prior[uid]
        assert host['side'] == old['side'] == side
        assert old['version'] == previous.LOCAL and host['version'] == PAIR_LOCAL
        assert set(host['files']) == set(old['files']), 'Unexpected ChineseFood file addition/removal'
        assert all(host['files'][name] == old['files'][name] for name in old['files'] if name != 'manifest.json'), 'ChineseFood changed beyond paired manifests'
        key = ('BP' if side == 'behavior' else 'RP') + '/manifest.json'
        assert old['files']['manifest.json'] == previous.RENDERED_FILES[key]
        assert host['files']['manifest.json'] == PAIR_RENDERED_FILES[key]
        source = host['source']
        assert source['owner'] == 'upstream_extended' and source['archive_sha256'] == previous.ARCHIVE
        rows = [row for row in source['reviewed_extensions'] if row.get('id') == renderer['id']]
        assert len(rows) == 1
        row = rows[0]
        assert row['owner_version'] == row['source_package_version'] == PAIR_VERSION and row['local_pack_version'] == PAIR_LOCAL
        assert row['spec_sha256'] == spec_hashes[previous.RENDERER]
        assert row['commit'] == source_commit and row['repository'] == PRIVATE and row['working_candidate'] is False
        assert row['official_author_release'] is False and 'retained_renderer_profile' not in row
        assert row['original_files'] == previous.AUTHOR_FILES and row['patched_files'] == PAIR_RENDERED_FILES
    host = packs[previous.HOST_BP]
    rows = [row for row in host['source']['reviewed_extensions'] if row.get('id') == freezer['id']]
    assert len(rows) == 1
    row = rows[0]
    assert row['version'] == freezer['version'] == [1, 0, 1] and row['owner_version'] == PAIR_VERSION
    assert row['spec_sha256'] == spec_hashes[previous.FREEZER]
    assert row['commit'] == source_commit and row['repository'] == PRIVATE and row['working_candidate'] is False
    assert row['original_files'] == freezer['original_files'] and row['patched_files'] == freezer['patched_files']
    copies = {target: {'source': name, 'sha256': owned_files[name]} for name, target in freezer['copies'].items()}
    assert row['copies'] == copies
    assert copies[previous.TARGET] == {'source': previous.HELPER, 'sha256': previous.HELPER_AFTER}
    assert all(host['files'][name] == value['sha256'] for name, value in copies.items()), 'Injected helper copy differs'
    assert all(host['files'][name] == digest for name, digest in freezer['patched_files'].items())


def pair_pack_files(receipt):
    from family_update import freezer_performance_validation as previous
    baseline = c.read(c.EXTENSION / 'baseline.json')
    expected = {row['uuid'] for row in baseline['packs'].values()} | {previous.HOST_BP, previous.HOST_RP}
    selected = {row['uuid']: row['files'] for row in receipt['packs'] if row['uuid'] in expected}
    assert set(selected) == expected, 'P42 private/ChineseFood pair is incomplete'
    return selected


def verify_static(receipt, prior):
    from family_update.extension_validation import source_binding
    from family_update.cookery_cache_validation import private_ci_records
    from family_update.workflow import gh_json
    path = Path(c.CONFIG['extension_hud_validation'])
    proof = c.read(path)
    baseline = c.read(c.EXTENSION / 'baseline.json')
    version = baseline['version']
    previous, previous_version = PROFILES[tuple(version)]
    assert baseline['repository'] == PRIVATE
    assert proof['kind'] == 'explicit_family_hud' and proof['canonical_repository'] == REPOSITORY and proof['canonical_repository_id'] == 1406868911
    binding = source_binding(proof, baseline)
    assert proof['git_tree'] == binding['current_source_tree_oid']
    assert proof['test_exit_code'] == 0 and proof['test_command'] == ['python', 'tools/test_family_hud_host.py']
    assert proof['native_controls'] == 29 and proof['literal_owned_roots'] == 2
    assert proof['native_and_amw_conserved'] and proof['dependency_bound']
    if version in [[1, 0, 36], [1, 0, 37], [1, 0, 38], [1, 0, 39], [1, 0, 40], PAIR_VERSION]:
        assert proof['typed_empty_fallback'] and proof['fallback_base'] == 'hud.kt_family_empty'
    assert all(proof[key] is False for key in ['native_loading', 'client', 'simulated_players', 'production_ready'])
    log = path.parent / proof['test_log']['name']
    assert log.parent.resolve() == path.parent.resolve() and c.sha(log) == proof['test_log']['sha256']
    pr = gh_json(f'repos/{REPOSITORY}/pulls/{c.CONFIG["extension_hud_pull_request"]}')
    assert pr['merged_at'] and pr['state'] == 'closed' and pr['base']['ref'] == 'main'
    assert c.git(c.EXTENSION, 'rev-parse', pr['head']['sha'] + '^{tree}') == binding['current_source_tree_oid']
    checks, statuses, unavailable = private_ci_records(REPOSITORY, pr['head']['sha'])
    assert proof['previous_commit'] == previous
    old_baseline = json.loads(c.git(c.EXTENSION, 'show', previous + ':baseline.json'))
    assert old_baseline['version'] == previous_version
    if version == PAIR_VERSION:
        c.git(c.EXTENSION, 'merge-base', '--is-ancestor', previous, binding['actual_current_source_commit'])
        conserved_pair_baseline(old_baseline, baseline)
    owned = [row for row in receipt['packs'] if row['source'].get('repository') == PRIVATE]
    assert len(owned) == 2 and receipt['order']['resource'][0] == baseline['packs']['RP']['uuid'], 'Explicit HUD must be the selected first resource host'
    own_uuids = {row['uuid'] for row in owned}
    pair_renderer = None
    for row in owned:
        side = 'BP' if row['side'] == 'behavior' else 'RP'
        old = prior[row['uuid']]
        assert old['version'] == previous_version and row['version'] == version
        hashes = proof['previous_files'][side]
        assert {'sha256': hashlib.sha256(json.dumps(hashes, sort_keys=True, separators=(',', ':')).encode()).hexdigest(), 'files': len(hashes)} == old_baseline['source_trees'][side], 'Private preimage is not the frozen canonical source'
        assert old['files'] == {name: digest for name, digest in proof['previous_files'][side].items()}, 'Installed private source differs from reviewed previous source'
        assert row['files'] == proof['files'][side]
        relative = baseline['runtime'][side] + '/manifest.json'
        old_manifest = json.loads(c.git(c.EXTENSION, 'show', previous + ':' + relative))
        new_manifest = c.read(c.EXTENSION / relative)
        old_hud = new_hud = old_renderer = new_renderer = None
        if side == 'RP' and version in [[1, 0, 36], [1, 0, 37]]:
            hud_relative = baseline['runtime'][side] + '/ui/hud_screen.json'
            old_hud = json.loads(c.git(c.EXTENSION, 'show', previous + ':' + hud_relative))
            new_hud = c.read(c.EXTENSION / hud_relative)
        if side == 'BP' and version == PAIR_VERSION:
            relative = baseline['runtime'][side] + '/host-extensions/chinesefood-doll-renderer.json'
            old_renderer = json.loads(c.git(c.EXTENSION, 'show', previous + ':' + relative))
            new_renderer = c.read(c.EXTENSION / relative)
            pair_renderer = new_renderer
            assert c.sha(c.EXTENSION / relative) == row['files']['host-extensions/chinesefood-doll-renderer.json'] == PAIR_RENDERER_SHA256
        conserved_scope(old['files'], row['files'], old_manifest, new_manifest, side, own_uuids, version, old_hud, new_hud, old_renderer, new_renderer)
        if version == PAIR_VERSION:
            assert baseline['packs'][side]['dependencies'] == new_manifest.get('dependencies', [])
        if side == 'RP':
            for dependency in new_manifest['dependencies']:
                if dependency.get('uuid') in PROVIDERS:
                    provider = next(p for p in receipt['packs'] if p['uuid'] == dependency['uuid'])
                    assert provider['side'] == 'resource' and provider['version'] == dependency['version']
    paired = {}
    if version == PAIR_VERSION:
        from family_update import freezer_performance_validation as prior_profile
        bp = c.EXTENSION / baseline['runtime']['BP']
        private_bp = next(row for row in owned if row['side'] == 'behavior')
        freezer = c.read(bp / prior_profile.FREEZER)
        specs = {name: c.sha(bp / name) for name in [prior_profile.FREEZER, prior_profile.RENDERER]}
        assert specs[prior_profile.FREEZER] == prior[private_bp['uuid']]['files'][prior_profile.FREEZER]
        assert c.sha(bp / prior_profile.HELPER) == prior_profile.HELPER_AFTER
        conserved_pair_hosts(receipt, prior, pair_renderer, freezer, specs,
                             binding['actual_current_source_commit'], private_bp['files'])
        paired = {'paired_host_identity_only': True,
                  'packs': pair_pack_files(receipt)}
    target = c.R / 'explicit-hud-static-validation.json'
    c.atomic(target, {'schema': 1, **binding, 'candidate_receipt_sha256': c.sha(c.C / 'family-receipt.json'),
                      'version': version, 'source': c.report_ref(path), 'checks': checks, 'statuses': statuses,
                      'unavailable_paid_service': unavailable, 'exact_private_scope': True, **paired, 'client': False, 'production_ready': False})
    return [c.report_ref(path), c.report_ref(log), c.report_ref(target)]


def bind_native(receipt, evidence):
    if not c.CONFIG.get('extension_hud_validation') or c.CONFIG.get('extension_performance_validation'):
        return
    static = c.read(c.R / 'explicit-hud-static-validation.json')
    assert static['candidate_receipt_sha256'] == evidence['candidate_receipt_sha256'] == c.sha(c.C / 'family-receipt.json')
    assert evidence['fresh_stopped_backup'] and evidence['exact_files_checked'] and evidence['bds'] and evidence['saved_world_migration']
    assert not evidence['client'] and not evidence['simulated_players']
    assert [row['phase'] for row in evidence['runs']] == ['first', 'restart']
    assert all(row['ok'] and not row['errors'] for row in evidence['runs'])
    paired = {}
    if static['version'] == PAIR_VERSION:
        assert static['paired_host_identity_only'] is True and static['packs'] == pair_pack_files(receipt)
        paired = {'version': PAIR_VERSION, 'packs': static['packs']}
    c.atomic(c.R / 'explicit-hud-native-validation.json', {'schema': 1, 'static': c.report_ref(c.R / 'explicit-hud-static-validation.json'), **paired,
             'fresh_native': c.report_ref(c.R / 'saved-world-report.json'), 'candidate_receipt_sha256': evidence['candidate_receipt_sha256'],
             'native_loading': True, 'saved_world_migration': True, 'client': False, 'production_ready': False})


def pairing_profile():
    return (c.CONFIG.get('extension_hud_validation') and not c.CONFIG.get('extension_performance_validation')
            and c.read(c.EXTENSION / 'baseline.json')['version'] == PAIR_VERSION)


def evidence_paths():
    if not pairing_profile():
        return []
    path = Path(c.CONFIG['extension_hud_validation'])
    proof = c.read(path)
    name = proof['test_log']['name']
    assert Path(name).name == name
    log = path.parent / name
    assert log.resolve().parent == path.parent.resolve() and c.sha(log) == proof['test_log']['sha256']
    return [path, log,
            c.R / 'explicit-hud-static-validation.json', c.R / 'explicit-hud-native-validation.json']


def verify_installation(receipt):
    if not pairing_profile():
        return
    static = c.read(c.R / 'explicit-hud-static-validation.json')
    native = c.read(c.R / 'explicit-hud-native-validation.json')
    assert static['source'] == c.report_ref(Path(c.CONFIG['extension_hud_validation']))
    assert static['version'] == native['version'] == PAIR_VERSION and static['paired_host_identity_only'] is True
    assert static['candidate_receipt_sha256'] == native['candidate_receipt_sha256'] == c.sha(c.C / 'family-receipt.json')
    assert static['packs'] == native['packs'] == pair_pack_files(receipt)
    assert native['static'] == c.report_ref(c.R / 'explicit-hud-static-validation.json')
    assert native['fresh_native'] == c.report_ref(c.R / 'saved-world-report.json')
    assert native['native_loading'] is True and native['saved_world_migration'] is True
    assert native['client'] is False and native['production_ready'] is False
