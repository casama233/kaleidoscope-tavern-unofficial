"""Native item NBT/owner conservation checks; no BDS or player session."""
import io,json,sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import nbtlib
from family_update import native_storage_reanchor as m

UUID='fixture-pack';KEY='kt:extension_storage/fixture_addon/cabinet/overworld/12_66_-18'
PLAN={'schema':1,'keys':[KEY]}
def encoded(tag):
 out=io.BytesIO();nbtlib.File(tag).write(out,byteorder='little');return out.getvalue()
def fixture(y=512,token='original',name='original custom name',count=1):
 ids=['fixture_addon:drink']+[None]*8;record={'schema':1,'key':KEY,'dimension':'minecraft:overworld','position':{'x':12,'y':66,'z':-18},'ids':ids,'entity':'73','token':'original'}
 item=nbtlib.Compound({'Slot':nbtlib.Byte(0),'Name':nbtlib.String(ids[0]),'Count':nbtlib.Byte(count),'tag':nbtlib.Compound({'display':nbtlib.Compound({'Name':nbtlib.String(name)}),'foreign':nbtlib.Long(123456789)})})
 actor={'identifier':nbtlib.String('kaleidoscope_tavern:stored_items'),'UniqueID':nbtlib.Long(73),'DimensionId':nbtlib.Int(0),'Pos':nbtlib.List[nbtlib.Float]([12.5,y,-17.5]),'ChestItems':nbtlib.List[nbtlib.Compound]([item]),'DynamicProperties':nbtlib.Compound({UUID:nbtlib.Compound({'kaleidoscope_tavern:storage_owner':nbtlib.String(KEY),'kaleidoscope_tavern:storage_token':nbtlib.String(token)})})}
 world={UUID:nbtlib.Compound({'kt:native_items/'+KEY:nbtlib.String(json.dumps(record)),'kt:native_required/'+KEY:nbtlib.Int(1)})}
 return {b'DynamicProperties':encoded(world),b'actorprefix-fixture':encoded(actor)}
class NativeStorageSceneTests(unittest.TestCase):
 def inspect(self,db):
  with patch.object(m,'block_at',return_value={'name':'fixture_addon:cabinet'}):return m.inspect(db,PLAN,UUID)
 def test_loaded_recovery_preserves_full_native_item_nbt_and_same_numeric_actor(self):
  before=self.inspect(fixture());after=self.inspect(fixture(y=66.5));self.assertFalse(before[0]['centered']);self.assertTrue(m.verify(before,after));self.assertEqual(before[0]['entity'],'73')
 def test_named_or_opaque_metadata_mutation_rejects_conservation(self):
  before=self.inspect(fixture());changed=self.inspect(fixture(y=66.5,name='recreated item'))
  with self.assertRaisesRegex(AssertionError,'full item metadata'):m.verify(before,changed)
 def test_unchanged_displaced_actor_is_not_success(self):
  before=self.inspect(fixture())
  with self.assertRaisesRegex(AssertionError,'not restored'):m.verify(before,before)
 def test_wrong_token_quantity_or_owner_block_rejects(self):
  for db in [fixture(token='foreign'),fixture(count=2)]:
   with self.subTest(db=db),self.assertRaises(AssertionError):self.inspect(db)
  with patch.object(m,'block_at',return_value={'name':'minecraft:air'}),self.assertRaisesRegex(AssertionError,'Owner block'):m.inspect(fixture(),PLAN,UUID)
 def test_duplicate_scene_and_non_key_command_injection_reject(self):
  for plan in [{'schema':1,'keys':[KEY,KEY]},{'schema':1,'keys':[KEY+'\nstop']},{'schema':1,'keys':[]}]:
   with self.subTest(plan=plan),self.assertRaises(AssertionError):m.commands(plan)
  self.assertEqual(m.commands(PLAN),['execute in overworld run tickingarea add circle 12 66 -18 1 native_storage_reanchor_0'])

if __name__=='__main__':unittest.main()
