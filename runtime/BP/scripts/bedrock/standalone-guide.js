/** Tavern-owned UI; no item replacement and no Cookery renderer dependency. */
import {ActionFormData,ModalFormData} from '@minecraft/server-ui';
import {GUIDE_LANGUAGES,guideLocale,guideText,standaloneGuideView} from '../core/standalone-guide-model.js';
const LANGUAGE_KEY='kt:standalone_guide_locale',sessions=new Map();
export const standaloneGuideDiagnostics={opened:0,closed:0,errors:0,notReady:0};
function localeOf(player){try{return guideLocale(player.getDynamicProperty(LANGUAGE_KEY))}catch{return guideLocale()}}
function notify(player,text){try{player.sendMessage('§7[Tavern] '+text)}catch{}}
export async function showStandaloneGuide(player,payloadProvider){
 if(!player?.id||sessions.has(player.id))return false;
 const token={};sessions.set(player.id,token);let locale=localeOf(player);const history=[];let node={type:'root'};
 try{
  if(!payloadProvider()){standaloneGuideDiagnostics.notReady++;notify(player,guideText(locale,'initializing'));return false;}
  standaloneGuideDiagnostics.opened++;
  while(sessions.get(player.id)===token&&player.isValid!==false){
   const payload=payloadProvider();if(!payload){notify(player,guideText(locale,'initializing'));break;}
   const view=standaloneGuideView(payload,locale,node);if(view.node.type==='root'&&node.type!=='root')history.length=0;else if(view.node.type!==node.type||view.node.id!==node.id){while(history.length&&history.at(-1).type===view.node.type&&history.at(-1).id===view.node.id)history.pop();}node=view.node;
   const form=new ActionFormData().title(view.title).body(view.body);
   for(const button of view.buttons)form.button(button.label,button.icon);
   const response=await form.show(player);
   if(sessions.get(player.id)!==token||response.canceled||!Number.isInteger(response.selection))break;
   const action=view.buttons[response.selection]?.action;if(!action)break;
   if(action.type==='close')break;
   if(action.type==='back'){node=history.pop()??{type:'root'};continue;}
   if(action.type==='page'){node=action.node;continue;}
   if(action.type==='language'){
    const answer=await new ModalFormData().title(guideText(locale,'language')).dropdown(guideText(locale,'language'),['繁體中文','简体中文','English'],{defaultValueIndex:GUIDE_LANGUAGES.indexOf(locale)}).show(player);
    if(sessions.get(player.id)!==token||answer.canceled)break;
    const choice=answer.formValues?.[0];if(!Number.isInteger(choice)||!GUIDE_LANGUAGES[choice])continue;
    const before=player.getDynamicProperty(LANGUAGE_KEY),next=GUIDE_LANGUAGES[choice];
    try{player.setDynamicProperty(LANGUAGE_KEY,next);if(player.getDynamicProperty(LANGUAGE_KEY)!==next)throw Error('Language write not acknowledged');locale=next;}
    catch(error){try{player.setDynamicProperty(LANGUAGE_KEY,before)}catch{}locale=localeOf(player);notify(player,guideText(locale,'saveError'));console.warn('[Tavern guide language] '+error);}
    continue;
   }
   history.push(node);node=action;
  }
  return true;
 }catch(error){standaloneGuideDiagnostics.errors++;console.warn('[Tavern standalone guide] '+error);notify(player,guideText(locale,'error'));return false;}
 finally{if(sessions.get(player.id)===token)sessions.delete(player.id);standaloneGuideDiagnostics.closed++;}
}
export function clearStandaloneGuideSession(playerId){sessions.delete(playerId);}
