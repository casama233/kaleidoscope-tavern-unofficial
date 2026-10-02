/** Generate literal image controls. Never accept resource paths from a packet. */
import {readFileSync,writeFileSync} from 'node:fs';
import {EFFECT_ICONS} from '../runtime/BP/scripts/data/effect-icons.js';
import {EFFECT_ICON_PREFIX,EFFECT_ICON_SLOTS,effectIconToken} from '../runtime/BP/scripts/core/effect-icons.js';
const path=new URL('../runtime/RP/ui/hud_screen.json',import.meta.url),hud=JSON.parse(readFileSync(path,'utf8'));
const prefix=`(('%.${EFFECT_ICON_PREFIX.length}s' * #hud_title_text_string) = '${EFFECT_ICON_PREFIX}')`;
const panel={type:'panel',size:[160,80],anchor_from:'top_left',anchor_to:'top_left',offset:[4,52],controls:[
 {kt_effect_data:{type:'panel',size:[0,0],property_bag:{'#kt_effect_packet':''},bindings:[
  {binding_name:'#hud_title_text_string'},
  {binding_name:'#hud_title_text_string',binding_name_override:'#kt_effect_packet',binding_condition:'visibility_changed'},
  {binding_type:'view',source_property_name:`(not (#hud_title_text_string = #kt_effect_packet) and ${prefix})`,target_property_name:'#visible'}
 ]}}
]};
for(let slot=0;slot<EFFECT_ICON_SLOTS;slot++)for(const row of EFFECT_ICONS)panel.controls.push({['kt_effect_'+slot+'_'+row.code]:{
 type:'image',texture:row.texture,size:[18,18],offset:[(slot%8)*20,Math.floor(slot/8)*20],anchor_from:'top_left',anchor_to:'top_left',bilinear:false,layer:1,visible:false,
 property_bag:{'#kt_effect_packet':''},bindings:[
  {binding_type:'view',source_control_name:'kt_effect_data',source_property_name:'#kt_effect_packet',target_property_name:'#kt_effect_packet'},
  {binding_type:'view',source_property_name:`(not ((#kt_effect_packet - '${effectIconToken(slot,row.code)}') = #kt_effect_packet))`,target_property_name:'#visible'}
 ]
}});
hud.kt_effect_icons=panel;
// Keep all existing root modifications and every foreign/base control intact.
const modifications=hud.root_panel.modifications;
if(!modifications.some(m=>m.value?.some(v=>'kt_effect_icons@hud.kt_effect_icons' in v)))
 modifications.push({array_name:'controls',operation:'insert_back',value:[{'kt_effect_icons@hud.kt_effect_icons':{}}]});
const expected=JSON.stringify(hud)+'\n';
if(process.argv.includes('--check')){
 if(readFileSync(path,'utf8')!==expected)throw Error('Effect icon HUD differs from its authored generator');
}else writeFileSync(path,expected);
