"""Resource/pose checks only; these do not simulate a player or prove rendering."""
from pathlib import Path
import json,math

def check(root):
    data=json.loads((root/'runtime/RP/animations/runtime_shaker.animation.json').read_text())['animations']
    shake=data['animation.kt_mixology.player_shake']
    assert not shake.get('override_previous_animation',False), 'Must not reset the first-person arm'
    rotations=shake['bones']['rightarm']['rotation']
    assert rotations==[
        'v.is_first_person ? 0 : (-112.5 - 45 * math.sin(q.life_time * 1718.87338539247) - this)',
        'v.is_first_person ? 0 : -this',
        'v.is_first_person ? 0 : (-9 - this)'], 'Perspective guard and target-minus-current are required for each axis'
    # Evaluate the exact shipped restricted expressions, not an independent target implementation.
    def evaluate(expr,first,seconds,current):
        guard,branches=expr.split(' ? ');yes,no=branches.split(' : ')
        assert guard=='v.is_first_person'
        expression=(yes if first else no).replace('q.life_time','seconds').replace('math.sin','sin_degrees').replace('this','current')
        return eval(expression,{'__builtins__':{}},{'seconds':seconds,'current':current,'sin_degrees':lambda x:math.sin(math.radians(x))})
    cases=0
    for tick in range(112):
        seconds=tick/20
        target=[-112.5-45*math.sin(tick*1.5),0,-9]
        for pose in ([0,0,0],[27,-39,-159],[-90,40,10]):
            for axis,expr in enumerate(rotations):
                assert evaluate(expr,True,seconds,pose[axis])==0
                assert math.isclose(pose[axis]+evaluate(expr,False,seconds,pose[axis]),target[axis],abs_tol=1e-9)
                cases+=1
    attach=json.loads((root/'runtime/RP/attachables/shaker.attachable.json').read_text())['minecraft:attachable']['description']
    assert attach['animations']['shake_first']=='animation.kt_mixology.shake_first'
    assert any('c.is_first_person' in a.get('shake_first','') for a in attach['scripts']['animate'])
    from shaker_held_frames import expected,selectors
    for name,body in expected().items():assert data[name]==body,name
    geometry=json.loads((root/'runtime/RP/models/entity/runtime_shaker_held.geo.json').read_text())['minecraft:geometry'][0]
    bones={b['name']:b for b in geometry['bones']}
    assert bones['grip']['binding']=='q.item_slot_to_bone_name(c.item_slot)'
    assert bones['grip']['pivot']==[0,24,0]
    expected_selectors=selectors()
    variants=list((root/'runtime/RP/attachables').glob('shaker*.attachable.json'))
    assert len(variants)==3
    for path in variants:
        description=json.loads(path.read_text())['minecraft:attachable']['description']
        assert description['scripts']['animate']==expected_selectors,path
        assert description['geometry']['default']==geometry['description']['identifier'],path
        assert description['animations']=={alias:'animation.kt_mixology.'+alias for alias in ('hold_first','hold_third','shake_first')},path
        for animation in description['animations'].values():
            assert animation in data,path
            assert set(data[animation]['bones'])<=set(bones),path
    immersion=(root/'runtime/BP/scripts/bedrock/immersion.js').read_text()
    mixology=(root/'runtime/BP/scripts/bedrock/mixology.js').read_text()
    assert 'playShakerPour' not in mixology and 'player_pour' not in immersion
    assert not (root/'runtime/RP/animations/runtime_shaker_pour.animation.json').exists()
    assert "cocktailEffect(block,20)" in mixology and "'bottle.fill'" in mixology
    assert not (root/'runtime/RP/entity/player.entity.json').exists()
    patch=root/'integrations/shaker-first-person/RP/animations/runtime_shaker.animation.json'
    assert not patch.exists(), 'Integrated first-person repair must not ship a shadowing overlay'
    return {'poseCases':cases,'firstPersonArmDelta':0,'thirdPersonJavaTargetPreserved':True,'clientTested':False,'simulatedPlayers':False}

if __name__=='__main__':print(json.dumps(check(Path(__file__).resolve().parents[1]),ensure_ascii=False))
