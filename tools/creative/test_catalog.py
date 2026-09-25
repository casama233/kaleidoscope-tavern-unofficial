"""Native catalog data tests, not a Minecraft inventory renderer simulation."""
import copy
import importlib.util
import json
import hashlib
import os
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('creative_catalog', Path(__file__).with_name('catalog.py'))
c = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(c)
TAVERN = Path(__file__).resolve().parents[2]
LIQUOR = Path(os.environ.get('LIQUOR_SOURCE', TAVERN.parent / 'world-liquor-src'))
KEY = 'kaleidoscope_tavern:itemGroup.name.tavern_'
COLORS = 'white light_gray gray black brown red orange yellow lime green cyan light_blue blue purple magenta pink'.split()


def put(root, path, value):
    path = root / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(c.encoded(value))


class FixtureTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.id = 'kaleidoscope_tavern:white_bar_stool'
        self.item = 'runtime/BP/items/white_bar_stool.json'
        self.block = 'runtime/BP/blocks/white_bar_stool.json'
        put(self.root, c.PLAN, {'schema': 1, 'namespace': 'kaleidoscope_tavern', 'groups': {'stools': ['white_bar_stool']}})
        put(self.root, c.CATALOG, {'format_version': '1.21.90', 'minecraft:crafting_items_catalog': {'categories': [
            {'category_name': 'equipment', 'groups': [{'group_identifier': {'name': KEY+'decor', 'icon': self.id}, 'items': [self.id]}]}]}})
        put(self.root, self.item, {'format_version': '1.26.50', 'minecraft:item': {
            'description': {'identifier': self.id, 'menu_category': {'category': 'equipment', 'group': KEY+'decor'}},
            'components': {'minecraft:max_stack_size': 64, 'minecraft:block_placer': {'block': self.id}}}})
        put(self.root, self.block, {'format_version': '1.26.50', 'minecraft:block': {
            'description': {'identifier': self.id, 'menu_category': {'category': 'none'}}, 'components': {'test:untouched': {}}}})
        for locale in c.LOCALES:
            path = self.root / 'runtime/RP/texts' / (locale+'.lang')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('pack.name=Original\n## Shared Tavern effect bar names\neffect.test=Original Effect\n')

    def test_visible_menu_matches_new_group(self):
        c.apply(self.root, True)
        self.assertEqual(c.load(self.root/self.item)['minecraft:item']['description']['menu_category']['group'], KEY+'stools')

    def test_hidden_implementation_block_is_byte_preserved(self):
        old = (self.root/self.block).read_bytes()
        c.apply(self.root, True)
        self.assertEqual(old, (self.root/self.block).read_bytes())

    def test_gameplay_components_unchanged(self):
        old = c.load(self.root/self.item)
        c.apply(self.root, True)
        new = c.load(self.root/self.item)
        old['minecraft:item']['description'].pop('menu_category')
        new['minecraft:item']['description'].pop('menu_category')
        self.assertEqual(old, new)

    def test_check_fails_on_stale_data_without_writing(self):
        old = (self.root/c.CATALOG).read_bytes()
        with self.assertRaisesRegex(ValueError, 'Stale creative'):
            c.apply(self.root)
        self.assertEqual(old, (self.root/c.CATALOG).read_bytes())

    def test_idempotent_generation(self):
        c.apply(self.root, True)
        self.assertEqual(c.apply(self.root, True)['changed_files'], 0)

    def test_catalog_membership_unchanged(self):
        old = set(c.entries(c.load(self.root/c.CATALOG)))
        c.apply(self.root, True)
        self.assertEqual(old, set(c.entries(c.load(self.root/c.CATALOG))))

    def test_unknown_new_decoration_requires_review(self):
        data = c.load(self.root/c.CATALOG)
        data['minecraft:crafting_items_catalog']['categories'][0]['groups'][0]['items'].append('kaleidoscope_tavern:new_decoration')
        put(self.root, c.CATALOG, data)
        with self.assertRaisesRegex(ValueError, 'missing from the reviewed plan'):
            c.planned(self.root)

    def test_does_not_promote_uncatalogued_item(self):
        plan = c.load(self.root/c.PLAN)
        plan['groups']['stools'].append('hidden_item')
        put(self.root, c.PLAN, plan)
        with self.assertRaisesRegex(ValueError, 'absent from the visible catalog'):
            c.planned(self.root)

    def test_unknown_alias_rejected(self):
        plan = c.load(self.root/c.PLAN)
        plan['groups'] = {'not_real': ['white_bar_stool']}
        put(self.root, c.PLAN, plan)
        with self.assertRaisesRegex(ValueError, 'Unknown/empty'):
            c.planned(self.root)

    def test_duplicate_plan_rejected(self):
        plan = c.load(self.root/c.PLAN)
        plan['groups']['stools'].append('white_bar_stool')
        put(self.root, c.PLAN, plan)
        with self.assertRaisesRegex(ValueError, 'Duplicate plan'):
            c.planned(self.root)

    def test_duplicate_catalog_rejected(self):
        data = c.load(self.root/c.CATALOG)
        data['minecraft:crafting_items_catalog']['categories'][0]['groups'][0]['items'].append(self.id)
        put(self.root, c.CATALOG, data)
        with self.assertRaisesRegex(ValueError, 'Duplicate/invalid catalog'):
            c.planned(self.root)

    def test_hidden_only_id_rejected(self):
        value = c.load(self.root/self.item)
        value['minecraft:item']['description']['menu_category'] = {'category': 'none'}
        put(self.root, self.item, value)
        with self.assertRaisesRegex(ValueError, 'No visible definition'):
            c.planned(self.root)

    def test_other_generated_language_tail_is_preserved(self):
        c.apply(self.root, True)
        for locale in c.LOCALES:
            data = (self.root/'runtime/RP/texts'/(locale+'.lang')).read_text()
            self.assertTrue(data.endswith('## Shared Tavern effect bar names\neffect.test=Original Effect\n'))
            self.assertIn('pack.name=Original\n', data)

    def test_duplicate_localization_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            c.localize(KEY+'stools=Other\n', {KEY+'stools': 'Stools'})


class RealPackTests(unittest.TestCase):
    def test_both_current_catalogs_are_reproducible(self):
        self.assertEqual(c.apply(TAVERN)['changed_files'], 0)
        self.assertEqual(c.apply(LIQUOR)['changed_files'], 0)

    def test_shared_merge_membership_independent_of_pack_order(self):
        self.assertEqual(c.check_pair([TAVERN, LIQUOR]), c.check_pair([LIQUOR, TAVERN]))

    def test_expected_shared_groups_and_counts(self):
        got = c.check_pair([TAVERN, LIQUOR])
        self.assertEqual({k.removeprefix(KEY): v for k, v in got.items()}, {
            'cabinets':13, 'racks':4, 'tables':2, 'sofas':16, 'stools':32, 'string_lights':17,
            'pendant_lamps':3, 'boards':15, 'paintings':22, 'incense':8, 'utilities':1, 'music':1})

    def test_all_members_resolve_and_hidden_variants_stay_absent(self):
        for root, count in [(TAVERN, 160), (LIQUOR, 66)]:
            catalog, defs = c.entries(c.load(root/c.CATALOG)), c.definitions(root)
            self.assertEqual(len(catalog), count)
            self.assertTrue(set(catalog).issubset(defs))
            self.assertFalse(any(item.endswith(tuple('_q'+str(i) for i in range(1,6))) for item in catalog))
            for item, (category, group) in catalog.items():
                self.assertTrue(any(v[k]['description'].get('menu_category') == {'category':category, 'group':group} for _, v, k in defs[item]), item)

    def test_color_order_matches_java_and_between_packs(self):
        t, w = c.load(TAVERN/c.PLAN)['groups'], c.load(LIQUOR/c.PLAN)['groups']
        self.assertEqual(t['sofas'], [x+'_sofa' for x in COLORS])
        self.assertEqual(t['stools'], [x+'_bar_stool' for x in COLORS])
        self.assertEqual(w['stools'], ['bar_stool_'+x for x in COLORS])
        self.assertEqual(t['string_lights'], ['string_lights_'+x for x in ['colorless',*COLORS]])

    def test_wild_vine_and_freezer_moved_to_correct_group(self):
        t, w = c.entries(c.load(TAVERN/c.CATALOG)), c.entries(c.load(LIQUOR/c.CATALOG))
        self.assertEqual(t['kaleidoscope_tavern:wild_grapevine'], ('nature',KEY+'cultivation'))
        self.assertEqual(w['kaleidoscope_world_liquor:freezer'], ('equipment',KEY+'brewing'))

    def test_shared_titles_match_in_all_languages(self):
        for locale in c.LOCALES:
            maps=[]
            for root in [TAVERN,LIQUOR]:
                lines=[l for l in (root/'runtime/RP/texts'/(locale+'.lang')).read_text().splitlines() if l and not l.startswith('##')]
                keys=[l.split('=',1)[0] for l in lines]
                self.assertEqual(len(keys),len(set(keys)))
                maps.append(dict(l.split('=',1) for l in lines))
            for spec in c.taxonomy()['groups'].values():
                self.assertEqual(maps[0][spec['name']], maps[1][spec['name']])

    def test_retired_catch_all_groups_are_absent(self):
        for root in [TAVERN,LIQUOR]:
            self.assertFalse({group for _,group in c.entries(c.load(root/c.CATALOG)).values()} & set(c.taxonomy()['retired_groups']))

    def test_build_and_validation_hooks_exist(self):
        self.assertIn('creative/catalog.py', (TAVERN/'tools/check_release.py').read_text())
        self.assertIn('creative/catalog.py', (LIQUOR/'tools/check_release.py').read_text())
        self.assertIn('creative/catalog.py', (LIQUOR/'tools/build_port.py').read_text())

class HistoricalProjectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location('creative_history', Path(__file__).with_name('historical.py'))
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    def test_old_item_and_block_hashes_remain_valid(self):
        for root, file, key in [(TAVERN, 'data/motion-source-reference.json', 'preservedGroups'),
                                (LIQUOR, 'data/storage-preserved-0.1.4.json', 'trees')]:
            projection = self.module.LegacyMenuProjection(root)
            for prefix, expected in c.load(root/file)[key].items():
                if not prefix.rstrip('/').endswith(('BP/items', 'BP/blocks')):
                    continue
                rows = [p.relative_to(root).as_posix()+'\0'+hashlib.sha256(projection.read_bytes(p)).hexdigest()+'\n'
                        for p in sorted((root/prefix).rglob('*')) if p.is_file()]
                self.assertEqual({'files':len(rows), 'sha256':hashlib.sha256(''.join(rows).encode()).hexdigest()}, expected)

    def test_projection_changes_only_menu(self):
        for root in (TAVERN, LIQUOR):
            projection = self.module.LegacyMenuProjection(root)
            for path in projection.menus:
                p = root/path
                kind = 'minecraft:item' if '/items/' in path else 'minecraft:block'
                current = c.load(p)
                old = json.loads(projection.read_bytes(p))
                current[kind]['description'].pop('menu_category')
                old[kind]['description'].pop('menu_category')
                self.assertEqual(current, old)

    def test_unreviewed_menu_change_is_not_masked(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('creative-legacy-menus.json','creative-decoration-groups.json'):
                put(root, 'data/'+name, c.load(TAVERN/'data'/name))
            path = 'runtime/BP/items/white_bar_stool.json'
            value = c.load(TAVERN/path)
            value['minecraft:item']['description']['menu_category']['is_hidden_in_commands'] = True
            put(root, path, value)
            with self.assertRaisesRegex(ValueError, 'Unreviewed menu'):
                self.module.LegacyMenuProjection(root).read_bytes(root/path)

    def test_gameplay_changes_still_change_historical_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('creative-legacy-menus.json','creative-decoration-groups.json'):
                put(root, 'data/'+name, c.load(TAVERN/'data'/name))
            path = 'runtime/BP/items/white_bar_stool.json'
            value = c.load(TAVERN/path)
            value['minecraft:item']['components']['test:accidental_gameplay_change'] = True
            put(root, path, value)
            self.assertNotEqual(self.module.LegacyMenuProjection(root).read_bytes(root/path),
                                self.module.LegacyMenuProjection(TAVERN).read_bytes(TAVERN/path))

    def test_unaffected_asset_keeps_exact_bytes(self):
        projection = self.module.LegacyMenuProjection(TAVERN)
        path = TAVERN/'runtime/BP/items/shaker.json'
        self.assertEqual(projection.read_bytes(path), path.read_bytes())

if __name__ == '__main__':
    unittest.main(verbosity=2)
