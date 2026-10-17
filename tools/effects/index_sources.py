#!/usr/bin/env python3
"""Index explicit FX call sites and renderer/particle classes; not an acceptance test."""
import argparse,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PAT=re.compile(r'\.(?:sendParticles|addParticle|playSound|playLocalSound)\s*\(|\banimateTick\s*\(')

def build(java):
 calls=[];classes=[]
 for p in sorted((java/'src/main/java').rglob('*.java')):
  lines=p.read_text().splitlines();rel=p.relative_to(java).as_posix()
  for n,line in enumerate(lines,1):
   if PAT.search(line):calls.append({'path':rel,'line':n,'excerpt':'\n'.join(lines[max(0,n-2):min(len(lines),n+6)])})
  if '/client/' in rel and any(k in rel for k in ('/particle/','/render/','/animation/','/event/CameraAnglesEvent','/event/PlayerRenderEvent','/gui/overlay/')):
   classes.append({'path':rel,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 particle_definitions=[]
 for p in sorted((java/'src/generated/resources/assets/kaleidoscope_tavern/particles').glob('*.json')):
  particle_definitions.append({'path':p.relative_to(java).as_posix(),'definition':json.loads(p.read_text()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 out={'java_commit':'c4ec1880bd44cf3139d3ba744ab30bb379cf1416','port_main_commit':'f793a98a0180e1948f98e69a8ca879a028884e38','port_dependency_commit':'1d0be5cf24ce3fb2da1e5b1797df017bb9cbd3cb','scope':'Explicit particle/sound call sites plus client renderer/particle classes. Counts are not distinct effects and do not certify native rendering. Vanilla inherited sounds/materials and addon-only sources require separate review.','call_sites':calls,'client_classes':classes,'custom_particle_definitions':particle_definitions}
 path=ROOT/'docs/effects-source-index-20260928.json';path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:len(out[k]) for k in ('call_sites','client_classes','custom_particle_definitions')}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('java',type=Path);build(p.parse_args().java)
