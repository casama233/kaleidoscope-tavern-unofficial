/** Generate literal image controls. Never accept resource paths from a packet. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {effectIconPrefixExpression} from './effect-icon-ui-prefix.mjs';
import {EFFECT_ICONS} from '../runtime/BP/scripts/data/effect-icons.js';
import {EFFECT_ICON_SLOTS,effectIconToken} from '../runtime/BP/scripts/core/effect-icons.js';
const addonIndex=process.argv.indexOf('--world-liquor');
const extension=addonIndex>=0;
const path=extension?resolve(process.argv[addonIndex+1],'runtime/RP/ui/kt_world_liquor_effects.json'):new URL('../runtime/RP/ui/hud_screen.json',import.meta.url);
const hud=extension?{namespace:'kaleidoscope_world_liquor_effects'}:JSON.parse(readFileSync(path,'utf8'));
const prefix=effectIconPrefixExpression();
const panel={type:'panel',size:[160,80],anchor_from:'top_left',anchor_to:'top_left',offset:[4,52],controls:[
 {kt_effect_data:{type:'panel',size:[0,0],property_bag:{'#kt_effect_packet':''},bindings:[
  {binding_name:'#hud_subtitle_text_string'},
  // Only reserved snapshots open the cache. A foreign subtitle closes it without
  // overwriting the last accepted packet; consecutive owned updates remain live.
  {binding_type:'view',source_property_name:prefix,target_property_name:'#visible'},
  {binding_name:'#hud_subtitle_text_string',binding_name_override:'#kt_effect_packet',binding_condition:'always_when_visible'}
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
// A registered definition file creates definitions; it is not a second patch
// to vanilla hud.root_panel. Only the host's original hud_screen patch mounts UI.
if(extension){
 panel.offset=[0,0];
 hud.effect_panel=JSON.parse(JSON.stringify(panel).replaceAll('kt_effect_data','kwl_effect_data').replaceAll('kt_effect_packet','kwl_effect_packet').replaceAll('"kt_effect_','"kwl_effect_'));
}else{
 panel['$kt_world_liquor_effect_panel|default']='hud.kt_effect_empty';
 panel.controls.push({'kt_optional_world_icons@$kt_world_liquor_effect_panel':{}});
 hud.kt_effect_empty={type:'panel',size:[0,0]};
 hud.kt_effect_icons=panel;
 const modifications=hud.root_panel.modifications;
 if(!modifications.some(m=>m.value?.some(v=>'kt_effect_icons@hud.kt_effect_icons' in v)))
  modifications.push({array_name:'controls',operation:'insert_back',value:[{'kt_effect_icons@hud.kt_effect_icons':{}}]});
}
const expected=JSON.stringify(hud)+'\n';
if(process.argv.includes('--check')){
 if(readFileSync(path,'utf8')!==expected)throw Error('Effect icon HUD differs from its authored generator');
}else {if(extension)mkdirSync(dirname(path),{recursive:true});writeFileSync(path,expected);}
