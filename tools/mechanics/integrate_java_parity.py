#!/usr/bin/env python3
"""Reviewed PR91 integration. Unknown conflicts fail; no projectile integration."""
from pathlib import Path
import copy
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
TARGET = 'b121a48733d1cfa5cbb8f55b519b8a79de5c3194'
LEDGER = 'data/launch-repair-reference.json'
MISSING = object()

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

def load(ref, path):
    return json.loads(git('show', f'{ref}:{path}'))

def write(path, value):
    (ROOT / path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def merge_json(base, left, right, at='root'):
    if left == right: return copy.deepcopy(left)
    if left == base: return copy.deepcopy(right)
    if right == base: return copy.deepcopy(left)
    if all(isinstance(x, list) for x in (base, left, right)) and all(x in left and x in right for x in base):
        out = copy.deepcopy(left)
        for x in right:
            if x not in out: out.append(copy.deepcopy(x))
        return out
    if all(isinstance(x, dict) for x in (base, left, right)):
        out = {}
        for key in sorted(base.keys() | left.keys() | right.keys()):
            a, b, c = base.get(key, MISSING), left.get(key, MISSING), right.get(key, MISSING)
            if b is MISSING and c is MISSING: continue
            if b is MISSING:
                if c == a: continue
                if a is not MISSING: raise RuntimeError(f'Delete/modify conflict: {at}/{key}')
                out[key] = copy.deepcopy(c)
            elif c is MISSING:
                if b == a: continue
                if a is not MISSING: raise RuntimeError(f'Modify/delete conflict: {at}/{key}')
                out[key] = copy.deepcopy(b)
            elif a is MISSING:
                if b != c: raise RuntimeError(f'Independent new JSON values: {at}/{key}')
                out[key] = copy.deepcopy(b)
            else: out[key] = merge_json(a, b, c, at + '/' + key)
        return out
    raise RuntimeError(f'Unreviewed JSON conflict: {at}')

def without_collision(doc):
    doc = copy.deepcopy(doc); block = doc['minecraft:block']
    for component in ('minecraft:collision_box', 'minecraft:selection_box'):
        block['components'].pop(component, None)
    keep = []
    for row in block.get('permutations', []):
        for component in ('minecraft:collision_box', 'minecraft:selection_box'):
            row['components'].pop(component, None)
        if row['components']: keep.append(row)
    if keep: block['permutations'] = keep
    else: block.pop('permutations', None)
    return doc

def resolve_text(path, count, combine=False):
    text = (ROOT/path).read_text()
    pattern = re.compile(r'^<<<<<<< HEAD\n(.*?)^=======\n(.*?)^>>>>>>> '+TARGET+r'\n', re.M|re.S)
    text, found = pattern.subn(lambda m: m[1] + (m[2] if combine else ''), text)
    assert found == count, ('Unexpected conflict count', path, found)
    assert not re.search(r'^(<<<<<<<|=======|>>>>>>>)', text, re.M), path
    (ROOT/path).write_text(text); git('add', path)

def main():
    ours = git('rev-parse', 'HEAD').decode().strip()
    base = git('merge-base', ours, TARGET).decode().strip()
    allowed = set(git('diff', '--name-only', base, TARGET, '--', 'runtime').decode().splitlines())
    assert all(p.startswith('runtime/') and '..' not in Path(p).parts for p in allowed)
    assert not any(p.endswith('/display-projectiles.js') for p in allowed)
    original_runtime = {p.relative_to(ROOT).as_posix(): p.read_bytes() for p in (ROOT/'runtime').rglob('*') if p.is_file()}
    before_ledger = load(ours, LEDGER)
    result = subprocess.run(['git', 'merge', '--no-ff', '--no-commit', TARGET], cwd=ROOT)
    if result.returncode not in (0, 1): raise RuntimeError('Git merge failed')
    conflicts = set(git('diff', '--name-only', '--diff-filter=U').decode().splitlines())
    for path in ('package.json', 'release.json', 'runtime/BP/manifest.json', 'runtime/RP/manifest.json'):
        if path in conflicts:
            (ROOT/path).write_bytes(git('show', f'{ours}:{path}'))
            git('add', path); conflicts.remove(path)
    # Do not overwrite already-recorded historical 0.6.54 evidence. Keep the
    # alternative PR91 evidence under an explicitly identified archive directory.
    for name in ('LAUNCH-VALIDATION-0.6.54.json', 'MOTION-STATIC-0.6.54.json', 'RELEASE-NOTES-0.6.54.md'):
        path = 'docs/'+name
        assert path in conflicts
        archive = ROOT/'docs/pr91-original-evidence'/name
        archive.parent.mkdir(parents=True, exist_ok=True)
        archive.write_bytes(git('show', f'{TARGET}:{path}'))
        (ROOT/path).write_bytes(git('show', f'{ours}:{path}'))
        git('add', path, archive.relative_to(ROOT).as_posix()); conflicts.remove(path)
    # Current legacy pages derive from the authoritative Cookery chapter. Restore
    # that projection rather than reviving PR91's obsolete independent guide.
    path = 'runtime/BP/scripts/data/mixology-pages.js'
    assert path in conflicts
    (ROOT/path).write_bytes(original_runtime[path]); git('add', path); conflicts.remove(path)
    for path, count, combine in [
        ('runtime/BP/scripts/data/cookery-guide-payload.js',1,False),
        ('runtime/BP/scripts/main.js',2,False),
        ('tools/check_guide.mjs',1,True),
        ('tools/check_release.py',1,True),
        ('tools/check_motion.py',1,False),
    ]:
        assert path in conflicts
        resolve_text(path,count,combine); conflicts.remove(path)
    path = 'tools/check_motion.py'
    text = (ROOT/path).read_text()
    assert text.count("'aimChangesSlightly':True") == 1
    (ROOT/path).write_text(text.replace("'aimChangesSlightly':True", "'aimChangesByDefault':False,'aimChangesWhenOptedIn':True")); git('add',path)
    path = 'runtime/BP/scripts/data/guide-catalog.js'
    assert path in conflicts
    left = original_runtime[path].decode(); right = git('show',f'{TARGET}:{path}').decode()
    start = ' // Explain differences that affect the player\'s choice of drink.'
    marker = ' const result=organizeGuideNavigation(payload);'
    assert right.count(start)==1 and left.count(marker)==1 and right.count(marker)==1
    addition = right[right.index(start):right.index(marker)]
    (ROOT/path).write_text(left.replace(marker, addition+marker)); git('add',path); conflicts.remove(path)
    collision_paths = [p for p in allowed if p.startswith('runtime/BP/blocks/')]
    for path in collision_paths:
        (ROOT/path).write_bytes(original_runtime[path])
        if path in conflicts: git('add', path); conflicts.remove(path)
    subprocess.run(['python','tools/java_collision.py','--write','--java-source','.source-check/java'],cwd=ROOT,check=True)
    for path in collision_paths:
        assert without_collision(json.loads(original_runtime[path])) == without_collision(json.loads((ROOT/path).read_bytes())), ('Unrelated block component changed', path)
        git('add',path)
    combat = 'runtime/BP/scripts/bedrock/combat-effects.js'
    text = original_runtime[combat].decode()
    replacements = [
        ('Player damage is deliberately disabled; native damage checks remain authoritative.','Player damage respects PvP and native damage checks.'),
        ('import {system,EntityDamageCause,GameMode}','import {world,system,EntityDamageCause,GameMode}'),
        ('shriekImpulse,shriekParticles}','shriekImpulse,shriekParticles,shriekPlayerTargetAllowed}'),
        ('playerDamage:false',"playerDamage:'world_pvp_rule'"),
        ('[GameMode.Spectator,GameMode.Adventure].includes(player.getGameMode())','player.getGameMode()===GameMode.Spectator'),
        ('// Own helpers and all players are excluded. This is explicit PvE-only adaptation, NOT PvP parity.','// Helpers cannot take damage. Check PvP explicitly before damage or impulse.'),
        ("e.id===player.id||e.typeId==='minecraft:player'||e.typeId.startsWith",'e.id===player.id||e.typeId.startsWith'),
        ("e.hasTag?.('kaleidoscope_tavern:visual_helper'))continue;","e.hasTag?.('kaleidoscope_tavern:visual_helper'))continue;\n  if(e.typeId==='minecraft:player'&&!shriekPlayerTargetAllowed(world.gameRules.pvp,e.getGameMode()))continue;"),
    ]
    for old,new in replacements:
        if text.count(old)!=1: raise RuntimeError(f'Combat source moved: {old}')
        text=text.replace(old,new)
    (ROOT/combat).write_text(text); git('add',combat); conflicts.discard(combat)
    conflicts.discard(LEDGER)
    if conflicts:
        print('UNRESOLVED SOURCE CONFLICTS:', '\n'.join(sorted(conflicts)),flush=True)
        raise RuntimeError('Unknown conflicts require review; nothing is committed or pushed')
    after_runtime={p.relative_to(ROOT).as_posix():p.read_bytes() for p in (ROOT/'runtime').rglob('*') if p.is_file()}
    changed={p for p in original_runtime.keys()|after_runtime.keys() if original_runtime.get(p)!=after_runtime.get(p)}
    assert changed<=allowed, ('Undeclared runtime changes',sorted(changed-allowed))
    old,left,right=load(base,LEDGER),before_ledger,load(TARGET,LEDGER)
    other=lambda obj:{k:v for k,v in obj.items() if k not in ('reviewedChanges','newRuntimeFiles')}
    ledger=merge_json(other(old),other(left),other(right)); ledger['reviewedChanges']={}
    for path in sorted(left['reviewedChanges'].keys()|right['reviewedChanges'].keys()):
        a,b=left['reviewedChanges'].get(path),right['reviewedChanges'].get(path)
        if a and b: assert a['before']==b['before'] and a['beforeProjected']==b['beforeProjected'], ('Historical proof conflict',path)
        row=copy.deepcopy(a or b); actual=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
        if path not in changed: assert a and actual==a['after'], ('Unrelated historical source change',path)
        else: row['reason']=' '.join(dict.fromkeys(x['reason'] for x in (a,b) if x))+' Reconciled PR91 with current source; original historical before hashes preserved.'
        row['after']=actual; ledger['reviewedChanges'][path]=row
    ledger['newRuntimeFiles']=dict(left['newRuntimeFiles'])
    for path,digest in right['newRuntimeFiles'].items():
        if path not in ledger['newRuntimeFiles']: ledger['newRuntimeFiles'][path]=digest
    for path,digest in list(ledger['newRuntimeFiles'].items()):
        actual=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
        if path in changed: ledger['newRuntimeFiles'][path]=actual
        else: assert actual==digest, ('Unrelated new runtime source change',path)
    write(LEDGER,ledger); git('add',LEDGER)
    write('data/parity-integration-20260929.json',{'ours':ours,'mergedOriginalPr91Head':TARGET,'mergeBase':base,'changedRuntimePaths':sorted(changed),'historicalAuditBeforePreserved':True,'projectileIntegrationIncluded':False,'nativeBds':'NOT_RUN','clientAcceptance':'NOT_RUN','note':'Collision is Java union geometry; selection remains one enclosing Bedrock box. Opt-in yaw is not camera-only roll.'})
    git('add','data/parity-integration-20260929.json')
    print(f'Resolved reviewed parity merge; {len(changed)} runtime files; no unknown conflict or unrelated runtime change.')

if __name__=='__main__': main()
