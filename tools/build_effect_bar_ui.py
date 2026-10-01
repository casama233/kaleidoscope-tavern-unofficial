"""Update the canonical effect-view controls; never used as a packaging patch."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'runtime/RP/ui/hud_screen.json'
PREFIX='§r[KT:FX] '
x=json.loads(P.read_text())
x['kt_effect_wire']={'type':'panel','size':[0,0],'property_bag':{'#kt_payload':'$actionbar_text'}}
x['kt_effect_transport']={
 'type':'panel','size':[0,0],'property_bag':{'#kt_incoming':''},
 'factory':{'name':'hud_actionbar_text_factory','control_ids':{'hud_actionbar_text':'kt_effect_wire@hud.kt_effect_wire'}},
 'bindings':[{'binding_type':'view','source_control_name':'kt_effect_wire','source_property_name':'#kt_payload','target_property_name':'#kt_incoming'}]
}
x['kt_effect_cache']={
 'type':'panel','size':[0,0],'$kt_fx_prefix':PREFIX,
 'property_bag':{'#kt_incoming':'','#kt_preserved':''},
 'bindings':[
  {'binding_type':'view','source_control_name':'transport','resolve_sibling_scope':True,'source_property_name':'#kt_incoming','target_property_name':'#kt_incoming'},
  {'binding_type':'view','source_property_name':"(not (#kt_incoming = #kt_preserved) and (('%.10s' * #kt_incoming) = $kt_fx_prefix))",'target_property_name':'#visible'},
  {'binding_type':'view','source_property_name':'#kt_incoming','target_property_name':'#kt_preserved','binding_condition':'always_when_visible'}
 ]
}
x['kt_effect_label']={
 'type':'label','size':['100%',12],'anchor_from':'bottom_middle','anchor_to':'bottom_middle','offset':[0,-88],
 'layer':41,'localize':False,'text':'#text','text_alignment':'center','font_size':'small','shadow':True,'color':[1,1,1],
 '$kt_fx_prefix':PREFIX,
 'bindings':[
  {'binding_type':'view','source_control_name':'cache','resolve_sibling_scope':True,'source_property_name':'(#kt_preserved - $kt_fx_prefix)','target_property_name':'#text'},
  {'binding_type':'view','source_property_name':"(not (#text = ''))",'target_property_name':'#visible'}
 ]
}
x['kt_effect_view']={'type':'panel','size':['100%','100%'],'controls':[{'transport@hud.kt_effect_transport':{}},{'cache@hud.kt_effect_cache':{}},{'label@hud.kt_effect_label':{}}]}
mods=x['root_panel']['modifications'];name='kt_effects@hud.kt_effect_view'
if not any(name in str(m) for m in mods):mods.append({'array_name':'controls','operation':'insert_back','value':[{name:{}}]})
for key in ['hud_actionbar_text','hud_actionbar_text/actionbar_message']:
 old=x[key]['visible']
 if PREFIX not in old:x[key]['visible']=f"({old} and (not (('%.10s' * $kt_actionbar_text) = '{PREFIX}')))"
P.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
