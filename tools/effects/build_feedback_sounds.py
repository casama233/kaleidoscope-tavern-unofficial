#!/usr/bin/env python3
"""Copy only the three feedback events' hash-verified Java 1.20.1 sounds.
No global vanilla replacement. Source files come from collect_reference.py.
"""
import argparse,hashlib,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
EVENTS={'kaleidoscope_tavern:glow_ink_use':'item.glow_ink_sac.use','kaleidoscope_tavern:incense_click_on':'block.stone_button.click_on','kaleidoscope_tavern:incense_click_off':'block.stone_button.click_off'}

def build(reference):
    src=json.loads((reference/'minecraft/sounds.json').read_text())
    path=ROOT/'runtime/RP/sounds/sound_definitions.json';data=json.loads(path.read_text());proof=[]
    for alias,event in EVENTS.items():
        sounds=[]
        for row in src[event]['sounds']:
            row={'name':row} if isinstance(row,str) else dict(row)
            if row.get('type')=='event':raise ValueError('Resolve nested sound events explicitly')
            original='minecraft/sounds/'+row['name']+'.ogg';dest='sounds/kaleidoscope_tavern/feedback/'+row['name']
            source=reference/original;target=ROOT/'runtime/RP'/(dest+'.ogg');target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
            proof.append({'event':event,'source':original,'target':str(target.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
            row['name']=dest;row['stream']=False;sounds.append(row)
        data['sound_definitions'][alias]={'category':'block','sounds':sounds}
    path.write_text(json.dumps(data,indent=2)+'\n')
    (ROOT/'tools/effects/feedback-sound-sources.json').write_text(json.dumps({'version':'1.20.1','aliases':EVENTS,'assets':proof},indent=2)+'\n')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('reference',type=Path);build(p.parse_args().reference)
