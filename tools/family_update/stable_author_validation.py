"""Exact P48 stable-author source admission, followed by this stopped save's load.

The new CI artifact proves source operations only. It cannot borrow an old
freezer/native report or establish rendered-client or performance acceptance.
"""
from functools import lru_cache
from pathlib import Path
import copy
import hashlib
import io
import json
import subprocess
import zipfile
from family_update import common as c
from family_update.cookery_cache_validation import tree

REPOSITORY = 'casama233/senluo-family-integration-private'
REPOSITORY_ID = 1406868911
LOGICAL = 'local/senluo-amw-cuisine'
PROFILE = 'senluo-stable-author-20261017-p48'
SAT_PROFILE = 'senluo-stable-saturation-20261017-p48'
PREVIOUS = 'f86bea4d747c30e295a409f61c639ef056796943'
VERSION = [1, 0, 48]
HOST_PROFILE = 'companion-sources/stable-author-20261017-p48/host-profiles.json'
HOST_PROFILE_SHA = 'eaee5c8858e5e0b913ca642effec264de5678fb2f6277b35cad7d83c6af0692c'
RECIPE = 'companion-sources/stable-author-20261017-p48/saturation-recipe.json'
RECIPE_SHA = '82f399fff69222ffea7236e24e247a2f542bdb0c2fbfdcd250e8c33cfa88b623'
SAT_UUIDS = {'BP': 'f65e943a-2128-4da8-9196-e9bf5b86739d', 'RP': '9071b6bc-915d-4d26-8486-05bb8db48762'}
SAT_VERSION = [1, 6, 10048]
NETHER_VERSION = [1, 0, 10248]
SAT_MANIFEST_COMPATIBILITY = {'resource_capabilities': ['pbr'],
 'resource_min_engine_version': [1, 21, 120],
 'resource_manifest_metadata': {'format_version': 2,
                                'header': {'description': 'By Raiyon',
                                           'uuid': '9071b6bc-915d-4d26-8486-05bb8db48762',
                                           'min_engine_version': [1, 21, 120]},
                                'metadata': {'product_type': 'addon'},
                                'dependencies': [{'uuid': 'f65e943a-2128-4da8-9196-e9bf5b86739d'}],
                                'modules': [{'type': 'resources',
                                             'uuid': '7fe0bd9a-633e-4ded-88e7-64508079b881'}],
                                'capabilities': ['pbr']},
 'admitted_manifest': {'path': 'companion-sources/stable-author-20261017-p48/admitted-rp-manifest.json',
                       'sha256': 'e1cd222cece4fc328cba1c76962820fc3de8e6f46bff56d570541809754d77b7',
                       'uuid': '9071b6bc-915d-4d26-8486-05bb8db48762',
                       'version': [1, 5, 6]},
 'author_resource_capabilities': [],
 'author_resource_min_engine_version': [1, 21, 10]}
SPEC_HOSTS = {
    'cookery-mooncake-dough-repair.json': 'Cookery',
    'cookery-recipe-cache-repair.json': 'Cookery',
    'cookery-guide-startup-repair.json': 'Cookery',
    'chinesefood-freezer-storage.json': 'ChineseFood',
    'chinesefood-reviewed-repairs.json': 'ChineseFood',
    'chinesefood-doll-renderer.json': 'ChineseFood',
    'nether-placeable-drinks-schema-repair.json': 'Nether',
}


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def resource_manifest_metadata(manifest):
    """Retain the full admitted RP metadata apart from fresh name/versions."""
    result = copy.deepcopy(manifest)
    for key in ['name', 'version']:result['header'].pop(key, None)
    for row in [*result.get('modules', []), *result.get('dependencies', [])]:row.pop('version', None)
    return result


def committed_json(relative, expected):
    path = c.EXTENSION / relative
    raw = path.read_bytes()
    assert not path.is_symlink() and digest(raw) == expected, 'Unreviewed stable source: ' + relative
    assert raw == subprocess.check_output(['git', 'show', 'HEAD:' + relative], cwd=c.EXTENSION), 'Uncommitted stable source'
    return json.loads(raw)


def reviewed_profiles():
    profile = committed_json(HOST_PROFILE, HOST_PROFILE_SHA)
    recipe = committed_json(RECIPE, RECIPE_SHA)
    assert profile['profile'] == PROFILE and profile['source_package_version'] == VERSION and profile['previous_commit'] == PREVIOUS
    assert profile['comparison_scope'] == 'LIVE P42 baseline; not the immediate parent'
    assert set(profile['host_spec_sha256']) == set(SPEC_HOSTS)
    assert recipe['profile'] == SAT_PROFILE and recipe['source_package_version'] == VERSION
    assert recipe['file_id'] == 9071891 and recipe['archive_sha256'] == '42084b762ef1508a1918dcd9d39f17fb418fd02887e589d47c6e3cc8936d3434'
    assert recipe['uuids'] == SAT_UUIDS and all(v == SAT_VERSION for v in recipe['versions'].values())
    assert recipe['manifest_compatibility'] == SAT_MANIFEST_COMPATIBILITY
    retained = recipe['manifest_compatibility']['admitted_manifest']
    manifest = committed_json(retained['path'], retained['sha256'])
    assert manifest['header']['uuid'] == retained['uuid'] and manifest['header']['version'] == retained['version']
    assert manifest['capabilities'] == recipe['manifest_compatibility']['resource_capabilities']
    assert manifest['header']['min_engine_version'] == recipe['manifest_compatibility']['resource_min_engine_version']
    assert resource_manifest_metadata(manifest) == recipe['manifest_compatibility']['resource_manifest_metadata']
    assert all(recipe[k] is False for k in ['client', 'native_loading', 'production_ready'])
    return profile, recipe


def local_report(path, expected=None):
    path = Path(path)
    assert path.is_file() and not path.is_symlink()
    if expected is not None:
        assert c.sha(path) == expected, 'Stable source report changed'
    return c.read(path)


def sibling(path, name, expected):
    assert Path(name).name == name and name not in ['', '.', '..'], 'Unsafe source evidence member'
    target = Path(path).parent / name
    assert target.resolve().parent == Path(path).parent.resolve() and not target.is_symlink()
    assert c.sha(target) == expected, 'Stable source evidence log changed'
    return target


@lru_cache(maxsize=4)
def artifact_members(run_id, artifact_id, source, full_tree):
    from family_update.workflow import gh_json
    from family_update.cookery_cache_validation import private_ci_records
    repo = gh_json('repos/' + REPOSITORY)
    assert repo['id'] == REPOSITORY_ID and repo['full_name'] == REPOSITORY and repo['private'] is True
    run = gh_json(f'repos/{REPOSITORY}/actions/runs/{run_id}')
    assert run['repository']['id'] == REPOSITORY_ID and run['status'] == 'completed' and run['conclusion'] == 'success'
    assert run['head_sha'] == source and run['event'] in ['push', 'workflow_dispatch'] and run['head_branch'] == 'main', 'Require actual canonical main CI'
    assert run['path'] == '.github/workflows/canonical.yml'
    assert gh_json(f'repos/{REPOSITORY}/git/commits/{source}')['tree']['sha'] == full_tree
    checks, statuses, unavailable = private_ci_records(REPOSITORY, source)
    artifact = gh_json(f'repos/{REPOSITORY}/actions/artifacts/{artifact_id}')
    assert artifact['name'] == 'stable-author-functional' and artifact['expired'] is False
    assert artifact['workflow_run']['id'] == run_id and artifact['workflow_run']['head_sha'] == source
    from family_update.github_reads import api_bytes
    raw = api_bytes(f'repos/{REPOSITORY}/actions/artifacts/{artifact_id}/zip')
    assert artifact['digest'] == 'sha256:' + digest(raw), 'Original CI artifact ZIP changed'
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)) and all(Path(n).name == n for n in names), 'Unexpected CI artifact paths'
        members = {name: archive.read(name) for name in names}
    assert set(members) == {'stable-author-functional.json', 'stable-author-functional.log',
                            'cookery-cache-functional.json', 'cookery-cache-functional.tap',
                            'cookery-guide-functional.json', 'cookery-guide-functional.tap',
                            'saturation-scheduling-functional.json', 'saturation-scheduling-functional.log'}
    return members, {'run_id': run_id, 'artifact_id': artifact_id, 'artifact_digest': artifact['digest'],
                     'checks': checks, 'statuses': statuses, 'unavailable_optional_services': unavailable}


def source_proof():
    from family_update.extension_validation import source_binding
    from family_update.workflow import gh_json
    assert c.CONFIG.get('extension_stable_validation') and not any(c.CONFIG.get(k) for k in [
        'extension_validation', 'extension_cache_validation', 'extension_hud_validation', 'extension_performance_validation'])
    path = Path(c.CONFIG['extension_stable_validation'])
    proof = local_report(path)
    baseline = c.read(c.EXTENSION / 'baseline.json')
    assert baseline['repository'] == LOGICAL and baseline['version'] == VERSION
    metadata = c.read(c.EXTENSION / '.repo-target.json')
    assert metadata['repository'] == REPOSITORY and metadata['repository_id'] == REPOSITORY_ID and metadata['private'] is True
    assert proof['kind'] == 'stable_author_adaptation' and proof['profile'] == PROFILE
    assert proof['canonical_repository'] == REPOSITORY and proof['canonical_repository_id'] == REPOSITORY_ID
    assert proof['previous_commit'] == PREVIOUS and proof['test_command'] == ['python', 'tools/build_stable_author_evidence.py']
    assert proof['test_exit_code'] == 0 and all(proof[k] is False for k in ['client', 'native_loading', 'simulated_players', 'production_ready'])
    binding = source_binding(proof, baseline)
    assert proof['git_tree'] == binding['current_source_tree_oid']
    c.git(c.EXTENSION, 'merge-base', '--is-ancestor', PREVIOUS, binding['actual_current_source_commit'])
    pr = gh_json(f'repos/{REPOSITORY}/pulls/{c.CONFIG["extension_stable_pull_request"]}')
    assert pr['merged'] is True and pr['base']['ref'] == 'main' and pr['head']['repo']['id'] == pr['base']['repo']['id'] == REPOSITORY_ID
    c.git(c.EXTENSION, 'merge-base', '--is-ancestor', pr['merge_commit_sha'], binding['actual_current_source_commit'])
    assert c.git(c.EXTENSION, 'rev-parse', pr['head']['sha'] + '^{tree}') == proof['git_tree'], 'PR source whole tree differs'
    members, ci = artifact_members(int(c.CONFIG['extension_stable_run_id']), int(c.CONFIG['extension_stable_artifact_id']), proof['source_commit'], proof['git_tree'])
    assert path.read_bytes() == members['stable-author-functional.json'], 'Local proof differs from original CI artifact'
    log = sibling(path, proof['test_log']['name'], proof['test_log']['sha256'])
    assert log.read_bytes() == members['stable-author-functional.log']
    profile, recipe = reviewed_profiles()
    assert proof['comparison_scope'] == profile['comparison_scope']
    assert proof['author_inputs'] == profile['authors']
    assert proof['host_profiles'] == {'path': HOST_PROFILE, 'sha256': HOST_PROFILE_SHA, 'spec_sha256': profile['host_spec_sha256'],
                                      'imports_resolved': proof['host_profiles']['imports_resolved'], 'private_copied_helpers_byte_preserved': True}
    assert set(proof['host_profiles']['imports_resolved']) == {'Cookery', 'ChineseFood', 'Nether'}
    assert all(type(n) is int and n > 0 for n in proof['host_profiles']['imports_resolved'].values())
    assert proof['saturation_recipe'] == {'path': RECIPE, 'sha256': RECIPE_SHA, 'recipe': recipe}
    assert set(proof['source_tests']) == {'cache', 'guide', 'saturation'}
    for key, kind in [('cache', 'cookery_recipe_cache'), ('guide', 'cookery_guide_startup'), ('saturation', 'senluo_saturation_scheduling')]:
        ref = proof['source_tests'][key]
        report_path = sibling(path, ref['path'], ref['sha256'])
        assert report_path.read_bytes() == members[ref['path']]
        report = local_report(report_path)
        assert report['kind'] == kind and ref['kind'] == kind
        assert report['source_commit'] == ref['source_commit'] == proof['source_commit'] and report['git_tree'] == ref['git_tree'] == proof['git_tree']
        assert report['version'] == ref['version'] == VERSION and report['source_trees'] == baseline['source_trees']
        assert report['test_exit_code'] == ref['test_exit_code'] == 0
        assert all(report[k] is False for k in ['client', 'native_loading', 'production_ready'])
        child_log = sibling(path, report['test_log']['name'], report['test_log']['sha256'])
        assert report['test_log'] == ref['test_log'] and child_log.read_bytes() == members[child_log.name]
        if key in ['cache', 'guide']:
            assert report['fixture_provenance']['current_host_version'] == '1.6.1'
            field = 'cache_spec_sha256' if key == 'cache' else 'guide_spec_sha256'
            name = 'cookery-recipe-cache-repair.json' if key == 'cache' else 'cookery-guide-startup-repair.json'
            assert report[field] == profile['host_spec_sha256'][name]
        else:
            assert report['clean_author_reproduction']['archive_sha256'] == recipe['archive_sha256'] and report['working_source_diagnostic_only'] is False
            assert all(report['facts'][name] is True for name in ['unique_bootstrap_replacement', 'generator_body_byte_preserved', 'ordinary_trace_equal', 'current_and_clean_author16_reproduced', 'one_score_step_per_player_tick', 'no_deferred_jobs'])
            assert report['output_hashes']['JS_BP']['scripts/saturation.js'] == recipe['output_hashes']['BP']['scripts/saturation.js']
    return path, proof, baseline, binding, profile, recipe, ci


def affected_packs(receipt):
    profile, _ = reviewed_profiles()
    uuids = {uid for p in profile['authors'].values() for uid in [p['behavior_uuid'], p['resource_uuid']]}
    uuids.update(SAT_UUIDS.values())
    uuids.update(p['uuid'] for p in receipt['packs'] if p['source'].get('repository') == LOGICAL)
    return {p['uuid']: {'side': p['side'], 'version': p['version'], 'files': tree(p['files'])} for p in receipt['packs'] if p['uuid'] in uuids}


def private_receipt_version(extension, declared):
    """Regular host receipts bind owner_version; the renderer also records its package."""
    assert extension['owner_version'] == VERSION
    if declared.get('kind') == 'chinesefood-doll-renderer-cleanup' or 'source_package_version' in extension:
        assert extension['source_package_version'] == VERSION
    if declared.get('kind') == 'nether-placeable-drinks-schema-repair':
        assert extension['local_pack_version'] == declared['local_pack_version'] == NETHER_VERSION
        assert extension['version'] == declared['version']
        assert extension['official_author_release'] is declared['official_author_release'] is False


def private_receipt_source(extension, declared, author, rows, side, prefix_source):
    """The atomic renderer's prerequisites belong to its behavior pair."""
    if declared.get('kind') != 'chinesefood-doll-renderer-cleanup' or side != 'resource':
        return prefix_source
    assert prefix_source['owner'] == 'upstream' and not prefix_source.get('reviewed_extensions', []), 'Renderer resource input must be the clean paired author'
    behavior = rows[author['behavior_uuid']]
    assert behavior['side'] == 'behavior'
    source = behavior['source'];prior = source.get('reviewed_extensions', [])
    indices = [i for i, row in enumerate(prior) if row['id'] == extension['id']]
    assert len(indices) == 1 and prior[indices[0]] == extension, 'Renderer receipts differ across the author pair'
    index = indices[0]
    return {**source, 'owner': 'upstream' if index == 0 else 'upstream_extended',
            'reviewed_extensions': prior[:index]}


def verify_static(receipt, prior):
    from stable_host_profiles import match_stable_profile, validate_stable_source
    path, proof, baseline, binding, profile, recipe, ci = source_proof()
    rows = {p['uuid']: p for p in receipt['packs']}
    assert len(rows) == len(receipt['packs'])
    changed = {'BP': sorted(['manifest.json'] + ['host-extensions/' + n for n in SPEC_HOSTS]), 'RP': ['manifest.json']}
    assert proof['changed_runtime'] == changed
    bp_files = proof['files']['BP']
    for side, declaration in baseline['packs'].items():
        pack = rows[declaration['uuid']]
        assert pack['version'] == VERSION and pack['source']['repository'] == LOGICAL
        assert pack['files'] == proof['files'][side] and tree(pack['files']) == baseline['source_trees'][side]
        assert prior[pack['uuid']]['files'] == proof['previous_files'][side] and prior[pack['uuid']]['version'] == [1, 0, 42]
        old = json.loads(c.git(c.EXTENSION, 'show', PREVIOUS + ':baseline.json'))
        assert tree(proof['previous_files'][side]) == old['source_trees'][side]
        actual_changed = sorted(n for n in pack['files'].keys() | proof['previous_files'][side].keys() if pack['files'].get(n) != proof['previous_files'][side].get(n))
        assert actual_changed == changed[side], 'Unrelated private runtime changed'
    g = c.SOURCES['grilling'];public_path = g / 'projects/grilling/gameplay_core/behavior_pack/host-extensions/board-api.json'
    public = c.read(public_path)
    assert proof['public_api']['repository'] == 'casama233/kaleidoscope-grilling-unofficial' and proof['public_api']['repository_id'] == 1377218440
    assert proof['public_api']['git_tree'] == c.git(g, 'rev-parse', 'HEAD^{tree}') == c.git(g, 'rev-parse', proof['public_api']['source_commit'] + '^{tree}')
    assert proof['public_api']['spec_sha256'] == c.sha(public_path) == profile['public_api_spec_sha256']
    assert proof['public_api']['postimages'] == public['patched_files'] == profile['public_api_postimages'] and public['version'] == [0, 2, 11]
    specs = {}
    for name, author in SPEC_HOSTS.items():
        relative = 'host-extensions/' + name
        assert bp_files[relative] == profile['host_spec_sha256'][name]
        spec = c.read(c.EXTENSION / baseline['runtime']['BP'] / relative)
        assert spec['archive_sha256'] == profile['authors'][author]['archive_sha256']
        specs[spec['id']] = (spec, profile['host_spec_sha256'][name])
    found = set()
    for name, author in profile['authors'].items():
        for side, key in [('behavior', 'behavior_uuid'), ('resource', 'resource_uuid')]:
            host = rows[author[key]];source = host['source']
            assert host['side'] == side and source['owner'] in ['upstream', 'upstream_extended'] and source['archive_sha256'] == author['archive_sha256']
            if name == 'Nether':assert host['version'] == NETHER_VERSION
            assert source.get('file_id', author['file_id']) == author['file_id']
            final = {}
            extensions = source.get('reviewed_extensions', [])
            assert source['owner'] == ('upstream_extended' if extensions else 'upstream')
            for index, extension in enumerate(extensions):
                eid = extension['id']
                prefix_source = {**source, 'owner': 'upstream' if index == 0 else 'upstream_extended',
                                 'reviewed_extensions': extensions[:index]}
                if eid == public['id']:
                    assert extension['spec_sha256'] == profile['public_api_spec_sha256'] and extension['patched_files'] == public['patched_files']
                    assert extension['original_files'] == public['original_files']
                    public_files = rows[c.read(g / 'baseline.json')['packs']['BP']['uuid']]['files']
                    public_copies = {target: {'source': src, 'sha256': public_files[src]} for src, target in public['copies'].items()}
                    assert extension['copies'] == public_copies
                    assert extension['repository'] == proof['public_api']['repository']
                    assert extension['commit'] == c.git(g, 'rev-parse', 'HEAD') and extension['working_candidate'] is False
                    public_profile = match_stable_profile(public)
                    assert public_profile is not None
                    validate_stable_source(public_profile, prefix_source)
                    final.update({target: item['sha256'] for target, item in public_copies.items()})
                    declared = public
                elif eid in specs:
                    declared, expected = specs[eid];found.add(eid)
                    stable_profile = match_stable_profile(declared)
                    assert stable_profile is not None, 'Host declaration is outside the reviewed stable catalog'
                    validate_stable_source(stable_profile, private_receipt_source(extension, declared, author, rows, side, prefix_source))
                    assert extension['spec_sha256'] == expected and extension['repository'] == LOGICAL
                    assert extension['commit'] == binding['actual_current_source_commit'] and extension['working_candidate'] is False
                    private_receipt_version(extension, declared)
                    assert extension['original_files'] == declared['original_files'] and extension['patched_files'] == declared['patched_files']
                else:
                    raise AssertionError('Unexpected stable-author host extension: ' + eid)
                renderer = declared.get('kind') == 'chinesefood-doll-renderer' or declared.get('behavior_uuid') is not None
                for target, value in declared['original_files'].items():
                    if renderer:
                        prefix = 'BP/' if side == 'behavior' else 'RP/'
                        if not target.startswith(prefix):continue
                        target = target[len(prefix):]
                    if target in final:assert final[target] == value, 'Stable host hook preimage chain differs'
                for target, value in declared['patched_files'].items():
                    if renderer:
                        prefix = 'BP/' if side == 'behavior' else 'RP/'
                        if not target.startswith(prefix):continue
                        target = target[len(prefix):]
                    final[target] = value
                if eid in specs:
                    copies = {target: {'source': src, 'sha256': bp_files[src]} for src, target in declared.get('copies', {}).items()}
                    assert extension.get('copies', {}) == copies
                    final.update({target: item['sha256'] for target, item in copies.items()})
            assert all(host['files'].get(target) == value for target, value in final.items()), 'Stable host final bytes/copies differ'
    assert found == set(specs), 'One of the seven private host profiles was omitted'
    for side, uid in SAT_UUIDS.items():
        assert rows[uid]['source']['owner'] == 'preserved' and rows[uid]['version'] == SAT_VERSION and rows[uid]['files'] == recipe['output_hashes'][side]
    target = c.R / 'stable-author-static-validation.json'
    c.atomic(target, {'schema': 1, 'profile': PROFILE, 'version': VERSION, **binding, 'source': c.report_ref(path), 'ci': ci,
                     'candidate_receipt_sha256': c.sha(c.C / 'family-receipt.json'), 'affected_packs': affected_packs(receipt),
                     'host_profile': c.report_ref(c.EXTENSION / HOST_PROFILE), 'recipe': c.report_ref(c.EXTENSION / RECIPE),
                     'client': False, 'production_ready': False, 'native_loading': False})
    return [*evidence_paths(include_native=False), c.report_ref(target)]


def evidence_paths(include_native=True):
    path = Path(c.CONFIG['extension_stable_validation']);proof = c.read(path)
    paths = [path, sibling(path, proof['test_log']['name'], proof['test_log']['sha256'])]
    for ref in proof['source_tests'].values():
        report = sibling(path, ref['path'], ref['sha256'])
        paths.extend([report, sibling(path, ref['test_log']['name'], ref['test_log']['sha256'])])
    if include_native:paths.extend([c.R / 'stable-author-static-validation.json', c.R / 'stable-author-native-validation.json'])
    return [c.report_ref(p) for p in paths]


def bind_native(receipt, evidence):
    if not c.CONFIG.get('extension_stable_validation'):return
    static = c.read(c.R / 'stable-author-static-validation.json')
    assert static['profile'] == PROFILE and static['version'] == VERSION
    assert static['candidate_receipt_sha256'] == evidence['candidate_receipt_sha256'] == c.sha(c.C / 'family-receipt.json')
    assert static['affected_packs'] == affected_packs(receipt)
    assert evidence['fresh_stopped_backup'] and evidence['existing_world_loaded'] and evidence['exact_files_checked'] and evidence['bds'] and evidence['saved_world_migration']
    assert evidence['client'] is False and evidence['simulated_players'] is False and evidence['test_only_overlays'] == []
    assert [r['phase'] for r in evidence['runs']] == ['first', 'restart']
    assert all(r['ok'] and not r['errors'] and r['real_player_connections'] == 0 and r['player_records_unchanged'] and r['custom_container_inventories_retained'] and r['native_freezer_inputs_retained'] for r in evidence['runs'])
    c.atomic(c.R / 'stable-author-native-validation.json', {'schema': 1, 'profile': PROFILE, 'version': VERSION,
             'static': c.report_ref(c.R / 'stable-author-static-validation.json'), 'fresh_native': c.report_ref(c.R / 'saved-world-report.json'),
             'candidate_receipt_sha256': evidence['candidate_receipt_sha256'], 'affected_packs': static['affected_packs'],
             'native_loading': True, 'saved_world_migration': True, 'client': False, 'production_ready': False})


def verify_installation(receipt):
    if not c.CONFIG.get('extension_stable_validation'):return
    static = c.read(c.R / 'stable-author-static-validation.json');native = c.read(c.R / 'stable-author-native-validation.json')
    assert static['source'] == c.report_ref(Path(c.CONFIG['extension_stable_validation']))
    assert static['profile'] == native['profile'] == PROFILE and static['version'] == native['version'] == VERSION
    assert static['candidate_receipt_sha256'] == native['candidate_receipt_sha256'] == c.sha(c.C / 'family-receipt.json')
    assert static['affected_packs'] == native['affected_packs'] == affected_packs(receipt)
    assert native['static'] == c.report_ref(c.R / 'stable-author-static-validation.json') and native['fresh_native'] == c.report_ref(c.R / 'saved-world-report.json')
    assert native['native_loading'] is True and native['saved_world_migration'] is True and native['client'] is False and native['production_ready'] is False


def is_preserved_profile(review):
    return review.get('profile') == SAT_PROFILE


def input_refs(review, path, recipe):
    assert is_preserved_profile(review) and review['recipe'] == {'path': RECIPE, 'sha256': RECIPE_SHA}
    assert Path(review['source_validation']['path']).resolve() == Path(c.CONFIG['extension_stable_validation']).resolve()
    assert c.sha(review['source_validation']['path']) == review['source_validation']['sha256']
    return {'prospective_preserved_inputs': c.sha(path), 'prospective_recipe': c.sha(recipe),
            'prospective_source_validation': review['source_validation']['sha256']}


def select_inputs(preserved, original, path, review):
    from family_update.prospective_preserved_inputs import separate
    assert set(review) == {'schema', 'profile', 'source_commit', 'recipe', 'source_validation', 'packs'}
    assert review['schema'] == 1 and is_preserved_profile(review) and Path(path).is_absolute()
    assert set(review['packs']) == {'BP', 'RP'} and set(review['source_validation']) == {'path', 'sha256'}
    assert review['recipe'] == {'path': RECIPE, 'sha256': RECIPE_SHA}
    for source in [c.EXTENSION, *c.SOURCES.values()]:
        assert not Path(path).resolve().is_relative_to(Path(source).resolve()), 'Prospective review must remain outside sources'
    assert not c.git(c.EXTENSION, 'status', '--porcelain')
    input_refs(review, Path(path), c.EXTENSION / RECIPE)
    proof_path, proof, _, binding, _, recipe, _ = source_proof()
    assert review['source_validation'] == c.report_ref(proof_path) and review['source_commit'] == binding['actual_current_source_commit']
    old = {p['uuid']: p for p in original['packs']};current = {p['uuid']: p for p in preserved}
    approved_path = Path(c.read(c.R / 'production-before/senluo-policy.json')['approved_receipt'])
    approved = c.read(approved_path);admitted = {p['uuid']: p for p in approved['packs']}
    assert len(old) == len(original['packs']) and len(current) == len(preserved) and len(admitted) == len(approved['packs'])
    assert set(old) == set(admitted) and set(current) == {uid for uid, p in admitted.items() if p['source']['owner'] == 'preserved'}
    assert all(all(old[uid][key] == admitted[uid][key] for key in ['side', 'version', 'files']) for uid in old), 'Captured family differs from admission'
    protected = [c.B, c.W, c.Q, c.R, c.C, c.EXTENSION, *c.SOURCES.values()]
    roots = [];outputs = {}
    for side, uid in SAT_UUIDS.items():
        row = review['packs'][side]
        assert set(row) == {'path', 'uuid'} and row['uuid'] == uid
        prior = old[uid]
        assert admitted[uid]['source']['owner'] == 'preserved' and prior['version'] == [1, 5, 6]
        assert all(current[uid][key] == prior[key] for key in ['side', 'version', 'files']), 'Stable Saturation cannot approve installed drift'
        root = separate(Path(row['path']), protected)
        assert all(root != other and root not in other.parents and other not in root.parents for other in roots)
        roots.append(root)
        assert c.hashes(root) == recipe['output_hashes'][side]
        assert {n: sha for n, sha in prior['files'].items() if n != 'manifest.json'} == {n: sha for n, sha in recipe['output_hashes'][side].items() if n != 'manifest.json'}, 'Stable Saturation changes prior gameplay/HUD bytes'
        manifest = c.read(root / 'manifest.json');old_path = Path(current[uid]['path']) / 'manifest.json'
        assert c.sha(old_path) == current[uid]['files']['manifest.json']
        previous = c.read(old_path)
        capabilities = manifest.get('capabilities', [])
        assert isinstance(capabilities, list) and all(isinstance(value, str) for value in capabilities)
        assert capabilities == previous.get('capabilities', []), 'Stable Saturation must preserve admitted manifest capabilities'
        if side == 'RP':
            assert recipe['manifest_compatibility'] == SAT_MANIFEST_COMPATIBILITY
            assert c.sha(old_path) == recipe['manifest_compatibility']['admitted_manifest']['sha256']
            assert capabilities == recipe['manifest_compatibility']['resource_capabilities'], 'Stable Saturation resource output must retain admitted PBR compatibility'
            assert resource_manifest_metadata(manifest) == resource_manifest_metadata(previous) == recipe['manifest_compatibility']['resource_manifest_metadata'], 'Stable Saturation must preserve admitted resource manifest metadata'
        assert manifest['header']['uuid'] == uid and manifest['header']['version'] == SAT_VERSION
        assert [(m['uuid'], m['type']) for m in manifest['modules']] == [(m['uuid'], m['type']) for m in previous['modules']]
        assert all(m['version'] == SAT_VERSION for m in manifest['modules'])
        peer = SAT_UUIDS['RP' if side == 'BP' else 'BP']
        assert [d['version'] for d in manifest['dependencies'] if d.get('uuid') == peer] == [SAT_VERSION]
        assert prior['side'] == ('behavior' if side == 'BP' else 'resource')
        outputs[side] = {'uuid': uid, 'path': str(root), 'side': prior['side'], 'version': SAT_VERSION}
    selected = {'schema': 1, 'profile': SAT_PROFILE, 'review': c.report_ref(path), 'source_commit': review['source_commit'], **binding,
                'version': VERSION, 'recipe': c.report_ref(c.EXTENSION / RECIPE), 'source_validation': c.report_ref(proof_path),
                'packs': outputs, 'current_live_reconciled': False, 'full_family_acceptance_still_required': True,
                'client': False, 'production_ready': False}
    replacements = {p['uuid']: Path(p['path']) for p in outputs.values()}
    return [replacements.get(p['uuid'], Path(p['path'])) for p in preserved], selected


def verify_inputs(receipt, selected):
    assert is_preserved_profile(selected) and selected['version'] == VERSION
    assert selected['recipe'] == c.report_ref(c.EXTENSION / RECIPE) and selected['recipe']['sha256'] == RECIPE_SHA
    assert selected['source_validation'] == c.report_ref(Path(c.CONFIG['extension_stable_validation']))
    _, recipe = reviewed_profiles();rows = {p['uuid']: p for p in receipt['packs']}
    assert set(selected['packs']) == {'BP', 'RP'} and len(rows) == len(receipt['packs'])
    for side, uid in SAT_UUIDS.items():
        row, expected = rows[uid], selected['packs'][side]
        assert row['source']['owner'] == 'preserved' and row['files'] == recipe['output_hashes'][side]
        assert row['uuid'] == expected['uuid'] == uid and row['version'] == expected['version'] == SAT_VERSION
        assert row['side'] == expected['side'] == ('behavior' if side == 'BP' else 'resource')
