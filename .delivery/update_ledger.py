from pathlib import Path
import json,hashlib,sys
R=Path.cwd();B=R/'.source-check/integration-baseline'
sys.path.insert(0,str(R/'tools'))
from creative.historical import LegacyMenuProjection
proj=LegacyMenuProjection(B);p=R/'data/launch-repair-reference.json';ref=json.loads(p.read_text())
sha=lambda x:hashlib.sha256(x).hexdigest()
reasons={
 'scripts/bedrock/machines.js':'M01/M03/M04: bind the real barrel callback to 97 ticks; direct generic carrier/block output transactions with position identity and rollback; retain FX.',
 'scripts/core/machines.js':'M01/M02: shared 97-tick constant and ordinary ingredient acceptance; preserve capacity, liquid, locking and vinegar fallback rules.',
 'scripts/bedrock/combat-effects.js':'M05: source-AABB/ray selection, Adventure caster, PvP/immune mode gate, additive post-hurt knockback and no arbitrary target cap.',
 'scripts/core/combat-effects.js':'PR91: explicit PvP-on survival/adventure target policy, native damage refusal preserved.',
 'scripts/bedrock/custom-effects.js':'M09/M11: real-orb AABB collection and original velocity, native surface destination; actual EffectType.getName capability detection and Grumm nameplate; native cooldown/aggro/step limits explicit.',
 'scripts/core/custom-effects.js':'M09: XP direction and feet-distance speed match pinned Java; PR91 diagnostics preserve native limitations.',
 'scripts/bedrock/molotov.js':'M12: eliminate non-air support shortcut; distinguish ordinary/soul fire, side flammability, slab/top states and waterlogged neighbours via explicit scoped adapter.',
 'scripts/data/guide-catalog.js':'Canonical product guide records corrected clock, tap/PvP rules and unresolved native effect semantics; retains seven entrances and shared Cookery renderer.',
}
changed=[]
for q in (R/'runtime').rglob('*'):
 if not q.is_file():continue
 name=q.relative_to(R).as_posix();old=B/name;digest=sha(q.read_bytes())
 if old.exists():
  before=sha(old.read_bytes())
  if digest!=before:
   row=ref['reviewedChanges'].get(name)
   reason=next((v for k,v in reasons.items() if name.endswith(k)), 'PR91 reviewed source-backed multi-collision geometry / explicit Tipsy opt-in policy, or 0.6.64 self-pack version metadata; preserve previous independent repairs.')
   if row:
    assert row['before']==before,(name,'historical before changed')
    if row['after']!=digest:row['after']=digest;row['reason']+='; 0.6.64: '+reason;changed.append(name)
   else:
    ref['reviewedChanges'][name]={'before':before,'beforeProjected':sha(proj.read_bytes(old)),'after':digest,'reason':reason};changed.append(name)
  elif name in ref['reviewedChanges']:
   del ref['reviewedChanges'][name]
 else:
  if ref['newRuntimeFiles'].get(name)!=digest:ref['newRuntimeFiles'][name]=digest;changed.append(name)
p.write_text(json.dumps(ref,ensure_ascii=False,indent=2)+'\n')
print('Newly audited runtime modifications/additions:',len(changed));print('\n'.join(changed))
