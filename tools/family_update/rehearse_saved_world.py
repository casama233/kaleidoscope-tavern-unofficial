"""One native load/restart on the fresh stopped backup validates family and save."""
import argparse
from family_update.native_common import *
from container_recovery import recover_world, inventory_world
from family_update.native_storage_reanchor import inspect_world as inspect_native_storage,verify as verify_native_storage,commands as native_storage_commands
from family_update.freezer_storage_preservation import inspect_world as inspect_freezer_storage

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
    original = read(R / 'production-before/inventory.json')
    from family_update.identity_migration import prepare_world
    rehearsal_source,migration=prepare_world(snapshot,receipt,original)
    setup_engine(engine, 'Saved World QA', args.port, expected_inputs=inputs)
    world = engine / 'worlds/Saved World QA'; world.parent.mkdir(); shutil.copytree(rehearsal_source, world, ignore=lambda directory, names: [n for n in names if Path(directory) == rehearsal_source and n in {"behavior_packs", "resource_packs"}])
    recovery=None
    if CONFIG.get('container_recovery_plan'):
        recovery=recover_world(world,read(Path(CONFIG['container_recovery_plan'])))
        atomic(R/'saved-world-container-recovery.json',recovery)
    # LevelDB opening can create metadata even for read operations. Inspect only
    # the rehearsal copy so the immutable stopped backup remains byte-exact.
    before = player_hashes(world)
    containers_before=inventory_world(world)
    freezer_uuid=read(SOURCES['world-liquor']/'baseline.json')['packs']['BP']['uuid']
    freezer_before=inspect_freezer_storage(world,freezer_uuid)
    freezer_runs=[]
    storage_plan=read(Path(CONFIG['native_storage_reanchor_plan'])) if CONFIG.get('native_storage_reanchor_plan') else None
    storage_uuid=read(SOURCES['tavern']/'baseline.json')['packs']['BP']['uuid']
    storage_before=inspect_native_storage(world,storage_plan,storage_uuid) if storage_plan else []
    storage_runs=[]
    state_profile=migration.get('block_state_profile') if migration else None
    if state_profile:
        from family_update.author_state_preservation import inspect_world as inspect_author_states,probe_commands,verify as verify_author_states
        states_before=inspect_author_states(world,state_profile)
        state_commands,state_delayed,state_markers=probe_commands(states_before)
    else:state_commands=state_delayed=state_markers=[]
    state_runs=[]
    for side in ['behavior', 'resource']:
        shutil.copytree(C / (side + '_packs'), world / (side + '_packs'))
        shutil.copy2(C / ('world_' + side + '_packs.json'), world / ('world_' + side + '_packs.json'))
    audit_candidate(world, receipt)
    runs=[]; after=before
    engine_hash=sha(B/'bedrock_server')
    for phase in ['first', 'restart']:
        points={tuple(row['position']) for row in (recovery or {}).get('restored',[])}
        commands=[f'tickingarea add circle {x} {y} {z} 1 freezer_recovery_{i}' for i,(x,y,z) in enumerate(sorted(points))]
        if storage_plan:commands+=native_storage_commands(storage_plan)
        commands+=state_commands
        record=native_run(engine,phase,commands=commands,delayed_commands=state_delayed,cpu_profile=CONFIG.get('native_cpu_profile',False))
        after=player_hashes(world); audit_candidate(world, receipt)
        containers_after=inventory_world(world)
        freezer_after=inspect_freezer_storage(world,freezer_uuid)
        freezer_retained=freezer_before==freezer_after
        freezer_runs.append({'phase':phase,'complete_native_items_and_identity_retained':freezer_retained,'rows':freezer_after})
        retained=all(containers_after.get(key)==value for key,value in containers_before.items())
        record.update(custom_container_inventories_retained=retained,custom_container_count=len(containers_before))
        record.update(native_freezer_inputs_retained=freezer_retained,native_freezer_input_containers=len(freezer_before))
        record.update(player_records_unchanged=before==after, player_records=len(before))
        if state_profile:
            states_after=inspect_author_states(world,state_profile)
            state_result=verify_author_states(states_before,states_after,(engine/(phase+'.log')).read_text(errors='replace'),state_markers)
            state_runs.append({'phase':phase,**state_result})
            record['author_states_preserved']=state_result['ok']
            record['ok']=record['ok'] and state_result['ok']
        if storage_plan:
            storage_after=inspect_native_storage(world,storage_plan,storage_uuid)
            restored=verify_native_storage(storage_before,storage_after)
            storage_runs.append({'phase':phase,'original_identity_and_full_item_nbt_retained':restored,'rows':storage_after})
            record['native_storage_reanchor_verified']=restored
        record['ok']=record['ok'] and before==after and retained and freezer_retained
        runs.append(record); print(json.dumps(record),flush=True)
        if not record['ok']: break
    assert sha(B/'bedrock_server')==engine_hash
    assert inputs == engine_inputs(), 'Engine inputs changed during saved-world rehearsal'
    assert hashes(snapshot)==backup['files'], 'Original backup mutated during rehearsal'
    success=len(runs)==2 and all(row['ok'] for row in runs)
    report={'schema':1,'recorded_at':now(),'native_acceptance_source':'saved_world','exact_files_checked':True,'candidate_receipt_sha256':sha(C/'family-receipt.json'),'engine_sha256':engine_hash,'engine_inputs':inputs,'packs':len(receipt['packs']),'versions':versions(receipt),'identity_mapping':migration['uuid_mapping'] if migration else {},'same_author_and_owned_uuids':migration is None,'snapshot_source':str(snapshot),'backup_receipt':report_ref(R/'production-before/backup-receipt.json'),'fresh_stopped_backup':True,'snapshot_cutoff':backup['recorded_at'],'existing_world_loaded':success,'database_replaced_in_live':False,'saved_world_migration':success,'bds':success,'test_only_overlays':[],'client':False,'simulated_players':False,'players':0,'player_records_before':before,'player_records_after':after,'runs':runs}
    atomic(R/'saved-world-report.json',report)
    atomic(R/'saved-world-container-inventories.json',{'before':containers_before,'after':containers_after,'recovery':recovery,'retained':retained,'native_loaded_recovery_positions':bool(points)})
    atomic(R/'saved-world-freezer-inputs.json',{'uuid':freezer_uuid,'before':freezer_before,'runs':freezer_runs,'ok':success and all(row['complete_native_items_and_identity_retained']for row in freezer_runs),'scope':'Original actor identity/owner binding and complete typed item NBT in stopped rehearsal copies; no player/client equivalence'})
    if state_profile:
        atomic(R/'saved-world-author-states.json',{'schema':1,'identity_spec':migration['identity_spec'],'before':states_before,'runs':state_runs,'ok':success and len(state_runs)==2 and all(row['ok'] for row in state_runs),'client':False,'test_world_only':True,'simulated_players':False})
    if storage_plan:
        atomic(R/'saved-world-native-storage.json',{'schema':1,'plan':report_ref(Path(CONFIG['native_storage_reanchor_plan'])),'uuid':storage_uuid,'before':storage_before,'runs':storage_runs,'ok':success and len(storage_runs)==2,'only_qa_world_loaded':True,'client':False})
    if success:
        from family_update.storage import prune_closed_packs
        prune_closed_packs(C, world, report, report['candidate_receipt_sha256'])
    return 0 if success else 1
if __name__=='__main__': raise SystemExit(main())
