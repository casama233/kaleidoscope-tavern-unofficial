#!/usr/bin/env python3
"""0.6.22: rebuild Java-derived mixology visuals and the installed HUD integration.
No simulated players, interaction tests or live-server writes.
"""
import copy,itertools,json,math
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
R=Path(__file__).resolve().parents[1]; RP=R/'runtime/RP'; BP=R/'runtime/BP'
JAVA=Path('/root/tavern-official-current/src/main/resources/assets/kaleidoscope_tavern')
BASE=R.parent/'baseline/resource_packs'
def read(p):return json.loads(p.read_text())
def write(p,j):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
# Use the actual Java pixels at native GUI dimensions, without font metrics,
# glyph padding, scaling to a 16px font cell, or actionbar fade animations.
tex=Image.open(JAVA/'textures/gui/shaker.png').convert('RGBA');bar=tex.crop((0,0,181,17));cursor=tex.crop((181,0,192,13))
out=RP/'textures/ui/kt_mixology'
(out/'progress').mkdir(parents=True,exist_ok=True);(out/'slots').mkdir(parents=True,exist_ok=True)
bar.save(out/'progress_bar.png');cursor.save(out/'progress_cursor.png')
for obsolete in (out/'progress').glob('*.png'):obsolete.unlink()
rhombus=Image.open(JAVA/'textures/gui/rhombus.png').convert('RGBA').resize((16,16),Image.Resampling.NEAREST)
colors=[None,0xff55ff,0x5555ff,0xffaa00,0x55ff55,0xffff55,0xff5555,0xffffff]
for codes in itertools.product(range(8),repeat=3):
 im=Image.new('RGBA',(56,16))
 for slot,code in enumerate(codes):
  if not code:continue
  c=colors[code];colored=ImageChops.multiply(rhombus,Image.new('RGBA',rhombus.size,((c>>16)&255,(c>>8)&255,c&255,255)))
  im.alpha_composite(colored,(slot*20,0))
 im.save(out/'slots'/(''.join(map(str,codes))+'.png'))
Image.new('RGBA',(1,1)).save(out/'off.png')
# Same persistent data binding mechanism used by the installed Magic Way HUD.
# Only this prefix is captured, so other title UI packets cannot clear it.
prefix='ktmix:'
data={'type':'panel','size':[0,0],'property_bag':{'#stored_text':'ktmix:off'},'bindings':[
 {'binding_name':'#hud_title_text_string'},
 {'binding_name':'#hud_title_text_string','binding_name_override':'#stored_text','binding_condition':'visibility_changed'},
 {'binding_type':'view','source_property_name':"(not (#hud_title_text_string = #stored_text) and not ((#hud_title_text_string - 'ktmix:') = #hud_title_text_string))",'target_property_name':'#visible'}]}
def source(expression,target):return {'binding_type':'view','source_control_name':'kt_mixology_data','source_property_name':expression,'target_property_name':target}
controls=[{'kt_mixology_data':data}]
for name,size,y in [('slots',[56,16],32)]:
 marker='textures/ui/kt_mixology/'+name+'/'
 # A hidden image may still resolve its texture binding. Keep an independent
 # texture buffer so 'off' and translated messages are never treated as paths.
 texture_data=copy.deepcopy(data)
 texture_data['property_bag']['#stored_text']='ktmix:textures/ui/kt_mixology/off'
 texture_data['bindings'][-1]['source_property_name']=f"(not (#hud_title_text_string = #stored_text) and not ((#hud_title_text_string - 'ktmix:{marker}') = #hud_title_text_string))"
 controls.append({f'kt_mixology_{name}_data':texture_data})
 texture_binding=source("(#stored_text - 'ktmix:')",'#texture')
 texture_binding['source_control_name']=f'kt_mixology_{name}_data'
 controls.append({name:{'type':'image','size':size,'anchor_from':'center','anchor_to':'top_middle','offset':[0,y],'layer':40,
  'texture':'#texture','bilinear':False,'bindings':[
   texture_binding,
   source(f"(not ((#stored_text - '{marker}') = #stored_text))",'#visible')]}})
# Keep the bar and cursor textures resident throughout use. A cursor control
# has a fixed offset; packets switch visibility, never the image's texture.
progress=[{'bar':{'type':'image','size':[181,17],'anchor_from':'top_left','anchor_to':'top_left','offset':[0,6],'texture':'textures/ui/kt_mixology/progress_bar','bilinear':False}}]
for tick in range(112):
 progress.append({f'cursor_{tick}':{'type':'image','size':[11,13],'anchor_from':'top_left','anchor_to':'top_left','offset':[int(math.floor(tick*1.5+.5)),0],
  'texture':'textures/ui/kt_mixology/progress_cursor','bilinear':False,'layer':1,'bindings':[
   source(f"(#stored_text = 'ktmix:textures/ui/kt_mixology/progress/{tick:03}')",'#visible')]}})
controls.append({'progress':{'type':'panel','size':[181,23],'anchor_from':'center','anchor_to':'top_middle','offset':[0,26],'layer':40,
 'bindings':[source("(not ((#stored_text - 'ktmix:textures/ui/kt_mixology/progress/') = #stored_text))",'#visible')],'controls':progress}})
controls.append({'message':{'type':'label','size':[300,24],'anchor_from':'center','anchor_to':'top_middle','offset':[0,32],'layer':41,
 'text':'#text','text_alignment':'center','shadow':True,'color':[1,1,1],'localize':False,'bindings':[
 source("(#stored_text - 'ktmix:message/')",'#text'),source("(not ((#stored_text - 'ktmix:message/') = #stored_text))",'#visible')]}})
# Java exposes this information through Jade, a compact left-aligned tooltip
# at the top, not loose centered lines. Leave room for Pocket's top buttons.
tooltip=Image.new('RGBA',(192,64),(16,16,20,224))
draw=ImageDraw.Draw(tooltip);draw.rectangle((0,0,191,63),outline=(92,92,100,255))
tooltip.save(out/'barrel_tooltip.png')
controls.append({'barrel':{'type':'panel','size':[192,64],'anchor_from':'top_middle','anchor_to':'top_middle',
 '$barrel_y':2,'variables':[{'requires':"($ui_profile = 'pocket')",'$barrel_y':26}],
 'offset':[0,'$barrel_y'],'layer':41,
 'bindings':[source("(not ((#stored_text - 'ktmix:barrel/') = #stored_text))",'#visible')],
 'controls':[
  {'background':{'type':'image','size':['100%','100%'],'texture':'textures/ui/kt_mixology/barrel_tooltip','bilinear':False}},
  {'icon':{'type':'image','size':[20,20],'anchor_from':'top_left','anchor_to':'top_left','offset':[5,5],
   'texture':'textures/kaleidoscope_tavern_jar/item/barrel','bilinear':False,'layer':1}},
  {'text':{'type':'label','size':[158,56],'anchor_from':'top_left','anchor_to':'top_left','offset':[29,4],
   'text':'#text','text_alignment':'left','shadow':True,'color':[1,1,1],'localize':False,'layer':1,
   'bindings':[source("(#stored_text - 'ktmix:barrel/')",'#text')]}}
 ]}})
# Preserve both existing HUD patches in the high-priority integration pack.
# Their original files stay untouched; this file composes their controls.
hud={'namespace':'hud'};ui_defs=[]
for pack in BASE.iterdir():
 defs=pack/'ui/_ui_defs.json'
 if defs.exists():
  try:ui_defs+=read(defs).get('ui_defs',[])
  except (ValueError,UnicodeError):pass
 f=pack/'ui/hud_screen.json'
 if f.exists():
  try:j=read(f)
  except (ValueError,UnicodeError):continue
  for k,v in j.items():
   if k=='namespace':continue
   if k in hud and isinstance(v,dict) and 'modifications'in v:
    hud[k].setdefault('modifications',[]).extend(v['modifications'])
   else:hud[k]=copy.deepcopy(v)
hud['kt_mixology_root']={'type':'panel','size':['100%','100%'],'controls':controls}
hud.setdefault('root_panel',{}).setdefault('modifications',[]).append({'array_name':'controls','operation':'insert_back','value':[{'kt_mixology@hud.kt_mixology_root':{}}]})
# Prevent transport strings from flashing through the vanilla title factory.
hud['hud_title_text']={'bindings':[{'binding_name':'#hud_title_text_string'},{'binding_type':'view','source_property_name':"((#hud_title_text_string - 'ktmix:') = #hud_title_text_string)",'target_property_name':'#visible'}]}
write(RP/'ui/hud_screen.json',hud)
# Compatibility fix for the installed Magic Way control: max_size is a vec2.
scroll=read(BASE/'A Magic Way v1.9 Res_1.9.0/ui/fast_swap_scroll.json')
scroll['spell_label']['$max_size|default']=['default','default']
write(RP/'ui/fast_swap_scroll.json',scroll)
# hud_screen.json is loaded by vanilla. Keeping this control in that namespace
# avoids depending on which other pack wins _ui_defs.json precedence.
for obsolete in ['_ui_defs.json','kt_mixology.json']:
 (RP/'ui'/obsolete).unlink(missing_ok=True)
# Match the vanilla bound-item skeleton: a single bound bone at Y=24.
# Bake the tabletop-to-hand origin into vertices; no animated offset or nested
# anchor is responsible for keeping the item at hand height.
geo=read(RP/'models/entity/shaker.geo.json');g=geo['minecraft:geometry'][0]
g['description']['identifier']='geometry.kt_mixology.shaker_hand_v27'
g['description'].update(visible_bounds_width=4,visible_bounds_height=4,visible_bounds_offset=[0,1,0])
cubes=[]
for b in g['bones'][1:]:
 assert not any(b.get('rotation',[0,0,0])),b
 for cube in b.get('cubes',[]):
  c=copy.deepcopy(cube);c['origin'][1]+=16
  if 'pivot' in c:c['pivot'][1]+=16
  cubes.append(c)
g['bones']=[{'name':'grip','pivot':[0,24,0],'binding':'q.item_slot_to_bone_name(c.item_slot)','cubes':cubes}]
write(RP/'models/entity/runtime_shaker_held.geo.json',geo)
wave='math.sin(q.life_time * 1718.87338539247)'
using="q.main_hand_item_use_duration > 0 && (q.main_hand_item_max_duration - q.main_hand_item_use_duration) <= 111"
animations={
 'animation.kt_mixology.player_idle':{'animation_length':.05,'bones':{'rightarm':{'rotation':[0,0,0]},'leftarm':{'rotation':[0,0,0]}}},
 'animation.kt_mixology.hold_first':{'loop':True,'bones':{'grip':{'position':[0,0,0],'rotation':[27,-39,-159],'scale':.625}}},
 'animation.kt_mixology.hold_third':{'loop':True,'bones':{'grip':{'position':[0,0,0],'rotation':[-20,0,0],'scale':.625}}},
 'animation.kt_mixology.shake_first':{'loop':True,'bones':{'grip':{'position':[0,f'-2.4 * {wave}',0],'rotation':[15,0,0]}}},
 'animation.kt_mixology.player_shake':{'loop':True,'override_previous_animation':True,'bones':{
  'rightarm':{'rotation':[f'-112.5 - 45 * {wave}',0,-9]},
  'leftarm':{'rotation':[f'-112.5 + 45 * {wave}',0,9]}}},
 'animation.kt_mixology.player_pour':{'animation_length':.4,'bones':{'rightarm':{'rotation':{'0':[0,0,0],'0.12':[-40,0,-35],'0.28':[-40,0,-35],'0.4':[0,0,0]}}}}
}
pour=animations.pop('animation.kt_mixology.player_pour')
write(RP/'animations/runtime_shaker_pour.animation.json',{'format_version':'1.10.0','animations':{'animation.kt_mixology.player_pour':pour}})
write(RP/'animations/runtime_shaker.animation.json',{'format_version':'1.10.0','animations':animations})
for name in ['shaker','shaker_active','shaker_pouring']:
 desc={'identifier':'kaleidoscope_tavern:'+name,'item':{'kaleidoscope_tavern:'+name:"q.is_owner_identifier_any('minecraft:player')"},'materials':{'default':'entity_alphatest','enchanted':'entity_alphatest_glint'},
 'textures':{'default':'textures/kaleidoscope_tavern/block/mixology/shaker','enchanted':'textures/misc/enchanted_item_glint'},
 'geometry':{'default':'geometry.kt_mixology.shaker_hand_v27'},
 'animations':{'hold_first':'animation.kt_mixology.hold_first','hold_third':'animation.kt_mixology.hold_third','shake_first':'animation.kt_mixology.shake_first'},
 'scripts':{'animate':[{'hold_first':'c.is_first_person'},{'hold_third':'!c.is_first_person'},{'shake_first':f'c.is_first_person && ({using})'}]},
 'render_controllers':['controller.render.kt_mixology.held']}
 write(RP/'attachables'/f'{name}.attachable.json',{'format_version':'1.21.30','minecraft:attachable':{'description':desc}})
write(RP/'render_controllers/mixology_held.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_mixology.held':{'geometry':'Geometry.default','materials':[{'*':'Material.default'}],'textures':['Texture.default']}}})
# Add the arm animation to the effective player definition, retaining the
# installed food animations, skin geometry, and material/controller mappings.
player=read(BASE/'6d777614-877f-4d43-b6fc-a1eb3b190cc5/entity/player.entity.json')
d=player['minecraft:client_entity']['description']
# Server starts/stops the arm clip for the actual using player. Do not query
# equipment from skin preview actors, which may have no backing entity.
for i,expression in enumerate(d['scripts'].get('pre_animation',[])):
 if 'q.is_item_name_any' in expression:
  lhs,rhs=expression.split('=',1)
  d['scripts']['pre_animation'][i]=lhs+'=(q.is_in_ui ? 0 : ('+rhs.rstrip(';')+'));'
write(RP/'entity/player.entity.json',player)
# Native use is only a timing/input gesture. Suppress the drink/eating pose.
item=read(BP/'items/shaker.json');item['minecraft:item']['components']['minecraft:use_animation']='none';write(BP/'items/shaker.json',item)
# Java: translate(-.25,.76,.75), slot(.5*x,0,.5*z), rotate X180,
# then render a 0..1 block. Centered Bedrock meshes therefore end at z=-4/+4.
holder=read(RP/'models/entity/glassware_holder.geo.json');h=holder['minecraft:geometry'][0];h['description']['identifier']='geometry.kt_runtime.glassware_holder'
glass=read(RP/'models/entity/empty_glassware.geo.json')['minecraft:geometry'][0]
base=copy.deepcopy(h['bones'][0]);base['name']='holder'
for c in base['cubes']:
 for f in c.get('uv',{}).values():f['material_instance']='holder_unshaded' if f.get('material_instance')=='unshaded' else 'holder'
h['bones']=[base]
for i,(x,z) in enumerate([(-4,-4),(4,-4),(-4,4),(4,4)]):
 cubes=copy.deepcopy(glass['bones'][0]['cubes']);offset=[x,12.16,z]
 for c in cubes:
  for key in ['origin','pivot']:
   if key in c:c[key]=[a+b for a,b in zip(c[key],offset)]
  for f in c.get('uv',{}).values():
   f['material_instance']='glass_unshaded' if f.get('material_instance')=='unshaded' else 'glass'
   for key in ['uv','uv_size']:
    if key in f:f[key]=[v*2 for v in f[key]]
 h['bones'].append({'name':f'slot_{i}','pivot':offset,'rotation':[180,0,0],'cubes':cubes})
write(RP/'models/entity/runtime_glassware_holder.geo.json',holder)
block=read(BP/'blocks/glassware_holder.json')
for m in block['minecraft:block']['components']['minecraft:material_instances'].values():m['render_method']='alpha_test_single_sided'
write(BP/'blocks/glassware_holder.json',block)
# New runtime assets must be included after the pinned upstream builder.
p=R.parent/'tavern-runtime-overrides.json';overrides=[x for x in read(p) if x not in ['RP/ui/_ui_defs.json','RP/ui/kt_mixology.json'] and not x.startswith('RP/textures/ui/kt_mixology/progress/')]
for asset in [*out.rglob('*.png'),*(RP/'ui').glob('*.json'),RP/'animations/runtime_shaker_pour.animation.json',RP/'render_controllers/mixology_held.json',RP/'entity/player.entity.json',BP/'scripts/bedrock/shaker-screen.js']:
 rel=str(asset.relative_to(R/'runtime'))
 if rel not in overrides:overrides.append(rel)
write(p,overrides)
print('Mixology rebuilt: static Java bar/cursor, color slots, valid independent arm clips, grip, single-sided glass slots.')
