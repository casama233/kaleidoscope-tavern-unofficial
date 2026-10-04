import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {effectIconPrefixExpression,matchesEffectIconPrefix} from './effect-icon-ui-prefix.mjs';
import {EFFECT_ICON_PREFIX as P,effectIconToken} from '../runtime/BP/scripts/core/effect-icons.js';

test('Non-ASCII reserved marker cannot use JS length as native precision',()=>{
 assert.equal(P.length,12);assert.equal(Buffer.byteLength(P,'utf8'),18);
 assert.notEqual(Buffer.from(P).subarray(0,P.length).toString('utf8'),P);
 assert(!effectIconPrefixExpression().includes('%.'));
});
test('Strict reconstruction admits snapshots and rejects ordinary or repeated markers',()=>{
 const token=effectIconToken(0,2);
 const cases=[[P,true],[P+token,true],['',false],['ordinary title',false],
  ['ordinary '+P+token,false],[token+P,false],[P.slice(0,-1),false],
  [P+P,false],[P+token+P,false],['title '+token,false]];
 for(const remove of [(s,p)=>s.replace(p,''),(s,p)=>s.split(p).join('')])
  for(const [value,expected] of cases)assert.equal(matchesEffectIconPrefix(value,remove),expected,value);
});
test('Authored host cache uses strict prefix and retains snapshots across foreign titles',()=>{
 const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url),'utf8'));
 const data=hud.kt_effect_icons.controls[0].kt_effect_data;
 assert.equal(data.bindings[1].source_property_name,effectIconPrefixExpression());
 assert.equal(data.bindings[1].target_property_name,'#visible');
 assert.equal(data.bindings[2].binding_condition,'always_when_visible');
 assert.equal(data.bindings[2].binding_name_override,'#kt_effect_packet');
});
