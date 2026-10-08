"""Original animated native item meshes, Java displays, atlas and entry points.

Official APIs: minecraft:block_placer, minecraft:item_visual, terrain flipbooks.
https://learn.microsoft.com/minecraft/creator/documents/createanimatedblocktexture
https://learn.microsoft.com/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_block_placer
https://learn.microsoft.com/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_item_visual
Resource and callback checks do not prove client pixel acceptance.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
NAMES=('depth_charge','mystery_cocktail','nether_special','ice_grape')
TILES={'depth_charge':'kt_c3_depth_charge','mystery_cocktail':'kt_assets_a17_animation_item_mystery_cocktail','nether_special':'kt_c3_nether_special','ice_grape':'kt_assets_a17_animation_item_ice_grape'}
TARGETS={name:('item_display_ice_grape' if name=='ice_grape' else 'cup_'+name) for name in NAMES}
CONTEXTS=('gui','ground','fixed','head','firstperson_righthand','firstperson_lefthand','thirdperson_righthand','thirdperson_lefthand')
def read(path):return json.loads(path.read_text())
def encode(value):return json.dumps(value,ensure_ascii=False,indent=2)+'\n'

def spans(frames):
    """ItemModelGenerator keeps one boundary span per facing/row or column.

    An alpha union loses edges revealed by later frames. Merge every frame's
    boundary; source alpha clips gaps inside each min/max span, as in Java.
    """
    result={}
    for frame in frames:
        alpha=frame.getchannel('A');width,height=frame.size
        for y in range(height):
            for x in range(width):
                if not alpha.getpixel((x,y)):continue
                for facing,dx,dy in [('up',0,-1),('down',0,1),('east',-1,0),('west',1,0)]:
                    nx,ny=x+dx,y+dy
                    if 0<=nx<width and 0<=ny<height and alpha.getpixel((nx,ny)):continue
                    anchor,value=(y,x) if dy else (x,y);key=(facing,anchor)
                    lo,hi=result.get(key,(value,value));result[key]=(min(lo,value),max(hi,value))
    return result

def face(uv,vertical=False):
    u1,v1,u2,v2=uv
    return {'uv':[u2,v2] if vertical else [u1,v1],
            'uv_size':[u1-u2,v1-v2] if vertical else [u2-u1,v2-v1]}

def sprite_geometry(name,frames,display):
    cubes=[{'origin':[-8,0,-.5],'size':[16,16,1],
            'uv':{'north':face([16,0,0,16]),'south':face([0,0,16,16])}}]
    for (direction,anchor),(low,high) in spans(frames).items():
        if direction in ('up','down'):
            origin=[8-(high+1),16-anchor-(direction=='down'),-.5];size=[high-low+1,0,1]
            uv=[low,anchor,high+1,anchor+1]
        else:
            origin=[8-anchor-(direction=='west'),15-high,-.5];size=[0,high-low+1,1]
            # Java vertical spans have reversed Y bounds. Normalize their V
            # endpoints together with the positive Bedrock cube dimensions.
            uv=[anchor,low,anchor+1,high+1]
        cubes.append({'origin':origin,'size':size,'uv':{direction:face(uv,direction in ('up','down'))}})
    transforms={}
    for context in CONTEXTS:
        pose=display.get(context,display.get(context.replace('_lefthand','_righthand'),{}) if context.endswith('_lefthand') else {})
        transforms[context]={key:copy.deepcopy(pose.get(key,value)) for key,value in [('rotation',[0,0,0]),('translation',[0,0,0]),('scale',[1,1,1])]}
    transforms['gui']['fit_to_frame']=False
    return {'format_version':'1.21.0','minecraft:geometry':[{
        'description':{'identifier':'geometry.kt_runtime.item_sprite_'+name,'texture_width':16,'texture_height':16,
                       'visible_bounds_width':2,'visible_bounds_height':2,'visible_bounds_offset':[0,.5,0]},
        'bones':[{'name':'root','pivot':[0,8,0],'cubes':cubes}],
        'item_display_transforms':transforms}]}

def planned(root=ROOT):
    rp=root/'runtime/RP';bp=root/'runtime/BP'
    reference=read(root/'art/interfaces/animated-item-java-reference.json')
    entries={e.get('item'):e for e in read(root/'art/interfaces/item-art-map.json')['entries']}
    terrain=read(rp/'textures/terrain_texture.json');flipbooks=read(rp/'textures/flipbook_textures.json');result={}
    for name in NAMES:
        entry=entries['kaleidoscope_tavern:'+name];animation=entry['animation_source'];source=reference['sources'][name]
        with Image.open(root/source['texture']) as image:sheet=image.convert('RGBA')
        assert list(sheet.size)==source['size']==animation['sheet_size'],name
        assert hashlib.sha256(sheet.tobytes()).hexdigest()==source['rgba_sha256'],name+' source pixels changed'
        assert animation['frame_size']==[16,16] and len(set(animation['durations']))==1,name
        metadata=source['java_animation_metadata']['animation']
        sequence=metadata.get('frames',list(range(sheet.height//16)))
        original_indices=[row['index'] if isinstance(row,dict) else row for row in sequence]
        original_times=[row.get('time',metadata.get('frametime',1)) if isinstance(row,dict) else metadata.get('frametime',1) for row in sequence]
        assert animation['sequence']==original_indices and animation['durations']==original_times,name+' original mcmeta timing changed'
        assert animation['interpolate']==metadata.get('interpolate',False),name+' original mcmeta interpolation changed'
        frames=[sheet.crop((0,i*16,16,(i+1)*16)) for i in dict.fromkeys(animation['sequence'])]
        display={**reference['generated_model']['display'],**entry['java_display']}
        geometry=sprite_geometry(name,frames,display)
        result[rp/f'models/entity/item_sprite_{name}.geo.json']=geometry
        item_path=bp/f'items/{name}.json';item=read(item_path);components=item['minecraft:item']['components']
        # Disable native placement, preserving ordinary drink / Sneak-place
        # callbacks and creative pick behavior. This is not a replacement item.
        components.pop('minecraft:icon',None)
        components['minecraft:block_placer']={'block':'kaleidoscope_tavern:'+TARGETS[name],'use_on':[{'tags':'0'}]}
        result[item_path]=item
        block_path=bp/f'blocks/{TARGETS[name]}.json'
        visual={
            'geometry':{'identifier':geometry['minecraft:geometry'][0]['description']['identifier']},
            'material_instances':{'*':{'texture':TILES[name],'render_method':'alpha_test_single_sided','ambient_occlusion':0.0,'face_dimming':False}}}
        if name=='ice_grape':
            # Render-only target: no creative entry or tick, never native-placed.
            # The existing crop/trellis geometry and pick results are untouched.
            block={'format_version':'1.26.50','minecraft:block':{
                'description':{'identifier':'kaleidoscope_tavern:'+TARGETS[name]},
                'components':{'minecraft:geometry':copy.deepcopy(visual['geometry']),
                    'minecraft:material_instances':copy.deepcopy(visual['material_instances']),
                    'minecraft:collision_box':False,'minecraft:selection_box':False,
                    'minecraft:light_dampening':0,'minecraft:loot':'loot_tables/empty.json'}}}
        else:block=read(block_path)
        block['minecraft:block']['components']['minecraft:item_visual']=visual
        result[block_path]=block
        terrain['texture_data'][TILES[name]]={'textures':f'textures/kt_runtime/animated_items/{name}/frame_00'}
        row={'flipbook_texture':f'textures/kaleidoscope_tavern_jar/item/{name}','atlas_tile':TILES[name],
             'ticks_per_frame':animation['durations'][0],'frames':animation['sequence'],'blend_frames':animation['interpolate']}
        indices=[i for i,r in enumerate(flipbooks) if r['atlas_tile']==TILES[name]]
        assert len(indices)==1,(name,'expected one original item flipbook')
        flipbooks[indices[0]]=row
    result[rp/'textures/terrain_texture.json']=terrain;result[rp/'textures/flipbook_textures.json']=flipbooks
    return result

def check_or_write(write=False,root=ROOT):
    errors=[]
    for path,value in planned(root).items():
        if not path.exists() or read(path)!=value:
            if write:path.write_text(encode(value))
            else:errors.append(str(path.relative_to(root)))
    if errors:raise AssertionError('Animated item render route drift: '+', '.join(errors))
    return len(NAMES)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    print('Original animated native item routes:',check_or_write(args.write))
