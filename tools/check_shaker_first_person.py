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
    assert data['animation.kt_mixology.shake_first']['bones']['grip']['position'][1]=='-2.4 * math.sin(q.life_time * 1718.87338539247)'
    assert not (root/'runtime/RP/entity/player.entity.json').exists()
    patch=root/'integrations/shaker-first-person/RP/animations/runtime_shaker.animation.json'
    assert json.loads(patch.read_text())['animations']==data
    return {'poseCases':cases,'firstPersonArmDelta':0,'thirdPersonJavaTargetPreserved':True,'clientTested':False,'simulatedPlayers':False}

if __name__=='__main__':print(json.dumps(check(Path(__file__).resolve().parents[1]),ensure_ascii=False))
