#!/usr/bin/env python3
"""Actual host/addon in a disposable zero-player BDS, including saved mob restart.

The observer is an explicit test-only overlay in the copied host pack scope.
It never edits the source packs, live server, or existing worlds.
"""
import argparse, json, os, pathlib, shutil, subprocess, time

ROOT = pathlib.Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--engine', type=pathlib.Path, required=True)
    parser.add_argument('--liquor', type=pathlib.Path, required=True)
    parser.add_argument('--work', type=pathlib.Path, required=True)
    parser.add_argument('--port', type=int, default=27200)
    args = parser.parse_args()
    engine, liquor, work = args.engine.resolve(), args.liquor.resolve(), args.work.resolve()
    assert not work.exists(), 'Use a new isolated directory; retain failed evidence'
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
    for label, source in [('tavern', ROOT), ('liquor', liquor)]:
        for kind, folder in [('BP', 'behavior_packs'), ('RP', 'resource_packs')]:
            target = world/folder/label
            shutil.copytree(source/'runtime'/kind, target)
            header = json.loads((target/'manifest.json').read_text())['header']
            manifests[kind].append({'pack_id': header['uuid'], 'version': header['version']})
    host = world/'behavior_packs/tavern'
    shutil.copy2(ROOT/'tools/native/living-effects-probe.js', host/'scripts/living-effects-probe.js')
    shutil.copy2(ROOT/'tools/native/living-probe-entity.json', host/'entities/living-probe.json')
    with (host/'scripts/main.js').open('a') as output:
        output.write("\n// Disposable native observer; not release content.\nimport './living-effects-probe.js';\n")
    for kind, filename in [('BP', 'world_behavior_packs.json'), ('RP', 'world_resource_packs.json')]:
        (world/filename).write_text(json.dumps(manifests[kind], indent=2)+'\n')
    reports = []
    for phase in ['first', 'restart']:
        log = work/f'{phase}.log'
        with log.open('w') as output:
            process = subprocess.Popen(['./bedrock_server'], cwd=work, env={**os.environ, 'LD_LIBRARY_PATH': str(work)}, stdin=subprocess.PIPE, stdout=output, stderr=subprocess.STDOUT, text=True)
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
        errors = [line for line in text.splitlines() if ' ERROR]' in line or '[error]' in line.lower()]
        connections = sum('Player connected:' in line for line in text.splitlines())
        ok = normal_stop and not errors and not connections and any(row.get('kind') == 'done' and row.get('phase') == phase and row.get('players') == 0 for row in rows) and not any(row.get('kind') == 'failure' for row in rows)
        reports.append({'phase': phase, 'ok': ok, 'normal_stop': normal_stop, 'player_connections': connections, 'errors': errors, 'observations': rows})
        (work/'native-living-report.json').write_text(json.dumps({'native_script_behavior': all(row['ok'] for row in reports), 'client': False, 'test_only_host_overlay': True, 'reports': reports}, indent=2)+'\n')
        print(json.dumps(reports[-1]), flush=True)
        assert ok, f'{phase} failed: see {log}'


if __name__ == '__main__':
    main()
