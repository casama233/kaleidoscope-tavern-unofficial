#!/usr/bin/env python3
"""Regressions against accidentally skipping changed test or runtime inputs."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from ci_impact import changed_paths, plan


class ImpactTests(unittest.TestCase):
    def test_runtime_sources_tests_fixtures_and_dependencies_require_full_suite(self):
        for name in (
            "runtime/BP/scripts/core/effects.js", "runtime/RP/textures/x.png",
            "tools/check_release.py", "tools/efficiency/mock-loader.mjs",
            "tools/fixtures/reference.md", "tools/ambient-sparse.test.mjs",
            "family/tests/tavern-probe.js", "docs/fixtures/expected.md",
            "data/hud-native-reference.json", "sdk/api.js", "art/model.bbmodel",
            "baseline.json", "release-history.json", "release.json", "config.json",
            "manifest.json", "package-lock.json", ".github/workflows/validation.yml",
            "docs/RELEASE-NOTES-0.6.89.md", "unknown/config.toml", "new-tool.py",
        ):
            with self.subTest(name=name):
                self.assertTrue(plan([name])["runtime"])

    def test_family_tools_and_locks_use_always_running_family_regressions(self):
        for name in (
            "family/upstream.lock.json", "family/upstream-feedback.json",
            "tools/family_bundle.py", "tools/test_family_guard.py",
            "tools/family_update.py", "tools/family_update/test_resume.py",
            "tools/family_update/fixtures/live-receipt.json",
        ):
            with self.subTest(name=name):
                result = plan([name])
                self.assertTrue(result["baseline"])
                self.assertTrue(result["family"])
                self.assertFalse(result["runtime"])

    def test_narrative_docs_are_inexpensive_but_json_evidence_is_not(self):
        result = plan(["README.md", "docs/BASELINE-MAINTENANCE.md", "family/MAINTENANCE.md"])
        self.assertTrue(result["baseline"])
        self.assertFalse(result["runtime"])
        self.assertTrue(plan(["docs/VALIDATION-0.6.89.json"])["runtime"])

    def test_mixed_changes_cannot_hide_runtime_or_new_family_tests(self):
        self.assertTrue(plan(["docs/a.md", "family/upstream.lock.json", "tools/new-test.py"])["runtime"])
        self.assertTrue(plan(["tools/test_family_new_feature.py"])["runtime"])

    def test_manual_missing_payload_and_unknown_event_require_full_suite(self):
        for event_name, event in (("workflow_dispatch", {}), ("push", {}), ("pull_request", {}), ("schedule", {})):
            with self.subTest(event=event_name):
                names, reason = changed_paths(event_name, event, Path("."))
                self.assertTrue(plan(names, reason)["runtime"])
        names, reason = changed_paths("push", {"before": "0" * 40, "after": "1" * 40}, Path("."))
        self.assertTrue(plan(names, reason)["runtime"])

    def test_missing_git_history_requires_full_suite(self):
        names, reason = changed_paths("push", {"before": "1" * 40, "after": "2" * 40}, Path("."))
        self.assertTrue(plan(names, reason)["runtime"])

    def test_cli_produces_boolean_outputs(self):
        import os
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "outputs"
            env = {**os.environ, "GITHUB_OUTPUT": str(output)}
            env.pop("GITHUB_STEP_SUMMARY", None)
            result = subprocess.run(
                ["python3", str(Path(__file__).with_name("ci_impact.py")), "--paths", "family/upstream.lock.json"],
                env=env, check=True, capture_output=True, text=True,
            )
            self.assertFalse(json.loads(result.stdout)["runtime"])
            self.assertIn("runtime=false\n", output.read_text())
            self.assertIn("baseline=true\n", output.read_text())

    def test_rename_from_runtime_to_markdown_and_multicommit_push(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            def git(*args):
                return subprocess.check_output(["git", *args], cwd=repo, text=True).strip()
            git("init", "-q")
            git("config", "user.name", "CI regression")
            git("config", "user.email", "ci@example.invalid")
            (repo / "runtime").mkdir()
            (repo / "runtime/a.js").write_text("source\n")
            git("add", ".")
            git("commit", "-qm", "base")
            before = git("rev-parse", "HEAD")
            (repo / "docs").mkdir()
            git("mv", "runtime/a.js", "docs/a.md")
            git("commit", "-qm", "rename")
            (repo / "docs/b.md").write_text("last commit only changes docs\n")
            git("add", ".")
            git("commit", "-qm", "docs")
            after = git("rev-parse", "HEAD")
            for event_name, event in (
                ("push", {"before": before, "after": after}),
                ("pull_request", {"pull_request": {"base": {"sha": before}, "head": {"sha": after}}}),
            ):
                with self.subTest(event=event_name):
                    names, reason = changed_paths(event_name, event, repo)
                    self.assertIsNone(reason)
                    self.assertIn("runtime/a.js", names)
                    self.assertIn("docs/b.md", names)
                    self.assertTrue(plan(names, reason)["runtime"])


if __name__ == "__main__":
    unittest.main()
