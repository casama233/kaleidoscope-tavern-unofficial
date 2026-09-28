#!/usr/bin/env python3
"""Development-only collector: hash-verified 1.20.1 particles, no game JAR export."""
import hashlib,json,subprocess,tempfile,urllib.request,zipfile
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
    classes={'Particle','TextureSheetParticle','SingleQuadParticle','SimpleAnimatedParticle','GlowParticle','RisingParticle','DripParticle','BubblePopParticle','SpellParticle','PlayerCloudParticle','SuspendedTownParticle','EndRodParticle','FlameParticle','SmokeParticle','CherryParticle','SuspendedParticle','WaterDropParticle','BreakingItemParticle'}
    mappings={};current=None
    for line in mapping.splitlines():
        if line and not line[0].isspace() and ' -> ' in line:
            name,obf=line[:-1].split(' -> ');short=name.rsplit('.',1)[-1].split('$')[0]
            current=name if name.startswith('net.minecraft.client.particle.') and short in classes else None
            if current:mappings[current]={'obf':obf,'lines':[line]}
        elif current:mappings[current]['lines'].append(line)
    (out/'mappings.txt').write_text('\n'.join('\n'.join(v['lines']) for v in mappings.values()))
    with tempfile.TemporaryDirectory() as tmp:
        jar=Path(tmp)/'client.jar';jar.write_bytes(verified(meta['downloads']['client']))
        with zipfile.ZipFile(jar) as archive:
            for name in archive.namelist():
                if (name.startswith('assets/minecraft/textures/particle/') and name.endswith('.png')) or (name.startswith('assets/minecraft/particles/') and name.endswith('.json')) or name=='assets/minecraft/sounds.json':
                    dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(archive.read(name))
        for name,row in mappings.items():
            target=out/'instructions'/(name.rsplit('.',1)[-1]+'.txt');target.parent.mkdir(exist_ok=True)
            p=subprocess.run(['javap','-classpath',str(jar),'-c','-p',row['obf']],capture_output=True,text=True,check=True)
            target.write_text(p.stdout)
    index=json.loads(verified(meta['assetIndex']))['objects']
    for name,entry in index.items():
        if name.startswith('minecraft/sounds/item/glow_ink_sac/'):
            h=entry['hash'];data=get('https://resources.download.minecraft.net/'+h[:2]+'/'+h)
            if hashlib.sha1(data).hexdigest()!=h:raise ValueError('Sound hash mismatch')
            target=out/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    (out/'PROVENANCE.json').write_text(json.dumps({'version':'1.20.1','metadata_url':meta_url,'client':meta['downloads']['client'],'mappings':meta['downloads']['client_mappings'],'assetIndex':meta['assetIndex']},indent=2)+'\n')
if __name__=='__main__':
    import sys
    collect(Path(sys.argv[1] if len(sys.argv)>1 else 'vanilla-reference'))
