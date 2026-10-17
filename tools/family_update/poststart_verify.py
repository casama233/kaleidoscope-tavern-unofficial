"""Verify live exact files/order and startup only; never claim rendered acceptance."""
import argparse
from family_update.common import *

def startup_output(old):
    data=(B/'server_output.txt').read_bytes()
    return (data[len(old):] if data.startswith(old) else data).decode('utf-8','replace')

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute',action='store_true',help='Write poststart verification in this task directory')
    args=parser.parse_args(argv)
    if not args.execute:
        print(json.dumps({'execute':False,'world':str(W),'receipt':str(R/'reviewed-family-receipt.json'),'live':summary(),'client':False,'production_ready':False},ensure_ascii=False,indent=2)); return
    assert_lease()
    receipt=read(R/'reviewed-family-receipt.json')
    old=(R/'production-before/server-output-before-start.txt').read_bytes()
    # Valid native restarts can need over 55 seconds for deferred initialization.
    deadline=time.monotonic()+90
    markers=STARTUP_MARKERS
    while True:
        text=startup_output(old)
        if all(marker in text for marker in markers) or time.monotonic()>=deadline: break
        time.sleep(1)
    rows=live_inventory(); by_uuid={p['uuid']:p for p in rows['packs']}
    assert set(by_uuid)=={p['uuid'] for p in receipt['packs']}
    for p in receipt['packs']:
        actual=by_uuid[p['uuid']]; assert actual['files']==p['files'] and actual['version']==p['version'], 'Installed candidate differs: '+p['uuid']
    for side in ['behavior','resource']:
        assert rows['refs'][side]==read(C/('world_'+side+'_packs.json')), 'Pack order changed'
    drift=G['audit'](W,read(Q/'senluo-policy.json')); assert drift['ok']
    valid=runpy.run_path(str(Q/'policy.py'))['validate_world'](W); assert valid['ok']
    # Inventory and admission checks take time; record the latest same-boot log.
    text=startup_output(old)
    errors=[line for line in text.splitlines() if ' ERROR]' in line or '[error]' in line.lower()]
    warnings=[line for line in text.splitlines() if ' WARN]' in line or '[warning]' in line.lower()]
    live=summary()
    result={'schema':1,'recorded_at':now(),'summary':live,'versions':versions(receipt),'receipt_sha256':sha(R/'reviewed-family-receipt.json'),'exact_pack_files_and_order':True,'pack_count':len(receipt['packs']),'native_started':'Server started.' in text,'family_initialized':all(marker in text for marker in markers),'errors':errors,'warnings':warnings,'drift':drift,'whole_stack_quality':valid['ok'],'client':False,'production_ready':False}
    result['ok']=live['status']=='RUNNING' and result['family_initialized'] and not errors
    (R/'production-startup.log').write_text(text)
    atomic(R/'poststart-drift.json',drift); atomic(R/'poststart-verification.json',result)
    print(json.dumps({k:v for k,v in result.items() if k not in ['warnings','drift']},ensure_ascii=False))
    return 0 if result['ok'] else 1
if __name__=='__main__': raise SystemExit(main())
