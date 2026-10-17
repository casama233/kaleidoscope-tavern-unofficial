import unittest,io,json,struct
from pathlib import Path
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
 def test_numerically_equal_values_with_different_nbt_types_conflict(self):
  c=nbtlib.Compound({'private':nbtlib.Compound({'k':nbtlib.Int(1)}),'public':nbtlib.Compound({'k':nbtlib.Double(1)})})
  with self.assertRaisesRegex(ValueError,'typed property'):move_owners(c,{'private':'public'})
  self.assertIs(type(c['public']['k']),nbtlib.Double)
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
class AuthorStateMigrationTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  from author_state_migration import validate_profile
  cls.profile=json.loads((Path(__file__).resolve().parents[1]/'family/identity-migrations/stable-author-20261016.json').read_text())['block_states']
  cls.rules=validate_profile(cls.profile)
 def block(self,kind,**overrides):
  rule=next(r for r in self.rules.values() if r['conversion']==kind)
  states={k:(nbtlib.Byte(v[0]) if type(v[0]) is bool else nbtlib.Int(v[0]) if type(v[0]) is int else nbtlib.String(v[0])) for k,v in rule['before_states'].items()}
  for k,v in overrides.items():states['kaleidoscope_cookery:'+k]=v
  return nbtlib.File({'name':nbtlib.String(rule['identifier']),'states':nbtlib.Compound(states),'version':nbtlib.Int(18087936),'extra':nbtlib.String('keep exact')})
 def test_carpet_color_and_absence_cross_bank_boundaries(self):
  from author_state_migration import convert_block,COLORS
  expected=[(1,0),(2,0),(3,0),(4,0),(5,0),(6,0),(7,0),(8,0),(0,1),(1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1)]
  for kind,stem,key in [('chair_carpet','chair','carpet_color'),('table_carpet','table','table_carpet')]:
   for color,pair in zip(COLORS,expected):
    for present in (False,True):
     tag=self.block(kind,**{key:nbtlib.String(color),'has_carpet':nbtlib.Byte(present)});self.assertEqual(convert_block(tag,self.rules),1)
     state=tag['states'];self.assertEqual((state['kaleidoscope_cookery:'+stem+'_carpet_slot'],state['kaleidoscope_cookery:'+stem+'_carpet_bank']),pair if present else (0,0))
     self.assertEqual(convert_block(tag,self.rules),0);self.assertEqual(tag['extra'],'keep exact')
 def test_oil_full_boolean_to_integer_high_preserves_all_33_amounts(self):
  from author_state_migration import convert_block
  for amount in range(33):
   tag=self.block('basin_oil',oil_low=nbtlib.Int(0 if amount==32 else amount%16),oil_high=nbtlib.Byte(amount>=16 and amount<32),oil_full=nbtlib.Byte(amount==32));lid=tag['states']['kaleidoscope_cookery:has_lid']
   convert_block(tag,self.rules);state=tag['states']
   self.assertEqual(state['kaleidoscope_cookery:oil_low']+state['kaleidoscope_cookery:oil_high']*11,amount)
   self.assertIs(type(state['kaleidoscope_cookery:oil_high']),nbtlib.Int);self.assertEqual(state['kaleidoscope_cookery:has_lid'],lid)
   self.assertNotIn('kaleidoscope_cookery:oil_full',state)
 def test_board_progress_and_nested_item_data_survive_owner_move(self):
  board=self.block('board_mode',board_has_food=nbtlib.Byte(1),board_model=nbtlib.Int(12),cut_stage=nbtlib.Int(4),extension_board_model=nbtlib.Int(2),extension_board_recovery=nbtlib.Int(13))
  item=nbtlib.Compound({'Name':nbtlib.String('kaleidoscope_cookery:chopping_board'),'Count':nbtlib.Byte(1),'Block':nbtlib.Compound(board),'tag':nbtlib.Compound({'DynamicProperties':nbtlib.Compound({'old':nbtlib.Compound({'quality':nbtlib.Double(1.25)})})})})
  raw,owners,states=transform(encode(nbtlib.File({'Inventory':nbtlib.List[nbtlib.Compound]([item])})),{'old':'new'},state_rules=self.rules)
  new=nbtlib.File.parse(io.BytesIO(raw),byteorder='little')['Inventory'][0]
  self.assertEqual((owners,states),(1,1));self.assertEqual(new['Count'],1);self.assertEqual(new['tag']['DynamicProperties']['new']['quality'],1.25)
  for key in ('board_model','cut_stage','extension_board_recovery'):self.assertEqual(new['Block']['states']['kaleidoscope_cookery:'+key],board['states']['kaleidoscope_cookery:'+key])
  self.assertEqual(new['Block']['states']['kaleidoscope_cookery:extension_board_model'],3)
  self.assertNotIn('kaleidoscope_cookery:board_has_food',new['Block']['states'])
 def test_board_empty_builtin_and_native_slots_keep_their_recovery_route(self):
  from author_state_migration import convert_block
  for present,old_mode,expected in [(0,0,0),(0,1,0),(0,2,0),(1,0,1),(1,1,2),(1,2,3)]:
   tag=self.block('board_mode',board_has_food=nbtlib.Byte(present),extension_board_model=nbtlib.Int(old_mode),board_model=nbtlib.Int(12),cut_stage=nbtlib.Int(4),extension_board_recovery=nbtlib.Int(13))
   convert_block(tag,self.rules);state=tag['states'];self.assertEqual(state['kaleidoscope_cookery:extension_board_model'],expected)
   self.assertEqual(state['kaleidoscope_cookery:board_model'],12);self.assertEqual(state['kaleidoscope_cookery:extension_board_recovery'],13);self.assertEqual(state['kaleidoscope_cookery:cut_stage'],4)
   self.assertEqual(convert_block(tag,self.rules),0)
 def test_subchunk_preserves_packed_indices_other_layer_and_nbt_bytes(self):
  from author_state_migration import transform_subchunk
  old=self.block('chair_carpet',has_carpet=nbtlib.Byte(1),carpet_color=nbtlib.String('black'))
  air=encode(nbtlib.File({'name':nbtlib.String('minecraft:air'),'states':nbtlib.Compound(),'version':nbtlib.Int(1)}))
  words=b''.join(struct.pack('<I',0xaaaaaaaa) for _ in range(128))
  prefix=b'\x09\x02\xff\x02'+words+struct.pack('<I',2)
  other=b'\x00'+air  # uniform storage has no 32-bit count
  raw=prefix+air+encode(old)+other;new,count=transform_subchunk(raw,self.rules)
  self.assertEqual(count,1);self.assertEqual(new[:len(prefix)+len(air)],prefix+air);self.assertTrue(new.endswith(other))
  self.assertEqual(transform_subchunk(new,self.rules),(new,0))
  with self.assertRaises(ValueError):transform_subchunk(raw+b'junk',self.rules)
  with self.assertRaises(ValueError):transform_subchunk(raw[:-2],self.rules)
 def test_uniform_author_palette_and_concatenated_block_actors(self):
  from author_state_migration import transform_subchunk
  raw=b'\x08\x01\x00'+encode(self.block('basin_oil',oil_full=nbtlib.Byte(1)))
  new,count=transform_subchunk(raw,self.rules);self.assertEqual(count,1);self.assertEqual(new[:3],raw[:3])
  a=encode(nbtlib.File({'DynamicProperties':nbtlib.Compound({'old':nbtlib.Compound({'food':nbtlib.String('keep')})})}));b=encode(nbtlib.File({'other':nbtlib.String('untouched')}))
  changed,owners=transform(a+b,{'old':'new'},sequence=True);self.assertEqual(owners,1);self.assertTrue(changed.endswith(b))
  with self.assertRaises(ValueError):transform(a+b,{'old':'new'})
 def test_invalid_types_mixed_schemas_and_unknown_width_fail_closed(self):
  from author_state_migration import convert_block,transform_subchunk
  tag=self.block('chair_carpet',has_carpet=nbtlib.String('true'))
  with self.assertRaises(ValueError):convert_block(tag,self.rules)
  tag=self.block('chair_carpet');tag['states']['kaleidoscope_cookery:chair_carpet_slot']=nbtlib.Int(3)
  with self.assertRaises(ValueError):convert_block(tag,self.rules)
  with self.assertRaises(ValueError):transform_subchunk(b'\x09\x01\x00\x0e',self.rules)
 def test_native_state_inspection_tolerates_palette_reordering_but_detects_loss(self):
  from family_update.author_state_preservation import inspect_world,verify,probe_commands
  from author_state_migration import convert_block
  from unittest.mock import patch
  from types import SimpleNamespace
  tag=self.block('chair_carpet',has_carpet=nbtlib.Byte(1),carpet_color=nbtlib.String('black'));convert_block(tag,self.rules)
  air=encode(nbtlib.File({'name':nbtlib.String('minecraft:air'),'states':nbtlib.Compound(),'version':nbtlib.Int(1)}))
  def raw(reverse=False):
   words=b''.join(struct.pack('<I',0x55555555 if reverse else 0xaaaaaaaa) for _ in range(128))
   return b'\x09\x01\xff\x02'+words+struct.pack('<I',2)+(encode(tag)+air if reverse else air+encode(tag))
  class DB:
   def __init__(self,data):self.data=data
   def items(self):return [(struct.pack('<ii',-2,3)+b'\x2f\xff',self.data)]
   def close(self):pass
  def inspect(data):
   with patch.dict('sys.modules',{'leveldb':SimpleNamespace(LevelDB=lambda _:DB(data))}):return inspect_world(Path('/unit-only'),self.profile)
  before=inspect(raw());after=inspect(raw(True));self.assertEqual(before['position_state_signatures'],after['position_state_signatures']);self.assertEqual(before['blocks'],2048)
  start,delayed,markers=probe_commands(before);self.assertEqual(len(start),1);self.assertEqual(len(markers),1);self.assertIn('"kaleidoscope_cookery:chair_carpet_bank"=1',delayed[0])
  message='[2026-10-17 00:00:00:000 INFO] Successfully found the block at '+','.join(map(str,markers[0]['position']))+'.\n'
  self.assertTrue(verify(before,after,message,markers)['ok'])
  self.assertFalse(verify(before,after,'[2026-10-17 00:00:00:000 INFO] Successfully found the block at 10,64,-1.',markers)['ok'])
  tag['states']['kaleidoscope_cookery:chair_carpet_slot']=nbtlib.Int(1)
  self.assertFalse(verify(before,inspect(raw()),message,markers)['ok'])
 def test_generated_testforblock_probes_require_exact_native_info_reply_counts(self):
  from family_update.author_state_preservation import probe_commands,verify
  inspection={'position_state_signatures':{'synthetic':'preserved'},'blocks':11,'probes':[
   {'dimension':0,'position':[i,64,-1],'identifier':'kaleidoscope_cookery:oak_chair',
    'states':{'kaleidoscope_cookery:chair_carpet_bank':(3,1)}} for i in range(11)]}
  start,commands,expected=probe_commands(inspection)
  self.assertEqual(len(start),1);self.assertTrue(start[0].endswith(' true'))
  self.assertEqual(expected[0],{'dimension':'overworld','position':[0,64,-1]})
  self.assertEqual(expected[10],{'dimension':'overworld','position':[10,64,-1]})
  for command,probe in zip(commands,expected):
   self.assertTrue(command.startswith('execute in '+probe['dimension']+' run testforblock '+ ' '.join(map(str,probe['position']))+' '))
   self.assertIn('"kaleidoscope_cookery:chair_carpet_bank"=1',command)
   self.assertNotIn('run say',command)
  def info(probe):return '[2026-10-17 00:00:00:000 INFO] Successfully found the block at '+','.join(map(str,probe['position']))+'.\n'
  complete=''.join(map(info,expected))
  self.assertTrue(verify(inspection,inspection,complete,expected)['ok'])
  missing=verify(inspection,inspection,''.join(map(info,expected[1:])),expected)
  self.assertFalse(missing['ok']);self.assertEqual(missing['console_probes_passed'],10)
  for log in [info(expected[10]),info(expected[0]).replace('.\n','. EXTRA\n'),
              info(expected[0]).split(' INFO] ')[1],
              info(expected[0]).replace(' INFO] ',' ERROR] '),
              info(expected[0]).replace(' INFO] ',' WARN] '),
              '[2026-10-17 00:00:00:000 INFO] '+commands[0]]:
   with self.subTest(log=log):self.assertFalse(verify(inspection,inspection,log,[expected[0]])['ok'])
  wrong_state='[2026-10-17 00:00:00:000 ERROR] The block at 0,64,-1 did not match the expected block state.\n'
  self.assertFalse(verify(inspection,inspection,complete+wrong_state,expected)['ok'])
  self.assertFalse(verify(inspection,inspection,complete+info(expected[0]),expected)['ok'])
  self.assertFalse(verify(inspection,inspection,complete+info({'position':[20,64,-1]}),expected)['ok'])
 def test_equal_coordinates_in_different_dimensions_require_each_native_reply(self):
  from family_update.author_state_preservation import probe_commands,verify
  inspection={'position_state_signatures':{'synthetic':'preserved'},'blocks':2,'probes':[
   {'dimension':dimension,'position':[1,64,-1],'identifier':'kaleidoscope_cookery:oak_chair',
    'states':{'kaleidoscope_cookery:chair_carpet_bank':(3,1)}} for dimension in [0,1]]}
  _,commands,expected=probe_commands(inspection)
  self.assertEqual({probe['dimension']for probe in expected},{'overworld','nether'})
  self.assertTrue(commands[0].startswith('execute in overworld run testforblock '))
  self.assertTrue(commands[1].startswith('execute in nether run testforblock '))
  reply='[2026-10-17 00:00:00:000 INFO] Successfully found the block at 1,64,-1.\n'
  partial=verify(inspection,inspection,reply,expected)
  self.assertFalse(partial['ok']);self.assertEqual(partial['console_probes_passed'],0)
  self.assertTrue(verify(inspection,inspection,reply*2,expected)['ok'])
  self.assertFalse(verify(inspection,inspection,reply*3,expected)['ok'])

if __name__=='__main__':unittest.main()
