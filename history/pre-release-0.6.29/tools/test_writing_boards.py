#!/usr/bin/env python3
"""Source/package-shape checks for board blocks, recipe cards, labels and glyph text."""
import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BP=ROOT/'runtime/BP'; RP=ROOT/'runtime/RP'; NS='kaleidoscope_tavern:'
def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))

styles=['base','grass','allium','azure_bluet','cornflower','orchid','peony','pink_petals','pitcher_plant','poppy','sunflower','torchflower','tulip','wither_rose']
ids=[f'{NS}{s}_sandwich_board' for s in styles]+[NS+'chalkboard']
held=read(RP/'attachables/base_sandwich_board.attachable.json')['minecraft:attachable']['description']
assert held['identifier']==NS+'base_sandwich_board'
assert held['item']=={NS+'base_sandwich_board':"q.is_owner_identifier_any('minecraft:player')"}
assert held['geometry']['default']=='geometry.kt_runtime.base_sandwich_board_held'
assert held['textures']['default']=='textures/kt_derived/a17/item_display_base_sandwich_board'
held_geo=read(RP/'models/entity/base_sandwich_board_held.geo.json')['minecraft:geometry'][0]
assert held_geo['description']['identifier']==held['geometry']['default']
assert held_geo['bones'][0]['binding']=='q.item_slot_to_bone_name(context.item_slot)'
payload_file=BP/'scripts/data/cookery-guide-payload.js'
source=payload_file.read_text(encoding='utf-8')
raw=source.split('export const COOKERY_GUIDE_PAYLOAD=',1)[1].split('\nconst GUIDE_LOCALES=',1)[0]
payload=json.loads(raw)
entries={row['id']:row for row in payload['entries']}
assert len(styles)==14 and all(x in entries for x in ids), 'all 14 sandwich styles and chalkboard must have individual entries'
assert payload['categories'][-1]['id']=='boards' and payload['categories'][-1]['parent']=='decor'
for entry in payload['entries']:
    assert isinstance(entry.get('mechanics'),list), f'mechanics must be a list: {entry["id"]}'
    for lc in ('zh_TW','zh_CN','en_US'):
        assert isinstance(entry.get('mechanicsByLocale',{}).get(lc),list) and entry['mechanicsByLocale'][lc], f'mechanicsByLocale[{lc}] must be a non-empty list: {entry["id"]}'
        assert isinstance(payload['names'].get(lc,{}).get(entry['id']),str) and payload['names'][lc][entry['id']], f'missing localized entry name {entry["id"]}/{lc}'
for lc in ('zh_TW','zh_CN','en_US'):
    assert all(x in payload['names'][lc] for x in ids), f'missing board names in {lc}'
    assert all(lc in entries[x]['mechanicsByLocale'] for x in ids), f'missing board mechanics in {lc}'

recipe_outputs={}
for p in (BP/'recipes').glob('*.json'):
    doc=read(p); body=doc.get('minecraft:recipe_shaped') or doc.get('minecraft:recipe_shapeless')
    if not body: continue
    out=body.get('result',{}).get('item')
    if out: recipe_outputs.setdefault(out,[]).append(body)
for ident in ids:
    assert ident in recipe_outputs, f'no actual crafting recipe for {ident}'
    assert all('unlock' in r and r['unlock'] for r in recipe_outputs[ident]), f'recipe has no unlock: {ident}'
    entry=entries[ident]
    icon=entry['icon']+'.png'
    assert (RP/'textures'/icon.removeprefix('textures/')).is_file(), f'guide icon is missing: {entry["icon"]}'
for style in styles:
    block=read(BP/f'blocks/{style}_sandwich_board.json')['minecraft:block']
    assert block['description']['states']['kaleidoscope_tavern:rotation']==list(range(16))
    rotations={int(re.search(r'== (\d+)',p['condition']).group(1)):p for p in block['permutations'] if 'rotation' in p['condition']}
    assert set(rotations)==set(range(1,16))
    for i,p in rotations.items():
        assert p['components']['minecraft:transformation']['rotation'][1] in (0,90,180,270), f'unsupported block rotation for {style}/{i}'
        geo=p['components']['minecraft:geometry']['identifier'].split('.')[-1]
        model=RP/f'models/entity/tavern_board_{style}_{i%4}.geo.json'
        assert model.is_file(), f'missing 16-direction model: {model.name}'
        model_json=read(model)['minecraft:geometry'][0]
        assert model_json['description']['identifier'].endswith(geo)
        angle=model_json['bones'][0]['rotation'][1]
        assert angle in (0,22.5,45.0,67.5)
        box=p['components'].get('minecraft:selection_box',block['components']['minecraft:selection_box'])
        assert box['size'][1] <= 16

blank=read(RP/'models/entity/board_blank.geo.json')['minecraft:geometry'][0]
assert any(c['size'] != [0,0,0] for b in blank['bones'] for c in b.get('cubes',[])), 'blank anchors need nonzero geometry bounds'
for block_path in [BP/'blocks/chalkboard.json',*(BP/f'blocks/{s}_sandwich_board.json' for s in styles)]:
    block=read(block_path)['minecraft:block']
    for perm in block.get('permutations',[]):
        if perm['components'].get('minecraft:geometry',{}).get('identifier')=='geometry.kt_runtime.board_blank':
            material=perm['components']['minecraft:material_instances']['*']
            assert material['texture']=='kt_runtime_board_blank' and material['render_method']=='alpha_test'
font_bytes=sum(p.stat().st_size for p in (RP/'textures/board_font').glob('glyph_*.png'))
assert len(list((RP/'textures/board_font').glob('glyph_*.png')))==256 and font_bytes<16*1024*1024
glyph_entity=read(BP/'entities/board_glyph_visual.json')['minecraft:entity']['description']
glyph_anim=read(RP/'animations/board_glyph_line.animation.json')['animations']['animation.kt_runtime.board_glyph_line']['bones']
assert all(glyph_entity['properties'][f'{NS}x_{i}']['range']==[-128.0,128.0] for i in range(12)), 'wide boards must not clamp glyph positions'
assert all(glyph_anim[f'glyph_{i}']['position'][0]==f"q.property('{NS}x_{i}')" for i in range(12)), 'glyph offsets must only be scaled once by the client entity'
assert 'nativeEmptyHandBlockUse' in (BP/'scripts/bedrock/writing-boards.js').read_text()
assert 'registerJavaBlockUseHandler' in (BP/'scripts/bedrock/writing-boards.js').read_text()
assert 'nameTag' not in (BP/'scripts/bedrock/writing-boards.js').read_text()
print(f'writing boards validated: {len(ids)} named entries, {sum(len(v) for k,v in recipe_outputs.items() if k in ids)} real recipes, 16 facings, 256 glyph pages ({font_bytes} bytes)')
