#!/usr/bin/env python3
"""Generate an isolated, unaccepted client probe; never patch canonical runtime.

The primitive/template links are source-backed. Sharing the server-form text
controller between mutually exclusive siblings is a hypothesis for human testing.
"""
import argparse
import copy
import json
from pathlib import Path
import shutil
import sys
import uuid

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent))
from native_input_bindings import scoped_input
PIN = "46ba6ea985fb5a92d79a9419198f10dda14c199d"
KINDS = {"sandwich": 320, "small": 350, "large": 1500}
TITLE_PREFIX = "KT client probe / "
FIELD = "KT probe raw text (index 0)"
GUIDE_NAMES = ("depth_charge", "mystery_cocktail", "nether_special", "ice_grape")


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def predicate(kind):
    return (f"((#kt_probe_title = '{TITLE_PREFIX}{kind}') and "
            f"(#kt_probe_field = '{FIELD}'))")


def candidate_ui(root=ROOT):
    ui = json.loads((root / "runtime/RP/ui/server_form.json").read_text())
    reference = json.loads((root / "tools/fixtures/mojang-server-form-reference.json").read_text())
    if reference["commit"] != PIN:
        raise ValueError("Mojang source pin changed; review this diagnostic before generating")
    original_key = "custom_input@settings_common.option_text_edit"
    # Copy the exact factory target and change only the public control-name hook.
    # generated_contents, custom_form, both dropdowns and submit stay native.
    if "custom_input" in ui:
        raise ValueError("Unexpected canonical custom_input; review before overlaying")
    if original_key in ui:
        expected=copy.deepcopy(reference["files"]["server_form.json"]["nodes"][original_key])
        expected["$control_name"]="server_form.kt_board_input_branches"
        if ui[original_key]!=expected:
            raise ValueError("Canonical native input contract changed; review before overlaying")
    ui[original_key] = copy.deepcopy(reference["files"]["server_form.json"]["nodes"][original_key])
    ui[original_key]["$control_name"] = "server_form.kt_probe_input_branches"
    owned = "(" + " or ".join(predicate(kind) for kind in KINDS) + ")"
    branches = []
    for kind in ("foreign", *KINDS):
        key = "kt_probe_" + kind
        base = "settings_common.option_text_edit_control" if kind == "foreign" else "common.scrollable_multiline_text_edit_box"
        node = scoped_input(reference,base,f"(not {owned})" if kind == "foreign" else predicate(kind),'#kt_probe')
        if kind != "foreign":
            node.update({
                "size": ["100%", 120], "max_length": KINDS[kind],
                "$text_edit_box_content_binding_type": "collection",
                "$text_edit_box_content_binding_name": "#custom_input_text",
                "$text_edit_box_grid_collection_name": "custom_form",
                "$text_box_name": "custom_input",
                "$place_holder_text": "$option_place_holder_text",
                "$text_box_tts_header": "$option_label",
            })
        ui[key + "@" + base] = node
        branches.append({key + "@server_form." + key: {}})
    ui["kt_probe_input_branches"] = {
        "type": "stack_panel", "orientation": "vertical", "size": ["100%", "100%c"],
        "controls": branches,
    }
    return ui


def generate(output, root=ROOT):
    output = Path(output).expanduser().absolute()
    # Resolve parents before deciding containment, also reject dangling symlinks.
    if output.exists() or output.is_symlink():
        raise ValueError("Output must be a brand-new directory; existing paths are never overwritten")
    if output.resolve().is_relative_to(root.resolve()):
        raise ValueError("Output must be outside the canonical repository")
    ui = candidate_ui(root)
    # Validate every input before creating anything. No network or author checkout.
    inputs = [(root / "runtime/RP" / f"textures/ui/{folder}/{name}.png",
               f"RP/textures/ui/{folder}/{name}.png")
              for folder in ("kt_guide_animated", "tavern_entries") for name in GUIDE_NAMES]
    for source, _ in inputs:
        if not source.is_file():
            raise ValueError(f"Missing canonical guide input: {source}")
    script = (HERE / "board_probe.js").read_text(encoding="utf-8")
    result = json.loads((HERE / "results.template.json").read_text(encoding="utf-8"))
    ids = {key: str(uuid.uuid4()) for key in ("bp", "bp_data", "bp_script", "rp", "rp_resources")}
    version = [0, 0, 1]
    def header(kind):
        return {"name": f"KT board CLIENT DIAGNOSTIC {kind.upper()}",
                "description": "Unaccepted isolated UI probe. Not a Tavern release. Do not use on LIVE.",
                "uuid": ids[kind], "version": version, "min_engine_version": [1, 26, 50]}
    bp = {"format_version": 2, "header": header("bp"), "modules": [
        {"type": "data", "uuid": ids["bp_data"], "version": version},
        {"type": "script", "language": "javascript", "entry": "scripts/main.js",
         "uuid": ids["bp_script"], "version": version}], "dependencies": [
        {"uuid": ids["rp"], "version": version},
        {"module_name": "@minecraft/server", "version": "2.7.0"},
        {"module_name": "@minecraft/server-ui", "version": "2.0.0"}]}
    rp = {"format_version": 2, "header": header("rp"), "modules": [
        {"type": "resources", "uuid": ids["rp_resources"], "version": version}]}
    # mkdir's exclusive final component is deliberate; do not use exist_ok here.
    output.mkdir(parents=True)
    dump(output / "BP/manifest.json", bp)
    dump(output / "RP/manifest.json", rp)
    dump(output / "RP/ui/server_form.json", ui)
    (output / "BP/scripts").mkdir(parents=True)
    # JS has a generated literal instead of a JSON import unsupported by Script API.
    config = json.dumps({"kinds": KINDS, "titlePrefix": TITLE_PREFIX, "field": FIELD}, ensure_ascii=False)
    (output / "BP/scripts/main.js").write_text(script.replace("/*__PROBE_CONFIG__*/ null", config), encoding="utf-8")
    for source, relative in inputs:
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    result["diagnostic_pack_ids"] = ids
    dump(output / "results.json", result)
    shutil.copyfile(HERE / "README.md", output / "README.md")
    return {"output": str(output), "client_tested": False, "production_ready": False,
            "diagnostic_pack_ids": ids, "status": "pending_human_client_test"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="New directory outside this repository")
    args = parser.parse_args()
    try:
        print(json.dumps(generate(args.output), ensure_ascii=False, indent=2))
    except (ValueError, OSError) as error:
        parser.exit(2, f"Refused: {error}\n")


if __name__ == "__main__":
    main()
