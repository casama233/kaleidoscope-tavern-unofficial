#!/usr/bin/env python3
"""Rebuild inventory sprites from the checked-in Java layers, not block UV maps.

The dyed icon is a COMPLETE icon, not an overlay. Like vanilla wolf_armor_dyed,
TGA alpha is 0=background, 3=visible/untinted, 255=visible/tinted. PNG alpha does
not have that meaning. No texture generation is run implicitly by packaging.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'runtime/RP'
TEXTURES = RP / 'textures'

def signature_icons():
    base = RP / 'textures/kaleidoscope_tavern_jar/item/signature_cocktail'
    glass = Image.open(base.with_suffix('.png')).convert('RGBA')
    liquid = Image.open(base.with_name(base.name + '_tint.png')).convert('RGBA')
    if glass.size != liquid.size or glass.size != (16, 16):
        raise ValueError('Unexpected Java signature icon layers')
    default = glass.copy()
    dyed = Image.new('RGBA', glass.size, (0, 0, 0, 0))
    for y in range(glass.height):
        for x in range(glass.width):
            r, g, b, a = glass.getpixel((x, y))
            lr, lg, lb, la = liquid.getpixel((x, y))
            if a:
                dyed.putpixel((x, y), (r, g, b, 3))
            if la:
                gray = round((lr + lg + lb) / 3)
                dyed.putpixel((x, y), (gray, gray, gray, 255))
                default.putpixel((x, y), (round(gray/3), round(gray/3), gray, 255))
    return default, dyed

def main():
    atlas_path = TEXTURES / 'item_texture.json'
    flipbook_path = TEXTURES / 'flipbook_textures.json'
    atlas = json.loads(atlas_path.read_text(encoding='utf-8'))
    flipbooks = json.loads(flipbook_path.read_text(encoding='utf-8'))
    for item in ('depth_charge', 'nether_special'):
        key = f'kt_c3_{item}'
        path = f'textures/kaleidoscope_tavern_jar/item/{item}'
        atlas['texture_data'][key]['textures'] = path
        entry = next(x for x in flipbooks if x['flipbook_texture'] == path)
        entry['atlas_tile'] = key
    path = 'textures/kt_runtime/signature/'
    atlas['texture_data']['kt_c3_signature_cocktail']['textures'] = path + 'icon_default'
    atlas['texture_data']['kt_sourceicon_signature_cocktail']['textures'] = path + 'icon_default'
    atlas['texture_data']['kt_signature_dyed']['textures'] = path + 'icon_dyed.tga'
    for p, obj in ((atlas_path, atlas), (flipbook_path, flipbooks)):
        p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    default, dyed = signature_icons()
    default.save(TEXTURES / 'kt_runtime/signature/icon_default.png')
    dyed.save(TEXTURES / 'kt_runtime/signature/icon_dyed.tga')
    print('Signature: complete 16x16 icon; glass alpha=3; liquid alpha=255; background alpha=0.')

if __name__ == '__main__':
    main()
