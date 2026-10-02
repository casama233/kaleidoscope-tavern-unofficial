"""Reproduce the reported registered-root failure and enforce the fixed boundary."""
import json,tempfile,unittest
from pathlib import Path
from check_effect_ui_contract import audit,registered_definitions,typed_controls
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
  report=audit();self.assertGreater(report['native_root_controls_preserved'],20);self.assertEqual(report['selected_optional_panel'],'hud.kt_effect_empty')
if __name__=='__main__':unittest.main()
