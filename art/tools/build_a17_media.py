"""Build JAR media bindings and source-derived visual test rigs. No gameplay.
Never invent missing source art. Cross-engine behavior remains unaccepted until game tests.
"""
from __future__ import annotations
import copy,hashlib,json,math,shutil
from pathlib import Path
from PIL import Image
from interface_common import read,dump
from jar_art import ROOT,RP,BP,AS,NS,JAR_SHA,frame_spec


def animation_bindings():
    terrain=read(RP/'textures/terrain_texture.json'); flips=read(RP/'textures/flipbook_textures.json') if (RP/'textures/flipbook_textures.json').exists() else []
    schedules=[]
    for meta in sorted((AS/'textures').rglob('*.mcmeta')):
        source=meta.with_suffix('');s=frame_spec(source);rel=source.relative_to(AS/'textures').with_suffix('').as_posix();fw,fh=s['frame_size'];w,h=s['sheet_size'];cols=w//fw
        tag=rel.replace('/','_');fd=ROOT/'animation-sources/frames/a17'/tag;fd.mkdir(parents=True,exist_ok=True)
        with Image.open(source)as im:
            for n in range(s['slots']):im.crop(((n%cols)*fw,(n//cols)*fh,(n%cols+1)*fw,(n//cols+1)*fh)).save(fd/f'{n}.png')
        # Index the item animations as terrain sprite inspections too. Real GUI item animation is separate.
        tile=NS+'_animation_'+tag;first='textures/kt_derived/a17/animated_'+tag
        dest=RP/(first+'.png');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(fd/f'{s["sequence"][0]}.png',dest)
        terrain['texture_data'][tile]={'textures':first}
        entry={'flipbook_texture':'textures/kaleidoscope_tavern_jar/'+rel,'atlas_tile':tile,'ticks_per_frame':s['durations'][0],'frames':s['sequence'],'blend_frames':s['interpolate']}
        if len(set(s['durations']))>1:
            unit=math.gcd(*s['durations']);entry['ticks_per_frame']=unit;entry['frames']=[x for x,t in zip(s['sequence'],s['durations']) for _ in range(t//unit)]
        # Bind each new JAR-backed model using this texture, not merely an unused atlas tile.
        keys=[k for k,v in terrain['texture_data'].items() if v.get('textures')=='textures/kaleidoscope_tavern_jar/'+rel]
        for k in keys+[tile]:
            flips=[x for x in flips if x.get('atlas_tile')!=k];flips.append({**entry,'atlas_tile':k})
            # Terrain needs a single frame entry while flipbook uses full strip.
            terrain['texture_data'][k]={'textures':first}
        schedules.append({'source':str(source.relative_to(ROOT)),'metadata':str(meta.relative_to(ROOT)),**s,
            'terrain_tiles':keys+[tile],'source_png_preserved':True,'item_gui_playback':'NOT_IMPLEMENTED'if rel.startswith('item/')else'NOT_APPLICABLE','engine_accepted':False})
    dump(RP/'textures/terrain_texture.json',terrain);dump(RP/'textures/flipbook_textures.json',flips)
    dump(ROOT/'interfaces/texture-animations.json',{'jar_sha256':JAR_SHA,'schedules':schedules,'engine_accepted':False})
    return schedules


def sound_bindings():
    events=read(AS/'sounds.json');out={};rows=[]
    for key,data in events.items():
        ident=NS+'.'+key;clips=[]
        for s in data['sounds']:
            value=s if isinstance(s,str)else s['name'];dest='sounds/kaleidoscope_tavern/'+value.split(':',1)[1]
            assert (RP/(dest+'.ogg')).is_file();clips.append({'name':dest,'stream':False})
        out[ident]={'category':'block'if key.startswith('block.')else'player','sounds':clips}
        rows.append({'source_event':'kaleidoscope_tavern:'+key,'event':ident,'subtitle_key':data.get('subtitle'),'clips':[s['name']+'.ogg'for s in clips],'engine_accepted':False})
    dump(RP/'sounds/sound_definitions.json',{'format_version':'1.14.0','sound_definitions':out})
    dump(ROOT/'interfaces/sound-art-map.json',{'events':rows,'source':str((AS/'sounds.json').relative_to(ROOT))})
    return rows


def particle_bindings():
    rows=[]
    for src in sorted((AS/'particles').glob('*.json')):
        name=src.stem;refs=read(src)['textures'];ident=NS+':'+name;native=refs[0].startswith('minecraft:')
        source_art=[];pmeta={'source':str(src.relative_to(ROOT)),'particle_id':ident,'textures':refs,'engine_accepted':False,'runtime_emission_connected':False}
        uv={};texture='';n=len(refs)
        if native:
            # Java drip_hang is vanilla, not inside the mod. Reuse verified Bedrock native atlas.
            texture='textures/particle/particles';uv={'texture_width':128,'texture_height':128,'uv':[8,56],'uv_size':[8,8]}
            pmeta['native_texture_dependency']={'java':'minecraft:drip_hang','bedrock_atlas':texture,'uv':[8,56,8,8],
                'reference':'https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/particles/water_drip.json',
                'art_equivalence':'CROSS_EDITION_NATIVE_SUBSTITUTION_NOT_PIXEL_EQUIVALENCE'}
        else:
            images=[]
            for r in refs:
                p=AS/'textures/particle'/(r.split(':',1)[1]+'.png');assert p.is_file()
                source_art.append(str(p.relative_to(ROOT)))
                with Image.open(p)as im:images.append(im.convert('RGBA').copy())
            w,h=images[0].size;assert all(im.size==(w,h)for im in images)
            if n>1:
                sheet=Image.new('RGBA',(w,h*n));
                for i,im in enumerate(images):sheet.paste(im,(0,i*h))
                texture='textures/kt_derived/a17/particle_'+name;sheet.save(RP/(texture+'.png'))
                pmeta['derived_sheet']={'file':'RP/'+texture+'.png','source_images':source_art,'resampled':False}
            else:texture='textures/kaleidoscope_tavern_jar/particle/'+refs[0].split(':',1)[1]
            if name=='butterfly_incense_large':
                uv={'texture_width':w,'texture_height':h*n,'flipbook':{'base_UV':[0,0],'size_UV':[w,h],'step_UV':[0,h],'frames_per_second':4,'max_frame':n,'loop':True,'stretch_to_lifetime':False}}
                pmeta['frame_mode']='AGE_DIV_5_LOOP'
            else:
                uv={'texture_width':w,'texture_height':h*n,'uv':[0,f'math.floor(variable.particle_random_2 * {n}) * {h}'if n>1 else 0],'uv_size':[w,h]}
                pmeta['frame_mode']='RANDOM_ON_SPAWN'if n>1 else'SINGLE'
        comps={'minecraft:emitter_rate_instant':{'num_particles':1},'minecraft:emitter_lifetime_once':{'active_time':.05},
            'minecraft:emitter_shape_point':{'offset':[0,0,0]},'minecraft:emitter_local_space':{'position':True,'rotation':False}}
        firefly=name=='firefly_incense_large';large=name.endswith('_large');small=not large and not native
        if small or firefly:
            life='(60 + math.floor(variable.particle_random_1 * 40)) / 20'if firefly else'(40 + math.floor(variable.particle_random_1 * 20)) / 20'
            size='0.08 + variable.particle_random_2 * 0.04'if firefly else'0.15 + variable.particle_random_2 * 0.05'
            noise=.002 if firefly else .001;drag=.96 if firefly else .95
            # Preserve discrete 20-Hz random-walk update order; parameterized input speeds are blocks/tick.
            init="(variable.kt_init ?? 0) == 0 ? { variable.kt_init=1; variable.kt_tick=0; variable.kt_x=0; variable.kt_y=0; variable.kt_z=0; variable.kt_dx=(variable.input_dx ?? 0); variable.kt_dy=(variable.input_dy ?? 0); variable.kt_dz=(variable.input_dz ?? 0); }; "
            body=f"variable.kt_dx=variable.kt_dx+(math.random(0,1)-0.5)*{noise}; variable.kt_dz=variable.kt_dz+(math.random(0,1)-0.5)*{noise}; "
            if firefly:body+="variable.kt_dy=variable.kt_dy+(math.random(0,1)-0.5)*0.0005; "
            body+=f"variable.kt_x=variable.kt_x+variable.kt_dx; variable.kt_y=variable.kt_y+variable.kt_dy; variable.kt_z=variable.kt_z+variable.kt_dz; variable.kt_dx=variable.kt_dx*{drag}; variable.kt_dz=variable.kt_dz*{drag}; "
            update=init+"variable.kt_steps=math.max(0,math.floor(variable.particle_age*20)-variable.kt_tick); loop(variable.kt_steps,{ "+body+" }); variable.kt_tick=math.floor(variable.particle_age*20);"
            comps['minecraft:particle_initialization']={'per_update_expression':update}
            comps['minecraft:particle_motion_parametric']={'relative_position':['variable.kt_x','variable.kt_y','variable.kt_z']}
            if firefly:
                alpha='0.9 * (0.6 + 0.4 * math.sin(variable.particle_age * 20 * (0.3 + variable.particle_random_3 * 0.4) * 57.295779513)) * math.min(1, math.max(0, (1 - variable.particle_age / variable.particle_lifetime) * 5))'
                pmeta['behavior_source']='docs/source-bytecode/FireflyIncenseLargeParticle.txt'
            else:
                alpha='0.8 * math.min(1, math.max(0, (1 - variable.particle_age / variable.particle_lifetime) * 4))'
                pmeta['behavior_source']='docs/source-bytecode/IncenseParticle.txt'
                comps['minecraft:particle_appearance_lighting']={}
            color=[1,1,1,alpha];material='particles_blend'
            pmeta['parity_limits']=['Molang and Java RNG sequences differ; transition law and source constants preserved.','Emitter inputs/emission cadence and in-engine 20-Hz behavior require runtime testing.']
        elif large:
            life='(500 + math.floor(variable.particle_random_1 * 501)) / 20'
            size='(variable.input_base_quad_size ?? 0.1) * (0.6 + variable.particle_random_3 * 0.6)'
            # Base vanilla Particle constructor/motion is not packaged in the user mod. Caller can provide it.
            comps['minecraft:emitter_shape_point']['offset']=[0,-.125,0]
            comps['minecraft:particle_initial_speed']=0
            comps['minecraft:particle_motion_dynamic']={'linear_acceleration':[0,'variable.input_acceleration_y ?? 0',0],'linear_drag_coefficient':0}
            comps['minecraft:particle_appearance_lighting']={};color=[1,1,1,1];material='particles_alpha'
            pmeta['behavior_source']='docs/source-bytecode/'+('ButterflyIncenseLargeParticle'if name.startswith('butterfly')else'IncenseSuspendedParticle')+'.txt'
            pmeta['source_parameters']={'lifetime_ticks':[500,1000],'gravity_field':.01,'friction':1,'size_multiplier':[.6,1.2],'offset_y':-.125}
            pmeta['parity_limits']=['Vanilla base quad size and inherited particle acceleration require runtime inputs; preview defaults are not source-equivalence claims.']
        else:
            life=.9;size=.06;material='particles_alpha'
            comps['minecraft:particle_initial_speed']=0
            comps['minecraft:particle_motion_dynamic']={'linear_acceleration':[0,0,0]}
            comps['minecraft:particle_appearance_lighting']={}
            color=[.2,.3,1,1]if name.startswith('water')else[1,.4,.05,1]
            pmeta['behavior_source']='docs/source-bytecode/TapDripParticle.txt'
            pmeta['source_parameters']={'lifetime_ticks':18,'gravity_multiplier':.02,'velocity_multiplier':.02,'emits_falling_drip_every_tick':True}
            pmeta['parity_limits']=['Uses target-edition native sprite. Falling native child emission and fluid colors are runtime adapter work; this is the hanging drop inspection.']
        comps['minecraft:particle_lifetime_expression']={'max_lifetime':life}
        comps['minecraft:particle_appearance_billboard']={'size':[size,size],'facing_camera_mode':'rotate_xyz','uv':uv}
        comps['minecraft:particle_appearance_tinting']={'color':color}
        target=RP/f'particles/{name}.json';dump(target,{'format_version':'1.10.0','particle_effect':{'description':{'identifier':ident,'basic_render_parameters':{'material':material,'texture':texture}},'components':comps}})
        pmeta['file']=str(target.relative_to(ROOT));pmeta['texture_files']=source_art;rows.append(pmeta)
    dump(ROOT/'interfaces/particle-art-map.json',{'particles':rows,'note':'All original sprite references accounted. Native substitutions and runtime-dependent base behavior explicitly listed.','engine_accepted':False})
    f=BP/'functions/kt_a17/particles.mcfunction';f.parent.mkdir(parents=True,exist_ok=True)
    f.write_text('# One-shot samples only; no automatic gameplay emitters.\n'+'\n'.join(f'particle {r["particle_id"]} ~{i%4*2} ~1 ~{i//4*2}'for i,r in enumerate(rows))+'\n')
    return rows


def liquid_rigs():
    fluids=['grape','ice_grape','gold_grape','green_grape','sweet_berries','glow_berries'];rows=[];anim={}
    for fixture,capacity,y0,dy,width in [('pressing_tub',1000,2,4,12),('barrel',4000,32,10.4,16)]:
        gid=f'geometry.{NS}.liquid_{fixture}';half=width/2
        # Top-only surface matching source RenderUtils.renderSurface; no invented volumetric cube.
        geo={'format_version':'1.21.0','minecraft:geometry':[{'description':{'identifier':gid,'texture_width':16,'texture_height':16,'visible_bounds_width':4,'visible_bounds_height':4,'visible_bounds_offset':[0,1.5,0]},'bones':[{'name':'surface','pivot':[0,0,0],'cubes':[{'origin':[-half,0,-half],'size':[width,0,width],'uv':{'up':{'uv':[0,0],'uv_size':[width,width]}}}]}]}]}
        dump(RP/f'models/entity/rig_liquid_{fixture}.geo.json',geo)
        aid=f'animation.{NS}.liquid_{fixture}';amt="query.property('kt_art:amount')"
        anim[aid]={'loop':True,'bones':{'surface':{'position':[0,f'{y0} + {dy} * {amt} / {capacity}',0],'scale':f'{amt} > 0 ? 1 : 0'}}}
        for fluid in fluids:
            name=f'rig_liquid_{fixture}_{fluid}';ident=NS+':'+name;tex=f'textures/kaleidoscope_tavern_jar/block/{fluid}_juice_still';assert (RP/(tex+'.png')).is_file()
            bp=read(BP/'entities/barrel_closed.json');e=bp['minecraft:entity'];e['description']['identifier']=ident
            e['description']['properties']={'kt_art:amount':{'type':'int','range':[0,capacity],'default':capacity,'client_sync':True}}
            e['events']={f'kt_art:level_{n}':{'set_property':{'kt_art:amount':int(capacity*n/8)}}for n in range(9)}
            dump(BP/f'entities/{name}.json',bp)
            dump(RP/f'entity/{name}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':ident,'materials':{'default':'entity_alphablend'},'textures':{'default':tex},'geometry':{'default':gid},'animations':{'level':aid},'scripts':{'animate':['level']},'render_controllers':['controller.render.kt_assets_a1.static']}}})
            rows.append({'fixture':fixture,'fluid':fluid+'_juice','entity_id':ident,'capacity_mb':capacity,'y_pixels_base':y0,'y_pixels_range':dy,'width_pixels':width,'amount_property':'kt_art:amount','inspection_events':[f'kt_art:level_{n}'for n in range(9)],'source':'docs/source-bytecode/'+('BarrelBlockEntityRender'if fixture=='barrel'else'PressingTubBlockEntityRender')+'.txt','texture':'RP/'+tex+'.png','gameplay_connected':False})
    dump(RP/'animations/liquid_levels.animation.json',{'format_version':'1.8.0','animations':anim})
    dump(ROOT/'interfaces/liquid-art-map.json',{'rigs':rows,'formula_source':'docs/source-bytecode/RenderUtils.txt','flow_pngs':'RP/textures/kaleidoscope_tavern_jar/block/*_juice_flow.png','engine_accepted':False,'note':'Each inspection rig is independent of the furniture. Gameplay adapter must synchronize location, fluid and amount.'})
    return rows


def tint_rigs():
    # Extract only the source tintindex faces. A uniformly tinted whole glass would be incorrect.
    from jar_art import convert
    import build_a1_base as b
    from build_a4_base import geometry_for
    m,_,_=convert(AS/'models/block/mixology/signature_cocktail.json','rig_signature_tint')
    originals=read(AS/'models/block/mixology/signature_cocktail.json')
    tintfaces=sum('tintindex'in f for e in originals['elements']for f in e['faces'].values())
    tinted=[];body=[]
    for bone in m['bones']:
        ta={**copy.deepcopy(bone),'name':'tint_'+bone['name'],'cubes':[]};bo={**copy.deepcopy(bone),'name':'body_'+bone['name'],'cubes':[]}
        for c in bone['cubes']:
            for target,yes in [(ta,True),(bo,False)]:
                nc=copy.deepcopy(c);nc['faces']={k:f for k,f in c['faces'].items()if ('tint_index'in f)==yes}
                if nc['faces']:target['cubes'].append(nc)
        tinted.append(ta);body.append(bo)
    actual=sum(len(c['faces'])for bb in tinted for c in bb['cubes'])
    if actual!=tintfaces:raise ValueError(f'Tint face codec lost faces {actual}/{tintfaces}')
    descs={}
    for suffix,bones in [('glass',body),('liquid',tinted)]:
        model={**copy.deepcopy(m),'name':'rig_signature_'+suffix,'bones':bones};b.NS=NS;geo=geometry_for(model,model['name']);descs[suffix]=geo['minecraft:geometry'][0]['description']['identifier'];dump(RP/f'models/entity/{model["name"]}.geo.json',geo)
    ident=NS+':rig_signature_color';bp=read(BP/'entities/barrel_closed.json');e=bp['minecraft:entity'];e['description']['identifier']=ident
    e['description']['properties']={f'kt_art:{c}':{'type':'int','range':[0,255],'default':255,'client_sync':True}for c in ['red','green','blue']}
    # Test colors, not new original variants. Never saved back to source PNG.
    e['events']={f'kt_art:color_{name}':{'set_property':{f'kt_art:{c}':v for c,v in zip(['red','green','blue'],rgb)}}for name,rgb in [('white',(255,255,255)),('red',(255,0,0)),('green',(0,255,0)),('blue',(0,0,255))]}
    dump(BP/'entities/rig_signature_color.json',bp)
    dump(RP/'entity/rig_signature_color.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':ident,'materials':{'default':'entity_alphablend'},'textures':{'default':str(Path(m['texture_file']).relative_to('RP').with_suffix(''))},'geometry':descs,'render_controllers':[f'controller.render.{NS}.signature_glass',f'controller.render.{NS}.signature_tint']}}})
    controllers = {
        f'controller.render.{NS}.signature_glass': {
            'geometry': 'Geometry.glass', 'materials': [{'*': 'Material.default'}],
            'textures': ['Texture.default']
        },
        f'controller.render.{NS}.signature_tint': {
            'geometry': 'Geometry.liquid', 'materials': [{'*': 'Material.default'}],
            'textures': ['Texture.default'],
            'color': {
                'r': "query.property('kt_art:red') / 255",
                'g': "query.property('kt_art:green') / 255",
                'b': "query.property('kt_art:blue') / 255", 'a': 1
            }
        }
    }
    for controller in controllers.values():
        controller['uv_anim'] = {'offset': [0, 'math.mod(math.floor(query.life_time * 10), 6) / 6'], 'scale': [1, 1/6]}
    dump(RP/'render_controllers/signature_tint.json', {
        'format_version': '1.8.0', 'render_controllers': controllers
    })
    return {'entity_id':ident,'tinted_faces':tintfaces,'original_texture_unchanged':True,'whole_glass_tint':False,'properties':['kt_art:red','kt_art:green','kt_art:blue'],'engine_accepted':False,'computed_cocktail_color_connected':False,'sprite_animation_in_entity':'SOURCE_6_FRAMES_AT_2_TICKS_UV_CANDIDATE'}


def build_media():
    anim=animation_bindings();sounds=sound_bindings();particles=particle_bindings();liquids=liquid_rigs();tint=tint_rigs()
    # Explicit component maps for code-owned UI/overlays. Store source pixels; no fake UI parity.
    ui={}
    for category in ['gui','mob_effect','item']:
        ui[category]=[{'source':str(p.relative_to(ROOT)),'texture':'RP/textures/kaleidoscope_tavern_jar/'+p.relative_to(AS/'textures').as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'runtime_layout_connected':False}for p in sorted((AS/'textures'/category).rglob('*.png'))]
    dump(ROOT/'interfaces/ui-art-map.json',ui)
    hooks={'jar_sha256':JAR_SHA,'ready_for_gameplay_adapter_implementation':True,'engine_accepted':False,
      'all_gameplay_functions_implemented':False,'liquid_rigs':liquids,'signature_color_rig':tint,
      'particles':{'registry':'interfaces/particle-art-map.json','count':len(particles),'all_source_sprites_accounted':True},
      'sounds':{'registry':'interfaces/sound-art-map.json','events':len(sounds)},'animated_textures':{'registry':'interfaces/texture-animations.json','schedules':len(anim)},
      'boards':{'registry':'interfaces/board-orientations.json','appearance_variants':14,'orientations_per_variant':16},
      'text':{'small_chalkboard':'chalkboard_small','large_chalkboard':'chalkboard_large','source_renderer':'docs/source-bytecode/TextBlockEntityRender.txt','input_fields':['text','color','glow','alignment','waxed'],'in_world_dynamic_text':'REQUIRES_CODE_AND_RENDERING_PROTOTYPE'},
      'displayed_items':{'assets':'interfaces/item-art-map.json','anchors_source_directory':'docs/source-bytecode','targets':['bar_cabinet','glass_bar_cabinet','cellar_cabinet','tilted_rack','circular_rack','holder','glassware_holder'],'inventory_contents_connected':False},
      'shaker':{'model':'shaker','put_animation':'RP/animations/shaker.animation.json','source_hand_hook':'interfaces/shaker-hand-source.json','hand_animation_connected':False},
      'native_vanilla_dependencies':['minecraft:water','minecraft:lava','minecraft:potion','minecraft:bucket','textures/particle/particles'],
      'known_visual_acceptance_gates':['Native particle texture substitutions and default inherited physics require review.','Animated item GUI sprites and entity texture UV animation require renderer integration.','In-world arbitrary text and hand shaker pose require code-side render prototypes.','Light level / glow, auto orientation, displayed contents, effect overlays and source GUI layout are not gameplay-connected.','No actual Minecraft/bridge/Blockbench engine test.','Cookery real BP/RP package not supplied.']}
    dump(ROOT/'interfaces/runtime-visual-hooks.json',hooks)
    fn=BP/'functions/kt_a17/sounds.mcfunction';fn.write_text('# Plays four source sound events at the caller; no gameplay.\n'+'\n'.join('playsound '+e['event']+' @s ~ ~ ~'for e in sounds)+'\n')
    dump(ROOT/'docs/A17-MEDIA-DELTA.json',{'source_animations':len(anim),'sound_events':len(sounds),'original_audio_files':len(list((AS/'sounds').rglob('*.ogg'))),'particle_effects':len(particles),'particle_original_images':len(list((AS/'textures/particle').rglob('*.png'))),'liquid_visual_rigs':len(liquids),'liquid_geometry_files':2,'signature_split_rig':tint,'runtime_connected':False,'engine_test':'NOT_RUN'})
    return hooks

if __name__=='__main__':build_media()
