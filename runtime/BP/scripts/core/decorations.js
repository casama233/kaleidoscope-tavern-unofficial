import {check} from './util.js';
export const NS='kaleidoscope_tavern';
export const INCENSE=Object.freeze({
 sakura_incense:{small:'kt_assets_a17:sakura_incense',large:'kt_assets_a17:sakura_incense'},
 pine_incense:{small:'kt_assets_a17:pine_incense',large:'kt_assets_a17:pine_incense_large'},
 ginkgo_incense:{small:'kt_assets_a17:ginkgo_incense',large:'kt_assets_a17:ginkgo_incense_large'},
 spore_incense:{small:'kt_assets_a17:spore_incense',large:'kt_assets_a17:spore_incense'},
 catnip_incense:{small:'kt_assets_a17:catnip_incense',large:'kt_assets_a17:catnip_incense_large'},
 snow_incense:{small:'kt_assets_a17:snow_incense',large:'kt_assets_a17:snow_incense_large'},
 butterfly_incense:{small:'kt_assets_a17:butterfly_incense',large:'kt_assets_a17:butterfly_incense_large'},
 firefly_incense:{small:'kt_assets_a17:firefly_incense',large:'kt_assets_a17:firefly_incense_large'}
});
export const STEPLADDER=NS+':stepladder',LADDER_HALF=NS+':half',LADDER_FACING=NS+':facing',LADDER_WATERLOGGED=NS+':waterlogged',LADDER_COLLISION_PROFILE=NS+':collision_profile';
export function isIncense(id){return typeof id==='string'&&Object.hasOwn(INCENSE,id.startsWith(NS+':')?id.slice(NS.length+1):id);}
export function isStepladder(id){return id===STEPLADDER;}
export function ladderBase(pos,half){check(pos&&Number.isInteger(pos.x)&&Number.isInteger(pos.y)&&Number.isInteger(pos.z),'INVALID_LOCATION');check(half===0||half===1,'INVALID_LADDER_HALF');return {x:pos.x,y:pos.y-half,z:pos.z};}
export function ladderPair(base,facing,waterBottom,waterTop){check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_LADDER_FACING');return [{...base,states:{[LADDER_HALF]:0,[LADDER_FACING]:facing,[LADDER_WATERLOGGED]:!!waterBottom,[LADDER_COLLISION_PROFILE]:facing}},{x:base.x,y:base.y+1,z:base.z,states:{[LADDER_HALF]:1,[LADDER_FACING]:facing,[LADDER_WATERLOGGED]:!!waterTop,[LADDER_COLLISION_PROFILE]:facing+4}}];}
export function incenseDamageDue(tick){return Number.isInteger(tick)&&tick>0&&tick%120===0;}

/** null means keep a manual override; never coerce a missing/invalid event to power-off. */
export function incensePowerTransition(current,previous){
 if(!Number.isFinite(current)||!Number.isFinite(previous)||current<0||previous<0||current>15||previous>15)return null;
 return (current>0)===(previous>0)?null:current>0;
}
