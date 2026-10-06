#!/usr/bin/env python3
"""Build separately identified tracing BPs from frozen sources; never edit runtime."""
from pathlib import Path
import argparse,hashlib,json,subprocess,uuid,zipfile
ROOT=Path(__file__).resolve().parents[2]
TRACE=Path(__file__).with_name('interaction-trace.js')

def sha(data):return hashlib.sha256(data).hexdigest()
def fingerprint(rows):return sha(json.dumps({k:sha(v) for k,v in sorted(rows.items())},sort_keys=True,separators=(',',':')).encode())
def files(root):return {p.relative_to(root).as_posix():p.read_bytes() for p in sorted(root.rglob('*')) if p.is_file()}
def frozen(root,version):
    lock=json.loads((root/'baseline.json').read_text());assert lock['version']==version,('Wrong frozen source',root)
    rows=files(root/'runtime/BP');assert fingerprint(rows)==lock['source_trees']['BP']['sha256'],('Source BP drift',root)
    committed={}
    for entry in subprocess.check_output(['git','ls-tree','-r','-z','HEAD','--','runtime/BP'],cwd=root).split(b'\0'):
        if not entry:continue
        metadata,path=entry.split(b'\t',1);mode,kind,blob=metadata.split();assert mode in [b'100644',b'100755'] and kind==b'blob'
        committed[path.decode().removeprefix('runtime/BP/')]=blob.decode()
    actual={path:hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest() for path,data in rows.items()}
    assert actual==committed,('Canonical BP differs from committed HEAD',root)
    return rows,lock
def replace_once(text,old,new):
    assert text.count(old)==1,('Probe anchor changed',old)
    return text.replace(old,new)

def instrument(rows):
    out=dict(rows);path='scripts/bedrock/java-placement-router.js';s=rows[path].decode()
    s="import {trace,traceEvent,traceClaim} from './interaction-trace.js';\n"+s
    anchors=[
      (" const row=event._javaUseClaim;if(!row)return;row.pending=false;",
       " trace('claim.settle',event.player,{source:event._traceSource,event:traceEvent(event),succeeded,claim:traceClaim(event._javaUseClaim)});\n const row=event._javaUseClaim;if(!row)return;row.pending=false;"),
      (" const previous=itemUseClaims.get(e.player.id);",
       " trace('plan.target',e.player,{source:e._traceSource,event:traceEvent(e),route:route.id,target,held,plan});\n const previous=itemUseClaims.get(e.player.id);"),
      (" if(sameRecentBlockUse(previous,gesture)){e._javaUseClaim=previous.event?._javaUseClaim;return;}",
       " if(sameRecentBlockUse(previous,gesture)){trace('plan.duplicate',e.player,{source:e._traceSource,event:traceEvent(e),route:route.id,target,previous:traceClaim(previous.event?._javaUseClaim)});e._javaUseClaim=previous.event?._javaUseClaim;return;}"),
      (" itemUseClaims.set(e.player.id,gesture);",
       " itemUseClaims.set(e.player.id,gesture);trace('plan.queued',e.player,{source:e._traceSource,event:traceEvent(e),route:route.id,target});"),
      ("  let succeeded=false;",
       "  trace('execute.begin',e.player,{source:e._traceSource,event:traceEvent(e),route:route.id,target,held,claim:traceClaim(e._javaUseClaim)});\n  let succeeded=false;"),
      ("   succeeded=true;return result;",
       "   trace('execute.success',e.player,{source:e._traceSource,route:route.id,target,resultItem:result?.item??result?.typeId??null});\n   succeeded=true;return result;"),
      ("function dispatch(raw){","function dispatch(raw,traceSource='playerInteractWithBlock'){"),
      (" const held=handSnapshot(e.player);",
       " e._traceSource=traceSource;\n const held=handSnapshot(e.player);trace('dispatch.enter',e.player,{source:traceSource,raw:traceEvent(raw),normalized:traceEvent(e),held,previous:traceClaim(blockUses.get(e.player.id))});"),
      (" observe();\n syncCancel();",
       " trace('dispatch.exit',e.player,{source:traceSource,event:traceEvent(e),claim:traceClaim(e._javaUseClaim??blockUses.get(e.player.id))});\n observe();\n syncCancel();"),
      (" dispatch(synthetic);return !!synthetic.cancel;"," dispatch(synthetic,'nativeEmptyHandBlockUse');return !!synthetic.cancel;"),
      (" world.beforeEvents.playerInteractWithBlock.subscribe(dispatch);",
       " world.beforeEvents.playerInteractWithBlock.subscribe(e=>dispatch(e,'playerInteractWithBlock'));"),
      ("  const id=e.itemStack?.typeId;",
       "  const id=e.itemStack?.typeId;trace('itemUse.enter',e.source,{source:'before.itemUse',event:traceEvent(e),previous:traceClaim(blockUses.get(e.source.id))});"),
      ("  if(!hit?.block)return;",
       "  trace('itemUse.ray',e.source,{source:'before.itemUse',hit:traceEvent({block:hit?.block,blockFace:hit?.face,faceLocation:hit?.faceLocation})});\n  if(!hit?.block)return;"),
      ("  if(ownedItemUseEcho(e.source,id)||blockUseClaimed(e.source,id,hit.block,hit.face)){e.cancel=true;return;}",
       "  const echo=ownedItemUseEcho(e.source,id),scoped=!echo&&blockUseClaimed(e.source,id,hit.block,hit.face);trace('itemUse.claim',e.source,{source:'before.itemUse',echo,scoped,previous:traceClaim(blockUses.get(e.source.id))});\n  if(echo||scoped){e.cancel=true;return;}"),
      ("  dispatch(event);if(event.cancel)e.cancel=true;","  dispatch(event,'itemUseFallback');if(event.cancel)e.cancel=true;")]
    for old,new in anchors:s=replace_once(s,old,new)
    out[path]=s.encode();out['scripts/bedrock/interaction-trace.js']=TRACE.read_bytes()
    path='scripts/bedrock/stateful-storage-router.js';s=rows[path].decode();s="import {trace,traceEvent} from './interaction-trace.js';\n"+s
    s=replace_once(s,"  const {face,faceLocation}=storageHit(e.player,e.block,e.blockFace,e.faceLocation,routeId);","  const {face,faceLocation}=storageHit(e.player,e.block,e.blockFace,e.faceLocation,routeId);trace('storage.resolved',e.player,{source:e._traceSource,event:traceEvent(e),route:routeId,face,faceLocation,held});")
    s=replace_once(s,"  if(duplicate){e._javaUseClaim=previous.event._javaUseClaim;return;}","  trace('storage.claim',player,{source:e._traceSource,event:traceEvent(e),route:routeId,key,duplicate});\n  if(duplicate){e._javaUseClaim=previous.event._javaUseClaim;return;}")
    s=replace_once(s,"   let succeeded=false;","   trace('storage.execute',player,{source:e._traceSource,event:traceEvent(e),route:routeId,revision,face,faceLocation,held});\n   let succeeded=false;")
    out[path]=s.encode()
    path='scripts/bedrock/protected-break-router.js';s=rows[path].decode();s="import {trace,traceEvent} from './interaction-trace.js';\n"+s
    s=replace_once(s,"  if(event.cancel)return;","  trace('break.enter',event.player,{source:'before.playerBreakBlock',event:traceEvent(event)});\n  if(event.cancel)return;")
    s=replace_once(s,"  if(pending.has(key))return;pending.add(key);","  trace('break.claim',player,{source:'before.playerBreakBlock',event:traceEvent(event),route:route.id,key,duplicate:pending.has(key)});\n  if(pending.has(key))return;pending.add(key);")
    s=replace_once(s,"});}finally{pending.delete(key);}","});}finally{trace('break.settle',player,{source:'before.playerBreakBlock',route:route.id,key});pending.delete(key);}")
    out[path]=s.encode();return out

def diagnostic_manifest(data,seed,kind,bp_map):
    m=json.loads(data);original=m['header']['uuid'];identifier=str(uuid.uuid5(uuid.NAMESPACE_URL,seed+'/'+kind))
    m['header'].update(uuid=identifier,version=[0,0,1],name='Interaction trace: '+kind,description='Tools-only frozen-source native callback probe; disable original BPs while testing')
    for i,module in enumerate(m['modules']):module.update(uuid=str(uuid.uuid5(uuid.NAMESPACE_URL,seed+'/'+kind+'/module/'+str(i))),version=[0,0,1])
    for dep in m.get('dependencies',[]):
        if dep.get('uuid') in bp_map:dep.update(uuid=bp_map[dep['uuid']],version=[0,0,1])
    return json.dumps(m,indent=2).encode()+b'\n',original,identifier

def build(out_dir,liquor_source=None):
    host,lock=frozen(ROOT,[0,6,107]);traced=instrument(host);peer=None;peer_lock=None
    if liquor_source:peer,peer_lock=frozen(Path(liquor_source).resolve(),[0,1,68])
    seed='tavern107-native-interaction-trace/'+fingerprint(traced)+(('/'+fingerprint(peer)) if peer else '')
    host_manifest,host_old,host_id=diagnostic_manifest(host['manifest.json'],seed,'Tavern107',{})
    traced['manifest.json']=host_manifest;packs={'TavernTrace_BP':traced}
    if peer:
        other=dict(peer);other['manifest.json'],peer_old,peer_id=diagnostic_manifest(peer['manifest.json'],seed,'Liquor68',{host_old:host_id});packs['LiquorTrace_BP']=other
    out=Path(out_dir).resolve();assert out!=ROOT and (ROOT/'runtime') not in [out,*out.parents], 'Never write canonical runtime'
    out.mkdir(parents=True,exist_ok=True);target=out/'Tavern107_Interaction_Trace_Probe.mcaddon'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,rows in packs.items():
            for path,data in sorted(rows.items()):
                info=zipfile.ZipInfo(name+'/'+path,(2026,10,6,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    report={'scope':'TOOLS_ONLY_DIAGNOSTIC_NOT_RELEASE','source_commit':commit,'canonical_version':[0,6,107],'canonical_BP':lock['source_trees']['BP'],'canonical_RP':lock['source_trees']['RP'],'source_unchanged':fingerprint(files(ROOT/'runtime/BP'))==lock['source_trees']['BP']['sha256'],'trace_tag':'kaleidoscope_tavern:trace_interactions','archive':str(target),'sha256':sha(target.read_bytes()),'bytes':target.stat().st_size,'probe_uuid':host_id,'peer':({'version':[0,1,68],'BP':peer_lock['source_trees']['BP'],'source':str(Path(liquor_source).resolve())} if peer else None),'modified_host_paths':[p for p,v in traced.items() if host.get(p)!=v],'modified_peer_paths':['manifest.json'] if peer else [],'rendered_client':False,'limits':['Console instrumentation can perturb callback timing','Original canonical BPs must be disabled to avoid duplicate script owners','Canonical107/68 RPs remain enabled','No production or release verdict']}
    (out/'PROVENANCE.json').write_text(json.dumps(report,indent=2)+'\n');return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--out-dir',required=True,type=Path);parser.add_argument('--liquor-source',type=Path);a=parser.parse_args()
    for p in [Path(__file__).resolve(),TRACE]:assert p.read_bytes()==subprocess.check_output(['git','show','HEAD:'+p.relative_to(ROOT).as_posix()],cwd=ROOT),('Uncommitted probe input',p)
    print(json.dumps(build(a.out_dir,a.liquor_source),indent=2))
