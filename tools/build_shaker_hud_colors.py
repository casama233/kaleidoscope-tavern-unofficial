#!/usr/bin/env python3
"""Emit persistent graphical shaker controls from the owned packet protocol.

The checked-in white slot sprite is the original Java rhombus mask. Generated
RGB texels multiply that source and retain its alpha, as ShakerOverlay does.
"""
import json
from pathlib import Path
from actionbar_hud_ui import install_actionbar_factory
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'runtime/RP'
COLORS = [0xff55ff, 0x5555ff, 0xffaa00, 0x55ff55, 0xffff55, 0xff5555, 0xffffff,
          0x000000, 0x0000aa, 0x00aa00, 0x00aaaa, 0xaa0000, 0xaa00aa, 0xaaaaaa,
          0x555555, 0x55ffff]

def code(n):return f'{n:02x}'

def main():
    path = RP / 'ui/kt_tavern_hud.json'
    hud = json.loads(path.read_text())
    panel = hud['kt_mixology_packet']['controls'][0]['slots']
    # ShakerOverlay draws at (screenWidth / 2 - 28, screenHeight / 2 + 32).
    # anchor_from is the parent point; anchor_to is this control's top-left.
    panel.update(anchor_from='center', anchor_to='top_left', offset=[-28,32])
    slots = panel['controls']
    original = {next(iter(control)): next(iter(control.values())) for control in slots if '@kaleidoscope_tavern_hud.kt_mixology_slot' in next(iter(control))}
    mask = Image.open(RP / 'textures/ui/kt_mixology/slots/700.png').convert('RGBA').crop((0, 0, 16, 16))
    updated = []
    for slot in range(3):
        for color in range(17):
            key = f'kt_slot_{slot}_{color}@kaleidoscope_tavern_hud.kt_mixology_slot'
            control = original.get(key, {}).copy()
            texture = ['0', '0', '0']
            texture[slot] = str(color) if color < 8 else f'x{color:02d}'
            name = ''.join(texture)
            control.update(offset=[slot * 20, 0], uv=[slot * 20, 0],
                           texture=f'textures/ui/kt_mixology/slots/{name}',
                           visible=f"(not (($kt_text - '{slot}{code(color)};') = $kt_text))")
            # Factory text is fixed for this instance. Do not construct the
            # other sixteen color images only to hide them afterwards.
            control['ignored'] = f"(not {control['visible']})"
            control.pop('bindings',None);control.pop('property_bag',None)
            updated.append({key: control})
            if color >= 8:
                rgb = tuple(COLORS[color - 1] >> shift & 255 for shift in (16, 8, 0))
                icon = ImageChops.multiply(mask, Image.new('RGBA', mask.size, (*rgb, 255)))
                image = Image.new('RGBA', (56, 16))
                image.paste(icon, (slot * 20, 0))
                image.save(RP / f'textures/ui/kt_mixology/slots/{name}.png')
    panel['controls'] = updated
    panel['visible']="(not (($kt_text - 'KT_HUD!S:') = $kt_text))"
    panel['ignored'] = f"(not {panel['visible']})"
    # Rebuild only our generated animations with the packet controls below.
    for key in list(hud):
        if key.startswith('kt_mixology_') and ('anim_type' in hud[key] or key == 'kt_mixology_factory'):
            del hud[key]
    for key in ['kt_mixology_slot', 'kt_mixology_cursor']:
        hud[key].pop('anims', None)
    hud['kt_mixology_cursor'].pop('offset', None)
    # Native HUD/store/game-tip animated controls opt out of fast-forward.
    # Keep this packet's local lifetime and cursor step relative to receipt.
    hud['kt_mixology_cursor']['disable_anim_fast_forward'] = True
    packet = hud['kt_mixology_packet']
    packet_order = list(packet)
    for key in ['alpha', 'propagate_alpha', 'bindings', 'property_bag', 'visible', '$kt_text']:
        packet.pop(key, None)
    progress = packet['controls'][1]['progress']
    # The bar is six pixels below this source cursor origin. Its 181px width
    # must not turn Java's -91 left edge into a centred -90.5 offset.
    progress.update(anchor_from='center', anchor_to='top_left', offset=[-91,26])
    # Replace the obsolete text-only / 111 gate below without deleting its key;
    # deletion would reorder visible after ignored on every regeneration.
    bar = progress['controls'][0]['bar']
    for key in ['anims', 'bindings', 'property_bag']:
        bar.pop(key, None)
    bar['visible'] = "(not (($kt_text - 'KT_HUD!P:') = $kt_text))"
    bar['ignored'] = f"(not {bar['visible']})"
    rows = [{'bar': bar}]
    for tick in range(112):
        visible = f"(not (($kt_text - 'KT_HUD!P:{code(tick)};') = $kt_text))"
        # Java rounds (ticksUsingItem + partialTick) * 1.5 to an integer.
        # Within one tick this advances at partialTick=1/3 (even tick) or
        # 2/3 (odd tick). Hold after that one step: a delayed/missing packet
        # must not animate onward through unobserved server progress.
        start = (tick * 3 + 1) // 2
        rows.append({f'cursor_{tick}@kaleidoscope_tavern_hud.kt_mixology_cursor': {
            '$kt_cursor_from': [start, 0], '$kt_cursor_to': [start + 1, 0],
            '$kt_cursor_delay': (1 if tick % 2 == 0 else 2) / 60,
            'offset': '@kaleidoscope_tavern_hud.kt_mixology_cursor_tick',
            'visible': visible, 'ignored': f'(not {visible})'}})
    progress['controls'] = rows
    progress['visible']="(not (($kt_text - 'KT_HUD!P:') = $kt_text))"
    progress['ignored'] = f"(not {progress['visible']})"
    hud['kt_mixology_cursor_tick'] = {
        'anim_type': 'offset', 'easing': 'linear', 'duration': '$kt_cursor_delay',
        'from': '$kt_cursor_from', 'to': '$kt_cursor_from',
        'next': '@kaleidoscope_tavern_hud.kt_mixology_cursor_after_tick'}
    hud['kt_mixology_cursor_after_tick'] = {
        'anim_type': 'offset', 'easing': 'linear', 'duration': .2,
        'from': '$kt_cursor_to', 'to': '$kt_cursor_to'}
    install_actionbar_factory(hud,'tavern','kt_text','KT_HUD!','KT_HUD!END;','$kt_lifetime')
    # The receiver and native mask use contained owned tokens, including when
    # engine formatting surrounds them. Stop packets must use that same gate.
    packet['visible']="(not (($kt_text - 'KT_HUD!') = $kt_text) and (($kt_text - 'KT_HUD!END;') = $kt_text))"
    packet['$kt_lifetime|default']=.6
    packet['disable_anim_fast_forward']=True
    packet.pop('$kt_graphical_offset|default',None)
    packet.pop('offset',None)
    # A repeated value is refreshed after ten ticks. The graphical packet must
    # survive that heartbeat, including four-to-nine-tick delivery gaps; cursor
    # motion still advances only its one observed Java pixel and then holds.
    packet['variables']=[{'requires':"(not (($kt_text - 'KT_HUD!P:') = $kt_text))",'$kt_lifetime':.6}]
    # Keep the committed key order when replacing factory-managed fields.
    # Existing packet fields remain byte-stable across regeneration; new fields
    # are appended in the generator's declared order.
    hud['kt_mixology_packet'] = {**{key: packet[key] for key in packet_order if key in packet},
                                **{key: value for key, value in packet.items() if key not in packet_order}}
    path.write_text(json.dumps(hud, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('Generated 51 literal controls: three slots, all 16 Java colors and empty')

if __name__ == '__main__':
    main()
