import json
from pathlib import Path
import argparse
r=Path(__file__).resolve().parents[1];ref=json.loads((r/'data/java-collision-shapes.json').read_text());cases=[]
def rotate(b,f):
 x,y,z,X,Y,Z=b
 return [b,[16-Z,y,x,16-z,Y,X],[16-X,y,16-Z,16-x,Y,16-z],[z,y,16-X,Z,Y,16-x]][f]
def add(id,states,shapes):
 xs=sorted({0,16,*[b[i] for b in shapes for i in (0,3)]});zs=sorted({0,16,*[b[i] for b in shapes for i in (2,5)]})
 points=[]
 for a,b in zip(xs,xs[1:]):
  for c,d in zip(zs,zs[1:]):
   x=(a+b)/2;z=(c+d)/2;y=max([s[4] for s in shapes if s[0]<x<s[3] and s[2]<z<s[5]]+[0])
   points.append([x/16,z/16,y/16])
 cases.append({'id':'kaleidoscope_tavern:'+id,'states':states,'points':points})
for name,counts in ref['drinks'].items():
 for n,shapes in enumerate(counts,1):
  for f in range(4):add('bottle_'+name,{'kaleidoscope_tavern:count':n,'kaleidoscope_tavern:facing':f},[rotate(b,f) for b in shapes])
for p in (r/'runtime/BP/blocks').glob('cup_*.json'):add(p.stem,{},ref['glassware'])
add('shaker_station',{},ref['shaker'])
for f,d in enumerate(['north','east','south','west']):
 for dx in range(-1,2):
  for dz in range(-1,2):
   for dy in range(-1,2):
    if dx==dy==dz==0:continue
    box=[0,0,0,16,16,16]
    if f%2==0:
     if dx==-1:box[0]=4
     if dx==1:box[3]=12
    else:
     if dz==-1:box[2]=4
     if dz==1:box[5]=12
    add('barrel_part',{'minecraft:cardinal_direction':d,'kaleidoscope_tavern:dx':dx,'kaleidoscope_tavern:dy':dy,'kaleidoscope_tavern:dz':dz},[box])
parser=argparse.ArgumentParser(description='Generate an isolated BDS collision probe from the pinned Java shapes.')
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
source=(r/'tools/fixtures/java-collision-engine-probe.js').read_text().replace('__CASES__',json.dumps(cases))
args.output.write_text(source)
print(json.dumps({'states':len(cases),'collisionProbes':sum(len(c['points']) for c in cases),'output':str(args.output)}))
