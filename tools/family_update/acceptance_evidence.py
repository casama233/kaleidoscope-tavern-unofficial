"""Offline acceptance preflight; never installs, promotes, or rewrites receipts."""
import argparse
import hashlib
import json
from pathlib import Path
import re

CORE_SCENARIOS = frozenset(
    f'{flow}.{action}' for flow in ('eating', 'shaker')
    for action in ('first_use', 'complete', 'cancel', 'slot_switch', 'rapid_reopen')
) | frozenset({'inventory_conservation', 'save_rejoin', 'hud_coexistence'})
CONTEXT_KEYS = frozenset({'engine', 'api', 'client_version', 'device', 'input_method',
                          'gui_profile', 'settings_sha256', 'initial_state_sha256'})


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def hex_id(value, length):
    return isinstance(value, str) and re.fullmatch('[0-9a-f]{%d}' % length, value) is not None


def schema_one(value):
    return isinstance(value, dict) and type(value.get('schema')) is int and value['schema'] == 1


def nonblank(value):
    return isinstance(value, str) and bool(value.strip())


def load_ref(root, ref, *, binary=False):
    require(isinstance(ref, dict) and hex_id(ref.get('sha256'), 64), 'Invalid evidence reference digest')
    name = ref.get('path')
    require(isinstance(name, str) and name and not Path(name).is_absolute() and '..' not in Path(name).parts,
            'Evidence path must be relative to the evidence directory')
    path = root / name
    require(path.resolve().is_relative_to(root.resolve()), 'Evidence path escapes evidence directory')
    data = path.read_bytes()
    require(hashlib.sha256(data).hexdigest() == ref['sha256'], 'Evidence bytes changed: ' + name)
    return data if binary else json.loads(data)


def runtime_identity(receipt):
    """Projection of existing receipt, not a second independently maintained manifest."""
    packs = receipt['packs']
    require(isinstance(packs, list) and packs, 'Missing complete pack inventory')
    ids = [p['uuid'] for p in packs]
    require(len(set(ids)) == len(ids), 'Duplicate pack identity')
    order = receipt['order']
    require(set(order) == {'behavior', 'resource'}, 'Missing complete pack order')
    for side in order:
        wanted = [p['uuid'] for p in packs if p['side'] == side]
        require(len(order[side]) == len(set(order[side])) and set(order[side]) == set(wanted), 'Pack order/inventory mismatch')
    for p in packs:
        require(p['side'] in order and isinstance(p['version'], list) and len(p['version']) == 3
                and all(type(v) is int and v >= 0 for v in p['version']), 'Invalid pack identity')
        require(isinstance(p['files'], dict) and p['files'] and all(hex_id(v, 64) for v in p['files'].values()), 'Missing pack file hashes')
    return digest({'packs': sorted([{k: p[k] for k in ('uuid', 'side', 'version', 'files', 'dependencies')}
                                   for p in packs], key=lambda p: p['uuid']), 'order': order})


def inspect(record, root):
    """Return readiness separately from repository-reported deployment claims.

    Supplied reports are digest-checked observations, not a new live readback or
    cryptographic authentication of the observer. Existing admission stays authoritative.
    """
    require(type(record.get('schema')) is int and record['schema'] == 1, 'Unsupported evidence schema')
    require(record.get('status') in {'pending_client_acceptance', 'accepted', 'stable'}, 'Unknown acceptance status')
    result = {'schema': 1, 'status': record['status'], 'promotion_ready': False,
              'repository_reported_deployment': record.get('repository_reported_deployment'),
              'direct_readback_report_verified': False, 'client_receipt_verified': False, 'blockers': []}
    try:
        refs = record['evidence']
        raw = load_ref(root, refs['candidate'])
        reviewed = load_ref(root, refs['reviewed'])
        build = load_ref(root, refs['build'])
        raw_sha, reviewed_sha = refs['candidate']['sha256'], refs['reviewed']['sha256']
        require(schema_one(raw) and schema_one(reviewed), 'Unsupported family receipt schema')
        identity = runtime_identity(raw)
        require(raw['packs'] == reviewed['packs'] and raw['order'] == reviewed['order'], 'Reviewed receipt changed candidate bytes/source/order')
        require(build['candidate_receipt_sha256'] == raw_sha and build['packs'] == len(raw['packs']), 'Build report belongs to another candidate')
        sources = build['sources']
        require(isinstance(sources, dict) and sources, 'Missing full source identities')
        for source in sources.values():
            require(hex_id(source['commit'], 40) and hex_id(source['tree'], 40) and source['repository'], 'Missing source SHA/full tree')
        for pack in raw['packs']:
            source = pack['source']
            if source['owner'] == 'owned':
                require(source.get('working_candidate') is False and any(
                    s['repository'] == source['repository'] and s['commit'] == source['commit']
                    for s in sources.values()), 'Owned pack does not match full source proof')
        result.update(source_identities=sources, candidate_receipt_sha256=raw_sha,
                      reviewed_receipt_sha256=reviewed_sha, runtime_inventory_sha256=identity)
        require(all(reviewed['acceptance'].get(k) is True for k in ('static', 'bds', 'saved_world_migration')),
                'Missing existing static/native/saved-world acceptance')
        admission = load_ref(root, refs['admission'])
        require(admission['ok'] is True and admission['candidate_receipt_sha256'] == raw_sha
                and admission['reviewed_receipt_sha256'] == reviewed_sha
                and admission['complete_packs'] == len(raw['packs']), 'Missing matching full-family admission')
        readback = load_ref(root, refs['readback'])
        require(schema_one(readback) and readback['receipt_sha256'] == reviewed_sha and readback['pack_count'] == len(raw['packs'])
                and all(readback.get(k) is True for k in ('ok', 'exact_pack_files_and_order', 'native_started', 'family_initialized', 'whole_stack_quality'))
                and readback['drift']['ok'] is True and readback['errors'] == []
                and readback['summary']['status'] == 'RUNNING' and nonblank(readback['recorded_at']), 'Missing matching direct readback')
        result['direct_readback_report_verified'] = True
        context = record['acceptance_context']
        require(isinstance(context, dict) and set(context) == CONTEXT_KEYS
                and all(isinstance(v, str) and v.strip() for v in context.values()), 'Missing exact client/environment context')
        require(all(hex_id(context[k], 64) for k in ('settings_sha256', 'initial_state_sha256')), 'Invalid settings/state digest')
        client = load_ref(root, refs['client'])
        require(schema_one(client) and client['method'] == 'human_client'
                and client['candidate_receipt_sha256'] == raw_sha
                and client['runtime_inventory_sha256'] == identity
                and client['context'] == context and nonblank(client['recorded_at']), 'Client receipt candidate/context mismatch')
        scenarios = client['scenarios']
        require(isinstance(scenarios, dict) and CORE_SCENARIOS <= scenarios.keys(), 'Missing required client scenarios')
        for name, scenario in scenarios.items():
            require(scenario['result'] == 'PASS', 'Client scenario not passed: ' + name)
            require(isinstance(scenario['observations'], str) and scenario['observations'].strip(), 'Missing scenario observation: ' + name)
            require(scenario['captures'], 'Missing client capture: ' + name)
            for capture in scenario['captures']:
                require(load_ref(root, capture, binary=True), 'Empty client capture: ' + name)
        result['client_receipt_verified'] = True
        require(record.get('unresolved_blockers') == [], 'Unresolved or unspecified acceptance blockers')
        result['promotion_ready'] = True
    except (KeyError, TypeError, ValueError, OSError, AttributeError, RuntimeError) as error:
        result['blockers'].append(str(error))
    if record['status'] in {'accepted', 'stable'}:
        require(result['promotion_ready'], 'Claimed acceptance lacks matching evidence: ' + '; '.join(result['blockers']))
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--record', required=True, type=Path)
    parser.add_argument('--request', choices=['accepted', 'stable'], help='Fail closed unless promotion evidence is complete')
    args = parser.parse_args(argv)
    try:
        result = inspect(json.loads(args.record.read_bytes()), args.record.parent)
        print(json.dumps(result, indent=2))
        return 1 if args.request and not result['promotion_ready'] else 0
    except (ValueError, TypeError, AttributeError, OSError, RuntimeError) as error:
        print(json.dumps({'promotion_ready': False, 'error': str(error)}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
