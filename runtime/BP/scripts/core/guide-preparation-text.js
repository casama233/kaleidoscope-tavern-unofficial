/** Read-only presentation of the shared recipe records; no crafting-grid inference. */
const TEXT={
 zh_TW:{liquid:'釀造液體',buckets:'桶',materials:'材料',empty:'不需額外材料',slots:'雪克杯材料',slot:'槽位',result:'成品',carrier:'裝瓶／盛裝容器',operation:'操作方法',aging:'熟成',seconds:'秒',base:'熟成基礎時間',maximum:'最高品質',barrel:['打開酒桶蓋，加入所列液體與材料。','關上桶蓋開始釀造；以所列空容器取出成品。'],quality:'關蓋後先得到品質 1；保持關蓋可繼續熟成，下一品質所需時間為基礎時間乘目前品質。',shaker:['每個槽位各放一份符合條件的材料。','按住使用搖酒，在配方時機鬆手，再倒入已擺放的空容器。'],press:['將材料放入壓榨桶，跳躍壓榨至液體滿一桶。','使用空桶收集果汁。']},
 zh_CN:{liquid:'酿造液体',buckets:'桶',materials:'材料',empty:'不需额外材料',slots:'雪克杯材料',slot:'槽位',result:'成品',carrier:'装瓶／盛装容器',operation:'操作方法',aging:'熟成',seconds:'秒',base:'熟成基础时间',maximum:'最高品质',barrel:['打开酒桶盖，加入所列液体与材料。','关上桶盖开始酿造；以所列空容器取出成品。'],quality:'关盖后先得到品质 1；保持关盖可继续熟成，下一品质所需时间为基础时间乘当前品质。',shaker:['每个槽位各放一份符合条件的材料。','按住使用摇酒，在配方时机松手，再倒入已摆放的空容器。'],press:['将材料放入压榨桶，跳跃压榨至液体满一桶。','使用空桶收集果汁。']},
 en_US:{liquid:'Brewing liquid',buckets:'buckets',materials:'Ingredients',empty:'No additional ingredients',slots:'Shaker ingredients',slot:'Slot',result:'Result',carrier:'Bottling / serving container',operation:'How to prepare',aging:'Aging',seconds:'s',base:'Aging base time',maximum:'Maximum quality',barrel:['Open the barrel lid and add the listed liquid and ingredients.','Close the lid to brew; collect the result with the listed empty container.'],quality:'Closing the lid first produces Quality 1. Keep it closed to age; each next stage takes the base time multiplied by the current quality.',shaker:['Add one matching ingredient to each slot.','Hold use to shake, release at the recipe timing, then pour into a placed empty container.'],press:['Add the ingredients to the pressing tub and jump to press a full bucket of juice.','Use an empty bucket to collect the juice.']}
};
export function preparationText(recipe,locale,name){
 const t=TEXT[locale]??TEXT.en_US,p=recipe.preparation,sections=[],heading=(label,rows)=>'§l§6'+label+'§r\n§7'+rows.join('\n')+'§r';
 let ingredients=recipe.ingredients??[];
 if(p?.kind==='barrel'&&p.amount===4000&&ingredients.slice(0,4).length===4&&ingredients.slice(0,4).every(id=>id===p.fluidItem)){
  sections.push(heading(t.liquid,[name(p.fluidItem)+' ×'+p.amount/1000+' ('+p.amount+' mB)']));
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
  if(p.qualities>1&&Number.isFinite(p.unitTime)&&p.unitTime>0){
   const quality={zh_TW:'品質',zh_CN:'品质',en_US:'Quality'}[locale]??'Quality';
   const since={zh_TW:'自關蓋起的約略時間；酒桶所在區域須保持載入。可先取部分成品，其餘繼續熟成。',zh_CN:'自关盖起的约略时间；酒桶所在区域须保持加载。可先取部分成品，其余继续熟成。',en_US:'Approximate time from closing the lid, while the barrel area is loaded. Bottle some now and leave the rest to age.'}[locale]??'';
   const stages=Array.from({length:p.qualities-1},(_,i)=>{const q=i+2;return quality+' '+q+': '+guideDuration(p.unitTime/20*q*(q-1)/2,locale);});
   sections.push(heading(t.aging,[since,...stages]));
  }
 }else if(p?.kind==='shaker'){
  const condition={zh_TW:'有品質等級的瓶裝酒須達品質 4；各槽只需一份，順序不限。',zh_CN:'有品质等级的瓶装酒须达品质 4；各槽只需一份，顺序不限。',en_US:'Bottled drinks with quality stages must be Quality 4 or higher. Use one ingredient per slot, in any order.'}[locale];
  sections.push(heading(t.operation,[condition,...t.shaker.map((line,i)=>(i+1)+'. '+line)]));
 }
 else if(p?.kind==='pressing')sections.push(heading(t.operation,t.press.map((line,i)=>(i+1)+'. '+line)));
 return {sections,heading};
}

export function guideDuration(seconds,locale){
 const t={zh_TW:['分鐘','秒'],zh_CN:['分钟','秒'],en_US:['min','s']}[locale]??['min','s'];
 const minutes=Math.floor(seconds/60),remaining=Math.round((seconds-minutes*60)*100)/100;
 return [minutes?minutes+' '+t[0]:'',remaining||!minutes?remaining+' '+t[1]:''].filter(Boolean).join(' ');
}

/** Notes for the optional host's existing entry renderer. Recipes retain their
 * own ingredient cards; machine semantics are shared with the standalone view. */
export function preparationNotes(recipe,locale,name){
 if(!recipe.preparation)return [];
 const {sections}=preparationText(recipe,locale,name),t=TEXT[locale]??TEXT.en_US;
 return sections.filter(section=>!section.startsWith('§l§6'+t.materials+'§r')&&!section.startsWith('§l§6'+t.slots+'§r'));
}
