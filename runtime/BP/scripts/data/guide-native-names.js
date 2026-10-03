/** Native ingredients missing from the shared guide's original name table. */
const ROWS={
 'minecraft:water_bucket':['水桶','水桶','Water Bucket'],
 'minecraft:lava_bucket':['熔岩桶','熔岩桶','Lava Bucket'],
 'minecraft:milk_bucket':['牛奶桶','牛奶桶','Milk Bucket'],
 'minecraft:bucket':['桶','桶','Bucket'],
 'minecraft:ink_sac':['墨囊','墨囊','Ink Sac'],
 'minecraft:blue_dye':['蓝色染料','藍色染料','Blue Dye'],
 'minecraft:slime_ball':['黏液球','史萊姆球','Slimeball'],
 'minecraft:cookie':['曲奇','餅乾','Cookie']
};
export const GUIDE_NATIVE_NAMES=Object.fromEntries(['zh_CN','zh_TW','en_US'].map((locale,i)=>[locale,Object.fromEntries(Object.entries(ROWS).map(([id,names])=>[id,names[i]]))]));
export const guideItemName=(payload,locale,id)=>payload.names?.[locale]?.[id]??payload.names?.en_US?.[id]??String(id??'').split(':').at(-1).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
