"""Independent Bedrock importer / CubeFace affine oracle for sprite shells.

Conventions: Blockbench 7c92e27d237e365110030d73e92c5d1605f0d311,
js/formats/bedrock/bedrock.js parseCube (X reflection, up/down UV reversal),
js/outliner/types/cube.js CubeFace.UVToLocal (oriented face vertices).
Checks emitted faces as well as every frame's alpha boundary; no generator
coordinate helper is imported. Source/editor evidence, not client acceptance.
"""
from pathlib import Path
from PIL import Image
import json, math
ROOT=Path(__file__).resolve().parents[1]
NAMES=('depth_charge','mystery_cocktail','nether_special','ice_grape')
NORMAL={'east':(1,0),'west':(-1,0),'up':(0,1),'down':(0,-1)}

def quad(c,f):
    x,y,z=c['origin'];dx,dy,dz=c['size']
    x=-x-dx; X=x+dx; Y=y+dy; Z=z+dz
    uv=c['uv'][f];u,v=uv['uv'];du,dv=uv['uv_size']
    if f in ('up','down'): u,v,du,dv=u+du,v+dv,-du,-dv
    # Actual local vertices at normalized UV rectangle coordinates (0,0),(1,0),(0,1).
    vertices={
        'east':((X,Y,Z),(X,Y,z),(X,y,Z)),
        'west':((x,Y,z),(x,Y,Z),(x,y,z)),
        'up':((x,Y,z),(X,Y,z),(x,Y,Z)),
        'down':((x,y,Z),(X,y,Z),(x,y,z)),
        'south':((x,Y,Z),(X,Y,Z),(x,y,Z)),
        'north':((X,Y,z),(x,Y,z),(X,y,z)),
    }[f]
    return vertices,(u,v,du,dv)

def evaluate(vertices,uv,a,b):
    p,p1,p2=vertices
    return tuple(p[k]+a*(p1[k]-p[k])+b*(p2[k]-p[k]) for k in range(3)), (uv[0]+a*uv[2],uv[1]+b*uv[3])

def target(cubes,p,f):
    # Map the point half a pixel inside the side into the unchanged SOUTH face.
    # Invert its actual affine vertices. For these sprites, U is local X and V is -Y.
    nx,ny=NORMAL[f];q=(p[0]-.5*nx,p[1]-.5*ny,p[2])
    verts,uv=quad(cubes[0],'south');o,axis_u,axis_v=verts
    au=(q[0]-o[0])/(axis_u[0]-o[0]); av=(q[1]-o[1])/(axis_v[1]-o[1])
    return math.floor(uv[0]+au*uv[2]),math.floor(uv[1]+av*uv[3])

def emitted(cubes):
    cells=[]
    for ci,c in enumerate(cubes[1:],1):
        assert not c.get('rotation') and not c.get('inflate') and c['origin'][2]==-.5 and c['size'][2]==1
        assert len(c['uv'])==1
        f=next(iter(c['uv']));assert f in NORMAL
        assert not c['uv'][f].get('uv_rotation')
        length=int(c['size'][0] if f in ('up','down') else c['size'][1])
        verts,uv=quad(c,f)
        for j in range(length):
            evidence=[]
            for pos in (.001,.25,.5,.75,.999):
                for depth in (.001,.25,.5,.75,.999):
                    if f in ('up','down'):a,b=(j+pos)/length,depth
                    else:a,b=depth,(j+pos)/length
                    p,t=evaluate(verts,uv,a,b)
                    evidence.append((target(cubes,p,f),(math.floor(t[0]),math.floor(t[1]))))
            cells.append((ci,f,j,evidence))
    return cells

def audit(cubes,sheet):
    cells=emitted(cubes); result={
        'emitted_unit_side_cells':len(cells), 'samples_per_cell':25,
        'uv_mapping_mismatched_cells':sum(any(a!=b for a,b in e) for _,_,_,e in cells),
        'frames':sheet.height//16,'expected_boundary_edges':0,'missing_or_wrong_texel_boundary_edges':0,
        'opaque_sample_wrong_texel_cells_over_frames':0,'opaque_sample_unsupported_by_inside_pixel_cells_over_frames':0,
        'legitimate_internal_cells_over_frames':0,'examples':[]}
    mapping={}
    for ci,f,j,e in cells:
        inside,tex=e[12]
        mapping.setdefault((f,*inside),[]).append((ci,j,e))
    for fi in range(sheet.height//16):
        frame=sheet.crop((0,fi*16,16,fi*16+16))
        def rgba(p):return frame.getpixel(p) if 0<=p[0]<16 and 0<=p[1]<16 else (0,0,0,0)
        for y in range(16):
            for x in range(16):
                if not rgba((x,y))[3]:continue
                for f,dx,dy in [('east',1,0),('west',-1,0),('up',0,-1),('down',0,1)]:
                    if rgba((x+dx,y+dy))[3]:continue
                    result['expected_boundary_edges']+=1
                    candidates=mapping.get((f,x,y),[])
                    if not any(all(a==(x,y) and b==(x,y) for a,b in e) for ci,j,e in candidates):
                        result['missing_or_wrong_texel_boundary_edges']+=1
        for ci,f,j,e in cells:
            visible_wrong=any(a!=b and rgba(b)[3] for a,b in e)
            unsupported=any(rgba(b)[3] and not rgba(a)[3] for a,b in e)
            result['opaque_sample_wrong_texel_cells_over_frames']+=visible_wrong
            result['opaque_sample_unsupported_by_inside_pixel_cells_over_frames']+=unsupported
            a,b=e[12];nx,ny=NORMAL[f]
            if a==b and rgba(a)[3] and rgba((a[0]+nx,a[1]-ny))[3]:result['legitimate_internal_cells_over_frames']+=1
            if (visible_wrong or unsupported) and len(result['examples'])<3:result['examples'].append({'frame':fi,'cube':ci,'face':f,'spatial_texel':a,'sampled_texel':b,'unsupported':unsupported})
    return result


def check_geometry(cubes,frames):
    sheet=Image.new('RGBA',(16,16*len(frames)))
    for i,frame in enumerate(frames):sheet.paste(frame,(0,16*i))
    result=audit(cubes,sheet)
    return result['expected_boundary_edges'], result

def check(root=ROOT):
    result={}
    for name in NAMES:
        rp=root/'runtime/RP'
        g=json.loads((rp/f'models/entity/item_sprite_{name}.geo.json').read_text())['minecraft:geometry'][0]
        with Image.open(rp/f'textures/kaleidoscope_tavern_jar/item/{name}.png') as image:sheet=image.convert('RGBA')
        result[name]=audit(g['bones'][0]['cubes'],sheet)
    return result

def valid(result):
    return all(result[k]==0 for k in ('uv_mapping_mismatched_cells',
        'missing_or_wrong_texel_boundary_edges','opaque_sample_wrong_texel_cells_over_frames',
        'opaque_sample_unsupported_by_inside_pixel_cells_over_frames'))

if __name__=='__main__':
    result=check();print(json.dumps(result))
    assert all(valid(v) for v in result.values()), 'Animated sprite shell does not match its front texture'
