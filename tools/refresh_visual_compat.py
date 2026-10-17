#!/usr/bin/env python3
"""Audit effective Tavern material references; --write updates canonical runtime.

No albedo darkening, brightness-derived emission, vanilla texture replacement,
player/HUD override, normal/height fabrication, or build-time overlay patches.
PBR profiles are conservative compatibility baselines, not full hand-authored
physically measured materials. Real-client visual acceptance is still required.
"""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'runtime/RP'
MASKS = ROOT / 'data/pbr-emission-masks.json'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def texture_references():
    refs = defaultdict(set)
    def walk(value, source):
        if isinstance(value, dict):
            for v in value.values(): walk(v, source)
        elif isinstance(value, list):
            for v in value: walk(v, source)
        elif isinstance(value, str) and value.startswith('textures/') and ' ' not in value:
            refs[value].add(source)
    paths = [RP/'textures'/x for x in ('terrain_texture.json', 'item_texture.json', 'flipbook_textures.json')]
    for folder in ('entity', 'attachables'):
        paths += sorted((RP/folder).rglob('*.json'))
    for p in paths: walk(read(p), str(p.relative_to(RP)))
    for p in RP.rglob('*.texture_set.json'):
        name=str(p.relative_to(RP)).removesuffix('.texture_set.json')
        if name not in refs: refs[name].add(str(p.relative_to(RP)))
    return refs


def resolve(name):
    path = RP/name
    if path.suffix in ('.png', '.tga', '.jpg', '.jpeg'):
        return path if path.is_file() else None
    # Native extension precedence; don't silently inspect a shadowed PNG.
    return next((path.with_suffix(ext) for ext in ('.tga', '.png', '.jpg', '.jpeg') if path.with_suffix(ext).is_file()), None)


def profile(name):
    if '/sofa/' in name or '/bar_stool/' in name or 'bar_stool_' in name:
        return 'fabric_or_mixed_seating', 230
    if any(x in name for x in ('barrel', 'pressing_tub', 'bar_counter', 'bar_cabinet', 'sandwich_board', 'wooden')):
        return 'wood_or_mixed_furniture', 220
    if any(x in name for x in ('grape', 'crop', 'leaves', 'fruit')):
        return 'plant_or_ingredient', 215
    if '/signature/' in name or any(x in name for x in ('cocktail', 'juice', 'wine', 'whiskey', 'champagne', 'vodka', 'rum', 'brandy')):
        return 'liquid_or_bottle_atlas', 170
    if 'empty_glassware' in name:
        return 'non_emissive_glass', 150
    return 'mixed_surface_non_metal', 200


def emission_signature(image):
    return (image.size, hashlib.sha256(image.tobytes()).hexdigest())


def emission_masks():
    exact = {}; by_image = {}
    for row in read(MASKS)['masks']:
        exact[row['texture']] = row
        key = (Path(row['texture']).name, tuple(row['size']), row['rgba_sha256'])
        if key in by_image:
            assert (by_image[key]['runs'], by_image[key]['emissive']) == (row['runs'], row['emissive'])
        by_image[key] = row
    return exact, by_image


def audit(write=False):
    exact, by_image = emission_masks()
    report = {'schema':1, 'visual_acceptance':'pending_real_client', 'materials':[], 'excluded':[], 'external':[], 'errors':[]}
    handled = set()
    for name, origins in sorted(texture_references().items()):
        if name.startswith(('textures/board_font/', 'textures/ui/', 'textures/particle/', 'textures/misc/')):
            report['excluded'].append({'texture':name, 'reason':'glyph/UI/particle/glint: not a PBR surface'})
            continue
        path = resolve(name)
        if path is None:
            report['external'].append({'texture':name, 'references':sorted(origins)})
            continue
        stem = path.with_suffix('')
        rel = str(stem.relative_to(RP))
        if rel in handled: continue
        handled.add(rel)
        if path.suffix == '.tga' and stem.name == 'icon_dyed':
            report['excluded'].append({'texture':name, 'reason':'native inventory dye-mask alpha semantics; intentionally no texture_set'})
            continue
        image = Image.open(path).convert('RGBA')
        category, roughness = profile(rel)
        # Propagate verified masks to duplicate block/held atlases only. A drink
        # named "sunset_glow" does not become emissive just because of its name.
        fixture = ('/block/deco/string_lights/' in rel or stem.name in ('bell_pendant_lamp','blue_pendant_lamp','yellow_pendant_lamp','glassware_holder','circular_rack','molotov','glow_berries_juice_still','glow_berries_juice_flow'))
        row = exact.get(rel)
        if row is None and fixture: row = by_image.get((stem.name, *emission_signature(image)))
        expected = {'format_version':'1.16.100','minecraft:texture_set':{'color':stem.name}}
        channel = expected['minecraft:texture_set']
        emissive = 0
        if row:
            assert emission_signature(image) == (tuple(row['size']),row['rgba_sha256']), (rel,'source art changed; review emission mask')
            emissive = row['emissive']
            pixels = [(0,0,roughness)]*(image.width*image.height)
            for start,length in row['runs']:
                for i in range(start,start+length):
                    assert image.getpixel((i%image.width,i//image.width))[3]>0, (rel,'emission outside visible art')
                    pixels[i]=(0,emissive,roughness)
            mer=Image.new('RGB',image.size);mer.putdata(pixels)
            mer_path=stem.with_name(stem.name+'_mer').with_suffix('.png')
            channel['metalness_emissive_roughness']=mer_path.stem
            if write:mer.save(mer_path)
            elif not mer_path.exists() or Image.open(mer_path).convert('RGB').tobytes()!=mer.tobytes():report['errors'].append(f'MER mismatch: {rel}')
        else:
            channel['metalness_emissive_roughness']=[0,0,roughness]
        target=stem.with_suffix('.texture_set.json')
        if write:target.write_text(json.dumps(expected,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        elif not target.exists() or read(target)!=expected:report['errors'].append(f'Texture set mismatch/missing: {rel}')
        report['materials'].append({'texture':rel,'size':list(image.size),'profile':category,'metalness':0,'emissive_max':emissive,'roughness':roughness,'references':sorted(origins)})
    # Obsolete erroneous map is neutralized too, even though the new set uses a
    # uniform value. It must not retain a glowing glass mask for future tools.
    obsolete=RP/'textures/kaleidoscope_tavern/block/mixology/empty_glassware_mer.png'
    if obsolete.exists():
        old=Image.open(obsolete);neutral=Image.new('RGB',old.size,(0,0,150))
        if write:neutral.save(obsolete)
        elif old.convert('RGB').tobytes()!=neutral.tobytes():report['errors'].append('stale emissive empty_glassware_mer')
    report['summary']={'surfaces':len(report['materials']),'emissive_surfaces':sum(x['emissive_max']>0 for x in report['materials']),'excluded':len(report['excluded']),'external_references':len(report['external']),'errors':len(report['errors'])}
    return report


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write',action='store_true',help='Explicitly regenerate checked-in runtime material assets')
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    result=audit(args.write)
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result['summary']))
    if result['errors']:raise SystemExit('\n'.join(result['errors'][:20]))

if __name__=='__main__':main()
