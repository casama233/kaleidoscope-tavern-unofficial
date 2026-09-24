#!/usr/bin/env python3
"""Build animated held-item attachables from the original vertical sprite sheets.

The item IDs and inventory icons remain unchanged. Bedrock does not expose a
runtime animated item icon for inventory slots, so this only animates the held
third/first person model through an attachable render controller.
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / "runtime/RP"
NAMESPACE = "kaleidoscope_tavern"

ITEMS = {
    "ice_grape": (12, 2, True),
    "mystery_cocktail": (6, 3, False),
    "depth_charge": (2, 5, False),
    "nether_special": (4, 20, True),
}


def dump(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_item(name, frames, ticks, blend):
    sheet_path = RP / f"textures/kaleidoscope_tavern_jar/item/{name}.png"
    sheet = Image.open(sheet_path).convert("RGBA")
    if sheet.width != 16 or sheet.height != 16 * frames:
        raise ValueError(f"unexpected {name} sheet dimensions: {sheet.size}")

    frame_paths = []
    frame_textures = {}
    for index in range(frames):
        texture = f"textures/kt_runtime/animated_items/{name}/frame_{index:02d}"
        path = RP / f"{texture}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        sheet.crop((0, index * 16, 16, (index + 1) * 16)).save(path)
        frame_paths.append(path.relative_to(ROOT).as_posix())
        frame_textures[f"f{index}"] = texture

    # Small crossed sprite planes preserve a clear silhouette from both sides
    # while the texture changes at the Java source cadence.
    geometry_id = f"geometry.kt_runtime.animated_item_{name}"
    geo = {
        "format_version": "1.21.0",
        "minecraft:geometry": [{
            "description": {
                "identifier": geometry_id,
                "texture_width": 16,
                "texture_height": 16,
                "visible_bounds_width": 1.5,
                "visible_bounds_height": 1.5,
                "visible_bounds_offset": [0, 0.5, 0],
            },
            "bones": [{
                "name": "root",
                "pivot": [0, 0, 0],
                "cubes": [
                    {"origin": [-2.5, 0, 0], "size": [5, 5, 0], "uv": [0, 0]},
                    {"origin": [0, 0, -2.5], "size": [0, 5, 5], "uv": [0, 0]},
                ],
            }],
        }],
    }
    dump(RP / f"models/entity/animated_item_{name}.geo.json", geo)

    controller_id = f"controller.render.kt_runtime.animated_item_{name}"
    textures = [f"Texture.f{i}" for i in range(frames)]
    controller = {
        "format_version": "1.8.0",
        "render_controllers": {
            controller_id: {
                "arrays": {"textures": {"Array.frames": textures}},
                "geometry": "Geometry.default",
                "materials": [{"*": "Material.default"}],
                "textures": [f"Array.frames[math.mod(math.floor(query.life_time * 20 / {ticks}), {frames})]"],
            }
        },
    }
    dump(RP / f"render_controllers/animated_item_{name}.render_controllers.json", controller)

    attachable = {
        "format_version": "1.20.30",
        "minecraft:attachable": {
            "description": {
                "identifier": f"{NAMESPACE}:{name}",
                "item": {f"{NAMESPACE}:{name}": "q.is_owner_identifier_any('minecraft:player')"},
                "materials": {"default": "entity_alphatest", "enchanted": "entity_alphatest_glint"},
                # The render controller references Texture.fN.  Every alias
                # must be declared here or the client rejects the animation.
                "textures": {"default": frame_textures["f0"], "enchanted": "textures/misc/enchanted_item_glint", **frame_textures},
                "geometry": {"default": geometry_id},
                "render_controllers": [controller_id],
            }
        },
    }
    dump(RP / f"attachables/animated_item_{name}.attachable.json", attachable)
    return {
        "item": f"{NAMESPACE}:{name}",
        "frames": frames,
        "ticks_per_frame": ticks,
        "blend_frames": blend,
        "attachable": f"runtime/RP/attachables/animated_item_{name}.attachable.json",
        "geometry": f"runtime/RP/models/entity/animated_item_{name}.geo.json",
        "render_controller": f"runtime/RP/render_controllers/animated_item_{name}.render_controllers.json",
        "textures": frame_paths,
        "inventory_icon_animated": False,
    }


def main():
    built = [build_item(name, *spec) for name, spec in ITEMS.items()]
    manifest = {"scope": "held attachables only; item identifiers and inventory icon handling unchanged", "items": built}
    dump(ROOT / "runtime/animated_item_attachables_manifest.json", manifest)


if __name__ == "__main__":
    main()
