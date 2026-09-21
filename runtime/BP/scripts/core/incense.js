import {check} from './util.js';
export const NS='kaleidoscope_tavern';
export const INCENSE_STYLES=Object.freeze(['sakura','pine','ginkgo','spore','catnip','snow','butterfly','firefly']);
export const OPEN=NS+':open',POWERED=NS+':powered';
export const INCENSE_TICK_STEP=3,INCENSE_DAMAGE_PERIOD=120,INCENSE_LARGE_PERIOD=6,INCENSE_RANGE=32;
const SPEC=Object.freeze({
 sakura:{small:'kt_assets_a17:sakura_incense',large:'kt_assets_a17:sakura_incense',sourceLarge:'minecraft:cherry_leaves',largeAdapter:'STYLE_PARTICLE_FALLBACK',yOffset:-2,yRange:16},
 pine:{small:'kt_assets_a17:pine_incense',large:'kt_assets_a17:pine_incense_large',sourceLarge:'kaleidoscope_tavern:pine_incense_large',largeAdapter:'SOURCE_CUSTOM',yOffset:-2,yRange:16},
 ginkgo:{small:'kt_assets_a17:ginkgo_incense',large:'kt_assets_a17:ginkgo_incense_large',sourceLarge:'kaleidoscope_tavern:ginkgo_incense_large',largeAdapter:'SOURCE_CUSTOM',yOffset:-2,yRange:16},
 spore:{small:'kt_assets_a17:spore_incense',large:'kt_assets_a17:spore_incense',sourceLarge:'minecraft:spore_blossom_air',largeAdapter:'STYLE_PARTICLE_FALLBACK',yOffset:-2,yRange:16},
 catnip:{small:'kt_assets_a17:catnip_incense',large:'kt_assets_a17:catnip_incense_large',sourceLarge:'kaleidoscope_tavern:catnip_incense_large',largeAdapter:'SOURCE_CUSTOM',yOffset:-2,yRange:16},
 snow:{small:'kt_assets_a17:snow_incense',large:'kt_assets_a17:snow_incense_large',sourceLarge:'kaleidoscope_tavern:snow_incense_large',largeAdapter:'SOURCE_CUSTOM',yOffset:-2,yRange:16},
 butterfly:{small:'kt_assets_a17:butterfly_incense',large:'kt_assets_a17:butterfly_incense_large',sourceLarge:'kaleidoscope_tavern:butterfly_incense_large',largeAdapter:'SOURCE_CUSTOM',yOffset:-2,yRange:16},
 firefly:{small:'kt_assets_a17:firefly_incense',large:'kt_assets_a17:firefly_incense_large',sourceLarge:'kaleidoscope_tavern:firefly_incense_large',largeAdapter:'SOURCE_CUSTOM',yOffset:-.67,yRange:5.33}
});
export function incenseStyle(id){if(typeof id!=='string'||!id.startsWith(NS+':'))return undefined;const short=id.slice(NS.length+1);return INCENSE_STYLES.find(x=>short===x+'_incense');}
export function incenseId(style){check(INCENSE_STYLES.includes(style),'UNKNOWN_INCENSE');return NS+':'+style+'_incense';}
export function incenseSpec(style){check(INCENSE_STYLES.includes(style),'UNKNOWN_INCENSE');return SPEC[style];}
function bit(v){check(v===0||v===1,'INVALID_INCENSE_STATE');return v;}
export function incenseRedstoneState(open,powered,signal){open=bit(open);powered=bit(powered);signal=bit(signal);if(powered===signal)return {changed:false,open,powered,sound:false};return {changed:true,open:signal,powered:signal,sound:open!==signal};}
export function incenseDue(tick,step,period){check(Number.isInteger(tick)&&tick>=0&&Number.isInteger(step)&&step>0&&Number.isInteger(period)&&period>0,'INVALID_INCENSE_TICK');if(tick<step)return false;return Math.floor(tick/period)!==Math.floor((tick-step)/period);}
export function incenseDamageDue(tick,step=INCENSE_TICK_STEP){return incenseDue(tick,step,INCENSE_DAMAGE_PERIOD);}
export function incenseLargeDue(tick,step=INCENSE_TICK_STEP){return incenseDue(tick,step,INCENSE_LARGE_PERIOD);}
function uniform(random){const v=random();check(Number.isFinite(v)&&v>=0&&v<=1,'INVALID_RANDOM');return v;}
function gaussian(random){let u=uniform(random),v=uniform(random);if(u<=0)u=Number.MIN_VALUE;return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
export function incenseSmallMotion(random=Math.random){return {x:gaussian(random)*.01,y:.02+uniform(random)*.01,z:gaussian(random)*.01};}
export function incenseLargePoint(style,pos,random=Math.random){const spec=incenseSpec(style);check(pos&&[pos.x,pos.y,pos.z].every(Number.isFinite),'INVALID_LOCATION');return {x:pos.x+.5+(uniform(random)-.5)*32,y:pos.y+.5+spec.yOffset+uniform(random)*spec.yRange,z:pos.z+.5+(uniform(random)-.5)*32};}
export function incenseQuery(pos){check(pos&&[pos.x,pos.y,pos.z].every(Number.isFinite),'INVALID_LOCATION');return {location:{x:pos.x-32,y:pos.y-32,z:pos.z-32},volume:{x:65,y:65,z:65},families:['undead']};}
