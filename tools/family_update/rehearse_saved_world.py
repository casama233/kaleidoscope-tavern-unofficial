"""Rehearse only this deployment's fresh stopped backup; never copies an online DB."""
import argparse
from family_update.native_common import *

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true', help='Launch native BDS on fresh backup copy')
    parser.add_argument('--port', type=int, default=SAVED_PORT)
    args = parser.parse_args(argv)
    snapshot, engine = R / 'production-snapshot', R / 'saved-world-engine'
    if not args.execute:
        print(json.dumps({'execute': False, 'requires': str(R / 'production-before/backup-receipt.json'), 'snapshot': str(snapshot), 'engine': str(engine), 'port': args.port, 'requires_live_stopped_and_lease': True}, indent=2)); return
    assert_lease()
    verify_server_binding()
    assert not (R / 'saved-world-report.json').exists(), 'Never overwrite an existing saved-world report'
    assert summary()['status'] == 'STOPPED', 'Fresh snapshot rehearsal happens in owned maintenance window'
    backup = read(R / 'production-before/backup-receipt.json')
    assert backup['consistent_stopped_snapshot'] == str(snapshot) and backup['status'] == 'consistent_stopped_backup'
    assert backup['lease_owner'] == OWNER
    assert hashes(snapshot) == backup['files'], 'Fresh backup changed after capture'
    receipt = verify_candidate_sources()
    inputs = engine_inputs()
    assert inputs == read(R / 'exact-engine/native-report.json')['engine_inputs'], 'Engine inputs differ from the exact candidate test'
    original = read(R / 'production-before/inventory.json')
    assert {p['uuid'] for p in original['packs']} == {p['uuid'] for p in receipt['packs']}, 'UUID migration must be explicitly rehearsed by family_saved_world.py'
    setup_engine(engine, 'Saved World QA', args.port)
    world = engine / 'worlds/Saved World QA'; world.parent.mkdir(); shutil.copytree(snapshot, world)
    # LevelDB opening can create metadata even for read operations. Inspect only
    # the rehearsal copy so the immutable stopped backup remains byte-exact.
    before = player_hashes(world)
    for side in ['behavior', 'resource']:
        shutil.rmtree(world / (side + '_packs'))
        shutil.copytree(C / (side + '_packs'), world / (side + '_packs'))
        shutil.copy2(C / ('world_' + side + '_packs.json'), world / ('world_' + side + '_packs.json'))
    audit_candidate(world, receipt)
    runs=[]; after=before
    engine_hash=sha(B/'bedrock_server')
    for phase in ['first', 'restart']:
        record=native_run(engine,phase)
        after=player_hashes(world); audit_candidate(world, receipt)
        record.update(player_records_unchanged=before==after, player_records=len(before))
        record['ok']=record['ok'] and before==after
        runs.append(record); print(json.dumps(record),flush=True)
        if not record['ok']: break
    assert sha(B/'bedrock_server')==engine_hash
    assert inputs == engine_inputs(), 'Engine inputs changed during saved-world rehearsal'
    assert hashes(snapshot)==backup['files'], 'Original backup mutated during rehearsal'
    success=len(runs)==2 and all(row['ok'] for row in runs)
    report={'schema':1,'recorded_at':now(),'candidate_receipt_sha256':sha(C/'family-receipt.json'),'engine_sha256':engine_hash,'engine_inputs':inputs,'packs':len(receipt['packs']),'identity_mapping':[],'same_author_and_owned_uuids':True,'snapshot_source':str(snapshot),'backup_receipt':report_ref(R/'production-before/backup-receipt.json'),'fresh_stopped_backup':True,'snapshot_cutoff':backup['recorded_at'],'existing_world_loaded':success,'database_replaced_in_live':False,'saved_world_migration':success,'bds':success,'test_only_overlays':[],'client':False,'simulated_players':False,'players':0,'player_records_before':before,'player_records_after':after,'runs':runs}
    atomic(R/'saved-world-report.json',report)
    return 0 if success else 1
if __name__=='__main__': raise SystemExit(main())
