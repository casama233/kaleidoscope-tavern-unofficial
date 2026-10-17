/** Native-definition reader contract only; no world or player substitutions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {cacheNativeItemDefinitionExists} from '../runtime/BP/scripts/core/util.js';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';

test('successful native definitions are reused while unknown reads remain retryable',()=>{
 const reads=new Map();let available=false;
 const exists=cacheNativeItemDefinitionExists(id=>{
  reads.set(id,(reads.get(id)??0)+1);
  return id==='known:item'||available?{id}:undefined;
 });
 assert.equal(exists('known:item'),true);assert.equal(exists('known:item'),true);
 assert.equal(reads.get('known:item'),1);
 assert.equal(exists('later:item'),false);assert.equal(exists('later:item'),false);
 assert.equal(reads.get('later:item'),2);
 available=true;assert.equal(exists('later:item'),true);assert.equal(exists('later:item'),true);
 assert.equal(reads.get('later:item'),3);
});

test('native lookup errors propagate unchanged and do not poison the next read',()=>{
 const failure=new Error('definition metadata unavailable');let calls=0;
 const exists=cacheNativeItemDefinitionExists(()=>{if(++calls===1)throw failure;return {};});
 assert.throws(()=>exists('probe:item'),error=>error===failure);
 assert.equal(exists('probe:item'),true);assert.equal(exists('probe:item'),true);assert.equal(calls,2);
});

test('generic registry item predicates retain their dynamic calls',()=>{
 let calls=0;
 const registry=new ExtensionRegistry({itemExists:()=>++calls%2===1});
 assert.equal(registry.acceptsShakerInput('probe:item'),false);
 assert.equal(registry.acceptsShakerInput('probe:item'),false);
 assert.equal(calls,2,'the native wrapper is explicitly selected by main, never applied to generic predicates');
});
