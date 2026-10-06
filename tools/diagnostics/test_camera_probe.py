"""Focused structural/API-double checks only. No native client or rendered-camera claim."""
import hashlib, json, os, re, subprocess, tempfile, unittest, zipfile
from pathlib import Path
from unittest.mock import patch
from build_camera_probe import PATHS,FROZEN_RUNTIME_TREE,committed_inputs,make_files,write_pack,output_guard
HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('TAVERN_PROBE_ROOT',HERE.parents[1]))
COMMIT='3080c5a5618fb65485cb8f082d8096f75a709826'
NODE_TEST=r"""
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(process.argv[1],'utf8').replace(/^import .*\n/m,'');
function fixture(){
 let next=1, clearCount=0, writes=0;const timers=new Map(),logs=[],chat=[],sets=[],plays=[],blocks=new Map(),events={};
 function signal(name){return {subscribe(fn){events[name]=fn;}};}
 const system={currentTick:0,afterEvents:{scriptEventReceive:signal('request')},runInterval(fn,every){const id=next++;timers.set(id,{fn,every,next:system.currentTick+every});return id;},runTimeout(fn,delay){const id=next++;timers.set(id,{fn,at:system.currentTick+delay});return id;},clearRun(id){timers.delete(id);}};
 const dimension={id:'minecraft:overworld',getBlock(location){const key=[location.x,location.y,location.z].join(',');if(!blocks.has(key))blocks.set(key,{typeId:'minecraft:air',location:{...location},get isAir(){return this.typeId==='minecraft:air';},setType(id){this.typeId=id;writes++;if(dimension.failAt===writes)throw Error('setType failed after write fixture');}});return blocks.get(key);}};
 const player={id:'self-display-handle',typeId:'minecraft:player',isValid:true,mode:'creative',health:20,effects:[],location:{x:.5,y:64,z:.5},dimension,rot:{x:0,y:0},getGameMode(){return this.mode;},getEffects(){return this.effects;},getComponent(){return {currentValue:this.health};},getHeadLocation(){return {...this.location,y:this.location.y+1.62};},getRotation(){return this.rot;},getViewDirection(){return {x:0,y:0,z:1};},getBlockFromViewDirection(){return null;},sendMessage(s){chat.push(s);},camera:{setCamera(...args){sets.push(args);},playAnimation(...args){plays.push(args);if(player.failPlay)throw Error('native camera restriction fixture');},clear(){clearCount++;}}};
 const world={players:[player],getAllPlayers(){return this.players;},afterEvents:{playerLeave:signal('leave'),playerSpawn:signal('spawn'),itemCompleteUse:signal('milk')}};
 const context=vm.createContext({world,system,LinearSpline:class{},EasingType:{Linear:'Linear'},GameMode:{Creative:'creative'},console:{info(s){logs.push(JSON.parse(s.slice(s.indexOf('{'))));}}});vm.runInContext(source,context);
 function request(id,message=''){events.request({id:'kt_camera_probe:'+id,message,sourceEntity:player});}
 function advance(n){for(let i=0;i<n;i++){system.currentTick++;for(const[id,t]of [...timers]){if(!timers.has(id))continue;if(t.at!==undefined&&system.currentTick>=t.at){timers.delete(id);t.fn();}else if(t.every&&system.currentTick>=t.next){t.next+=t.every;t.fn();}}}}
 return {player,world,system,dimension,blocks,logs,chat,sets,plays,events,request,advance,timers,get clears(){return clearCount;},get writes(){return writes;},get active(){return vm.runInContext('sessions.size',context);}};
}
{
 const f=fixture();assert.equal(f.sets.length+f.plays.length+f.clears,0);assert.equal(f.timers.size,0);f.request('abort');assert.equal(f.clears,0);
 f.request('run','normal_plus');assert.equal(f.plays.length,0);
 f.player.effects=[{}];f.request('run','normal_plus clean_no_other_camera');assert.equal(f.plays.length,0);f.player.effects=[];
 f.world.players.push({});f.request('run','normal_plus clean_no_other_camera');assert.equal(f.plays.length,0);
}
{
 const f=fixture();f.request('run','normal_plus clean_no_other_camera');assert.equal(f.sets.length,0);assert.equal(f.plays.length,1);assert.equal(f.plays[0][1].animation.rotationKeyFrames.at(-1).rotation.z,8);assert.deepEqual(f.player.rot,{x:0,y:0});f.advance(410);assert.equal(f.active,0);assert.equal(f.clears,1);assert(f.logs.filter(r=>r.event==='sample').length<=110);assert.equal(f.timers.size,0);
}
{
 const f=fixture();f.player.failPlay=true;f.request('run','normal_plus clean_no_other_camera');assert.equal(f.sets.length,0);assert.equal(f.active,0);assert.equal(f.clears,1);assert(f.logs.some(r=>r.event==='end'&&r.reason==='API_ERROR'));assert.equal(f.timers.size,0);
}
{
 const f=fixture();f.request('run','free_plus clean_no_other_camera');assert.equal(f.sets.length,1);assert.equal(f.plays.length,0);f.request('abort');f.advance(4);assert.equal(f.plays.length,0);assert.equal(f.clears,1);assert.equal(f.active,0);
}
{
 const f=fixture();f.request('run','free_minus clean_no_other_camera');f.advance(2);assert.equal(f.plays.length,1);const options=f.plays[0][1];assert.equal(options.animation.rotationKeyFrames.at(-1).rotation.z,-8);assert(options.animation.progressKeyFrames.every(k=>k.alpha===0));assert.equal(f.plays[0][0].controlPoints.length,2);f.advance(405);assert.equal(f.clears,1);assert.equal(f.active,0);
}
for(const kind of ['milk','dimension','move','dead','spawn','leave','multiplayer','mode','effects']){
 const f=fixture();f.request('run','free_zero clean_no_other_camera');f.advance(2);
 if(kind==='milk')f.events.milk({itemStack:{typeId:'minecraft:milk_bucket'},source:f.player});
 if(kind==='dimension')f.player.dimension={...f.player.dimension,id:'minecraft:nether'};
 if(kind==='move')f.player.location.x+=1;
 if(kind==='dead')f.player.health=0;
 if(kind==='spawn')f.events.spawn({player:f.player});
 if(kind==='leave')f.events.leave({playerId:f.player.id});
 if(kind==='multiplayer')f.world.players.push({});
 if(kind==='mode')f.player.mode='survival';
 if(kind==='effects')f.player.effects=[{}];
 f.advance(1);assert.equal(f.active,0,kind);assert.equal(f.clears,1,kind);assert.equal(f.timers.size,0,kind);
}
{
 const f=fixture();f.dimension.getBlock({x:0,y:68,z:7}).typeId='minecraft:stone';f.request('scene','build');assert.equal(f.writes,0);assert(f.logs.some(r=>r.error?.includes('SCENE_REQUIRES')));
}
{
 const f=fixture();f.request('scene','build');assert.equal(f.writes,77);assert.equal(f.sets.length+f.plays.length,0);f.dimension.getBlock({x:0,y:68,z:7}).typeId='minecraft:diamond_block';f.request('scene','clear');const row=f.logs.find(r=>r.event==='scene_cleared');assert.equal(row.cleared,76);assert.equal(row.kept,1);assert.equal(f.dimension.getBlock({x:0,y:68,z:7}).typeId,'minecraft:diamond_block');
}
{
 const f=fixture();f.dimension.failAt=4;f.request('scene','build');assert(f.logs.some(r=>r.error?.includes('setType failed')));assert([...f.blocks.values()].every(b=>b.typeId==='minecraft:air'));assert.equal(f.sets.length+f.plays.length,0);
}
{
 const f=fixture();f.request('run','free_wave clean_no_other_camera');f.advance(2);const o=f.plays[0][1];assert.equal(o.totalTimeSeconds,8);assert.equal(o.animation.rotationKeyFrames.length,161);assert(o.animation.rotationKeyFrames.every(k=>Math.abs(k.rotation.z)<=1));f.advance(165);assert.equal(f.active,0);assert.equal(f.clears,1);
}
console.log('API-double cases passed; no native/rendered proof');
"""
class CameraProbe(unittest.TestCase):
 def inputs(self):return {PATHS[0]:(HERE/'build_camera_probe.py').read_bytes(),PATHS[1]:(HERE/'camera-probe.js').read_bytes(),PATHS[2]:(HERE/'CAMERA-PROBE.md').read_bytes(),PATHS[3]:(ROOT/'LICENSE-CODE').read_bytes()}
 def test_script_syntax_and_no_production_or_permission_setters(self):
  script=HERE/'camera-probe.js';subprocess.run(['node','--check',str(script)],check=True)
  text=script.read_text();self.assertNotRegex(text,r'\.(?:setRotation|teleport|tryTeleport|setDynamicProperty|getDynamicProperty|setPermissionCategory|setHudVisibility|addEffect|removeEffect)\(');self.assertNotIn('SimulatedPlayer',text)
 def test_bounded_camera_lifecycle_and_scene_api_doubles(self):
  subprocess.run(['node','-e',NODE_TEST,str(HERE/'camera-probe.js')],check=True)
 def test_standalone_stable_manifest_and_no_canonical_copy(self):
  files,p=make_files(self.inputs(),COMMIT);m=json.loads(files['manifest.json']);self.assertEqual(m['dependencies'],[{'module_name':'@minecraft/server','version':'2.7.0'}]);self.assertEqual({v['type'] for v in m['modules']},{'data','script'});self.assertEqual(len({m['header']['uuid'],*[v['uuid'] for v in m['modules']]}),3);self.assertFalse(p['copies_canonical_bp']);self.assertFalse(p['parity_verified']);self.assertEqual(set(files),{'manifest.json','scripts/main.js','probe_schema.json','diagnostic_provenance.json','CAMERA-PROBE.md','LICENSE-CODE'});self.assertIn(COMMIT.encode(),files['scripts/main.js']);self.assertNotIn(b'__PROBE_SOURCE_COMMIT__',files['scripts/main.js'])
 def test_source_and_asset_identity_change(self):
  inputs=self.inputs();_,a=make_files(inputs,COMMIT);changed=dict(inputs);changed[PATHS[3]]+=b'\n';_,b=make_files(changed,COMMIT);self.assertNotEqual(a['header_uuid'],b['header_uuid'])
 def test_reproducible_archive_and_exact_readback(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);a=write_pack(self.inputs(),COMMIT,root/'a');b=write_pack(self.inputs(),COMMIT,root/'b');self.assertEqual(a['pack_sha256'],b['pack_sha256'])
   with self.assertRaises(FileExistsError):write_pack(self.inputs(),COMMIT,root/'a')
   with zipfile.ZipFile(a['pack']) as z:
    self.assertIsNone(z.testzip())
    for row in a['files']:self.assertEqual(hashlib.sha256(z.read(row['path'])).hexdigest(),row['sha256'])
 def test_output_guard_rejects_repo_runtime_and_symlinked_descendants(self):
  with tempfile.TemporaryDirectory() as tmp:
   parent=Path(tmp);root=parent/'repo';(root/'runtime').mkdir(parents=True);outside=parent/'outside';outside.mkdir()
   self.assertEqual(output_guard(root,outside),outside.resolve())
   for path in [root,root/'runtime',root/'runtime/BP/new-output',root/'tools/output']:
    with self.assertRaisesRegex(ValueError,'outside the frozen'):output_guard(root,path)
    with self.assertRaisesRegex(ValueError,'outside the frozen'):write_pack(self.inputs(),COMMIT,path,root)
   alias=outside/'alias';alias.symlink_to(root/'runtime',target_is_directory=True)
   with self.assertRaisesRegex(ValueError,'outside the frozen'):output_guard(root,alias/'new-output')
 def test_git_first_guard_enforces_frozen_runtime_and_all_committed_inputs(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);inputs=self.inputs()
   for path,data in inputs.items():(root/path).parent.mkdir(parents=True,exist_ok=True);(root/path).write_bytes(data)
   def git(args,**kwargs):return FROZEN_RUNTIME_TREE+'\n' if args[1]=='rev-parse' else inputs[args[2].split(':',1)[1]]
   with patch('build_camera_probe.subprocess.check_output',side_effect=git):
    self.assertEqual(committed_inputs(root,COMMIT,root/PATHS[0]),inputs)
    with self.assertRaisesRegex(ValueError,'committed tools'):committed_inputs(root,COMMIT,root/'outside.py')
    for path in PATHS:
     (root/path).write_bytes(b'dirty')
     with self.assertRaisesRegex(ValueError,'Uncommitted diagnostic input'):committed_inputs(root,COMMIT,root/PATHS[0])
     (root/path).write_bytes(inputs[path])
   with patch('build_camera_probe.subprocess.check_output',return_value='bad-tree\n'):
    with self.assertRaisesRegex(ValueError,'Frozen109 runtime'):committed_inputs(root,COMMIT,root/PATHS[0])
if __name__=='__main__':unittest.main()
