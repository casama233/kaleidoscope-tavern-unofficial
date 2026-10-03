"""Idempotent stage orchestration. Cache hits verify bytes, never just flags."""
import importlib
from family_update.common import *


def run_stage(name, argv=None):
    module = importlib.import_module('family_update.' + name)
    result = module.main(argv or ['--execute'])
    if result not in [None, 0]:
        raise RuntimeError(f'{name} failed with exit code {result}')


def same_runtime(receipt, inventory):
    expected = {pack['uuid']: pack for pack in receipt['packs']}
    actual = {pack['uuid']: pack for pack in inventory['packs']}
    if len(expected) != len(receipt['packs']) or len(actual) != len(inventory['packs']):
        return False
    if set(expected) != set(actual):
        return False
    for uid, pack in expected.items():
        if any(pack[key] != actual[uid][key] for key in ['side', 'version', 'files']):
            return False
    return all(inventory['refs'].get(side) == [
        {'pack_id': uid, 'version': expected[uid]['version']} for uid in order
    ] for side, order in receipt['order'].items())


def verify_native(verified_candidate=None):
    receipt = verify_candidate_sources() if verified_candidate is None else verified_candidate
    evidence = read(R / 'exact-engine/native-report.json')
    assert evidence['candidate_receipt_sha256'] == sha(C / 'family-receipt.json')
    assert evidence['engine_sha256'] == sha(B / 'bedrock_server'), 'Native engine changed'
    assert evidence['engine_inputs'] == engine_inputs(), 'Native engine builtin packs or configuration changed'
    assert evidence['scenario_metadata'] == report_ref(R / 'production-before/level-metadata.dat'), 'Native scenario metadata changed'
    assert evidence['bds'] is True and evidence['client'] is False
    assert evidence['test_only_overlays'] == [] and evidence['simulated_players'] is False
    assert evidence['packs'] == len(receipt['packs'])
    assert [run['phase'] for run in evidence['runs']] == ['first', 'restart'], 'Native first/start and restart are distinct required scenes'
    for run in evidence['runs']:
        assert run['ok'] and run['started'] and run['family_initialized'] and run['exit_code'] == 0 and not run['errors']
        assert run['real_player_connections'] == 0
        assert run['log_sha256'] == sha(R / 'exact-engine' / (run['phase'] + '.log')), 'Native log changed'
    return evidence


def gh_json(endpoint):
    # Credentials remain in gh's normal authenticated environment. No token or
    # private BSM adapter content is printed or copied into a public repository.
    raw = subprocess.check_output(['gh', 'api', endpoint], text=True)
    return json.loads(raw)


def required_ci_checks(key):
    profiles = {
        'tavern': {'impact', 'baseline'},
        'grilling': {'baseline', 'bridge', 'canonical', 'candidate'},
        'world-liquor': {'baseline', 'bridge', 'package', 'wall-record'},
    }
    required = set(profiles[key])
    if key == 'tavern':
        candidate = read(C / 'family-receipt.json')
        original = {pack['uuid']: pack for pack in read(R / 'production-before/inventory.json')['packs']}
        repository = read(SOURCES[key] / 'baseline.json')['repository']
        changed = any(pack['source'].get('repository') == repository and (pack['uuid'] not in original or any(pack[field] != original[pack['uuid']][field] for field in ['files', 'version'])) for pack in candidate['packs'])
        if changed:
            required.update(['bridge', 'package', 'catalog', 'audit', 'efficiency', 'foundation', 'glassware-hit-basis', 'mechanics', 'native-persistence', 'scripts', 'tap-carriers'])
    return required


def validate_ci_rows(rows, sources):
    assert len(rows) == len(SOURCES) and {row['source'] for row in rows} == set(SOURCES), 'CI evidence omits or duplicates a source'
    for row in rows:
        key = row['source']
        assert row['repository'] == sources[key]['repository'] and row['source_tree'] == sources[key]['tree']
        checks = row['checks']
        assert all(check['status'] == 'completed' and check['conclusion'] in ['success', 'skipped', 'neutral'] for check in checks), f'{key} checks failed or are incomplete'
        successful = {check['name'] for check in checks if check['conclusion'] == 'success' and check['app_slug'] == 'github-actions'}
        missing = required_ci_checks(key) - successful
        assert not missing, f'{key} required checks did not succeed: {sorted(missing)}'
        assert all(status['state'] == 'success' for status in row['statuses']), f'{key} commit status failed'


def verify_ci():
    """Record actual merged PR checks for the exact canonical source trees.

    A merge commit may differ from its PR head commit, but the complete Git
    tree must be identical. An unrelated green PR cannot certify this release.
    """
    build = read(R / 'build-evidence.json')
    configured = CONFIG.get('pull_requests', {})
    assert set(configured) == set(SOURCES), 'Configure one current merged PR for each canonical public source'
    path = R / 'ci-evidence.json'
    if path.exists():
        proof = read(path)
        assert proof['candidate_receipt_sha256'] == sha(C / 'family-receipt.json')
        assert proof['sources'] == build['sources'] and proof['pull_requests'] == configured
        assert proof['ok'] is True
        validate_ci_rows(proof['results'], build['sources'])
        # The source tree and runner/config are verified by the caller. The
        # signed-in API response was recorded for these exact immutable heads.
        return proof
    rows = []
    for key, number in configured.items():
        assert type(number) is int and number > 0
        source = build['sources'][key]
        repository = source['repository']
        pr = gh_json(f'repos/{repository}/pulls/{number}')
        assert pr['merged'] is True, f'{key} PR #{number} has not merged'
        assert pr['base']['repo']['full_name'] == repository and pr['base']['ref'] == 'main'
        assert pr['head']['repo']['full_name'] == repository, 'Unexpected PR source repository'
        head = pr['head']['sha']
        assert git(SOURCES[key], 'rev-parse', head + '^{tree}') == source['tree'], f'{key} PR does not match the complete current source tree'
        ancestor = subprocess.run(['git', '-C', str(SOURCES[key]), 'merge-base', '--is-ancestor', pr['merge_commit_sha'], source['commit']], capture_output=True)
        assert ancestor.returncode == 0, f'{key} PR merge is not on canonical main'
        response = gh_json(f'repos/{repository}/commits/{head}/check-runs?per_page=100')
        assert response['total_count'] <= 100, 'More than 100 check runs require explicit pagination review'
        # A job rerun supersedes its previous attempt, not another check name.
        latest = {}
        for check in response['check_runs']:
            identity = (check['name'], check['app']['id'])
            if identity not in latest or latest[identity]['id'] < check['id']:
                latest[identity] = check
        checks = list(latest.values())
        assert checks and any(check['conclusion'] == 'success' for check in checks), 'No successful CI checks found'
        assert all(check['status'] == 'completed' and check['conclusion'] in ['success', 'skipped', 'neutral'] for check in checks), f'{key} checks are incomplete or failed'
        statuses = gh_json(f'repos/{repository}/commits/{head}/status')
        assert not statuses['statuses'] or statuses['state'] == 'success', f'{key} commit status failed'
        rows.append({'source': key, 'repository': repository, 'number': number, 'url': pr['html_url'], 'head': head, 'merge_commit': pr['merge_commit_sha'], 'source_tree': source['tree'], 'checks': [
            {**{field: check.get(field) for field in ['id', 'name', 'status', 'conclusion', 'html_url', 'completed_at']}, 'app_slug': check['app']['slug']}
            for check in checks
        ], 'statuses': [{field: status.get(field) for field in ['context', 'state', 'target_url']} for status in statuses['statuses']]})
    validate_ci_rows(rows, build['sources'])
    proof = {'schema': 1, 'recorded_at': now(), 'ok': True, 'candidate_receipt_sha256': sha(C / 'family-receipt.json'), 'sources': build['sources'], 'pull_requests': configured, 'results': rows, 'reused_actual_github_checks': True, 'local_functional_suites_rerun': False}
    atomic(path, proof)
    return proof


def record_static(verified_candidate=None):
    if verified_candidate is None:
        verify_candidate_sources()
    candidate = read(C / 'family-receipt.json')
    prior = {pack['uuid']: pack for pack in read(R / 'production-before/inventory.json')['packs']}
    known = {row['repository'] for key, row in read(R / 'build-evidence.json')['sources'].items() if key in SOURCES}
    from family_update.extension_validation import verify_extension
    extension_reports=verify_extension(candidate,prior)
    for pack in candidate['packs']:
        if pack['source']['owner'] == 'owned' and pack['source']['repository'] not in known:
            assert (pack['source']['repository']=='local/senluo-amw-cuisine' and extension_reports) or (pack['uuid'] in prior and all(pack[key] == prior[pack['uuid']][key] for key in ['files', 'version'])), 'A changed private extension needs its own reviewed functional evidence; public PR checks cannot certify it'
    proof = verify_ci()
    build = read(R / 'build-evidence.json')
    target = R / 'static-evidence.json'
    if target.exists():
        existing = read(target)
        assert existing['candidate_receipt_sha256'] == build['candidate_receipt_sha256'] and existing['sources'] == build['sources']
        for check in existing['checks']:
            assert check['exit_code'] == 0 and sha(check['log']) == check['sha256']
        for report in existing['reports']:
            assert sha(report['path']) == report['sha256']
        return existing
    # CI output itself is the evidence of executed functional checks. Never
    # label API doubles as native/client tests or invent a local test log.
    ci_path = R / 'ci-evidence.json'
    evidence = {'schema': 1, 'recorded_at': now(), 'ok': proof['ok'], 'candidate_receipt_sha256': build['candidate_receipt_sha256'], 'pr_checks_verified': True, 'sources': build['sources'], 'checks': [{'name': 'Merged PR checks for exact canonical trees', 'kind': 'actual_github_ci', 'exit_code': 0, 'log': str(ci_path), 'sha256': sha(ci_path)}], 'reports': [report_ref(ci_path), report_ref(R / 'build-evidence.json'), report_ref(R / 'compatibility-report.json')], 'local_functional_suites_rerun': False, 'client': False}
    evidence['reports'].extend(extension_reports)
    atomic(target, evidence)
    return evidence


def prepare(include_ci=True):
    lease_available()
    R.mkdir(parents=True, exist_ok=True)
    if (R / 'production-before/capture.json').exists():
        verify_predeploy()
        print('REUSED verified live inventory', flush=True)
    else:
        run_stage('capture_predeploy')
    if (R / 'build-evidence.json').exists():
        receipt = verify_candidate_sources()
        print('REUSED exact family candidate', flush=True)
    else:
        run_stage('build_candidate')
        receipt = verify_candidate_sources()
    inventory = verify_predeploy()
    if same_runtime(receipt, inventory):
        result = {'schema': 1, 'recorded_at': now(), 'state': 'no_runtime_changes', 'candidate_receipt_sha256': sha(C / 'family-receipt.json'), 'complete_files_versions_and_order_verified': True, 'live_mutated': False, 'native_rerun': False, 'saved_world_rerun': False, 'client': False, 'production_ready': False}
        target = R / 'no-runtime-changes.json'
        if not target.exists():
            atomic(target, result)
        print('NO_RUNTIME_CHANGES: full live bytes and order already match; no restart', flush=True)
        return result
    if include_ci:
        record_static()
    if (R / 'exact-engine/native-report.json').exists():
        verify_native()
        print('REUSED exact native loading and restart evidence', flush=True)
    else:
        run_stage('run_native')
        verify_native()
    return {'state': 'ready_for_fresh_saved_world_and_deploy', 'client': False}


def verify_deployed():
    result = read(R / 'deployment-result.json')
    assert result['state'] == 'deployed_running', 'Previous deployment needs recovery; do not automatically retry it'
    verify_candidate_sources()
    receipt = read(R / 'reviewed-family-receipt.json')
    assert sha(R / 'reviewed-family-receipt.json') == result['receipt_sha256']
    current = live_inventory()
    assert same_runtime(receipt, current), 'Live has changed since this deployment'
    check_live_against_policy(current)
    policy = read(Q / 'senluo-policy.json')
    assert policy['approved_receipt'] == str(R / 'reviewed-family-receipt.json'), 'Another deployment owns the current policy'
    assert summary()['status'] == 'RUNNING'
    return {'state': 'already_deployed', 'live_mutated': False, 'client': False}


def deploy():
    if (R / 'deployment-result.json').exists():
        return verify_deployed()
    receipt = verify_candidate_sources()
    if same_runtime(receipt, verify_predeploy()):
        return {'state': 'no_runtime_changes', 'live_mutated': False, 'client': False}
    run_stage('deploy_live')
    return verify_deployed()


def plan():
    files = {
        'capture': 'production-before/capture.json', 'assemble': 'build-evidence.json',
        'static_ci': 'static-evidence.json', 'native': 'exact-engine/native-report.json',
        'fresh_saved_world': 'saved-world-report.json', 'deploy': 'deployment-result.json',
    }
    return {'schema': 1, 'execute': False, 'output': str(R), 'server': SERVER, 'live': summary(), 'lease': read(LEASE) if LEASE.exists() else {}, 'stages': {key: {'report': str(R / relative), 'exists': (R / relative).exists()} for key, relative in files.items()}, 'reuse_rule': 'Revalidate source/config/tool/file/log hashes before reusing a completed stage; incomplete or mismatched outputs are preserved and rejected.', 'fresh_rule': 'Each new live deployment creates a stopped-world backup and rehearses that exact backup. Never reuse saved-world/client evidence from another deployment.', 'client': False}
