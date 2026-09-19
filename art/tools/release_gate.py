"""Fail-closed packaging preflight. A visual-lab pass is never a production pass."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from interface_common import ROOT, read, dump, sha
from validate_interfaces import validate


def evaluate(root: Path = ROOT, profile: str = 'lab') -> dict:
    if profile not in ('lab','production'):
        raise ValueError('Unknown profile')
    result = validate(root); blockers = []
    if result['failed']:
        blockers.append({'code': 'BROKEN_RESOURCE_INTERFACE', 'details': [r for r in result['checks'] if not r['passed']]})
    if profile == 'production':
        if not read(root/'cookery.requirement.json').get('bound'):
            blockers.append({'code': 'COOKERY_UNBOUND', 'details': 'No real archive has been bound.'})
        if not (root/'docs/release-comparison.json').exists():
            blockers.append({'code': 'RELEASE_JAR_NOT_COMPARED', 'details': 'Fixed source commit is not proof of release JAR identity.'})
        else:
            comparison = read(root/'docs/release-comparison.json')
            if comparison.get('schema_version') != 2 or comparison.get('source_lock_sha256') != sha(root/'sources.lock.json'):
                blockers.append({'code': 'STALE_RELEASE_COMPARISON', 'details': 'Regenerate comparison with current locked main/generated resources.'})
            if not comparison.get('all_selected_resources_equal'):
                blockers.append({'code': 'SELECTED_RESOURCE_BYTES_DIFFER', 'details': 'Raw hashes differ. Consult JAR-COMPARISON-EXPLAINED.zh-TW.md for separate parsed-JSON/RGBA equivalence; this is not a claim of different visible art.'})
        blockers.extend([
            {'code': 'RUNTIME_VISUAL_PARITY_NOT_ACCEPTED', 'details': 'Static/source art baseline is ready; text, hand binding, inherited particle physics, UI and game-render validation remain. See ART-READINESS.json.'},
            {'code': 'ENGINE_ACCEPTANCE_NOT_RUN', 'details': 'JSON/source checks and the local viewer are not Minecraft testing.'},
            {'code': 'GAMEPLAY_NOT_IMPLEMENTED', 'details': 'This pack is intentionally an asset-only lab; a production export is not provided.'}
        ])
    return {'profile': profile, 'allowed': not blockers, 'scope': 'static packaging preflight only',
            'static_checks': {'run': result['checks_run'], 'failed': result['failed']},
            'engine_test': 'NOT_RUN', 'blockers': blockers}

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('--project', type=Path, default=ROOT)
    p.add_argument('--profile', choices=['lab','production'], default='lab'); args=p.parse_args()
    report=evaluate(args.project,args.profile);dump(args.project/f'docs/PREFLIGHT-{args.profile.upper()}.json',report)
    print(json.dumps(report,ensure_ascii=False,indent=2));raise SystemExit(0 if report['allowed'] else 2)
