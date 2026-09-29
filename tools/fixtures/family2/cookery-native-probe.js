// Test-copy only, actual host registry. Not a shipping guide or substitute receiver.
import {world,system} from '@minecraft/server';
import {getGuidebookExtension} from './api/guidebookExtensionRegistry.js';
system.runTimeout(()=>{
 try{
 const ids=['kaleidoscope_chinesefood:guidebook','kaleidoscope_nether:guidebook','kaleidoscope_end:guidebook','kaleidoscope_tavern:tavern','kg_a1:grilling'];
 const guides=ids.map(id=>{const e=getGuidebookExtension(id);if(!e)throw Error('Missing real host entry '+id);
  return {id,categories:e.categories.length,entries:e.entries.length,fallbackEntries:e.entries.filter(x=>x.mechanics.length).length,
   localizedEntries:e.entries.filter(x=>Object.keys(x.mechanicsByLocale).length).length,
   localeKeys:[...new Set(e.entries.flatMap(x=>Object.keys(x.mechanicsByLocale)))].sort()};});
 console.warn('[FAMILY2-GUIDE] '+JSON.stringify({pass:true,players:world.getAllPlayers().length,guides}));
 }catch(e){console.error('[FAMILY2-GUIDE] '+JSON.stringify({pass:false,error:String(e)}));}
},500);
