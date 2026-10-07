"""Build exact full family only from clean canonical main and pinned archives."""
import argparse
from family_update.common import *
from family_bundle import assemble

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true', help='Build task-local release candidate')
    args = parser.parse_args(argv)
    if not args.execute:
        print(json.dumps({'execute': False, 'sources': {k: str(v) for k,v in SOURCES.items()}, 'extension': str(EXTENSION) if EXTENSION else None, 'preserved_inventory': str(R / 'production-before/preserved-packs.json'), 'output': str(C), 'existing_candidate': C.exists()}, indent=2)); return
    lease_available()
    for path in [C, R / 'build-evidence.json', R / 'compatibility-report.json']:
        assert not path.exists(), 'Never overwrite existing candidate/report: ' + str(path)
    original = verify_predeploy()
    sources = source_state(verify_remote=True)
    archives = archive_paths()
    preserved = read(R / 'production-before/preserved-packs.json')
    from family_update.preserved_upgrades import select_inputs
    preserved_paths = select_inputs(preserved, original)
    from family_update.identity_migration import assembly_order, candidate_plan
    requested=CONFIG.get('held_sources',[])
    receipt = assemble(read(T / 'family/upstream.lock.json'), SOURCES.copy(), archives, C, extensions=[EXTENSION] if EXTENSION else [], preserved=preserved_paths, reviewed_order=assembly_order(original),held_sources=requested)
    from family_update.preserved_upgrades import verify_candidate
    verify_candidate(receipt, original)
    from family_update.source_holds import verify_retained
    verify_retained(receipt,original,read(T/'family/upstream.lock.json'),requested)
    candidate_plan(receipt, original)
    audit_candidate(C, receipt)
    compatibility = quality(C, receipt)
    atomic(R / 'compatibility-report.json', compatibility)
    tools = ['family_bundle.py', 'family_guard.py', 'family_saved_world.py', 'baseline_gate.py', 'host_extensions.py', 'container_recovery.py']
    tools = [name for name in tools if (T / 'tools' / name).exists()]
    evidence = {'recorded_at': now(), 'config_sha256': sha(CONFIG_PATH), 'orchestration_sha256': orchestration_hashes(), 'sources': sources, 'candidate_receipt_sha256': sha(C / 'family-receipt.json'), 'upstream_lock_sha256': sha(T / 'family/upstream.lock.json'), 'tool_sha256': {name: sha(T / 'tools' / name) for name in tools}, 'packs': len(receipt['packs']), 'versions': versions(receipt), 'static_family_assembly': True, 'functional_tests_recorded_separately': True, 'client': False, 'production_ready': False}
    atomic(R / 'build-evidence.json', evidence)
    evidence['external_input_sha256']=external_input_hashes();atomic(R/'build-evidence.json',evidence)
    verify_predeploy()
    print(json.dumps({'packs': len(receipt['packs']), 'versions': versions(receipt), 'candidate_receipt_sha256': evidence['candidate_receipt_sha256']}, ensure_ascii=False))
if __name__ == '__main__': main()
