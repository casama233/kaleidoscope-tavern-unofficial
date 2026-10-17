/** Shared names for native ingredients and corrected Tavern guide terminology. */
const ROWS={
 'minecraft:water_bucket':['水桶','水桶','Water Bucket'],
 'minecraft:lava_bucket':['熔岩桶','熔岩桶','Lava Bucket'],
 'minecraft:milk_bucket':['牛奶桶','牛奶桶','Milk Bucket'],
 'minecraft:bucket':['桶','桶','Bucket'],
 'minecraft:ink_sac':['墨囊','墨囊','Ink Sac'],
 'minecraft:blue_dye':['蓝色染料','藍色染料','Blue Dye'],
 'minecraft:slime_ball':['黏液球','史萊姆球','Slimeball'],
 'minecraft:cookie':['曲奇','餅乾','Cookie'],
 'minecraft:glow_berries':['荧光莓','螢光莓','Glow Berries'],
 'minecraft:allium':['绒球葱','紫紅球花','Allium'],
 'minecraft:pitcher_plant':['猪笼草','豬籠草','Pitcher Plant'],
 'kaleidoscope_tavern:pressing_tub':['压榨桶','壓榨桶','Pressing Tub'],
 'kaleidoscope_tavern:empty_glassware':['空鸡尾酒杯','空雞尾酒杯','Empty Glassware'],
 'kaleidoscope_tavern:gold_grape_juice':['金葡萄汁','金葡萄汁','Gold Grape Juice'],
 'kaleidoscope_tavern:gold_grape_bucket':['金葡萄汁桶','金葡萄汁桶','Gold Grape Juice Bucket'],
 'kaleidoscope_tavern:green_grape_juice':['青提汁','青提汁','Green Grape Juice'],
 'kaleidoscope_tavern:green_grape_bucket':['青提汁桶','青提汁桶','Green Grape Juice Bucket'],
 'kaleidoscope_tavern:sweet_berries_juice':['甜莓汁','甜莓汁','Sweet Berry Juice'],
 'kaleidoscope_tavern:sweet_berries_bucket':['甜莓汁桶','甜莓汁桶','Sweet Berry Juice Bucket'],
 'kaleidoscope_tavern:glow_berries_juice':['荧光莓汁','螢光莓汁','Glow Berry Juice'],
 'kaleidoscope_tavern:glow_berries_bucket':['荧光莓汁桶','螢光莓汁桶','Glow Berry Juice Bucket']
};
export const GUIDE_NATIVE_NAMES=Object.fromEntries(['zh_CN','zh_TW','en_US'].map((locale,i)=>[locale,Object.fromEntries(Object.entries(ROWS).map(([id,names])=>[id,names[i]]))]));
export const guideItemName=(payload,locale,id)=>payload.names?.[locale]?.[id]??payload.names?.en_US?.[id]??String(id??'').split(':').at(-1).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
