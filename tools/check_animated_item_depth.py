"""Close the actual sprite's alpha boundary with correctly sampled side quads.

UV corner/face conventions are from Microsoft's geometry 1.21.0 schema.
This inspects source pixels and geometry, not Minecraft client rendering.
"""
import json, math
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
NAMES=('depth_charge','mystery_cocktail','nether_special','ice_grape')

def uv_at(cube,face,point):
    o=cube['origin'];s=cube['size'];x,y,z=point
    # Schema: vertical faces start at the upper-left viewed from outside;
    # up starts back-upper-left, down starts back-down-right, facing north.
    a,b=0,0
    if face=='south':a,b=(x-o[0])/s[0],(o[1]+s[1]-y)/s[1]
    if face=='north':a,b=(o[0]+s[0]-x)/s[0],(o[1]+s[1]-y)/s[1]
    if face=='east':a,b=(o[2]+s[2]-z)/s[2],(o[1]+s[1]-y)/s[1]
    if face=='west':a,b=(z-o[2])/s[2],(o[1]+s[1]-y)/s[1]
    if face=='up':a,b=(x-o[0])/s[0],(o[2]+s[2]-z)/s[2]
    if face=='down':a,b=(o[0]+s[0]-x)/s[0],(o[2]+s[2]-z)/s[2]
    uv=cube['uv'][face]
    return uv['uv'][0]+a*uv['uv_size'][0],uv['uv'][1]+b*uv['uv_size'][1]

def check_geometry(cubes,frames):
    body=cubes[0];o=body['origin'];s=body['size'];front=body['uv']['south']
    assert s[2]==1 and set(body['uv'])=={'north','south'}
    # Map source texel centers through the actual front plane, independent of
    # the side generator's span coordinates.
    def at(u,v):
        return o[0]+(u-front['uv'][0])/front['uv_size'][0]*s[0], o[1]+s[1]-(v-front['uv'][1])/front['uv_size'][1]*s[1]
    assert front['uv_size']==[16,16]
    failures=[];edges=0
    for frame_index,frame in enumerate(frames):
        alpha=frame.getchannel('A')
        for y in range(16):
            for x in range(16):
                if not alpha.getpixel((x,y)):continue
                for dx,dy,face in [(-1,0,'west'),(1,0,'east'),(0,-1,'up'),(0,1,'down')]:
                    nx,ny=x+dx,y+dy
                    if 0<=nx<16 and 0<=ny<16 and alpha.getpixel((nx,ny)):continue
                    edges+=1;px,py=at(x+.5+dx*.5,y+.5+dy*.5)
                    found=False
                    for c in cubes[1:]:
                        if face not in c['uv']:continue
                        co,cs=c['origin'],c['size'];axis=0 if dx else 1
                        plane=co[axis]+(cs[axis] if face in ('east','up') else 0)
                        if abs(plane-(px if dx else py))>1e-6:continue
                        other=1-axis;value=py if dx else px
                        if not co[other]-1e-6<=value<=co[other]+cs[other]+1e-6:continue
                        if co[2]!=o[2] or cs[2]!=s[2]:continue
                        if all(tuple(math.floor(v) for v in uv_at(c,face,(px,py,z)))==(x,y) for z in (-.49,0,.49)):
                            found=True;break
                    if not found:failures.append((frame_index,x,y,face))
    return edges,failures

def check(root=ROOT):
    result={}
    for name in NAMES:
        rp=root/'runtime/RP';g=json.loads((rp/f'models/entity/item_sprite_{name}.geo.json').read_text())['minecraft:geometry'][0]
        sheet=Image.open(rp/f'textures/kaleidoscope_tavern_jar/item/{name}.png').convert('RGBA')
        frames=[sheet.crop((0,y,16,y+16)) for y in range(0,sheet.height,16)]
        edges,failures=check_geometry(g['bones'][0]['cubes'],frames)
        result[name]={'frames':len(frames),'alphaBoundaryEdges':edges,'unsealedOrWrongTexelEdges':len(failures),'examples':failures[:3]}
    return result
if __name__=='__main__':
    result=check();print(json.dumps(result));assert all(v['unsealedOrWrongTexelEdges']==0 for v in result.values()),'Animated sprite side faces do not close their front texture'
