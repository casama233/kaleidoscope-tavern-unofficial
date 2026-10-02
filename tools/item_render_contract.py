"""Source-backed native item routes. World geometry and gameplay stay untouched.

The pinned Java item-art-map is authoritative, not texture filename guesses.
This validates assets/routing, not native client appearance or animated sprites.
"""
import argparse
import copy
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SPRITE_REPLACEMENTS = frozenset(['bell_pendant_lamp','blue_pendant_lamp','yellow_pendant_lamp','holder','tap'] + [x+'_painting' for x in ['ysbb','tartaric_acid','cr019','unknown','master_marisa','son_of_man','david','girl_with_pearl_earring','starry_night','van_gogh_self_portrait','father','great_wave','mona_lisa','mondrian']])
CONTEXTS = ('gui','ground','fixed','head','firstperson_righthand','firstperson_lefthand','thirdperson_righthand','thirdperson_lefthand')

def read(p): return json.loads(p.read_text())
def encode(j): return json.dumps(j,ensure_ascii=False,indent=2)+'\n'
def planned(root=ROOT):
    entries=read(root/'art/interfaces/item-art-map.json')['entries']
    bp=root/'runtime/BP';rp=root/'runtime/RP'
    blocks={read(p)['minecraft:block']['description']['identifier']:p for p in (bp/'blocks').glob('*.json')}
    items={read(p)['minecraft:item']['description']['identifier']:p for p in (bp/'items').glob('*.json')}
    terrain=read(rp/'textures/terrain_texture.json')['texture_data']
    atlas=read(rp/'textures/item_texture.json')['texture_data']
    result={};report=[]
    for e in entries:
        ident=e.get('item')
        if not ident: continue
        short=ident.split(':')[1]
        if e['mode']=='original_sprite' and short in SPRITE_REPLACEMENTS:
            block=read(blocks[ident])['minecraft:block']
            assert e['icon'] in atlas,(ident,'missing Java sprite')
            placer={'block':ident,'replace_block_item':True}
            # Tap has native placement traits/onPlace; the other families already
            # have authoritative script routes. Do not disable native tap placement.
            if short!='tap': placer['use_on']=[{'tags':'0'}]
            j={'format_version':'1.26.50','minecraft:item':{'description':{
                'identifier':ident,'menu_category':copy.deepcopy(block['description']['menu_category'])},
                'components':{'minecraft:icon':e['icon'],'minecraft:max_stack_size':64,
                  'minecraft:display_name':{'value':'item.'+ident+'.name'},'minecraft:block_placer':placer}}}
            result[bp/'items'/f'{short}.json']=j
            report.append({'id':ident,'route':'generated_sprite','source':e['source']})
        elif e['mode']=='geometry' and not short.startswith('shaker'):
            target=ident
            if short.endswith('_bar_stool'): target='kaleidoscope_tavern:stool_'+short.removesuffix('_bar_stool')
            elif short.startswith('string_lights_'): target='kaleidoscope_tavern:light_'+short.removeprefix('string_lights_')
            elif short=='barrel': target='kaleidoscope_tavern:barrel_core'
            assert target in blocks,(ident,target)
            gp=rp/'models/entity'/f"{e['asset']}.geo.json";geo=read(gp)
            transforms={}
            for context in CONTEXTS:
                source=e['java_display'].get(context,e['java_display'].get(context.replace('_lefthand','_righthand'),{}) if context.endswith('_lefthand') else {})
                transforms[context]={key:copy.deepcopy(source.get(key,default)) for key,default in [('rotation',[0,0,0]),('translation',[0,0,0]),('scale',[1,1,1])]}
                if context=='gui': transforms[context]['fit_to_frame']=False
            geo['minecraft:geometry'][0]['item_display_transforms']=transforms
            result[gp]=geo
            key='kt_assets_a17_'+e['asset'];assert key in terrain,(ident,key)
            block=read(blocks[target]);block['minecraft:block']['components']['minecraft:item_visual']={
              'geometry':{'identifier':geo['minecraft:geometry'][0]['description']['identifier']},
              'material_instances':{'*':{'texture':key,'render_method':'alpha_test','ambient_occlusion':0.0,'face_dimming':True},'unshaded':{'texture':key,'render_method':'alpha_test','ambient_occlusion':0.0,'face_dimming':False}}}
            result[blocks[target]]=block
            if ident in items:
                item=read(items[ident]);c=item['minecraft:item']['components'];c.pop('minecraft:icon',None)
                if 'minecraft:block_placer' not in c:
                    c['minecraft:block_placer']={'block':target,'use_on':[{'tags':'0'}]}
                assert c['minecraft:block_placer']['block']==target
                result[items[ident]]=item
            report.append({'id':ident,'route':'native_geometry','block':target,'source':e['source'],'contexts':list(CONTEXTS)})
    return result,report

def check_or_write(write=False,root=ROOT):
    # Include already-created sprite replacements so the check remains idempotent.
    expected,report=planned(root)
    errors=[]
    for p,j in expected.items():
        if not p.exists() or read(p)!=j:
            if write: p.write_text(encode(j))
            else: errors.append(str(p.relative_to(root)))
    if errors: raise AssertionError('Item render contract drift: '+', '.join(errors))
    return report
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');a=ap.parse_args()
    rows=check_or_write(a.write);print('Native item render contracts:',len(rows))
