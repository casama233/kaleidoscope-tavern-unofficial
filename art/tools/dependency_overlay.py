"""Cookery manifest overlay. Inspection is not provenance authentication or engine testing."""
from __future__ import annotations
import argparse
import copy
from pathlib import Path
from uuid import UUID
from interface_common import ROOT, InterfaceError, read, encoded, transaction, within, version
from cookery_dependency import inspect


def validate_report(report: dict) -> None:
    if report.get('schema_version') != 1 or report.get('status') != 'archive-inspected-not-engine-tested':
        raise InterfaceError('Not a supported inspected archive report')
    if not isinstance(report.get('archive_sha256'), str) or len(report['archive_sha256']) != 64:
        raise InterfaceError('Missing archive SHA-256')
    identities = []
    for role in ('behavior', 'resource'):
        pack = report[role]
        if not version(pack['version']):
            raise InterfaceError('Dependency version must be three nonnegative integers')
        identities.append(str(UUID(pack['uuid'])))
        if not isinstance(pack.get('identifiers'), dict) or not isinstance(pack.get('modules'), list):
            raise InterfaceError('Missing inspected pack registrations')
        for module in pack['modules']:
            identities.append(str(UUID(module['uuid'])))
    if len(identities) != len(set(identities)):
        raise InterfaceError('Cookery has duplicate header/module UUIDs')
    if any(UUID(x).int == 0 for x in identities):
        raise InterfaceError('Null UUID is invalid')


def plan_bind(root: Path, report: dict) -> dict[Path, bytes]:
    root = root.resolve(); validate_report(report)
    config = read(root/'config.json')
    own = {}
    for key, role in [('behaviorPack', 'behavior'), ('resourcePack', 'resource')]:
        raw = config.get('packs', {}).get(key)
        if not isinstance(raw, str):
            raise InterfaceError('Missing pack path: ' + key)
        path = within(root, raw.rstrip('/') + '/manifest.json')
        own[role] = (path, read(path))
    if own['behavior'][0] == own['resource'][0]:
        raise InterfaceError('BP and RP target are the same')
    own_headers = {str(UUID(doc['header']['uuid'])) for _, doc in own.values()}
    own_all = own_headers | {str(UUID(m['uuid'])) for _, doc in own.values() for m in doc['modules']}
    external_all = {str(UUID(report[r]['uuid'])) for r in ('behavior','resource')} | {
        str(UUID(m['uuid'])) for r in ('behavior','resource') for m in report[r]['modules']}
    if own_all & external_all:
        raise InterfaceError('UUID collision: refusing to bind/modify Cookery itself')
    for role in ('behavior','resource'):
        if any(d.get('uuid') in own_headers for d in report[role].get('dependencies', [])):
            raise InterfaceError('Dependency cycle: Cookery points back to Tavern')
    bp_uuid = report['behavior']['uuid']; rp_uuid = report['resource']['uuid']
    if any(d.get('uuid') == bp_uuid for d in report['resource'].get('dependencies', [])):
        # A BP -> RP relationship plus RP -> BP would be cyclic.
        if any(d.get('uuid') == rp_uuid for d in report['behavior'].get('dependencies', [])):
            raise InterfaceError('Cycle within inspected Cookery pack pair')
    old_path = root/'compat/cookery.lock.json'
    previous = read(old_path) if old_path.exists() else {}
    changes = {}
    for role, (path, original) in own.items():
        doc = copy.deepcopy(original)
        deps = doc.get('dependencies', [])
        if not isinstance(deps, list):
            raise InterfaceError('Dependencies must be an array')
        old_uuid = previous.get(role, {}).get('uuid')
        target = report[role]
        doc['dependencies'] = [d for d in deps if d.get('uuid') not in {old_uuid, target['uuid']} or 'uuid' not in d]
        doc['dependencies'].append({'uuid': target['uuid'], 'version': list(target['version'])})
        changes[path] = encoded(doc)
    changes[old_path] = encoded(report)
    requirement = read(root/'cookery.requirement.json')
    requirement.update(bound=True, identity_status='BOUND_TO_INSPECTED_ARCHIVE_NOT_ENGINE_TESTED',
                       inspected_archive_sha256=report['archive_sha256'])
    changes[root/'cookery.requirement.json'] = encoded(requirement)
    contract_path = root/'interfaces/cookery-contract.json'
    if contract_path.exists():
        contract = read(contract_path); contract['binding_status'] = 'BOUND_NOT_ENGINE_TESTED'
        changes[contract_path] = encoded(contract)
    return changes


def apply_report(root: Path, report: dict) -> list[str]:
    return transaction(plan_bind(root, report), root/'.dependency-backups')


def verify_item_map(root: Path, report: dict | None) -> list[str]:
    mapping = read(root/'compat/cookery/item-map.json')
    if mapping.get('schema_version') != 1 or not isinstance(mapping.get('items'), dict):
        raise InterfaceError('Invalid Cookery item-map schema')
    if not report:
        return ['Item mapping is nonempty but Cookery is unbound'] if mapping['items'] else []
    validate_report(report)
    known = set(report['behavior']['identifiers'].get('items', []) + report['behavior']['identifiers'].get('blocks', []))
    return [f'Unverified Cookery ID for {key}: {value}' for key, value in mapping['items'].items()
            if not isinstance(value, str) or value not in known]


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('archive', type=Path); p.add_argument('--project', type=Path, default=ROOT)
    p.add_argument('--apply', action='store_true'); args = p.parse_args()
    try:
        report = inspect(args.archive); plan = plan_bind(args.project, report)
        for role in ('behavior','resource'):
            print(role, report[role]['uuid'], report[role]['version'])
        print('Would update:', ', '.join(str(x.relative_to(args.project.resolve())) for x in plan))
        if args.apply:
            apply_report(args.project, report)
            # Registry includes copies of pack identity; never leave those stale after a bind.
            from build_interfaces import compile_all
            compile_all(args.project)
            print('APPLIED to Tavern only; backups retained.')
        else:
            print('DRY RUN: no project files changed. Use --apply to write.')
        print('Not verified: package authenticity, Minecraft compatibility, Cookery Guidebook API.')
        return 0
    except (ValueError, OSError, KeyError, TypeError) as e:
        print('ERROR:', e); return 2

if __name__ == '__main__':
    raise SystemExit(main())
