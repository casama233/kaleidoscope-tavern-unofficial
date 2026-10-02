/** Test-only observer in the unmodified public Cookery pack's own scope. */
import {system} from '@minecraft/server';
import {getGuidebookExtension} from './api/guidebookExtensionRegistry.js';
const wait=t=>new Promise(r=>system.runTimeout(r,t));
system.runTimeout(async()=>{try{
 let chapter;for(let i=0;i<120;i++){chapter=getGuidebookExtension('kaleidoscope_tavern:tavern');if(chapter?.entries?.length===222)break;await wait(10);}
 if(!chapter||chapter.entries.length!==222||chapter.categories.length!==31)throw Error('Full shared Tavern chapter not received');
 const roots=chapter.categories.filter(x=>!x.parent).map(x=>x.id);if(roots.join(',')!=='equipment,barrel,cocktail,cultivation,storage,decor,food')throw Error('Root categories changed');
 console.log('COOKERY_CHAPTER_NATIVE_PASS '+JSON.stringify({entries:chapter.entries.length,categories:chapter.categories.length,roots,clientUI:false}));
}catch(e){console.error('COOKERY_CHAPTER_NATIVE_FAIL '+e+' '+e.stack)}},100);
