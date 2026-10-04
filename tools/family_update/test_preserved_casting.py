"""Only the narrowly reviewed casting delta can enter candidate preparation."""
import copy,json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import preserved_casting as m

class CastingReviewTests(unittest.TestCase):
    def setUp(self):
        self.old={'header':{'uuid':'bp','version':[2,4,19],'name':'prior','description':'prior'},'modules':[{'type':'data','uuid':'data','version':[2,4,19]}],'dependencies':[{'uuid':next(iter(m.AMW)),'version':[2,4,19]}]}
        self.new=copy.deepcopy(self.old);self.new['header'].update(version=[2,4,20],name='reviewed',description='reviewed');self.new['modules'][0]['version']=[2,4,20];self.new['dependencies'][0]['version']=[2,4,20]
    def validate(self):m.review_manifest(json.dumps(self.old).encode(),json.dumps(self.new).encode(),'bp')
    def test_only_paired_release_names_and_descriptions_may_change(self):self.validate()
    def test_identity_dependency_and_module_changes_rejected(self):
        for where,key,value in [('header','uuid','other'),('header','min_engine_version',[1,99,0])]:
            current=copy.deepcopy(self.new);self.new[where][key]=value
            with self.assertRaises(AssertionError):self.validate()
            self.new=current
        self.new['modules'][0]['uuid']='other'
        with self.assertRaises(AssertionError):self.validate()
    def test_stale_dependency_rejected(self):
        self.new['dependencies'][0]['version']=[2,4,19]
        with self.assertRaises(AssertionError):self.validate()
    def test_casting_transform_does_not_accept_other_gameplay_changes(self):
        old='function releaseCasting(s){\n    let item_temp = s.itemStack.clone();\n    oldDeferredWear();\n    if(is_local){\n        retainSpell();\n    }\n}\n'
        new="import {spendCastingDurability} from './lib/casting-durability.js';\nfunction releaseCasting(s){\n    if(!s.source?.isValid || !s.itemStack || !ItemData.getCastWeapons()[s.itemStack.typeId]) return;\n    // After-event writes are immediate: a later hotbar switch cannot redirect wear.\n    if(!spendCastingDurability(s.source,s.itemStack.typeId)) return;\n    if(is_local){\n        retainSpell();\n    }\n}\n"
        m.review_casting(old.encode(),new.encode())
        with self.assertRaisesRegex(AssertionError,'event'):m.review_casting(old.encode(),new.replace('retainSpell','differentSpell').encode())
    def test_stale_observed_inventory_rejected_before_source_access(self):
        with self.assertRaisesRegex(AssertionError,'inventory'):m.reconcile({'source_provenance':'observed','review_reason':'reviewed','observed_inventory':{}},{'changed':True},{})

if __name__=='__main__':unittest.main()
