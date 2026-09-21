#!/usr/bin/env python3
"""Validate client-facing localization contracts for the generated C6 runtime."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "runtime" / "BP"
RP = ROOT / "runtime" / "RP"

def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))

def load_lang(path):
    rows = {}
    duplicates = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key in rows:
            duplicates.append(key)
        rows[key] = value
    return rows, duplicates

def main():
    failures = []

    def check(label, ok, detail=""):
        if not ok:
            failures.append({"check": label, "detail": detail})

    advertised = load_json(RP / "texts" / "languages.json")
    check("languages_is_list", isinstance(advertised, list), advertised)
    check("languages_has_en_US", "en_US" in advertised, advertised)

    lang_maps = {}
    if isinstance(advertised, list):
        for locale in advertised:
            path = RP / "texts" / f"{locale}.lang"
            check(f"language_file:{locale}", path.is_file(), str(path))
            if not path.is_file():
                continue
            rows, duplicates = load_lang(path)
            lang_maps[locale] = rows
            check(f"language_unique_keys:{locale}", not duplicates, duplicates[:64])

    item_defs = {}
    block_defs = {}
    for path in (ROOT / "runtime").rglob("*.json"):
        try:
            data = load_json(path)
        except Exception:
            continue
        if not isinstance(data, dict):
            continue
        if "minecraft:item" in data:
            item = data["minecraft:item"]
            item_defs[item["description"]["identifier"]] = item
        if "minecraft:block" in data:
            block = data["minecraft:block"]
            block_defs[block["description"]["identifier"]] = block

    for ident, item in item_defs.items():
        components = item.get("components", {})
        display = components.get("minecraft:display_name")
        value = display.get("value") if isinstance(display, dict) else display
        check(f"item_display_present:{ident}", isinstance(value, str) and bool(value), value)
        if isinstance(value, str) and value:
            check(f"item_display_not_rawtext:{ident}", not value.startswith("%"), value)
            if not value.startswith("%"):
                missing = [lc for lc in advertised if value not in lang_maps.get(lc, {})]
                check(f"item_display_localized:{ident}", not missing, {"key": value, "missing": missing})

        button = components.get("minecraft:interact_button")
        if isinstance(button, str):
            missing = [lc for lc in advertised if button not in lang_maps.get(lc, {})]
            check(f"interact_button_localized:{ident}", not missing, {"key": button, "missing": missing})

    # Java exposes one max-quality creative representative per quality drink family.
    quality = []
    for ident, item in item_defs.items():
        match = re.search(r"_q([1-6])$", ident)
        if not match:
            continue
        q = int(match.group(1))
        visible = "menu_category" in item.get("description", {})
        quality.append((ident, q, visible))
    check("quality_variant_count", len(quality) == 144, len(quality))
    bad_visibility = [ident for ident, q, visible in quality if visible != (q == 6)]
    check("quality_creative_only_q6", not bad_visibility, bad_visibility[:64])
    check("quality_creative_representatives", sum(1 for _, _, visible in quality if visible) == 24)

    # Any block directly exposed to Creative must have a tile name in every advertised locale.
    for ident, block in block_defs.items():
        if "menu_category" not in block.get("description", {}):
            continue
        key = f"tile.{ident}.name"
        missing = [lc for lc in advertised if key not in lang_maps.get(lc, {})]
        check(f"block_display_localized:{ident}", not missing, {"key": key, "missing": missing})

    report = {
        "advertised_locales": advertised,
        "items": len(item_defs),
        "blocks": len(block_defs),
        "quality_variants": len(quality),
        "failures": failures,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
