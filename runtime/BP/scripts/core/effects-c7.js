import {check,clone,integer} from './util.js';
export const C7_STATUS_KEY='kaleidoscope_tavern:c7_effects';
export const C7_EFFECTS=Object.freeze({
 'kaleidoscope_tavern:slightly_tipsy':'camera_shake_adapter',
 'kaleidoscope_tavern:high_heels':'step_assist_adapter',
 'kaleidoscope_tavern:grass_stealth':'invisibility_target_adapter',
 'kaleidoscope_tavern:vision':'glowing_scan',
 'kaleidoscope_tavern:ardent_heat':'front_stone_break_adapter',
 'kaleidoscope_tavern:tomb_raider':'disarm_rule',
 'kaleidoscope_tavern:upside_down':'grumm_instant'
});
export const C7_PENDING=Object.freeze({'kaleidoscope_tavern:long_reach':'no_stable_player_interaction_range_mutator'});
export const GRASS_STEALTH_PLANTS=new Set([
 'minecraft:short_grass','minecraft:tall_grass','minecraft:fern','minecraft:large_fern','minecraft:dead_bush','minecraft:nether_sprouts','minecraft:crimson_roots','minecraft:warped_roots','minecraft:lilac','minecraft:rose_bush','minecraft:peony','minecraft:pitcher_plant','minecraft:sugar_cane','minecraft:sweet_berry_bush','minecraft:sunflower'
]);
export const ARDENT_BREAKABLE=new Set([
 'minecraft:stone','minecraft:deepslate','minecraft:granite','minecraft:diorite','minecraft:andesite','minecraft:tuff','minecraft:calcite','minecraft:dripstone_block','minecraft:netherrack','minecraft:blackstone','minecraft:basalt','minecraft:smooth_basalt','minecraft:end_stone'
]);
export const TOMB_DISARMABLE=new Set([
 'minecraft:skeleton','minecraft:stray','minecraft:wither_skeleton','minecraft:zombie','minecraft:husk','minecraft:drowned','minecraft:zombie_villager','minecraft:zombified_piglin','minecraft:piglin','minecraft:piglin_brute','minecraft:vindicator','minecraft:pillager','minecraft:witch'
]);
export function emptyC7Status(){return {schema:1,entries:[]};}
export function validateC7Status(s){check(s&&s.schema===1&&Array.isArray(s.entries)&&s.entries.length<=32,'C7_EFFECT_SCHEMA');for(const e of s.entries){check(C7_EFFECTS[e.id],'C7_EFFECT_SCHEMA');integer(e.ticks,1,20000000);integer(e.amplifier,0,255);}return s;}
export function readC7Status(raw){if(raw===undefined)return emptyC7Status();check(typeof raw==='string','C7_EFFECT_SCHEMA');return validateC7Status(JSON.parse(raw));}
export function addC7Status(s,id,ticks,amplifier){validateC7Status(s);check(C7_EFFECTS[id],'C7_EFFECT_UNSUPPORTED');integer(ticks,1,20000000);integer(amplifier,0,255);const n=clone(s),old=n.entries.find(e=>e.id===id&&e.amplifier===amplifier);if(old)old.ticks=Math.max(old.ticks,ticks);else n.entries.push({id,ticks,amplifier});return validateC7Status(n);}
export function advanceC7Status(s,ticks){validateC7Status(s);integer(ticks,0,2147483647);return {schema:1,entries:s.entries.map(e=>({...e,ticks:e.ticks-ticks})).filter(e=>e.ticks>0)};}
export function c7Active(s,id){return s.entries.filter(e=>e.id===id).sort((a,b)=>b.amplifier-a.amplifier||b.ticks-a.ticks)[0];}
export function tipsyRoll(t){check(Number.isFinite(t),'INVALID_TIME');return Math.sin(t/19)*.6+Math.cos(t/13)*.3+Math.sin(t/9)*.1;}
export function visionRadius(amplifier){integer(amplifier,0,255);return Math.min(amplifier+1,3)*6;}
export function cardinalFromVector(v){const ax=Math.abs(v.x),az=Math.abs(v.z);if(ax>=az)return v.x>=0?{x:1,z:0}:{x:-1,z:0};return v.z>=0?{x:0,z:1}:{x:0,z:-1};}
export function ardentFront(playerPos,dir){const out=[];const d=cardinalFromVector(dir),center={x:Math.floor(playerPos.x)+d.x,y:Math.floor(playerPos.y),z:Math.floor(playerPos.z)+d.z};for(let dy=0;dy<=2;dy++)for(let side=-1;side<=1;side++)out.push({x:center.x+(d.z?side:0),y:center.y+dy,z:center.z+(d.x?side:0)});return out;}
export function tombRoll(r=.5){check(Number.isFinite(r)&&r>=0&&r<1,'INVALID_RNG');return r<.3;}
export function upsideRange(){return 16;}
