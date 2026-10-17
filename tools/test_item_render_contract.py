"""Static native item routes and pinned-source contexts; no simulated players."""
import copy
import json
import unittest
from item_render_contract import ROOT,SPRITE_REPLACEMENTS,CONTEXTS,planned,read,check_or_write
class RenderContracts(unittest.TestCase):
 def test_exact_source_coverage(self):
  rows=check_or_write();self.assertEqual(93,len(rows));self.assertEqual(19,sum(r['route']=='generated_sprite' for r in rows));self.assertEqual(74,sum(r['route']=='native_geometry' for r in rows))
 def test_sprite_registration_and_placement(self):
  atlas=read(ROOT/'runtime/RP/textures/item_texture.json')['texture_data']
  for short in SPRITE_REPLACEMENTS:
   c=read(ROOT/f'runtime/BP/items/{short}.json')['minecraft:item']['components']
   self.assertIn(c['minecraft:icon'],atlas)
   self.assertTrue(c['minecraft:block_placer']['replace_block_item'])
   self.assertEqual('kaleidoscope_tavern:'+short,c['minecraft:block_placer']['block'])
   if short=='tap':self.assertNotIn('use_on',c['minecraft:block_placer'])
   else:self.assertEqual([{'tags':'0'}],c['minecraft:block_placer']['use_on'])
 def test_geometry_routes_do_not_keep_flat_icons(self):
  _,rows=planned()
  for row in rows:
   if row['route']!='native_geometry':continue
   p=ROOT/'runtime/BP/items'/f"{row['id'].split(':')[1]}.json"
   if p.exists():
    c=read(p)['minecraft:item']['components'];self.assertNotIn('minecraft:icon',c);self.assertEqual(row['block'],c['minecraft:block_placer']['block'])
 def test_named_face_materials_preserve_unshaded_faces(self):
  files,rows=planned()
  for row in rows:
   if row['route']!='native_geometry':continue
   block=read(ROOT/'runtime/BP/blocks'/f"{row['block'].split(':')[1]}.json")['minecraft:block']
   mats=block['components']['minecraft:item_visual']['material_instances']
   self.assertIs(False,mats['unshaded']['face_dimming'])
   self.assertEqual(mats['*']['texture'],mats['unshaded']['texture'])
 def test_left_hand_falls_back_to_java_right_hand(self):
  g=read(ROOT/'runtime/RP/models/entity/item_display_bar_counter.geo.json')['minecraft:geometry'][0]
  self.assertEqual(g['item_display_transforms']['thirdperson_righthand'],g['item_display_transforms']['thirdperson_lefthand'])
 def test_per_context_explicit_not_autofit(self):
  files,_=planned()
  for p,j in files.items():
   if 'minecraft:geometry' not in j:continue
   transforms=j['minecraft:geometry'][0]['item_display_transforms'];self.assertEqual(set(CONTEXTS),set(transforms));self.assertIs(False,transforms['gui']['fit_to_frame'])
   for c in CONTEXTS:
    for k in ['rotation','translation','scale']:self.assertEqual(3,len(transforms[c][k]))
 def test_sprite_world_models_remain_separate(self):
  for short in SPRITE_REPLACEMENTS:
   b=read(ROOT/f'runtime/BP/blocks/{short}.json')['minecraft:block'];self.assertIn('minecraft:geometry',b['components'])
   if short.endswith('_painting'):
    self.assertEqual('geometry.kt_runtime.painting_wall',b['components']['minecraft:geometry']['identifier'])
    self.assertGreaterEqual(len(b['permutations']),3)
if __name__=='__main__':unittest.main()
