#!/usr/bin/env python3
"""Static model / Java-matrix parity checks, without engine or player emulation.

The independent reference uses the upstream PoseStack operation order. Actual
transforms are read from the shipped JS poses, geometry pivots, scale and animation.
The adapter convention is Java (x,y,z) -> geometry (8-x,y,z-8), with world yaw
opposite Java YP. These algebraic checks do NOT prove client rendering.
"""
import argparse
import copy
import hashlib
import itertools
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RT = ROOT / 'runtime'
RP = RT / 'RP'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def rx(point, degrees):
    x, y, z = point
    angle = math.radians(degrees)
    c, s = math.cos(angle), math.sin(angle)
    return [x, c*y-s*z, s*y+c*z]


def ry(point, degrees):
    x, y, z = point
    angle = math.radians(degrees)
    c, s = math.cos(angle), math.sin(angle)
    return [c*x+s*z, y, -s*x+c*z]


def add(a, b):
    return [x+y for x,y in zip(a,b)]


def mul(a, factor):
    return [v*factor for v in a]


def facing(point, value, contract):
    angle = 180 - contract['direction2DDataValues'][value]*90
    return add([.5,0,.5], ry(add(point,[-.5,0,-.5]),angle))


def java_point(vertex, case, contract):
    name, slot, f = case['family'], case['slot'], case['facing']
    p = mul(vertex, 1/16)
    centered = add(p,[-.5,0,-.5])
    if name == 'holder':
        c = contract[name]
        p = add(c['xyz'], ry(rx(mul(centered,c['scale']),c['xRot']),c['yRot']))
    elif name == 'cellar_cabinet':
        c = contract[name]
        p = add([c['xStart']+(slot%3)*c['xStep'],c['yStart']+(slot//3)*c['yStep'],c['z']],rx(mul(centered,c['scale']),c['xRot']))
    elif name == 'tilted_rack':
        c = contract[name]
        t = add(c['translationStart'],mul(c['translationStep'],slot))
        # TiltedRack is S*T*Rx*vertex; unlike Storage.renderStack it has no
        # translate(-.5,0,-.5). The JS helper offset accounts for that centre.
        p = mul(add(t,rx(p,c['xRot'])),c['scale'])
    elif name == 'circular_rack':
        c = contract[name]
        x,z,yrot = c['slots'][slot]
        p = add([x,c['y'],z],ry(mul(centered,c['scale']),yrot))
    else:
        c = contract['bar_cabinet']
        dx = 0 if case['single'] else c['sideOffset']*(1 if case['side']=='left' else -1)*(1 if f in (0,2) else -1)
        p = add([.5+dx,c['y'],.5],mul(centered,c['scale']))
    return facing(p,f,contract)


def bedrock_point(vertex, case, client, geometry, animations):
    # Input is a converted model vertex in Bedrock's model coordinates.
    p = [-vertex[0]/16,vertex[1]/16,vertex[2]/16]
    pivot = geometry['bones'][0]['pivot']
    pivot = [-pivot[0]/16,pivot[1]/16,pivot[2]/16]
    rotation = 0
    for alias in client.get('scripts',{}).get('animate',[]):
        assert isinstance(alias,str),'Conditional animation needs explicit audit'
        bone = animations[client['animations'][alias]]['bones'].get('root',{})
        assert set(bone) <= {'rotation'},'Unexpected storage bone translation/scale'
        rot = bone.get('rotation',[0,0,0])
        assert rot[1:] == [0,0], 'Unexpected second yaw source'
        rotation += rot[0]
    # Bone rotation is about its declared pivot, then whole-entity scale/yaw.
    p = add(pivot,rx(add(p,mul(pivot,-1)),rotation))
    p = mul(p,float(client['scripts']['scale']))
    p = ry(p,-case['pose']['rotation']['y'])
    o=case['pose']['offset']
    return add([o['x'],o['y'],o['z']],p)


NODE_SNAPSHOT = r"""
import {HOLDER_KINDS,STORAGE_BOTTLE_KINDS,holderItem,holderVisualPose} from './runtime/BP/scripts/core/holder.js';
import {cellarCabinetItem,cellarCabinetVisualPose} from './runtime/BP/scripts/core/cellar-cabinet.js';
import {tiltedRackItem,tiltedRackVisualPose} from './runtime/BP/scripts/core/tilted-rack.js';
import {circularRackItem,circularRackVisualPose} from './runtime/BP/scripts/core/circular-rack.js';
import {barCabinetItem,barCabinetVisualPose} from './runtime/BP/scripts/core/bar-cabinet.js';
const poses=[];
for(let facing=0;facing<4;facing++){
 poses.push({family:'holder',slot:0,facing,pose:holderVisualPose(facing)});
 for(const [family,count,fn] of [['cellar_cabinet',9,cellarCabinetVisualPose],['tilted_rack',3,tiltedRackVisualPose],['circular_rack',6,circularRackVisualPose]])
  for(let slot=0;slot<count;slot++)poses.push({family,slot,facing,pose:fn(slot,facing)});
 for(const family of ['bar_cabinet','glass_bar_cabinet'])for(const [side,single] of [['left',false],['right',false],['left',true]])
  poses.push({family,slot:0,side,single,facing,pose:barCabinetVisualPose(side,single,facing)});
}
const classify={holder:holderItem,cellar_cabinet:cellarCabinetItem,tilted_rack:tiltedRackItem,circular_rack:circularRackItem,bar_cabinet:barCabinetItem};
const accepted=Object.fromEntries(Object.entries(classify).map(([family,fn])=>[family,Object.fromEntries(['molotov','watermelon_juice','wine_q1','wine_q6','brandy_q1','vodka_q6','empty_bottle'].map(base=>[base,fn('kaleidoscope_tavern:'+base)??null]))]));
console.log(JSON.stringify({poses,accepted,compact:HOLDER_KINDS,general:STORAGE_BOTTLE_KINDS}));
"""


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--java-source',type=Path)
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    contract=read(ROOT/'data/storage-render-source.json')
    if args.java_source:
        for path,digest in contract['sources'].items():
            # SHA-256 pins repository blob bytes, not a checkout's CRLF setting.
            raw=(args.java_source/path).read_bytes().replace(b'\r\n',b'\n')
            assert hashlib.sha256(raw).hexdigest()==digest,('Upstream source changed',path)
    snap=json.loads(subprocess.check_output(['node','--input-type=module','-e',NODE_SNAPSHOT],cwd=ROOT,text=True))
    for table in ('compact','general'):
        assert snap[table]==contract['previousKinds'][table]+['watermelon_juice'],'Existing display indices must not change'
    assert snap['compact'][15:]==['molotov','watermelon_juice']
    assert snap['general'][25:]==['molotov','watermelon_juice']
    for family, values in snap['accepted'].items():
        compact=family in ('holder','cellar_cabinet')
        assert values['molotov']['kind']==(16 if compact else 26)
        assert values['watermelon_juice']['kind']==(17 if compact else 27)
        assert values['watermelon_juice']['id']=='kaleidoscope_tavern:watermelon_juice'
        assert values['wine_q1']['kind']==values['wine_q6']['kind']==15
        if family in ('holder','cellar_cabinet','tilted_rack'):
            assert values['brandy_q1'] is None
        else:
            assert values['brandy_q1']['kind']==16
    geometry={g['description']['identifier']:g for p in (RP/'models/entity').glob('*.json') for g in read(p)['minecraft:geometry']}
    animations={k:v for p in (RP/'animations').glob('*.json') for k,v in read(p).get('animations',{}).items()}
    clients={family:read(RP/f'entity/runtime_{family}_bottle_visual.entity.json')['minecraft:client_entity']['description'] for family in snap['accepted']}
    clients['glass_bar_cabinet']=clients['bar_cabinet']
    checked_bindings=0
    for family,client in clients.items():
        for kind,identifier in client['geometry'].items():
            g=geometry[identifier]
            assert g['bones'][0]['name']=='root' and g['bones'][0]['pivot']==[0,0,0],(family,kind,'Storage pivot must be at bottle base')
            assert not g['bones'][0].get('parent') and not g['bones'][0].get('rotation')
            assert (RP/(client['textures'][kind]+'.png')).exists()
            checked_bindings+=1
        adapter=(RT/'BP/scripts/bedrock'/((family if family!='glass_bar_cabinet' else 'bar_cabinet').replace('_','-')+'.js')).read_text()
        assert 'e.setRotation(pose.rotation)' not in adapter, (family,'Pitch must have one owner')
        assert 'e.setRotation({x:0,y:pose.rotation.y})' in adapter
    original=read(RP/'models/entity/molotov.geo.json')['minecraft:geometry'][0]
    actual=geometry['geometry.kt_runtime.storage_molotov']
    expected=copy.deepcopy(original)
    expected['description']['identifier']='geometry.kt_runtime.storage_molotov'
    expected['bones'][0]['pivot']=[0,0,0]
    assert actual==expected,'Only storage identifier and root pivot may differ'
    points={}
    for model in ('molotov','watermelon_juice'):
        client=clients['holder'];kind='kind_'+str(snap['compact'].index(model)+1)
        g=geometry[client['geometry'][kind]]
        boxes=contract['models'][model]['boxes']
        assert len(boxes)==len(g['bones'][0]['cubes'])
        points[model]=[]
        for (lo,hi),cube in zip(boxes,g['bones'][0]['cubes']):
            assert cube['origin']==[8-hi[0],lo[1],lo[2]-8]
            assert cube['size']==[b-a for a,b in zip(lo,hi)]
            assert not cube.get('rotation'),'Rotated source element needs explicit conversion'
            for jv in itertools.product(*zip(lo,hi)):
                bv=[8-jv[0],jv[1],jv[2]-8]
                points[model].append((list(jv),bv))
    maximum=0.0;checks=0;regression=0.0
    for case in snap['poses']:
        client=clients[case['family']]
        compact=case['family'] in ('holder','cellar_cabinet')
        table=snap['compact' if compact else 'general']
        for model,vertices in points.items():
            g=geometry[client['geometry']['kind_'+str(table.index(model)+1)]]
            for jv,bv in vertices:
                expected=java_point(jv,case,contract)
                actual=bedrock_point(bv,case,client,g,animations)
                delta=max(abs(a-b) for a,b in zip(expected,actual))
                maximum=max(maximum,delta)
                assert delta<1e-12,(case,model,jv,expected,actual)
                checks+=1
            if model=='molotov' and case['family']=='cellar_cabinet':
                old=bedrock_point(vertices[0][1],case,client,original,animations)
                fixed=bedrock_point(vertices[0][1],case,client,g,animations)
                regression=max(regression,math.dist(old,fixed))
    assert abs(regression-math.sqrt(.5))<1e-12,'Negative fixture must detect original half-block pivot displacement'
    for path,digest in contract.get('preservedSha256',{}).items():
        assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==digest,('Unrelated asset/gameplay changed',path)
    preserved_count=len(contract.get('preservedSha256',{}))
    for prefix,expected in contract.get('preservedTrees',{}).items():
        hashes={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/prefix).rglob('*') if p.is_file()}
        rows=''.join(k+'\0'+v+'\n' for k,v in sorted(hashes.items()))
        assert len(hashes)==expected['files'] and hashlib.sha256(rows.encode()).hexdigest()==expected['sha256'],('Unrelated asset tree changed',prefix)
        preserved_count+=len(hashes)
    report={'upstreamCommit':contract['upstreamCommit'],'upstreamFilesVerified':len(contract['sources']) if args.java_source else 0,
            'familyVariants':6,'facings':4,'poseCases':len(snap['poses']),'modelPoseCases':len(snap['poses'])*len(points),
            'vertexComparisons':checks,'maxCoordinateErrorBlocks':maximum,'checkedModelBindings':checked_bindings,
            'oldCellarMolotovPivotErrorBlocks':regression,'preservedFiles':preserved_count,
            'watermelonKinds':{'compact':17,'general':27},'playerSimulation':False,'bdsTest':'NOT_RUN','clientVisualTest':'NOT_RUN'}
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))


if __name__=='__main__':
    main()
