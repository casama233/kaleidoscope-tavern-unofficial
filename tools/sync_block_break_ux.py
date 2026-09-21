#!/usr/bin/env python3
"""Synchronize native block loot fallbacks and stable RP sound metadata.

Java source parity:
- ordinary furniture/stations drop themselves (or their matching item ID);
- trellised vines drop trellis + grapevine;
- grape crops drop 1..2 matching grapes plus a 30% green-grape bonus;
- stateful proxy/display blocks keep empty native loot because scripts preserve
  exact inventory / brew metadata when a player breaks them.

This is a deterministic post-build pass. Do not hand-edit its generated files.
"""
from pathlib import Path
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "runtime/BP"
RP = ROOT / "runtime/RP"
NS = "kaleidoscope_tavern"

EMPTY_LOOT = "loot_tables/empty.json"
STATEFUL_NATIVE_EMPTY = {
    "barrel_core",
    "barrel_part",
    "shaker_station",
    "cup_signature_cocktail",
}
SOUND_EVENT = {
    "wood": {"sound": "dig.wood", "volume": 1.0, "pitch": 0.9},
    "cloth": {"sound": "dig.cloth", "volume": 1.0, "pitch": 0.9},
    "glass": {"sound": "random.glass", "volume": 1.0, "pitch": 0.9},
    "chain": {"sound": "dig.chain", "volume": 1.0, "pitch": 0.9},
    "metal": {"sound": "dig.stone", "volume": 1.0, "pitch": 1.15},
    "lantern": {"sound": "block.lantern.break", "volume": 1.0, "pitch": 0.9},
    "grass": {"sound": "dig.grass", "volume": 0.7, "pitch": 0.9},
}


def dump(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sound_set(short):
    if short.startswith(("bottle_", "cup_")):
        return "glass"
    if short.endswith("_sofa"):
        return "cloth"
    if short.startswith("light_") or short.endswith("_pendant_lamp"):
        return "chain"
    if short in {"glassware_holder", "tap"}:
        return "metal"
    if short == "shaker_station":
        return "lantern"
    if short.endswith("_crop"):
        return "grass"
    return "wood"


def simple_loot(item_id):
    return {
        "pools": [{
            "rolls": 1,
            "entries": [{"type": "item", "name": item_id, "weight": 1}],
        }]
    }


def crop_loot(item_id):
    return {
        "pools": [
            {
                "rolls": 1,
                "entries": [{
                    "type": "item",
                    "name": item_id,
                    "weight": 1,
                    "functions": [{
                        "function": "set_count",
                        "count": {"min": 1, "max": 2},
                    }],
                }],
            },
            {
                "rolls": 1,
                "conditions": [{"condition": "random_chance", "chance": 0.3}],
                "entries": [{
                    "type": "item",
                    "name": f"{NS}:green_grape",
                    "weight": 1,
                }],
            },
        ]
    }


def loot_for(short):
    # These blocks are only safe to recover through their runtime transaction
    # handlers because the visible block ID does not contain the full item state.
    if short in STATEFUL_NATIVE_EMPTY or short.startswith("bottle_"):
        return None

    if short.startswith("stool_"):
        return simple_loot(f"{NS}:{short[6:]}_bar_stool")
    if short.startswith("light_"):
        return simple_loot(f"{NS}:string_lights_{short[6:]}")

    if short == "cup_empty_glassware":
        return simple_loot(f"{NS}:empty_glassware")
    if short.startswith("cup_"):
        return simple_loot(f"{NS}:{short[4:]}")

    if short in {"grapevine_trellis", "ice_grapevine_trellis", "gold_grapevine_trellis"}:
        return {
            "pools": [
                {"rolls": 1, "entries": [{"type": "item", "name": f"{NS}:trellis", "weight": 1}]},
                {"rolls": 1, "entries": [{"type": "item", "name": f"{NS}:grapevine", "weight": 1}]},
            ]
        }

    crop_items = {
        "grape_crop": "grape",
        "ice_grape_crop": "ice_grape",
        "gold_grape_crop": "gold_grape",
    }
    if short in crop_items:
        return crop_loot(f"{NS}:{crop_items[short]}")

    # Java's remaining currently-ported blocks are dropSelf. Storage furniture
    # still has script recovery first so contained bottles are preserved.
    return simple_loot(f"{NS}:{short}")


def apply_all():
    blocks_dir = BP / "blocks"
    loot_dir = BP / "loot_tables/blocks"
    if loot_dir.exists():
        shutil.rmtree(loot_dir)
    loot_dir.mkdir(parents=True, exist_ok=True)

    sounds = {"format_version": "1.19.30"}
    break_audio = {}
    report = {
        "source": "KaleidoscopeMods/KaleidoscopeTavern BlockLootTables.java + block SoundType declarations",
        "native_fallbacks": [],
        "script_stateful_empty": [],
        "sound_sets": {},
        "engine_acceptance": "NOT_RUN",
    }

    for path in sorted(blocks_dir.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        block = data["minecraft:block"]
        ident = block["description"]["identifier"]
        short = ident.split(":", 1)[1]
        components = block["components"]

        sound = sound_set(short)
        sounds[ident] = {"sound": sound}
        spec = SOUND_EVENT[sound]
        break_audio[ident] = {"material": sound, **spec}
        report["sound_sets"][ident] = sound

        loot = loot_for(short)
        if loot is None:
            components["minecraft:loot"] = EMPTY_LOOT
            report["script_stateful_empty"].append(ident)
        else:
            rel = f"loot_tables/blocks/{short}.json"
            components["minecraft:loot"] = rel
            dump(BP / rel, loot)
            report["native_fallbacks"].append(ident)

        dump(path, data)

    dump(RP / "blocks.json", sounds)
    (BP / "scripts/data/block-break-sounds.js").write_text(
        "// Generated by tools/sync_block_break_ux.py. Do not hand-edit.\n"
        "export const BLOCK_BREAK_SOUNDS = "
        + json.dumps(break_audio, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    report["blocks"] = len(sounds) - 1
    report["native_fallback_count"] = len(report["native_fallbacks"])
    report["script_stateful_empty_count"] = len(report["script_stateful_empty"])
    dump(ROOT / "docs/C6-BLOCK-BREAK-PARITY.json", report)


if __name__ == "__main__":
    apply_all()
