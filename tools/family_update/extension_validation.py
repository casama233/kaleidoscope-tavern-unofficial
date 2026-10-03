"""Bind private integration validation to its exact canonical source and bytes."""
import json
from pathlib import Path
from family_update.common import CONFIG,R,EXTENSION,read,sha,git,report_ref,atomic

def verify_extension(receipt,prior):
    changed=[p for p in receipt['packs'] if p['source']['owner']=='owned' and p['source'].get('repository')=='local/senluo-amw-cuisine' and
             (p['uuid'] not in prior or any(p[k]!=prior[p['uuid']][k] for k in ['files','version']))]
    if not changed:return []
    path=CONFIG.get('extension_validation')
    assert path and EXTENSION, 'A changed private extension needs exact functional evidence'
    proof=read(Path(path));config=read(EXTENSION/'baseline.json')
    assert proof['schema']==1 and proof['repository']==config['repository']
    assert proof['source_commit']==git(EXTENSION,'rev-parse','HEAD')
    assert proof['version']==config['version'] and proof['source_trees']==config['source_trees']
    owned=[p for p in receipt['packs'] if p['source'].get('repository')==config['repository']]
    assert proof['packs']=={p['uuid']:p['files'] for p in owned}, 'Private validation bytes differ from candidate'
    reports=[report_ref(Path(path))]
    def verified(ref):
        assert sha(ref['path'])==ref['sha256'], 'Private functional evidence changed'
        reports.append(ref);return read(Path(ref['path']))
    tested=verified(proof['tested_family_receipt'])
    assert {p['uuid']:p['files'] for p in tested['packs'] if p['source'].get('repository')==config['repository']}==proof['packs'], 'Native tested private bytes differ'
    for item in owned:
        assert item['version']==config['version']
    checks=proof['checks'];assert checks, 'Private canonical checks missing'
    for check in checks:
        assert check['exit_code']==0 and sha(check['log'])==check['sha256']
    assert any(check['command'][-3:]==['check','--release','--history-base='+proof['history_base']] for check in checks), 'Private append-only baseline check missing'
    preservation=verified(proof['preservation']['report'])
    assert Path(preservation['candidate'])==Path(proof['tested_family_receipt']['path']).parent, 'Native report describes another candidate'
    assert preservation['test_world_only'] and preservation['client'] is False and preservation['simulated_players'] is False
    assert [r['phase'] for r in preservation['runs']]==['first','restart']
    assert preservation['before'] and preservation['after']==preservation['before'], 'Private native inventory metadata was lost'
    for run,ref in zip(preservation['runs'],proof['preservation']['logs'],strict=True):
        assert run['ok'] and run['inventories_preserved'] and not run['errors'] and run['real_player_connections']==0
        assert sha(ref['path'])==ref['sha256']==run['log_sha256'];reports.append(ref)
    functional=verified(proof['functional']['report']);ref=proof['functional']['log']
    assert functional['test_world_only'] and functional['client'] is False and functional['simulated_players'] is False
    assert functional['run']['ok'] and not functional['run']['errors'] and functional['run']['real_player_connections']==0
    assert sha(ref['path'])==ref['sha256']==functional['run']['log_sha256'];reports.append(ref)
    text=Path(ref['path']).read_text();marker='[Freezer functional QA] PASS '
    lines=[line.split(marker,1)[1] for line in text.splitlines() if marker in line]
    assert len(lines)==1;coverage=json.loads(lines[0])
    for suffix in ['', '_green','_light_blue','_orange','_pink','_yellow']:
        for check in ['native_capacity','full_stack_metadata','cold_recipe_metadata','water_recipe','hopper_one_item','destroy_both_halves','destroy_drops_metadata','nonstackable_dynamic_properties']:
            assert check+suffix in coverage, 'Private native functional case missing'
    # The test module and exposed hook are overlays in an isolated world, never
    # included in the release candidate or presented as human client acceptance.
    assert len(functional['overlays'])==2
    hook=functional['overlays'][0]
    assert hook['original_sha256'] in [digest for p in tested['packs'] for name,digest in p['files'].items() if name=='scripts/custom_components/blocks/freezer.js'], 'Functional probe hooked another host version'
    for item in owned:
        side=item['side']+'_packs';root=Path(hook['path']).parents[5]/side/item['uuid']
        actual={p.relative_to(root).as_posix():sha(p) for p in root.rglob('*') if p.is_file()}
        assert actual==item['files'], 'Functional probe private source changed'
    for overlay in functional['overlays']:
        if 'sha256' in overlay:assert sha(overlay['path'])==overlay['sha256']
    atomic(R/'extension-validation-check.json',{'source':report_ref(Path(path)),'coverage':coverage,'exact_owned_packs':len(owned),'client':False,'production_ready':False})
    return reports
