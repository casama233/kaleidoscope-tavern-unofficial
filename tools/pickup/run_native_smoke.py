#!/usr/bin/env python3
"""Run a native inventory save/restart probe in an isolated throwaway BDS world.
No player sessions and no SimulatedPlayer API. Not a complete pack/client test.
"""
import argparse,hashlib,json,os,pathlib,queue,shutil,subprocess,threading,time,urllib.request,uuid,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
URL='https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.26.52.3.zip'
def main():
 p=argparse.ArgumentParser();p.add_argument('--work',type=pathlib.Path,required=True);a=p.parse_args();work=a.work.resolve();work.mkdir(parents=True,exist_ok=True)
 assert not (work/'worlds').exists(),'Use an empty isolated directory'
 archive=work/'bds.zip';request=urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(request,timeout=90) as r,archive.open('wb') as f:shutil.copyfileobj(r,f)
 digest=hashlib.sha256(archive.read_bytes()).hexdigest()
 with zipfile.ZipFile(archive) as z:z.extractall(work)
 executable=work/'bedrock_server';executable.chmod(0o755)
 pack=work/'behavior_packs/pickup-native-smoke';(pack/'scripts/core').mkdir(parents=True);(pack/'entities').mkdir()
 uid=str(uuid.uuid4());version=[1,0,0]
 manifest={'format_version':2,'header':{'name':'Pickup native persistence probe','description':'Isolated no-player save/restart probe','uuid':uid,'version':version,'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':str(uuid.uuid4()),'version':version},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':str(uuid.uuid4()),'version':version}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]}
 (pack/'manifest.json').write_text(json.dumps(manifest));sources={}
 for src,dst in [('runtime/BP/entities/stored_items.json','entities/stored_items.json'),('runtime/BP/scripts/core/native-item-storage.js','scripts/core/native-item-storage.js'),('runtime/BP/scripts/core/util.js','scripts/core/util.js'),('tools/pickup/native-storage-smoke.js','scripts/main.js')]:
  shutil.copy2(ROOT/src,pack/dst);sources[src]=hashlib.sha256((ROOT/src).read_bytes()).hexdigest()
 world=work/'worlds/pickup-smoke';world.mkdir(parents=True);(world/'world_behavior_packs.json').write_text(json.dumps([{'pack_id':uid,'version':version}]))
 (work/'server.properties').write_text('server-name=Pickup Native Probe\nlevel-name=pickup-smoke\nallow-cheats=true\nonline-mode=false\nserver-port=19192\nserver-portv6=19193\ntick-distance=4\nmax-players=1\ncontent-log-file-enabled=true\n')
 for stage in [1,2]:
  env={**os.environ,'LD_LIBRARY_PATH':str(work)};proc=subprocess.Popen([str(executable)],cwd=work,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1);lines=[];q=queue.Queue()
  def reader():
   for line in proc.stdout:lines.append(line);q.put(line)
  thread=threading.Thread(target=reader,daemon=True);thread.start();success=False;deadline=time.monotonic()+150
  try:
   while time.monotonic()<deadline:
    try:line=q.get(timeout=1)
    except queue.Empty:
     if proc.poll() is not None:break
     continue
    print(line,end='',flush=True)
    if 'KT_PICKUP_SMOKE_FAILED' in line:break
    if f'KT_PICKUP_SMOKE_STAGE{stage}_OK' in line:success=True;break
  finally:
   if proc.poll() is None:
    proc.stdin.write('stop\n');proc.stdin.flush()
    try:proc.wait(timeout=30)
    except subprocess.TimeoutExpired:proc.kill();proc.wait()
   thread.join(timeout=5);(work/f'stage-{stage}.log').write_text(''.join(lines))
  assert success,f'Native stage {stage} failed: see stage-{stage}.log'
 (work/'native-storage-evidence.json').write_text(json.dumps({'bdsDownload':URL,'bdsSHA256':digest,'sourceSHA256':sources,'nativeServerSaveRestart':True,'playerSessions':0,'minecraftClientTested':False,'wholePackTested':False},indent=2)+'\n')
if __name__=='__main__':main()
