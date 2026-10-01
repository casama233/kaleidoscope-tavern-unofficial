import unittest
import nbtlib
from family_saved_world import encode,transform,move_owners,has_inventory_items

class OwnerMigrationTests(unittest.TestCase):
 def test_world_owner_retains_typed_values(self):
  old=nbtlib.File({'private':nbtlib.Compound({'flag':nbtlib.Byte(1),'lore':nbtlib.String('保留'),'value':nbtlib.Double(1.25)}),'unrelated':nbtlib.Compound({'keep':nbtlib.Int(4)})})
  raw,count=transform(encode(old),{'private':'public'},True)
  import io
  new=nbtlib.File.parse(io.BytesIO(raw),byteorder='little')
  self.assertEqual(count,1);self.assertNotIn('private',new);self.assertEqual(new['public'],old['private']);self.assertEqual(new['unrelated'],old['unrelated'])
 def test_nested_inventory_dynamic_properties_and_item_identity(self):
  item=nbtlib.Compound({'Name':nbtlib.String('minecraft:stick'),'Count':nbtlib.Byte(3),'tag':nbtlib.Compound({'display':nbtlib.Compound({'Name':nbtlib.String('named')}),'DynamicProperties':nbtlib.Compound({'private':nbtlib.Compound({'quality':nbtlib.Int(5)})})})})
  f=nbtlib.File({'Inventory':nbtlib.List[nbtlib.Compound]([item]),'other_uuid_string':nbtlib.String('private')})
  raw,count=transform(encode(f),{'private':'public'})
  import io
  new=nbtlib.File.parse(io.BytesIO(raw),byteorder='little');self.assertEqual(count,1)
  self.assertEqual(new['Inventory'][0]['Name'],item['Name']);self.assertEqual(new['Inventory'][0]['Count'],item['Count']);self.assertEqual(new['other_uuid_string'],'private')
  self.assertIn('public',new['Inventory'][0]['tag']['DynamicProperties'])
 def test_conflicting_target_rejected_without_writing(self):
  c=nbtlib.Compound({'private':nbtlib.Compound({'k':nbtlib.Int(1)}),'public':nbtlib.Compound({'k':nbtlib.Int(2)})})
  with self.assertRaises(ValueError):move_owners(c,{'private':'public'})
  self.assertEqual(c['public']['k'],2)
 def test_same_target_property_is_preserved(self):
  c=nbtlib.Compound({'private':nbtlib.Compound({'k':nbtlib.Int(1)}),'public':nbtlib.Compound({'k':nbtlib.Int(1),'extra':nbtlib.String('keep')})})
  move_owners(c,{'private':'public'});self.assertEqual(c['public']['extra'],'keep')
 def test_no_owners_returns_exact_bytes(self):
  raw=encode(nbtlib.File({'other':nbtlib.String('private')}));self.assertEqual(transform(raw,{'private':'public'}),(raw,0))
 def test_unparsed_suffix_rejected(self):
  with self.assertRaises(ValueError):transform(encode(nbtlib.File())+b'junk',{'private':'public'})
 def test_chest_items_are_not_discarded(self):
  entity=nbtlib.Compound({'ChestItems':nbtlib.List[nbtlib.Compound]([nbtlib.Compound({'Count':nbtlib.Byte(3),'Name':nbtlib.String('minecraft:bowl')})])})
  self.assertTrue(has_inventory_items(entity))
 def test_empty_equipment_slots_are_empty(self):
  entity=nbtlib.Compound({'Armor':nbtlib.List[nbtlib.Compound]([nbtlib.Compound({'Count':nbtlib.Byte(0),'Name':nbtlib.String('')})])})
  self.assertFalse(has_inventory_items(entity))
if __name__=='__main__':unittest.main()
