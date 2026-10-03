/** Read-only presentation of the shared recipe records; no crafting-grid inference. */
const TEXT={
 zh_TW:{liquid:'釀造液體',buckets:'桶',materials:'材料',empty:'不需額外材料',slots:'雪克杯材料',slot:'槽位',result:'成品',carrier:'裝瓶／盛裝容器',operation:'操作方法',aging:'熟成',seconds:'秒',base:'熟成基礎時間',maximum:'最高品質',barrel:['打開酒桶蓋，加入所列液體與材料。','關上桶蓋開始釀造；以所列空容器取出成品。'],quality:'關蓋後先得到品質 1；保持關蓋可繼續熟成，下一品質所需時間為基礎時間乘目前品質。',shaker:['每個槽位各放一份符合條件的材料。','按住使用搖酒，在配方時機鬆手，再倒入已擺放的空容器。'],press:['將材料放入壓榨桶，跳躍壓榨至液體滿一桶。','使用空桶收集果汁。']},
 zh_CN:{liquid:'酿造液体',buckets:'桶',materials:'材料',empty:'不需额外材料',slots:'雪克杯材料',slot:'槽位',result:'成品',carrier:'装瓶／盛装容器',operation:'操作方法',aging:'熟成',seconds:'秒',base:'熟成基础时间',maximum:'最高品质',barrel:['打开酒桶盖，加入所列液体与材料。','关上桶盖开始酿造；以所列空容器取出成品。'],quality:'关盖后先得到品质 1；保持关盖可继续熟成，下一品质所需时间为基础时间乘当前品质。',shaker:['每个槽位各放一份符合条件的材料。','按住使用摇酒，在配方时机松手，再倒入已摆放的空容器。'],press:['将材料放入压榨桶，跳跃压榨至液体满一桶。','使用空桶收集果汁。']},
 en_US:{liquid:'Brewing liquid',buckets:'buckets',materials:'Ingredients',empty:'No additional ingredients',slots:'Shaker ingredients',slot:'Slot',result:'Result',carrier:'Bottling / serving container',operation:'How to prepare',aging:'Aging',seconds:'s',base:'Aging base time',maximum:'Maximum quality',barrel:['Open the barrel lid and add the listed liquid and ingredients.','Close the lid to brew; collect the result with the listed empty container.'],quality:'Closing the lid first produces Quality 1. Keep it closed to age; each next stage takes the base time multiplied by the current quality.',shaker:['Add one matching ingredient to each slot.','Hold use to shake, release at the recipe timing, then pour into a placed empty container.'],press:['Add the ingredients to the pressing tub and jump to press a full bucket of juice.','Use an empty bucket to collect the juice.']}
};
export function preparationText(recipe,locale,name){
 const t=TEXT[locale]??TEXT.en_US,p=recipe.preparation,sections=[],heading=(label,rows)=>'§l§6'+label+'§r\n'+rows.join('\n');
 let ingredients=recipe.ingredients??[];
 if(p?.kind==='barrel'&&p.amount===4000&&ingredients.slice(0,4).length===4&&ingredients.slice(0,4).every(id=>id===p.fluidItem)){
  sections.push(heading(t.liquid,[name(p.fluid)+' — '+p.amount+' mB ('+p.amount/1000+' '+t.buckets+')',name(p.fluidItem)+' ×'+p.amount/1000]));
  ingredients=ingredients.slice(4);
 }
 const rows=[];
 if(recipe.method==='Shaker')ingredients.forEach((id,i)=>rows.push(t.slot+' '+(i+1)+': '+name(id)));
 else{
  const counts=new Map();for(const id of ingredients)counts.set(id,(counts.get(id)??0)+1);
  for(const [id,count] of counts)rows.push('• '+name(id)+' ×'+count);
 }
 sections.push(heading(recipe.method==='Shaker'?t.slots:t.materials,rows.length?rows:[t.empty]));
 if(p?.carrier)sections.push(heading(t.carrier,[name(p.carrier)]));
 if(p?.kind==='barrel'){
  sections.push(heading(t.operation,t.barrel.map((line,i)=>(i+1)+'. '+line)));
  if(p.qualities>1&&Number.isFinite(p.unitTime)&&p.unitTime>0)sections.push(heading(t.aging,[t.quality,t.base+': '+p.unitTime/20+' '+t.seconds,t.maximum+': '+p.qualities]));
 }else if(p?.kind==='shaker')sections.push(heading(t.operation,t.shaker.map((line,i)=>(i+1)+'. '+line)));
 else if(p?.kind==='pressing')sections.push(heading(t.operation,t.press.map((line,i)=>(i+1)+'. '+line)));
 return {sections,heading};
}

/** Notes for the optional host's existing entry renderer. Recipes retain their
 * own ingredient cards; machine semantics are shared with the standalone view. */
export function preparationNotes(recipe,locale,name){
 if(!recipe.preparation)return [];
 const {sections}=preparationText(recipe,locale,name),t=TEXT[locale]??TEXT.en_US;
 return sections.filter(section=>!section.startsWith('§l§6'+t.materials+'§r')&&!section.startsWith('§l§6'+t.slots+'§r'));
}
