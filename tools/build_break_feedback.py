#!/usr/bin/env python3
"""Generate shared destruction profiles from the pack's own visible textures.
No downloaded art, vanilla overrides, block/loot IDs, geometry or recipes changed.
Run after existing model/material generators. Requires Pillow.
"""
from pathlib import Path
import argparse, json, re, math, hashlib
from PIL import Image

def write_json(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def material(short):
    if short.startswith(('bottle_','cup_')) or short.endswith('_bottle') or short=='molotov':return 'glass'
    if short.endswith('_sofa'):return 'wool'
    if short.endswith('_crop') or short.startswith('wild_grapevine'):return 'crop'
    if short.endswith('_pendant_lamp') or short.startswith('light_'):return 'chain'
    if short in ('tap','shaker_station','glassware_holder','freezer'):return 'metal'
    if short=='wall_record':return 'stone'
    return 'wood'

def states(condition):
    result={}
    for expr in condition.split('&&'):
        m=re.fullmatch(r"\s*q(?:uery)?\.block_state\(['\"]([^'\"]+)['\"]\)\s*==\s*('[^']*'|\"[^\"]*\"|true|false|-?\d+)\s*",expr)
        if not m:raise ValueError('Unsupported material condition: '+condition)
        key,value=m.groups();result[key]=value[1:-1] if value.startswith(('\"',"'")) else json.loads(value)
    return result

def build(root):
    root=Path(root); rt=root/'runtime'; rp=rt/'RP';bp=rt/'BP'
    atlas=json.loads((rp/'textures/terrain_texture.json').read_text())['texture_data']
    ns=json.loads(next((bp/'blocks').glob('*.json')).read_text())['minecraft:block']['description']['identifier'].split(':')[0]
    images={};samples={};tiles=[];mapping={};native=[]
    def image(alias):
        if alias not in images:
            path=atlas[alias]['textures']
            if isinstance(path,list):path=path[0]
            if isinstance(path,dict):path=path['path']
            file=rp/(path+'.png')
            if not file.exists():raise ValueError('Missing texture '+str(file))
            images[alias]=Image.open(file).convert('RGBA')
        return images[alias]
    def visible(alias):return alias in atlas and image(alias).getchannel('A').getextrema()[1]>0
    def choose(components,short,fallback=None):
        instances=components.get('minecraft:material_instances',{})
        candidates=[instances.get('*',{}).get('texture')]+[v.get('texture') for v in instances.values()]
        for a in candidates:
            if visible(a):return a
        visual=components.get('minecraft:item_visual',{}).get('material_instances',{})
        for v in visual.values():
            if visible(v.get('texture')):return v['texture']
        aliases={'barrel_core':'kt_assets_a17_item_display_barrel','barrel_part':'kt_assets_a17_item_display_barrel','cup_signature_cocktail':'kt_assets_a8_block_mixology_signature_cocktail'}
        a=aliases.get(short,fallback)
        if visible(a):return a
        raise ValueError('No visible destruction texture for '+short)
    colors={'white':(235,235,235),'light_gray':(145,145,135),'gray':(60,65,65),'black':(25,25,30),'brown':(105,65,40),'red':(145,45,45),'orange':(220,110,30),'yellow':(220,170,25),'lime':(100,155,35),'green':(80,105,40),'cyan':(45,140,145),'light_blue':(65,155,190),'blue':(55,65,140),'purple':(105,55,155),'magenta':(175,70,160),'pink':(215,130,165)}
    def color_hint(short):
        value=short
        if short.startswith('stool_'):value=short[6:]
        elif short.startswith('bar_stool_'):value=short[10:]
        elif short.endswith('_sofa'):value=short[:-5]
        elif short.startswith('light_'):value=short[6:]
        else:return None
        return colors.get(value)
    def sample(alias,hint=None):
        cache_key=(alias,hint)
        if cache_key in samples:return samples[cache_key]
        img=image(alias); w,h=img.size
        # Use a real visible 4x4 texel fragment, never a transparent proxy.
        if w<4 or h<4:img=img.resize((max(4,w),max(4,h)),Image.Resampling.NEAREST);w,h=img.size
        best=None;score=(-1,-float("inf"))
        for y in range(0,h-3,4):
            for x in range(0,w-3,4):
                tile=img.crop((x,y,x+4,y+4));pixels=list(tile.getdata());opaque=sum(p[3]>=128 for p in pixels);chroma=sum(max(p[:3])-min(p[:3]) for p in pixels if p[3]>=128)
                mean=tuple(sum(p[k] for p in pixels if p[3]>=128)/max(1,opaque) for k in range(3))
                resemblance=-sum((mean[k]-hint[k])**2 for k in range(3)) if hint else chroma
                s=(opaque,resemblance)
                if s>score:score=s;best=tile
        if not best or score[0]==0:raise ValueError('No opaque fragment '+alias)
        digest=hashlib.sha256(best.tobytes()).hexdigest()
        index=next((i for i,(d,t) in enumerate(tiles) if d==digest),None)
        if index is None:index=len(tiles);tiles.append((digest,best))
        uv=[index%32*4,index//32*4];samples[cache_key]=uv;return uv
    sounds={'glass':'glass','wool':'cloth','crop':'grass','metal':'iron','chain':'chain','wood':'wood','stone':'stone'}
    blocks_json={'format_version':'1.19.30'}
    for file in sorted((bp/'blocks').glob('*.json')):
        data=json.loads(file.read_text());block=data['minecraft:block'];identifier=block['description']['identifier'];short=identifier.split(':')[1];components=block['components'];a=choose(components,short)
        row={'block':identifier,'material':material(short),'particle':ns+':block_fragments','uv':sample(a,color_hint(short))}
        variants=[]
        for perm in block.get('permutations',[]):
            pc=perm['components']
            if 'minecraft:material_instances' not in pc:continue
            variant_alias=choose(pc,short,a)
            uv=sample(variant_alias,color_hint(short))
            if uv==row['uv']:continue
            tests=states(perm['condition']);variants.append({'states':tests,'uv':uv})
        if variants:row['variants']=variants
        mapping[identifier]=row;blocks_json[identifier]={'sound':sounds[row['material']]}
        # Visible blocks keep Bedrock's normal state-dependent texture sampling.
        # The 19 invisible proxy blocks need an explicit non-transparent source.
        if all(not visible(v.get('texture')) for v in components.get('minecraft:material_instances',{}).values()):
            components['minecraft:destruction_particles']={'texture':a,'particle_count':32,'tint_method':'none'};native.append(identifier);write_json(file,data)
    height=max(4,2**math.ceil(math.log2(math.ceil(len(tiles)/32)*4)))
    sheet=Image.new('RGBA',(128,height));
    for i,(_,tile) in enumerate(tiles):sheet.paste(tile,(i%32*4,i//32*4))
    texture='textures/'+ns+'/break_fragments';(rp/(texture+'.png')).parent.mkdir(parents=True,exist_ok=True);sheet.save(rp/(texture+'.png'),optimize=True)
    definition={'format_version':'1.10.0','particle_effect':{'description':{'identifier':ns+':block_fragments','basic_render_parameters':{'material':'particles_alpha','texture':texture}},'components':{
      'minecraft:emitter_lifetime_once':{'active_time':0.01},'minecraft:emitter_rate_instant':{'num_particles':'math.clamp(variable.kt_break_count, 1, 32)'},
      'minecraft:emitter_shape_box':{'offset':[0,0,0],'half_dimensions':[0.35,0.35,0.35],'direction':'outwards'},
      'minecraft:particle_lifetime_expression':{'max_lifetime':'math.random(0.35, 0.7)'},'minecraft:particle_initial_speed':'math.random(0.6, 1.6)',
      'minecraft:particle_appearance_billboard':{'size':[0.045,0.045],'facing_camera_mode':'lookat_xyz','uv':{'texture_width':128,'texture_height':height,'uv':['variable.kt_break_u','variable.kt_break_v'],'uv_size':[4,4]}},
      'minecraft:particle_motion_dynamic':{'linear_acceleration':[0,-9.8,0],'linear_drag_coefficient':1},
      'minecraft:particle_motion_collision':{'enabled':True,'collision_radius':0.02,'collision_drag':0.5,'coefficient_of_restitution':0.15,'expire_on_contact':False}
    }}}
    write_json(rp/'particles/block_fragments.json',definition);write_json(rp/'blocks.json',blocks_json)
    out=bp/'scripts/data/break-feedback.js';out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text('// Generated by build_break_feedback.py; real source texel fragments.\nexport const BREAK_FEEDBACK = '+json.dumps(mapping,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    return {'namespace':ns,'blocks':len(mapping),'transparentProxies':native,'uniqueFragments':len(tiles),'stateVariants':sum(len(r.get('variants',[])) for r in mapping.values()),'atlasSize':[128,height]}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('root',type=Path);a=p.parse_args();print(json.dumps(build(a.root),indent=2))
