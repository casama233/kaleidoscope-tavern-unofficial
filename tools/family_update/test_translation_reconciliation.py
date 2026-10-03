"""Scoped reconciliation preserves reviewed translations without approving drift."""
import base64,copy,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import common as m

class TranslationReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.ext=self.root/'source';self.live=self.root/'world'
        self.order={'behavior':['bp','other'],'resource':['rp']}
        config={'version':[1,0,7],'packs':{'BP':{'uuid':'bp'},'RP':{'uuid':'rp'}},'runtime':{'BP':'BP','RP':'RP'}}
        self.ext.mkdir();(self.ext/'baseline.json').write_text(json.dumps(config))
        self.proof={'schema':1,'source_provenance':'preserved local delta','review_reason':'language keys reviewed','packs':{}}
        self.expected={};self.inventory={'packs':[],'refs':{}}
        for side,uid in [('behavior','bp'),('resource','rp'),('behavior','other')]:
            source=self.ext/('BP' if side=='behavior' else 'RP');source.mkdir(exist_ok=True)
            live=self.live/uid;live.mkdir(parents=True)
            original={'header':{'uuid':uid,'version':[1,0,5],'name':'Pack 1.0.5'},'modules':[{'type':'data','version':[1,0,5]}]}
            old=json.dumps(original).encode();current=copy.deepcopy(original)
            if uid!='other':
                current['header']['version']=[1,0,6];current['header']['name']='Pack 1.0.6';current['modules'][0]['version']=[1,0,6]
            (live/'manifest.json').write_text(json.dumps(current))
            (live/'script.js').write_text('unchanged algorithm')
            if uid!='other':(source/'script.js').write_text('unchanged algorithm')
            oldfiles={'manifest.json':__import__('hashlib').sha256(old).hexdigest(),'script.js':m.sha(live/'script.js')}
            if uid=='rp':
                (live/'texts').mkdir();(source/'texts').mkdir()
                (live/'texts/zh_TW.lang').write_text('item.a.name=甲\nitem.b.name=乙\n')
                (source/'texts/zh_TW.lang').write_text('item.a.name=甲\nitem.b.name=乙\nitem.c.name=丙\n')
                oldfiles['texts/zh_TW.lang']='previous-language'
            files={p.relative_to(live).as_posix():m.sha(p) for p in live.rglob('*') if p.is_file()}
            row={'uuid':uid,'side':side,'version':current['header']['version'],'path':str(live),'files':files}
            self.inventory['packs'].append(row);self.expected[uid]={'uuid':uid,'side':side,'version':[1,0,5],'files':oldfiles}
            if uid!='other':self.proof['packs'][uid]={'observed_version':[1,0,6],'changed':[k for k in files if files[k]!=oldfiles[k]],'approved_manifest_base64':base64.b64encode(old).decode()}
        for side,uids in self.order.items():self.inventory['refs'][side]=[{'pack_id':uid,'version':next(r['version'] for r in self.inventory['packs'] if r['uuid']==uid)} for uid in uids]
        self.proof['observed_inventory']=copy.deepcopy(self.inventory)
        self.path=self.root/'proof.json';self.path.write_text(json.dumps(self.proof))
    def validate(self):
        with patch.multiple(m,EXTENSION=self.ext,CONFIG={'translation_reconciliation':str(self.path)},R=self.root),patch.object(m,'atomic') as record:
            m.validate_translation_reconciliation(self.inventory,self.expected,self.order)
            return record.call_args.args[1]
    def test_exact_delta_and_appended_restorations_are_reviewed_without_policy_approval(self):
        report=self.validate();self.assertFalse(report['old_drift_receipt_approved']);self.assertFalse(report['policy_changed'])
    def test_gameplay_drift_and_non_extension_changes_are_rejected(self):
        for uid in ['bp','other']:
            before=copy.deepcopy(self.inventory)
            next(r for r in self.inventory['packs'] if r['uuid']==uid)['files']['script.js']='changed'
            self.proof['observed_inventory']=copy.deepcopy(self.inventory)
            if uid=='bp':self.proof['packs'][uid]['changed'].append('script.js')
            self.path.write_text(json.dumps(self.proof))
            with self.assertRaises(AssertionError):self.validate()
            self.inventory=before
    def test_dropped_observed_translation_and_reordered_packs_are_rejected(self):
        (self.ext/'RP/texts/zh_TW.lang').write_text('item.c.name=丙\n')
        with self.assertRaisesRegex(AssertionError,'preserve'):self.validate()
        self.inventory['refs']['behavior'].reverse();self.proof['observed_inventory']=copy.deepcopy(self.inventory);self.path.write_text(json.dumps(self.proof))
        with self.assertRaisesRegex(AssertionError,'order'):self.validate()
    def test_manifest_identity_cannot_be_reconciled(self):
        p=self.live/'bp/manifest.json';x=json.loads(p.read_text());x['header']['uuid']='stolen';p.write_text(json.dumps(x))
        self.inventory['packs'][0]['files']['manifest.json']=m.sha(p);self.proof['observed_inventory']=copy.deepcopy(self.inventory);self.path.write_text(json.dumps(self.proof))
        with self.assertRaisesRegex(AssertionError,'manifest'):self.validate()

if __name__=='__main__':unittest.main()
