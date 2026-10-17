#!/usr/bin/env python3
"""Validate generated incense and stepladder Bedrock files/assets."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]; BP=R/'runtime/BP'; RP=R/'runtime/RP'
incenses={'sakura_incense':'minecraft:cherry_sapling','pine_incense':'minecraft:spruce_sapling','ginkgo_incense':'minecraft:yellow_dye','spore_incense':'minecraft:spore_blossom','catnip_incense':'minecraft:allium','snow_incense':'minecraft:snowball','butterfly_incense':'minecraft:pitcher_plant','firefly_incense':'minecraft:glowstone_dust'}
for name,ingredient in incenses.items():
 block=json.loads((BP/f'blocks/{name}.json').read_text())['minecraft:block']
 item=json.loads((BP/f'items/{name}.json').read_text())['minecraft:item']
 recipe=json.loads((BP/f'recipes/{name}.json').read_text())['minecraft:recipe_shaped']
 assert block['description']['identifier']==f'kaleidoscope_tavern:{name}'
 assert 'kaleidoscope_tavern:incense' in block['components']
 assert item['components']['minecraft:block_placer']['block']==f'kaleidoscope_tavern:{name}'
 assert recipe['key']['S']['item']==ingredient and recipe['result']['item']==f'kaleidoscope_tavern:{name}'
 assert (RP/f'models/entity/incense_closed.geo.json').is_file()
 assert (RP/f'models/entity/incense_open.geo.json').is_file()
 open_perms=[x for x in block.get('permutations',[]) if x.get('condition')=="q.block_state('kaleidoscope_tavern:open') == 1"]
 assert len(open_perms)==1 and open_perms[0]['components']['minecraft:geometry']['identifier']=='geometry.kt_assets_a13.incense_open'
ladder=json.loads((BP/'blocks/stepladder.json').read_text())['minecraft:block']
item=json.loads((BP/'items/stepladder.json').read_text())['minecraft:item']
recipe=json.loads((BP/'recipes/stepladder.json').read_text())['minecraft:recipe_shaped']
assert ladder['description']['states']['kaleidoscope_tavern:half']==[0,1]
assert ladder['description']['states']['kaleidoscope_tavern:collision_profile']==list(range(8))
assert 'tag:minecraft:climbable' not in ladder['components']
assert ladder['components']['minecraft:collision_box'] is False # every facing/half pair supplies Java's compound shape
ladder_perms=ladder['permutations']
def collision_for(profile):
 condition=f"q.block_state('kaleidoscope_tavern:collision_profile') == {profile}"
 rows=[x for x in ladder_perms if x['condition']==condition]
 assert len(rows)==1
 return rows[0]['components']['minecraft:collision_box']
java_boxes={
 (0,0):[([-8,0,-4],[16,16,12]),([-8,0,-8],[16,8,4])],
 (0,1):[([-8,0,-8],[12,16,16]),([4,0,-8],[4,8,16])],
 (0,2):[([-8,0,-8],[16,16,12]),([-8,0,4],[16,8,4])],
 (0,3):[([-4,0,-8],[12,16,16]),([-8,0,-8],[4,8,16])],
 (1,0):[([-8,0,4],[16,16,4]),([-8,0,0],[16,8,4])],
 (1,1):[([-8,0,-8],[4,16,16]),([-4,0,-8],[4,8,16])],
 (1,2):[([-8,0,-8],[16,16,4]),([-8,0,-4],[16,8,4])],
 (1,3):[([4,0,-8],[4,16,16]),([0,0,-8],[4,8,16])],
}
for (half,facing),boxes in java_boxes.items():
 profile=facing+4*half
 assert collision_for(profile)==[{'origin':origin,'size':size}for origin,size in boxes]
assert ladder['components']['minecraft:movable']['movement_type']=='immovable'
assert item['components'].get('kaleidoscope_tavern:place_stepladder')=={}
assert recipe['result']['item']=='kaleidoscope_tavern:stepladder'
for model in ['stepladder_bottom','stepladder_top','stepladder_assembled']:
 assert (RP/f'models/entity/{model}.geo.json').is_file()
print('decorations assets: eight incense open/closed geometry states, eight recipes, and two-half Java compound ladder collisions verified')
