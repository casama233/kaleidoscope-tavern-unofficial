"""Review admission refuses unrelated paths and altered pre/postimages."""
import copy,hashlib,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update.amw25_reconciliation import validate_delta,dependency_versions,AMW
class ScopedAMW25Review(unittest.TestCase):
    def setUp(self):
        self.before={'keep':b'keep','changed':b'old','deleted':b'old'}
        self.after={'keep':b'keep','changed':b'new','added':b'new'}
        h=lambda b:hashlib.sha256(b).hexdigest() if b is not None else None
        self.pins={n:{'before':h(self.before.get(n)),'after':h(self.after.get(n))} for n in ['changed','added','deleted']}
    def test_reviewed_add_change_remove_are_exact(self):
        a,b,delta=validate_delta(self.before,self.after,self.pins)
        self.assertEqual(delta,set(self.pins));self.assertIn('keep',a);self.assertNotIn('deleted',b)
    def test_unrelated_drift_cannot_be_approved_by_expanding_external_proof(self):
        after={**self.after,'keep':b'foreign modification'}
        with self.assertRaisesRegex(AssertionError,'paths'):validate_delta(self.before,after,self.pins)
    def test_both_original_and_reviewed_bytes_are_enforced(self):
        for which in ['before','after']:
            pins=copy.deepcopy(self.pins);pins['changed'][which]='wrong'
            with self.assertRaisesRegex(AssertionError,'bytes'):validate_delta(self.before,self.after,pins)
    def test_version_scope_retains_old_profile_rules(self):
        uid=next(iter(AMW));self.assertEqual(dependency_versions(uid,{uid:[2,6,25]}),[[2,6,24],[2,6,25]])
        self.assertEqual(dependency_versions(uid,{uid:[2,4,20]}),[[2,4,18],[2,4,19],[2,4,20]])
        self.assertNotIn([2,6,23],dependency_versions(uid,{uid:[2,6,25]}))
if __name__=='__main__':unittest.main()
