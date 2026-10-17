import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const baseline=process.env.TAVERN_BASELINE_ROOT;
const current=path.resolve(import.meta.dirname,'../..');
// The canonical projection validates the complete append-only functional chain
// before the original preservation assertions. Do not silently ignore newer
// reviewed deltas, or rewrite the original hashes to make a new feature pass.
const projectionFiles=['bedrock/stateful-storage-router.js','core/cellar-cabinet.js','core/circular-rack.js','core/aim-hit.js','core/java-ambient-sampling.js','bedrock/decorations.js','bedrock/machines.js','bedrock/tipsy-visual.js','bedrock/board-text.js','bedrock/cellar-cabinet.js','bedrock/circular-rack.js'];
let projected;
const read=(root,file)=>{
 if(path.resolve(root)!==current)return fs.readFileSync(path.join(root,'runtime/BP/scripts',file),'utf8');
 projected??=JSON.parse(execFileSync(process.env.PYTHON??'python3',['-c',
  "import json,sys;from pathlib import Path;sys.path.insert(0,'tools');from baseline_reference import previous_bytes;r=Path.cwd();print(json.dumps({p:previous_bytes(r,r/'runtime/BP/scripts'/p).decode() for p in json.loads(sys.argv[1])}))",
  JSON.stringify(projectionFiles)],{cwd:current,encoding:'utf8',maxBuffer:4*1024*1024}));
 assert.ok(Object.hasOwn(projected,file),'Missing projected preservation input: '+file);
 return projected[file];
};
test('aim resolution and all transaction/redstone routing remain byte-identical',{skip:!baseline},()=>{
 const old=read(baseline,'bedrock/stateful-storage-router.js'),now=read(current,'bedrock/stateful-storage-router.js');
 assert.equal(now.slice(0,now.indexOf('export {tickStorageVisuals}')),old.slice(0,old.indexOf('export function tickStorageVisuals(')));
 assert.equal(now.slice(now.indexOf('function rngValue')),old.slice(old.indexOf('function rngValue')));
});
test('pose/slot math, sampler, incense, barrel and tipsy modules remain byte-identical',{skip:!baseline},()=>{
 for(const file of ['core/cellar-cabinet.js','core/circular-rack.js','core/aim-hit.js','core/java-ambient-sampling.js','bedrock/decorations.js','bedrock/machines.js','bedrock/tipsy-visual.js'])assert.equal(read(current,file),read(baseline,file),file);
});
test('board frame and layout equations remain byte-identical',{skip:!baseline},()=>{
 const old=read(baseline,'bedrock/board-text.js'),now=read(current,'bedrock/board-text.js');
 assert.equal(now.slice(now.indexOf('function frame('),now.indexOf('function buildLayout(')),old.slice(old.indexOf('function frame('),old.indexOf('export function renderBoardText(')));
 assert.equal(now.slice(now.indexOf(' const f=frame(info)'),now.indexOf(' return {f,color,expected};')),old.slice(old.indexOf(' const f=frame(info)'),old.indexOf(' const existing=helpers(')));
});
test('cabinet/rack inventory transaction bodies remain byte-identical',{skip:!baseline},()=>{
 for(const file of ['cellar-cabinet.js','circular-rack.js']){
  const old=read(baseline,'bedrock/'+file),now=read(current,'bedrock/'+file);
  for(const line of old.split('\n'))if(/^(function transact|export function (place|use|put|take|recover))/.test(line))assert.ok(now.split('\n').includes(line),file+': '+line.slice(0,90));
 }
});
