"""Structural JSON UI contract. This is not a client renderer."""
from pathlib import Path
import argparse,copy,json
from hud_mount_contract import EMPTY,global_catalog,reject_local_provider_defaults,resolve_global_catalog
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
def audit(root=ROOT,liquor=None,grilling=None):
 hud=read(root/'runtime/RP/ui/hud_screen.json');tavern=read(root/'runtime/RP/ui/kt_tavern_hud.json');native=read(root/'data/hud-native-reference.json')['root_panel']
 assert native['type']=='panel' and len(native['controls'])>20
 patch=hud['root_panel'];family_bridge(hud)
 merged=copy.deepcopy(native)
 for row in patch['modifications']:
  assert row['array_name']=='controls' and row['operation']=='insert_back'
  merged['controls'].extend(copy.deepcopy(row['value']))
 assert merged['type']==native['type'] and merged['controls'][:len(native['controls'])]==native['controls']
 assert {k:v for k,v in merged.items() if k!='controls'}=={k:v for k,v in native.items() if k!='controls'}
 own=registered_definitions(root/'runtime/RP');own.update({'hud.'+k:v for k,v in hud.items() if k not in ['namespace','root_panel']})
 assert tavern['namespace']=='kaleidoscope_tavern_hud'
 typed_controls(tavern['root'])
 assert tavern['root']['controls'][:2]==[{'kt_mixology@kaleidoscope_tavern_hud.kt_mixology_factory':{}},{'kt_effect_icons@kaleidoscope_tavern_hud.kt_effect_icons':{}}]
 host_globals=read(root/'runtime/RP/ui/_global_variables.json')
 assert host_globals==global_catalog('tavern')
 reject_local_provider_defaults(tavern)
 assert 'kaleidoscope_tavern_hud.root' in own
 panel=tavern['kt_effect_icons'];typed_controls(panel);effect_icon_bindings(panel,'kt_effect_data')
 variable='$kt_world_liquor_effect_panel';default=resolve_global_catalog(host_globals)[variable];assert default==EMPTY
 assert panel['controls'][-1]=={'kt_optional_world_icons@'+variable:{}}
 assert own[default]['type']=='panel' and own[default]['size']==[0,0]
 selected=default
 if liquor:
  rp=liquor/'runtime/RP';addon=registered_definitions(rp);globals=read(rp/'ui/_global_variables.json')
  assert set(globals)=={variable};selected=globals[variable];assert selected in addon
  assert selected=='kaleidoscope_world_liquor_effects.effect_panel'
  typed_controls(addon[selected]);effect_icon_bindings(addon[selected],'kwl_effect_data');assert addon[selected]['offset']==[0,0]
  # Provider and fallback are in the same scope. No local empty value may
  # shadow the optional global provider before its control is instantiated.
  assert not (set(addon)&set(own))
  for definitions in [{**own,**addon},{**addon,**own}]:assert definitions[selected]==addon[selected]
 paired=False
 if grilling:
  peer=grilling/'projects/grilling/gameplay_core/resource_pack'
  assert (root/'runtime/RP/ui/hud_screen.json').read_bytes()==(peer/'ui/hud_screen.json').read_bytes(),'Family HUD bridges differ'
  peer_defs=registered_definitions(peer);peer_globals=read(peer/'ui/_global_variables.json')
  assert not (set(peer_defs)&set(own)),'Family registered namespaces collide'
  assert peer_globals==global_catalog('grilling')
  assert 'kaleidoscope_grilling_hud.root' in peer_defs
  typed_controls(peer_defs['kaleidoscope_grilling_hud.root'])
  pairs=[(own,read(root/'runtime/RP/ui/_global_variables.json')),(peer_defs,peer_globals)]
  for ordered in [pairs,list(reversed(pairs))]:
   definitions={'hud.kt_family_empty':hud['kt_family_empty']};globals={}
   for catalog,variables in ordered:definitions.update(catalog);globals.update(variables)
   assert optional_mounts(hud,definitions,globals)==['kaleidoscope_tavern_hud.root','kaleidoscope_grilling_hud.root','hud.kt_family_empty','hud.kt_family_empty']
  # A missing port must resolve to a typed empty panel, never an unknown base.
  assert optional_mounts(hud,own,read(root/'runtime/RP/ui/_global_variables.json'))==['kaleidoscope_tavern_hud.root','hud.kt_family_empty','hud.kt_family_empty','hud.kt_family_empty']
  assert optional_mounts(hud,{'hud.kt_family_empty':hud['kt_family_empty'],**peer_defs},peer_globals)==['hud.kt_family_empty','kaleidoscope_grilling_hud.root','hud.kt_family_empty','hud.kt_family_empty']
  paired=True
 return {'ok':True,'native_root_type_preserved':True,'native_root_controls_preserved':len(native['controls']),'selected_optional_panel':selected,'registered_native_root_redefinitions':0,'family_optional_roots':2,'paired_grilling_bridge_verified':paired,'resource_order_independent':True,'client':False,'scope':'Pinned Mojang root preservation, optional-control and matching family-bridge catalog resolution; no rendered-client claim.'}

def optional_mounts(hud,definitions,globals):
 result=[]
 for instance in hud['root_panel']['modifications'][0]['value']:
  variable=next(iter(instance)).split('@',1)[1]
  if not variable.startswith('$'):
   typed_controls(definitions[variable]);continue
  reject_local_provider_defaults(hud)
  selected=resolve_global_catalog(globals)[variable]
  assert selected in definitions,'Unresolved optional HUD root: '+selected
  typed_controls(definitions[selected]);result.append(selected)
 return result

def family_bridge(hud):
 """Both public ports mount both optional roots through the same minimal file.

 Keep packet renderers in registered, separate namespaces so selection of one
 highest-priority family bridge cannot omit the other port's renderer.
 """
 assert hud['namespace']=='hud'
 reject_local_provider_defaults(hud)
 assert set(hud)=={'namespace','kt_family_empty','root_panel','hud_actionbar_text','hud_actionbar_text/actionbar_message','not_centered_gui_elements','centered_gui_elements_at_bottom_middle','centered_gui_elements_at_bottom_middle_touch'}
 assert hud['kt_family_empty']=={'type':'panel','size':[0,0]}
 patch=hud['root_panel']
 assert set(patch)=={'type','modifications'} and patch['type']=='panel'
 assert patch['modifications']==[{'array_name':'controls','operation':'insert_back','value':[{'kt_family_tavern@$kt_tavern_hud_root':{}},{'kt_family_grilling@$kg_grilling_hud_root':{}},{'kt_optional_amw@$senluo_amw_hud_root':{}},{'kt_optional_amw_boss@$senluo_amw_boss_root':{}}]}]
 # Native title/effect controls remain outside the graphical actionbar route.
 assert 'hud_title_text' not in hud
 for leaf,var in [('not_centered_gui_elements','$senluo_saturation_non_centered'),('centered_gui_elements_at_bottom_middle','$senluo_saturation_centered'),('centered_gui_elements_at_bottom_middle_touch','$senluo_saturation_touch')]:
  append=hud[leaf]['modifications'];assert len(append)==1 and append[0]['operation']=='insert_back'
  wrapper=next(iter(append[0]['value'][0].values()))
  typed_controls(wrapper)
 for key in ['hud_actionbar_text','hud_actionbar_text/actionbar_message']:
  assert set(hud[key])=={'$kt_family_actionbar_text','visible'}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--liquor',type=Path);p.add_argument('--grilling',type=Path);a=p.parse_args();print(json.dumps(audit(a.root,a.liquor,a.grilling)))
