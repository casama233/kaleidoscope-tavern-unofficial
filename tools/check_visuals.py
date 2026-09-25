#!/usr/bin/env python3
"""Static image, PBR, locale and camera-wiring regression checks. No game mocks."""
from pathlib import Path
from collections import Counter
import json
import re
import subprocess
import struct
from PIL import Image
from refresh_cocktail_icons import signature_icons
from refresh_visual_compat import audit

ROOT=Path(__file__).resolve().parents[1]
RT=ROOT/'runtime'
RP=RT/'RP'

def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))

def main():
    result=audit()
    assert not result['errors'],result['errors']
    allowed_external={'blue_ice','dirt','ice','ice_packed','stone','apple','blaze_powder','book_normal','book_writable','dye_powder_glow','glow_berries','glowstone_dust','gold_nugget','gunpowder','honeycomb','iron_nugget','pink_petals','potato','redstone_dust','reeds','rotten_flesh','sugar','sweet_berries','wheat'}
    for row in result['external']:
        name=row['texture'];assert name.startswith(('textures/items/','textures/blocks/')) and name.rsplit('/',1)[-1] in allowed_external,('missing custom texture',name)
    for p in RP.rglob('*.texture_set.json'):
        d=read(p)['minecraft:texture_set'];assert 'color' in d
        assert not ('normal' in d and 'heightmap' in d)
        assert not ('metalness_emissive_roughness' in d and 'metalness_emissive_roughness_subsurface' in d)
        color=p.parent/(d['color']+'.png');assert color.is_file(),(p,color)
        image=Image.open(color).convert('RGBA')
        mer=d['metalness_emissive_roughness']
        if isinstance(mer,str):
            mer_image=Image.open(p.parent/(mer+'.png'))
            assert mer_image.mode=='RGB' and mer_image.size==image.size
            assert max(mer_image.getchannel('G').getextrema())<=48,(p,'excessive/unreviewed emission')
            for rgba, rgb in zip(image.getdata(),mer_image.getdata()):
                assert rgba[3]!=0 or rgb[1]==0,(p,'transparent texel emits')
        else:
            assert len(mer)==3 and mer[0]==0 and mer[1]==0 and 150<=mer[2]<=230,(p,mer)
    default,dyed=signature_icons()
    actual=Image.open(RP/'textures/kt_runtime/signature/icon_dyed.tga').convert('RGBA')
    assert actual.size==(16,16) and actual.tobytes()==dyed.tobytes()
    assert Counter(actual.getchannel('A').getdata())=={0:181,3:57,255:18}
    actual_default=Image.open(RP/'textures/kt_runtime/signature/icon_default.png').convert('RGBA')
    assert actual_default.tobytes()==default.tobytes()
    header=(RP/'textures/kt_runtime/signature/icon_dyed.tga').read_bytes()[:18]
    assert header[2]==2 and header[16]==32 and header[17]&15==8
    assert struct.unpack_from('<HH',header,12)==(16,16)
    atlas=read(RP/'textures/item_texture.json')['texture_data']
    assert atlas['kt_c3_signature_cocktail']['textures']=='textures/kt_runtime/signature/icon_default'
    assert atlas['kt_signature_dyed']['textures']=='textures/kt_runtime/signature/icon_dyed.tga'
    item=read(RT/'BP/items/signature_cocktail.json')['minecraft:item']['components']
    assert item['minecraft:icon']['textures']=={'default':'kt_c3_signature_cocktail','dyed':'kt_signature_dyed'}
    assert item['minecraft:dyeable']['default_color']=='#5555ff'
    assert not (RP/'textures/kt_runtime/signature/icon_dyed.texture_set.json').exists()
    names=read(ROOT/'data/native-effect-names.json')
    locale_counts={}
    for locale in ('en_US','zh_CN','zh_TW'):
        lines=(RP/'texts'/f'{locale}.lang').read_text(encoding='utf-8').splitlines()
        keys=[line.split('=',1)[0] for line in lines if '=' in line and not line.startswith('#')]
        assert len(keys)==len(set(keys)),(locale,'duplicate language key')
        assert all(f'effect.minecraft.{key}' in keys for key in names),(locale,'missing native effect alias')
        locale_counts[locale]=len(keys)
    core=(RT/'BP/scripts/core/quality-tooltip.js').read_text()
    assert "['I','II','III','IV','V','VI','VII','VIII','IX','X']" in core
    adapter=(RT/'BP/scripts/bedrock/tipsy-visual.js').read_text()
    assert not re.search(r'import\s*\{[^}]*CameraShakeType',adapter)
    assert 'camerashake add @s' in adapter and "typeof camera?.addShake==='function'" in adapter
    for forbidden in ('camerashake stop','.stopShaking(','.setCamera(','.clear(','.setRotation(','addEffect('):
        assert forbidden not in adapter,('global/destructive/false camera fallback',forbidden)
    hooks=(RT/'BP/scripts/bedrock/custom-effects.js').read_text()
    assert 'pulseTipsyVisual(p,activeStatus(nextState,TIPSY_ID))' in hooks
    assert 'forgetTipsyVisual(p.id);write(' in hooks
    assert 'forgetTipsyVisual(e.playerId)' in hooks and 'forgetTipsyVisual(e.player.id)' in hooks
    assert 'pruneTipsyVisuals(seen)' in hooks
    assert not (RP/'entity/player.entity.json').exists()
    for p in (RT/'BP/scripts').rglob('*.js'):
        subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
        for relative in re.findall(r"(?:from\s+|import\s*)['\"](\.[^'\"]+)['\"]",p.read_text()):
            assert (p.parent/relative).is_file(),(p,relative)
    for p in RT.rglob('*.json'):read(p)
    subprocess.run(['node',str(ROOT/'tools/check_visual_rules.mjs')],cwd=ROOT,check=True)
    report={'staticVisualChecks':'passed','materials':result['summary'],'dyedIconAlphaCounts':{'transparent':181,'untintedGlass':57,'tintableLiquid':18},'localeKeys':locale_counts,'minecraftClientTested':False,'bdsTestedForThisRevision':False,'simulatedPlayerTestsRun':False}
    (ROOT/f"docs/VALIDATION-{read(ROOT/'release.json')['version']}-VISUAL.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
