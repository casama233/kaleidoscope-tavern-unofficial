import assert from 'node:assert/strict';
import test from 'node:test';
import {signaturePayload} from '../runtime/BP/scripts/core/mixology.js';
import {SHAKER_HUD_COLORS} from '../runtime/BP/scripts/core/shaker-hud.js';
import {signaturePaletteIndex} from '../runtime/BP/scripts/data/signature-palette.js';

const slot=(color,colorIgnored=false)=>({item:'minecraft:sugar',container:null,color,colorIgnored,effects:[]});
const average=colors=>colors.length?[16,8,0].reduce((out,shift)=>out|(Math.floor(colors.reduce((sum,color)=>sum+(color>>shift&255),0)/colors.length)<<shift),0):0xffffff;

test('all 4096 three-color Java inputs retain exact integer mean and atlas entry',()=>{
 for(const a of SHAKER_HUD_COLORS)for(const b of SHAKER_HUD_COLORS)for(const c of SHAKER_HUD_COLORS){
  const payload=signaturePayload([slot(a),slot(b),slot(c)]);
  assert.equal(payload.color,average([a,b,c]));
  assert(signaturePaletteIndex(payload.color)>=0);
 }
});

test('RESET snapshots are excluded, including all-RESET white default',()=>{
 for(let ignored=0;ignored<=3;ignored++){
  const colors=[0x000000,0xaa0000,0x00aaaa];
  const payload=signaturePayload(colors.map((color,index)=>slot(color,index<ignored)));
  assert.equal(payload.color,average(colors.slice(ignored)));
 }
});

test('arbitrary addon RGB remains exact without nearest-palette quantization',()=>{
 const colors=[0x123456,0x237fab,0x8fcfed];
 const payload=signaturePayload(colors.map(color=>slot(color)));
 assert.equal(payload.color,average(colors));
 assert.equal(signaturePaletteIndex(payload.color),-1);
 assert.deepEqual(payload.ingredients,['minecraft:sugar','minecraft:sugar','minecraft:sugar']);
});
