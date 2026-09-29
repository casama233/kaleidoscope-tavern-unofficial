"""Run an isolated native BDS fixture; no players and no production-world access.
The provided server directory must be a fresh, disposable extraction.
Cookery archive and BDS are downloaded by CI, never bundled in release assets.
"""
import argparse, hashlib, io, json, os, pathlib, shutil, subprocess, time, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
def install_archive(raw,server):
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names=z.namelist()
        nested=[n for n in names if n.lower().endswith('.mcpack')]
        for n in nested:install_archive(z.read(n),server)
        for n in names:
            if pathlib.PurePosixPath(n).name!='manifest.json':continue
            m=json.loads(z.read(n).decode('utf-8-sig'));prefix=n[:-len('manifest.json')]
            side='resource_packs' if any(x['type']=='resources' for x in m['modules']) else 'behavior_packs'
            dest=server/side/m['header']['uuid'];dest.mkdir(parents=True,exist_ok=True)
            for name in names:
                if not name.startswith(prefix) or name.endswith('/'):continue
                rel=pathlib.PurePosixPath(name[len(prefix):])
                if rel.is_absolute() or '..' in rel.parts:raise ValueError('Unsafe ZIP path')
                out=dest.joinpath(*rel.parts);out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(z.read(name))
            assert m['header']['version']==[1,0,6], 'Unexpected Cookery version'
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--server',type=pathlib.Path,required=True);ap.add_argument('--cookery',type=pathlib.Path,required=True);ap.add_argument('--evidence',type=pathlib.Path,required=True);a=ap.parse_args()
    server=a.server.resolve();evidence=a.evidence.resolve();evidence.mkdir(parents=True,exist_ok=True)
    assert (server/'bedrock_server').is_file() and not (server/'worlds').exists(),'Fresh disposable BDS extraction required'
    install_archive(a.cookery.read_bytes(),server)
    for side,folder in [('BP','behavior_packs'),('RP','resource_packs')]:
        shutil.copytree(ROOT/'runtime'/side,server/folder/'tavern')
    bp=server/'behavior_packs/tavern';mainjs=bp/'scripts/main.js';mainjs.write_text(mainjs.read_text()+"\nimport './native-mechanics-probe.js';\nimport './native-collision-probe.js';\n")
    shutil.copy2(ROOT/'tools/mechanics/native-mechanics-probe.js',bp/'scripts/native-mechanics-probe.js')
    subprocess.run(['python3',str(ROOT/'tools/java_collision_probe.py'),'--output',str(bp/'scripts/native-collision-probe.js')],check=True)
    p=bp/'scripts/native-collision-probe.js';text=p.read_text();text=text.replace("await world.tickingAreaManager.createTickingArea('parity',{dimension:d,from:{x:1024,y:0,z:1024},to:{x:1087,y:100,z:1087}});","d.runCommand('tickingarea add 1024 0 1024 1087 100 1087 parity true');await delay(10);");p.write_text(text)
    entity={'format_version':'1.21.0','minecraft:entity':{'description':{'identifier':'parity:probe','is_spawnable':False,'is_summonable':True},'components':{'minecraft:collision_box':{'width':.01,'height':.01},'minecraft:physics':{'has_gravity':True,'has_collision':True},'minecraft:health':{'value':20,'max':20},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False}}}}
    (bp/'entities/native_probe.json').write_text(json.dumps(entity))
    w=server/'worlds/native-mechanics';w.mkdir(parents=True)
    for folder,kind in [('behavior_packs','behavior'),('resource_packs','resource')]:
        packs=[]
        for p in (server/folder).glob('*/manifest.json'):
            m=json.loads(p.read_text(encoding='utf-8-sig'));packs.append({'pack_id':m['header']['uuid'],'version':m['header']['version']})
        (w/f'world_{kind}_packs.json').write_text(json.dumps(packs))
    (server/'server.properties').write_text('server-name=Tavern-isolated-native-test\nlevel-name=native-mechanics\nlevel-type=FLAT\nallow-cheats=true\nonline-mode=true\nallow-list=true\ntransport=nethernet\nmax-players=1\nserver-port=29132\nserver-portv6=29133\ncontent-log-file-enabled=true\ncontent-log-console-output-enabled=true\ntick-distance=4\nview-distance=4\n')
    (server/'allowlist.json').write_text('[]')
    # Record the exact original source tree; only the throwaway copy is instrumented.
    files={p.relative_to(ROOT/'runtime').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'runtime').rglob('*') if p.is_file()}
    (evidence/'native-inputs.json').write_text(json.dumps({'version':json.loads((ROOT/'release.json').read_text())['version'],'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtimeFiles':files,'cookerySha256':hashlib.sha256(a.cookery.read_bytes()).hexdigest(),'instrumentation':['append fixture imports to throwaway BP main','two fixture JS files','parity:probe entity'],'players':0},indent=2))
    log=evidence/'native-mechanics.log'
    with log.open('w') as f:
        proc=subprocess.Popen(['./bedrock_server'],cwd=server,env={**os.environ,'LD_LIBRARY_PATH':'.'},stdin=subprocess.PIPE,stdout=f,stderr=subprocess.STDOUT,text=True)
        for _ in range(150):
            time.sleep(1);text=log.read_text(errors='replace')
            if proc.poll() is not None or ('PARITY_DONE' in text and '"name":"DONE"' in text) or 'MECHANICS_NATIVE {"name":"ERROR"' in text or 'PARITY_ERROR' in text:break
        if proc.poll() is None:
            proc.stdin.write('stop\n');proc.stdin.flush()
            try:proc.wait(timeout=15)
            except subprocess.TimeoutExpired:proc.kill();proc.wait()
    text=log.read_text(errors='replace');print(text)
    rows=[]
    for line in text.splitlines():
        if 'MECHANICS_NATIVE ' in line:rows.append(json.loads(line.split('MECHANICS_NATIVE ',1)[1]))
    collisions=[json.loads(x.split('PARITY_RESULT ',1)[1]) for x in text.splitlines() if 'PARITY_RESULT ' in x]
    report={'version':'0.6.64','bds':'1.26.51.1','mechanics':rows,'collisions':collisions,'nativePlayers':0,'clientAcceptance':False,'simulatedPlayers':False}
    (evidence/'native-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    assert 'Version: 1.26.51.1' in text and '"name":"DONE"' in text and 'PARITY_DONE' in text,'Native fixtures incomplete'
    assert collisions and collisions[0]['failed']==0 and collisions[0]['rayFailed']==0,'Native collision failure'
    assert not any(x.get('name')=='ERROR' for x in rows),'Native mechanics failure'
    assert '[Scripting][error]' not in text and '[Scripting] TypeError' not in text and '[Scripting] ReferenceError' not in text,'Native script errors'
if __name__=='__main__':main()
