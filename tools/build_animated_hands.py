#!/usr/bin/env python3
"""Restore native sprite rendering; never generate a custom hand rig for these items.
The native icon API has no supported frame-expression property. Use the complete
first Java frame for the native held/inventory sprite; placed drink animation is
owned by its existing block renderer and is not changed here.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];RP=ROOT/'runtime/RP'
names=('depth_charge','mystery_cocktail','nether_special','ice_grape')
atlas_path=RP/'textures/item_texture.json';atlas=json.loads(atlas_path.read_text())
for name in names:
 item=json.loads((ROOT/f'runtime/BP/items/{name}.json').read_text())['minecraft:item']['components']
 key=item['minecraft:icon'];key=key if isinstance(key,str) else key['textures']['default']
 atlas['texture_data'][key]['textures']=f'textures/kt_runtime/animated_items/{name}/frame_00'
 for path in [RP/f'attachables/animated_item_{name}.attachable.json',RP/f'models/entity/animated_item_{name}.geo.json',RP/f'render_controllers/animated_item_{name}.render_controllers.json']:path.unlink(missing_ok=True)
(RP/'animations/animated_item.animation.json').unlink(missing_ok=True)
atlas_path.write_text(json.dumps(atlas,ensure_ascii=False,indent=2)+'\n')
print('Native item sprites restored for four items; custom hand rigs removed. Held texture frame animation is not claimed.')
