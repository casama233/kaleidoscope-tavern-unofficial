/** Original Java sprites. Stable codes are transport data, never native effect aliases. */
const tavern=['ardent_heat','bloody_mary','grass_stealth','high_heels','long_reach','slightly_tipsy','tomb_raider','vision','xp_drain'];
const liquor=['beheading','boating_master','bonemeal_spreader','captain_gift','continuous_heal','double_damage','elbow_strike','frost_walker','ground_crit','hostile_detection','multi_jump','reverse_gravity','tequila','treasure_guide','treasure_sense'];
export const EFFECT_ICONS=Object.freeze([
 ...tavern.map(id=>({id:'kaleidoscope_tavern:'+id,texture:'textures/kaleidoscope_tavern_jar/mob_effect/'+id})),
 ...liquor.map(id=>({id:'kaleidoscope_world_liquor:'+id,texture:'textures/kaleidoscope_world_liquor/mob_effect/'+id}))
].map((row,index)=>Object.freeze({...row,code:index+1})));
