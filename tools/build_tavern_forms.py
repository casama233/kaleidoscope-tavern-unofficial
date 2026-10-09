#!/usr/bin/env python3
"""Source-derived guide flipbooks, scoped to four Tavern native image routes.

The pinned Mojang UI nodes are in fixtures/mojang-server-form-reference.json.
Java 1.20.1 SpriteContents$InterpolationData (fup$c.class, SHA256
3da1a2bee3575a30551e8552f2f08dcf3ad755c31bc77a1dd299d2181a3a82ed)
mixes RGB using double arithmetic/truncation and retains the current alpha.
This verifies source pixels and scoped wiring, not rendered native UI.
Each form starts its UI clock; it does not synchronize Java's global atlas phase.
"""
import argparse
import copy
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
NAMES=('depth_charge','mystery_cocktail','nether_special','ice_grape')

def binding(expression):
    return {'binding_type':'view','source_property_name':expression,'target_property_name':'#visible'}

def generated(root=ROOT):
    reference=json.loads((root/'tools/fixtures/mojang-server-form-reference.json').read_text())
    vanilla=reference['files']['server_form.json']['nodes']
    ui={'namespace':'server_form'}
    # Match only the four existing Tavern icon routes. Keep their static PNGs
    # and shared addon payload untouched for other hosts/resource-pack stacks.
    image=vanilla['dynamic_button']['controls'][0]['panel_name']['controls'][0]['image']
    paths=[f'textures/ui/tavern_entries/{n}' for n in NAMES]
    image_bindings=copy.deepcopy(image['bindings'])
    original=image_bindings[-1]['source_property_name']
    owned='((#texture_file_system = \'InUserPackage\') and ('+' or '.join(f"(#texture = '{p}')" for p in paths)+'))'
    image_bindings[-1]['source_property_name']='('+original+' and (not '+owned+'))'
    ui['dynamic_button/panel_name/image']={'bindings':image_bindings}
    controls=[];result={}
    source=json.loads((root/'art/interfaces/animated-item-java-reference.json').read_text())['sources']
    for name,path in zip(NAMES,paths):
        spec=source[name]
        sheet=Image.open(root/spec['texture']).convert('RGBA')
        assert hashlib.sha256(sheet.tobytes()).hexdigest()==spec['rgba_sha256']
        meta=spec['java_animation_metadata']['animation'];duration=meta.get('frametime',1)
        sequence=meta.get('frames',list(range(sheet.height//16)));frames=[]
        for i,row in enumerate(sequence):
            index=row['index'] if isinstance(row,dict) else row
            ticks=row.get('time',duration) if isinstance(row,dict) else duration
            after=sequence[(i+1)%len(sequence)];after=after['index'] if isinstance(after,dict) else after
            a=sheet.crop((0,index*16,16,(index+1)*16));b=sheet.crop((0,after*16,16,(after+1)*16))
            for tick in range(ticks):
                frame=a.copy()
                if tick and meta.get('interpolate',False):
                    weight=1.0-tick/ticks
                    frame.putdata([tuple(int(weight*a.getpixel((x,y))[c]+(1.0-weight)*b.getpixel((x,y))[c]) for c in range(3))+(a.getpixel((x,y))[3],)
                                   for y in range(16) for x in range(16)])
                frames.append(frame)
        strip=Image.new('RGBA',(16*len(frames),16))
        for i,frame in enumerate(frames):strip.paste(frame,(16*i,0))
        png=io.BytesIO();strip.save(png,format='PNG',optimize=True)
        texture=f'textures/ui/kt_guide_animated/{name}'
        result[root/f'runtime/RP/{texture}.png']=png.getvalue()
        ui['kt_guide_'+name+'_animation']={'anim_type':'flip_book','initial_uv':[0,0],
            'frame_count':len(frames),'frame_step':16,'fps':20}
        controls.append({'kt_guide_'+name:{'type':'image','size':[32,32],'layer':2,
            'texture':texture,'uv_size':[16,16],'uv':'@server_form.kt_guide_'+name+'_animation','bilinear':False,
            'bindings':[{'binding_name':'#form_button_texture','binding_name_override':'#kt_guide_texture',
                         'binding_type':'collection','binding_collection_name':'form_buttons'},
                        {'binding_name':'#form_button_texture_file_system','binding_name_override':'#kt_guide_file_system',
                         'binding_type':'collection','binding_collection_name':'form_buttons'},
                        binding(f"((#kt_guide_file_system = 'InUserPackage') and (#kt_guide_texture = '{path}'))")]}})
    ui['dynamic_button/panel_name']={'modifications':[{'array_name':'controls','operation':'insert_back','value':controls}]}
    result[root/'runtime/RP/ui/server_form.json']=(json.dumps(ui,ensure_ascii=False,indent=2)+'\n').encode()
    return result

def check_or_write(write=False):
    errors=[]
    for path,data in generated().items():
        if not path.exists() or path.read_bytes()!=data:
            if write:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            else:errors.append(str(path.relative_to(ROOT)))
    if errors:raise AssertionError('Tavern native form drift: '+', '.join(errors))
    print('4 scoped Tavern Java-tick guide flipbooks; client acceptance pending.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true')
    check_or_write(parser.parse_args().write)
