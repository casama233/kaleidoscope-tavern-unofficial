#!/usr/bin/env python3
"""Lexical guard regressions, distinct from numerical and native acceptance."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from check_molang import ROOT, audit
from molang_syntax import compound_assignments, expressions, issues, validate


class MolangSyntaxTests(unittest.TestCase):
    def test_rejects_compound_operators(self):
        for op in ('+=', '-=', '*=', '/=', '%=', '**=', '??=', '&=', '|=', '^=', '<<=', '>>=', '>>>='):
            for lhs in ('variable.kt_tick', 'v.dx', 'temp.count', 't.value', 'V.VALUE'):
                text = f'{lhs}{op}1;'
                with self.subTest(op=op, lhs=lhs):
                    self.assertEqual(compound_assignments(text), [(len(lhs), op)])

    def test_explicit_arithmetic_and_comparisons_remain_valid(self):
        text = 'v.x=v.x+(1);v.dx=v.dx*(0.98);v.dy=v.dy-(-0.004);v.s=(v.input ?? 0);'
        text += 'v.ok=(v.x>=0)&&(v.x<=1)&&(v.x==v.y)&&(v.x!=v.z);'
        self.assertEqual(compound_assignments(text), [])

    def test_does_not_flag_quoted_strings_or_resource_names(self):
        self.assertEqual(compound_assignments("q.is_name_any('v.x+=1;', '+=', '*=')"), [])
        self.assertEqual(issues({'description': {'identifier': 'pack:name+=1'}}), [])
        text = "v.a='+=v.b';v.x*=2;"
        self.assertEqual(compound_assignments(text), [(text.index('*='), '*=')])

    def test_creation_events_and_render_loops_are_both_checked(self):
        data = {'particle_effect': {'events': {'kt_init': {'expression': 'variable.kt_dx*=variable.kt_scale;'}},
                                   'components': {'minecraft:particle_initialization': {
                                       'per_render_expression': 'loop(2, {v.x+=v.dx;v.tick+=1;});'}}}}
        rows = issues(data)
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0]['pointer'], '/particle_effect/events/kt_init/expression')
        self.assertEqual(rows[1]['pointer'], '/particle_effect/components/minecraft:particle_initialization/per_render_expression')
        with self.assertRaisesRegex(ValueError, 'kt_init/expression'):
            validate(data, 'fx_item_sugar.json')

    def test_array_values_and_nested_particle_events(self):
        data = {'events': {'run': {'sequence': [{'particle_effect': {'pre_effect_expression': 'v.y-=0.125;'}}]}},
                'scripts': {'pre_animation': ['v.a=0;', 'v.a+=1;']}}
        rows = issues(data)
        self.assertEqual([row['operator'] for row in rows], ['-=', '+='])
        self.assertEqual(rows[1]['pointer'], '/scripts/pre_animation/1')

    def test_empty_scan_is_not_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, 'No JSON'):
                audit(Path(tmp))

    def test_cli_rejects_injected_regression(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            (path / 'fx_item_sugar.json').write_text(json.dumps({'expression': 'v.x*=0.98;'}))
            run = subprocess.run([sys.executable, str(ROOT/'tools/effects/check_molang.py'), '--root', tmp],
                                 capture_output=True, text=True)
            self.assertEqual(run.returncode, 1)
            self.assertIn('fx_item_sugar.json/expression', run.stderr)
            self.assertIn("'*='", run.stderr)

    def test_generator_refuses_to_write_invalid_particle(self):
        import build_feedback_particles as generator
        with tempfile.TemporaryDirectory() as tmp:
            old = generator.OUT
            try:
                generator.OUT = Path(tmp)
                with self.assertRaises(ValueError):
                    generator.save('bad', {'events': {'kt_init': {'expression': 'v.tick+=1;'}}})
                self.assertFalse((Path(tmp)/'bad.json').exists())
            finally:
                generator.OUT = old

    def test_all_committed_runtime_json_is_scanned(self):
        report = audit(ROOT / 'runtime')
        self.assertGreater(report['jsonFiles'], 1900)
        self.assertGreater(report['molangStrings'], 1000)
        self.assertEqual(report['errors'], [])

    def test_every_logged_particle_has_a_nonempty_checked_motion(self):
        for name in ('fx_item_sugar', 'fx_item_slime_ball', 'fx_item_potato', 'fx_item_diamond',
                     'fx_model_purple_bar_stool', 'fx_model_white_bar_stool', 'snow_incense_large',
                     'snow_incense_ambient', 'ginkgo_incense_ambient', 'pine_incense_ambient',
                     'catnip_incense_ambient', 'sakura_incense'):
            with self.subTest(name=name):
                data = json.loads((ROOT / 'runtime/RP/particles' / (name + '.json')).read_text())
                validate(data, name)
                effect = data['particle_effect']
                self.assertTrue(effect['events'])
                motion = effect['components']['minecraft:particle_initialization']['per_render_expression']
                self.assertIn('loop(', motion)
                self.assertIn('variable.kt_tick=variable.kt_tick+(1);', motion)
                self.assertTrue(list(expressions(data)))


if __name__ == '__main__':
    unittest.main()
