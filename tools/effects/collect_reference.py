#!/usr/bin/env python3
"""Development-only hash-verified 1.20.1 references; never export a game JAR."""
import concurrent.futures,hashlib,json,subprocess,tempfile,urllib.request,zipfile
from pathlib import Path

def get(url):
    with urllib.request.urlopen(url,timeout=60) as r:return r.read()
def verified(entry):
    data=get(entry['url'])
    if hashlib.sha1(data).hexdigest()!=entry['sha1']:raise ValueError('Official artifact hash mismatch')
    return data

def collect(out):
    out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads(get('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'))
    meta_url=next(v['url'] for v in manifest['versions'] if v['id']=='1.20.1')
    meta=json.loads(get(meta_url));mapping=verified(meta['downloads']['client_mappings']).decode()
    mappings={};current=None
    for line in mapping.splitlines():
        if line and not line[0].isspace() and ' -> ' in line:
            name,obf=line[:-1].split(' -> ')
            current=name if name.startswith('net.minecraft.client.particle.') or name=='net.minecraft.client.multiplayer.ClientLevel' else None
            if current:mappings[current]={'obf':obf,'lines':[line]}
        elif current:mappings[current]['lines'].append(line)
    (out/'mappings.txt').write_text('\n'.join('\n'.join(v['lines']) for v in mappings.values()))
    with tempfile.TemporaryDirectory() as tmp:
        jar=Path(tmp)/'client.jar';jar.write_bytes(verified(meta['downloads']['client']))
        with zipfile.ZipFile(jar) as archive:
            for name in archive.namelist():
                if (name.startswith('assets/minecraft/textures/particle/') and name.endswith('.png')) or (name.startswith('assets/minecraft/particles/') and name.endswith('.json')):
                    dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(archive.read(name))
        (out/'instructions').mkdir(exist_ok=True)
        def listing(item):
            name,row=item
            p=subprocess.run(['javap','-classpath',str(jar),'-c','-p',row['obf']],capture_output=True,text=True,check=True)
            (out/'instructions'/(name.rsplit('.',1)[-1]+'.txt')).write_text(p.stdout)
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(listing,mappings.items()))
    index=json.loads(verified(meta['assetIndex']))['objects']
    def asset(name):
        h=index[name]['hash'];data=get('https://resources.download.minecraft.net/'+h[:2]+'/'+h)
        if hashlib.sha1(data).hexdigest()!=h:raise ValueError('Asset hash mismatch')
        target=out/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        return data
    sounds=json.loads(asset('minecraft/sounds.json'))
    needed=['item.glow_ink_sac.use','block.stone_button.click_on','block.stone_button.click_off']
    selected={k:sounds[k] for k in needed}
    for row in selected.values():
        for sound in row['sounds']:
            name=sound if isinstance(sound,str) else sound['name']
            if not isinstance(sound,dict) or sound.get('type')!='event':asset('minecraft/sounds/'+name+'.ogg')
    (out/'PROVENANCE.json').write_text(json.dumps({'version':'1.20.1','metadata_url':meta_url,'client':meta['downloads']['client'],'mappings':meta['downloads']['client_mappings'],'assetIndex':meta['assetIndex'],'selectedSounds':selected},indent=2)+'\n')
if __name__=='__main__':
    import sys
    collect(Path(sys.argv[1] if len(sys.argv)>1 else 'vanilla-reference'))
