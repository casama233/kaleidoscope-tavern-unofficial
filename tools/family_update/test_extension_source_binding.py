"""Finite whole-source-tree evidence reuse checks; no game or source mutation."""
import copy,subprocess,sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import extension_validation as m

class SourceBindingTests(unittest.TestCase):
    config={'repository':'example/integration','version':[1,0,1],'source_trees':{'BP':'one','RP':'two'}}
    current='c'*40;native='a'*40;tree='b'*40
    def binding(self,ancestor=True,identical=True,proof=None):
        def source_git(root,*args):
            if args==('rev-parse','HEAD'):return self.current
            if args==('merge-base','--is-ancestor',self.native,self.current):
                if not ancestor:raise subprocess.CalledProcessError(1,args)
                return ''
            if args==('rev-parse',self.native+'^{tree}'):return self.tree
            if args==('rev-parse','HEAD^{tree}'):return self.tree if identical else 'd'*40
            raise AssertionError('Unexpected source query')
        proof=proof or {'schema':1,**self.config,'source_commit':self.native}
        with patch.object(m,'git',side_effect=source_git) as queries:
            result=m.source_binding(proof,self.config)
            queries.assert_any_call(m.EXTENSION,'merge-base','--is-ancestor',self.native,self.current)
            return result
    def test_ancestor_with_identical_entire_tree_records_both_commits(self):
        result=self.binding()
        self.assertEqual(result['actual_current_source_commit'],self.current)
        self.assertEqual(result['native_source_commit'],self.native)
        self.assertEqual(result['current_source_tree_oid'],result['native_source_tree_oid'])
        self.assertTrue(result['identical_full_tree_reuse'])
    def test_different_full_tree_unrelated_commit_and_baseline_are_rejected(self):
        with self.assertRaisesRegex(AssertionError,'full Git tree differs'):self.binding(identical=False)
        with self.assertRaisesRegex(AssertionError,'not an ancestor'):self.binding(ancestor=False)
        for field,value in [('repository','another/source'),('version',[1,0,2]),('source_trees',{'BP':'changed','RP':'two'})]:
            proof={'schema':1,**copy.deepcopy(self.config),'source_commit':self.native};proof[field]=value
            with self.subTest(field=field),self.assertRaises(AssertionError):self.binding(proof=proof)

if __name__=='__main__':unittest.main()
