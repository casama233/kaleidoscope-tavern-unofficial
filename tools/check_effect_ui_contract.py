"""Structural JSON UI contract. This is not a client renderer."""
from pathlib import Path
import argparse,copy,json
ROOT=Path(__file__).resolve().parents[1]
def read(path):return json.loads(Path(path).read_text())
def registered_definitions(rp):
 result={};index=rp/'ui/_ui_defs.json'
 for name in read(index).get('ui_defs',[]) if index.exists() else []:
  source=read(rp/name);namespace=source['namespace']
  # Registration defines/replaces controls. It cannot act as another vanilla
  # hud_screen patch: a modifications-only root destroys the original HUD.
  if namespace=='hud' and any(k.split('@')[0].split('/')[0] in {'root_panel','hud_title_text','hud_actionbar_text','mob_effects_renderer'} for k in source if k!='namespace'):
   raise ValueError('Registered UI file must not redefine native hud controls: '+name)
  for key,value in source.items():
   if key!='namespace':result[namespace+'.'+key]=value
 return result
def typed_controls(panel):
 if not isinstance(panel,dict) or 'type' not in panel:raise ValueError('Missing concrete UI control type')
 if 'modifications' in panel:raise ValueError('Unapplied modifications in a standalone definition')
 for control in panel.get('controls',[]):
  for name,child in control.items():
   if '@' not in name:typed_controls(child)
def effect_icon_bindings(panel,cache_name):
 controls={name:child for control in panel.get('controls',[]) for name,child in control.items()}
 if cache_name not in controls:raise ValueError('Missing effect packet cache: '+cache_name)
 packet_name='#'+cache_name.removesuffix('_data')+'_packet'
 data=controls[cache_name];bindings=data.get('bindings',[])
 if data.get('type')!='panel' or data.get('property_bag',{}).get(packet_name)!= '' or not any(binding.get('binding_name')=='#hud_title_text_string' and binding.get('binding_name_override')==packet_name and binding.get('binding_condition')=='visibility_changed' for binding in bindings):
  raise ValueError('Missing typed title-capture packet cache: '+cache_name)
 images=[child for child in controls.values() if child.get('type')=='image']
 if not images:raise ValueError('Missing literal effect image controls')
 for image in images:
  cache=[binding for binding in image.get('bindings',[]) if binding.get('source_control_name')==cache_name]
  if len(cache)!=1 or cache[0].get('binding_type')!='view' or cache[0].get('resolve_sibling_scope') is not True or cache[0].get('source_property_name')!=packet_name or cache[0].get('target_property_name')!=packet_name:
   raise ValueError('Effect image must resolve sibling packet cache: '+cache_name)
 return len(images)
def audit(root=ROOT,liquor=None):
 hud=read(root/'runtime/RP/ui/hud_screen.json');native=read(root/'data/hud-native-reference.json')['root_panel']
 assert native['type']=='panel' and len(native['controls'])>20
 patch=hud['root_panel'];assert set(patch)=={'modifications'}
 merged=copy.deepcopy(native)
 for row in patch['modifications']:
  assert row['array_name']=='controls' and row['operation']=='insert_back'
  merged['controls'].extend(copy.deepcopy(row['value']))
 assert merged['type']==native['type'] and merged['controls'][:len(native['controls'])]==native['controls']
 assert {k:v for k,v in merged.items() if k!='controls'}=={k:v for k,v in native.items() if k!='controls'}
 own=registered_definitions(root/'runtime/RP');own.update({'hud.'+k:v for k,v in hud.items() if k not in ['namespace','root_panel']})
 panel=hud['kt_effect_icons'];typed_controls(panel);effect_icon_bindings(panel,'kt_effect_data')
 variable='$kt_world_liquor_effect_panel';default=panel[variable+'|default'];assert default=='hud.kt_effect_empty'
 assert panel['controls'][-1]=={'kt_optional_world_icons@'+variable:{}}
 assert own[default]['type']=='panel' and own[default]['size']==[0,0]
 selected=default
 if liquor:
  rp=liquor/'runtime/RP';addon=registered_definitions(rp);globals=read(rp/'ui/_global_variables.json')
  assert set(globals)=={variable};selected=globals[variable];assert selected in addon
  assert selected=='kaleidoscope_world_liquor_effects.effect_panel'
  typed_controls(addon[selected]);effect_icon_bindings(addon[selected],'kwl_effect_data');assert addon[selected]['offset']==[0,0]
  # The two resource orders have disjoint definitions and the host has only a
  # local default. Optional global selection is therefore independent of order.
  assert not (set(addon)&set(own))
  for definitions in [{**own,**addon},{**addon,**own}]:assert definitions[selected]==addon[selected]
 return {'ok':True,'native_root_type_preserved':True,'native_root_controls_preserved':len(native['controls']),'selected_optional_panel':selected,'registered_native_root_redefinitions':0,'resource_order_independent':True,'client':False,'scope':'Pinned Mojang root preservation and typed optional-control resolution; no rendered-client claim.'}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--liquor',type=Path);a=p.parse_args();print(json.dumps(audit(a.root,a.liquor)))
