#!/usr/bin/env python3
"""Generate Java vanilla bottle display blocks using the A17 source models/textures."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
BP=ROOT/'runtime/BP'
ASSETS=ROOT/'art/assets_a17'
NS='kaleidoscope_tavern'

def dump(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    # The model geometry, albedo and block material aliases are the Java A17
    # bottle assets. Potions use PotionBottleColor on Java; Bedrock has no
    # block-entity texture tint equivalent, so its sourced bottle geometry is
    # used with the supplied base potion-bottle texture.
    for name in ('potion_bottle','xp_bottle'):
        geo=f'geometry.kt_assets_a17.{name}'
        tex=f'kt_assets_a17_{name}'
        components={
            'minecraft:geometry':{'identifier':geo},
            'minecraft:material_instances':{'*':{'texture':tex,'render_method':'alpha_test','ambient_occlusion':0.0,'face_dimming':True}},
            'minecraft:item_visual':{'geometry':{'identifier':geo},'material_instances':{'*':{'texture':tex,'render_method':'alpha_test','ambient_occlusion':0.0,'face_dimming':True}}},
            'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-3,0,-3],'size':[6,10,6]},
            'minecraft:destructible_by_mining':{'seconds_to_destroy':0.6},
            'minecraft:destructible_by_explosion':{'explosion_resistance':3600000},
            'minecraft:movable':{'movement_type':'immovable'},'minecraft:loot':'loot_tables/empty.json',
            'minecraft:light_dampening':0,
        }
        directions=[('north',0),('east',-90),('south',-180),('west',-270)]
        perms=[{'condition':f"q.block_state('minecraft:cardinal_direction') == '{direction}'",'components':{'minecraft:transformation':{'rotation':[0,rotation,0]}}}for direction,rotation in directions]
        dump(BP/'blocks'/f'{name}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':f'{NS}:{name}','traits':{'minecraft:placement_direction':{'enabled_states':['minecraft:cardinal_direction'],'y_rotation_offset':180.0}}},'components':components,'permutations':perms}})
    liquid={'detection_rules':[{'liquid_type':'water','can_contain_liquid':True,'on_liquid_touches':'blocking','use_liquid_clipping':True}]}
    # Java BottleBlock and GlasswareBlock implement SimpleWaterloggedBlock.
    # Apply the source-matching fluid rule after the base/C2 asset generators.
    for path in (BP/'blocks').glob('*.json'):
        raw=json.loads(path.read_text(encoding='utf-8'));block=raw.get('minecraft:block',{});short=block.get('description',{}).get('identifier','').removeprefix(NS+':')
        if short=='bottle_empty' or short=='bottle_water' or short in {'honey_bottle','dragon_breath_bottle','molotov','potion_bottle','xp_bottle'} or short.startswith('bottle_') or short.startswith('cup_'):
            block.setdefault('components',{})['minecraft:liquid_detection']=liquid
            if short in {'honey_bottle','dragon_breath_bottle'}:
                block.setdefault('description',{}).setdefault('traits',{})['minecraft:placement_direction']={'enabled_states':['minecraft:cardinal_direction'],'y_rotation_offset':180.0}
                block['permutations']=[{'condition':f"q.block_state('minecraft:cardinal_direction') == '{direction}'",'components':{'minecraft:transformation':{'rotation':[0,rotation,0]}}}for direction,rotation in [('north',0),('east',-90),('south',-180),('west',-270)]]
            dump(path,raw)
    # Keep the source registry check executable when this builder is rerun.
    registry=json.loads((ROOT/'art/interfaces/asset-registry.json').read_text(encoding='utf-8'))
    visuals={r['key'] for r in registry['visuals']}
    assert {'potion_bottle','xp_bottle'}<=visuals
    liquid={'detection_rules':[{'liquid_type':'water','can_contain_liquid':True,'on_liquid_touches':'blocking','use_liquid_clipping':True}]}
    # Java BottleBlock and GlasswareBlock implement SimpleWaterloggedBlock.
    # Apply the source-matching fluid rule after the base/C2 asset generators.
    for path in (BP/'blocks').glob('*.json'):
        raw=json.loads(path.read_text(encoding='utf-8'));block=raw.get('minecraft:block',{});short=block.get('description',{}).get('identifier','').removeprefix(NS+':')
        if short=='bottle_empty' or short=='bottle_water' or short in {'honey_bottle','dragon_breath_bottle','molotov','potion_bottle','xp_bottle'} or short.startswith('bottle_') or short.startswith('cup_'):
            block.setdefault('components',{})['minecraft:liquid_detection']=liquid
            dump(path,raw)

if __name__=='__main__':main()
