"""Source and routing regressions; not native UI/client acceptance."""
import copy
import hashlib
import json
import unittest
from pathlib import Path
from PIL import Image
from build_tavern_forms import ROOT,NAMES,BOARD_TITLE_PREFIX,BOARD_INPUT_LIMITS,check_or_write
from native_input_bindings import resolve_control
from check_effect_ui_contract import typed_controls

def read(path):return json.loads((ROOT/path).read_text())

class TavernForms(unittest.TestCase):
    def setUp(self):
        self.ui=read('runtime/RP/ui/server_form.json')
        self.source=read('tools/fixtures/mojang-server-form-reference.json')
        self.vanilla=self.source['files']['server_form.json']['nodes']

    def test_generator_reproduces_canonical_files_without_writing(self):
        check_or_write()

    def test_no_form_factory_dropdown_or_submit_overrides(self):
        self.assertEqual(self.source['commit'],'46ba6ea985fb5a92d79a9419198f10dda14c199d')
        expected={'namespace','dynamic_button/panel_name/image','dynamic_button/panel_name',
                  'custom_input@settings_common.option_text_edit','kt_board_input_branches'}|{'kt_guide_'+n+'_animation' for n in NAMES}|{'kt_board_input_'+kind+'@settings_common.option_text_edit_control' for kind in ('foreign',*BOARD_INPUT_LIMITS)}
        self.assertEqual(set(self.ui),expected)
        self.assertFalse({'generated_contents','custom_form','custom_dropdown','custom_form_scrolling_content'}.intersection(self.ui))
        self.assertNotIn('button_mappings',json.dumps(self.ui))

    def test_board_capacity_is_exact_scoped_and_inherits_native_single_line_controller(self):
        key='custom_input@settings_common.option_text_edit'
        expected=copy.deepcopy(self.vanilla[key]);expected['$control_name']='server_form.kt_board_input_branches'
        self.assertEqual(self.ui[key],expected)
        self.assertEqual(expected['$max_text_edit_length'],100)
        self.assertEqual(expected['$text_box_name'],'custom_input')
        runtime=(ROOT/'runtime/BP/scripts/bedrock/writing-boards.js').read_text()
        self.assertIn("const BOARD_FORM_TITLE_PREFIX='"+BOARD_TITLE_PREFIX+"';",runtime)
        self.assertIn('title({rawtext:[{text:BOARD_FORM_TITLE_PREFIX},boardText(kind)]})',runtime)
        self.assertEqual(BOARD_INPUT_LIMITS,{'sandwich':2*320,'small':2*350,'large':2*1500})
        controls=self.ui['kt_board_input_branches']['controls']
        self.assertEqual(len(controls),4)
        nodes={kind:self.ui['kt_board_input_'+kind+'@settings_common.option_text_edit_control'] for kind in ('foreign',*BOARD_INPUT_LIMITS)}
        native=resolve_control(self.source,'settings_common.option_text_edit_control')
        original=native['bindings']
        self.assertEqual(native['type'],'edit_box');self.assertEqual(len(original),6)
        for kind,node in nodes.items():
            self.assertEqual(set(node),{'visible','enabled','focus_enabled','property_bag','$text_edit_box_binding_condition','bindings'}|({'max_length'} if kind!='foreign' else set()))
            self.assertEqual(node['$text_edit_box_binding_condition'],'visible')
            if kind!='foreign':self.assertEqual(node['max_length'],BOARD_INPUT_LIMITS[kind])
            resolved=resolve_control(self.source,'settings_common.option_text_edit_control',node)
            typed_controls(resolved)
            self.assertEqual(resolved['type'],'edit_box')
            # Only root bindings are overridden; the full native child content,
            # placeholder, button mappings and variable/default rules survive.
            for key in ('controls','button_mappings','text_box_name','text_edit_box_grid_collection_name','variables'):
                self.assertEqual(resolved[key],native[key],key)
            bindings=resolved['bindings'];self.assertEqual(bindings[:6],original)
            self.assertEqual(node['property_bag'],{'#kt_board_native_enabled':'$enabled','#kt_board_native_focus':True,'#kt_board_native_visible':True})
            for alias,target in zip(bindings[6:9],['#enabled','#focus_enabled','#visible']):
                source=next(row for row in original if row.get('binding_name_override')==target)
                self.assertEqual({k:v for k,v in alias.items() if k!='binding_name_override'},
                                 {k:v for k,v in source.items() if k!='binding_name_override'})
            self.assertEqual(bindings[9:11],[{'binding_name':'#title_text','binding_name_override':'#kt_board_title'},
                {'binding_type':'collection','binding_collection_name':'custom_form','binding_name':'#custom_text','binding_name_override':'#kt_board_field'}])
            self.assertEqual([b['target_property_name'] for b in bindings[-3:]],['#visible','#enabled','#focus_enabled'])
            self.assertEqual([node[key] for key in ('visible','enabled','focus_enabled')],[False,native['enabled'],native['focus_enabled']])
            for row in bindings[-3:]:self.assertNotIn(row['target_property_name'],row['source_property_name'])
            if kind=='foreign':self.assertEqual(resolved['max_length'],'$max_text_edit_length')
        def gate(kind,target,title,label,enabled=True,native_enabled=True,native_focus=True,native_visible=True):
            expression=next(row['source_property_name'] for row in nodes[kind]['bindings'][-3:] if row['target_property_name']==target)
            values={'#kt_board_title':title,'#kt_board_field':label,'$enabled':enabled,
                    '#kt_board_native_enabled':native_enabled,'#kt_board_native_focus':native_focus,'#kt_board_native_visible':native_visible}
            for key,value in values.items():expression=expression.replace(key,repr(value))
            return eval(expression.replace(' = ',' == '),{'__builtins__':{}},{})
        for locale in ('en_US','zh_CN','zh_TW'):
            lang=dict(line.split('=',1) for line in (ROOT/f'runtime/RP/texts/{locale}.lang').read_text().splitlines() if '=' in line and not line.startswith('#'))
            for kind in BOARD_INPUT_LIMITS:
                title=BOARD_TITLE_PREFIX+lang['kt.board.'+('sandwich' if kind=='sandwich' else 'chalk')]
                label=lang['kt.board.'+('text_small' if kind=='small' else 'text_lines')].replace('%s','8' if kind=='sandwich' else '11')
                for candidate in nodes:self.assertEqual(gate(candidate,'#visible',title,label),candidate==kind)
                for candidate in nodes:
                    for enabled,native_enabled in [(False,True),(True,False),(True,True)]:
                        self.assertEqual(gate(candidate,'#enabled',title,label,enabled,native_enabled),enabled and native_enabled and candidate==kind)
                        self.assertEqual(gate(candidate,'#focus_enabled',title,label,enabled,native_enabled),enabled and native_enabled and candidate==kind)
                    self.assertFalse(gate(candidate,'#focus_enabled',title,label,native_focus=False))
                    self.assertFalse(gate(candidate,'#visible',title,label,native_visible=False))
                    self.assertFalse(gate(candidate,'#enabled',title,label,native_visible=False))
                    self.assertFalse(gate(candidate,'#focus_enabled',title,label,native_visible=False))
                for foreign_title,foreign_label in [(title[len(BOARD_TITLE_PREFIX):],label),(title+' ',label),(title,label+' '),(title,'Foreign input'),('Cookery guide',label)]:
                    for candidate in nodes:self.assertEqual(gate(candidate,'#visible',foreign_title,foreign_label),candidate=='foreign')

        # Do not replace native source variables with a guessed collection read.
        # If native disables the binding, its original $enabled fallback remains;
        # if it binds an enabled source, the private alias preserves that source.
        enabled_source=next(row for row in original if row.get('binding_name_override')=='#enabled')
        self.assertEqual(enabled_source['binding_type'],'$text_edit_box_enabled_binding_type')
        self.assertEqual(enabled_source['binding_name'],'$text_box_enabled_binding_name')
        variable=native['variables'][0]
        self.assertEqual(variable,{'requires':'(not $option_enabled_binding_name or not $enabled)',
                                  '$text_box_enabled_binding_name':'#not_data_bound','$text_edit_box_enabled_binding_type':'none'})
        for option_name,enabled,source_value in [('',True,False),('#custom_input_enabled',True,False),('#custom_input_enabled',True,True),('#custom_input_enabled',False,True)]:
            context={'$option_enabled_binding_name':option_name,'$enabled':enabled}
            expression=variable['requires']
            for key,value in context.items():expression=expression.replace(key,repr(value))
            inactive=eval(expression,{'__builtins__':{}},{})
            alias_default=nodes['sandwich']['property_bag']['#kt_board_native_enabled']
            self.assertEqual(alias_default,'$enabled')
            alias_value=enabled if inactive else source_value
            # Source `none` uses its fallback, never the unrelated custom field.
            self.assertEqual(alias_value,True if not option_name and enabled else enabled and source_value)

    def test_reported_unapplied_modifications_are_rejected_after_native_inheritance(self):
        old={'visible':'#visible','enabled':'#enabled','focus_enabled':'#focus_enabled',
             '$text_edit_box_binding_condition':'visible','modifications':[{'array_name':'bindings','operation':'insert_back',
              'value':[{'binding_type':'view','source_property_name':'False','target_property_name':'#visible'}]}]}
        resolved=resolve_control(self.source,'settings_common.option_text_edit_control',old)
        self.assertEqual(resolved['type'],'edit_box')
        # The actual old shape leaves the native bindings unchanged; the gate
        # remains an unapplied property. It must fail the existing typed check.
        self.assertNotIn(old['modifications'][0]['value'][0],resolved['bindings'])
        with self.assertRaisesRegex(ValueError,'Unapplied modifications'):typed_controls(resolved)

    def test_native_image_bindings_preserved_except_exact_local_owned_routes(self):
        original=self.vanilla['dynamic_button']['controls'][0]['panel_name']['controls'][0]['image']['bindings']
        current=self.ui['dynamic_button/panel_name/image']['bindings']
        self.assertEqual(current[:-1],original[:-1])
        self.assertEqual({k:v for k,v in current[-1].items() if k!='source_property_name'},
                         {k:v for k,v in original[-1].items() if k!='source_property_name'})
        self.assertIn(original[-1]['source_property_name'],current[-1]['source_property_name'])
        paths={f'textures/ui/tavern_entries/{n}' for n in NAMES}
        # Evaluate the generated simple expression rather than a second routing
        # implementation. Foreign URL/raw files with the same path stay native.
        def visible(expression,path,fs):
            expression=expression.replace('#texture_file_system',repr(fs)).replace('#texture',repr(path)).replace(' = ',' == ')
            return eval(expression,{'__builtins__':{}},{})
        for fs in ['InUserPackage','RawPath','InAppPackage','InServerPackage','StoreCache','',None]:
            for path in sorted(paths|{'textures/ui/foreign','loading','',next(iter(paths))+'_other','https://example.invalid/icon.png'}):
                before=visible(original[-1]['source_property_name'],path,fs)
                after=visible(current[-1]['source_property_name'],path,fs)
                self.assertEqual(after,before and not(fs=='InUserPackage' and path in paths),(path,fs))
        rows=self.ui['dynamic_button/panel_name']['modifications']
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['array_name'],'controls');self.assertEqual(rows[0]['operation'],'insert_back')
        self.assertEqual(len(rows[0]['value']),4)
        for name,row in zip(NAMES,rows[0]['value']):
            image=row['kt_guide_'+name]
            self.assertEqual(image['type'],'image');self.assertEqual(image['bilinear'],False)
            self.assertEqual(image['uv_size'],[16,16]);self.assertEqual(image['uv'],'@server_form.kt_guide_'+name+'_animation')
            self.assertEqual(image['bindings'][0],{'binding_name':'#form_button_texture','binding_name_override':'#kt_guide_texture','binding_type':'collection','binding_collection_name':'form_buttons'})
            expression=image['bindings'][-1]['source_property_name'].replace('#kt_guide_file_system','#texture_file_system').replace('#kt_guide_texture','#texture')
            for fs in ['InUserPackage','RawPath','InServerPackage','',None]:
                for path in paths|{'textures/ui/foreign'}:
                    self.assertEqual(visible(expression,path,fs),fs=='InUserPackage' and path==f'textures/ui/tavern_entries/{name}')

    def test_java_ticks_pixels_alpha_timing_and_native_uv_binding(self):
        oracle=read('tools/fixtures/guide-animation-java-reference.json')
        reference=read('art/interfaces/animated-item-java-reference.json')['sources']
        native=self.source['files']['progress_screen.json']['nodes']
        for name in NAMES:
            sheet=Image.open(ROOT/reference[name]['texture']).convert('RGBA')
            strip=Image.open(ROOT/f'runtime/RP/textures/ui/kt_guide_animated/{name}.png').convert('RGBA')
            metadata=reference[name]['java_animation_metadata']['animation'];count=sheet.height//16;duration=metadata['frametime']
            self.assertEqual(strip.size,(count*duration*16,16))
            frames=[strip.crop((x,0,x+16,16)) for x in range(0,strip.width,16)]
            if metadata.get('interpolate'):
                expected=oracle['sources'][name]
                self.assertEqual(hashlib.sha256(sheet.tobytes()).hexdigest(),expected['sourceRgbaSha256'])
                self.assertEqual(hashlib.sha256(b''.join(frame.tobytes() for frame in frames)).hexdigest(),expected['tickRgbaSha256'])
                self.assertEqual(len(frames),expected['ticks'])
            for i,frame in enumerate(frames):
                source=sheet.crop((0,(i//duration)*16,16,(i//duration+1)*16))
                self.assertEqual(frame.getchannel('A').tobytes(),source.getchannel('A').tobytes())
                if not metadata.get('interpolate') or i%duration==0:self.assertEqual(frame.tobytes(),source.tobytes())
            animation=self.ui['kt_guide_'+name+'_animation']
            self.assertEqual(set(animation),set(native['spinner_animation']))
            self.assertEqual(animation,{'anim_type':'flip_book','initial_uv':[0,0],'frame_count':len(frames),'frame_step':16,'fps':20})

if __name__=='__main__':unittest.main()
