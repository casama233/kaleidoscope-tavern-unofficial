/** Test-only read-only observer. No player creation or UI invocation. */
import {system,world,ItemTypes} from '@minecraft/server';
import {runtimeRegistry,diagnosticSnapshot} from './main.js';
import {buildCookeryGuidePayload} from './data/cookery-guide-payload.js';
import {standaloneGuideView} from './core/standalone-guide-model.js';
import {cookeryGuideRevision} from './core/cookery-guide-publisher.js';
import config from './standalone-guide-probe-config.js';
const wait=t=>new Promise(r=>system.runTimeout(r,t)),check=(x,m)=>{if(!x)throw Error(m)};
system.runTimeout(async()=>{try{
 let registry,payload,status;
 for(let i=0;i<100;i++){
  registry=runtimeRegistry();status=diagnosticSnapshot();
  if(registry&&(!config.liquor||registry.list().some(x=>x.source==='kaleidoscope_world_liquor'))){payload=buildCookeryGuidePayload(registry);if(!config.cookery||(status.cookeryGuideChapter.hostReady&&!status.cookeryGuideChapter.active&&!status.cookeryGuideChapter.dirty&&status.cookeryGuideChapter.revision===cookeryGuideRevision(payload)))break;}
  await wait(10);
 }
 check(registry&&payload,'registry did not initialize');
 check(!!ItemTypes.get('kaleidoscope_cookery:guidebook')===config.cookery,'unexpected Cookery presence');
 check(ItemTypes.get('kaleidoscope_tavern:guidebook')&&ItemTypes.get('kaleidoscope_tavern:recipe_book'),'native guide items absent');
 check(status.guideAuthority==='kaleidoscope_tavern:guidebook'&&!status.cookeryManifestBound,'standalone authority/dependencies');
 check(payload.entries.length===(config.liquor?222:156),'entry count');
 const local=standaloneGuideView(payload,'zh_TW');check(local.buttons.slice(0,7).map(x=>x.action.id).join(',')==='equipment,barrel,cocktail,cultivation,storage,decor,food','seven roots');
 for(const locale of ['zh_TW','zh_CN','en_US']){
  const id=config.liquor?'kaleidoscope_world_liquor:ice_tea_q1':'kaleidoscope_tavern:rum_q1';
  const entry=payload.entries.find(e=>e.id===id);check(entry?.recipes?.length,'brewing preparation missing');
  const view=standaloneGuideView(payload,locale,{type:'recipe',id,index:0});
  check(view.body.includes('4000 mB (4 '),'fluid quantity missing');
  check(view.body.split(payload.names[locale]['minecraft:water_bucket']).length-1===1,'repeated water bucket rows');
  check(view.body.includes(payload.names[locale]['kaleidoscope_tavern:empty_bottle']),'bottling container missing');
  check(!/\b(?:minecraft|kaleidoscope_\w+):/.test(view.body),'untranslated recipe IDs');
 }
 if(config.liquor){for(const name of ['dassai','maotai']){const e=payload.entries.find(x=>x.id==='kaleidoscope_world_liquor:'+name+'_q1');check(e,'optional product missing');check((e.recipes??[]).length===(config.cookery?1:0),'optional rice availability');}}
 if(config.cookery)check(status.cookeryGuideChapter.hostReady&&status.cookeryGuideChapter.revision===cookeryGuideRevision(payload)&&!status.cookeryGuideChapter.active&&!status.cookeryGuideChapter.dirty,'latest optional chapter not transmitted');
 const stage=world.getDynamicProperty('kt:qa_standalone_restart')===true?'restored':'saved';world.setDynamicProperty('kt:qa_standalone_restart',true);
 console.log('TAVERN_GUIDE_NATIVE_PASS '+JSON.stringify({stage,scenario:config.name,entries:payload.entries.length,categories:payload.categories.length,preparations:payload.entries.reduce((n,e)=>n+(e.recipes?.length??0),0),standaloneGuide:true,cookery:config.cookery,liquor:config.liquor,simulatedPlayers:false,clientUI:false}));
}catch(e){console.error('TAVERN_GUIDE_NATIVE_FAIL '+e+' '+e.stack)}},100);
