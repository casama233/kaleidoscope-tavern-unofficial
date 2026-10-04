"""Pinned ChineseFood renderer cleanup with an explicit local paired release.

Keep the author UUIDs/assets and the immutable original lock. Client resource
cache identity advances with the owning compatibility release; this is never
reported as an official author release.
"""
import copy,hashlib,json
from datetime import date
from pathlib import Path
BP='b3c9db76-4ae6-4986-a380-90a4025d95a9'
RP='b20a91d2-f099-4293-8a7f-46bf7fbc6017'
ARCHIVE='63bd2eb2ee2819c985d7c484df633c913cbb995abf3162aa68c997c24ef607f2'

def patch_manifests(bp,rp,version,owner_version):
    result=[]
    for original,uid,other in [(bp,BP,RP),(rp,RP,BP)]:
        value=copy.deepcopy(original)
        if value['header']['uuid']!=uid or value['header']['version']!=[1,0,4]:raise ValueError('renderer cleanup requires original author identities')
        value['header']['version']=version
        if owner_version>=[1,0,18] and value['header']['name']=='pack.name':
            value['header']['name']='森羅廚房：國味'+(' 行為包' if uid==BP else ' 資源包')
        value['header']['name']+=' [相容修補 '+'.'.join(map(str,owner_version))+'；作者原版 1.0.4]'
        for module in value['modules']:
            if module['version']!=[1,0,4]:raise ValueError('original author module version differs')
            module['version']=version
        paired=[d for d in value.get('dependencies',[]) if d.get('uuid')==other]
        if len(paired)!=1 or paired[0]['version']!=[1,0,4]:raise ValueError('original author pair dependency differs')
        paired[0]['version']=version;result.append(value)
    return result


def cleanup_blocks(original):
    value=copy.deepcopy(original)
    for i in range(1,7):
        uid='kaleidoscope_chinesefood:doll_'+str(i);alias='kcf_block_doll_'+str(i)
        if value.get(uid)!={'sound':'cloth','textures':alias}:raise ValueError('original doll legacy entry differs')
        del value[uid]['textures']
    return value


def apply_renderer_extension(spec,bp_root,rp_root,bp_source,rp_source,owner_version):
    if spec.get('schema')!=1 or spec.get('kind')!='chinesefood-doll-renderer-cleanup':raise ValueError('unknown renderer extension')
    if spec.get('host_uuid')!=RP or spec.get('behavior_uuid')!=BP:raise ValueError('renderer extension target differs')
    if owner_version[:2]!=[1,0] or spec['owner_version']!=owner_version:raise ValueError('renderer extension release is not paired with owner')
    version=[1,0,10400+owner_version[2]]
    if spec['local_pack_version']!=version:raise ValueError('renderer variant must advance with its canonical owner')
    if date.fromisoformat(spec['expires'])<date.today():raise ValueError('renderer extension expired')
    for key in ['removal_condition','feedback','authorization']:
        if not spec.get(key):raise ValueError('renderer review metadata missing '+key)
    for source in [bp_source,rp_source]:
        if source['owner'] not in ['upstream','upstream_extended'] or source['archive_sha256']!=ARCHIVE or spec['archive_sha256']!=ARCHIVE:raise ValueError('renderer cleanup requires the pinned clean author archive')
    originals={'BP/manifest.json':bp_root/'manifest.json','RP/manifest.json':rp_root/'manifest.json','RP/blocks.json':rp_root/'blocks.json'}
    if set(spec['original_files'])!=set(originals) or set(spec['patched_files'])!=set(originals):raise ValueError('renderer file inventory differs')
    for name,path in originals.items():
        if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest()!=spec['original_files'][name]:raise ValueError('original renderer file differs '+name)
    terrain=json.loads((rp_root/'textures/terrain_texture.json').read_text())['texture_data']
    models=set()
    for path in (rp_root/'models').rglob('*.json'):
        data=json.loads(path.read_text())
        models.update(row['description']['identifier'] for row in data.get('minecraft:geometry',[]))
    for i in range(1,7):
        path=bp_root/('blocks/decor/doll_'+str(i)+'.json');data=json.loads(path.read_text())['minecraft:block'];components=data['components'];alias='kcf_block_doll_'+str(i)
        if data['description']['identifier']!='kaleidoscope_chinesefood:doll_'+str(i) or components['minecraft:material_instances']['*']['texture']!=alias or alias not in terrain or components['minecraft:geometry'] not in models:raise ValueError('author doll geometry/material binding missing')
    bp,rp=patch_manifests(json.loads(originals['BP/manifest.json'].read_text()),json.loads(originals['RP/manifest.json'].read_text()),version,owner_version)
    blocks=cleanup_blocks(json.loads(originals['RP/blocks.json'].read_text()))
    changes={'BP/manifest.json':bp,'RP/manifest.json':rp,'RP/blocks.json':blocks}
    encoded={name:(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode() for name,value in changes.items()}
    for name,raw in encoded.items():
        if hashlib.sha256(raw).hexdigest()!=spec['patched_files'][name]:raise ValueError('reviewed renderer output differs '+name)
    for name,raw in encoded.items():originals[name].write_bytes(raw)
    return {key:spec[key] for key in ['id','kind','owner_version','local_pack_version','expires','archive_sha256','original_files','patched_files','removal_condition','feedback','authorization']}
