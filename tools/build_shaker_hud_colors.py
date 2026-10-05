#!/usr/bin/env python3
"""Complete literal Java color controls without changing progress or expiry keys.

The checked-in white slot sprite is the original Java rhombus mask. Generated
RGB texels multiply that source and retain its alpha, as ShakerOverlay does.
"""
import json
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'runtime/RP'
COLORS = [0xff55ff, 0x5555ff, 0xffaa00, 0x55ff55, 0xffff55, 0xff5555, 0xffffff,
          0x000000, 0x0000aa, 0x00aa00, 0x00aaaa, 0xaa0000, 0xaa00aa, 0xaaaaaa,
          0x555555, 0x55ffff]
CODES = ['7', 'd', '9', '6', 'a', 'e', 'c', 'f', '0', '1', '2', '3', '4', '5', '7', '8', 'b']

def main():
    path = RP / 'ui/hud_screen.json'
    hud = json.loads(path.read_text())
    slots = hud['kt_mixology_packet']['controls'][0]['slots']['controls']
    original = {next(iter(control)): next(iter(control.values())) for control in slots}
    mask = Image.open(RP / 'textures/ui/kt_mixology/slots/700.png').convert('RGBA').crop((0, 0, 16, 16))
    updated = []
    for slot in range(3):
        for color in range(17):
            key = f'kt_slot_{slot}_{color}@hud.kt_mixology_slot'
            control = original.get(key, {}).copy()
            texture = ['0', '0', '0']
            texture[slot] = str(color) if color < 8 else f'x{color:02d}'
            name = ''.join(texture)
            control.update(offset=[slot * 20, 0], uv=[slot * 20, 0],
                           texture=f'textures/ui/kt_mixology/slots/{name}',
                           visible=f"(not (($kt_text - '{slot + 1}:§{CODES[color]}{'■' if color else '-'}§r') = $kt_text))")
            updated.append({key: control})
            if color >= 8:
                rgb = tuple(COLORS[color - 1] >> shift & 255 for shift in (16, 8, 0))
                icon = ImageChops.multiply(mask, Image.new('RGBA', mask.size, (*rgb, 255)))
                image = Image.new('RGBA', (56, 16))
                image.paste(icon, (slot * 20, 0))
                image.save(RP / f'textures/ui/kt_mixology/slots/{name}.png')
    hud['kt_mixology_packet']['controls'][0]['slots']['controls'] = updated
    path.write_text(json.dumps(hud, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('Generated 51 literal controls: three slots, all 16 Java colors and empty')

if __name__ == '__main__':
    main()
