#!/usr/bin/env python3
"""C4 immersive adapter generation. Originals are never overwritten; no network."""
from pathlib import Path
import json,copy,hashlib
R=Path(__file__).resolve().parents[1];BP=R/'runtime/BP';RP=R/'runtime/RP';A=R/'art';N='kaleidoscope_tavern'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
 # Native nonconsumable tools. No food/shooter/throwable used as a fake hold sensor.
 item=load(BP/'items/shaker.json');c=item['minecraft:item']['components'];c[N+':portable_shaker']={};c['minecraft:interact_button']='action.interact.kt_shake';c['minecraft:allow_off_hand']=False
 dump(BP/'items/shaker.json',item)
 for phase in ['active','pouring']:
  d=copy.deepcopy(item);d['minecraft:item']['description'].pop('menu_category',None);d['minecraft:item']['description']['identifier']=N+':shaker_'+phase;dump(BP/f'items/shaker_{phase}.json',d)
 # Table block becomes collision/selection + authoritative state, with a full animated original-model helper.
 d=load(BP/'blocks/shaker_station.json');d['minecraft:block']['components']['minecraft:geometry']={'identifier':'geometry.kt_runtime.invisible'};dump(BP/'blocks/shaker_station.json',d)
 ent=load(A/'VisualLab_BP/entities/shaker_animation_rig.json');e=ent['minecraft:entity'];e['description']['identifier']=N+':shaker_visual';e['description']['properties']={'kt_runtime:shaking':{'type':'bool','default':False,'client_sync':True}};e['components']['minecraft:collision_box']={'width':0,'height':0};e['components']['minecraft:type_family']={'family':['kt_shaker_visual']};e['components']['minecraft:damage_sensor']={'triggers':[{'cause':'all','deals_damage':'no'}]};dump(BP/'entities/shaker_visual.json',ent)
 client=load(A/'RP/entity/shaker_animation_rig.entity.json');cl=client['minecraft:client_entity']['description'];cl['identifier']=N+':shaker_visual';cl['animations'].update({'shake':'animation.kt_runtime.shaker.table','table_controller':'controller.animation.kt_runtime.shaker_table'});cl['scripts']={'animate':['table_controller']};dump(RP/'entity/runtime_shaker.entity.json',client)
 dump(RP/'animation_controllers/runtime_shaker.controller.json',{'format_version':'1.10.0','animation_controllers':{'controller.animation.kt_runtime.shaker_table':{'initial_state':'idle','states':{'idle':{'transitions':[{'shake':"q.property('kt_runtime:shaking')"}]},'shake':{'animations':['shake'],'transitions':[{'idle':"!q.property('kt_runtime:shaking')"}],'blend_transition':.08}}}}})
 # Dedicated bound geometry: preserve cube positions/UV and original bone2 hierarchy.
 g=load(A/'RP/models/entity/shaker.geo.json');geo=g['minecraft:geometry'][0];geo['description']['identifier']='geometry.kt_runtime.shaker_held';geo['description']['visible_bounds_width']=4
 geo['bones'].insert(0,{'name':'hand_mount','pivot':[0,0,0],'binding':'q.item_slot_to_bone_name(context.item_slot)'})
 next(b for b in geo['bones'] if b['name']=='render_anchor')['parent']='hand_mount'
 dump(RP/'models/entity/runtime_shaker_held.geo.json',g)
 wave='(math.sin(q.anim_time * 20.0 * 1.5 * 57.29577951308232) * 0.25)'
 # Source motion constants are exact; wrist anchor/blending is an explicit Bedrock adapter candidate.
 animations={
 'animation.kt_runtime.shaker.hold_first':{'loop':True,'bones':{'hand_mount':{'position':[0,0,0],'rotation':[15,0,0],'scale':.6}}},
 'animation.kt_runtime.shaker.hold_third':{'loop':True,'bones':{'hand_mount':{'position':[0,4,-2],'rotation':[0,0,0],'scale':.6}}},
 'animation.kt_runtime.shaker.first':{'loop':True,'bones':{'hand_mount':{'position':[0,f'-{wave} * 9.6',0]}}},
 'animation.kt_runtime.shaker.arms':{'loop':True,'animation_length':6,'bones':{'rightarm':{'rotation':[f'247.50000580486656 - {wave} * 180',0,-9]},'leftarm':{'rotation':[f'247.50000580486656 + {wave} * 180',0,9]}}},
 'animation.kt_runtime.shaker.release':{'loop':False,'animation_length':.08,'bones':{}},
 'animation.kt_runtime.shaker.table':{'loop':True,'bones':{'root':{'rotation':[0,0,f'{wave} * 20'],'position':[0,f'{wave} * 1.2',0]}}},
 'animation.kt_runtime.shaker.pour':{'loop':False,'animation_length':.6,'bones':{'hand_mount':{'rotation':{'0':[0,0,0],'0.12':[0,0,65],'0.48':[0,0,65],'0.6':[0,0,0]}},'bone2':{'position':{'0':[0,0,0],'0.12':[0,2,0],'0.48':[0,2,0],'0.6':[0,0,0]}}}}
 }
 for key in ['animation.kt_runtime.shaker.first','animation.kt_runtime.shaker.table']:
  animations[key]['animation_length']=0.20943951023931953
 dump(RP/'animations/runtime_shaker.animation.json',{'format_version':'1.8.0','animations':animations})
 dump(RP/'render_controllers/runtime_shaker_hand.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_runtime.shaker_hand':{'geometry':'Geometry.default','materials':[{'*':'Material.default'}],'textures':['Texture.default']}}})
 for short in ['shaker','shaker_active','shaker_pouring']:
  anim={'hold_first':'animation.kt_runtime.shaker.hold_first','hold_third':'animation.kt_runtime.shaker.hold_third'};scripts=[{'hold_first':'c.is_first_person'},{'hold_third':'!c.is_first_person'}]
  if short=='shaker_active':anim['shake_first']='animation.kt_runtime.shaker.first';scripts.append({'shake_first':'c.is_first_person'})
  if short=='shaker_pouring':anim['pour']='animation.kt_runtime.shaker.pour';scripts.append('pour')
  d={'identifier':N+':'+short,'item':{N+':'+short:"q.is_owner_identifier_any('minecraft:player')"},'materials':{'default':'entity_alphatest'},'textures':{'default':'textures/kaleidoscope_tavern/block/mixology/shaker'},'geometry':{'default':'geometry.kt_runtime.shaker_held'},'animations':anim,'scripts':{'animate':scripts},'render_controllers':['controller.render.kt_runtime.shaker_hand']}
  dump(RP/f'attachables/{short}.attachable.json',{'format_version':'1.10.0','minecraft:attachable':{'description':d}})
 # Reuse the SAME declared native drop cell as A17; no invented source-image claim.
 dump(RP/'particles/runtime_pour_stream.json',{'format_version':'1.10.0','particle_effect':{'description':{'identifier':N+':pour_stream','basic_render_parameters':{'material':'particles_alpha','texture':'textures/particle/particles'}},'components':{'minecraft:emitter_lifetime_once':{'active_time':.01},'minecraft:emitter_rate_instant':{'num_particles':1},'minecraft:emitter_shape_point':{},'minecraft:particle_lifetime_expression':{'max_lifetime':.15},'minecraft:particle_initial_speed':0,'minecraft:particle_appearance_billboard':{'size':[.025,.045],'facing_camera_mode':'lookat_xyz','uv':{'texture_width':128,'texture_height':128,'uv':[8,56],'uv_size':[8,8]}},'minecraft:particle_appearance_tinting':{'color':['variable.kt_tint.r','variable.kt_tint.g','variable.kt_tint.b','1.0 - variable.particle_age / variable.particle_lifetime']}}}})
 for lc in ['zh_TW','zh_CN','en_US']:
  p=RP/f'texts/{lc}.lang';text=p.read_text(encoding='utf-8').split('## C4 ADDITIONS')[0].rstrip()+'\n## C4 ADDITIONS\n';text+='action.interact.kt_shake='+('Shake / stop' if lc=='en_US' else '搖杯／停止')+'\n';p.write_text(text,encoding='utf-8')
 # Keep the original C3 page IDs/bookmarks, replace their outdated operation description in the generated map.
 pages=BP/'scripts/data/mixology-pages.js';txt=pages.read_text(encoding='utf-8');data=json.loads(txt.split(' = ',1)[1].rsplit(';',1)[0]);
 for page in data:
  if page['id']==N+':mixology':
   page['body']={'zh_TW':'C4：放下雪克杯投三份Q4以上基酒；成功投料會播放原PUT杯蓋動畫、氣泡及聲音。潛行空手點擊可連材料拿起。手持按使用開始，再按停止；潛行使用取消。手持成品對準已放空杯點擊，12 tick倒酒動作完成後才提交；切換物品或離開會取消並保留內容。桌上兩次點擊仍可用。這不是原作原生長按；手腕座標與動畫融合尚需實機驗收。精確tick HUD可在獨立指南的「沉浸／輔助」開啟。','zh_CN':'C4：放下雪克杯投料；潜行空手拿起整杯。手持使用开始，再次使用停止；潜行使用取消。对准放好的空杯使用，12 tick倒酒结束才提交。尚未实现原生长按和引擎动画验收。','en_US':'C4: Load on the table; sneak-empty-hand to pick up the loaded shaker. Use in hand to start/stop; sneak-use cancels. Use a finished shaker on a placed empty glass for a 12-tick reserved pour. Slot/dimension/range changes cancel without spending contents. Native hold/release remains unimplemented. Timing assistance is optional in this independent guide. Animation wrist calibration needs in-game acceptance.'}
 pages.write_text('// Generated C4 operation text; original source effect pages retained.\nexport const MIXOLOGY_PAGES = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 v=[0,4,0];bpid=load(BP/'manifest.json')['header']['uuid'];rpid=load(RP/'manifest.json')['header']['uuid']
 for p in [BP/'manifest.json',RP/'manifest.json',R/'examples/Tavern-Extension-Demo/BP/manifest.json',R/'examples/Tavern-Mixology-Demo/BP/manifest.json']:
  d=load(p);d['header']['version']=v;d['header']['name']=d['header']['name'].replace('C3','C4')
  for m in d['modules']:m['version']=v
  for dep in d.get('dependencies',[]):
   if dep.get('uuid')in[bpid,rpid]:dep['version']=v
  dump(p,d)
 config=load(R/'config.json');config['name']='Kaleidoscope Tavern C4';dump(R/'config.json',config)
 (BP/'functions/kt_c4_kit.mcfunction').write_text('# C4 uses the existing C3 kit: gives only, no world edits.\nfunction kt_c3_kit\n')
 build=load(R/'docs/C3-BUILD.json');build.update({'phase':'C4','version':v,'gesture':'portable and station two-click; native hold/release not enabled','portable_payload':'kaleidoscope_tavern:shaker_data schema1','pour_duration_ticks':12,'original_put_animation':'bound to successful station ingredient commits','source_wave':'sin(ticks * 1.5) * 0.25','adapted_not_source_authored':['wrist anchor','table shake','12-tick pour and droplet stream'],'engine_acceptance':'NOT_RUN'})
 for exclusion in build.get('planned_recipe_exclusions',[]):exclusion['reason']=exclusion['reason'].replace('C3','C4')
 dump(R/'docs/C4-BUILD.json',build)
 sourcefiles=['interfaces/shaker-hand-source.json','RP/animations/shaker.animation.json','RP/models/entity/shaker.geo.json','interfaces/sound-art-map.json']
 dump(R/'docs/C4-ANIMATION-SOURCE.json',{'sources':[{'path':'art/'+p,'sha256':hashlib.sha256((A/p).read_bytes()).hexdigest()}for p in sourcefiles],'PUT':'Original track bytes retained and invoked on commit.','hand_wave':'Original frequency/amplitude with radians-to-degrees conversion. Wrist rig anchoring is a Bedrock adaptation, not source-exact engine parity.','pour':'12tick interpolation/stream is new cross-platform feedback; never claimed as original animation.','food_workaround':False,'player_json_overridden':False,'engine_accepted':False})
 print('C4 built: portable shaker, 3 attachables, original PUT, reserved pour, bounded feedback.')
if __name__=='__main__':main()
