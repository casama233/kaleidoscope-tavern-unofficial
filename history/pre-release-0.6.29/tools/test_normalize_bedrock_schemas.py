#!/usr/bin/env python3
"""Focused tests for the documented Bedrock schema normalizer rules."""
import json
import tempfile
import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import normalize_bedrock_schemas as normalizer


class NormalizeBedrockSchemasTests(unittest.TestCase):
    def test_only_confirmed_schema_fields_change_and_pass_is_idempotent(self):
        with tempfile.TemporaryDirectory() as td:
            runtime = Path(td) / 'runtime'
            bp = runtime / 'BP'
            (bp / 'blocks').mkdir(parents=True)
            (bp / 'recipes').mkdir()
            (bp / 'entities').mkdir()
            block_path = bp / 'blocks' / 'tap.json'
            block_path.write_text(json.dumps({'minecraft:block': {
                'description': {'identifier': 'kaleidoscope_tavern:tap'},
                'components': {
                    'minecraft:material_instances': {'*': {'ambient_occlusion': False}},
                    'minecraft:item_visual': {'material_instances': {'*': {'ambient_occlusion': True}}},
                    'minecraft:entity_fall_on': {'minimum_fall_distance': 0.5},
                },
                'permutations': [{'condition': "q.block_state('kt:shape') == \"single\"", 'components': {'minecraft:light_emission': 4}}],
            }}))
            recipe_path = bp / 'recipes' / 'tap.json'
            recipe_path.write_text(json.dumps({'format_version': '1.20.10', 'minecraft:recipe_shapeless': {
                'description': {'identifier': 'kaleidoscope_tavern:tap'},
                'ingredients': [{'item': 'minecraft:barrel'}],
                'result': {'item': 'kaleidoscope_tavern:tap'},
            }}))
            entity_path = bp / 'entities' / 'visual.json'
            entity_path.write_text(json.dumps({'minecraft:entity': {'description': {
                'identifier': 'kaleidoscope_tavern:visual',
                'properties': {'kt:phase': {'type': 'float', 'range': [0, 12], 'default': 0}},
            }}}))

            counts = normalizer.normalize_runtime(runtime)
            block = json.loads(block_path.read_text())['minecraft:block']
            self.assertEqual(block['components']['minecraft:material_instances']['*']['ambient_occlusion'], 0.0)
            self.assertEqual(block['components']['minecraft:item_visual']['material_instances']['*']['ambient_occlusion'], 1.0)
            self.assertEqual(block['components']['minecraft:entity_fall_on'], {'min_fall_distance': 0.5})
            self.assertEqual(block['permutations'][0]['condition'], "q.block_state('kt:shape') == 'single'")
            recipe = json.loads(recipe_path.read_text())['minecraft:recipe_shapeless']
            self.assertEqual(recipe['unlock'], [{'item': 'minecraft:barrel'}])
            entity = json.loads(entity_path.read_text())['minecraft:entity']['description']['properties']['kt:phase']
            self.assertEqual(entity['default'], 0.0)
            self.assertEqual(entity['range'], [0.0, 12.0])
            self.assertEqual(counts, {'ambient_occlusion': 2, 'entity_fall_on': 1, 'molang_literals': 1,
                                      'recipe_unlock': 1, 'float_defaults': 1, 'float_ranges': 2})
            self.assertEqual(normalizer.normalize_runtime(runtime), {
                'ambient_occlusion': 0, 'entity_fall_on': 0, 'molang_literals': 0,
                'recipe_unlock': 0, 'float_defaults': 0, 'float_ranges': 0,
            })

    def test_foreign_pack_identifiers_are_untouched(self):
        with tempfile.TemporaryDirectory() as td:
            bp = Path(td) / 'BP'
            (bp / 'blocks').mkdir(parents=True)
            path = bp / 'blocks' / 'foreign.json'
            original = {'minecraft:block': {
                'description': {'identifier': 'other_pack:light'},
                'components': {'minecraft:material_instances': {'*': {'ambient_occlusion': False}}},
            }}
            path.write_text(json.dumps(original))
            self.assertEqual(normalizer.normalize_runtime(bp), {})
            self.assertEqual(json.loads(path.read_text()), original)


if __name__ == '__main__':
    unittest.main()
