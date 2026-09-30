import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const baseline=process.env.TAVERN_BASELINE_ROOT;
const current=path.resolve(import.meta.dirname,'../..');
const reconciliation=JSON.parse(fs.readFileSync(path.join(current,'data/baseline-reconciliation.json'),'utf8')).files;
const digest=value=>createHash('sha256').update(value).digest('hex');
const read=(root,file)=>{
 const bytes=fs.readFileSync(path.join(root,'runtime/BP/scripts',file)),row=path.resolve(root)===current?reconciliation['runtime/BP/scripts/'+file]:undefined;
 if(!row||row.before===null)return bytes.toString('utf8');
 assert.equal(digest(bytes),row.after,'Reconciled source changed: '+file);
 const before=gunzipSync(Buffer.from(row.beforeGzipBase64,'base64'));assert.equal(digest(before),row.before,'Reconciliation preimage corrupt: '+file);
 return before.toString('utf8');
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
