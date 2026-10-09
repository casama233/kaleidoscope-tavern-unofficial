#!/usr/bin/env python3
"""Narrow output-safety/contract checks, deliberately not native UI acceptance."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

import generate_board_probe as probe


class IsolatedProbeTests(unittest.TestCase):
    def test_generation_preserves_source_and_isolates_identity(self):
        source = probe.ROOT / "runtime/RP/ui/server_form.json"
        before = source.read_bytes()
        canonical = json.loads(before)
        with tempfile.TemporaryDirectory() as temp:
            out = Path(temp) / "new"
            report = probe.generate(out)
            self.assertFalse(report["client_tested"])
            self.assertFalse(report["production_ready"])
            generated = json.loads((out / "RP/ui/server_form.json").read_text())
            for key, value in canonical.items():
                self.assertEqual(generated[key], value, key)
            # Factory/form/dropdown/submit definitions are inherited, never duplicated.
            self.assertFalse({"generated_contents", "custom_form", "custom_dropdown",
                              "custom_form_scrolling_content"}.intersection(generated))
            for folder in ("kt_guide_animated", "tavern_entries"):
                for name in probe.GUIDE_NAMES:
                    relative = f"textures/ui/{folder}/{name}.png"
                    self.assertEqual((out / "RP" / relative).read_bytes(),
                                     (probe.ROOT / "runtime/RP" / relative).read_bytes())
            bp = json.loads((out / "BP/manifest.json").read_text())
            rp = json.loads((out / "RP/manifest.json").read_text())
            ids = set(report["diagnostic_pack_ids"].values())
            self.assertEqual(len(ids), 5)
            for name, manifest in (("BP", bp), ("RP", rp)):
                official = json.loads((probe.ROOT / f"runtime/{name}/manifest.json").read_text())
                self.assertNotIn(official["header"]["uuid"], ids)
                self.assertEqual(manifest["header"]["version"], [0, 0, 1])
            self.assertEqual(bp["dependencies"][0]["uuid"], rp["header"]["uuid"])
            script = (out / "BP/scripts/main.js").read_text()
            self.assertNotIn("/*__PROBE_CONFIG__*/", script)
            subprocess.run(["node", "--input-type=module", "--check"], input=script,
                           text=True, check=True, capture_output=True)
        self.assertEqual(source.read_bytes(), before)

    def test_output_refuses_existing_and_repository_paths(self):
        with tempfile.TemporaryDirectory() as temp:
            existing = Path(temp)
            sentinel = existing / "keep.txt"
            sentinel.write_text("keep")
            with self.assertRaisesRegex(ValueError, "brand-new"):
                probe.generate(existing)
            self.assertEqual(sentinel.read_text(), "keep")
        with self.assertRaisesRegex(ValueError, "outside"):
            probe.generate(probe.ROOT / "must-not-create-board-probe-output")
        self.assertFalse((probe.ROOT / "must-not-create-board-probe-output").exists())

    def test_native_input_contract_and_exclusive_guards(self):
        ui = probe.candidate_ui()
        fixture = json.loads((probe.ROOT / "tools/fixtures/mojang-server-form-reference.json").read_text())
        key = "custom_input@settings_common.option_text_edit"
        expected = dict(fixture["files"]["server_form.json"]["nodes"][key])
        expected["$control_name"] = "server_form.kt_probe_input_branches"
        self.assertEqual(ui[key], expected)
        for kind, limit in probe.KINDS.items():
            node = ui[f"kt_probe_{kind}@common.scrollable_multiline_text_edit_box"]
            self.assertEqual(node["max_length"], limit)
            self.assertEqual(node["$text_edit_box_binding_condition"], "visible")
            bindings = node["modifications"][0]["value"]
            self.assertEqual([b["target_property_name"] for b in bindings[2:]],
                             ["#visible", "#enabled", "#focus_enabled"])
            for binding in bindings[2:]:
                self.assertIn(probe.predicate(kind), binding["source_property_name"])
        foreign = ui["kt_probe_foreign@settings_common.option_text_edit_control"]
        self.assertNotIn("max_length", foreign)
        self.assertNotIn("enabled_newline", foreign)
        guard = foreign["modifications"][0]["value"][2]["source_property_name"]
        self.assertTrue(guard.startswith("(not "))
        for kind in probe.KINDS:
            self.assertIn(probe.predicate(kind), guard)


if __name__ == "__main__":
    unittest.main()
