"""Only exact active RP delivery caches may disappear without input drift."""
import hashlib,json,sys,tempfile,unittest,zipfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import common as m

class ClientCacheTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
        self.b=self.root/'server';self.w=self.b/'world';self.uid='12345678-1234-1234-1234-123456789abc'
        self.pack=self.w/'resource_packs'/self.uid;self.pack.mkdir(parents=True)
        (self.pack/'manifest.json').write_text(json.dumps({'header':{'uuid':self.uid,'version':[1,0,0]},'modules':[{'type':'resources'}]}))
        (self.pack/'text.lang').write_text('native=test')
        (self.w/'world_resource_packs.json').write_text(json.dumps([{'pack_id':self.uid,'version':[1,0,0]}]))
        for name in ['definitions','behavior_packs','resource_packs','config','minecraftpe','treatments']:(self.b/name).mkdir()
        (self.b/'bedrock_server').write_text('engine')
        self.cache=self.b/'minecraftpe'/f'{self.uid}_1.0.0.zip'
        self.write_zip()
        def files(path):return {p.relative_to(path).as_posix():m.sha(p) for p in path.rglob('*') if p.is_file()}
        self.patch=patch.multiple(m,B=self.b,W=self.w,G={'hashes':files});self.patch.start();self.addCleanup(self.patch.stop)
    def write_zip(self,changed=False):
        with zipfile.ZipFile(self.cache,'w') as z:
            for p in self.pack.iterdir():z.writestr(p.name,b'tampered' if changed and p.name=='text.lang' else p.read_bytes())
    def test_exact_cache_shutdown_removal_does_not_change_engine_inputs(self):
        before=m.engine_inputs();proof=m.client_pack_cache();self.assertTrue(proof[self.cache.name]['exact_active_resource_bytes'])
        self.cache.unlink();self.assertEqual(before,m.engine_inputs())
    def test_changed_cached_pack_is_rejected_instead_of_ignored(self):
        self.write_zip(changed=True)
        with self.assertRaisesRegex(AssertionError,'differs'):m.engine_inputs()
    def test_unknown_zip_and_real_configuration_remain_pinned(self):
        p=self.b/'minecraftpe/unknown.zip';p.write_text('unknown engine input');before=m.engine_inputs()
        p.unlink();self.assertNotEqual(before,m.engine_inputs())
        before=m.engine_inputs();(self.b/'config/permissions.json').write_text('changed');self.assertNotEqual(before,m.engine_inputs())

if __name__=='__main__':unittest.main()
