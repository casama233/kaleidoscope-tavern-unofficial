"""Exact full-family load/restart on a new isolated world, never a client pass."""
import argparse
from family_update.native_common import *

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true', help='Launch isolated native BDS only')
    parser.add_argument('--port', type=int, default=NATIVE_PORT)
    args = parser.parse_args(argv)
    engine = R / 'exact-engine'
    if not args.execute:
        print(json.dumps({'execute': False, 'candidate': str(C), 'engine': str(engine), 'port': args.port, 'fresh_world': True, 'client': False, 'simulated_players': False}, indent=2)); return
    receipt = verify_candidate_sources()
    engine_hash = sha(B / 'bedrock_server')
    inputs = engine_inputs()
    setup_engine(engine, 'Family QA', args.port)
    world = engine / 'worlds/Family QA'; world.parent.mkdir(); shutil.copytree(C, world)
    blank_level(world, 'Family QA')
    audit_candidate(world, receipt)
    runs = []
    for phase in ['first', 'restart']:
        record = native_run(engine, phase)
        audit_candidate(world, receipt)
        runs.append(record); print(json.dumps(record), flush=True)
        if not record['ok']: break
    assert sha(B / 'bedrock_server') == engine_hash, 'BDS changed during native check'
    assert inputs == engine_inputs(), 'Native engine configuration or builtin packs changed during validation'
    report = {'schema': 1, 'recorded_at': now(), 'candidate_receipt_sha256': sha(C / 'family-receipt.json'), 'engine_sha256': engine_hash, 'engine_inputs': inputs, 'scenario_metadata': report_ref(R / 'production-before/level-metadata.dat'), 'packs': len(receipt['packs']), 'versions': versions(receipt), 'experiments': [], 'test_only_overlays': [], 'exact_files_checked': True, 'simulated_players': False, 'real_players': 0, 'runs': runs, 'bds': len(runs)==2 and all(row['ok'] for row in runs), 'client': False, 'saved_world_migration': False, 'production_ready': False}
    atomic(engine / 'native-report.json', report)
    return 0 if report['bds'] else 1
if __name__ == '__main__': raise SystemExit(main())
