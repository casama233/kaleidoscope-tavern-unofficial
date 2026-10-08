#!/usr/bin/env python3
"""Keep optional pinned source validation intact in the aggregate release CLI."""
from pathlib import Path
import copy
import json
import subprocess
import sys
import tempfile
import unittest

from check_release import ROOT, REVIEWED_ITEM_GEOMETRIES, check_combined_geometry_budget, parse_args, source_check_commands


class ReleaseSourceArguments(unittest.TestCase):
    def test_default_still_runs_both_source_checks_without_optional_pins(self):
        commands = source_check_commands(parse_args([]), "0.6.89")
        self.assertEqual(commands, {
            "storage": [sys.executable, str(ROOT / "tools/check_storage_rendering.py")],
            "launch": [sys.executable, str(ROOT / "tools/check_launch.py")],
        })

    def test_pinned_java_reaches_both_checks_and_writes_storage_evidence(self):
        java = Path("source fixtures/java checkout")
        commands = source_check_commands(parse_args(["--java-source", str(java)]), "0.6.89")
        for command in commands.values():
            self.assertEqual(command[command.index("--java-source") + 1], str(java.resolve()))
        report = commands["storage"][commands["storage"].index("--report") + 1]
        self.assertEqual(report, str(ROOT / "docs/STORAGE-VALIDATION-0.6.89.json"))
        self.assertNotIn("--report", commands["launch"])

    def test_baseline_reaches_launch_check_without_requiring_java(self):
        baseline = Path("source fixtures/pinned baseline")
        commands = source_check_commands(parse_args(["--baseline", str(baseline)]), "0.6.89")
        self.assertEqual(commands["launch"][-2:], ["--baseline", str(baseline.resolve())])
        self.assertNotIn("--baseline", commands["storage"])
        self.assertNotIn("--java-source", commands["launch"])

    def test_combined_pins_are_separate_arguments_not_shell_text(self):
        args = parse_args(["--java-source", "java $source", "--baseline", "base; source"])
        commands = source_check_commands(args, "0.6.89")
        launch = commands["launch"]
        self.assertEqual(launch.count("--java-source"), 1)
        self.assertEqual(launch.count("--baseline"), 1)
        self.assertEqual(launch[-1], str(Path("base; source").resolve()))

    def test_cli_help_exposes_pins_before_running_validators(self):
        result = subprocess.run([sys.executable, str(ROOT / "tools/check_release.py"), "--help"],
                                check=True, capture_output=True, text=True)
        self.assertIn("--java-source", result.stdout)
        self.assertIn("--baseline", result.stdout)


class GeometryBudgetTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        ledger=json.loads((ROOT/'data/baseline-reconciliation.json').read_text())
        for name in REVIEWED_ITEM_GEOMETRIES.values():
            path=self.root/name;path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes((ROOT/name).read_bytes())
        for name,value in {
            'data/baseline-reconciliation.json':{'files':{name:ledger['files'][name] for name in REVIEWED_ITEM_GEOMETRIES.values()}},
            'art/interfaces/animated-item-java-reference.json':json.loads((ROOT/'art/interfaces/animated-item-java-reference.json').read_text()),
        }.items():
            path=self.root/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value))
        self.inventory={f'geometry.original_{i}':[self.root/f'original_{i}.json'] for i in range(1023)}
        self.inventory.update({identifier:[self.root/name] for identifier,name in REVIEWED_ITEM_GEOMETRIES.items()})

    def test_exact_four_allocations_preserve_the_original_base_ceiling(self):
        result=check_combined_geometry_budget(self.inventory,self.root)
        self.assertEqual((result['geometries'],result['base_geometries']),(1027,1023))
        self.inventory['geometry.unreviewed_fifth']=[self.root/'fifth.geo.json']
        with self.assertRaisesRegex(AssertionError,'base geometry budget exceeded'):
            check_combined_geometry_budget(self.inventory,self.root)

    def test_same_total_cannot_replace_a_reviewed_id_with_an_arbitrary_model(self):
        self.inventory.pop(next(iter(REVIEWED_ITEM_GEOMETRIES)))
        self.inventory['geometry.unreviewed_replacement']=[self.root/'replacement.geo.json']
        self.assertEqual(len(self.inventory),1027)
        with self.assertRaisesRegex(AssertionError,'one exact Tavern owner/path'):
            check_combined_geometry_budget(self.inventory,self.root)

    def test_duplicate_or_moved_claim_cannot_hide_behind_the_identifier_set(self):
        identifier=next(iter(REVIEWED_ITEM_GEOMETRIES));original=self.inventory[identifier]
        for paths in [original+[self.root/'peer/duplicate.geo.json'],[self.root/'unscanned/moved.geo.json']]:
            self.inventory[identifier]=paths
            with self.assertRaisesRegex(AssertionError,'one exact Tavern owner/path'):
                check_combined_geometry_budget(self.inventory,self.root)

    def test_same_identifier_does_not_allow_more_geometry_or_cubes(self):
        path=self.root/next(iter(REVIEWED_ITEM_GEOMETRIES.values()));original=json.loads(path.read_text())
        extra_geometry=copy.deepcopy(original);extra_geometry['minecraft:geometry'].append(copy.deepcopy(extra_geometry['minecraft:geometry'][0]))
        extra_cube=copy.deepcopy(original);cubes=extra_cube['minecraft:geometry'][0]['bones'][0]['cubes'];cubes.append(copy.deepcopy(cubes[0]))
        for value in [extra_geometry,extra_cube]:
            path.write_text(json.dumps(value))
            with self.assertRaisesRegex(AssertionError,'Reviewed item geometry changed'):
                check_combined_geometry_budget(self.inventory,self.root)

    def test_the_allocation_cannot_be_repointed_to_an_unreviewed_source(self):
        path=self.root/'data/baseline-reconciliation.json';ledger=json.loads(path.read_text())
        next(iter(ledger['files'].values()))['reviewedSourceCommit']='0'*40
        path.write_text(json.dumps(ledger))
        with self.assertRaisesRegex(AssertionError,'allocation source changed'):
            check_combined_geometry_budget(self.inventory,self.root)


if __name__ == "__main__":
    unittest.main()
