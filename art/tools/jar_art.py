"""JAR-sourced art codec. No gameplay. No network. Never changes locked inputs.
Each source vertex/face/UV is retained; multi-image models use pixel-preserving atlases.
"""
from __future__ import annotations
import copy, hashlib, json, math
from pathlib import Path
import numpy as np
from PIL import Image
import build_a1_base as b
from build_a4_base import geometry_for
from model_ops import split_reversed_cubes
from interface_common import read, dump
ROOT,RP,BP,UP=b.ROOT,b.RP,b.BP,b.UP
AS=UP/'uploaded-jar/assets/kaleidoscope_tavern'
NS='kt_assets_a17'
JAR_SHA='03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff'
COLOR_ZH={'green':'綠','light_blue':'淺藍','light_gray':'淺灰','lime':'淺綠','magenta':'洋紅','orange':'橙','pink':'粉紅','purple':'紫','yellow':'黃'}
BOARD_ZH={'base':'素面','allium':'絨球蔥','azure_bluet':'雛草','cornflower':'矢車菊','grass':'青草','orchid':'蘭花','peony':'牡丹','pink_petals':'粉紅花瓣','pitcher_plant':'豬籠草','poppy':'罌粟','sunflower':'向日葵','torchflower':'火把花','tulip':'鬱金香','wither_rose':'凋零玫瑰'}
CONTEXTS=['gui','ground','fixed','head','firstperson_righthand','firstperson_lefthand','thirdperson_righthand','thirdperson_lefthand']

def logical_source(s):
    s=s.replace('\\','/')
    return s[s.index('assets/kaleidoscope_tavern/'): ] if 'assets/kaleidoscope_tavern/' in s else s

def resolve(path:Path, seen=()):
    path=path.resolve()
    if path in seen:raise ValueError('Parent cycle: '+str(path))
    d=read(path);chain=[str(path.relative_to(ROOT))]
    if d.get('loader')=='neoforge:separate_transforms':
        # Base may itself have parents. Record display-specific override separately.
        base=d['base']; result,more=resolve_object(base,seen+(path,));result['separate_transforms']=copy.deepcopy(d.get('perspectives',{}))
        return result,chain+more
    parent=d.get('parent')
    if parent=='minecraft:item/generated':
        out=copy.deepcopy(d);out['_generated']=True
        return out,chain+[parent]
    if not parent:return copy.deepcopy(d),chain
    if parent=='minecraft:block/cross':
        p=ROOT/'references/minecraft-1.20.1/cross.json'
    elif parent.startswith('kaleidoscope_tavern:'):
        p=AS/'models'/(parent.split(':',1)[1]+'.json')
    else:raise ValueError('Unresolved external model: '+parent)
    base,more=resolve(p,seen+(path,))
    for k,v in d.items():
        if k=='parent':continue
        if k in ('textures','display'):base[k]={**base.get(k,{}),**copy.deepcopy(v)}
        else:base[k]=copy.deepcopy(v)
    return base,chain+more

def resolve_object(d,seen=()):
    parent=d.get('parent');base={};chain=[]
    if parent and parent.startswith('kaleidoscope_tavern:'):base,chain=resolve(AS/'models'/(parent.split(':',1)[1]+'.json'),seen)
    elif parent=='minecraft:item/generated':base['_generated']=True
    elif parent:raise ValueError(parent)
    for k,v in d.items():
        if k=='parent':continue
        base[k]={**base.get(k,{}),**copy.deepcopy(v)} if k in ('textures','display') else copy.deepcopy(v)
    return base,chain

def texture_id(ref, d):
    visited=set()
    while ref.startswith('#'):
        if ref in visited:raise ValueError('Texture cycle')
        visited.add(ref);ref=d['textures'][ref[1:]]
    if ':' not in ref:ref='minecraft:'+ref
    return ref

def texpath(ref):
    if not ref.startswith('kaleidoscope_tavern:'):raise ValueError('External visible texture not embedded: '+ref)
    p=AS/'textures'/(ref.split(':',1)[1]+'.png')
    if not p.is_file():raise FileNotFoundError(p)
    return p

def frame_spec(path):
    with Image.open(path) as im:w,h=im.size
    mp=Path(str(path)+'.mcmeta')
    if not mp.exists():return {'sheet_size':[w,h],'frame_size':[w,h],'slots':1,'sequence':[0],'durations':[1],'interpolate':False}
    a=read(mp)['animation'];fw=a.get('width',w);fh=a.get('height',min(w,h));n=(w//fw)*(h//fh)
    seq=[];dur=[]
    for x in a.get('frames',list(range(n))):
        seq.append(x if isinstance(x,int) else x['index']);dur.append(a.get('frametime',1) if isinstance(x,int) else x.get('time',a.get('frametime',1)))
    if any(i<0 or i>=n for i in seq)or any(t<1 for t in dur):raise ValueError('Invalid frame schedule '+str(path))
    return {'sheet_size':[w,h],'frame_size':[fw,fh],'slots':n,'sequence':seq,'durations':dur,'interpolate':a.get('interpolate',False)}

def pose_transform(d):
    tr=d.get('transform',{});q=tr.get('rotation')
    if not q:return [0,0,0]
    if len(q)!=4 or abs(q[0])>1e-6 or abs(q[2])>1e-6:raise ValueError('Needs quaternion codec: '+str(q))
    return [0,math.degrees(2*math.atan2(q[1],q[3])),0]

def convert(path:Path,name:str,data=None):
    data,chain=resolve(path) if data is None else (copy.deepcopy(data),[str(path.relative_to(ROOT))])
    if not data.get('elements'):raise ValueError('No elements '+str(path))
    refs=sorted({texture_id(f['texture'],data)for e in data['elements']for f in e['faces'].values()})
    images={};dims={};specs={}
    for r in refs:
        p=texpath(r);s=frame_spec(p);specs[r]=s
        with Image.open(p)as im:images[r]=im.convert('RGBA').copy()
        dims[r]=s['frame_size']
    atlas=None;offsets={r:[0,0]for r in refs};target=''
    if len(refs)==1:
        tex=refs[0].split(':',1)[1];w,h=dims[refs[0]]
        target='RP/textures/kaleidoscope_tavern_jar/'+tex+'.png'
    else:
        if any(specs[r]['slots']>1 for r in refs):raise ValueError('Animated multi texture atlas requires per-frame packing')
        w=2**math.ceil(math.log2(sum(dims[r][0] for r in refs)));h=2**math.ceil(math.log2(max(dims[r][1]for r in refs)))
        im=Image.new('RGBA',(w,h),(0,0,0,0));x=0;parts=[]
        for r in refs:
            im.paste(images[r],(x,0));offsets[r]=[x,0];parts.append({'source':str(texpath(r).relative_to(ROOT)),'offset':[x,0],'size':dims[r]});x+=dims[r][0]
        tex='derived/a17/'+name;target='RP/textures/kt_derived/a17/'+name+'.png'
        p=ROOT/target;p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
        atlas={'file':target,'parts':parts,'size':[w,h],'resampled':False,'recolored':False}
    cubes=[];notes=[]
    for i,e in enumerate(data['elements']):
        r=e.get('rotation',{});axis='xyz'.index(r.get('axis','y'));angle=r.get('angle',0);pivot=r.get('origin',[8,0,8]);a=list(e['from']);z=list(e['to'])
        if r.get('rescale')and angle:
            factor=1/math.cos(math.radians(angle))
            for k in range(3):
                if k!=axis:a[k]=pivot[k]+(a[k]-pivot[k])*factor;z[k]=pivot[k]+(z[k]-pivot[k])*factor
            notes.append(f'Element {i}: source rescale baked')
        rot=[0,0,0];rot[axis]=angle;faces={}
        for side,f in e['faces'].items():
            ref=texture_id(f['texture'],data);tw,th=dims[ref];ox,oy=offsets[ref];u,v,U,V=f['uv']
            out={'uv':[ox+u*tw/16,oy+v*th/16,ox+U*tw/16,oy+V*th/16],'rotation':f.get('rotation',0)}
            if not e.get('shade',True):out['material_instance']='unshaded'
            if 'tintindex'in f:out['tint_index']=f['tintindex']
            faces[side]=out
        cubes.append({'name':f'{name}_element{i}','from':[a[0]-8,a[1],a[2]-8],'to':[z[0]-8,z[1],z[2]-8],
         'origin':[pivot[0]-8,pivot[1],pivot[2]-8],'rotation':rot,'faces':faces,'box_uv':False,'shade':e.get('shade',True)})
    raw={'name':name,'texture':tex,'texture_size':[w,h],'texture_file':target,'source':str(path.relative_to(UP)),
        'bones':[{'name':'root','origin':[0,8,0],'rotation':pose_transform(data),'cubes':cubes}],
        'issues':[],'conversion_notes':notes,'java_display':data.get('display',{}),'java_render_type':data.get('render_type','cutout'),
        'java_particle_texture':data.get('textures',{}).get('particle'),'source_origin':'uploaded_jar','source_jar_sha256':JAR_SHA,
        'source_textures':refs,'source_atlas':atlas,'source_transform':data.get('transform',{}),'parent_chain':chain}
    model,mapping=split_reversed_cubes(raw)
    # Oriented-face decomposition preserves UV/winding but legacy codec omits metadata.
    # Reattach original tint/material fields by its explicit source-to-panel mapping.
    for link in mapping:
        source_face = raw['bones'][0]['cubes'][link['source_element']]['faces'][link['source_face']]
        panel = next(c for bone in model['bones'] for c in bone['cubes'] if c['name']==link['output_cube'])
        for k,v in source_face.items():
            if k not in ('uv','rotation'): panel['faces'][link['output_face']][k]=copy.deepcopy(v)
    for bone in model['bones']:
        for c in bone['cubes']:
            if not c.get('shade',True):
                for f in c['faces'].values():f['material_instance']='unshaded'
    if not mapping:model['conversion_notes']=notes
    return model,chain,mapping

class Output:
    def __init__(self):
        b.NS=NS;self.reg=read(ROOT/'asset-conversion.json');self.canonical=read(ROOT/'tools/render-data.json')
        if any(r.get('batch')=='A17'for r in self.reg['models']):raise ValueError('Run clean A16 base build before adding A17')
        self.terrain=read(RP/'textures/terrain_texture.json')['texture_data'];self.new=[];self.source_map={}
        self.labels={loc:dict(l.split('=',1)for l in (RP/f'texts/{loc}.lang').read_text().splitlines()if '='in l and not l.startswith('#'))for loc in ['en_US','zh_CN','zh_TW']}
        for r in self.reg['models']:
            self.source_map.setdefault(logical_source(r.get('source','')),r['id'])
    def add(self,model,category,title,extra=None,entity=False,shape_name=None):
        extra=extra or {};name=model['name'];ident=f'{NS}:{name}'
        if name in {x['id']for x in self.reg['models']}:raise ValueError('Duplicate output '+name)
        geo=geometry_for(model,name);gd=geo['minecraft:geometry'][0]['description'];gd.update(visible_bounds_width=8,visible_bounds_height=6,visible_bounds_offset=[0,1.5,0])
        gp=RP/f'models/entity/{name}.geo.json';dump(gp,geo)
        texfile=model['texture_file'];texref=Path(texfile).relative_to('RP').with_suffix('').as_posix();key=NS+'_'+name
        self.terrain[key]={'textures':texref}
        method='blend'if model.get('java_render_type')in ('translucent','minecraft:translucent')else'alpha_test_single_sided'
        flat=[c for bone in model['bones']for c in bone.get('cubes',[])]
        mat={'texture':key,'render_method':method,'ambient_occlusion':False,'face_dimming':True};mats={'*':mat}
        if any(not c.get('shade',True)for c in flat):mats['unshaded']={**mat,'face_dimming':False}
        if entity:
            bp=read(BP/'entities/barrel_closed.json');bp['minecraft:entity']['description']['identifier']=ident
            dump(BP/f'entities/{name}.json',bp)
            dump(RP/f'entity/{name}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{
              'identifier':ident,'materials':{'default':'entity_alphablend'if method=='blend'else'entity_alphatest'},
              'textures':{'default':texref},'geometry':{'default':gd['identifier']},'render_controllers':['controller.render.kt_assets_a1.static']}}})
        else:
            dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':ident,'menu_category':{'category':'construction'}},'components':{
              'minecraft:geometry':{'identifier':gd['identifier']},'minecraft:material_instances':mats,
              'minecraft:item_visual':{'geometry':{'identifier':gd['identifier']},'material_instances':copy.deepcopy(mats)},
              'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
        bb=b.to_bbmodel(model)
        for e,c in zip(bb['elements'],flat):e['shade']=c.get('shade',True)
        bb['tavern_provenance']={'origin':'uploaded_jar','jar_sha256':JAR_SHA,'source':model['source'],
           'parent_chain':model.get('parent_chain',[]),'derived_atlas':model.get('source_atlas'),'source_transform':model.get('source_transform'),
           'note':'Resource conversion; no engine acceptance','engine_test':'NOT_RUN'}
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        for loc in self.labels:
            self.labels[loc][('entity.'if entity else'tile.')+ident+'.name']=(name.replace('_',' ').title()if loc=='en_US'else title)+' [A17]'
        row={'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),'texture':model['texture'],'texture_file':texfile,'texture_size':model['texture_size'],
          'issues':[],'conversion_notes':model.get('conversion_notes',[]),'editor_model':f'editor/{name}.bbmodel','geometry':gp.relative_to(ROOT).as_posix(),
          'status':'CONVERTED_CANDIDATE','engine_visual_test':'NOT_RUN','batch':'A17','category':category,'title_zh':title,'title_en':name.replace('_',' ').title(),
          'fixture_kind':'entity'if entity else'block','fixture_id':ident,'block_id':ident,'source_origin':'uploaded_jar','source_jar_sha256':JAR_SHA,
          'parent_chain':model.get('parent_chain',[]),'java_display_recorded_not_applied':model.get('java_display',{}),'render_method':method,**extra}
        # Preserve source sheet/frame distinction in the offline inspector as well.
        refs=model.get('source_textures',[])
        if len(refs)==1:
            spec=frame_spec(texpath(refs[0]))
            if spec['slots']>1:
                row['animation']={'frame_size':spec['frame_size'],'sequence':spec['sequence'],
                    'ticks_per_frame':spec['durations'][0],'durations':spec['durations'],
                    'blend_frames':spec['interpolate'],'engine_accepted':False}
        self.new.append(row);self.reg['models'].append(row);self.canonical.append(model);self.source_map.setdefault(logical_source(model['source']),name)
        return row
    def save(self):
        for loc,vals in self.labels.items():(RP/f'texts/{loc}.lang').write_text('## Visual inspection labels.\n'+'\n'.join(k+'='+v for k,v in vals.items())+'\n',encoding='utf-8')
        dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a17','texture_name':'atlas.terrain','texture_data':self.terrain})
        self.reg['batch']='A17 cumulative';dump(ROOT/'asset-conversion.json',self.reg);dump(ROOT/'tools/render-data.json',self.canonical)
        dump(ROOT/'interfaces/a17-families.json',self.families())
    def families(self):
        groups={}
        for r in self.new:groups.setdefault(r['category'],[]).append(r)
        out=[]
        for cat,rs in groups.items():
            if cat=='string_lights':continue
            field, key = ('size','size') if cat=='chalkboard' else ('item','original_item_id') if cat=='item_display' else ('variant','variant')
            values=[r.get(key,r['id']) for r in rs]
            out.append({'family':cat,'fields':{field:{'type':'string','enum':values}},'variants':[{'when':{field:v},'asset':r['id']} for v,r in zip(values,rs)]})
        return out
