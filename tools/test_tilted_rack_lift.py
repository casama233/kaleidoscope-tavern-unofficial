"""T175 approved usability exception, independent immutable T174 witness."""
import copy,hashlib,json,subprocess,unittest
from pathlib import Path
from item_render_contract import ROOT,planned
PATH='runtime/RP/models/entity/item_display_tilted_rack.geo.json'
WITNESS_COMMIT='e213fcef7241bd485c371053607778c464a79b07'
WITNESS_IDENTITIES={'runtime/RP/models/entity/item_display_tilted_rack.geo.json': {'bytes': 11969, 'git_blob': '96525421b57e3e552a514ef38a5a20240ae754ac', 'sha256': '1b3f1b0992ea604d6e4918c71b7d6e4a69d27bd8fd5a20d7fb9f6a2837673622'}, 'runtime/RP/models/entity/tilted_rack.geo.json': {'bytes': 9560, 'git_blob': 'aa7baa766cc19b2825295aed3cdb0092c8e2c211', 'sha256': '42af00c3035a21f688d968ae30b6061ff159098840993ed6278df7db91ea06b5'}, 'runtime/RP/textures/kaleidoscope_tavern/block/deco/tilted_rack.png': {'bytes': 279, 'git_blob': '2e3aaf20bd5f8415825b8f625a95d328ad77d7a0', 'sha256': 'f2765637938b8d9a8c5134609647aae21d312d6084b981b9f819df2782b697d4'}, 'runtime/BP/blocks/tilted_rack.json': {'bytes': 3605, 'git_blob': '895e9f8fa0d0f7a9f9a52936d52f353ceac069b1', 'sha256': 'ea48783e4545e780decf48e003f1b944a662d3397c7349d57e3759434fa4a08a'}}
def witness(path):
 raw=subprocess.check_output(['git','show',WITNESS_COMMIT+':'+path],cwd=ROOT)
 expected=WITNESS_IDENTITIES[path]
 assert len(raw)==expected['bytes'], 'Witness byte count differs'
 assert hashlib.sha256(raw).hexdigest()==expected['sha256'], 'Witness SHA256 differs'
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==expected['git_blob'], 'Witness Git blob differs'
 return raw
class RackLift(unittest.TestCase):
 def test_only_two_y_translations_change(self):
  old=json.loads(witness(PATH))
  actual=json.loads((ROOT/PATH).read_text());expected=copy.deepcopy(old)
  for hand in ['firstperson_righthand','firstperson_lefthand']:
   self.assertEqual([0,0,0],old['minecraft:geometry'][0]['item_display_transforms'][hand]['translation'])
   expected['minecraft:geometry'][0]['item_display_transforms'][hand]['translation'][1]=6
  self.assertEqual(expected,actual)
  self.assertEqual(actual,planned()[0][ROOT/PATH])
 def test_texture_and_world_are_exact_t174(self):
  for name in ['runtime/RP/models/entity/tilted_rack.geo.json','runtime/RP/textures/kaleidoscope_tavern/block/deco/tilted_rack.png','runtime/BP/blocks/tilted_rack.json']:
   self.assertEqual(witness(name),(ROOT/name).read_bytes())
if __name__=='__main__':unittest.main()
