"""Verify native item rendering and existing native use components, no engine emulation."""
import json,hashlib
from pathlib import Path
from PIL import Image
from animated_item_render_contract import check_or_write,NAMES,TILES,TARGETS
ROOT=Path(__file__).resolve().parents[1];RP=ROOT/'runtime/RP'
atlas=json.loads((RP/'textures/item_texture.json').read_text())['texture_data']
assert check_or_write()==4
reference=json.loads((ROOT/'art/interfaces/animated-item-java-reference.json').read_text())
def numeric_reference(value):
 if isinstance(value,list):return [numeric_reference(x) for x in value]
 if isinstance(value,dict):return {key:numeric_reference(row) for key,row in value.items()}
 return float(value) if isinstance(value,(int,float)) else value
for name in ('mystery_cocktail','depth_charge','nether_special','ice_grape'):
 ident='kaleidoscope_tavern:'+name
 for p in (RP/'attachables').glob('*.json'):
  assert json.loads(p.read_text())['minecraft:attachable']['description']['identifier']!=ident,(name,'Custom rig overrides native hand/use animation')
 item=json.loads((ROOT/f'runtime/BP/items/{name}.json').read_text())['minecraft:item']['components']
 assert item['minecraft:use_animation']==('eat' if name=='ice_grape' else 'drink')
 assert item['minecraft:use_modifiers']['use_duration']==1.6
 assert not item.get('minecraft:hand_equipped',False)
 if name in NAMES:
  assert 'minecraft:icon' not in item,(name,'A static icon bypasses the animated block-item renderer')
  assert item['minecraft:block_placer']=={'block':'kaleidoscope_tavern:'+TARGETS[name],'use_on':[{'tags':'0'}]}
  definition=json.loads((ROOT/f'runtime/BP/blocks/{TARGETS[name]}.json').read_text())['minecraft:block'];block=definition['components']
  if name=='ice_grape':
   assert 'menu_category' not in definition['description'] and 'minecraft:tick' not in block
   assert block['minecraft:collision_box'] is False and block['minecraft:selection_box'] is False
   assert item['minecraft:food']=={'nutrition':2,'saturation_modifier':.5,'can_always_eat':True}
   assert item['minecraft:compostable']=={'composting_chance':50} and item['minecraft:max_stack_size']==64
  else:assert 'kaleidoscope_tavern:cocktail_cup' in block and 'kaleidoscope_tavern:cocktail_effects' in item
  visual=block['minecraft:item_visual'];assert visual['geometry']['identifier']=='geometry.kt_runtime.item_sprite_'+name
  geo=json.loads((RP/f'models/entity/item_sprite_{name}.geo.json').read_text())['minecraft:geometry'][0]
  cubes=geo['bones'][0]['cubes'];proof=reference['sources'][name]
  # Independent frozen output of the actual Mojang class, not this generator.
  assert len(cubes)==proof['java_element_count']
  assert hashlib.sha256(json.dumps(numeric_reference(cubes),sort_keys=True,separators=(',',':')).encode()).hexdigest()==proof['converted_cubes_sha256'],(name,'Original Java edge geometry/UV drift')
  if name!='ice_grape':assert visual['geometry']!=block['minecraft:geometry'],(name,'World cup geometry must not replace the native sprite')
  assert visual['material_instances']['*']['texture']==TILES[name]
  texture=json.loads((RP/'textures/terrain_texture.json').read_text())['texture_data'][TILES[name]]['textures']
 else:
  key=item['minecraft:icon'];key=key if isinstance(key,str) else key['textures']['default'];texture=atlas[key]['textures']
 with Image.open(RP/(texture+'.png')) as icon,Image.open(RP/f'textures/kaleidoscope_tavern_jar/item/{name}.png') as java:
  assert icon.size==(16,16) and icon.convert('RGBA').tobytes()==java.convert('RGBA').crop((0,0,16,16)).tobytes(),name+' native sprite must be complete Java frame zero'
print('Four original animated native item routes and drink/eat components verified; no custom hand rig. Client animation/use acceptance pending.')

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

# The same original animated sprites must also reach the native guide images.
# Keep this source-pixel/routing gate in the established CI entry point.
import unittest
from test_tavern_forms import TavernForms
result=unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(TavernForms))
assert result.wasSuccessful(),'Tavern guide animation source or foreign-form isolation drift'
