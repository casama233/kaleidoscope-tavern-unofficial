"""Reproduce the reported registered-root failure and enforce the fixed boundary."""
import json,tempfile,unittest
from pathlib import Path
from check_effect_ui_contract import ROOT,read,audit,registered_definitions,typed_controls,effect_icon_bindings,family_bridge
from hud_mount_contract import reject_local_provider_defaults
class Contract(unittest.TestCase):
 def test_actual_failure_shape_is_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   rp=Path(tmp);(rp/'ui').mkdir()
   (rp/'ui/_ui_defs.json').write_text(json.dumps({'ui_defs':['ui/old_icons.json']}))
   (rp/'ui/old_icons.json').write_text(json.dumps({'namespace':'hud','root_panel':{'modifications':[{'array_name':'controls','operation':'insert_back','value':[{'kwl_effect_icons@hud.kwl_effect_icons':{}}]}]}}))
   with self.assertRaisesRegex(ValueError,'redefine native hud'):registered_definitions(rp)
 def test_typed_addon_panel_and_native_root_are_distinct(self):
  with tempfile.TemporaryDirectory() as tmp:
   rp=Path(tmp);(rp/'ui').mkdir();(rp/'ui/_ui_defs.json').write_text(json.dumps({'ui_defs':['ui/icons.json']}))
   (rp/'ui/icons.json').write_text(json.dumps({'namespace':'kaleidoscope_world_liquor_effects','effect_panel':{'type':'panel','controls':[{'cache':{'type':'panel','size':[0,0]}}]}}))
   defs=registered_definitions(rp);typed_controls(defs['kaleidoscope_world_liquor_effects.effect_panel'])
   self.assertNotIn('hud.root_panel',defs)
 def test_missing_types_or_unapplied_patch_are_rejected(self):
  with self.assertRaises(ValueError):typed_controls({'controls':[]})
  with self.assertRaises(ValueError):typed_controls({'type':'panel','modifications':[]})
 def test_native_controls_and_standalone_empty_base_survive(self):
  report=audit();self.assertGreater(report['native_root_controls_preserved'],20);self.assertEqual(report['selected_optional_panel'],'hud.kt_family_empty')
 def test_global_provider_cannot_be_shadowed_by_local_empty_default(self):
  # This is the old live failure shape, overlooked by globals.get(...,default).
  bridge=read(ROOT/'runtime/RP/ui/hud_screen.json')
  for key in ('$kt_tavern_hud_root','$kg_grilling_hud_root'):
   bridge['root_panel'][key+'|default']='hud.kt_family_empty'
   with self.assertRaisesRegex(AssertionError,'shadows global provider'):family_bridge(bridge)
   del bridge['root_panel'][key+'|default']
  foreign=read(ROOT/'runtime/RP/ui/kt_tavern_hud.json')
  foreign['kt_effect_icons']['$kt_world_liquor_effect_panel|default']='kaleidoscope_tavern_hud.kt_effect_empty'
  with self.assertRaisesRegex(AssertionError,'shadows global provider'):reject_local_provider_defaults(foreign)
 def test_family_bridge_rejects_the_live_single_port_mount(self):
  bridge=read(ROOT/'runtime/RP/ui/hud_screen.json');family_bridge(bridge)
  bridge['root_panel']['modifications'][0]['value'].pop(1)
  with self.assertRaises(AssertionError):family_bridge(bridge)
 def test_effect_images_require_explicit_sibling_cache_resolution(self):
  for cache in ['kt_effect_data','kwl_effect_data']:
   packet='#'+cache.removesuffix('_data')+'_packet'
   binding={'binding_type':'view','source_control_name':cache,'source_property_name':packet,'target_property_name':packet}
   data={'type':'panel','size':[0,0],'property_bag':{packet:''},'bindings':[{'binding_name':'#hud_title_text_string','binding_name_override':packet,'binding_condition':'visibility_changed'}]}
   panel={'type':'panel','controls':[{cache:data},{'icon':{'type':'image','bindings':[binding]}}]}
   with self.assertRaisesRegex(ValueError,'resolve sibling'):effect_icon_bindings(panel,cache)
   binding['resolve_sibling_scope']=False
   with self.assertRaisesRegex(ValueError,'resolve sibling'):effect_icon_bindings(panel,cache)
   binding['resolve_sibling_scope']=True
   self.assertEqual(effect_icon_bindings(panel,cache),1)
   for property_name in ['source_property_name','target_property_name']:
    binding[property_name]='#wrong'
    with self.assertRaisesRegex(ValueError,'resolve sibling'):effect_icon_bindings(panel,cache)
    binding[property_name]=packet
   data['bindings']=[]
   with self.assertRaisesRegex(ValueError,'title-capture'):effect_icon_bindings(panel,cache)
if __name__=='__main__':unittest.main()
