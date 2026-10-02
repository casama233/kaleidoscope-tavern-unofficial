"""Capture after prior maintenance completes; default prints a read-only plan."""
import argparse, shutil
from family_update.common import *

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true', help='Write only task-local snapshots; never changes live')
    args = parser.parse_args(argv)
    previous = read(LEASE) if LEASE.exists() else {}
    plan = {'action': 'capture_live_pack_inventory_and_policy', 'world': str(W), 'output': str(R / 'production-before'), 'live': summary(), 'lease': previous, 'free_bytes': shutil.disk_usage(R).free, 'execute': args.execute}
    if not args.execute:
        print(json.dumps(plan, ensure_ascii=False, indent=2)); return
    lease_available()
    out = R / 'production-before'
    assert not out.exists(), 'Never overwrite a predeployment snapshot'
    original_policy = sha(Q / 'senluo-policy.json')
    inventory = live_inventory()
    policy = check_live_against_policy(inventory)
    out.mkdir()
    atomic(out / 'inventory.json', inventory)
    for name in ['senluo-policy.json', 'family_guard.py', 'policy.py', 'vibrant_audit.py']:
        shutil.copy2(Q / name, out / name)
    for src in [Q.parent / 'addon_localizations/index.json', B / 'server.properties']:
        shutil.copy2(src, out / src.name)
    # This is metadata only, never an online LevelDB copy. Pin the empty-world
    # scenario rather than reading changing live metadata again on cache reuse.
    shutil.copy2(W / 'level.dat', out / 'level-metadata.dat')
    shutil.copy2(str(AUTHORIZATION), out / 'ROOT-AGENTS.md')
    assert original_policy == sha(Q / 'senluo-policy.json'), 'Concurrent deployment during capture'
    assert inventory == live_inventory(), 'Concurrent pack change during capture'
    preserved = {p['uuid'] for p in read(policy['approved_receipt'])['packs'] if p['source']['owner'] == 'preserved'}
    atomic(out / 'preserved-packs.json', [p for p in inventory['packs'] if p['uuid'] in preserved])
    capture = {'recorded_at': now(), 'read_only_live': True, 'previous_lease': previous, 'policy_sha256': original_policy, 'engine_sha256': sha(B / 'bedrock_server'), 'level_metadata': report_ref(out / 'level-metadata.dat'), 'agent_instructions': report_ref(out / 'ROOT-AGENTS.md'), 'inventory': report_ref(out / 'inventory.json'), 'note': 'No live LevelDB copy. Fresh stopped snapshot is created only during authorized deployment.'}
    atomic(out / 'capture.json', capture)
    print(json.dumps({'captured': len(inventory['packs']), 'preserved': len(preserved), 'read_only_live': True}))
if __name__ == '__main__': main()
