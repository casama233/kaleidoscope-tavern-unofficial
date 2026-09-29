#!/usr/bin/env python3
"""Pinned fresh-world native BDS checks. No players, production worlds or host rewrites.
Downloads public dependencies for local test use only; outputs logs/metadata, never those packs.
"""
import argparse,hashlib,json,os,re,shutil,subprocess,time,urllib.request,uuid,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def unpack(archive,out):
    with zipfile.ZipFile(archive) as z:
        for i in z.infolist():
            n=Path(i.filename)
            assert not n.is_absolute() and '..' not in n.parts and '\\' not in i.filename
            assert (i.external_attr>>16)&0o170000!=0o120000
        z.extractall(out)
def download(url,path,expected):
    if not path.exists():
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=150) as r:
            raw=r.read()
        path.write_bytes(raw)
    assert hashlib.sha256(path.read_bytes()).hexdigest()==expected,path

def pair(root):
    sides={}
    for path in root.glob('*/manifest.json'):
        m=read(path);types={x['type'] for x in m['modules']}
        s='RP' if 'resources' in types else 'BP'
        assert s not in sides,(root,s);sides[s]=(path.parent,m)
    assert set(sides)=={'BP','RP'},root
    return sides

OBSERVER="""import {world,system,ItemTypes,ItemStack,BlockPermutation} from '@minecraft/server';
const events={};system.afterEvents.scriptEventReceive.subscribe(e=>{
 if(!e.id.startsWith('kaleidoscope_'))return;
 events[e.id]=(events[e.id]??0)+1;
 if(/api_ready|registered|ack|error|reject/.test(e.id))console.warn('[FAMILY1-EVENT] '+e.id+' '+String(e.message).slice(0,1800));
});
world.afterEvents.worldLoad.subscribe(()=>{for(const delay of [200,600])system.runTimeout(()=>{
 const knives=['kaleidoscope_end:dragon_tooth_knife','kaleidoscope_nether:primitive_machete'];
 const tagged={};for(const id of knives){try{tagged[id]=ItemTypes.get(id)?new ItemStack(id).hasTag('kaleidoscope_cookery:kitchen_knife'):null}catch(error){tagged[id]=String(error)}}
 console.warn('[FAMILY1-PROBE] '+JSON.stringify({tick:system.currentTick,players:world.getAllPlayers().length,knives:tagged,events}));
},delay);});
"""
GRILL_PROBE="""import {world,system,ItemStack,ItemTypes} from '@minecraft/server';
import {isKitchenKnifeStack} from './a2710_chicken_acquisition_core.js';
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(()=>{
 const results={};for(const id of ['kaleidoscope_cookery:iron_kitchen_knife','kaleidoscope_end:dragon_tooth_knife','kaleidoscope_nether:primitive_machete','minecraft:diamond_sword']){
   try{results[id]=ItemTypes.get(id)?isKitchenKnifeStack(new ItemStack(id)):null}catch(error){results[id]=String(error)}
 }
 console.warn('[FAMILY1-ACTUAL-KNIFE] '+JSON.stringify({players:world.getAllPlayers().length,results}));
},200));
"""

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--liquor-root',type=Path,required=True);p.add_argument('--grilling-root',type=Path,required=True);p.add_argument('--work',type=Path,required=True);a=p.parse_args()
    work=a.work.resolve();assert not work.exists(),'Use a new isolated work directory'
    work.mkdir(parents=True);out=work/'evidence';out.mkdir();inputs=work/'inputs';inputs.mkdir()
    lock=read(ROOT/'compat/family/source-lock.json');packs={'tavern':pair(ROOT/'runtime'),'world-liquor':pair(a.liquor_root/'runtime'),'grilling':pair(a.grilling_root/'projects/grilling/gameplay_core')}
    for row in lock['packs']:
        target=inputs/(row['key']+'.mcaddon');download(row['url'],target,row['sha256'])
        unpack(target,inputs/row['key']);packs[row['key']]=pair(inputs/row['key'])
    bds=inputs/'bds.zip';download(lock['bds']['url'],bds,lock['bds']['sha256'])
    save(out/'SOURCE-LOCK.json',lock)
    core=['cookery-1.0.8','tavern','world-liquor'];new=core+['end-1.0.1','nether-1.0.1']
    family=new+['chinese-food-1.0.4','deco-1.0.1','immersive-eating-1.0','grilling']
    patch=ROOT/'compat/deco-ladder/BP';packs['ladder-patch']={'BP':(patch,read(patch/'manifest.json'))}
    cases=[('01-core',core,False),('02-end-nether',new,False),('03-family-control',family,False),('04-family-patched',['ladder-patch']+family,True),('05-ladder-priority-negative',family+['ladder-patch'],False)]
    summaries=[]
    for i,(name,selected,probe_actual) in enumerate(cases):
        dest=work/name;dest.mkdir();unpack(bds,dest);exe=dest/'bedrock_server';exe.chmod(0o755)
        world=dest/'worlds'/'Compatibility';world.mkdir(parents=True,exist_ok=True);lists={'BP':[],'RP':[]};records=[]
        for key in selected:
            for side,(src,m) in packs[key].items():
                dst=world/('behavior_packs' if side=='BP' else 'resource_packs')/m['header']['uuid'];shutil.copytree(src,dst)
                if probe_actual and key=='grilling' and side=='BP':
                    (dst/'scripts/family_acceptance_probe.js').write_text(GRILL_PROBE)
                    entry=dst/next(x['entry'] for x in m['modules'] if x['type']=='script')
                    entry.write_text(entry.read_text()+"\nimport './family_acceptance_probe.js';\n")
                lists[side].append({'pack_id':m['header']['uuid'],'version':m['header']['version']})
                records.append({'key':key,'side':side,'header':m['header'],'dependencies':m.get('dependencies',[])})
        headers={r['header']['uuid']:r['header']['version'] for r in records}
        unsatisfied=[{'pack':r['key'],'side':r['side'],'dependency':d} for r in records for d in r['dependencies'] if 'uuid' in d and headers.get(d['uuid'])!=d['version']]
        assert not unsatisfied,unsatisfied
        uid=str(uuid.uuid5(uuid.NAMESPACE_URL,'https://github.com/casama233/kaleidoscope-tavern-unofficial/family-batch1-observer'))
        obs=world/'behavior_packs'/uid;(obs/'scripts').mkdir(parents=True)
        save(obs/'manifest.json',{'format_version':2,'header':{'uuid':uid,'name':'Read-only family batch1 observer','description':'No player simulation','version':[1,0,0],'min_engine_version':[1,26,50]},'modules':[{'type':'script','language':'javascript','uuid':str(uuid.uuid5(uuid.NAMESPACE_URL,uid)),'entry':'scripts/main.js','version':[1,0,0]}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]})
        (obs/'scripts/main.js').write_text(OBSERVER);lists['BP'].append({'pack_id':uid,'version':[1,0,0]})
        save(world/'world_behavior_packs.json',lists['BP']);save(world/'world_resource_packs.json',lists['RP']);save(out/(name+'-packs.json'),records)
        # The pinned server rejects allow-list=true with online-mode=false.
        # Keep authentication enabled and an empty allowlist; no player may join.
        props={'server-name':'Family compatibility isolated check','gamemode':'creative','difficulty':'peaceful','allow-cheats':'true','online-mode':'true','allow-list':'true','max-players':'1','server-port':str(23100+i*2),'server-portv6':str(23101+i*2),'enable-lan-visibility':'false','level-name':'Compatibility','level-seed':'1729','level-type':'FLAT','view-distance':'4','tick-distance':'4','max-threads':'2','content-log-file-enabled':'true','content-log-console-output-enabled':'true','emit-server-telemetry':'false','pause-when-empty-seconds':'0'}
        (dest/'server.properties').write_text('\n'.join(k+'='+v for k,v in props.items())+'\n');save(dest/'allowlist.json',[])
        logfile=out/(name+'.log');start=time.monotonic()
        with logfile.open('w') as log:
            proc=subprocess.Popen([str(exe)],cwd=dest,env=dict(os.environ,LD_LIBRARY_PATH=str(dest)),stdin=subprocess.PIPE,stdout=log,stderr=subprocess.STDOUT,text=True)
            for _ in range(50):
                if proc.poll() is not None:break
                time.sleep(1)
            try:
                if proc.poll() is None:proc.communicate('stop\n',timeout=25)
            except subprocess.TimeoutExpired:proc.kill();proc.wait()
        text=logfile.read_text(errors='replace');lines=text.splitlines()
        content_errors=[s for s in lines if ' ERROR]' in s and re.search(r'\[(Blocks|Scripting|Recipes|Item|Components)',s)]
        duplicate=[s for s in lines if 'duplicate crafting_table recipe' in s and 'ladder' in s]
        native_probes=[json.loads(s.split('[FAMILY1-PROBE] ',1)[1]) for s in lines if '[FAMILY1-PROBE] ' in s]
        actual=[json.loads(s.split('[FAMILY1-ACTUAL-KNIFE] ',1)[1]) for s in lines if '[FAMILY1-ACTUAL-KNIFE] ' in s]
        checks={'started':'Server started' in text,'stoppedCleanly':proc.returncode==0,'observer':bool(native_probes),'noPlayers':bool(native_probes) and all(s['players']==0 for s in native_probes),'noDependencyGap':not unsatisfied}
        if 'grilling' in selected:
            checks['onlyKnownContainerErrors']=len(content_errors)==2 and all("experimental creator features are required" in s and ('grill.json' in s or 'advanced_rack_block.json' in s) for s in content_errors)
        else:checks['noContentErrors']=not content_errors
        # First listed pack has highest priority. The wrong-priority case is a
        # deliberate negative control, not an accepted installation order.
        checks['ladderPriorityContract']=bool(duplicate) if name in ('03-family-control','05-ladder-priority-negative') else not duplicate
        acks=[json.loads(line.split('kaleidoscope_tavern:extension_ack ',1)[1]) for line in lines if '[FAMILY1-EVENT] kaleidoscope_tavern:extension_ack ' in line]
        checks['worldLiquorRegistered']=any(ack.get('source')=='kaleidoscope_world_liquor' and ack.get('ok') is True for ack in acks)
        if 'end-1.0.1' in selected:checks['nativeKnifeTags']=bool(native_probes) and all(all(v is True for v in s['knives'].values()) for s in native_probes)
        if probe_actual:
            expected={'kaleidoscope_cookery:iron_kitchen_knife':True,'kaleidoscope_end:dragon_tooth_knife':True,'kaleidoscope_nether:primitive_machete':True,'minecraft:diamond_sword':False}
            checks['actualGrillingClassifier']=len(actual)==1 and actual[0]['players']==0 and actual[0]['results']==expected
        summary={'case':name,'packOrder':selected,'checks':checks,'passed':all(checks.values()),'contentErrors':content_errors,'ladderDuplicateWarnings':duplicate,'extensionAcks':acks,'probes':native_probes,'actualClassifier':actual,'instrumentedGrillingCopy':probe_actual,'seconds':round(time.monotonic()-start,2),'playersSimulated':False,'clientTest':False,'wholeFamilyCompatible':False,'transportNotCertified':True,'onlineAuthentication':True}
        save(out/(name+'-summary.json'),summary);summaries.append(summary);print(name,checks,flush=True)
    save(out/'SUMMARY.json',{'bds':lock['bds'],'cases':summaries,'passed':all(s['passed'] for s in summaries),'allKnownCompatibilityProblemsFixed':False})
    if not all(s['passed'] for s in summaries):raise SystemExit('A native check failed; inspect evidence, do not claim repaired.')
if __name__=='__main__':main()
