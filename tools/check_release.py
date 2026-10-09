#!/usr/bin/env python3
"""Static release validation only: no player mocks or game interactions."""
import argparse,hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];RT=ROOT/'runtime'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))

# Exact T131 source additions. World Liquor's <1024 compaction budget was
# introduced in ce475bc35a305feb2408b93b6ad7c49d5e38ebe8; it is a project
# budget, not a documented engine-wide geometry-ID limit. Preserve its base
# allowance and account separately for these source-reviewed thin item meshes.
# Model complexity guidance: https://learn.microsoft.com/minecraft/creator/documents/practices/improvingperformanceandresourceusage
REVIEWED_ITEM_GEOMETRIES={
    'geometry.kt_runtime.item_sprite_'+name:'runtime/RP/models/entity/item_sprite_'+name+'.geo.json'
    for name in ('depth_charge','mystery_cocktail','nether_special','ice_grape')
}
# T134 retains fixed glyph UVs because the combined emissive/overlay/UV-anim
# material has no client witness. Separate outline meshes let distant text
# submit only its two foreground quads. The arbitrary-RGB meshes partition
# original texels; every one remains in the existing cup helper. These exact
# allocations do not enlarge the <1024 budget for unrelated/base geometry.
# Update this revision together with the two ledger witnesses only after the
# final integrated functional source has been reviewed, before freezing it.
REVIEWED_VISUAL_SOURCE='pending-canonical-T134-source'
REVIEWED_VISUAL_RELEASE='0.6.134'
REVIEWED_VISUAL_GEOMETRIES={
    **{f'geometry.kt_runtime.board_outline_cell_{cell}':'runtime/RP/models/entity/board_glyph_outline.geo.json' for cell in range(256)},
    **{f'geometry.kt_runtime.signature_rgb_{color}_{frame}':'runtime/RP/models/entity/signature_rgb_texels.geo.json'
       for color in ('5d6062','82c5d9','88c9dc','999999','a1a4a6','a8dae4','d1d8dd','d8efef','fafeff','ffffff') for frame in range(6)}
}

def geometry_inventory(roots):
    result={}
    for root in roots:
        for path in (Path(root)/'runtime/RP/models').rglob('*.json'):
            for geometry in read(path).get('minecraft:geometry',[]):
                result.setdefault(geometry['description']['identifier'],[]).append(path.resolve())
    return result

def check_combined_geometry_budget(inventory,tavern_root=ROOT):
    """Retain the base budget; only exact, uniquely owned source additions count."""
    tavern_root=Path(tavern_root).resolve()
    witnesses=read(tavern_root/'data/baseline-reconciliation.json')['files']
    sources=read(tavern_root/'art/interfaces/animated-item-java-reference.json')['sources']
    for identifier,name in REVIEWED_ITEM_GEOMETRIES.items():
        path=tavern_root/name;row=witnesses[name]
        assert row['before'] is None and row['release']=='0.6.131',('Unreviewed geometry allocation',name)
        assert row['reviewedSourceCommit']=='f08714307ea331be52a9240d8aa6473752325d1c',('Geometry allocation source changed',name)
        assert [Path(p).resolve() for p in inventory.get(identifier,[])]==[path],('Reviewed geometry must have one exact Tavern owner/path',identifier)
        assert hashlib.sha256(path.read_bytes()).hexdigest()==row['after'],('Reviewed item geometry changed',name)
        geometries=read(path)['minecraft:geometry'];assert len(geometries)==1
        geometry=geometries[0];assert geometry['description']['identifier']==identifier
        bones=geometry['bones'];assert len(bones)==1 and bones[0]['name']=='root'
        source=sources[identifier.removeprefix('geometry.kt_runtime.item_sprite_')]
        assert len(bones[0]['cubes'])==source['java_element_count']<=50,('Unreviewed item mesh complexity',name)
    allocations={}
    for name in sorted(set(REVIEWED_VISUAL_GEOMETRIES.values())):
        path=tavern_root/name;row=witnesses.get(name)
        assert row and row['before'] is None and row['release']==REVIEWED_VISUAL_RELEASE,('Unreviewed visual geometry allocation',name)
        assert row['reviewedSourceCommit']==REVIEWED_VISUAL_SOURCE,('Visual geometry allocation source changed',name)
        assert hashlib.sha256(path.read_bytes()).hexdigest()==row['after'],('Reviewed visual geometry changed',name)
        models=read(path)['minecraft:geometry'];expected={k for k,v in REVIEWED_VISUAL_GEOMETRIES.items() if v==name}
        assert len(models)==len(expected) and {g['description']['identifier'] for g in models}==expected,('Visual allocation IDs changed',name)
        outline=name.endswith('board_glyph_outline.geo.json')
        maximum=0
        for geometry in models:
            identifier=geometry['description']['identifier']
            assert [Path(p).resolve() for p in inventory.get(identifier,[])]==[path],('Reviewed visual geometry must have one exact Tavern owner/path',identifier)
            bones=geometry['bones'];cubes=[c for b in bones for c in b.get('cubes',[])]
            assert len(bones)==(19 if outline else 1),('Visual allocation bone budget exceeded',identifier)
            assert (len(cubes)==16 if outline else len(cubes)<=28),('Visual allocation cube budget exceeded',identifier)
            assert all(isinstance(c['uv'],dict) and len(c['uv'])==1 and sum(n==0 for n in c['size'])==1 for c in cubes),('Visual allocation must retain single-face rectangles',identifier)
            # Native cube allocation reserves all six quad faces even when
            # only one UV face is emitted. Never count merely four vertices.
            maximum=max(maximum,len(cubes)*24)
        allocations[name]={'ids':len(models),'max_allocated_vertices':maximum,'max_bones':19 if outline else 1}
    base=set(inventory)-set(REVIEWED_ITEM_GEOMETRIES)-set(REVIEWED_VISUAL_GEOMETRIES)
    assert len(base)<1024,('combined Tavern + World Liquor base geometry budget exceeded',len(base))
    return {'geometries':len(inventory),'base_geometries':len(base),'reviewed_item_geometries':len(REVIEWED_ITEM_GEOMETRIES),
            'reviewed_visual_geometries':len(REVIEWED_VISUAL_GEOMETRIES),'visual_allocations':allocations,'base_limit_exclusive':1024,'client_verified':False}

def parse_args(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--java-source',type=Path,help='Pinned Java checkout for storage and launch source checks')
    parser.add_argument('--baseline',type=Path,help='Pinned integration baseline for launch preservation checks')
    parser.add_argument('--geometry-budget-peer',type=Path,help='Check only the paired geometry allocation; does not run release validation')
    return parser.parse_args(argv)


def source_check_commands(args,version):
    commands={
        'storage':[sys.executable,str(ROOT/'tools/check_storage_rendering.py')],
        'launch':[sys.executable,str(ROOT/'tools/check_launch.py')],
    }
    if args.java_source is not None:
        for command in commands.values():
            command.extend(['--java-source',str(args.java_source.resolve())])
        commands['storage'].extend(['--report',str(ROOT/f'docs/STORAGE-VALIDATION-{version}.json')])
    if args.baseline is not None:
        commands['launch'].extend(['--baseline',str(args.baseline.resolve())])
    return commands


def main(argv=None):
    args=parse_args(argv)
    if args.geometry_budget_peer is not None:
        print(json.dumps(check_combined_geometry_budget(geometry_inventory([ROOT,args.geometry_budget_peer]))))
        return
    config=read(ROOT/'release.json');version=list(map(int,config['version'].split('.')))
    source_checks=source_check_commands(args,config['version'])
    subprocess.run(['node','--test','tools/ambient-sparse.test.mjs'],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/test_item_render_contract.py')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/test_shaker_held_frames.py')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/test_shaker_native_frame.py')],cwd=ROOT,check=True)
    subprocess.run(['node','--experimental-loader',str(ROOT/'tools/pickup/mock-loader.mjs'),'--test',str(ROOT/'tools/shared-interaction-echo.test.mjs')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/build_barrel_materials.py'),'--check'],cwd=ROOT,check=True)
    assert f"export const BUILD_VERSION='{config['version']}-baseline.1';" in (RT/'BP/scripts/data/build-version.js').read_text(),'Stale diagnostic build identity'
    files=list(RT.rglob('*.json'));docs={p:read(p) for p in files}
    # JSON decoding and JavaScript arithmetic tests do not validate Molang tokens.
    subprocess.run([sys.executable,str(ROOT/'tools/effects/check_molang.py')],cwd=ROOT,check=True)
    for side in ['BP','RP']:
        m=docs[RT/side/'manifest.json'];assert m['header']['version']==version
        assert all(x['version']==version for x in m['modules'])
        assert m['header']['name']=='pack.name' and m['header']['description']=='pack.description'
        assert (RT/side/'pack_icon.png').read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
        for lc in config['supported_locales']:
            lang=(RT/side/'texts'/f'{lc}.lang').read_text()
            assert 'pack.name=' in lang and 'pack.description=' in lang
    # Standalone mode: only the owned RP and stable scripting modules are mandatory.
    assert config.get('cookery_optional') is True
    for side in ['BP','RP']:
        assert not any(d.get('uuid') in {'d322809c-a51e-4742-bfc4-16d3c1491c9d','8e2c6318-2f5f-4907-aad0-31d10610e405','5df753c9-3436-4fba-87f1-a2da3651cfcf','f1d333ca-2d6b-4566-8005-e6c309816324'} for d in docs[RT/side/'manifest.json'].get('dependencies',[]))
    subprocess.run(['node','--test','tools/standalone-guide.test.mjs'],cwd=ROOT,check=True)
    assert not (RT/'RP/entity/player.entity.json').exists()
    assert not (RT/'RP/ui/fast_swap_scroll.json').exists()
    hud=docs[RT/'RP/ui/hud_screen.json'];assert 'hud_title_text' not in hud
    # Only protocol-scoped visibility may touch native Actionbar controls. Never hide
    # all messages through alpha, bindings, or replacement controls.
    for key in ['hud_actionbar_text','hud_actionbar_text/actionbar_message']:
        assert set(hud[key])=={'$kt_actionbar_text','visible'}
    subprocess.run(['node','tools/check_actionbar_filter.mjs'],cwd=ROOT,check=True)
    assert 'pbr' in docs[RT/'RP/manifest.json'].get('capabilities',[])
    # Custom entity materials must be in the client-discovered entry point, not
    # simply in any parseable .material file. BDS does not exercise this renderer.
    material_path=RT/'RP/materials/entity.material'
    materials=read(material_path)['materials']
    registered={key.split(':')[0]:value for key,value in materials.items() if key!='version'}
    for p in (RT/'RP/entity').glob('*.json'):
        description=read(p)['minecraft:client_entity']['description']
        for name in description.get('materials',{}).values():
            if name.startswith('kt_'):assert name in registered,(p,'unregistered material',name)
    assert 'USE_UV_ANIM' in registered['kt_signature_animated']['+defines']
    assert not (RT/'RP/materials/kt_signature.material').exists()
    item_atlas=docs[RT/'RP/textures/item_texture.json']['texture_data']
    flipbooks=docs[RT/'RP/textures/flipbook_textures.json']
    for drink in ('depth_charge','nether_special'):
        key=f'kt_c3_{drink}'
        path=f'textures/kaleidoscope_tavern_jar/item/{drink}'
        item=docs[RT/f'BP/items/{drink}.json']['minecraft:item']['components']
        assert 'minecraft:icon' not in item,'Static icons bypass the terrain flipbook'
        assert item['minecraft:block_placer']=={'block':f'kaleidoscope_tavern:cup_{drink}','use_on':[{'tags':'0'}]}
        visual=docs[RT/f'BP/blocks/cup_{drink}.json']['minecraft:block']['components']['minecraft:item_visual']
        assert visual['geometry']['identifier']==f'geometry.kt_runtime.item_sprite_{drink}'
        assert visual['material_instances']['*']['texture']==key
        # The native item visual uses this exact terrain tile, not just an
        # otherwise unbound flipbook declaration.
        assert any(row['atlas_tile']==key and row['flipbook_texture']==path for row in flipbooks)
    assert item_atlas['kt_c3_signature_cocktail']['textures']=='textures/kt_runtime/signature/icon_default'
    from PIL import Image
    mask=Image.open(RT/'RP/textures/kt_runtime/signature/icon_dyed.tga').convert('RGBA')
    assert sum(a>0 for a in mask.getchannel('A').getdata())==75,'Dyed icon must include the full glass AND liquid'
    geometry={g['description']['identifier'] for p,j in docs.items() if 'models' in p.parts for g in j.get('minecraft:geometry',[])}
    assert len(geometry)==sum(len(j.get('minecraft:geometry',[])) for p,j in docs.items() if 'models' in p.parts),'duplicate geometry identifiers'
    for p,j in docs.items():
        if not isinstance(j,dict):continue
        if 'blocks' in p.parts and 'minecraft:block' in j:
            b=j['minecraft:block']
            if p.name.endswith('_sofa.json'):
                corners=[row for row in b.get('permutations',[]) if row['condition'].endswith(('== 4','== 5'))]
                assert len(corners)==2
                assert all(len(row['components']['minecraft:collision_box'])==3 for row in corners)
            for values in b['description'].get('states',{}).values():
                if isinstance(values,list):assert len(values)<=16,(p,'block state exceeds 16 values')
            components=[b.get('components',{}),*[x['components'] for x in b.get('permutations',[])]]
            for c in components:
                for g in [c.get('minecraft:geometry'),c.get('minecraft:item_visual',{}).get('geometry')]:
                    if isinstance(g,dict):g=g.get('identifier')
                    if g:assert g in geometry or g in {'minecraft:geometry.full_block','minecraft:geometry.full_block_v1','minecraft:geometry.cross'},(p,g)
        for animation in j.get('animations',{}).values():
            if not isinstance(animation,dict):continue
            for bone in animation.get('bones',{}).values():
                for channel in ['position','rotation','scale']:
                    keys=bone.get(channel)
                    if isinstance(keys,dict):assert all(re.fullmatch(r'\d+(?:\.\d+)?',k) for k in keys),(p,keys)
    for p in (RT/'BP/scripts').rglob('*.js'):
        subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
        for relative in re.findall(r"(?:from\s+|import\s*)['\"](\.[^'\"]+)['\"]",p.read_text()):
            assert (p.parent/relative).is_file(),(p,relative)
    subprocess.run([sys.executable,str(ROOT/'tools/test_localization.py')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_localization.py')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_client_assets.py')],cwd=ROOT,check=True)
    subprocess.run(['node',str(ROOT/'tools/check_destruction.mjs')],cwd=ROOT,check=True)
    subprocess.run(['node',str(ROOT/'tools/check_guide.mjs')],cwd=ROOT,check=True)
    subprocess.run(['node',str(ROOT/'tools/check_feedback.mjs')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_visuals.py')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_repair.py')],cwd=ROOT,check=True)
    subprocess.run(source_checks['storage'],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_luminous_bride.py')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_luminous_base.py')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_motion.py')],cwd=ROOT,check=True)
    subprocess.run(source_checks['launch'],cwd=ROOT,check=True)
    subprocess.run(['node',str(ROOT/'tools/check_hud_compat.mjs')],cwd=ROOT,check=True)
    subprocess.run(['node','--test','tools/shaker-hud-expiry.test.mjs','tools/shaker-hud-motion.test.mjs','tools/cocktail-tooltip.test.mjs','tools/presentation-settings.test.mjs','tools/immersion-feedback.test.mjs','tools/effect-bar.test.mjs','tools/effect-icons.test.mjs','tools/effect-icon-startup.test.mjs'],cwd=ROOT,check=True)
    subprocess.run(['node','tools/build_effect_icon_hud.mjs','--check'],cwd=ROOT,check=True)
    subprocess.run([sys.executable,'tools/test_effect_ui_contract.py'],cwd=ROOT,check=True)
    subprocess.run([sys.executable,'tools/check_effect_ui_contract.py'],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_pack_compat.py')],cwd=ROOT,check=True)
    print(f'Static checks passed: {len(files)} JSON files, {len(geometry)} geometries; no interaction tests run.')

    # Native inventory grouping is data-only; prevent a return to the mixed decor bucket.
    subprocess.run([sys.executable,str(ROOT/'tools/creative/catalog.py')],cwd=ROOT,check=True)

    subprocess.run([sys.executable,str(ROOT/'tools/pick_block.py')],cwd=ROOT,check=True)

    subprocess.run([sys.executable,str(ROOT/'tools/check_vibrant_contract.py')],cwd=ROOT,check=True)

    subprocess.run(['node',str(ROOT/'tools/check_incense_sampling.mjs')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_animated_hands.py')],cwd=ROOT,check=True)

    subprocess.run(['node',str(ROOT/'tools/check_surface_repairs.mjs')],cwd=ROOT,check=True)

    subprocess.run(['node',str(ROOT/'tools/check_board_layout.mjs')],cwd=ROOT,check=True)
    subprocess.run([sys.executable,str(ROOT/'tools/check_drink_surfaces.py')],cwd=ROOT,check=True)

    subprocess.run([sys.executable,str(ROOT/'tools/check_glassware_slots.py')],cwd=ROOT,check=True)


if __name__=='__main__':
    main()
