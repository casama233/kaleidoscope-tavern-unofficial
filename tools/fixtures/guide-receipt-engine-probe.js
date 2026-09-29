// Install only into an isolated Cookery test pack, beside its real registry.
// EXPECTED_GUIDE is generated from the Tavern wire payload before launch.
import {system} from '@minecraft/server';
import {getGuidebookExtension} from './api/guidebookExtensionRegistry.js';
import {EXPECTED_GUIDE} from './guide-audit-expected.js';
system.runTimeout(()=>{
 try{
  const received=getGuidebookExtension(EXPECTED_GUIDE.id);
  if(!received)throw Error('Cookery did not register the Tavern chapter');
  if(received.version!==EXPECTED_GUIDE.version)throw Error('Chapter version mismatch');
  let localizedPages=0;
  for(const expected of EXPECTED_GUIDE.entries){
   const actual=received.entries.find(e=>e.id===expected.id);
   if(!actual)throw Error('Missing entry '+expected.id);
   for(const lc of ['zh_CN','zh_TW','en_US']){
    if(JSON.stringify(actual.mechanicsByLocale[lc]??[])!==JSON.stringify(expected.mechanicsByLocale[lc]))throw Error('Changed/truncated instructions '+lc+' '+expected.id);
    localizedPages++;
   }
  }
  console.warn('[GUIDE_RECEIPT_AUDIT] '+JSON.stringify({pass:true,version:received.version,entries:received.entries.length,coreEntries:EXPECTED_GUIDE.entries.length,localizedPages,receiver:'actual Cookery registry',clientUI:false,simulatedPlayers:false}));
 }catch(error){console.error('[GUIDE_RECEIPT_AUDIT] '+JSON.stringify({pass:false,error:String(error)}));}
},400);
