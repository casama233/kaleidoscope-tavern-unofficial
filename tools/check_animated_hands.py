import json
from pathlib import Path
from PIL import Image
RP=Path(__file__).resolve().parents[1]/'runtime/RP'
animations=json.loads((RP/'animations/animated_item.animation.json').read_text())['animations']
count=0
for p in (RP/'attachables').glob('animated_item_*.attachable.json'):
 d=json.loads(p.read_text());desc=d['minecraft:attachable']['description'];assert d['format_version']=='1.21.30'
 for name in desc['animations'].values():assert name in animations
 assert len(desc['scripts']['animate'])==2
 g=json.loads((RP/'models/entity'/p.name.replace('.attachable.json','.geo.json')).read_text())['minecraft:geometry'][0]
 assert g['description']['identifier']==desc['geometry']['default']
 bone=g['bones'][0];assert bone['binding']=='q.item_slot_to_bone_name(c.item_slot)' and bone['pivot']==[0,24,0]
 cube=bone['cubes'][0];assert all(n>0 for n in cube['size'])
 for face in ('north','south'):assert list(map(abs,cube['uv'][face]['uv_size']))==[16,16]
 for alias,path in desc['textures'].items():
  if alias=='enchanted':continue
  with Image.open(RP/(path+'.png')) as image:assert image.size==(16,16) and image.convert('RGBA').getchannel('A').getbbox()
 count+=1
assert count==4
print('Four animated item hand bindings, full sprite UVs and frame assets verified; client poses pending.')
