"""Source-preserving geometry and either-sided overlap regression tests."""
import base64,copy,gzip,hashlib,json
from pathlib import Path
from drink_surface_math import conflicts
from normalize_luminous_base import normalize
ROOT=Path(__file__).resolve().parents[1]

def main():
    # A reverse-facing coplanar pair is invisible to the old one-sided audit.
    uv={'uv':[0,0],'uv_size':[2,2]}
    fixture={'bones':[{'name':'root','pivot':[0,0,0],'cubes':[
        {'origin':[0,0,0],'size':[2,2,0],'uv':{'north':uv}},
        {'origin':[0,0,0],'size':[2,2,0],'uv':{'south':uv}}
    ]}]}
    assert not conflicts(fixture)
    assert len(conflicts(fixture,two_sided=True))==1
    review=json.loads((ROOT/'data/luminous-base-review.json').read_text())
    trimmed=0
    for count in range(1,5):
        name=f'runtime/RP/models/entity/luminous_bride_{count}.geo.json'
        row=review['files'][name]
        raw=gzip.decompress(base64.b64decode(row['beforeGzipBase64']))
        assert hashlib.sha256(raw).hexdigest()==row['before']
        original=json.loads(raw);actual=json.loads((ROOT/name).read_text())
        assert len(conflicts(original['minecraft:geometry'][0],two_sided=True))==2*count
        expected=copy.deepcopy(original)
        assert normalize(expected)==4*count
        assert actual==expected,'Only occluded shell strips may change'
        assert normalize(copy.deepcopy(actual))==0
        assert not conflicts(actual['minecraft:geometry'][0],two_sided=True)
        assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==row['after']
        for ob,ab in zip(original['minecraft:geometry'][0]['bones'],actual['minecraft:geometry'][0]['bones']):
            for old,new in zip(ob.get('cubes',[]),ab.get('cubes',[])):
                if old==new:continue
                assert new['origin'][1]==1.1 and new['size'][1]==10
                assert old['origin'][1]+old['size'][1]==new['origin'][1]+new['size'][1]
                assert old.get('pivot')==new.get('pivot') and old.get('rotation')==new.get('rotation')
                for face,uv0 in old['uv'].items():
                    uv1=new['uv'][face]
                    assert uv1['uv']==uv0['uv'] and uv1['uv_size'][0]==uv0['uv_size'][0]
                    assert uv1['uv_size'][1]/new['size'][1]==uv0['uv_size'][1]/old['size'][1]
                    dx=-.0625 if face=='east' else .0625 if face=='west' else 0
                    assert abs(new['origin'][0]-old['origin'][0]-dx)<1e-8
                    assert new['origin'][2]==old['origin'][2]
                    assert new['size'][::2]==old['size'][::2]
                trimmed+=1
    assert trimmed==40
    editor=json.loads((ROOT/'data/blockbench-luminous-roundtrip.json').read_text())
    exported=ROOT/editor['export']
    assert hashlib.sha256(exported.read_bytes()).hexdigest()==editor['export_sha256']
    assert json.loads(exported.read_text())['minecraft:geometry']==json.loads((ROOT/'runtime/RP/models/entity/luminous_bride_1.geo.json').read_text())['minecraft:geometry']
    print(json.dumps({'meshes':4,'croppedOccludedStrips':trimmed,'remainingEitherSidedOverlaps':0,'visibleTexelScalePreserved':True,'idempotent':True,'clientAcceptance':False}))

if __name__=='__main__':main()
