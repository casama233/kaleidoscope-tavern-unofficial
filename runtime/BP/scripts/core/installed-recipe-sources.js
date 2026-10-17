/** One native definition lookup after world startup; no optional hard dependency. */
export function installedBarrelRecipeSources(itemExists){
 return itemExists('kaleidoscope_world_liquor:absolut_vodka_q1')?['kaleidoscope_world_liquor']:[];
}
