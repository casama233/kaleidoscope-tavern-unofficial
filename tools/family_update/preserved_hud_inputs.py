"""Five exact P34 HUD variants; no reconciliation of installed drift.

Current source CI verifies the declared presentation delta. This update's fresh
stopped-save first/restart validates the complete exact candidate afterwards.
Earlier native reports cannot stand in for that new candidate.
"""
import copy
from pathlib import Path
from family_update import common as c

PROFILE = 'senluo-hud-coexistence-20261012'
RECIPE = 'companion-sources/hud-coexistence-20261012/recipe.json'
PRIVATE = 'local/senluo-amw-cuisine'
PACKS = {
    'AMW_BP': ('cd107d2a-333f-4347-ab54-6917142be0d7', 'behavior', [2, 6, 27], [2, 6, 28]),
    'AMW_RP': ('994f73a2-05ec-41ce-876c-d388a526d9f5', 'resource', [2, 6, 27], [2, 6, 28]),
    'JS_BP': ('f65e943a-2128-4da8-9196-e9bf5b86739d', 'behavior', [1, 5, 4], [1, 5, 5]),
    'JS_RP': ('9071b6bc-915d-4d26-8486-05bb8db48762', 'resource', [1, 5, 4], [1, 5, 5]),
    'UIQUEUE_BP': ('2d4fb75b-c854-460b-a2f5-b4639e11eaa6', 'behavior', [1, 6, 0], [1, 6, 10034]),
}
PATCH_PATHS = {
    'AMW_BP': {'scripts/hud_transport.js', 'scripts/main.bundle.js', 'scripts/senluo_amw_queue.js', 'AMW_RUNTIME_BUILD.json'},
    'AMW_RP': {'ui/magic_hud_screen.json', 'ui/amwd_boss_hud.json', 'ui/_global_variables.json'},
    'JS_BP': {'scripts/saturation.js', 'scripts/senluo_saturation_hud.js', 'scripts/senluo_saturation_packet.js'},
    'JS_RP': {'ui/javacombat/saturation.json', 'ui/_global_variables.json'},
    'UIQUEUE_BP': {'scripts/UI.js', 'scripts/senluo_hud_delivery.js'},
}
HUD_FACTS = ['exact_raw_bundle_queue_hooks', 'standalone_pair_values_priority_expiry_equal',
         'actual_bundle_matches_raw', 'foreign_queue_behavior_equal', 'delivery_after_success_only',
         'stable_key_all_29_channels', 'queue_mode_has_no_off', 'foreign_frames_retained',
         'raw_bundle_queue_output_equal', 'matching_delivery_gates_next', 'latest_zero_edges_preserved',
         'server_namespace_contract', 'native_selection_expiry_preserved', 'ephemeral_service_absence_fallback',
         'removed_actor_releases_inflight', 'rp_29_prefix_caches_and_assets_preserved']
SATURATION_FACTS = ['fractional_thresholds_equal', 'graphical_packet_only', 'regeneration_pause_cadence_equal',
                    'original_textures_layout_equal', 'event_transport_no_actionbar']


def is_profile(review):
    return review.get('profile') == PROFILE


def checked(ref):
    assert set(ref) == {'path', 'sha256'} and c.sha(ref['path']) == ref['sha256'], 'HUD source reference changed'
    assert Path(ref['path']).is_absolute(), 'HUD source reference must be absolute'
    return c.read(Path(ref['path']))


def source_evidence(review, recipe):
    from family_update.extension_validation import source_binding
    proof = checked(review['source_validation'])
    assert Path(c.CONFIG['extension_cache_validation']).resolve() == Path(review['source_validation']['path']).resolve()
    baseline = c.read(c.EXTENSION / 'baseline.json')
    assert baseline['repository'] == PRIVATE and baseline['version'] == [1, 0, 34]
    assert proof['kind'] == 'cookery_recipe_cache'
    binding = source_binding(proof, baseline)
    assert review['source_commit'] == binding['actual_current_source_commit']
    report = checked(proof['hud_differential'])
    assert report['repository'] == PRIVATE and report['canonical_repository'] == 'casama233/senluo-family-integration-private' and report['canonical_repository_id'] == 1406868911
    assert report['schema'] == 1 and report['kind'] == 'senluo_hud_coexistence'
    assert report['git_tree'] == binding['current_source_tree_oid'] and report['version'] == [1, 0, 34]
    assert report['source_trees'] == baseline['source_trees']
    assert c.git(c.EXTENSION, 'rev-parse', report['source_commit'] + '^{tree}') == binding['current_source_tree_oid']
    assert report['recipe_sha256'] == review['recipe']['sha256']
    assert report['uuids'] == recipe['uuids'] and report['changed'] == recipe['changed']
    assert report['patch_review_sha256'] == recipe['patch_review_sha256'] and report['approved_inputs_sha256'] == recipe['approved_inputs_sha256']
    assert report['approved_input_receipt_sha256'] == recipe['approved_input_receipt_sha256']
    assert report['amw_provenance_sha256'] == recipe['output_hashes']['AMW_BP']['AMW_RUNTIME_BUILD.json']
    assert report['input_hashes'] == recipe['input_hashes'] and report['output_hashes'] == recipe['output_hashes']
    assert report['versions'] == recipe['versions']
    assert report['test_exit_code'] == 0 and report['test_commands'] == [
        ['node', 'companion-sources/hud-coexistence-20261012/hud-delivery.test.mjs'],
        ['node', 'companion-sources/hud-coexistence-20261012/tests/saturation-hud.test.mjs']]
    clean = report['clean_author_reproduction']
    assert clean['path'] == 'companion-sources/hud-coexistence-20261012/javasaturation-clean-author-reproduction.json'
    assert clean['archive_sha256'] == '3451361dff92d1a89f3d45bd7b7d699e88a2c9e6c5a0b8bea6d5ee37cb7fe0a7' and clean['file_id'] == 9071891
    assert c.sha(c.EXTENSION / clean['path']) == clean['sha256'], 'Clean author reproduction differs from the current source'
    hud, saturation = report['hud_delivery_facts'], report['saturation_facts']
    assert all(hud.get(f) is True for f in HUD_FACTS) and all(saturation.get(f) is True for f in SATURATION_FACTS)
    assert hud['channel_count'] == 29 and hud['amw_queue_key_count'] == 1 and hud['queue_mode_off_packets'] == 0
    assert saturation['native_rendering'] is False and saturation['client'] is False
    assert all(report[f] is False for f in ['client', 'simulated_players', 'native_loading', 'production_ready'])
    log = Path(proof['hud_differential']['path']).parent / report['test_log']['name']
    assert log.parent.resolve() == Path(proof['hud_differential']['path']).parent.resolve()
    assert c.sha(log) == report['test_log']['sha256'], 'Original HUD source test log changed'
    return proof['hud_differential'], binding


def validate_recipe(recipe, old, current):
    assert recipe['schema'] == 1 and recipe['profile'] == PROFILE and recipe['source_package_version'] == [1, 0, 34]
    assert set(recipe['uuids']) == set(recipe['output_hashes']) == set(recipe['input_hashes']) == set(recipe['changed']) == set(recipe['before_versions']) == set(recipe['versions']) == set(PACKS)
    assert recipe['client'] is False and recipe['production_ready'] is False
    for name, (uid, side, before_version, version) in PACKS.items():
        assert recipe['uuids'][name] == uid and recipe['before_versions'][name] == before_version and recipe['versions'][name] == version
        assert uid in old and uid in current and old[uid]['source']['owner'] == 'preserved'
        assert all(current[uid][f] == old[uid][f] for f in ['side', 'files', 'version']), 'HUD variants cannot approve installed drift'
        assert old[uid]['side'] == side and old[uid]['version'] == before_version
        assert recipe['input_hashes'][name] == old[uid]['files'], 'HUD canonical preimage differs from admission'
        before, after = recipe['input_hashes'][name], recipe['output_hashes'][name]
        changed = {p for p in set(before) | set(after) if before.get(p) != after.get(p)}
        assert changed == set(recipe['changed'][name]) == PATCH_PATHS[name] | {'manifest.json'}, 'HUD-only variant exceeds its fixed paths'
        assert set(before) <= set(after), 'HUD variant cannot remove existing content'
        for p in changed:
            assert recipe['changed'][name][p] == {'before': before.get(p), 'after': after.get(p)}


def validate_manifest(name, manifest, prior):
    """Only the five pinned identities/dependencies advance; all other APIs stay exact."""
    uid, _, old_version, version = PACKS[name]
    assert manifest['header']['uuid'] == prior['header']['uuid'] == uid
    assert prior['header']['version'] == old_version and manifest['header']['version'] == version
    old_label, new_label = '.'.join(map(str, old_version)), '.'.join(map(str, version))
    old_name = prior['header']['name']
    expected_name = old_name.replace(old_label, new_label) if old_label in old_name else old_name + ' [Senluo HUD ' + new_label + ']'
    assert manifest['header']['name'] == expected_name, 'HUD variant name differs from declared identity'
    normalized = copy.deepcopy(manifest)
    normalized['header']['name'], normalized['header']['version'] = old_name, old_version
    assert len(manifest['modules']) == len(prior['modules']), 'HUD module inventory differs'
    for module, old_module in zip(normalized['modules'], prior['modules'], strict=True):
        assert module['version'] == version and old_module['version'] == old_version
        module['version'] = old_version
    pins = {row[0]: (row[2], row[3]) for row in PACKS.values()}
    assert len(manifest.get('dependencies', [])) == len(prior.get('dependencies', [])), 'HUD dependency inventory differs'
    for dependency, old_dep in zip(normalized.get('dependencies', []), prior.get('dependencies', []), strict=True):
        expected = copy.deepcopy(old_dep)
        if old_dep.get('uuid') in pins:
            before, after = pins[old_dep['uuid']]
            assert old_dep['version'] == before, 'HUD dependency preimage differs'
            expected['version'] = after
        assert dependency == expected, 'HUD dependency changed beyond exact selected versions'
        if 'version' in old_dep: dependency['version'] = old_dep['version']
    assert normalized == prior, 'HUD variant changes identity/API/dependencies beyond paired version'


def verify_candidate(receipt, selected):
    assert selected['profile'] == PROFILE and selected['version'] == [1, 0, 34]
    assert set(selected['packs']) == set(PACKS), 'Complete five HUD outputs are required'
    recipe = checked(selected['recipe'])
    assert recipe['profile'] == PROFILE and set(recipe['output_hashes']) == set(PACKS)
    rows = {p['uuid']: p for p in receipt['packs']}
    assert len(rows) == len(receipt['packs']), 'HUD candidate duplicates an identity'
    for name, (uid, side, _, version) in PACKS.items():
        selected_row = selected['packs'][name]
        assert selected_row['uuid'] == uid and selected_row['side'] == side and selected_row['version'] == version
        row = rows.get(uid)
        assert row and row['source']['owner'] == 'preserved' and row['files'] == recipe['output_hashes'][name] and row['side'] == side and row['version'] == version, 'Assembled HUD variant bytes/identity changed'


def select(preserved, original, path, review):
    from family_update.prospective_preserved_inputs import committed, recipe_path, separate
    assert c.EXTENSION and not any(c.CONFIG.get(k) for k in ['approved_runtime_retention', 'extension_hold', 'held_sources', 'preserved_reconciliation', 'preserved_additions'])
    assert set(review) == {'schema', 'profile', 'source_commit', 'recipe', 'source_validation', 'packs'}
    assert type(review['schema']) is int and review['schema'] == 1 and is_profile(review) and set(review['packs']) == set(PACKS)
    assert set(review['recipe']) == set(review['source_validation']) == {'path', 'sha256'}
    assert Path(path).is_absolute() and not c.git(c.EXTENSION, 'status', '--porcelain')
    for source in [c.EXTENSION, *c.SOURCES.values()]:
        assert not Path(path).resolve().is_relative_to(Path(source).resolve()), 'HUD review must remain outside Git sources'
    committed(c.EXTENSION / 'baseline.json', 'baseline.json')
    recipe_pathname, relative = recipe_path(review)
    assert relative == RECIPE
    committed(recipe_pathname, relative)
    recipe = checked({'path': str(recipe_pathname), 'sha256': review['recipe']['sha256']})
    old, current = {p['uuid']: p for p in original['packs']}, {p['uuid']: p for p in preserved}
    approved = c.read(Path(c.read(c.R / 'production-before/senluo-policy.json')['approved_receipt']))
    admitted = {p['uuid']: p for p in approved['packs']}
    assert len(old) == len(original['packs']) and len(current) == len(preserved) and len(admitted) == len(approved['packs']), 'HUD captured identity duplicated'
    assert set(old) == set(admitted) and set(current) == {uid for uid, row in admitted.items() if row['source']['owner'] == 'preserved'}, 'HUD review cannot add or omit current identities'
    assert all(all(old[u][k] == admitted[u][k] for k in ['side', 'version', 'files']) for u in old), 'Captured family changed since admission'
    assert recipe['approved_input_receipt_sha256'] == c.sha(Path(c.read(c.R / 'production-before/senluo-policy.json')['approved_receipt'])), 'HUD recipe references another admitted family'
    validate_recipe(recipe, admitted, current)
    hud_ref, binding = source_evidence(review, recipe)
    protected = [c.B, c.W, c.Q, c.R, c.C, c.EXTENSION, *c.SOURCES.values()]
    roots, outputs, manifests = [], {}, {}
    for name, (uid, side, _, version) in PACKS.items():
        row = review['packs'][name]
        assert set(row) == {'path', 'uuid'} and row['uuid'] == uid
        root = separate(Path(row['path']), protected)
        assert all(root != p and root not in p.parents and p not in root.parents for p in roots)
        roots.append(root)
        assert c.hashes(root) == recipe['output_hashes'][name], 'HUD prepared output differs from source CI'
        manifest = c.read(root / 'manifest.json')
        prior = c.read(Path(current[uid]['path']) / 'manifest.json')
        assert c.sha(Path(current[uid]['path']) / 'manifest.json') == current[uid]['files']['manifest.json'], 'Captured HUD manifest changed'
        validate_manifest(name, manifest, prior)
        manifests[uid] = manifest
        outputs[name] = {'uuid': uid, 'path': str(root), 'side': side, 'version': version}
    for uid, manifest in manifests.items():
        for dep in manifest.get('dependencies', []):
            if dep.get('uuid') in manifests:
                assert dep['version'] == manifests[dep['uuid']]['header']['version'], 'HUD pair dependencies differ'
    evidence = {'schema': 1, 'profile': PROFILE, 'review': c.report_ref(path), 'source_commit': review['source_commit'], **binding,
                'version': [1, 0, 34], 'recipe': c.report_ref(recipe_pathname), 'source_validation': review['source_validation'],
                'hud_differential': hud_ref, 'packs': outputs, 'current_live_reconciled': False,
                'full_family_acceptance_still_required': True, 'client': False, 'production_ready': False}
    assert c.git(c.EXTENSION, 'rev-parse', 'HEAD') == review['source_commit'] and not c.git(c.EXTENSION, 'status', '--porcelain'), 'HUD source changed during selection'
    replacements = {p['uuid']: Path(p['path']) for p in outputs.values()}
    return [replacements.get(p['uuid'], Path(p['path'])) for p in preserved], evidence


def bind_native(receipt, evidence):
    if not c.CONFIG.get('prospective_preserved_inputs'):
        return
    review = c.read(Path(c.CONFIG['prospective_preserved_inputs']))
    if not is_profile(review):
        return
    selected = c.read(c.R / 'prospective-preserved-inputs-check.json')
    assert selected['profile'] == PROFILE and selected['review'] == c.report_ref(Path(c.CONFIG['prospective_preserved_inputs']))
    verify_candidate(receipt, selected)
    recipe = checked(selected['recipe'])
    assert selected['source_validation'] == review['source_validation'] and selected['version'] == [1, 0, 34]
    assert c.git(c.EXTENSION, 'rev-parse', 'HEAD') == selected['source_commit'] and c.git(c.EXTENSION, 'rev-parse', 'HEAD^{tree}') == selected['current_source_tree_oid'], 'HUD source changed before native binding'
    assert checked(selected['source_validation'])['hud_differential'] == selected['hud_differential']
    checked(selected['hud_differential'])
    assert evidence['fresh_stopped_backup'] and evidence['exact_files_checked'] and evidence['bds'] and evidence['saved_world_migration']
    assert evidence['candidate_receipt_sha256'] == c.sha(c.C / 'family-receipt.json')
    assert evidence['client'] is False and evidence['simulated_players'] is False
    assert [p['phase'] for p in evidence['runs']] == ['first', 'restart'] and all(p['ok'] and not p['errors'] for p in evidence['runs'])
    assert selected['recipe']['sha256'] == c.sha(c.EXTENSION / RECIPE), 'HUD recipe changed before native binding'
    c.atomic(c.R / 'hud-coexistence-native-validation.json', {'schema': 1, 'source': selected['hud_differential'],
             'fresh_native': c.report_ref(c.R / 'saved-world-report.json'), 'candidate_receipt_sha256': evidence['candidate_receipt_sha256'],
             'source_commit': selected['source_commit'], 'source_tree_oid': selected['current_source_tree_oid'],
             'version': [1, 0, 34], 'packs': {name: {'uuid': row[0], 'side': row[1], 'version': row[3], 'files': recipe['output_hashes'][name]} for name, row in PACKS.items()},
             'scope': 'Current exact five HUD variants loaded/restarted on this fresh stopped save; no player/client rendering or performance benchmark',
             'native_loading': True, 'saved_world_migration': True, 'client': False, 'production_ready': False})
