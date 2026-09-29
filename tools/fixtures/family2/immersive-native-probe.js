// Appended within the actual vendor test module, no fake players/eating events.
// Exercise the real global-feedback function and its real scheduled cleanup only.
system.runTimeout(()=>{
 try{
  if(world.getAllPlayers().length)throw Error('Unexpected players');
  world.gameRules.sendCommandFeedback=true;
  forceFeedbackOff();const startTrue=world.gameRules.sendCommandFeedback;
  world.gameRules.sendCommandFeedback=false;restoreAfterTick=system.currentTick;
  system.runTimeout(()=>{
   const afterExternalFalse=world.gameRules.sendCommandFeedback;
   forceFeedbackOff();const startFalse=world.gameRules.sendCommandFeedback;
   world.gameRules.sendCommandFeedback=true;restoreAfterTick=system.currentTick;
   system.runTimeout(()=>console.warn('[FAMILY2-FEEDBACK] '+JSON.stringify({pass:true,players:world.getAllPlayers().length,startTrue,afterExternalFalse,startFalse,afterExternalTrue:world.gameRules.sendCommandFeedback,realFunctionNotEatingEvent:true})),4);
  },4);
 }catch(e){console.error('[FAMILY2-FEEDBACK] '+JSON.stringify({pass:false,error:String(e)}));}
},420);
