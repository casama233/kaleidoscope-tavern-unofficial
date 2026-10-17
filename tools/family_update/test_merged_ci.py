"""Concurrent merged repairs need checks for the actual complete source tree."""
import sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import workflow as m

class MergedTreeTests(unittest.TestCase):
    def setUp(self):
        self.source={'commit':'merge','tree':'current'}
        self.pr={'_source':'tavern','head':{'sha':'head'},'merge_commit_sha':'merge'}
    def select(self,trees):
        with patch.object(m,'SOURCES',{'tavern':Path('/fixture')}),patch.object(m,'git',side_effect=lambda path,op,ref:trees[ref]):return m.ci_revision(self.source,self.pr)
    def test_identical_reviewed_head_remains_valid(self):
        self.assertEqual(self.select({'head^{tree}':'current'}),('head','reviewed_head_tree'))
    def test_advanced_base_selects_current_merge_for_actual_checks(self):
        self.assertEqual(self.select({'head^{tree}':'old','merge^{tree}':'current'}),('merge','exact_postmerge_tree'))
    def test_unrelated_later_source_and_wrong_merge_tree_are_rejected(self):
        self.source['commit']='later'
        with self.assertRaisesRegex(AssertionError,'current merged PR'):self.select({'head^{tree}':'old'})
        self.source['commit']='merge'
        with self.assertRaisesRegex(AssertionError,'differs'):self.select({'head^{tree}':'old','merge^{tree}':'other'})

if __name__=='__main__':unittest.main()
