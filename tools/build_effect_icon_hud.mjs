/** Generate literal image controls. Never accept resource paths from a packet. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {EFFECT_ICONS} from '../runtime/BP/scripts/data/effect-icons.js';
import {EFFECT_ICON_PREFIX,EFFECT_ICON_SLOTS,effectIconToken} from '../runtime/BP/scripts/core/effect-icons.js';
const addonIndex=process.argv.indexOf('--world-liquor');
const extension=addonIndex>=0;
const path=extension?resolve(process.argv[addonIndex+1],'runtime/RP/ui/kt_world_liquor_effects.json'):new URL('../runtime/RP/ui/hud_screen.json',import.meta.url);
const hud=extension?{namespace:'hud'}:JSON.parse(readFileSync(path,'utf8'));
const prefix=`(('%.${EFFECT_ICON_PREFIX.length}s' * #hud_title_text_string) = '${EFFECT_ICON_PREFIX}')`;
const panel={type:'panel',size:[160,80],anchor_from:'top_left',anchor_to:'top_left',offset:[4,52],controls:[
 {kt_effect_data:{type:'panel',size:[0,0],property_bag:{'#kt_effect_packet':''},bindings:[
  {binding_name:'#hud_title_text_string'},
  {binding_name:'#hud_title_text_string',binding_name_override:'#kt_effect_packet',binding_condition:'visibility_changed'},
  {binding_type:'view',source_property_name:`(not (#hud_title_text_string = #kt_effect_packet) and ${prefix})`,target_property_name:'#visible'}
 ]}}
]};
const rows=EFFECT_ICONS.filter(row=>row.id.startsWith(extension?'kaleidoscope_world_liquor:':'kaleidoscope_tavern:'));
for(let slot=0;slot<EFFECT_ICON_SLOTS;slot++)for(const row of rows)panel.controls.push({['kt_effect_'+slot+'_'+row.code]:{
 type:'image',texture:row.texture,size:[18,18],offset:[(slot%8)*20,Math.floor(slot/8)*20],anchor_from:'top_left',anchor_to:'top_left',bilinear:false,layer:1,visible:false,
 property_bag:{'#kt_effect_packet':''},bindings:[
  {binding_type:'view',source_control_name:'kt_effect_data',source_property_name:'#kt_effect_packet',target_property_name:'#kt_effect_packet'},
  {binding_type:'view',source_property_name:`(not ((#kt_effect_packet - '${effectIconToken(slot,row.code)}') = #kt_effect_packet))`,target_property_name:'#visible'}
 ]
}});
// The addon gets a unique definition file and its own prefix-scoped cache. It
// never replaces hud_screen.json or requires cross-panel control lookup.
const panelName=extension?'kwl_effect_icons':'kt_effect_icons';
hud[panelName]=extension?JSON.parse(JSON.stringify(panel).replaceAll('kt_effect_data','kwl_effect_data').replaceAll('kt_effect_packet','kwl_effect_packet').replaceAll('"kt_effect_','"kwl_effect_')):panel;
// Keep all existing root modifications and every foreign/base control intact.
if(extension)hud.root_panel={modifications:[]};
const modifications=hud.root_panel.modifications;
const reference=panelName+'@hud.'+panelName;
if(!modifications.some(m=>m.value?.some(v=>reference in v)))
 modifications.push({array_name:'controls',operation:'insert_back',value:[{[reference]:{}}]});
const expected=JSON.stringify(hud)+'\n';
if(process.argv.includes('--check')){
 if(readFileSync(path,'utf8')!==expected)throw Error('Effect icon HUD differs from its authored generator');
}else {if(extension)mkdirSync(dirname(path),{recursive:true});writeFileSync(path,expected);}
