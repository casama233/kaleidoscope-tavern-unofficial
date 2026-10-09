#!/usr/bin/env python3
"""Source-derived Tavern guide images and scoped native board input capacity.

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
BOARD_TITLE_PREFIX='§r§0§r'
BOARD_INPUT_LIMITS={'sandwich':640,'small':700,'large':3000}

def board_input_ui(root,vanilla):
    # Keep the native single-line edit control and its controller. The raw board
    # limits are unchanged; escaped newlines/backslashes can use two code units.
    # The exact title AND field must match, including the invisible owned prefix.
    predicates={kind:[] for kind in BOARD_INPUT_LIMITS}
    for locale in ('en_US','zh_CN','zh_TW'):
        values=dict(line.split('=',1) for line in (root/f'runtime/RP/texts/{locale}.lang').read_text().splitlines() if '=' in line and not line.startswith('#'))
        for kind in predicates:
            title=BOARD_TITLE_PREFIX+values['kt.board.'+('sandwich' if kind=='sandwich' else 'chalk')]
            label=values['kt.board.'+('text_small' if kind=='small' else 'text_lines')].replace('%s','8' if kind=='sandwich' else '11')
            quote=lambda text: "'"+text.replace("'","\\'")+"'"
            predicates[kind].append(f'((#kt_board_title = {quote(title)}) and (#kt_board_field = {quote(label)}))')
    selected={kind:'('+' or '.join(dict.fromkeys(rows))+')' for kind,rows in predicates.items()}
    owned='('+' or '.join(selected.values())+')'
    original='custom_input@settings_common.option_text_edit'
    ui={original:copy.deepcopy(vanilla[original])}
    ui[original]['$control_name']='server_form.kt_board_input_branches'
    controls=[]
    for kind in ('foreign',*BOARD_INPUT_LIMITS):
        expression=f'(not {owned})' if kind=='foreign' else selected[kind]
        bindings=[{'binding_name':'#title_text','binding_name_override':'#kt_board_title'},
                  {'binding_type':'collection','binding_collection_name':'custom_form',
                   'binding_name':'#custom_text','binding_name_override':'#kt_board_field'},
                  {'binding_type':'collection','binding_collection_name':'custom_form',
                   'binding_name':vanilla[original]['$text_box_enabled_binding_name'],
                   'binding_name_override':'#kt_board_native_enabled'}]
        for target in ('#visible','#enabled','#focus_enabled'):
            guard=expression if target=='#visible' else f'({expression} and $enabled and #kt_board_native_enabled)'
            bindings.append({'binding_type':'view','source_property_name':guard,'target_property_name':target})
        node={'visible':'#visible','enabled':'#enabled','focus_enabled':'#focus_enabled',
              '$text_edit_box_binding_condition':'visible',
              'modifications':[{'array_name':'bindings','operation':'insert_back','value':bindings}]}
        if kind!='foreign':node['max_length']=BOARD_INPUT_LIMITS[kind]
        # Every branch inherits the ORIGINAL edit widget, bindings, placeholder,
        # collection name, textbox name and button mappings. No multiline swap.
        name='kt_board_input_'+kind
        ui[name+'@settings_common.option_text_edit_control']=node
        controls.append({name+'@server_form.'+name:{}})
    ui['kt_board_input_branches']={'type':'stack_panel','orientation':'vertical',
                                    'size':['100%','100%c'],'controls':controls}
    return ui

def binding(expression):
    return {'binding_type':'view','source_property_name':expression,'target_property_name':'#visible'}

def generated(root=ROOT):
    reference=json.loads((root/'tools/fixtures/mojang-server-form-reference.json').read_text())
    vanilla=reference['files']['server_form.json']['nodes']
    ui={'namespace':'server_form',**board_input_ui(root,vanilla)}
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
    print('4 scoped Tavern guide flipbooks and 3 native board input limits; client acceptance pending.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true')
    check_or_write(parser.parse_args().write)
