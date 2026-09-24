#!/usr/bin/env python3
"""Use Java item sprites for the three exceptional cocktails.

Depth Charge and Nether Special keep their original vertical animation strips.
The Signature Cocktail uses Java's glass and tint layers: only the liquid is
dyed, so the glass remains unchanged for both creative and mixed stacks.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'runtime/RP'
TEXTURES = RP / 'textures'
atlas_path = TEXTURES / 'item_texture.json'
flipbook_path = TEXTURES / 'flipbook_textures.json'
atlas = json.loads(atlas_path.read_text())
flipbooks = json.loads(flipbook_path.read_text())
for item in ('depth_charge', 'nether_special'):
    key = f'kt_c3_{item}'
    path = f'textures/kaleidoscope_tavern_jar/item/{item}'
    atlas['texture_data'][key]['textures'] = path
    entry = next(x for x in flipbooks if x['flipbook_texture'] == path)
    entry['atlas_tile'] = key
base = 'textures/kaleidoscope_tavern_jar/item/signature_cocktail'
atlas['texture_data']['kt_c3_signature_cocktail']['textures'] = base
atlas['texture_data']['kt_signature_dyed']['textures'] = 'textures/kt_runtime/signature/icon_dyed.tga'
atlas_path.write_text(json.dumps(atlas, ensure_ascii=False, indent=2) + '\n')
flipbook_path.write_text(json.dumps(flipbooks, ensure_ascii=False, indent=2) + '\n')
liquid = Image.open(RP / (base + '_tint.png')).convert('RGBA')
mask = Image.new('RGBA', liquid.size)
for y in range(liquid.height):
    for x in range(liquid.width):
        r, g, b, a = liquid.getpixel((x, y))
        gray = round((r + g + b) / 3)
        mask.putpixel((x, y), (gray, gray, gray, a))
mask.save(TEXTURES / 'kt_runtime/signature/icon_dyed.tga')
print('Restored two Java animated icons and the Signature Cocktail liquid-only dye mask.')
