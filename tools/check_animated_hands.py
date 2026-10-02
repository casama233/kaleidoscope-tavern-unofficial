"""Verify native item rendering and existing native use components, no engine emulation."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];RP=ROOT/'runtime/RP'
atlas=json.loads((RP/'textures/item_texture.json').read_text())['texture_data']
for name in ('mystery_cocktail','depth_charge','nether_special','ice_grape'):
 ident='kaleidoscope_tavern:'+name
 for p in (RP/'attachables').glob('*.json'):
  assert json.loads(p.read_text())['minecraft:attachable']['description']['identifier']!=ident,(name,'Custom rig overrides native hand/use animation')
 item=json.loads((ROOT/f'runtime/BP/items/{name}.json').read_text())['minecraft:item']['components']
 assert item['minecraft:use_animation']==('eat' if name=='ice_grape' else 'drink')
 assert item['minecraft:use_modifiers']['use_duration']==1.6
 assert not item.get('minecraft:hand_equipped',False)
 key=item['minecraft:icon'];key=key if isinstance(key,str) else key['textures']['default']
 with Image.open(RP/(atlas[key]['textures']+'.png')) as icon,Image.open(RP/f'textures/kaleidoscope_tavern_jar/item/{name}.png') as java:
  assert icon.size==(16,16) and icon.convert('RGBA').tobytes()==java.convert('RGBA').crop((0,0,16,16)).tobytes(),name+' native sprite must be complete Java frame zero'
print('Four native item sprites and native drink/eat components verified; no custom hand rig. Client animation acceptance pending; held sprite uses frame zero.')

# Decorative boards use the Java geometric native block-item route, never an unbound hand rig.
assert not (RP/'attachables/base_sandwich_board.attachable.json').exists()
assert not (RP/'models/entity/base_sandwich_board_held.geo.json').exists()
boards=list((ROOT/'runtime/BP/items').glob('*sandwich_board.json'))
for p in boards:
 item=json.loads(p.read_text())['minecraft:item'];c=item['components']
 assert 'minecraft:icon' not in c and c['minecraft:block_placer']['block']==item['description']['identifier']
 block=json.loads((ROOT/'runtime/BP/blocks'/p.name).read_text())['minecraft:block']
 visual=block['components']['minecraft:item_visual'];assert visual['geometry']['identifier']=='geometry.kt_assets_a17.item_display_'+p.stem
 terrain=json.loads((RP/'textures/terrain_texture.json').read_text())['texture_data']
 texture=terrain[visual['material_instances']['*']['texture']]['textures']
 with Image.open(RP/(texture+'.png')) as im:assert im.convert('RGBA').getchannel('A').getbbox(),p.name
print(f'{len(boards)} sandwich-board native geometry routes verified; unbound hand override absent.')
