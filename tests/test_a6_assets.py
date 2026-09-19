"""A6 source/asset regression tests, not Minecraft engine tests."""
import hashlib
import json
from pathlib import Path
import unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8'))

class A6AssetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r.get('batch')=='A6'}
        cls.original=ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern'
    def test_exact_scope_no_placeholder_or_extra_family(self):
        expected={f'{t}_{s}'for t in ['bar_cabinet','glass_bar_cabinet','cellar_cabinet']for s in ['single','left','middle','right']}
        expected|={'tilted_rack','circular_rack','glassware_holder'}|{f'vodka_{n}'for n in range(1,5)}
        self.assertEqual(set(self.records),expected)
        self.assertTrue(all(r['engine_visual_test']=='NOT_RUN' for r in self.records.values()))
    def test_all_25_added_sources_match_upstream_hash(self):
        rows=[r for r in read(ROOT/'sources.lock.json')['assets']if r.get('batch')=='A6']
        self.assertEqual(len(rows),25)
        for r in rows:
            raw=(ROOT/'upstream'/r['path']).read_bytes()
            self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),r['git_blob_sha1'])
    def test_actual_png_size_not_unreliable_model_hint(self):
        self.assertEqual(self.records['circular_rack']['texture_size'],[16,16])
        self.assertEqual(self.records['glassware_holder']['texture_size'],[64,64])
        for key in ['circular_rack','glassware_holder']:
            r=self.records[key];geo=read(ROOT/r['geometry'])['minecraft:geometry'][0]['description']
            self.assertEqual([geo['texture_width'],geo['texture_height']],r['texture_size'])
    def test_original_textures_unchanged(self):
        textures={r['texture']for r in self.records.values()};self.assertEqual(len(textures),6)
        for t in textures:
            self.assertEqual((self.original/'textures'/f'{t}.png').read_bytes(),(ROOT/'RP/textures/kaleidoscope_tavern'/f'{t}.png').read_bytes())
    def test_cabinet_elements_and_shelf_variants(self):
        shapes=['single','left','middle','right']
        for family,counts in [('bar_cabinet',[5,4,3,4]),('glass_bar_cabinet',[6,5,4,5]),('cellar_cabinet',[7,6,5,6])]:
            for shape,count in zip(shapes,counts):
                r=self.records[f'{family}_{shape}'];self.assertEqual(r['cubes'],count)
                self.assertEqual(len(read(ROOT/'upstream'/r['source'])['elements']),count)
    def test_glass_pane_remains_single_sided(self):
        for shape in ['single','left','middle','right']:
            r=self.records[f'glass_bar_cabinet_{shape}'];src=read(ROOT/'upstream'/r['source'])
            panes=[e for e in src['elements']if e['from'][2]==e['to'][2]]
            self.assertEqual(len(panes),1);self.assertEqual(set(panes[0]['faces']),{'north'})
            geo=read(ROOT/r['geometry'])['minecraft:geometry'][0]
            panes=[c for b in geo['bones']for c in b.get('cubes',[])if c['size'][2]==0]
            self.assertEqual(len(panes),1);self.assertEqual(len(panes[0]['uv']),1)
    def test_vodka_four_distinct_source_arrangements(self):
        hashes=set()
        for n in range(1,5):
            r=self.records[f'vodka_{n}'];self.assertEqual(r['cubes'],4*n)
            hashes.add(hashlib.sha256((ROOT/'upstream'/r['source']).read_bytes()).hexdigest())
        self.assertEqual(len(hashes),4)
    def test_every_a5_geometry_editor_texture_retained(self):
        baseline=read(ROOT/'docs/A5-BASELINE-HASHES.json')
        self.assertEqual(len(baseline),310)
        for rel,h in baseline.items():self.assertEqual(hashlib.sha256((ROOT/rel).read_bytes()).hexdigest(),h,rel)

if __name__=='__main__':unittest.main()
