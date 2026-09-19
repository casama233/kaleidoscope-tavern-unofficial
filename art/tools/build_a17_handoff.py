"""Exhaustive source inventory, visual math contracts and honest implementation handoff."""
from __future__ import annotations
import collections,copy,hashlib,json,subprocess
from pathlib import Path
from PIL import Image
from interface_common import read,dump,sha
from jar_art import ROOT,RP,BP,AS,NS,JAR_SHA


def source_inventory():
    lock=read(ROOT/'source-jar.lock.json');dispositions=read(ROOT/'interfaces/model-dispositions.json')
    block={r['key']:r for r in dispositions['block_models']};item={r['source'].split('uploaded-jar/',1)[1]:r for r in dispositions['items']};rows=[]
    for record in lock['asset_files']:
        key=record['path'];source=ROOT/'upstream/uploaded-jar'/key;raw=source.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=record['sha256']:raise ValueError('Changed source '+key)
        rel=Path(key).relative_to('assets/kaleidoscope_tavern');cat=rel.parts[0]
        out=[];status='';limits=[]
        if cat=='textures':
            if key.endswith('.png'):
                dest=RP/'textures/kaleidoscope_tavern_jar'/Path(*rel.parts[1:]);assert dest.read_bytes()==raw;out=[str(dest.relative_to(ROOT))];status='ORIGINAL_PIXELS_PACKAGED'
                with Image.open(dest)as im:im.verify()
            else:status='ANIMATION_SCHEDULE_CONVERTED';out=['interfaces/texture-animations.json']
        elif cat=='models':
            if rel.parts[1]=='block':
                row=block[key];status=row['status'];out=['interfaces/model-dispositions.json'];
                if row['asset']:out.append('asset:'+row['asset'])
            else:
                row=item[key];status='ITEM_'+row['mode'].upper();out=['interfaces/item-art-map.json'];
                if row.get('asset'):out.append('asset:'+row['asset'])
        elif cat=='blockstates':status='SOURCE_STATE_TO_ART_CONTRACT';out=['interfaces/blockstate-art-map.json'];limits=['Automatic placement/state transitions require gameplay code.']
        elif cat=='particles':status='PARTICLE_ASSET_CANDIDATE';out=['RP/particles/'+rel.stem+'.json','interfaces/particle-art-map.json'];limits=['Engine acceptance and listed inherited-physics/native-texture differences remain.']
        elif cat=='sounds':status='ORIGINAL_AUDIO_PACKAGED';dest=RP/'sounds/kaleidoscope_tavern'/Path(*rel.parts[1:]);assert dest.read_bytes()==raw;out=[str(dest.relative_to(ROOT))]
        elif cat=='sounds.json':status='SOUND_EVENTS_CONVERTED';out=['RP/sounds/sound_definitions.json']
        elif cat=='lang':status='LANG_VALUES_PRESERVED';loc={'en_us':'en_US','zh_cn':'zh_CN','ja_jp':'ja_JP','ru_ru':'ru_RU'}[rel.stem];out=['RP/texts/'+loc+'.lang'];limits=['Original Java key forms also retained; gameplay/UI must resolve localized strings.']
        elif cat=='ponder':status='JAVA_GUIDE_SCENE_RETAINED_FOR_CODE_ADAPTER';out=[str(source.relative_to(ROOT))];limits=['Java Ponder scene/structure is not a drop-in Bedrock UI or mcstructure.']
        else:raise ValueError('Unhandled source category '+key)
        rows.append({'source':str(source.relative_to(ROOT)),'key':key,'sha256':record['sha256'],'bytes':len(raw),'category':cat,'status':status,'outputs':out,'limits':limits,'engine_accepted':False})
    report={'source_jar_sha256':JAR_SHA,'source_origin':'user_upload','publisher_signature_verified':False,
       'files_total':len(rows),'category_counts':dict(collections.Counter(r['category']for r in rows)),
       'status_counts':dict(collections.Counter(r['status']for r in rows)), 'unclassified_files':[], 'files':rows,
       'interpretation':'Every input resource has a disposition; this does not claim every runtime renderer has been implemented or engine accepted.'}
    dump(ROOT/'docs/A17-ALL-SOURCE-COVERAGE.json',report)
    return report


def hand_curves():
    rad_to_deg=180/3.141592653589793
    # Source extension: sin((tickCount+partial)*1.5)*.25; signed main-hand x.
    expression='math.sin(query.life_time * 20 * 1.5 * 57.295779513) * 0.25'
    animation={'format_version':'1.8.0','animations':{
       'animation.kt_assets_a17.shaker.first_person_source':{'loop':True,'bones':{'hand_source_anchor':{
            'position':["query.property('kt_art:left_hand') ? -8.96 : 8.96",f'-8.32 - ({expression}) * 9.6',-11.52],
            'rotation':[15,0,0]}}},
       'animation.kt_assets_a17.shaker.third_person_source':{'loop':True,'bones':{
            'source_right_arm':{'rotation':[f'{4.31969*rad_to_deg} - ({expression}) * 180',0,-9]},
            'source_left_arm':{'rotation':[f'{4.31969*rad_to_deg} + ({expression}) * 180',0,9]}}}}}
    dump(RP/'animations/shaker_hand_source.animation.json',animation)
    doc={'time_unit':'ticks_plus_partial','source_files':['docs/source-bytecode/ShakerAnimation.txt','docs/source-bytecode/ShakerAnimation$ShakerExtensions.txt'],
      'wave':'sin(timeTicks * 1.5) * 0.25','first_person':{'translation_blocks':['right ? 0.56 : -0.56','-0.52 - wave * 0.6',-.72],'axis_XN_angle_deg':-15},
      'third_person':{'right_x_radians':'4.31969 - PI * wave','left_x_radians':'4.31969 + PI * wave','right_z_radians':-.15707964,'left_z_radians':.15707964},
      'condition':'source getUseItemRemainingTicks() != 0','animation_file':'RP/animations/shaker_hand_source.animation.json',
      'binding':'Template bone names are deliberately not bound to vanilla player.json. Attachable/player-arm adapter must validate coordinate basis and only activate while using shaker.',
      'engine_accepted':False}
    dump(ROOT/'interfaces/shaker-hand-source.json',doc)
    hooks=read(ROOT/'interfaces/runtime-visual-hooks.json');hooks['shaker']['source_hand_hook']='interfaces/shaker-hand-source.json';dump(ROOT/'interfaces/runtime-visual-hooks.json',hooks)


def transform_contracts():
    # Declarative source render-space positions, not invented final entity attachment offsets.
    contract={
      'sandwich_text':{'source':'docs/source-bytecode/SandwichBlockEntityRender.txt','rotation_radians':'radians(rotation * 22.5 + 180)',
         'translation_blocks':['0.5 - sin(angle) * 0.06',1.06,'0.5 + cos(angle) * 0.06'],
         'tilt_degrees':22.5,'tilt_axis':['-cos(angle)',0,'-sin(angle)'],'text_scale':.01,'line_height':10,'max_lines':8,'max_width':55,'bold':True},
      'chalk_text':{'source':'docs/source-bytecode/ChalkboardBlockEntityRender.txt','translation_by_facing':{'east':[.08,1.535,.5],'west':[.92,1.535,.5],'south':[.5,1.535,.08],'north':[.5,1.535,.92]},
         'scale':.012,'line_height':12,'max_lines':11,'width_small':63,'width_large':232},
      'cellar_slots':{'source':'docs/source-bytecode/CellarCabinetBlockEntityRender.txt','position':['0.825 - 0.325 * (slot % 3)','0.78 - 0.29 * floor(slot / 3)',.875],'scale':1,'source_render_stack_angles':[0,-90]},
      'holder_slot':{'source':'docs/source-bytecode/HolderBlockEntityRender.txt','position':[.5,.125,.75],'scale':.95,'source_render_stack_angles':[0,-45]},
      'glassware_holder':{'source':'docs/source-bytecode/GlasswareHolderBlockEntityRender.txt','position':['-0.25 + 0.5 * (slot % 2)',.76,'0.75 + 0.5 * floor(slot / 2)'],'axis_XN_angle_deg':180},
      'other_storage':{'sources':['docs/source-bytecode/BarCabinetBlockEntityRender.txt','docs/source-bytecode/TiltedRackBlockEntityRender.txt','docs/source-bytecode/CircularRackBlockEntityRender.txt'],'status':'Full source disassembly provided; code adapter must implement source branching and stack presentation.'},
      'coordinate_convention':'Java render pose-stack space. Do not use as entity world coordinates without model anchor/facing transform.',
      'engine_accepted':False}
    dump(ROOT/'interfaces/source-render-anchors.json',contract)


def build_handoff():
    hand_curves();transform_contracts();coverage=source_inventory()
    reg=read(ROOT/'asset-conversion.json');rows=[r for r in reg['models']if r['status']=='CONVERTED_CANDIDATE']
    # Separate native visual rigs from independent source geometries and palette appearances.
    snapshot={'build':'A17','source_jar_sha256':JAR_SHA,'all_source_files_accounted':not coverage['unclassified_files'],
      'source_files':len(coverage['files']),'source_pngs':305,'source_model_jsons':790,'source_blockstates':159,
      'source_sound_files':6,'source_particle_definitions':16,'source_animation_schedules':10,
      'full_static_families':{'bar_stool':16,'string_lights':17,'sandwich_board':14,'chalkboard':2,'paintings':14,'cocktails':14,'bottle_arrangements':97},
      'source_item_models':160,'concrete_item_models':158,'abstract_item_templates':2,
      'converted_appearance_candidates':len(rows),'geometries_main':len(list((RP/'models/entity').glob('*.geo.json'))),'editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),
      'native_liquid_rigs':12,'native_particle_assets':16,'signature_color_rig':1,
      'art_source_and_static_data_ready_for_code':True,
      'all_art_runtime_parity_verified':False,'gameplay_implemented':False,'minecraft_engine_test':'NOT_RUN','real_cookery_dependency_bound':False,
      'code_phase_visual_work':['World text renderer and UI layout binding','Use-time shaker hand/arm binding','Source-exact particle inherited base physics, emitter cadence and native drip children','Inventory display anchors, auto orientation, light emission and effect overlays','Animated inventory sprites and renderer-specific transparency/UV checks'],
      'release_status':'ART_SOURCE_BASELINE_FOR_CODE_NOT_PLAYABLE_RELEASE'}
    dump(ROOT/'docs/ART-READINESS.json',snapshot)
    return snapshot

if __name__=='__main__':print(json.dumps(build_handoff(),ensure_ascii=False,indent=2))
