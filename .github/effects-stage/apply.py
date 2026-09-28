#!/usr/bin/env python3
"""One-time exact-source effect patch materializer for its audit branch only.
Runtime bytes are verified against the tested local snapshot. Independent CI
then verifies original per-file anchors against the cedfaedf baseline.
"""
import base64,hashlib,json,lzma,subprocess
from pathlib import Path
R=Path.cwd()
BASE='6faf144597b065d4b857ad00a1aadf81b682b2cd'
PRIOR='336e3ccb3dc1347ef01397686ece4932043a0129'
PATCH_SHA='9d3873343362d742254872cb595fa106c3acfe4e4ec7639abd10404bbd59d296'
RUNTIME_SHA='74e690371b0f2dbf09c7111acedf81ea25d113537230b2dcc38874269937a058'
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
def run(*a):subprocess.run(a,cwd=R,check=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def paths(ref):return set(git('ls-tree','-r','--name-only',ref,'runtime/').decode().splitlines())
subprocess.run(['git','merge-base','--is-ancestor',BASE,'HEAD'],cwd=R,check=True)
assert git('diff',BASE,'HEAD','--','runtime/')==b'', 'Runtime changed while staging: review instead of overwriting'
encoded=''.join((R/'.github/effects-stage'/f'{n}.txt').read_text().strip() for n in range(1,9))
compressed=base64.b64decode(encoded,validate=True)
assert sha(compressed)==PATCH_SHA,'Staged patch checksum mismatch'
patch=Path('../effects-followup.patch');patch.write_bytes(lzma.decompress(compressed))
run('git','apply','--unidiff-zero','--check',str(patch))
run('git','apply','--unidiff-zero',str(patch))
run('python','tools/effects/build_interaction_particles.py','--reference','../vanilla-reference')
run('python','tools/effects/build_item_particle_atlas.py','--java','../java')
current={p.relative_to(R).as_posix() for p in (R/'runtime').rglob('*') if p.is_file()}
digest=sha(''.join(n+'\0'+sha((R/n).read_bytes())+'\n' for n in sorted(current)).encode())
assert digest==RUNTIME_SHA,('Regenerated runtime differs from tested snapshot',digest)
previous=paths(PRIOR)
assert previous<=current,'No removal authorized by this effects patch'
changed=[n for n in sorted(previous) if git('show',PRIOR+':'+n)!=(R/n).read_bytes()]
added=sorted(current-previous)
assert len(changed)==53 and len(added)==184,(len(changed),len(added))
host=set('circular-rack combat-effects cultivation custom-effects decorations display-projectiles furniture immersion machines mixology molotov pressing-feedback storage-projectile tap-sources writing-boards'.split())
def reason(n):
 if n=='runtime/BP/entities/thrown_drink.json':return 'Remove duplicate impact sound; source-shaped potion event owns audio'
 if n.startswith('runtime/BP/scripts/bedrock/') and Path(n).stem in host:return 'Source-derived post-commit feedback, isolated cosmetic failures and real splash lifecycle; preserves PR93 carrier repair'
 if n.startswith('runtime/BP/scripts/core/') and Path(n).stem in {'extension-content','extension-foundation'}:return 'Optional namespace-scoped external item particle registration'
 if n.startswith('runtime/RP/particles/') and ('incense' in n or 'tap_drip' in n):return 'Pinned Java constructors, finite per-sample emission and source 20Hz dynamics'
 if n=='runtime/RP/sounds/sound_definitions.json':return 'Three source-verified sound aliases and four reviewed audio assets'
 raise ValueError('Out-of-scope existing file: '+n)
def allow_new(n):
 if n.startswith(('runtime/RP/particles/fx_','runtime/RP/textures/kaleidoscope_tavern/particle/','runtime/RP/sounds/kaleidoscope_tavern/feedback/')):return
 if n.startswith('runtime/BP/scripts/') and Path(n).name in {'effect-feedback.js','interaction-particles.js','java-ambient.js','java-ambient-sampling.js','item-particles.js','item-particle-sprites.js'}:return
 raise ValueError('Out-of-scope added file: '+n)
ledger=R/'data/launch-repair-reference.json';ref=json.loads(ledger.read_text());original=json.loads(git('show',BASE+':data/launch-repair-reference.json'))
for n in changed:
 why='2026-09-28 effects review: '+reason(n)+'. See docs/EFFECTS-REPORT-FOLLOWUP-20260928.md.'
 after=sha((R/n).read_bytes())
 if n in ref['newRuntimeFiles']:ref['newRuntimeFiles'][n]=after
 elif n in ref['reviewedChanges']:
  row=ref['reviewedChanges'][n];row['after']=after;row['reason']+=' '+why
 else:
  before=sha(git('show',PRIOR+':'+n));ref['reviewedChanges'][n]={'before':before,'beforeProjected':before,'after':after,'reason':why}
for n in added:allow_new(n);ref['newRuntimeFiles'][n]=sha((R/n).read_bytes())
for n,row in original['reviewedChanges'].items():
 assert ref['reviewedChanges'][n]['before']==row['before']
 assert ref['reviewedChanges'][n]['beforeProjected']==row['beforeProjected']
assert ref['baselineCommit']==original['baselineCommit']
ledger.write_text(json.dumps(ref,ensure_ascii=False,indent=2)+'\n')
print('Exact runtime digest verified:',digest)
print('Explicit review: 53 existing, 184 new files; original before anchors retained')
