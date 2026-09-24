#!/usr/bin/env python3
"""Build private-use font atlases for the actionbar shaker HUD.

Uses the upstream Java shaker progress texture and current Bedrock item icons.
U+F600..U+F74F encode the 12 bar tiles with a cursor that can move one pixel
at a time; U+F750.. map the actual drink icons used by registered shaker inputs.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
JAVA = ROOT.parent / "java-upstream/src/main/resources/assets/kaleidoscope_tavern/textures/gui/shaker.png"
RUNTIME = ROOT / "runtime"
BP_ITEMS = RUNTIME / "BP/items"
ITEM_ATLAS = RUNTIME / "RP/textures/item_texture.json"
RP_TEXTURES = RUNTIME / "RP"
OUT_FONT = RUNTIME / "RP/font"
OUT_JS = RUNTIME / "BP/scripts/data/shaker-hud-icons.js"
CELL = 16
BAR_BASE = 0
BAR_START = 12
BAR_CONTINUE = BAR_START + 12 * 16
BAR_COUNT = BAR_CONTINUE + 12 * 11
ICON_BASE = BAR_COUNT
ORIGINAL_BUILTIN_FONT_PAGES = {"glyph_F9.png", "glyph_FA.png", "glyph_FB.png", "glyph_FD.png", "glyph_FE.png", "glyph_FF.png"}


def check_pages_free() -> None:
    names = {"glyph_F6.png", "glyph_F7.png"}
    if names & ORIGINAL_BUILTIN_FONT_PAGES:
        raise RuntimeError("selected page is present in the inspected Mojang vanilla font atlas")
    search_roots = [
        ROOT.parent / "baseline/resource_packs",
        ROOT.parent / "isolated/resource_packs/vanilla",
        ROOT.parent / "isolated/worlds/Freezer Test/resource_packs",
        Path("/var/lib/docker/volumes/bsm_data/_data/servers/luosen/worlds/Bedrock level/resource_packs"),
    ]
    collisions = []
    for base in search_roots:
        if base.exists():
            collisions.extend(p for p in base.rglob("glyph_F[67].png") if p.name in names and p.resolve() not in (OUT_FONT / p.name).resolve().parents)
    if collisions:
        raise RuntimeError("private-use glyph page collision: " + ", ".join(map(str, collisions)))


def put(sheet: Image.Image, index: int, glyph: Image.Image) -> None:
    x, y = (index % 16) * CELL, (index // 16) * CELL
    if glyph.height == CELL and 0 < glyph.width < CELL:
        padded = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        padded.alpha_composite(glyph.convert("RGBA"), (0, 0))
        glyph = padded
    if glyph.size != (CELL, CELL):
        raise ValueError(f"glyph {index:#x} has invalid size {glyph.size}")
    sheet.alpha_composite(glyph.convert("RGBA"), (x, y))


def item_icon_key(item_path: Path) -> str | None:
    obj = json.loads(item_path.read_text())
    item = obj.get("minecraft:item", {})
    if not item:
        return None
    value = item.get("components", {}).get("minecraft:icon")
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("texture")
    return None


def main() -> None:
    check_pages_free()
    java = Image.open(JAVA).convert("RGBA")
    bar = java.crop((0, 0, 181, 17))
    cursor = java.crop((181, 0, 192, 13))
    base_frame = Image.new("RGBA", (181, 23), (0, 0, 0, 0))
    base_frame.alpha_composite(bar, (0, 6))
    base_frame = base_frame.resize((181, 16), Image.Resampling.NEAREST)
    atlases = [Image.new("RGBA", (256, 256), (0, 0, 0, 0)) for _ in range(2)]

    def put_absolute(index: int, glyph: Image.Image) -> None:
        atlas_index, local_index = divmod(index, 256)
        put(atlases[atlas_index], local_index, glyph)

    for tile in range(12):
        left, right = tile * 16, min(tile * 16 + 16, 181)
        blank = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
        blank.alpha_composite(base_frame.crop((left, 0, right, 16)), (0, 0))
        put_absolute(BAR_BASE + tile, blank)
        for local_x in range(16):
            frame = base_frame.copy()
            full = Image.new("RGBA", (181, 23), (0, 0, 0, 0))
            full.alpha_composite(bar, (0, 6))
            full.alpha_composite(cursor, (min(170, tile * 16 + local_x), 0))
            frame = full.resize((181, 16), Image.Resampling.NEAREST)
            put_absolute(BAR_START + tile * 16 + local_x, frame.crop((left, 0, right, 16)))
        # Cursor tail overflows into this tile when its head ends in the previous tile.
        for visible in range(11):
            glyph = blank.copy()
            if visible:
                previous_start = tile * 16 - (11 - visible)
                full = Image.new("RGBA", (181, 23), (0, 0, 0, 0))
                full.alpha_composite(bar, (0, 6))
                full.alpha_composite(cursor, (max(0, previous_start), 0))
                frame = full.resize((181, 16), Image.Resampling.NEAREST)
                glyph = frame.crop((left, 0, right, 16))
            put_absolute(BAR_CONTINUE + tile * 11 + visible, glyph)

    keys = set(re.findall(
        r'^\s*"kaleidoscope_tavern:([a-z0-9_]+)"\s*:',
        (ROOT / "runtime/BP/scripts/data/mixology.js").read_text().split("export const SHAKER_INPUTS = {", 1)[1].split("\n};", 1)[0],
        re.M,
    ))
    item_atlas = json.loads(ITEM_ATLAS.read_text())["texture_data"]
    by_base: dict[str, str] = {}
    for name in sorted(keys):
        base = re.sub(r"_q[1-6]$", "", name)
        icon_key = item_icon_key(BP_ITEMS / f"{name}.json")
        if not icon_key or icon_key not in item_atlas:
            raise ValueError(f"no icon mapping for shaker input {name}")
        texture = item_atlas[icon_key]["textures"]
        by_base[base] = texture
    textures = sorted(set(by_base.values()))
    if len(textures) > 0x100:
        raise ValueError("shaker icon glyph page is full")
    mapping: dict[str, int] = {}
    for offset, texture in enumerate(textures):
        png = RP_TEXTURES / f"{texture}.png"
        icon = Image.open(png).convert("RGBA").resize((16, 16), Image.Resampling.NEAREST)
        put_absolute(ICON_BASE + offset, icon)
        for base, source in by_base.items():
            if source == texture:
                mapping[base] = ICON_BASE + offset

    # Empty slot: open square; potion: bottle silhouette; other registered inputs: rhombus.
    empty = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(empty)
    draw.rectangle((2, 2, 13, 13), outline=(210, 220, 230, 220), width=1)
    put_absolute(0x1E0, empty)
    potion = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(potion)
    draw.rectangle((6, 1, 9, 4), fill=(235, 240, 255, 255))
    draw.polygon([(5, 5), (10, 5), (12, 13), (3, 13)], fill=(105, 190, 255, 230), outline=(235, 240, 255, 255))
    put_absolute(0x1E1, potion)
    generic = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(generic)
    draw.polygon([(8, 1), (15, 8), (8, 15), (1, 8)], outline=(245, 245, 245, 255), fill=(135, 135, 135, 210))
    put_absolute(0x1E2, generic)

    OUT_FONT.mkdir(parents=True, exist_ok=True)
    atlases[0].save(OUT_FONT / "glyph_F6.png")
    atlases[1].save(OUT_FONT / "glyph_F7.png")
    OUT_JS.write_text(
        "// Generated by tools/generate_shaker_hud_glyphs.py; U+F750.. map to Bedrock icon textures.\n"
        + "export const SHAKER_HUD_ICON_GLYPHS = Object.freeze({\n"
        + "".join(f"  {json.dumps(name)}: {json.dumps(chr(0xF600 + mapping[base]))},\n" for name, base in sorted((name, re.sub(r"_q[1-6]$", "", name)) for name in keys))
        + "});\n"
        + "export const SHAKER_HUD_EMPTY = '\\uF7E0';\n"
        + "export const SHAKER_HUD_POTION = '\\uF7E1';\n"
        + "export const SHAKER_HUD_GENERIC = '\\uF7E2';\n"
        + "export function shakerProgressGlyphs(ticks) {\n"
        + "  const x = Math.max(0, Math.min(180, Math.round(Math.max(0, ticks) * 1.5)));\n"
        + "  const tile = Math.floor(x / 16), local = x % 16;\n"
        + "  return Array.from({length: 12}, (_, i) => {\n"
        + "    if (i === tile) return String.fromCharCode(0xF600 + 12 + i * 16 + local);\n"
        + "    if (i === tile + 1 && local + 11 > 16) return String.fromCharCode(0xF600 + 204 + i * 11 + local + 11 - 16);\n"
        + "    return String.fromCharCode(0xF600 + i);\n"
        + "  }).join('');\n"
        + "}\n",
        encoding="utf8",
    )
    print(f"generated {OUT_FONT / 'glyph_F6.png'}, {OUT_FONT / 'glyph_F7.png'}, {len(textures)} drink icons")


if __name__ == "__main__":
    main()
