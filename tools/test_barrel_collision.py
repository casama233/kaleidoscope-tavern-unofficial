#!/usr/bin/env python3
"""Regress the actual invisible edge wall, wrong axis and selection mismatch."""
import copy
import json
import unittest
from check_barrel_collision import ROOT, author_shapes, checked_states


class BarrelCollisionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.expected = author_shapes()
        cls.core, cls.part = [json.loads((ROOT / f'runtime/BP/blocks/{name}.json').read_text())['minecraft:block']
                              for name in ('barrel_core', 'barrel_part')]

    def test_all_layers_and_directions_match_original_method(self):
        self.assertEqual(checked_states(self.core, self.part, self.expected), 108)

    def test_original_full_cube_edge_failure_is_rejected(self):
        old = copy.deepcopy(self.part)
        old.pop('permutations')
        with self.assertRaises(AssertionError):
            checked_states(self.core, old, self.expected)

    def test_axis_or_edge_reversal_is_rejected(self):
        for field, replacement in [('condition', self.part['permutations'][0]['condition'].replace(':dx', ':dz')),
                                   ('components', self.part['permutations'][1]['components'])]:
            wrong = copy.deepcopy(self.part)
            wrong['permutations'][0][field] = copy.deepcopy(replacement)
            with self.assertRaises(AssertionError):
                checked_states(self.core, wrong, self.expected)

    def test_selection_cannot_retain_invisible_edge(self):
        wrong = copy.deepcopy(self.part)
        wrong['permutations'][0]['components'].pop('minecraft:selection_box')
        with self.assertRaises(AssertionError):
            checked_states(self.core, wrong, self.expected)


if __name__ == '__main__':
    unittest.main()
