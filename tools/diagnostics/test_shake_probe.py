"""Focused API doubles and archive checks only; not native rendering acceptance."""
import json,subprocess,tempfile,unittest,zipfile,hashlib
from pathlib import Path
from build_shake_probe import PATHS,files,build
ROOT=Path(__file__).resolve().parents[2]
NODE_TEST=r"""
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(process.argv[1],'utf8').replace(/^import .*\n/m,'');
function fixture(){
 let next=1, clearCount=0, writes=0;const timers=new Map(),logs=[],chat=[],sets=[],plays=[],blocks=new Map(),events={};
 function signal(name){return {subscribe(fn){events[name]=fn;}};}
 const system={currentTick:0,afterEvents:{scriptEventReceive:signal('request')},runInterval(fn,every){const id=next++;timers.set(id,{fn,every,next:system.currentTick+every});return id;},runTimeout(fn,delay){const id=next++;timers.set(id,{fn,at:system.currentTick+delay});return id;},clearRun(id){timers.delete(id);}};
 const dimension={id:'minecraft:overworld',getBlock(location){const key=[location.x,location.y,location.z].join(',');if(!blocks.has(key))blocks.set(key,{typeId:'minecraft:air',location:{...location},get isAir(){return this.typeId==='minecraft:air';},setType(id){this.typeId=id;writes++;if(dimension.failAt===writes)throw Error('setType failed after write fixture');}});return blocks.get(key);}};
 const player={id:'self-display-handle',typeId:'minecraft:player',isValid:true,mode:'creative',health:20,effects:[],location:{x:.5,y:64,z:.5},dimension,rot:{x:0,y:0},getGameMode(){return this.mode;},getEffects(){return this.effects;},getComponent(){return {currentValue:this.health};},getHeadLocation(){return {...this.location,y:this.location.y+1.62};},getRotation(){return this.rot;},getViewDirection(){return {x:0,y:0,z:1};},getBlockFromViewDirection(){return null;},sendMessage(s){chat.push(s);},camera:{setCamera(...args){sets.push(args);},addShake(...args){plays.push(args);if(player.failPlay)throw Error('native camera restriction fixture');},clear(){clearCount++;}}};
 const world={players:[player],getAllPlayers(){return this.players;},afterEvents:{playerLeave:signal('leave'),playerSpawn:signal('spawn'),itemCompleteUse:signal('milk')}};
 const context=vm.createContext({world,system,LinearSpline:class{},EasingType:{Linear:'Linear'},GameMode:{Creative:'creative'},CameraShakeType:{Rotational:'Rotational'},console:{info(s){logs.push(JSON.parse(s.slice(s.indexOf('{'))));}}});vm.runInContext(source,context);
 function request(id,message=''){events.request({id:'kt_shake_probe:'+id,message,sourceEntity:player});}
 function advance(n){for(let i=0;i<n;i++){system.currentTick++;for(const[id,t]of [...timers]){if(!timers.has(id))continue;if(t.at!==undefined&&system.currentTick>=t.at){timers.delete(id);t.fn();}else if(t.every&&system.currentTick>=t.next){t.next+=t.every;t.fn();}}}}
 return {player,world,system,dimension,blocks,logs,chat,sets,plays,events,request,advance,timers,get clears(){return clearCount;},get writes(){return writes;},get active(){return vm.runInContext('sessions.size',context);}};
}
{
 const f=fixture();assert.equal(f.plays.length+f.sets.length+f.clears,0);assert.equal(f.timers.size,0);
 f.request('start','bad');assert.equal(f.active,0);
 f.request('start','clean_no_other_shake_setting_on');assert.equal(f.plays.length,0);f.advance(19);assert.equal(f.plays.length,0);f.advance(1);assert.equal(f.plays.length,1);
 assert.deepEqual({...f.plays[0][0]},{duration:3,intensity:.05,type:'Rotational'});
 f.request('start','clean_no_other_shake_setting_on');f.advance(80);assert.equal(f.active,0);assert.equal(f.plays.length,1);assert.equal(f.sets.length+f.clears,0);assert.equal(f.timers.size,0);
 const end=f.logs.find(r=>r.event==='end');assert.equal(end.reason,'COMPLETE');assert.equal(end.samples,100);assert.equal(end.metrics.before.count,20);assert.equal(end.metrics.during.count,60);assert.equal(end.metrics.after.count,20);
 assert(Object.values(end.metrics).every(m=>m.maxYaw===0&&m.maxPitch===0&&m.maxViewDelta===0&&m.rayChanges===0));
 const n=f.chat.length;f.request('status');assert.equal(f.chat.length,n+1);assert(f.chat.at(-1).includes('COMPLETE'));
}
for(const timing of [0,25]){
 const f=fixture();f.request('start','clean_no_other_shake_setting_on');f.advance(timing);f.request('abort');if(timing){f.request('start','clean_no_other_shake_setting_on');assert(f.chat.at(-1).includes('WAIT_FOR_PREVIOUS_SHAKE_EXPIRY'));}f.advance(110);assert.equal(f.active,0);assert.equal(f.plays.length,timing===0?0:1);assert.equal(f.sets.length+f.clears,0);assert.equal(f.timers.size,0);
}
for(const kind of ['move','dimension','dead','mode','effects','multiplayer','milk','spawn','leave']){
 const f=fixture();f.request('start','clean_no_other_shake_setting_on');
 if(kind==='move')f.player.location.x+=1;
 if(kind==='dimension')f.player.dimension={...f.dimension,id:'minecraft:nether'};
 if(kind==='dead')f.player.health=0;
 if(kind==='mode')f.player.mode='survival';
 if(kind==='effects')f.player.effects=[{}];
 if(kind==='multiplayer')f.world.players.push({});
 if(kind==='milk')f.events.milk({itemStack:{typeId:'minecraft:milk_bucket'},source:f.player});
 if(kind==='spawn')f.events.spawn({player:f.player});
 if(kind==='leave')f.events.leave({playerId:f.player.id});
 f.advance(100);assert.equal(f.plays.length,0,kind);assert.equal(f.active,0,kind);assert.equal(f.clears,0,kind);
}
{
 const f=fixture();f.player.failPlay=true;f.request('start','clean_no_other_shake_setting_on');f.advance(25);assert.equal(f.plays.length,1);assert.equal(f.active,0);assert.equal(f.logs.find(r=>r.event==='end').accepted,false);assert.equal(f.clears,0);
}
{
 const f=fixture();f.request('start','clean_no_other_shake_setting_on');f.advance(20);f.player.rot={x:2,y:3};f.player.getViewDirection=()=>({x:.1,y:0,z:1});f.player.getBlockFromViewDirection=()=>({block:{typeId:'minecraft:stone',location:{x:1,y:64,z:2}},face:'North'});f.advance(80);const m=f.logs.find(r=>r.event==='end').metrics.during;assert.equal(m.maxYaw,3);assert.equal(m.maxPitch,2);assert.equal(m.maxViewDelta,.1);assert(m.rayChanges>0);
}
console.log('Single-event/phase/guard/telemetry API doubles passed; no native rendering claim');
"""
class ShakeProbe(unittest.TestCase):
 def data(self):return {p:(ROOT/p).read_bytes() for p in PATHS}
 def test_no_forbidden_mutation_and_syntax(self):
  p=ROOT/PATHS[1];subprocess.run(['node','--check',str(p)],check=True)
  self.assertNotRegex(p.read_text(),r'\.(?:setCamera|playAnimation|stopShaking|clear|setRotation|teleport|tryTeleport|setHudVisibility|setControlScheme|setPermissionCategory|addEffect|removeEffect|setDynamicProperty)\(')
 def test_lifecycle_and_telemetry(self):subprocess.run(['node','-e',NODE_TEST,str(ROOT/PATHS[1])],check=True)
 def test_identity_archive_and_provenance(self):
  data=self.data();commit='1'*40;f,r=files(data,commit);m=json.loads(f['manifest.json']);self.assertEqual(m['dependencies'],[{'module_name':'@minecraft/server','version':'2.10.0'}]);self.assertEqual(len({m['header']['uuid'],*[x['uuid']for x in m['modules']]}),3);self.assertFalse(r['copies_canonical_runtime']);self.assertFalse(r['safety']['global_stop']);self.assertIn(commit.encode(),f['scripts/main.js']);self.assertNotEqual(files(data,'2'*40)[1]['header_uuid'],r['header_uuid'])
  with tempfile.TemporaryDirectory()as tmp:
   a=build(ROOT,Path(tmp)/'a',commit,data);b=build(ROOT,Path(tmp)/'b',commit,data);self.assertEqual(a['pack_sha256'],b['pack_sha256'])
   with self.assertRaises(FileExistsError):build(ROOT,Path(tmp)/'a',commit,data)
   with zipfile.ZipFile(a['pack'])as z:
    self.assertIsNone(z.testzip());self.assertEqual(len(z.namelist()),5)
    for row in a['files']:self.assertEqual(hashlib.sha256(z.read(row['path'])).hexdigest(),row['sha256'])
  with self.assertRaises(ValueError):build(ROOT,ROOT/'runtime/new',commit,data)
if __name__=='__main__':unittest.main()
