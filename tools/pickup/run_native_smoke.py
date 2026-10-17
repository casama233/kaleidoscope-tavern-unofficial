#!/usr/bin/env python3
"""Run native inventory/carrier save-restart and block-drop checks in one BDS world.
No player sessions and no SimulatedPlayer API. Not a complete pack/client test.
"""
import argparse,hashlib,json,os,pathlib,queue,re,shutil,subprocess,threading,time,urllib.request,uuid,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
URL='https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.26.52.3.zip'
def stage_violations(lines,result,returncode,stop_requested,reader_finished):
 issues=[];log=''.join(lines)
 if re.search(r'\bERROR\]|\[error\]',log,re.IGNORECASE):issues.append('engine/content ERROR in complete server log')
 if 'KT_PICKUP_SMOKE_FAILED' in log:issues.append('native FAIL marker in complete server log')
 if re.search(r'\bplayer[ _]?(?:connected|joined|spawned)\b',log,re.IGNORECASE):issues.append('player connection/spawn in complete server log')
 if not isinstance(result,dict) or any(type(result.get(k)) is not int or result[k]!=0 for k in ['playerSessions','players']):issues.append('success record does not prove zero player sessions')
 if returncode!=0 or not stop_requested or not re.search(r'^Quit correctly\s*$',log,re.MULTILINE):issues.append('server did not exit normally after requested stop')
 if not reader_finished:issues.append('complete server output was not captured')
 return issues
def main():
 p=argparse.ArgumentParser();p.add_argument('--work',type=pathlib.Path,required=True);a=p.parse_args();work=a.work.resolve();work.mkdir(parents=True,exist_ok=True)
 assert not (work/'worlds').exists(),'Use an empty isolated directory'
 shaker=json.loads((ROOT/'runtime/BP/items/shaker.json').read_text())['minecraft:item']['components']
 assert not any(k in shaker for k in ['minecraft:storage_item','minecraft:storage_weight_limit','minecraft:storage_weight_modifier','minecraft:bundle_interaction']),'Integrate the production plain-identity carrier; rejected nested-storage prototypes are not supported'
 archive=work/'bds.zip';request=urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(request,timeout=90) as r,archive.open('wb') as f:shutil.copyfileobj(r,f)
 digest=hashlib.sha256(archive.read_bytes()).hexdigest()
 with zipfile.ZipFile(archive) as z:z.extractall(work)
 executable=work/'bedrock_server';executable.chmod(0o755)
 pack=work/'behavior_packs/pickup-native-smoke';(pack/'scripts/core').mkdir(parents=True);(pack/'entities').mkdir();(pack/'items').mkdir();(pack/'item_catalog').mkdir()
 uid=str(uuid.uuid4());version=[1,0,0]
 manifest={'format_version':2,'header':{'name':'Pickup native persistence probe','description':'Isolated no-player save/restart probe','uuid':uid,'version':version,'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':str(uuid.uuid4()),'version':version},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':str(uuid.uuid4()),'version':version}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]}
 (pack/'manifest.json').write_text(json.dumps(manifest));sources={}
 scripts=['core/native-item-storage.js','core/util.js','core/immersion.js','core/mixology.js','core/ingredient-metadata.js','core/bottles.js','core/potions.js','core/extension-content.js','bedrock/potions.js','data/mixology.js','data/bottles.js','data/drink-effects.js']
 copies=[('runtime/BP/entities/stored_items.json','entities/stored_items.json'),('runtime/BP/items/shaker.json','items/shaker.json'),('runtime/BP/item_catalog/crafting_item_catalog.json','item_catalog/crafting_item_catalog.json'),('tools/pickup/native-storage-smoke.js','scripts/main.js')]+[('runtime/BP/scripts/'+p,'scripts/'+p) for p in scripts]
 for src,dst in copies:
  (pack/dst).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/src,pack/dst);sources[src]=hashlib.sha256((pack/dst).read_bytes()).hexdigest()
 world=work/'worlds/pickup-smoke';world.mkdir(parents=True);(world/'world_behavior_packs.json').write_text(json.dumps([{'pack_id':uid,'version':version}]))
 (work/'server.properties').write_text('server-name=Pickup Native Probe\nlevel-name=pickup-smoke\nallow-cheats=true\nonline-mode=false\ntransport=nethernet\nenable-lan-visibility=false\nserver-port=19192\nserver-portv6=19193\ntick-distance=4\nmax-players=1\ncontent-log-file-enabled=true\n')
 stage_results={}
 for stage in [1,2]:
  # Keep the same extracted archive executable launchable for each phase.
  executable.chmod(0o755)
  env={**os.environ,'LD_LIBRARY_PATH':str(work)};proc=subprocess.Popen([str(executable)],cwd=work,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1);lines=[];q=queue.Queue()
  def reader():
   for line in proc.stdout:lines.append(line);q.put(line)
  thread=threading.Thread(target=reader,daemon=True);thread.start();success=False;stop_requested=False;deadline=time.monotonic()+150
  try:
   while time.monotonic()<deadline:
    try:line=q.get(timeout=1)
    except queue.Empty:
     if proc.poll() is not None:break
     continue
    print(line,end='',flush=True)
    if 'KT_PICKUP_SMOKE_FAILED' in line:break
    marker=f'KT_PICKUP_SMOKE_STAGE{stage}_OK '
    if marker in line:
     stage_results[str(stage)]=json.loads(line.split(marker,1)[1]);success=True;break
  finally:
   if proc.poll() is None:
    try:proc.stdin.write('stop\n');proc.stdin.flush();stop_requested=True
    except (BrokenPipeError,OSError):pass
    try:proc.wait(timeout=30)
    except subprocess.TimeoutExpired:proc.kill();proc.wait()
   thread.join(timeout=5);(work/f'stage-{stage}.log').write_text(''.join(lines))
  violations=stage_violations(lines,stage_results.get(str(stage)),proc.returncode,stop_requested,not thread.is_alive())
  if not success:violations.insert(0,'native stage success marker missing')
  (work/f'stage-{stage}-runner-validation.json').write_text(json.dumps({'accepted':not violations,'returncode':proc.returncode,'stopRequested':stop_requested,'completeOutputCaptured':not thread.is_alive(),'violations':violations},indent=2)+'\n')
  assert not violations,f'Native stage {stage} failed: '+('; '.join(violations))+f'; see stage-{stage}.log'
 (work/'native-storage-evidence.json').write_text(json.dumps({'bdsDownload':URL,'bdsSHA256':digest,'sourceSHA256':sources,'nativeServerSaveRestart':True,'productionShakerDefinitionCopied':True,'nativeOuterShakerCloneAndRestart':True,'nativePlainPotionIdentityRoundTrip':True,'decoratedPotionInputRejected':True,'nativeNestedIngredientStorage':False,'arbitraryIngredientMetadataSupported':False,'nativeSetblockDestroy':True,'stages':stage_results,'playerSessions':0,'portableShakerGameplayCallbacksTested':False,'fullArdentEffectTested':False,'minecraftClientTested':False,'wholePackTested':False},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
