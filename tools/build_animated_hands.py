#!/usr/bin/env python3
"""Bind the existing animated item sprites to the hand, using full-face UVs."""
import json
from pathlib import Path
RP=Path(__file__).resolve().parents[1]/'runtime/RP'
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for p in sorted((RP/'attachables').glob('animated_item_*.attachable.json')):
 d=json.loads(p.read_text());d['format_version']='1.21.30';desc=d['minecraft:attachable']['description']
 desc['animations']={'hold_first':'animation.kt_runtime.animated_item_first','hold_third':'animation.kt_runtime.animated_item_third'}
 desc['scripts']={'animate':[{'hold_first':'c.is_first_person'},{'hold_third':'!c.is_first_person'}]};write(p,d)
 stem=p.name.removesuffix('.attachable.json');g=RP/'models/entity'/f'{stem}.geo.json';data=json.loads(g.read_text());geo=data['minecraft:geometry'][0]
 geo['description'].update(visible_bounds_width=4,visible_bounds_height=4,visible_bounds_offset=[0,1,0])
 # Same item-slot pivot as the working shaker. Thin two-sided card instead of
 # crossed zero-depth cubes with box UVs sampling only 5x5 of a 16x16 icon.
 geo['bones']=[{'name':'grip','pivot':[0,24,0],'binding':'q.item_slot_to_bone_name(c.item_slot)','cubes':[{'origin':[-8,16,-0.125],'size':[16,16,0.25],'uv':{'north':{'uv':[0,0],'uv_size':[16,16]},'south':{'uv':[16,0],'uv_size':[-16,16]}}}]}]
 write(g,data)
write(RP/'animations/animated_item.animation.json',{'format_version':'1.10.0','animations':{
 'animation.kt_runtime.animated_item_first':{'loop':True,'bones':{'grip':{'position':[0,0,0],'rotation':[27,-39,-159],'scale':0.625}}},
 'animation.kt_runtime.animated_item_third':{'loop':True,'bones':{'grip':{'position':[0,-1.5,-1],'rotation':[90,0,0],'scale':0.5}}}
}})
print('Rebuilt bound animated item cards (existing textures and frame timing preserved).')
