#!/usr/bin/env python3
"""Bind a completed zero-player native probe to the exact current source packs.

Only the declared observer overlays and main.js import are allowed in the
staged host. Re-run after changed inputs instead of relabeling old proof.
Write new evidence beside the run; never replace historical repository proof.
"""
import argparse,collections,hashlib,json,math,pathlib,re,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from baseline_gate import fingerprint
from run_living_effects import render_world_liquor_probe_inputs

APPEND=b"\n// Disposable native observer; not release content.\nimport './living-effects-probe.js';\n"
PREFIX='[LIVING_EFFECT_QA] '
EVIDENCE_NAME='native-shaker-migration-evidence.json'
LOG_NAME='native-shaker-migration-evidence.log'
MAIN_OVERLAY_NOTE='Append only the declared disposable observer import after verifying the complete copied runtime.'
def digest(data):return hashlib.sha256(data).hexdigest()

def fields(row,names):
 assert isinstance(row,dict) and set(row)==set(names.split()),('unexpected/missing fields',row,names)

def same(actual,expected):
 # JSON equality keeps booleans distinct from 0/1 and binds nested log fields.
 assert json.dumps(actual,sort_keys=True,allow_nan=False)==json.dumps(expected,sort_keys=True,allow_nan=False),(actual,expected)

def number(value,minimum=None,maximum=None,integer=False):
 assert type(value) in ((int,) if integer else (int,float)) and math.isfinite(value),value
 assert minimum is None or value>=minimum,value
 assert maximum is None or value<=maximum,value

def registration(row,version):
 fields(row,'source version recipes pages shakerInputs')
 same(row['source'],'kaleidoscope_world_liquor');same(row['version'],version)
 for key in ('recipes','pages','shakerInputs'):number(row[key],0,integer=True)

def recipient(row,entity_type):
 fields(row,'type valid componentIds healthAvailable health families inanimate mob errors')
 same(row['type'],entity_type);assert type(row['valid']) is bool
 assert row['componentIds'] is None or (isinstance(row['componentIds'],list) and all(isinstance(x,str) for x in row['componentIds']))
 assert row['families'] is None or (isinstance(row['families'],list) and all(isinstance(x,str) for x in row['families']))
 for key in ('healthAvailable','inanimate','mob'):assert row[key] is None or type(row[key]) is bool
 assert isinstance(row['errors'],dict) and all(isinstance(k,str) and isinstance(v,str) for k,v in row['errors'].items())
 if row['health'] is not None:
  fields(row['health'],'currentValue effectiveMin effectiveMax')
  for value in row['health'].values():number(value)

def validate_observations(observations,phase,version):
 """Accept the complete current observer contract, not an arbitrary case count."""
 assert phase in ('first','restart') and isinstance(observations,list)
 assert all(isinstance(row,dict) and row.get('kind') in ('case','done') for row in observations),'unknown/failure observer kind'
 done=[row for row in observations if row['kind']=='done'];assert len(done)==1 and observations[-1] is done[0]
 fields(done[0],'kind phase players playerSessions client crossPackPrivateData addon_registration')
 for key,value in {'phase':phase,'players':0,'playerSessions':0,'client':False,'crossPackPrivateData':False}.items():same(done[0][key],value)
 registration(done[0]['addon_registration'],version)
 groups=collections.defaultdict(list)
 for row in observations[:-1]:
  assert row['kind']=='case' and isinstance(row.get('mode'),str)
  groups[row['mode']].append(row)
 migration='native-cross-id' if phase=='first' else 'saved-metadata'
 machine='native-machine-write' if phase=='first' else 'native-machine-restart-recovery'
 aura='native-aura-acquisition' if phase=='first' else 'native-aura-saved-restore'
 expected={name:1 for name in ('addon_registration','portable-stackable-ingredient-metadata',aura,
  'native-one-tick-invisibility-expiry','native-outline-registry','native-put-recovery','native-splash-rolled-heal',
  'native-splash-persisted-hook','native-splash-armor-stand-immunity','native-splash-cancelled-hurt',
  'native-vision-recipient-components','native-vision-living-class')}
 expected.update({migration:2,machine:2,'native-splash-hurt-source':2})
 if phase=='restart':expected['native-aura-foreign-handoff']=1
 same({mode:len(rows) for mode,rows in groups.items()},expected)
 def case(mode,names,index=0,legacy=False):
  row=groups[mode][index];fields(row,'kind mode '+('' if legacy else 'phase ')+names)
  if not legacy:same(row['phase'],phase)
  return row
 def values(row,**required):
  for key,value in required.items():same(row[key],value)
 addon=case('addon_registration','source version recipes pages shakerInputs')
 same({k:addon[k] for k in done[0]['addon_registration']},done[0]['addon_registration'])
 for index,lock in enumerate(('inventory','slot')):
  if phase=='first':
   row=case(migration,'source target lock adventureLists rawLore hostScopeDynamicTypes',index,True)
   values(row,source='kaleidoscope_tavern:shaker_'+('active' if index==0 else 'pouring'),target='kaleidoscope_tavern:shaker',lock=lock,rawLore=True,hostScopeDynamicTypes=4)
   # Native block-state expansion returned 10 entries for the three authored
   # IDs in prior BDS proof. The observer compares the complete before/after lists.
   number(row['adventureLists'],3,integer=True)
  else:
   row=case(migration,'slot lock',index,True);values(row,slot=index,lock=lock)
 row=case('portable-stackable-ingredient-metadata','ingredients nativeEquality independentClone fullArbitraryNBT')
 values(row,ingredients=3,nativeEquality=True,independentClone=True,fullArbitraryNBT=False)
 for index,(kind,counts) in enumerate((('pressing_tub',[11]),('barrel',[3,5,1,1]))):
  flag='hostScopeMetadata' if phase=='first' else 'completeNativeSlots'
  row=case(machine,'machineKind slots counts schema '+flag,index)
  values(row,machineKind=kind,slots=len(counts),counts=counts,schema=2,**{flag:True})
 row=case(aura,'duration ownLease'+(' nativeParticleFlagsReadable' if phase=='first' else ''))
 number(row['duration'],1,600,True);same(row['ownLease'],True)
 if phase=='first':same(row['nativeParticleFlagsReadable'],False)
 else:
  row=case('native-aura-foreign-handoff','duration ownLease nativeParticleFlagsReadable')
  number(row['duration'],796,800,True);values(row,ownLease=False,nativeParticleFlagsReadable=False)
 row=case('native-one-tick-invisibility-expiry','nativeTicksObserved scriptTicksWaited playerConcealmentVerified')
 number(row['nativeTicksObserved'],2,18,True);number(row['scriptTicksWaited'],1,60,True)
 same(row['playerConcealmentVerified'],False)
 outline=case('native-outline-registry','glowing client');assert type(outline['glowing']) is bool;same(outline['client'],False)
 row=case('native-put-recovery','activations idleCallbacksMeasured');values(row,activations=2,idleCallbacksMeasured=False)
 row=case('native-splash-rolled-heal','health effects eventEnvelope physicalImpact');values(row,health=6,effects=1,eventEnvelope='observer',physicalImpact=False)
 row=case('native-splash-persisted-hook','health rawAmount healAmount declaredThisPhase');values(row,health=5,rawAmount=0,healAmount=3,declaredThisPhase=phase=='first')
 row=case('native-splash-armor-stand-immunity','health effects');values(row,health=2,effects=0)
 for index,owned in enumerate((True,False)):
  row=case('native-splash-hurt-source','owned health event sourceMapping directProjectileRepresented',index)
  values(row,owned=owned,sourceMapping='magic_owner_only',directProjectileRepresented=False);number(row['health'],0)
  event=row['event'];fields(event,'target damage cause owner');values(event,damage=6,cause='magic')
  assert isinstance(event['target'],str) and event['target']
  if owned:assert isinstance(event['owner'],str) and event['owner']
  else:assert event['owner'] is None
 row=case('native-splash-cancelled-hurt','health apiAcknowledgements status actualHurtEvents acknowledgementIsDeliveredDamage')
 number(row['health'],0);assert row['status'] in ('APPLIED_NATIVE_INSTANT','NATIVE_HURT_REJECTED')
 values(row,apiAcknowledgements=1 if row['status']=='APPLIED_NATIVE_INSTANT' else 0,actualHurtEvents=0,acknowledgementIsDeliveredDamage=False)
 components=case('native-vision-recipient-components','immediateXp settledXp testOnlyHealthHelper cod')
 for key,entity_type in (('immediateXp','minecraft:xp_orb'),('settledXp','minecraft:xp_orb'),('testOnlyHealthHelper','living_effect_qa:health_helper'),('cod','minecraft:cod')):recipient(components[key],entity_type)
 helper,cod,xp=(components[k] for k in ('testOnlyHealthHelper','cod','settledXp'))
 for row in (helper,cod):
  values(row,valid=True,healthAvailable=True,mob=False);assert row['health'] is not None and row['health']['currentValue']>0
 same(helper['inanimate'],True);same(xp['valid'],True)
 row=case('native-vision-living-class','excluded excludedHasHealth excludedHealth excludedHasMobFamily testOnlyHealthWitness additionalExcluded xpHealthApiAvailable admitted codHasMobFamily targets newTargetSounds outline recipientFunctionOnly playerEffectEntrance client')
 values(row,excluded=helper['type'],excludedHasHealth=True,excludedHealth=helper['health']['currentValue'],excludedHasMobFamily=False,testOnlyHealthWitness=True,
  additionalExcluded=xp['type'],xpHealthApiAvailable=xp['healthAvailable'],admitted=['minecraft:cow','minecraft:armor_stand','minecraft:cod'],codHasMobFamily=False,
  targets=3,newTargetSounds=1,outline='native_available_unverified' if outline['glowing'] else 'unavailable',recipientFunctionOnly=True,playerEffectEntrance=False,client=False)
 return done[0]['addon_registration']

def validate_phase(row,raw,version):
 assert row['ok'] is True and row['normal_stop'] is True and row['errors']==[]
 same(row['player_connections'],0)
 phase=row['phase'];text=raw.decode('utf8')
 assert not re.search(r'\bERROR\]|\[error\]|\bplayer[ _]?(?:connected|joined|spawned)\b',text,re.I)
 assert 'Version: 1.26.52.3' in text and re.search(r'^Quit correctly\s*$',text,re.M)
 observed=[json.loads(line.split(PREFIX,1)[1]) for line in text.splitlines() if PREFIX in line]
 same(row['observations'],observed)
 return validate_observations(observed,phase,version)

def validate_recorded_inputs(report,current_sources,overlays):
 """Bind current/staged byte equality to the snapshots taken before native run."""
 fields(current_sources,'tavern liquor')
 expected={}
 for label,source in current_sources.items():
  baseline=source['baseline'];trees=source['source_trees']
  same(trees,baseline['source_trees'])
  expected[label]={'commit':source['commit'],'repository':baseline['repository'],
                   'version':baseline['version'],'source_trees':trees}
 # Whole-object equality rejects missing/extra packs, fields and overlay keys.
 # Matching both source and stage after a run cannot replace its recorded input.
 same(report.get('sources'),expected)
 same(report.get('test_only_overlays'),overlays)

def write_evidence(work,evidence,logs):
 target,log=work/EVIDENCE_NAME,work/LOG_NAME
 assert not target.exists() and not log.exists(),'Retain prior evidence; output files must be new'
 with target.open('x') as output:output.write(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
 with log.open('x') as output:output.write('\n\n'.join(logs)+'\n')
 return target

def main():
 p=argparse.ArgumentParser();p.add_argument('--work',type=pathlib.Path,required=True);p.add_argument('--liquor',type=pathlib.Path,required=True);a=p.parse_args()
 work=a.work.resolve();report=json.loads((work/'native-living-report.json').read_text())
 assert report['native_script_behavior'] is True and report['client'] is False
 assert report['live'] is False and report['full_family'] is False and report['test_only_host_overlay'] is True and report['copied_runtime_matches_frozen_source'] is True
 assert [r['phase']for r in report['reports']]==['first','restart']
 source_trees={};versions={};inputs={};current_sources={}
 overlays={'scripts/main.js':MAIN_OVERLAY_NOTE}
 liquor_source=a.liquor.resolve();liquor_baseline=json.loads((liquor_source/'baseline.json').read_text())
 liquor_headers={kind:json.loads((liquor_source/'runtime'/kind/'manifest.json').read_text())['header']for kind in ['BP','RP']}
 probe_inputs=render_world_liquor_probe_inputs(liquor_baseline,liquor_headers).encode()
 for label,source in [('tavern',ROOT),('liquor',a.liquor.resolve())]:
  baseline=json.loads((source/'baseline.json').read_text())
  versions[label]='.'.join(map(str,baseline['version']));source_trees[label]={}
  current_sources[label]={'baseline':baseline,'source_trees':source_trees[label],
                         'commit':subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()}
  for kind,folder in [('BP','behavior_packs'),('RP','resource_packs')]:
   original=source/'runtime'/kind;staged=work/'worlds/living-effect-qa'/folder/label
   tree,rows=fingerprint(original);source_trees[label][kind]=tree
   extras={}
   if label=='tavern' and kind=='BP':
    extras={'scripts/living-effects-probe.js':ROOT/'tools/native/shaker-migration-probe.js','entities/living-probe.json':ROOT/'tools/native/living-probe-entity.json',
            'entities/health-helper-probe.json':ROOT/'tools/native/health-helper-entity.json',
            'scripts/machine-ingredients-probe.js':ROOT/'tools/native/machine-ingredients-probe.js',
            'scripts/status-aura-probe.js':ROOT/'tools/native/status-aura-probe.js'}
   generated={'scripts/native-probe-inputs.js':probe_inputs}if label=='tavern' and kind=='BP'else {}
   actual={f.relative_to(staged).as_posix() for f in staged.rglob('*') if f.is_file()}
   assert actual==set(rows)|set(extras)|set(generated),(label,kind,'staged file set differs')
   for name in rows:
    expected=(original/name).read_bytes()
    if label=='tavern' and kind=='BP' and name=='scripts/main.js':expected+=APPEND
    assert (staged/name).read_bytes()==expected,(label,kind,name,'current source differs from native input')
   for name,original_file in extras.items():
    data=original_file.read_bytes();assert (staged/name).read_bytes()==data,name
    overlays[name]=digest(data)
    inputs[original_file.relative_to(ROOT).as_posix()]=overlays[name]
   for name,data in generated.items():
    assert (staged/name).read_bytes()==data,name
    overlays[name]=digest(data)
    inputs['generated/'+name]=overlays[name]
 validate_recorded_inputs(report,current_sources,overlays)
 summaries=[];logs=[];registrations=[]
 for row in report['reports']:
  phase=row['phase'];raw=(work/(phase+'.log')).read_bytes();text=raw.decode('utf8')
  registrations.append(validate_phase(row,raw,versions['liquor']))
  summaries.append({**row,'completeLogSHA256':digest(raw),'completeLogBytes':len(raw),'returnCode':0,'completeLogAdditionalChecks':True})
  logs.append('\n'.join(line for line in text.splitlines()if any(marker in line for marker in ['Version:','Build ID:','Commit ID:','Pack Stack','[LIVING_EFFECT_QA]','stop requested','Stopping server','Quit correctly'])))
 same(registrations[0],registrations[1])
 evidence={'schema':1,'bdsVersion':'1.26.52.3','scriptAPI':'2.7.0','versions':versions,'sourceTrees':source_trees,'observerInputsSHA256':inputs,
  'sourcePacksEqualNativeInputsExceptExplicitObserver':True,'nativeServerSaveRestart':True,'nativeCrossIdReadableMetadata':True,'nativePutRecoveryAndRearm':True,
  'playerSessions':0,'client':False,'live':False,'fpsMeasured':False,'idleCallbacksMeasured':False,'crossPackPrivateDataPreservation':False,
  'scope':'Real chest and machine ItemStacks, script-set PUT permutations, native aura lease restart and effect recipient APIs. Projectile impact envelopes are observer inputs. Host-scope dynamic properties only. Not physical projectile collision, particle pixels, player spawn/use, chunk re-entry or a private existing-world migration.',
  'reports':summaries,'command':'python tools/native/run_living_effects.py --engine <isolated BDS 1.26.52.3> --liquor <paired World Liquor source> --work <new disposable directory> --port 27330 --probe tools/native/shaker-migration-probe.js'}
 target=write_evidence(work,evidence,logs)
 print(json.dumps({'evidence':str(target),'versions':versions,'sourceTrees':source_trees,'nativeSaveRestart':True,'players':0,'client':False}))
if __name__=='__main__':main()
