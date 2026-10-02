"""Failure injection for recovery control flow; all live I/O is replaced."""
import contextlib, importlib.util, sys, unittest
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from family_update import deploy_live as module

class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.original={'packs':[{'uuid':'owned-test','files':{'manifest.json':'reviewed'}}],'refs':{'behavior':['owned-test']}}
        self.status='STOPPED';self.actions=[];self.reports=[]
        self.live=self.original;self.policy_matches=True
        self.lease={'state':'active','owner':module.OWNER,'candidate':str(module.R)}
        self.stack=contextlib.ExitStack();self.addCleanup(self.stack.close)
        replacements={
            'assert_lease':lambda:None,
            'live_inventory':lambda:self.live,
            'summary':lambda:{'status':self.status},
            'read':lambda path:dict(self.lease),
            'now':lambda:'test-clock',
            'atomic':self.record,
            'sha':self.hash,
            'action':self.action,
        }
        for name,value in replacements.items():self.stack.enter_context(patch.object(module,name,value))
        self.restore=self.stack.enter_context(patch.object(module,'restore_packs'))
    def hash(self,path):
        return 'original' if self.policy_matches or 'production-before' in str(path) else 'changed'
    def action(self,name):
        self.actions.append(name);self.status={'stop':'STOPPED','start':'RUNNING'}[name]
    def record(self,path,value):
        self.reports.append((str(path),dict(value)))
        if path==module.LEASE:self.lease=dict(value)
    def result(self):
        return [value for path,value in self.reports if path.endswith('/deployment-recovery.json')][-1]
    def test_restore_failure_never_starts(self):
        self.restore.side_effect=OSError('injected restore rename failure')
        self.assertFalse(module.recover_after_failure(self.original,True,[],[]))
        self.assertNotIn('start',self.actions)
        self.assertEqual(self.status,'STOPPED')
        self.assertEqual(self.lease['state'],'active')
        self.assertEqual(self.lease['status'],'needs_operator_recovery')
        self.assertEqual(self.result()['phase'],'restore_original_packs')
    def test_failed_inner_rollback_flag_never_starts_even_if_inventory_looks_restored(self):
        self.assertFalse(module.recover_after_failure(self.original,False,[],[],rollback_failed=True))
        self.assertEqual(self.actions,[])
        self.restore.assert_not_called()
        self.assertEqual(self.status,'STOPPED')
        self.assertEqual(self.lease['state'],'active')
    def test_incomplete_inventory_never_starts(self):
        self.live={'packs':[],'refs':{}}
        self.assertFalse(module.recover_after_failure(self.original,False,[],[]))
        self.assertEqual(self.actions,[])
        self.assertEqual(self.result()['phase'],'verify_complete_original_stack')
    def test_changed_policy_never_starts(self):
        self.policy_matches=False
        self.assertFalse(module.recover_after_failure(self.original,False,[],[]))
        self.assertEqual(self.actions,[])
        self.assertEqual(self.lease['state'],'active')
    def test_verified_normal_rollback_can_start(self):
        self.assertTrue(module.recover_after_failure(self.original,True,[],[]))
        self.restore.assert_called_once_with(self.original,[],[])
        self.assertEqual(self.actions,['start'])
        self.assertEqual(self.status,'RUNNING')
        self.assertEqual(self.lease['state'],'failed')
        self.assertTrue(self.result()['original_inventory_verified'])
        self.assertTrue(self.result()['original_policy_verified'])
    def test_running_candidate_stops_before_restore_and_restart(self):
        self.status='RUNNING'
        self.assertTrue(module.recover_after_failure(self.original,True,[],[]))
        self.assertEqual(self.actions,['stop','start'])

if __name__=='__main__':unittest.main(verbosity=2)
