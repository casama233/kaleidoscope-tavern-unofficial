"""Mutation regressions against independent importer-oriented face vertices."""
import copy
import json
import unittest
from PIL import Image
from animated_item_render_contract import sprite_geometry, ROOT, NAMES, planned
from check_animated_item_depth import audit, check, valid

class SpriteShells(unittest.TestCase):
    def test_all_source_frames_and_all_emitted_faces(self):
        results=check()
        self.assertEqual(1918,sum(r['expected_boundary_edges'] for r in results.values()))
        self.assertEqual(24,sum(r['frames'] for r in results.values()))
        for name,result in results.items():self.assertTrue(valid(result),(name,result))

    def model(self,name='mystery_cocktail'):
        rp=ROOT/'runtime/RP'
        cubes=json.loads((rp/f'models/entity/item_sprite_{name}.geo.json').read_text())['minecraft:geometry'][0]['bones'][0]['cubes']
        with Image.open(rp/f'textures/kaleidoscope_tavern_jar/item/{name}.png') as im:sheet=im.convert('RGBA')
        return cubes,sheet

    def test_reject_t160_reflected_sides_and_up_reversal(self):
        failures=0
        for name in NAMES:
            cubes,sheet=self.model(name)
            for c in cubes[1:]:
                c['origin'][0]=-c['origin'][0]-c['size'][0]
                if 'up' in c['uv']:
                    f=c['uv']['up'];f['uv'][0]+=f['uv_size'][0];f['uv_size'][0]*=-1
            result=audit(cubes,sheet)
            self.assertFalse(valid(result))
            failures+=result['missing_or_wrong_texel_boundary_edges']
        self.assertEqual(1709,failures)

    def test_reject_pre160_inward_vertical_faces(self):
        cubes,sheet=self.model()
        for c in cubes[1:]:
            c['uv']={({'east':'west','west':'east'}.get(f,f)):v for f,v in c['uv'].items()}
        result=audit(cubes,sheet)
        self.assertFalse(valid(result))
        self.assertEqual(234,result['missing_or_wrong_texel_boundary_edges'])

    def test_asymmetric_static_reference_and_later_frame_hole(self):
        # Hand-authored asymmetric reference: no dependency on generator spans.
        frames=[]
        for pixels in [[(1,2),(2,2),(2,3),(11,9)],[(1,2),(2,3),(12,8)]]:
            im=Image.new('RGBA',(16,16))
            for x,y in pixels:im.putpixel((x,y),(x*13,y*13,127,255))
            frames.append(im)
        sheet=Image.new('RGBA',(16,32))
        for i,im in enumerate(frames):sheet.paste(im,(0,16*i))
        cubes=sprite_geometry('synthetic',frames,{})['minecraft:geometry'][0]['bones'][0]['cubes']
        self.assertTrue(valid(audit(cubes,sheet)))
        cubes.pop()
        self.assertFalse(valid(audit(cubes,sheet)))

    def test_reject_extra_unsupported_side_face(self):
        cubes,sheet=self.model()
        extra=copy.deepcopy(cubes[1]);extra['origin'][0]+=3;cubes.append(extra)
        self.assertFalse(valid(audit(cubes,sheet)))

    def test_xp_only_item_material_is_single_sided(self):
        block=json.loads((ROOT/'runtime/BP/blocks/xp_bottle.json').read_text())['minecraft:block']
        c=block['components']
        self.assertTrue(all(m['render_method']=='alpha_test_single_sided' for m in c['minecraft:item_visual']['material_instances'].values()))
        self.assertTrue(all(m['render_method']=='alpha_test' for m in c['minecraft:material_instances'].values()))
        self.assertEqual('geometry.kt_assets_a17.xp_bottle',c['minecraft:item_visual']['geometry']['identifier'])

if __name__=='__main__':unittest.main()
