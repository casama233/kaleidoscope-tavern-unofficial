/** Explicit Minecraft 1.21.1 LivingEntity counterparts. Unknown IDs never mean
 * normal healing. Source entity_type/{inverted_healing_and_harm,undead,
 * skeletons,zombies}.json supplies inversion; Native families are not these tags.
 * This table does not assert Native health attributes/hurt pipeline equivalence.
 */
const normal=['allay','armadillo','armor_stand','axolotl','bat','bee','blaze','breeze','camel','cat','cave_spider','chicken','cod','cow','creeper','dolphin','donkey','elder_guardian','ender_dragon','enderman','endermite','evocation_illager','fox','frog','ghast','glow_squid','goat','guardian','hoglin','horse','iron_golem','llama','magma_cube','mooshroom','mule','ocelot','panda','parrot','pig','piglin','piglin_brute','pillager','player','polar_bear','pufferfish','rabbit','ravager','salmon','sheep','shulker','silverfish','slime','sniffer','snow_golem','spider','squid','strider','tadpole','trader_llama','tropicalfish','turtle','vex','villager','villager_v2','vindicator','wandering_trader','warden','witch','wolf'];
const inverted=['skeleton','stray','wither_skeleton','skeleton_horse','bogged','zombie_horse','zombie','zombie_villager','zombie_villager_v2','zombie_pigman','zoglin','drowned','husk','wither','phantom'];
const sourceAliases={evocation_illager:'evoker',tropicalfish:'tropical_fish',villager_v2:'villager',zombie_villager_v2:'zombie_villager',zombie_pigman:'zombified_piglin'};
// ArmorStand rejects this source damage type. EnderDragon routes hurt through
// its body/phase implementation; those source facts are not a generic hurt call.
export const VANILLA_INSTANT_ENTITIES=Object.freeze(Object.fromEntries([...normal.map(name=>[name,false]),...inverted.map(name=>[name,true])].map(([name,inverted])=>['minecraft:'+name,Object.freeze({sourceType:'minecraft:'+(sourceAliases[name]??name),living:true,inverted,healHook:Object.freeze({mode:'passthrough'}),damagePolicy:name==='armor_stand'?'reject':name==='ender_dragon'?'unknown':'native'})])));
