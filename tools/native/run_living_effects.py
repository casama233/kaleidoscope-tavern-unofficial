#!/usr/bin/env python3
"""Actual host/addon in a disposable zero-player BDS, including saved mob restart.

The observer is an explicit test-only overlay in the copied host pack scope.
It never edits the source packs, live server, or existing worlds.
"""
import argparse, hashlib, json, os, pathlib, re, shutil, subprocess, sys, time, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools'))
from baseline_gate import fingerprint


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--engine', type=pathlib.Path, required=True)
    parser.add_argument('--engine-provenance', type=pathlib.Path, help='Successful pickup-native engine receipt to bind when reusing that isolated installation')
    parser.add_argument('--liquor', type=pathlib.Path, required=True)
    parser.add_argument('--work', type=pathlib.Path, required=True)
    parser.add_argument('--port', type=int, default=27200)
    parser.add_argument('--probe', type=pathlib.Path, default=ROOT/'tools/native/living-effects-probe.js')
    parser.add_argument('--phases', nargs='+', choices=['first', 'restart'], default=['first', 'restart'])
    args = parser.parse_args()
    engine, liquor, work = args.engine.resolve(), args.liquor.resolve(), args.work.resolve()
    assert not work.exists(), 'Use a new isolated directory; retain failed evidence'
    engine_identity = {'executable_sha256': hashlib.sha256((engine/'bedrock_server').read_bytes()).hexdigest()}
    if args.engine_provenance is not None:
        receipt_path = args.engine_provenance.resolve()
        assert receipt_path.parent == engine and receipt_path.name == 'native-storage-evidence.json'
        receipt_bytes = receipt_path.read_bytes(); receipt = json.loads(receipt_bytes)
        assert receipt['nativeServerSaveRestart'] is True and receipt['playerSessions'] == 0
        assert set(receipt['stages']) == {'1', '2'}
        archive = engine/'bds.zip'
        assert hashlib.sha256(archive.read_bytes()).hexdigest() == receipt['bdsSHA256']
        with zipfile.ZipFile(archive) as source_archive:
            assert hashlib.sha256(source_archive.read('bedrock_server')).hexdigest() == engine_identity['executable_sha256']
        for phase in (1, 2):
            validation = json.loads((engine/f'stage-{phase}-runner-validation.json').read_text())
            assert validation['accepted'] and validation['returncode'] == 0 and validation['stopRequested'] and validation['completeOutputCaptured']
        engine_identity.update({'download': receipt['bdsDownload'], 'archive_sha256': receipt['bdsSHA256'],
                                'reused_successful_save_restart_receipt_sha256': hashlib.sha256(receipt_bytes).hexdigest()})
    properties = dict(line.split('=', 1) for line in (engine/'server.properties').read_text().splitlines() if '=' in line and not line.startswith('#'))
    assert not {args.port, args.port+1} & {int(properties.get('server-port', 19132)), int(properties.get('server-portv6', 19133))}
    work.mkdir(parents=True)
    for name in ['bedrock_server', 'definitions', 'behavior_packs', 'resource_packs']:
        (work/name).symlink_to(engine/name, target_is_directory=(engine/name).is_dir())
    for name in ['config', 'minecraftpe', 'treatments']:
        # This is engine configuration, never the live world or its pack cache.
        shutil.copytree(engine/name, work/name, ignore=shutil.ignore_patterns('packcache'))
    (work/'allowlist.json').write_text('[]\n')
    (work/'server.properties').write_text(f'server-name=Living effect native QA\nlevel-name=living-effect-qa\nserver-port={args.port}\nserver-portv6={args.port+1}\nallow-cheats=true\nonline-mode=true\nallow-list=true\nenable-lan-visibility=false\ntransport=nethernet\nview-distance=5\ntick-distance=4\nmax-threads=2\ncontent-log-file-enabled=true\ncontent-log-console-output-enabled=true\n')
    world = work/'worlds/living-effect-qa'
    world.mkdir(parents=True)
    manifests = {'BP': [], 'RP': []}
    sources = {}
    for label, source in [('tavern', ROOT), ('liquor', liquor)]:
        baseline = json.loads((source/'baseline.json').read_text())
        source_record = {'commit': subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip(),
                         'repository': baseline['repository'], 'version': baseline['version'], 'source_trees': {}}
        for kind, folder in [('BP', 'behavior_packs'), ('RP', 'resource_packs')]:
            target = world/folder/label
            shutil.copytree(source/'runtime'/kind, target)
            tree, _ = fingerprint(target)
            assert tree == baseline['source_trees'][kind], f'{label} {kind} copied runtime differs from frozen source'
            source_record['source_trees'][kind] = tree
            header = json.loads((target/'manifest.json').read_text())['header']
            manifests[kind].append({'pack_id': header['uuid'], 'version': header['version']})
        sources[label] = source_record
    host = world/'behavior_packs/tavern'
    shutil.copy2(args.probe, host/'scripts/living-effects-probe.js')
    shutil.copy2(ROOT/'tools/native/living-probe-entity.json', host/'entities/living-probe.json')
    shutil.copy2(ROOT/'tools/native/health-helper-entity.json', host/'entities/health-helper-probe.json')
    with (host/'scripts/main.js').open('a') as output:
        output.write("\n// Disposable native observer; not release content.\nimport './living-effects-probe.js';\n")
    overlays = {'scripts/living-effects-probe.js': hashlib.sha256(args.probe.read_bytes()).hexdigest(),
                'entities/living-probe.json': hashlib.sha256((ROOT/'tools/native/living-probe-entity.json').read_bytes()).hexdigest(),
                'entities/health-helper-probe.json': hashlib.sha256((ROOT/'tools/native/health-helper-entity.json').read_bytes()).hexdigest(),
                'scripts/main.js': 'Append only the declared disposable observer import after verifying the complete copied runtime.'}
    if args.probe.resolve() == (ROOT/'tools/native/shaker-migration-probe.js').resolve():
        for support_name in ('machine-ingredients-probe.js', 'status-aura-probe.js'):
            support = ROOT/'tools/native'/support_name
            shutil.copy2(support, host/'scripts'/support_name)
            overlays['scripts/'+support_name] = hashlib.sha256(support.read_bytes()).hexdigest()
    for kind, filename in [('BP', 'world_behavior_packs.json'), ('RP', 'world_resource_packs.json')]:
        (world/filename).write_text(json.dumps(manifests[kind], indent=2)+'\n')
    reports = []
    for phase in args.phases:
        # Keep the same extracted engine executable for each launch. Its bytes
        # remain bound to engine_identity; no source pack or world is rewritten.
        (engine/'bedrock_server').chmod(0o755)
        log = work/f'{phase}.log'
        with log.open('w') as output:
            process = subprocess.Popen(['./bedrock_server'], cwd=work, env={**os.environ, 'LD_LIBRARY_PATH': os.pathsep.join((str(work), str(engine)))}, stdin=subprocess.PIPE, stdout=output, stderr=subprocess.STDOUT, text=True)
            normal_stop = False
            try:
                for _ in range(180):
                    time.sleep(1)
                    text = log.read_text(errors='replace')
                    if process.poll() is not None or '[LIVING_EFFECT_QA] {"kind":"failure"' in text or ' ERROR]' in text or '[error]' in text.lower():
                        break
                    if f'"kind":"done","phase":"{phase}"' in text:
                        break
                if process.poll() is None:
                    process.communicate('stop\n', timeout=30)
                    normal_stop = process.returncode == 0
            finally:
                if process.poll() is None:
                    process.kill(); process.wait()
        text = log.read_text(errors='replace')
        rows = [json.loads(line.split('[LIVING_EFFECT_QA] ', 1)[1]) for line in text.splitlines() if '[LIVING_EFFECT_QA] {' in line]
        normal_stop = normal_stop and bool(re.search(r'^Quit correctly\s*$', text, re.MULTILINE))
        errors = [line for line in text.splitlines() if re.search(r'\bERROR\]|\[error\]', line, re.IGNORECASE)]
        connections = len(re.findall(r'\bplayer[ _]?(?:connected|joined|spawned)\b', text, re.IGNORECASE))
        ok = normal_stop and not errors and not connections and any(row.get('kind') == 'done' and row.get('phase') == phase and row.get('players') == 0 for row in rows) and not any(row.get('kind') == 'failure' for row in rows)
        reports.append({'phase': phase, 'ok': ok, 'normal_stop': normal_stop, 'player_connections': connections, 'errors': errors, 'observations': rows})
        (work/'native-living-report.json').write_text(json.dumps({'native_script_behavior': len(reports)==len(args.phases) and all(row['ok'] for row in reports),
            'client': False, 'full_family': False, 'live': False, 'test_only_host_overlay': True,
            'engine': engine_identity, 'sources': sources, 'copied_runtime_matches_frozen_source': True, 'test_only_overlays': overlays,
            'reports': reports}, indent=2)+'\n')
        print(json.dumps(reports[-1]), flush=True)
        assert ok, f'{phase} failed: see {log}'


if __name__ == '__main__':
    main()
