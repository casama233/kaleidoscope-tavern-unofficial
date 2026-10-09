"""Source and routing regressions; not native UI/client acceptance."""
import copy
import hashlib
import json
import unittest
from pathlib import Path
from PIL import Image
from build_tavern_forms import ROOT,NAMES,check_or_write

def read(path):return json.loads((ROOT/path).read_text())

class TavernForms(unittest.TestCase):
    def setUp(self):
        self.ui=read('runtime/RP/ui/server_form.json')
        self.source=read('tools/fixtures/mojang-server-form-reference.json')
        self.vanilla=self.source['files']['server_form.json']['nodes']

    def test_generator_reproduces_canonical_files_without_writing(self):
        check_or_write()

    def test_no_form_factory_input_focus_or_submit_overrides(self):
        self.assertEqual(self.source['commit'],'46ba6ea985fb5a92d79a9419198f10dda14c199d')
        expected={'namespace','dynamic_button/panel_name/image','dynamic_button/panel_name'}|{'kt_guide_'+n+'_animation' for n in NAMES}
        self.assertEqual(set(self.ui),expected)
        self.assertNotIn('custom_form',json.dumps(self.ui))
        self.assertNotIn('button_mappings',json.dumps(self.ui))

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
