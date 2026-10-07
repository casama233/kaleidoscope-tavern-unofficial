"""Native zero-player loading helpers; no simulated player or live world writes."""
import io, shutil, struct
from family_update.common import *

def setup_engine(engine, world_name, port):
    properties = dict(line.split('=', 1) for line in (B / 'server.properties').read_text().splitlines() if '=' in line and not line.lstrip().startswith('#'))
    live_ports = {int(properties.get('server-port', 19132)), int(properties.get('server-portv6', 19133))}
    assert not {port, port + 1} & live_ports, 'Isolated BDS port overlaps live'
    engine.mkdir()
    for name in ['bedrock_server', 'definitions', 'behavior_packs', 'resource_packs']:
        (engine / name).symlink_to((B / name).resolve(), target_is_directory=(B / name).is_dir())
    for name in ['config', 'minecraftpe', 'treatments']:
        if name=='minecraftpe':
            cache=client_pack_cache()
            shutil.copytree(B/name,engine/name,ignore=lambda directory,names:[n for n in names if Path(directory)==B/name and n in cache])
        else:shutil.copytree(B / name, engine / name)
    if (B / 'data').exists():
        assert (B / 'data').is_dir(), 'BDS data input must be a directory'
        expected_data = hashes(B / 'data')
        shutil.copytree(B / 'data', engine / 'data')
        assert hashes(engine / 'data') == expected_data, 'Isolated BDS data copy differs from captured input'
        assert hashes(B / 'data') == expected_data, 'BDS data input changed during isolated copy'
    (engine / 'allowlist.json').write_text('[]\n')
    (engine / 'server.properties').write_text(f'server-name=Parity isolated native QA\nlevel-name={world_name}\nserver-port={port}\nserver-portv6={port+1}\nonline-mode=true\nallow-list=true\nview-distance=5\ntick-distance=4\nmax-threads=2\nenable-lan-visibility=false\ncontent-log-file-enabled=true\ncontent-log-console-output-enabled=true\ntransport=nethernet\n')

def level_metadata(source):
    import nbtlib
    raw = (source if source.is_file() else source / 'level.dat').read_bytes()
    return nbtlib.File.parse(io.BytesIO(raw[8:]), byteorder='little')

def blank_level(target, name):
    import nbtlib
    captured = R / 'production-before/level-metadata.dat'
    assert sha(captured) == read(R / 'production-before/capture.json')['level_metadata']['sha256']
    data = level_metadata(captured)
    data['LevelName'] = nbtlib.String(name)
    data['SpawnX'], data['SpawnY'], data['SpawnZ'] = nbtlib.Int(0), nbtlib.Int(80), nbtlib.Int(64)
    data['GameType'] = nbtlib.Int(1)
    if not CONFIG.get('preserve_captured_experiments',False):
        data['experiments'] = nbtlib.Compound()
    output = io.BytesIO(); data.write(output, byteorder='little'); body = output.getvalue()
    (target / 'level.dat').write_bytes(struct.pack('<II', 10, len(body)) + body)

def native_run(engine, phase, minimum_seconds=30, commands=()):
    assert not (engine / "packs-pruned.json").exists(), "Completed QA engines with removed redundant packs cannot restart; prepare a new isolated world"
    log = engine / (phase + '.log')
    markers = STARTUP_MARKERS
    with log.open('w') as output:
        process = subprocess.Popen(['./bedrock_server'], cwd=engine, env={**os.environ, 'LD_LIBRARY_PATH': str(engine)}, stdin=subprocess.PIPE, stdout=output, stderr=subprocess.STDOUT, text=True)
        try:
            sent=False
            for tick in range(90):
                time.sleep(1)
                text = log.read_text(errors='replace')
                if not sent and 'Server started.' in text:
                    for command in commands:
                        process.stdin.write(command+'\n')
                    process.stdin.flush();sent=True
                if process.poll() is not None or ' ERROR]' in text or '[error]' in text.lower(): break
                if all(marker in text for marker in markers) and tick >= minimum_seconds: break
            if process.poll() is None: process.communicate(('tickingarea remove_all\n' if commands else '')+'stop\n', timeout=30)
        finally:
            if process.poll() is None: process.kill(); process.wait()
    text = log.read_text(errors='replace')
    errors = [line for line in text.splitlines() if ' ERROR]' in line or '[error]' in line.lower()]
    connections = [line for line in text.splitlines() if 'Player connected:' in line]
    result = {'phase': phase, 'started': 'Server started.' in text, 'family_initialized': all(marker in text for marker in markers), 'exit_code': process.returncode, 'errors': errors, 'warning_count': sum(' WARN]' in line or '[warning]' in line.lower() for line in text.splitlines()), 'real_player_connections': len(connections), 'log_sha256': sha(log)}
    result['ok'] = result['family_initialized'] and not errors and not connections and process.returncode == 0
    return result

def player_hashes(world):
    from leveldb import LevelDB
    database = LevelDB(str(world / 'db'))
    try: return {key.hex(): hashlib.sha256(value).hexdigest() for key,value in database.items() if key.startswith((b'player', b'~local_player'))}
    finally: database.close()
