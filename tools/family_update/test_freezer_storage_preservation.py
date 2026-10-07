import copy,io,json,unittest,sys
from pathlib import Path
from unittest.mock import patch
import nbtlib
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update.freezer_storage_preservation import inspect,NS,ENTITY,PREFIX
UUID='355ffdfc-50e6-5a33-a126-4d78ab955b2b'
KEY=NS+':storage/overworld/0_64_0'
def encoded(value):
 stream=io.BytesIO();nbtlib.File(value).write(stream,byteorder='little');return stream.getvalue()
class Preservation(unittest.TestCase):
 def setUp(self):
  record={'schema':1,'key':KEY,'dimension':'minecraft:overworld','position':{'x':0,'y':64,'z':0},'ids':['minecraft:diamond_sword',None,None,None],'entity':'73','token':'original'}
  self.world={UUID:nbtlib.Compound({PREFIX+KEY:nbtlib.String(json.dumps(record)),'kwl:native_required/'+KEY:nbtlib.Int(1),KEY:nbtlib.String(json.dumps({'input':['minecraft:diamond_sword']}))})}
  self.actor={'identifier':nbtlib.String(ENTITY),'UniqueID':nbtlib.Long(73),'DimensionId':nbtlib.Int(0),'DynamicProperties':nbtlib.Compound({UUID:nbtlib.Compound({NS+':input_owner':nbtlib.String(KEY),NS+':input_token':nbtlib.String('original')})}),'ChestItems':nbtlib.List[nbtlib.Compound]([nbtlib.Compound({'Name':nbtlib.String('minecraft:diamond_sword'),'Slot':nbtlib.Byte(0),'Count':nbtlib.Byte(1),'tag':nbtlib.Compound({'display':nbtlib.Compound({'Name':nbtlib.String('named')}),'foreign_private_pack':nbtlib.Compound({'opaque':nbtlib.Long(17)})})})])}
  self.enterContext(patch('family_update.freezer_storage_preservation.block_at',return_value=nbtlib.Compound({'name':nbtlib.String(NS+':freezer')})))
 def db(self):return {b'DynamicProperties':encoded(self.world),b'actorprefix-fixture':encoded(self.actor)}
 def test_full_typed_hidden_item_metadata_change_is_detected_without_writing(self):
  db=self.db();before=inspect(db,UUID);self.assertEqual(db,self.db());self.assertEqual(before[KEY]['native_slots'],4);self.actor['ChestItems'][0]['tag']['foreign_private_pack']['opaque']=nbtlib.Long(18);self.assertNotEqual(before[KEY]['complete_item_nbt_sha256'],inspect(self.db(),UUID)[KEY]['complete_item_nbt_sha256'])
 def test_missing_wrong_owner_and_wrong_slot_are_refused(self):
  db=self.db();del db[b'actorprefix-fixture'];self.assertRaises(KeyError,inspect,db,UUID)
  for kind in ['owner','slot']:
   actor=copy.deepcopy(self.actor)
   if kind=='owner':actor['DynamicProperties'][UUID][NS+':input_token']=nbtlib.String('foreign')
   else:actor['ChestItems'][0]['Slot']=nbtlib.Byte(4)
   with self.assertRaises(AssertionError):inspect({b'DynamicProperties':encoded(self.world),b'actorprefix-fixture':encoded(actor)},UUID)
 def test_unknown_pack_properties_do_not_create_or_drop_owned_records(self):
  world=copy.deepcopy(self.world);world[UUID]=nbtlib.Compound();db={b'DynamicProperties':encoded(world),b'actorprefix-fixture':encoded(self.actor)}
  self.assertRaisesRegex(AssertionError,'Unreferenced',inspect,db,UUID);del db[b'actorprefix-fixture'];self.assertEqual(inspect(db,UUID),{})
 def test_machine_index_divergence_and_replaced_block_are_refused(self):
  world=copy.deepcopy(self.world);world[UUID][KEY]=nbtlib.String(json.dumps({'input':['minecraft:sugar']}));self.assertRaisesRegex(AssertionError,'machine/index',inspect,{b'DynamicProperties':encoded(world),b'actorprefix-fixture':encoded(self.actor)},UUID)
  with patch('family_update.freezer_storage_preservation.block_at',return_value=nbtlib.Compound({'name':nbtlib.String('minecraft:air')})):self.assertRaisesRegex(AssertionError,'owner block',inspect,self.db(),UUID)
if __name__=='__main__':unittest.main()
