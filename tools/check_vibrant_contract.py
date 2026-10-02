#!/usr/bin/env python3
"""Read-only source gate plus in-memory manifest regression cases."""
import copy
import json
from pathlib import Path
from vibrant_audit import audit, record, source_records

ROOT = Path(__file__).resolve().parents[1]

def main():
    paths = [ROOT/'runtime/BP/manifest.json', ROOT/'runtime/RP/manifest.json']
    rows = source_records(paths)
    result = audit(rows)
    if not result['ok']:
        raise SystemExit('\n'.join(result['errors']))
    bp, rp = (r['doc'] for r in rows)
    def check(a, b):
        return audit([record('BP', json.dumps(a).encode()), record('RP', json.dumps(b).encode())])
    cases = 0
    for change in ('missing_pbr', 'low_engine', 'stale_dependency', 'duplicate_uuid', 'bad_capabilities'):
        a, b = copy.deepcopy(bp), copy.deepcopy(rp)
        if change == 'missing_pbr': b['capabilities'] = []
        if change == 'low_engine': b['header']['min_engine_version'] = [1,21,119]
        if change == 'stale_dependency':
            for d in a['dependencies']:
                if d.get('uuid') == b['header']['uuid']: d['version'] = [0,0,0]
        if change == 'duplicate_uuid': b['header']['uuid'] = a['header']['uuid']
        if change == 'bad_capabilities': b['capabilities'] = 'pbr'
        if check(a,b)['ok']: raise SystemExit('missed regression: '+change)
        cases += 1
    if audit([])['ok']: raise SystemExit('empty scan must fail')
    if result['unverified_external_dependencies']: raise SystemExit('standalone Tavern has an unexpected external pack dependency')
    if not audit(rows, complete=True)['ok']: raise SystemExit('owned standalone pair must have complete manifest dependencies')
    external=copy.deepcopy(bp);external['dependencies'].append({'uuid':'d322809c-a51e-4742-bfc4-16d3c1491c9d','version':[1,0,8]})
    external_rows=[record('BP',json.dumps(external).encode()),record('RP',json.dumps(rp).encode())]
    if not audit(external_rows)['unverified_external_dependencies']: raise SystemExit('external dependency not reported')
    if audit(external_rows,complete=True)['ok']: raise SystemExit('missing external pack must fail complete mode')
    if result['scope_complete']: raise SystemExit('source-only audit is not a full server scan')
    if audit(rows, engine=(1,21,120))['ok']: raise SystemExit('target engine incompatibility not caught')
    cases += 5
    print(json.dumps({'vibrant_source_gate':'passed','in_memory_manifest_cases':cases,
                      'client_tested':False,'production_stack_tested':False}))

if __name__ == '__main__': main()
