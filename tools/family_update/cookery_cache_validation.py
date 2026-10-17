"""Narrow private cache repair: source CI first, this update's saved load later.

This accepts no gameplay or storage changes. It reuses no earlier native result
for the new pack. The common saved-world rehearsal remains mandatory.
"""
import copy
import hashlib
import json
import re
from pathlib import Path
from family_update.common import CONFIG, R, C, EXTENSION, read, sha, git, report_ref, atomic

REPOSITORY = 'casama233/senluo-family-integration-private'
REPOSITORY_ID = 1406868911
LOGICAL = 'local/senluo-amw-cuisine'
PREVIOUS = '8d05a3da291861048dc7e759be3ba96fde45ebb8'
OLD_VERSION, NEW_VERSION = [1, 0, 32], [1, 0, 33]
SPEC = 'host-extensions/cookery-recipe-cache-repair.json'
ARCHIVE = 'da12fe6d39d7514aff1de3c963d69899324d771be5ca0fc3da1ccb759c7ad458'

GUIDE_PREVIOUS = '0f1ea35b2347b99f27dc3e7c1459a4936aa9b0c1'
GUIDE_VERSION = [1, 0, 34]
GUIDE_SPEC = 'host-extensions/cookery-guide-startup-repair.json'
GUIDE_HELPER = 'scripts/host_api/cookery-guide-startup.js'
AMW_UUID = 'cd107d2a-333f-4347-ab54-6917142be0d7'
GUIDE_FACTS = ['latest_clean_hotpath_reproduced', 'normalized_chapters_equal', 'all_locales_roots_entries_preserved',
               'atomic_publication', 'end_order_equal', 'duplicate_transfers_equal', 'new_revision_equal', 'expiration_equal',
               'malformed_chapters_equal', 'chunk_boundary_equal', 'namespace_filter_preserves_protocol', 'normalization_slice_bounded']


def guide_identity_projection(manifest, own_uuids, side):
    value = copy.deepcopy(manifest)
    assert value['header']['version'] == GUIDE_VERSION, 'Guide pack identity differs'
    value['header']['version'] = NEW_VERSION
    name = value['header']['name']
    assert name.count('1.0.34') == 1, 'Guide pack name identity differs'
    value['header']['name'] = name.replace('1.0.34', '1.0.33', 1)
    for module in value['modules']:
        assert module['version'] == GUIDE_VERSION
        module['version'] = NEW_VERSION
    amw = []
    for dependency in value.get('dependencies', []):
        if dependency.get('uuid') in own_uuids:
            assert dependency['version'] == GUIDE_VERSION
            dependency['version'] = NEW_VERSION
        elif dependency.get('uuid') == AMW_UUID:
            assert dependency['version'] == [2, 6, 28], 'Guide pack AMW dependency differs'
            amw.append(dependency)
            dependency['version'] = [2, 6, 27]
    assert len(amw) == (1 if side == 'BP' else 0), 'Guide pack AMW dependency inventory differs'
    return value


def conserved_guide_packs(before, after, old_config, config, manifests):
    assert config['version'] == GUIDE_VERSION and old_config['version'] == NEW_VERSION
    assert config['repository'] == old_config['repository'] == LOGICAL
    expected = {'source_commit': PREVIOUS, 'spec_sha256': '292e337a073ea713c22c84c66f85a2c8cb9d2d5c453c308b1569107d2656b703'}
    assert config.get('retained_renderer_profile') == old_config.get('retained_renderer_profile') == expected, 'Unchanged renderer source retention missing'
    assert set(before) == set(after) == {p['uuid'] for p in config['packs'].values()}, 'Private guide pack set differs'
    for side in ['BP', 'RP']:
        uid = config['packs'][side]['uuid']
        previous, current = before[uid], after[uid]
        assert previous['version'] == NEW_VERSION and current['version'] == GUIDE_VERSION
        assert previous['side'] == current['side'] == ('behavior' if side == 'BP' else 'resource')
        assert tree(previous['files']) == old_config['source_trees'][side], 'Prior private source does not match approved P33'
        assert tree(current['files']) == config['source_trees'][side], 'Current private source does not match P34'
        old, new = dict(previous['files']), dict(current['files'])
        if side == 'BP':
            assert SPEC in old and old[SPEC] == new.get(SPEC), 'Approved P33 recipe cache declaration changed'
            assert not ({GUIDE_SPEC, GUIDE_HELPER} & old.keys()) and {GUIDE_SPEC, GUIDE_HELPER} <= new.keys(), 'Guide repair requires exactly its new declaration/helper'
            new.pop(GUIDE_SPEC); new.pop(GUIDE_HELPER)
        assert set(old) == set(new), 'Unexpected guide-only private file addition/removal'
        assert all(old[name] == new[name] for name in old if name != 'manifest.json'), 'Unrelated private gameplay/storage/assets changed'
        old_manifest, new_manifest = manifests[side]
        assert guide_identity_projection(new_manifest, set(after), side) == old_manifest, 'Private manifest changed beyond paired identity and AMW28 dependency'


def guide_report_facts(report, spec, config, current_tree, spec_sha, helper_sha):
    """Source-CI facts only. Their original checkout and log are bound separately."""
    from host_extensions import GUIDE_HOST_FILE, GUIDE_PREIMAGE, GUIDE_POSTIMAGE, GUIDE_HELPER_SHA
    assert report['schema'] == 1 and report['kind'] == 'cookery_guide_startup'
    assert report['repository'] == LOGICAL and report['canonical_repository'] == REPOSITORY and report['canonical_repository_id'] == REPOSITORY_ID
    assert report['git_tree'] == current_tree and report['version'] == config['version'] == GUIDE_VERSION and report['source_trees'] == config['source_trees']
    assert report['guide_spec_sha256'] == spec_sha and report['helper_sha256'] == helper_sha == spec['helper_sha256'] == GUIDE_HELPER_SHA
    assert report['original_registry_sha256'] == spec['original_files'][GUIDE_HOST_FILE] == GUIDE_PREIMAGE
    assert report['repaired_registry_sha256'] == spec['patched_files'][GUIDE_HOST_FILE] == GUIDE_POSTIMAGE
    provenance = report['fixture_provenance']
    assert provenance['official_archives'] == {'1.6.0': ARCHIVE, '1.6.1': '5b01865d4dd9a455cd80dae4ddc94dc45964e074025f7d24c6f0c5e35f0fbe52'}
    assert provenance['public_api_module_sha256'] == GUIDE_PREIMAGE
    assert provenance['installed'] is False and provenance['client'] is False
    assert report['latest_clean_version'] == '1.6.1' and report['latest_clean_registry_sha256'] == provenance['modules']['1.6.1'][GUIDE_HOST_FILE]
    assert report['slice_limit'] == report['max_slice_units'] == spec['slice_units'] == 24
    assert 0 <= report['repaired_callback_units'] <= 24 and report['latest_original_callback_units'] > 1000
    assert all(report.get(key) is True for key in GUIDE_FACTS), 'Private guide differential coverage missing'
    assert all(report[key] is False for key in ['client', 'simulated_players', 'native_loading', 'production_ready'])
    assert report['test_command'] == ['node', 'tools/cookery-guide-startup.test.mjs'] and report['test_exit_code'] == 0


def verify_guide_differential(ref, config, receipt, current_tree, gh_json):
    from host_extensions import validate_guide_startup_profile, GUIDE_HOST_FILE, GUIDE_HELPER_TARGET, GUIDE_HELPER_SHA
    assert sha(ref['path']) == ref['sha256'], 'Private guide differential evidence changed'
    report = read(Path(ref['path']))
    spec_path = EXTENSION / config['runtime']['BP'] / GUIDE_SPEC
    spec = read(spec_path)
    assert spec['kind'] == 'cookery-guide-startup-repair'
    helper_path = EXTENSION / config['runtime']['BP'] / GUIDE_HELPER
    host = next(p for p in receipt['packs'] if p['uuid'] == spec['host_uuid'])
    assert host['side'] == 'behavior' and host['version'] == [1, 6, 0]
    validate_guide_startup_profile(spec, host['source'])
    assert host['files'][GUIDE_HOST_FILE] == spec['patched_files'][GUIDE_HOST_FILE] and host['files'][GUIDE_HELPER_TARGET] == GUIDE_HELPER_SHA, 'Candidate guide repair postimage differs'
    repairs = host['source']['reviewed_extensions']
    declared = [row for row in repairs if row.get('id') == spec['id']]
    assert len(declared) == 1 and declared[0]['spec_sha256'] == sha(spec_path) and declared[0]['owner_version'] == GUIDE_VERSION
    assert declared[0]['copies'] == {GUIDE_HELPER_TARGET: {'source': GUIDE_HELPER, 'sha256': GUIDE_HELPER_SHA}}, 'Guide helper copy provenance differs'
    public = next(row for row in repairs if row.get('id') == 'kaleidoscope_grilling:family-api-0.2.10')
    assert report['fixture_provenance']['public_family_api_spec_sha256'] == public['spec_sha256'], 'Guide source fixture uses a different public API'
    guide_report_facts(report, spec, config, current_tree, sha(spec_path), sha(helper_path))
    assert isinstance(report['source_commit'], str) and re.fullmatch(r'[a-f0-9]{40}', report['source_commit'])
    assert gh_json(f'repos/{REPOSITORY}/git/commits/{report["source_commit"]}')['tree']['sha'] == current_tree, 'Actual guide differential checkout differs'
    log = Path(ref['path']).parent / report['test_log']['name']
    assert log.parent.resolve() == Path(ref['path']).parent.resolve() and sha(log) == report['test_log']['sha256']
    return {'guide_differential': ref, 'guide_spec_sha256': sha(spec_path), 'guide_helper_sha256': sha(helper_path)}


def tree(rows):
    return {'sha256': hashlib.sha256(json.dumps(rows, sort_keys=True, separators=(',', ':')).encode()).hexdigest(), 'files': len(rows)}


def identity_projection(manifest, own_uuids):
    value = copy.deepcopy(manifest)
    assert value['header']['version'] == NEW_VERSION, 'Cache pack identity differs'
    value['header']['version'] = OLD_VERSION
    name = value['header']['name']
    assert name.count('1.0.33') == 1, 'Cache pack name identity differs'
    value['header']['name'] = name.replace('1.0.33', '1.0.32', 1)
    for module in value['modules']:
        assert module['version'] == NEW_VERSION
        module['version'] = OLD_VERSION
    for dependency in value.get('dependencies', []):
        if dependency.get('uuid') in own_uuids:
            assert dependency['version'] == NEW_VERSION
            dependency['version'] = OLD_VERSION
    return value


def conserved_packs(before, after, old_config, config, manifests):
    if config['version'] == GUIDE_VERSION:
        return conserved_guide_packs(before, after, old_config, config, manifests)
    assert config['version'] == NEW_VERSION and old_config['version'] == OLD_VERSION
    assert config['repository'] == old_config['repository'] == LOGICAL
    assert config.get('retained_renderer_profile') == {'source_commit': PREVIOUS, 'spec_sha256': '292e337a073ea713c22c84c66f85a2c8cb9d2d5c453c308b1569107d2656b703'}, 'Unchanged renderer source retention missing'
    assert set(before) == set(after) == {p['uuid'] for p in config['packs'].values()}, 'Private cache pack set differs'
    uuids = set(after)
    for side in ['BP', 'RP']:
        uid = config['packs'][side]['uuid']
        previous, current = before[uid], after[uid]
        assert previous['version'] == OLD_VERSION and current['version'] == NEW_VERSION
        assert previous['side'] == current['side'] == ('behavior' if side == 'BP' else 'resource')
        assert tree(previous['files']) == old_config['source_trees'][side], 'Prior private source does not match approved P32'
        assert tree(current['files']) == config['source_trees'][side], 'Current private source does not match P33'
        old, new = dict(previous['files']), dict(current['files'])
        if side == 'BP':
            assert SPEC not in old and SPEC in new, 'Cache declaration must be the only new private file'
            new.pop(SPEC)
        assert set(old) == set(new), 'Unexpected cache-only private file addition/removal'
        assert all(old[name] == new[name] for name in old if name != 'manifest.json'), 'Unrelated private gameplay/storage/assets changed'
        old_manifest, new_manifest = manifests[side]
        assert identity_projection(new_manifest, uuids) == old_manifest, 'Private manifest changed beyond paired identity'


def classify_private_ci(checks, statuses):
    """A vendor refusing its paid service is not a completed lint/test result.

    Required actual canonical checks still succeed. Every functional failure or
    other unavailable service rejects this narrowly scoped private validation.
    """
    assert checks and all(c['status'] == 'completed' and c['conclusion'] in ['success', 'skipped', 'neutral'] for c in checks), 'Private CI checks incomplete or failed'
    assert any(c['name'] == 'baseline' and c['app_slug'] == 'github-actions' and c['conclusion'] == 'success' for c in checks), 'Private canonical functional CI missing'
    unavailable = []
    for status in statuses:
        if status['state'] == 'success': continue
        if (status['state'] == 'error' and status['context'] in ['pre-commit.ci - push', 'pre-commit.ci - pr']
                and status['description'] == 'error: private repos require a paid plan'
                and status['target_url'] == 'https://github.com/marketplace/pre-commit-ci'):
            unavailable.append(status)
        else:
            raise AssertionError('Private commit status failed: ' + status['context'])
    return unavailable


def private_ci_records(repository, head):
    from family_update.workflow import gh_json
    response = gh_json(f'repos/{repository}/commits/{head}/check-runs?per_page=100')
    assert response['total_count'] <= 100, 'Private check pagination needs review'
    latest = {}
    for check in response['check_runs']:
        identity = (check['name'], check['app']['id'])
        if identity not in latest or latest[identity]['id'] < check['id']: latest[identity] = check
    checks = [{**{field: row.get(field) for field in ['id', 'name', 'status', 'conclusion', 'html_url', 'completed_at', 'head_sha']},
               'app_slug': row['app']['slug']} for row in latest.values()]
    statuses = gh_json(f'repos/{repository}/commits/{head}/status')['statuses']
    unavailable = classify_private_ci(checks, statuses)
    return checks, statuses, unavailable


def verify_static(receipt, prior):
    from family_update.extension_validation import source_binding
    from family_update.workflow import gh_json
    path = Path(CONFIG['extension_cache_validation'])
    proof, config = read(path), read(EXTENSION / 'baseline.json')
    assert proof.get('kind') == 'cookery_recipe_cache', 'Unsupported private functional scope'
    assert config['version'] in [NEW_VERSION, GUIDE_VERSION], 'Unsupported private cache/guide version'
    guide = config['version'] == GUIDE_VERSION
    if guide:
        assert CONFIG.get('prospective_preserved_inputs') and isinstance(proof.get('guide_differential'), dict), 'P34 requires reviewed HUD inputs and guide differential'
    previous = GUIDE_PREVIOUS if guide else PREVIOUS
    original_binding = source_binding(proof, config)
    binding = {'actual_current_source_commit': original_binding['actual_current_source_commit'],
               'validated_source_commit': original_binding['native_source_commit'],
               'current_source_tree_oid': original_binding['current_source_tree_oid'],
               'validated_source_tree_oid': original_binding['native_source_tree_oid'],
               'identical_full_tree_reuse': original_binding['identical_full_tree_reuse']}
    assert git(EXTENSION, 'merge-base', previous, binding['actual_current_source_commit']) == previous
    old_config = json.loads(git(EXTENSION, 'show', previous + ':baseline.json'))
    after = {p['uuid']: p for p in receipt['packs'] if p['source'].get('repository') == LOGICAL}
    before = {uid: prior[uid] for uid in after if uid in prior}
    manifests = {side: (json.loads(git(EXTENSION, 'show', previous + ':' + relative + '/manifest.json')),
                        read(EXTENSION / relative / 'manifest.json')) for side, relative in config['runtime'].items()}
    conserved_packs(before, after, old_config, config, manifests)
    assert proof['packs'] == {uid: row['files'] for uid, row in after.items()}, 'Private functional pack bytes differ'
    spec_path = EXTENSION / config['runtime']['BP'] / SPEC
    spec = read(spec_path)
    assert spec['kind'] == 'cookery-recipe-cache-repair' and spec['archive_sha256'] == ARCHIVE
    target = 'scripts/api/extensionRegistry.js'
    assert set(spec['original_files']) == set(spec['patched_files']) == {target}
    assert not spec['imports'] and not spec['copies'] and not spec['json_updates']
    host = next(p for p in receipt['packs'] if p['uuid'] == spec['host_uuid'])
    assert host['side'] == 'behavior' and host['version'] == [1, 6, 0]
    assert host['files'][target] == spec['patched_files'][target], 'Candidate recipe cache postimage differs'
    assert any(row.get('id') == spec['id'] for row in host['source']['reviewed_extensions']), 'Cache repair provenance missing'
    metadata = read(EXTENSION / '.repo-target.json')
    assert metadata['repository'] == REPOSITORY and metadata['repository_id'] == REPOSITORY_ID and metadata['private'] is True
    repo = gh_json('repos/' + REPOSITORY)
    assert repo['id'] == REPOSITORY_ID and repo['full_name'] == REPOSITORY and repo['private'] is True
    pr = gh_json(f'repos/{REPOSITORY}/pulls/{proof["private_pull_request"]}')
    assert pr['merged'] is True and pr['base']['ref'] == 'main'
    assert pr['head']['repo']['id'] == pr['base']['repo']['id'] == REPOSITORY_ID
    assert git(EXTENSION, 'merge-base', pr['merge_commit_sha'], binding['actual_current_source_commit']) == pr['merge_commit_sha']
    current_tree = binding['current_source_tree_oid']
    # Current canonical source owns the actual functional run. The reviewed PR
    # head must have the same full tree; no failing check is relabelled/reused.
    checked = binding['actual_current_source_commit']
    assert gh_json(f'repos/{REPOSITORY}/git/commits/{pr["head"]["sha"]}')['tree']['sha'] == current_tree, 'Private reviewed source tree differs'
    assert gh_json(f'repos/{REPOSITORY}/git/commits/{checked}')['tree']['sha'] == current_tree, 'Private reviewed full Git tree differs'
    checks, statuses, unavailable = private_ci_records(REPOSITORY, checked)
    ref = proof['differential']
    assert sha(ref['path']) == ref['sha256'], 'Private recipe differential evidence changed'
    report = read(Path(ref['path']))
    assert report['schema'] == 1 and report['kind'] == 'cookery_recipe_cache'
    assert report['git_tree'] == current_tree and report['version'] == config['version'] and report['source_trees'] == config['source_trees']
    assert isinstance(report['source_commit'],str) and re.fullmatch(r'[a-f0-9]{40}',report['source_commit'])
    assert gh_json(f'repos/{REPOSITORY}/git/commits/{report["source_commit"]}')['tree']['sha'] == current_tree, 'Actual differential checkout differs'
    assert report['cache_spec_sha256'] == sha(spec_path) and report['fixture_provenance']['official_archive_sha256'] == ARCHIVE
    assert report['original_registry_sha256'] == spec['original_files'][target] == report['fixture_provenance']['modules'][target]
    assert report['repaired_registry_sha256'] == spec['patched_files'][target]
    assert report['client'] is False and report['simulated_players'] is False and report['native_loading'] is False
    assert report['registration_kind_count'] == 11 and report['ready_batches'] == 6
    assert report['original_rebuilds'] == 75 and report['repaired_rebuilds'] == 7
    assert all(report.get(key) is True for key in ['ordered_views_equal', 'registration_acks_equal', 'dynamic_overwrite_equal', 'all_five_getters_fresh', 'all_author_v1_kinds', 'invalid_registrations_equal', 'unrelated_station_does_not_rebuild_pots'])
    log = Path(ref['path']).parent / report['test_log']['name']
    assert log.parent.resolve() == Path(ref['path']).parent.resolve() and sha(log) == report['test_log']['sha256'] and report['test_exit_code'] == 0
    guide_details = verify_guide_differential(proof['guide_differential'], config, receipt, current_tree, gh_json) if guide else {}
    result = {'schema': 1, 'private_version': config['version'], 'conservation_base': previous, **guide_details,
              'validation_scope': 'cookery_recipe_cache_and_guide_startup' if guide else 'cookery_recipe_cache',
              'preserved_hud_inputs_required': guide,
              'scope': 'Pure original recipe/guide differential and conserved private gameplay; fresh current-candidate BDS/save is separately mandatory' if guide else 'Pure original recipe registry differential and unchanged private gameplay; fresh current-candidate BDS/save is separately mandatory',
              'source': report_ref(path), 'differential': ref, **binding, 'private_pull_request': proof['private_pull_request'],
              'private_checks': checks, 'private_statuses': statuses, 'unavailable_optional_services': unavailable, 'checked_canonical_commit': checked,
              'reviewed_pull_request_head': pr['head']['sha'], 'candidate_receipt_sha256': sha(C / 'family-receipt.json'),
              'packs': proof['packs'], 'spec_sha256': sha(spec_path), 'static_functional': True,
              'native_loading': False, 'saved_world_migration': False, 'client': False, 'production_ready': False}
    atomic(R / 'cookery-cache-static-validation.json', result)
    return [report_ref(path), ref, *([proof['guide_differential']] if guide else []), report_ref(R / 'cookery-cache-static-validation.json')]


def bind_native(receipt, evidence):
    """Called only after the normal fresh-native report has been validated."""
    if not CONFIG.get('extension_cache_validation'):
        return
    static = read(R / 'cookery-cache-static-validation.json')
    assert static['candidate_receipt_sha256'] == sha(C / 'family-receipt.json') == evidence['candidate_receipt_sha256']
    assert static['packs'] == {p['uuid']: p['files'] for p in receipt['packs'] if p['source'].get('repository') == LOGICAL}
    version = static.get('private_version', NEW_VERSION)
    assert version in [NEW_VERSION, GUIDE_VERSION] and all(p['version'] == version for p in receipt['packs'] if p['source'].get('repository') == LOGICAL), 'Fresh native private version differs'
    if version == GUIDE_VERSION:
        assert CONFIG.get('prospective_preserved_inputs') and static.get('guide_differential') and static.get('guide_spec_sha256') and static.get('guide_helper_sha256'), 'P34 source/guide/HUD binding missing'
    assert evidence['fresh_stopped_backup'] and evidence['exact_files_checked'] and evidence['bds'] and evidence['saved_world_migration']
    assert evidence['client'] is False and evidence['simulated_players'] is False
    assert [r['phase'] for r in evidence['runs']] == ['first', 'restart'] and all(r['ok'] and not r['errors'] for r in evidence['runs'])
    atomic(R / 'cookery-cache-native-validation.json', {'schema': 1, 'static': report_ref(R / 'cookery-cache-static-validation.json'),
           'fresh_native': report_ref(R / 'saved-world-report.json'), 'candidate_receipt_sha256': evidence['candidate_receipt_sha256'],
           'private_version': version,
           'scope': f'Current exact P{version[-1]} candidate loaded and restarted on this stopped save; cache/guide semantics are source-CI evidence, not an engine performance benchmark',
           'native_loading': True, 'saved_world_migration': True, 'client': False, 'production_ready': False})
