"""Use actual setup/inventory functions with isolated filesystem inputs; never BDS/live."""
import hashlib,shutil,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import common as common
from family_update import native_common as native

class EngineDataTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.b=self.root/'bds';self.b.mkdir()
        for name in ['definitions','behavior_packs','resource_packs','config','minecraftpe','treatments']:(self.b/name).mkdir()
        (self.b/'bedrock_server').write_bytes(b'isolated engine fixture')
        (self.b/'server.properties').write_text('server-port=19132\nserver-portv6=19133\n')
        self.data=self.b/'data';(self.data/'nested').mkdir(parents=True)
        (self.data/'bootstrap.json').write_bytes(b'{"fixture":"bootstrap"}\n')
        (self.data/'nested/profile.bin').write_bytes(bytes(range(32)))
        def files(root):return {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
        self.files=files
        cm=patch.multiple(common,B=self.b,G={'hashes':files});cm.start();self.addCleanup(cm.stop)
        nm=patch.object(native,'B',self.b);nm.start();self.addCleanup(nm.stop)
    def setup(self,expected=None):
        engine=self.root/'engine';native.setup_engine(engine,'Fixture QA',29124,expected_inputs=expected);return engine
    def test_inventory_pins_the_whole_genuine_data_tree(self):
        result=common.engine_inputs();self.assertEqual(result['trees']['data'],self.files(self.data))
        self.assertEqual(set(result['trees']['data']),{'bootstrap.json','nested/profile.bin'})
    def test_changed_removed_or_missing_data_changes_engine_identity(self):
        baseline=common.engine_inputs();p=self.data/'nested/profile.bin';raw=p.read_bytes()
        p.write_bytes(b'changed');self.assertNotEqual(common.engine_inputs(),baseline)
        p.write_bytes(raw);self.assertEqual(common.engine_inputs(),baseline)
        p.unlink();self.assertNotEqual(common.engine_inputs(),baseline)
        shutil.rmtree(self.data);self.assertNotEqual(common.engine_inputs(),baseline)
    def test_setup_copies_all_data_bytes_without_aliasing_the_source(self):
        before=self.files(self.data);engine=self.setup(common.engine_inputs());copy=engine/'data'
        self.assertEqual(self.files(copy),before);self.assertFalse(copy.is_symlink())
        for p in copy.rglob('*'):
            if p.is_file():self.assertFalse(p.samefile(self.data/p.relative_to(copy)))
        (copy/'bootstrap.json').write_bytes(b'isolated output change')
        self.assertEqual(self.files(self.data),before)
    def test_legacy_distribution_without_data_does_not_get_synthesized_data(self):
        shutil.rmtree(self.data);result=common.engine_inputs();self.assertNotIn('data',result['trees'])
        engine=self.setup(result);self.assertFalse((engine/'data').exists())
        self.assertEqual(set(result['trees']),{'definitions','behavior_packs','resource_packs','config','minecraftpe','treatments'})
    def copied_data_case(self,change):
        original=shutil.copytree
        def changed(src,dst,*args,**kwargs):
            result=original(src,dst,*args,**kwargs)
            if Path(src)==self.data:change(Path(src),Path(dst))
            return result
        with patch.object(native.shutil,'copytree',side_effect=changed):self.setup()
    def test_tampered_destination_data_is_rejected_before_native_launch(self):
        before=self.files(self.data)
        with self.assertRaisesRegex(AssertionError,'data copy differs'):
            self.copied_data_case(lambda src,dst:(dst/'bootstrap.json').write_bytes(b'tampered'))
        self.assertEqual(self.files(self.data),before)
    def test_omitted_destination_file_is_rejected_before_native_launch(self):
        before=self.files(self.data)
        with self.assertRaisesRegex(AssertionError,'data copy differs'):
            self.copied_data_case(lambda src,dst:(dst/'nested/profile.bin').unlink())
        self.assertEqual(self.files(self.data),before)
    def test_source_change_during_copy_is_rejected(self):
        with self.assertRaisesRegex(AssertionError,'input changed during'):
            self.copied_data_case(lambda src,dst:(src/'bootstrap.json').write_bytes(b'concurrent drift'))
    def test_non_directory_data_input_is_rejected(self):
        shutil.rmtree(self.data);self.data.write_bytes(b'invalid data path')
        with self.assertRaisesRegex(AssertionError,'must be a directory'):common.engine_inputs()
        with self.assertRaisesRegex(AssertionError,'must be a directory'):self.setup()
    def test_changed_data_between_capture_and_setup_rejected_before_clone(self):
        inputs=common.engine_inputs();(self.data/'bootstrap.json').write_bytes(b'change before copying')
        with self.assertRaisesRegex(AssertionError,'differs from captured'):self.setup(inputs)
        self.assertFalse((self.root/'engine').exists())
    def test_missing_data_after_capture_rejected_before_clone(self):
        inputs=common.engine_inputs();shutil.rmtree(self.data)
        with self.assertRaisesRegex(AssertionError,'differs from captured'):self.setup(inputs)
        self.assertFalse((self.root/'engine').exists())
    def test_new_data_after_legacy_capture_rejected_before_clone(self):
        shutil.rmtree(self.data);inputs=common.engine_inputs();self.data.mkdir()
        (self.data/'bootstrap.json').write_bytes(b'new data after capture')
        with self.assertRaisesRegex(AssertionError,'differs from captured'):self.setup(inputs)
        self.assertFalse((self.root/'engine').exists())

if __name__=='__main__':unittest.main()
