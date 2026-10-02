#!/usr/bin/env python3
"""Keep optional pinned source validation intact in the aggregate release CLI."""
from pathlib import Path
import subprocess
import sys
import unittest

from check_release import ROOT, parse_args, source_check_commands


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


if __name__ == "__main__":
    unittest.main()
