"""Exercise the real finalizer with isolated synthetic reports, never BDS/live."""
import ast,hashlib,json,os,sys,tempfile,unittest
from unittest.mock import patch
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

SOURCE=Path(__file__).with_name('deploy_live.py')
NODE=next(node for node in ast.parse(SOURCE.read_text()).body
          if isinstance(node,ast.FunctionDef) and node.name=='finalize_receipt')

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path):return json.loads(Path(path).read_text())
def report_ref(path):return {'path':str(path),'sha256':sha(path)}
def atomic(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,indent=2)+'\n')

class FinalizerPrivateProofRefTests(unittest.TestCase):
    def setUp(self):
        temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
        self.root=Path(temporary.name);self.c=self.root/'candidate';self.b=self.root/'engine'
        atomic(self.c/'family-receipt.json',{'packs':[],'acceptance':{'static':False,'bds':False,'client':False,'saved_world_migration':False}})
        self.raw=(self.c/'family-receipt.json').read_bytes();self.b.mkdir()
        (self.b/'bedrock_server').write_bytes(b'SYNTHETIC NONEXECUTABLE FIXTURE')
        inputs={'synthetic_fixture_only':True};runs=[]
        for phase in ['first','restart']:
            log=self.root/'saved-world-engine'/(phase+'.log');log.parent.mkdir(exist_ok=True)
            log.write_text('SYNTHETIC FIXTURE ONLY\n')
            runs.append({'phase':phase,'ok':True,'started':True,'family_initialized':True,'errors':[],
                'player_records_unchanged':True,'custom_container_inventories_retained':True,'log_sha256':sha(log)})
        native={'candidate_receipt_sha256':sha(self.c/'family-receipt.json'),'engine_sha256':sha(self.b/'bedrock_server'),'engine_inputs':inputs}
        saved={**native,'fresh_stopped_backup':True,'saved_world_migration':True,'bds':True,'runs':runs,
               'player_records_before':{},'player_records_after':{}}
        atomic(self.root/'saved-world-report.json',saved)
        # Detailed shared validation is exercised by test_resume; here only
        # finalizer evidence references and immutable writes are under test.
        def verified_native(*, verified_candidate):
            self.assertEqual(verified_candidate,json.loads(self.raw))
            return saved
        self.native_check=self.enterContext(patch('family_update.workflow.verify_native', side_effect=verified_native))
        for name in ['build-evidence.json','static-evidence.json','compatibility-report.json','production-before/backup-receipt.json',
                     'handoff-authorization.json','saved-world-container-inventories.json']:
            atomic(self.root/name,{'synthetic_fixture_only':True})
        self.private=self.root/'proofs'/'private-proof.json'
        atomic(self.private,{'synthetic_fixture_only':True,'not_real_qa':True})
        self.config={'extension_validation':str(self.private)}
        self.namespace={'R':self.root,'C':self.c,'B':self.b,'CONFIG':self.config,'AUTHORIZATION':self.root/'synthetic-request.txt',
            'Path':Path,'read':read,'sha':sha,'engine_inputs':lambda:inputs,'report_ref':report_ref,'atomic':atomic,'audit_candidate':lambda *_:None}
        exec(compile(ast.Module(body=[NODE],type_ignores=[]),str(SOURCE),'exec'),self.namespace)
    def finalize(self):
        result=self.namespace['finalize_receipt']()
        self.native_check.assert_called_once()
        self.assertEqual((self.c/'family-receipt.json').read_bytes(),self.raw)
        self.assertEqual(read(self.root/'reviewed-family-receipt.json'),result)
        self.assertFalse(result['production_ready']);self.assertFalse(result['acceptance']['client'])
        return result
    def test_configured_proof_included_once_with_exact_absolute_path_and_hash(self):
        self.assertEqual(self.finalize()['evidence']['reports'].count(report_ref(self.private.resolve())),1)
    def test_without_extension_seven_combined_reports_retained(self):
        self.config.clear();reports=self.finalize()['evidence']['reports']
        self.assertEqual(len(reports),7);self.assertNotIn(report_ref(self.private),reports)
    def test_missing_configured_proof_refuses_reviewed_write_and_keeps_raw(self):
        self.private.unlink()
        with self.assertRaises(FileNotFoundError):self.namespace['finalize_receipt']()
        self.assertFalse((self.root/'reviewed-family-receipt.json').exists())
        self.assertEqual((self.c/'family-receipt.json').read_bytes(),self.raw)
    def test_existing_resolved_report_path_deduplicated(self):
        existing=self.root/'build-evidence.json';self.config['extension_validation']=str(existing.parent/'proofs'/'..'/existing.name)
        reports=self.finalize()['evidence']['reports']
        self.assertEqual(len(reports),7);self.assertEqual(reports.count(report_ref(existing)),1)
    def test_existing_reviewed_receipt_refused_without_overwriting(self):
        self.finalize();path=self.root/'reviewed-family-receipt.json';before=path.read_bytes()
        with self.assertRaisesRegex(AssertionError,'Do not overwrite'):self.namespace['finalize_receipt']()
        self.assertEqual(path.read_bytes(),before);self.assertEqual((self.c/'family-receipt.json').read_bytes(),self.raw)
    def test_relative_configured_proof_resolves_to_its_real_path(self):
        self.config['extension_validation']='private-proof.json';before=Path.cwd()
        try:
            os.chdir(self.private.parent);reports=self.finalize()['evidence']['reports']
        finally:os.chdir(before)
        self.assertEqual(reports.count(report_ref(self.private)),1)
    def test_p34_source_and_fresh_native_refs_are_formal_and_deduplicated(self):
        from family_update.preserved_hud_inputs import PROFILE
        paths={name:self.root/'proofs'/(name+'.json') for name in ['recipe','review','cache','guide','hud']}
        for path in paths.values():atomic(path,{'synthetic_fixture_only':True})
        self.config.update(extension_cache_validation=str(self.private),prospective_preserved_inputs=str(paths['review']))
        atomic(self.root/'cookery-cache-static-validation.json',{'differential':report_ref(paths['cache']),'guide_differential':report_ref(paths['guide'])})
        atomic(self.root/'cookery-cache-native-validation.json',{'synthetic_fixture_only':True})
        atomic(self.root/'hud-coexistence-native-validation.json',{'synthetic_fixture_only':True})
        atomic(self.root/'prospective-preserved-inputs-check.json',{'profile':PROFILE,'review':report_ref(paths['review']),
            'recipe':report_ref(paths['recipe']),'source_validation':report_ref(self.private),'hud_differential':report_ref(paths['hud'])})
        reports=self.finalize()['evidence']['reports']
        for path in [self.private,*paths.values(),self.root/'cookery-cache-native-validation.json',self.root/'hud-coexistence-native-validation.json',self.root/'saved-world-report.json']:
            self.assertEqual(reports.count(report_ref(path)),1)

if __name__=='__main__':unittest.main()
