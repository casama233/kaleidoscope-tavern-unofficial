import base64, copy, hashlib, io, struct, unittest
from unittest.mock import patch
import nbtlib
from container_recovery import decode_records, item_digest, inventories, recover, chunk_key

def encoded(value):
    out=io.BytesIO();nbtlib.File(value).write(out,byteorder='little');return out.getvalue()

def record(pos=(370,65,-559),name='DataDriven',count=10):
    return {'id':nbtlib.String(name),**{k:nbtlib.Int(v) for k,v in zip(('x','y','z'),pos)},
        'Items':nbtlib.List[nbtlib.Compound]([nbtlib.Compound({'Name':nbtlib.String('minecraft:rabbit'),
          'Count':nbtlib.Byte(count),'Slot':nbtlib.Byte(45),'tag':nbtlib.Compound({'display':nbtlib.Compound({'Name':nbtlib.String('保留名稱')})})})])}

class Database(dict):
    def get(self,key):return self[key]
    def putBatch(self,updates):self.update(updates)

class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.pos=(370,65,-559);self.key=chunk_key(self.pos,0x31)
        self.sibling=encoded(record((371,65,-557),'ShulkerBox',3))
        self.db=Database({self.key:self.sibling,b'player_unrelated':b'keep-player-bytes'})
        self.raw=encoded(record());self.block='kaleidoscope_chinesefood:freezer'
        self.plan={'schema':1,'source':'consistent stopped backup evidence','records':[{
            'position':list(self.pos),'block':self.block,'sha256':hashlib.sha256(self.raw).hexdigest(),
            'nbt_base64':base64.b64encode(self.raw).decode()}]}
        self.enterContext(patch('container_recovery.block_at',return_value=nbtlib.Compound({'name':nbtlib.String(self.block)})))

    def test_restores_exact_items_without_replacing_sibling_or_player(self):
        result=recover(self.db,self.plan)
        self.assertEqual(result['restored'][0]['count'],10)
        self.assertEqual(self.db[self.key],self.sibling+self.raw)
        self.assertEqual(self.db[b'player_unrelated'],b'keep-player-bytes')
        self.assertTrue(result['unrelated_records_preserved'])

    def test_conflicting_inventory_rejected_without_any_write(self):
        self.db[self.key]+=encoded(record(count=9));before=dict(self.db)
        with self.assertRaisesRegex(ValueError,'nonempty'):recover(self.db,self.plan)
        self.assertEqual(dict(self.db),before)

    def test_replay_is_noop_and_malformed_hash_or_duplicate_is_rejected(self):
        recover(self.db,self.plan);before=dict(self.db)
        self.assertEqual(recover(self.db,self.plan)['restored'],[])
        self.assertEqual(dict(self.db),before)
        for kind in ('hash','duplicate'):
            plan=copy.deepcopy(self.plan)
            if kind=='hash':plan['records'][0]['sha256']='wrong'
            else:plan['records']*=2
            with self.assertRaises(ValueError):recover(self.db,plan)
            self.assertEqual(dict(self.db),before)

    def test_two_halves_in_same_record_and_new_metadata_are_preserved(self):
        top=encoded(record((370,66,-559),count=1))
        self.plan['records'].append({**self.plan['records'][0],'position':[370,66,-559],
            'sha256':hashlib.sha256(top).hexdigest(),'nbt_base64':base64.b64encode(top).decode()})
        recover(self.db,self.plan)
        self.assertEqual(self.db[self.key],self.sibling+self.raw+top)

    def test_inventory_gate_detects_removed_record_and_changed_item_metadata(self):
        self.db[self.key]+=self.raw;before=inventories(self.db)
        self.assertEqual(len(before),1)
        self.db[self.key]=self.sibling
        self.assertEqual(inventories(self.db),{})
        tag=decode_records(self.raw)[0][0];digest=item_digest(tag)
        tag['Items'][0]['tag']['display']['Name']=nbtlib.String('changed')
        self.assertNotEqual(item_digest(tag),digest)

if __name__=='__main__':unittest.main()
