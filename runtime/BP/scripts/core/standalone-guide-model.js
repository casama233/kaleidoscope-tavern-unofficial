/** View data only. Both guide entrances use buildCookeryGuidePayload(registry). */
import {GUIDE_ROOTS} from '../data/guide-navigation.js';
export const GUIDE_LANGUAGES=Object.freeze(['zh_TW','zh_CN','en_US']);
export const GUIDE_PAGE_SIZE=18;
const TEXT={
 zh_TW:{back:'返回',close:'關閉',language:'語言 / Language',empty:'此分類目前沒有已安裝的內容。',next:'下一頁',previous:'上一頁',recipe:'製作方法',ingredients:'材料',result:'成品',time:'製作時間',ticks:'tick',inventory:'背包使用',yes:'可以',placeable:'可擺放展示',returns:'使用後容器',stack:'堆疊上限',usedBy:'用於製作',initializing:'酒館指南尚未完成初始化，請稍後再試。',error:'指南開啟失敗，請稍後再試。',saveError:'語言設定未能確認儲存，請重新開啟指南檢查。',craftNote:'材料清單不代表合成格位置；實際排列請查看原版配方書。',methods:{Barrel:'酒桶釀造',Shaker:'雪克杯調酒','Pressing Tub':'壓榨桶','Crafting Table':'工作台',Freezer:'冰櫃'}},
 zh_CN:{back:'返回',close:'关闭',language:'语言 / Language',empty:'此分类目前没有已安装的内容。',next:'下一页',previous:'上一页',recipe:'制作方法',ingredients:'材料',result:'成品',time:'制作时间',ticks:'tick',inventory:'背包使用',yes:'可以',placeable:'可摆放展示',returns:'使用后容器',stack:'堆叠上限',usedBy:'用于制作',initializing:'酒馆指南尚未完成初始化，请稍后再试。',error:'指南打开失败，请稍后再试。',saveError:'语言设置未能确认保存，请重新打开指南检查。',craftNote:'材料清单不代表合成格位置；实际排列请查看原版配方书。',methods:{Barrel:'酒桶酿造',Shaker:'雪克杯调酒','Pressing Tub':'压榨桶','Crafting Table':'工作台',Freezer:'冰柜'}},
 en_US:{back:'Back',close:'Close',language:'Language / 語言',empty:'No installed content in this category yet.',next:'Next page',previous:'Previous page',recipe:'Preparation',ingredients:'Ingredients',result:'Result',time:'Preparation time',ticks:'ticks',inventory:'Use from inventory',yes:'Yes',placeable:'Can be placed for display',returns:'Returned container',stack:'Stack limit',usedBy:'Used to make',initializing:'The Tavern guide is not initialized yet. Please try again shortly.',error:'The guide could not open. Please try again.',saveError:'Could not confirm the language was saved. Reopen the guide to check.',craftNote:'This ingredient list does not specify crafting-grid positions. Check the vanilla recipe book for the actual layout.',methods:{Barrel:'Barrel brewing',Shaker:'Shaker mixing','Pressing Tub':'Pressing tub','Crafting Table':'Crafting table',Freezer:'Freezer'}}
};
export const guideLocale=value=>GUIDE_LANGUAGES.includes(value)?value:'zh_TW';
export const guideText=(locale,key)=>TEXT[guideLocale(locale)][key];
const word=(payload,locale,key,fallback='')=>payload.text?.[locale]?.[key]??payload.text?.en_US?.[key]??fallback;
export const guideItemName=(payload,locale,id)=>payload.names?.[locale]?.[id]??payload.names?.en_US?.[id]??String(id??'');
const catName=(p,l,c)=>word(p,l,c.labelKey??c.id,c.fallback??c.id);
const entriesIn=(p,id)=>p.entries.filter(e=>e.category===id||e.categories?.includes(id));
function pageButtons(rows,node,text){
 const pages=Math.max(1,Math.ceil(rows.length/GUIDE_PAGE_SIZE)),page=Math.max(0,Math.min(pages-1,Number.isInteger(node.page)?node.page:0));
 const buttons=rows.slice(page*GUIDE_PAGE_SIZE,(page+1)*GUIDE_PAGE_SIZE);
 if(page>0)buttons.push({label:text.previous,action:{type:'page',node:{...node,page:page-1}}});
 if(page+1<pages)buttons.push({label:text.next,action:{type:'page',node:{...node,page:page+1}}});
 return {buttons,page,pages};
}
export function standaloneGuideView(payload,locale,node={type:'root'}){
 if(!payload||!Array.isArray(payload.entries)||!Array.isArray(payload.categories))throw new TypeError('Guide payload unavailable');
 locale=guideLocale(locale);const text=TEXT[locale],back={label:text.back,action:{type:'back'}},entryButton=e=>({label:guideItemName(payload,locale,e.id),icon:e.icon,action:{type:'entry',id:e.id}});
 if(node.type==='root'){
  const buttons=GUIDE_ROOTS.map(id=>payload.categories.find(c=>c.id===id)).filter(Boolean).map(c=>({label:catName(payload,locale,c),icon:c.icon,action:{type:'category',id:c.id}}));
  buttons.push({label:text.language,action:{type:'language'}},{label:text.close,action:{type:'close'}});
  return {node,title:word(payload,locale,payload.titleKey??'title','Tavern'),body:word(payload,locale,payload.introKey??'intro'),buttons};
 }
 if(node.type==='category'){
  const category=payload.categories.find(c=>c.id===node.id);if(!category)return standaloneGuideView(payload,locale);
  const rows=[];
  for(const child of payload.categories.filter(c=>c.parent===node.id)){
   const items=entriesIn(payload,child.id);if(!items.length)continue;
   rows.push(items.length===1?entryButton(items[0]):{label:catName(payload,locale,child)+' ('+items.length+')',icon:child.icon,action:{type:'category',id:child.id}});
  }
  rows.push(...entriesIn(payload,node.id).map(entryButton));
  const result=pageButtons(rows,node,text);result.buttons.push(back);
  return {node:{...node,page:result.page},title:catName(payload,locale,category),body:rows.length?'':text.empty,buttons:result.buttons};
 }
 const entry=payload.entries.find(e=>e.id===node.id);if(!entry)return standaloneGuideView(payload,locale);
 if(node.type==='recipe'){
  const recipe=entry.recipes?.[node.index];if(!recipe)return standaloneGuideView(payload,locale,{type:'entry',id:entry.id});
  const method=text.methods[recipe.method]??recipe.method,lines=[text.ingredients+':',...(recipe.ingredients??[]).map((id,i)=>(i+1)+'. '+guideItemName(payload,locale,id)),'',text.result+': '+guideItemName(payload,locale,recipe.result??entry.id)+' ×'+(recipe.count??1)];
  if(recipe.time>0)lines.push(text.time+': '+recipe.time+' '+text.ticks+' ('+(recipe.time/20)+' s)');
  if(recipe.method==='Crafting Table')lines.push('',text.craftNote);
  return {node,title:guideItemName(payload,locale,entry.id)+' · '+method,body:lines.join('\n'),buttons:[back]};
 }
 const lines=[...(entry.mechanicsByLocale?.[locale]??entry.mechanicsByLocale?.en_US??entry.mechanics??[])];
 if(Number.isFinite(entry.stack))lines.push(text.stack+': '+entry.stack);
 if(entry.placeable)lines.push(text.placeable+': '+text.yes);
 if(entry.food?.eatFromInventory)lines.push(text.inventory+': '+text.yes);
 if(entry.food?.returns)lines.push(text.returns+': '+guideItemName(payload,locale,entry.food.returns));
 const rows=(entry.recipes??[]).map((r,index)=>({label:text.recipe+' '+(index+1)+' · '+(text.methods[r.method]??r.method),action:{type:'recipe',id:entry.id,index}}));
 for(const id of entry.usedBy??[]){const target=payload.entries.find(e=>e.id===id);if(target)rows.push({...entryButton(target),label:text.usedBy+': '+guideItemName(payload,locale,id)});}
 const result=pageButtons(rows,node,text);result.buttons.push(back);
 return {node:{...node,page:result.page},title:guideItemName(payload,locale,entry.id),body:lines.join('\n\n'),buttons:result.buttons};
}
