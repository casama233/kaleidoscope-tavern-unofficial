import {ActionFormData,ModalFormData} from '@minecraft/server-ui';
import {guideEntries,searchEntries,paginate,LOCALES} from '../core/guide.js';
const active=new Set();
const PREF='kaleidoscope_tavern:guide_locale',MARK='kaleidoscope_tavern:guide_bookmarks';
function language(player){const v=player.getDynamicProperty(PREF);return LOCALES.includes(v)?v:'zh_TW';}
function bookmarks(player){try{const v=JSON.parse(player.getDynamicProperty(MARK)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,64):[];}catch{return [];}}
function local(l,tw,en){return l==='en_US'?en:tw;}
/** Independent UI: no Cookery imports, guide injections, player.json or global UI override. */
export async function openGuide(player,registry,names,diagnostics,{recipesOnly=false}={}){
 if(active.has(player.id))return;active.add(player.id);
 let state={view:recipesOnly?'recipes':'home',page:0,query:''};
 try{while(true){
  const l=language(player),tr=(tw,en)=>local(l,tw,en);const entries=guideEntries(registry,l,names[l]);
  const form=new ActionFormData().title(tr('森羅物語：酒館','Kaleidoscope Tavern'));
  const actions=[];const button=(label,action,icon)=>{icon?form.button(label,icon):form.button(label);actions.push(action);};
  if(state.view==='home'){
   form.body(tr('獨立酒館指南・C4 功能開發版\n配方與附屬頁面不使用廚房的指南資料。','Independent Tavern guide · C4 development build\nRecipes and extensions are separate from Cookery.'));
   for(const[view,tw,en]of [['guides','玩法與指引','Guides'],['recipes','目前可用配方','Active recipes'],['bookmarks','我的書籤','Bookmarks'],['extensions','已註冊附屬','Registered extensions']])button(tr(tw,en),()=>({view,page:0,query:''}));
   button(tr('搜尋','Search'),async()=>{const res=await new ModalFormData().title(tr('搜尋酒館內容','Search Tavern')).textField(tr('名稱、材料、ID','Name, ingredient, ID'),'').show(player);return res.canceled?state:{view:'search',page:0,query:String(res.formValues?.[0]??'').slice(0,100)};});
   button(tr('語言 / Language','Language / 語言'),async()=>{const res=await new ModalFormData().title('Language / 語言').dropdown('Language',['繁體中文','简体中文','English'],{defaultValueIndex:LOCALES.indexOf(l)}).show(player);if(!res.canceled&&LOCALES[res.formValues?.[0]])player.setDynamicProperty(PREF,LOCALES[res.formValues[0]]);return state;});
   button(tr('診斷與相容性','Diagnostics'),()=>({view:'diagnostics'}));
   button(tr('沉浸／計時輔助','Immersion / timing assistance'),async()=>{const key='kaleidoscope_tavern:timing_assist',enabled=player.getDynamicProperty(key)===true;const r=await new ModalFormData().title(tr('計時輔助','Timing assistance')).toggle(tr('顯示精確tick與結果窗口（預設關）','Show precise ticks and result windows (default off)'),{defaultValue:enabled}).show(player);if(!r.canceled)player.setDynamicProperty(key,r.formValues?.[0]===true);return state;});
  }else if(state.view==='entry'){
   const p=entries.find(x=>x.id===state.id);
   if(!p){state={view:'home'};continue;}
   form.title(p.title).body(p.body+'\n\n'+p.id+'\n'+tr('來源：','Source: ')+p.source);
   button(tr('返回','Back'),()=>state.back??{view:'home'});
   const saved=bookmarks(player),has=saved.includes(p.id);
   button(has?tr('移除書籤','Remove bookmark'):tr('加入書籤','Bookmark'),()=>{const next=has?saved.filter(x=>x!==p.id):[...saved,p.id].slice(-64);player.setDynamicProperty(MARK,JSON.stringify(next));return state;});
   for(const rid of p.recipeIds??[]){const recipe=entries.find(x=>x.id===rid&&x.kind==='recipe');if(recipe)button(recipe.title,()=>({view:'entry',id:rid,back:state}));}
  }else if(state.view==='extensions'){
   const installed=registry.list();form.body(installed.length?installed.map(x=>`${x.source} v${x.version}\n${x.recipes} recipes / ${x.pages} guide pages`).join('\n\n'):tr('目前沒有附屬。附屬必須以酒館 v1 接口重新註冊。','No registered extensions. Add-ons register through the Tavern v1 protocol each session.'));
   button(tr('返回','Back'),()=>({view:'home'}));
   for(const x of installed)button(x.source,()=>({view:'source',source:x.source,page:0}));
  }else if(state.view==='diagnostics'){
   form.body(JSON.stringify(diagnostics(),null,2));button(tr('返回','Back'),()=>({view:'home'}));
  }else{
   const saved=bookmarks(player);let list=entries;
   if(state.view==='recipes')list=list.filter(x=>x.kind==='recipe');else if(state.view==='guides')list=list.filter(x=>x.kind==='guide');else if(state.view==='bookmarks')list=list.filter(x=>saved.includes(x.id));else if(state.view==='source')list=list.filter(x=>x.source===state.source);else if(state.view==='search')list=searchEntries(list,state.query??'');
   const slice=paginate(list,state.page??0);form.body(`${tr('條目','Entries')}: ${list.length} ｜ ${slice.page+1}/${slice.pages}`);
   for(const p of slice.entries)button(p.title,()=>({view:'entry',id:p.id,back:{...state,page:slice.page}}),p.icon);
   if(slice.page>0)button(tr('上一頁','Previous'),()=>({...state,page:slice.page-1}));
   if(slice.page+1<slice.pages)button(tr('下一頁','Next'),()=>({...state,page:slice.page+1}));
   button(tr('首頁','Home'),()=>({view:'home'}));
  }
  const result=await form.show(player);if(result.canceled)return;
  const action=actions[result.selection];if(!action)return;state=await action();
 }}catch(error){console.warn(`[Tavern Guide] ${error}`);try{player.sendMessage('§e[Tavern] UI unavailable / 請先關閉聊天或其他視窗再開書。');}catch{}}
 finally{active.delete(player.id);}
}
