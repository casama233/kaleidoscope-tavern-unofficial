import {boardFeedback} from './effect-feedback.js';
import {boardLayoutOptions,splitBoardLines,encodeBoardInput,decodeBoardInput} from '../core/board-layout.js';
import {chalkPlacementFacing} from '../core/java-placement.js';
import {renderBoardText as syncGlyphs,removeBoardText as removeGlyphs} from './board-text.js';
import {system,world,BlockPermutation,GameMode} from '@minecraft/server';
import {ModalFormData} from '@minecraft/server-ui';
import {NS,SANDWICH_BOARDS,CHALKBOARD,BOARD_HALF,BOARD_ROTATION,CHALK_POSITION,FLOWER_BOARD_TRANSFORMS,BOARD_DYES,BOARD_ALIGNMENTS,BOARD_VERTICAL_ALIGNMENTS,boardBase,boardRotation16,chalkCenter,boardRuntimeKey,normalizeBoardData} from '../core/boards.js';
import {check} from '../core/util.js';
import {canWrite,canInteract,hand,handSnapshot,sameHand,exchangeBlocks,placementTake,blockAt,plus,safe,applyBlocks} from './transactions.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {nativeBlockUse,registerJavaBlockUseHandler,settleJavaBlockUse} from './java-placement-router.js';
import {javaSecondaryBypass} from '../core/java-use-order.js';

const DYE_FROM_ITEM=Object.freeze(Object.fromEntries(BOARD_DYES.map(c=>['minecraft:'+c+'_dye',c])));
const diagnostics={placed:0,recovered:0,transformed:0,edited:0,glyphHelpers:0,glyphRefreshes:0,errors:[]};let installed=false;const recentBoardInteractions=new Map(),recentLockedFeedback=new Map();
function record(e){diagnostics.errors.push(String(e));if(diagnostics.errors.length>16)diagnostics.errors.shift();}
function optional(fn){try{return fn();}catch(e){record(e);}}
function isSandwich(id){return SANDWICH_BOARDS.includes(id);}
function centerAt(base){return {x:base.x+.5,y:base.y,z:base.z+.5};}
function boardKey(block){const base=boardBase(block.location,block.permutation.getState(BOARD_HALF));if(block.typeId===CHALKBOARD){const pos=block.permutation.getState(CHALK_POSITION),f=block.permutation.getState('minecraft:cardinal_direction');return {base:center=>chalkCenter(base,pos,f),large:pos!==0,root:chalkCenter(base,pos,f),facing:f,kind:'chalk'};}return {base:center=>center,large:false,root:base,rotation:block.permutation.getState(BOARD_ROTATION),kind:'sandwich'};}
function maxText(kind,large){return kind==='sandwich'?320:large?1500:350;}
function dataFor(key,kind,large){const raw=world.getDynamicProperty(key);if(raw===undefined)return {text:'',color:'white',glowing:false,waxed:false,alignment:'center',verticalAlignment:'top'};check(typeof raw==='string','BOARD_DATA_CORRUPT');return normalizeBoardData(JSON.parse(raw),maxText(kind,large));}
function saveData(key,data,kind,large){const clean=normalizeBoardData(data,maxText(kind,large));world.setDynamicProperty(key,JSON.stringify(clean));return clean;}
const boardText=(key,...args)=>({translate:'kt.board.'+key,...(args.length?{with:args.map(String)}:{})});
function currentInfo(block){const root=boardKey(block),key=boardRuntimeKey(block.dimension.id,root.root),data=dataFor(key,root.kind,root.large);return {root,key,data};}
function eligibleFlower(id){return FLOWER_BOARD_TRANSFORMS[id];}
// Java TextBlockEntity measures eight blocks from the root's integer origin,
// including when the click targets an upper half or the side of a large board.
function withinBoardReach(player,dimension,root){return player.dimension.id===dimension.id&&Math.hypot(player.location.x-root.x,player.location.y-root.y,player.location.z-root.z)<=8;}
function requireBoardReach(player,dimension,root){check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');check(withinBoardReach(player,dimension,root),'OUT_OF_REACH');}
function setBoardStyle(player,block,target){canInteract(player);const base=boardBase(block.location,block.permutation.getState(BOARD_HALF)),lower=blockAt(block.dimension,base),upper=blockAt(block.dimension,{x:base.x,y:base.y+1,z:base.z});check(lower&&upper&&isSandwich(lower.typeId)&&upper.typeId===lower.typeId,'BOARD_PAIR_MISSING');const item=hand(player);check(item&&eligibleFlower(item.typeId),'BOARD_FLOWER_REQUIRED');check(target!==lower.typeId,'BOARD_STYLE_UNCHANGED');const state=lower.permutation,top=upper.permutation;exchangeBlocks(player,placementTake(player),[],[{block:lower,permutation:BlockPermutation.resolve(target,{[BOARD_HALF]:0,[BOARD_ROTATION]:state.getState(BOARD_ROTATION),'kaleidoscope_tavern:waterlogged':state.getState('kaleidoscope_tavern:waterlogged')})},{block:upper,permutation:BlockPermutation.resolve(target,{[BOARD_HALF]:1,[BOARD_ROTATION]:top.getState(BOARD_ROTATION),'kaleidoscope_tavern:waterlogged':top.getState('kaleidoscope_tavern:waterlogged')})}],{interaction:true});diagnostics.transformed++;optional(()=>boardFeedback(block.dimension,base,'transform'));return true;}
function renderCommitted(block,key,clean){
 // The board data and material exchange have already committed. Glyph helpers
 // are presentation: onTick can repair them without charging the player again.
 diagnostics.edited++;optional(()=>syncGlyphs(block.dimension,boardKey(block),clean,block.location,key));return clean;
}
function saveAndRender(block,key,data,kind,large){return renderCommitted(block,key,saveData(key,data,kind,large));}
function saveBoardMaterial(player,block,key,data,kind,large){
 const raw=world.getDynamicProperty(key),clean=normalizeBoardData(data,maxText(kind,large));
 exchangeBlocks(player,placementTake(player),[],[],{interaction:true,native:{
  apply:()=>world.setDynamicProperty(key,JSON.stringify(clean)),
  rollback:()=>world.setDynamicProperty(key,raw),finish(){}
 }});
 return renderCommitted(block,key,clean);
}
function editBoard(player,block,key,data,kind,large){const limit=maxText(kind,large),d=block.dimension,pos={...block.location},id=block.typeId,expected=JSON.stringify(data),form=new ModalFormData().title(boardText(kind)).textField(boardText(kind==='chalk'&&!large?'text_small':'text_lines',kind==='sandwich'?8:11),boardText('newline_hint'),{defaultValue:encodeBoardInput(data.text)}).dropdown(boardText('align'),BOARD_ALIGNMENTS.map(key=>boardText(key)),{defaultValueIndex:BOARD_ALIGNMENTS.indexOf(data.alignment)}).dropdown(boardText('vertical_align'),BOARD_VERTICAL_ALIGNMENTS.map(key=>boardText(key)),{defaultValueIndex:BOARD_VERTICAL_ALIGNMENTS.indexOf(data.verticalAlignment??'top')});form.show(player).then(answer=>safe(player,()=>{if(answer.canceled||!Array.isArray(answer.formValues))return;canInteract(player);const current=blockAt(d,pos);check(current?.typeId===id,'BLOCK_CHANGED');const currentInfoNow=currentInfo(current);check(currentInfoNow.key===key,'BOARD_CHANGED');requireBoardReach(player,d,currentInfoNow.root.root);check(JSON.stringify(currentInfoNow.data)===expected,'BOARD_CHANGED');check(!currentInfoNow.data.waxed,'BOARD_WAXED');const [inputText,alignmentIndex,verticalIndex]=answer.formValues;const text=typeof inputText==='string'?decodeBoardInput(inputText):inputText;check(typeof text==='string','BOARD_TEXT_REQUIRED');check(Number.isInteger(alignmentIndex)&&BOARD_ALIGNMENTS[alignmentIndex],'BOARD_ALIGNMENT_REQUIRED');check(Number.isInteger(verticalIndex)&&BOARD_VERTICAL_ALIGNMENTS[verticalIndex],'BOARD_ALIGNMENT_REQUIRED');const layout=splitBoardLines(text,boardLayoutOptions(kind,large));if(text.length>limit||layout.overflow){player.sendMessage(boardText('overflow',kind==='sandwich'?8:11));return;}const next={...data,text,alignment:BOARD_ALIGNMENTS[alignmentIndex],verticalAlignment:BOARD_VERTICAL_ALIGNMENTS[verticalIndex]};saveAndRender(current,key,next,kind,large);})).catch(record);}
function boardAction(item,block,data){
 const target=eligibleFlower(item?.typeId);
 if(target&&block.typeId!==CHALKBOARD&&target!==block.typeId)return 'transform';
 if(item?.typeId==='minecraft:honeycomb')return 'wax';
 if(item?.typeId==='minecraft:glow_ink_sac'&&!data.glowing)return 'glow';
 if(item?.typeId==='minecraft:ink_sac'&&data.glowing)return 'un_glow';
 if(DYE_FROM_ITEM[item?.typeId]&&DYE_FROM_ITEM[item.typeId]!==data.color)return 'dye';
 return 'edit';
}
function lockedBoardFeedback(player,block,info,event,held){
 const key=player.id+'|'+info.key,tick=system.currentTick,previous=recentLockedFeedback.get(key);
 // PASS must never reserve a block/item claim. Keep only a cosmetic echo guard;
 // native placement may already have shrunk the same held stack by its callback.
 if(previous&&previous.slot===held.slot&&previous.id===held.id&&(previous.tick===tick||((event._javaNativeAfter||event._javaRawFirstEvent===false)&&tick-previous.tick<=2)))return;
 recentLockedFeedback.set(key,{tick,slot:held.slot,id:held.id});
 if(recentLockedFeedback.size>128)for(const [k,v]of recentLockedFeedback)if(tick-v.tick>2)recentLockedFeedback.delete(k);
 while(recentLockedFeedback.size>256)recentLockedFeedback.delete(recentLockedFeedback.keys().next().value);
 // Captured, already validated feedback does not debit items or open a form.
 // Queue it before a subsequent scripted item stage, without cancelling that stage.
 system.run(()=>optional(()=>boardFeedback(block.dimension,info.root.root,'locked')));
}
function handleBoardInteraction(player,block,event){
 if(event.cancel||!player||!block||(block.typeId!==CHALKBOARD&&!isSandwich(block.typeId)))return false;
 const hs=handSnapshot(player);if(javaSecondaryBypass(player,hs.id))return false;
 try{canInteract(player);}catch{return false;}
 let info;try{info=currentInfo(block);}catch(err){record(err);return false;}
 const claimKey=player.id+'|'+info.key,previous=recentBoardInteractions.get(claimKey),tick=system.currentTick;
 const sameHeld=h=>h&&['slot','id','amount'].every(k=>h[k]===hs[k]);
 // Completed material use can empty the hand before an upper/side native echo.
 // Preserve its root claim without suppressing the next authoritative press.
 if(previous&&(sameHeld(previous.hand)||sameHeld(previous.afterHand))&&(previous.pending||((event._javaNativeAfter||event._javaRawFirstEvent===false)&&tick-previous.tick<=2))){event._javaUseClaim=previous.event._javaUseClaim;return true;}
 if(recentBoardInteractions.size>128)for(const [k,v]of recentBoardInteractions)if(!v.pending&&tick-v.tick>2)recentBoardInteractions.delete(k);
 // SandwichBoardBlock tries flower transformations before TextBlockEntity's
 // range/wax checks. Text PASS must leave ordinary item use and placement intact.
 if(boardAction(hand(player),block,info.data)!=='transform'){
  if(!withinBoardReach(player,block.dimension,info.root.root))return false;
  if(info.data.waxed){lockedBoardFeedback(player,block,info,event,hs);return false;}
 }
 // Upper/lower halves and large-board side panels share the same logical use.
 const pending={event,hand:hs,pending:true,tick};recentBoardInteractions.set(claimKey,pending);
 const d=block.dimension,pos={...block.location},id=block.typeId,key=info.key;
 system.run(()=>safe(player,()=>{
  let succeeded=false;
  try{
   sameHand(player,hs);canInteract(player);
   const b=blockAt(d,pos);check(b?.typeId===id,'BLOCK_CHANGED');
   const now=currentInfo(b);check(now.key===key,'BOARD_CHANGED');check(player.dimension.id===d.id,'DIMENSION_CHANGED');
   const item=hand(player),action=boardAction(item,b,now.data);
   if(action==='transform'){setBoardStyle(player,b,eligibleFlower(item.typeId));succeeded=true;return;}
   requireBoardReach(player,d,now.root.root);
   if(now.data.waxed){optional(()=>boardFeedback(d,now.root.root,'locked'));succeeded=true;return;}
   if(action==='edit'){editBoard(player,b,key,now.data,now.root.kind,now.root.large);succeeded=true;return;}
   const next={...now.data};
   if(action==='wax')next.waxed=true;else if(action==='glow')next.glowing=true;else if(action==='un_glow')next.glowing=false;else if(action==='dye')next.color=DYE_FROM_ITEM[item.typeId];
   saveBoardMaterial(player,b,key,next,now.root.kind,now.root.large);succeeded=true;
   optional(()=>boardFeedback(d,now.root.root,action));
  }finally{
   if(recentBoardInteractions.get(claimKey)===pending){
    if(succeeded){pending.pending=false;pending.tick=system.currentTick;pending.afterHand=optional(()=>handSnapshot(player));}
    else recentBoardInteractions.delete(claimKey);
   }
   settleJavaBlockUse(event,succeeded);
  }
 }));
 return true;
}
function boardUseHandler(e){if(e.cancel||e.isFirstEvent===false)return;if(handleBoardInteraction(e.player,e.block,e))e.cancel=true;}
function cardinalOffset(f,scale=1){return {north:{x:scale,z:0},east:{x:0,z:scale},south:{x:-scale,z:0},west:{x:0,z:-scale}}[f];}
function matchesSingle(d,p,f){const b=blockAt(d,p),t=blockAt(d,{x:p.x,y:p.y+1,z:p.z});if(b?.typeId!==CHALKBOARD||t?.typeId!==CHALKBOARD||b.permutation.getState(BOARD_HALF)!==0||t.permutation.getState(BOARD_HALF)!==1||b.permutation.getState(CHALK_POSITION)!==0||t.permutation.getState(CHALK_POSITION)!==0||b.permutation.getState('minecraft:cardinal_direction')!==f)return false;const key=boardRuntimeKey(d.id,p);return dataFor(key,'chalk',false).text.trim().length===0;}
function tryMergeChalk(d,base,f){const cw=cardinalOffset(f),candidates=[base,{x:base.x+cw.x,y:base.y,z:base.z+cw.z},{x:base.x-cw.x,y:base.y,z:base.z-cw.z}];for(const c of candidates){const left={x:c.x-cw.x,y:c.y,z:c.z-cw.z},right={x:c.x+cw.x,y:c.y,z:c.z+cw.z};if(!matchesSingle(d,left,f)||!matchesSingle(d,c,f)||!matchesSingle(d,right,f))continue;const parts=[left,c,right],changes=[];for(const [index,p] of parts.entries())for(const y of [0,1]){const b=blockAt(d,{x:p.x,y:p.y+y,z:p.z});changes.push({block:b,permutation:b.permutation.withState(CHALK_POSITION,index+1)});}const keys=parts.map(p=>boardRuntimeKey(d.id,p)),saved=keys.map(k=>world.getDynamicProperty(k));const rollback=applyBlocks(changes);try{for(const k of keys)world.setDynamicProperty(k,undefined);}catch(error){rollback();for(let i=0;i<keys.length;i++)world.setDynamicProperty(keys[i],saved[i]);throw error;}return c;}return undefined;}
function placeBoard(player,clicked,face){canWrite(player);const id=hand(player)?.typeId;check(id===CHALKBOARD||isSandwich(id),'BOARD_ITEM_REQUIRED');const vec={Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},East:{x:1,y:0,z:0},West:{x:-1,y:0,z:0}}[face];check(vec,'UNKNOWN_FACE');const base=plus(clicked.location,vec),lower=blockAt(clicked.dimension,base),upper=blockAt(clicked.dimension,{x:base.x,y:base.y+1,z:base.z});check(lower&&(lower.isAir||lower.typeId==='minecraft:water')&&upper&&(upper.isAir||upper.typeId==='minecraft:water'),'SPACE_BLOCKED');const water=k=>k.typeId==='minecraft:water';let changes,orientation;
 if(id===CHALKBOARD){const f=chalkPlacementFacing(face,player.getRotation().y);orientation=f;changes=[{block:lower,permutation:BlockPermutation.resolve(CHALKBOARD,{'minecraft:cardinal_direction':f,[BOARD_HALF]:0,[CHALK_POSITION]:0,'kaleidoscope_tavern:waterlogged':water(lower)})},{block:upper,permutation:BlockPermutation.resolve(CHALKBOARD,{'minecraft:cardinal_direction':f,[BOARD_HALF]:1,[CHALK_POSITION]:0,'kaleidoscope_tavern:waterlogged':water(upper)})}];}
 else {const rot=boardRotation16(player.getRotation().y);orientation=rot;changes=[{block:lower,permutation:BlockPermutation.resolve(id,{[BOARD_HALF]:0,[BOARD_ROTATION]:rot,'kaleidoscope_tavern:waterlogged':water(lower)})},{block:upper,permutation:BlockPermutation.resolve(id,{[BOARD_HALF]:1,[BOARD_ROTATION]:rot,'kaleidoscope_tavern:waterlogged':water(upper)})}];}
 exchangeBlocks(player,placementTake(player),[],changes);if(id===CHALKBOARD&&!player.isSneaking)tryMergeChalk(clicked.dimension,base,orientation);diagnostics.placed++;return true;}
function removePair(block,id){const base=boardBase(block.location,block.permutation.getState(BOARD_HALF)),changes=[];for(const y of [0,1]){const b=blockAt(block.dimension,{x:base.x,y:base.y+y,z:base.z});if(b?.typeId===id)changes.push({block:b,permutation:BlockPermutation.resolve('minecraft:air')});}return {base,changes};}
function recoverBoard(player,block){canWrite(player);if(isSandwich(block.typeId)){const id=block.typeId,{base,changes}=removePair(block,id);exchangeBlocks(player,0,player.getGameMode()===GameMode.Creative?[]:[{id,count:1}],changes);removeGlyphs(block.dimension,boardRuntimeKey(block.dimension.id,base),base);world.setDynamicProperty(boardRuntimeKey(block.dimension.id,base),undefined);diagnostics.recovered++;return;}
 const root=boardKey(block).root,f=block.permutation.getState('minecraft:cardinal_direction'),position=block.permutation.getState(CHALK_POSITION),cw=cardinalOffset(f),wide=position!==0,base=root,key=boardRuntimeKey(block.dimension.id,base);const targets=wide?[{x:base.x+cw.x,y:base.y,z:base.z+cw.z},base,{x:base.x-cw.x,y:base.y,z:base.z-cw.z}]:[base],changes=[];for(const p of targets)for(const y of [0,1]){const b=blockAt(block.dimension,{x:p.x,y:p.y+y,z:p.z});if(b?.typeId===CHALKBOARD)changes.push({block:b,permutation:BlockPermutation.resolve('minecraft:air')});}exchangeBlocks(player,0,player.getGameMode()===GameMode.Creative?[]:[{id:CHALKBOARD,count:wide?3:1}],changes);removeGlyphs(block.dimension,key,base);for(const p of targets)world.setDynamicProperty(boardRuntimeKey(block.dimension.id,p),undefined);diagnostics.recovered++;}
function maintainBlock(block){const half=block.permutation.getState(BOARD_HALF),other=blockAt(block.dimension,plus(block.location,{x:0,y:half===0?1:-1,z:0}));if(!other)return;if(other.typeId!==block.typeId||other.permutation.getState(BOARD_HALF)===(half)){try{applyBlocks([{block,permutation:BlockPermutation.resolve('minecraft:air')}]);}catch(e){record(e);}return;}if(half!==0)return;if(block.typeId===CHALKBOARD){const pos=block.permutation.getState(CHALK_POSITION);if(pos===1||pos===3)return;}try{const info=currentInfo(block);syncGlyphs(block.dimension,info.root,info.data,block.location,info.key);}catch(e){record(e);}}
export function registerWritingBoardComponents({blockComponentRegistry:b,itemComponentRegistry:i}){b.registerCustomComponent(NS+':writing_board',{onTick:e=>maintainBlock(e.block),onPlayerInteract:nativeBlockUse});i.registerCustomComponent(NS+':place_writing_board',{onUseOn:e=>safe(e.source,()=>placeBoard(e.source,e.block,e.blockFace))});}
export function installWritingBoardEvents(){if(installed)return;installed=true;registerJavaBlockUseHandler(boardUseHandler);registerProtectedBreakRoute({id:'writing-boards',isBlock:b=>b&&(b.typeId===CHALKBOARD||isSandwich(b.typeId)),capture:({block})=>({id:block.typeId,half:block.permutation.getState(BOARD_HALF)}),verify:({block,snapshot})=>check(block.typeId===snapshot.id&&block.permutation.getState(BOARD_HALF)===snapshot.half,'BOARD_CHANGED'),recover:({player,block})=>recoverBoard(player,block)});}
export const WRITING_BOARD_DIAGNOSTICS=diagnostics;
