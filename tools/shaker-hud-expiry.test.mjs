/** Production transport lifetime checks; not a Minecraft client renderer. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createFormattingHudTransport} from '../runtime/BP/scripts/core/formatting-hud-transport.js';
import {GRAPHICAL_HUD_PREFIX,GRAPHICAL_HUD_END,HUD_REFRESH_TICKS,hudSendDue,validShakerHudPacket,slotsPacket,progressPacket} from '../runtime/BP/scripts/core/shaker-hud.js';
function fixture(){
 let clock=0,next=1;const pending=new Map(),calls=[];
 const sender=createFormattingHudTransport({prefix:GRAPHICAL_HUD_PREFIX,endPacket:GRAPHICAL_HUD_END,validatePacket:validShakerHudPacket,maxLength:60,
  queueAvailable:()=>true,embeddedAvailable:()=>false,queueSend:(p,packet)=>calls.push([clock,p.id,packet]),
  schedule:(fn,ticks)=>{const id=next++;pending.set(id,{fn,at:clock+ticks});return id;},cancel:id=>pending.delete(id),idleTicks:12});
 const advance=n=>{for(let i=0;i<n;i++){clock++;for(const [id,row]of [...pending])if(row.at<=clock){pending.delete(id);row.fn();}}};
 return {sender,advance,pending,calls};
}
test('refresh keeps current state and missed refresh emits exactly one owned stop',()=>{
 const f=fixture(),p={id:'a'};f.sender.send(p,slotsPacket([]));f.advance(10);f.sender.send(p,progressPacket(25));
 f.advance(11);assert.equal(f.calls.length,2);f.advance(1);
 assert.deepEqual(f.calls.at(-1),[22,'a',GRAPHICAL_HUD_END]);assert.equal(f.pending.size,0);
 f.advance(100);assert.equal(f.calls.length,3);
});
test('cancel and disconnect retire only the matching player timeout',()=>{
 const f=fixture(),a={id:'a'},b={id:'b'};f.sender.send(a,progressPacket(0));f.sender.send(b,progressPacket(1));
 f.sender.send(a,GRAPHICAL_HUD_END);f.sender.forget(b.id);assert.equal(f.pending.size,0);
 f.advance(100);assert.equal(f.calls.length,3);assert.equal(f.calls.at(-1)[2],GRAPHICAL_HUD_END);
});
test('original event factory has bounded slots/progress lifetime and no title cache ancestry',()=>{
 const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/kt_tavern_hud.json',import.meta.url)));
 assert.deepEqual(hud.root.controls[0],{'kt_mixology@kaleidoscope_tavern_hud.kt_mixology_factory':{}});
 assert.equal(hud.kt_mixology_expire.destroy_at_end,'kt_mixology_packet');
 assert.equal(hud.kt_mixology_expire.duration,'$kt_lifetime');
 assert.equal(hud.kt_mixology_packet['$kt_lifetime|default'],.6);
 const lifetimeRows=hud.kt_mixology_packet.variables.filter(row=>Object.hasOwn(row,'$kt_lifetime'));
 assert.deepEqual(lifetimeRows,[{requires:"(not (($kt_text - 'KT_HUD!P:') = $kt_text))",$kt_lifetime:.6}]);
 const {kt_effect_icons,...owned}=hud;
 assert(!/#hud_title_text_string|#kt_text_latest|channel_cache_probe/.test(JSON.stringify(owned)));
});
test('actual generator restores receipt-relative animation flags and heartbeat-safe progress lifetime',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url));
 // Rebuild a temporary old-policy input, rather than inheriting the new flags
 // from the checked-in JSON. This never modifies the source checkout.
 const source=String.raw`
import contextlib,hashlib,importlib.util,io,json,shutil,sys,tempfile
from pathlib import Path
root=Path(sys.argv[1]);sys.path.insert(0,str(root/'tools'))
spec=importlib.util.spec_from_file_location('shaker_generator',root/'tools/build_shaker_hud_colors.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as temp:
 rp=Path(temp);(rp/'ui').mkdir();(rp/'textures/ui/kt_mixology/slots').mkdir(parents=True)
 hud=json.loads((root/'runtime/RP/ui/kt_tavern_hud.json').read_text())
 hud['kt_mixology_packet'].pop('disable_anim_fast_forward',None)
 hud['kt_mixology_cursor'].pop('disable_anim_fast_forward',None)
 hud['kt_mixology_packet']['variables'][0]['$kt_lifetime']=.2
 (rp/'ui/kt_tavern_hud.json').write_text(json.dumps(hud))
 shutil.copy2(root/'runtime/RP/textures/ui/kt_mixology/slots/700.png',rp/'textures/ui/kt_mixology/slots/700.png')
 module.RP=rp
 with contextlib.redirect_stdout(io.StringIO()):module.main()
 print(hashlib.sha256((rp/'ui/kt_tavern_hud.json').read_bytes()).hexdigest())
`;
 const result=spawnSync(process.env.PYTHON??'python3',['-c',source,root],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const raw=readFileSync(new URL('../runtime/RP/ui/kt_tavern_hud.json',import.meta.url));
 assert.equal(result.stdout.trim(),createHash('sha256').update(raw).digest('hex'),'Generated UI differs from shipped UI');
 const hud=JSON.parse(raw);
 assert.equal(hud.kt_mixology_packet.disable_anim_fast_forward,true);
 assert.equal(hud.kt_mixology_cursor.disable_anim_fast_forward,true);
 assert.equal(hud.kt_mixology_cursor_after_tick.duration,.2);
 assert(!hud.kt_mixology_cursor_after_tick.next,'Missing packets must hold the observed cursor position');
});
test('progress survives four-to-nine-tick refresh gaps without extrapolating or changing the sender cadence',()=>{
 const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/kt_tavern_hud.json',import.meta.url)));
 const row=hud.kt_mixology_packet.variables.find(value=>Object.hasOwn(value,'$kt_lifetime'));
 const seconds=row.$kt_lifetime;
 assert.equal(HUD_REFRESH_TICKS,10);
 const key=progressPacket(25),previous={key,tick:0};
 for(let tick=4;tick<HUD_REFRESH_TICKS;tick++){
  assert.equal(hudSendDue(previous,key,tick),false,'Unchanged progress does not send early');
  assert(tick/20<seconds,'The current graphic expired before the unchanged-value refresh was due');
 }
 assert.equal(hudSendDue(previous,key,HUD_REFRESH_TICKS),true);
 assert(HUD_REFRESH_TICKS/20<seconds,'Expiry must leave room for the heartbeat');
 assert.equal(hudSendDue(previous,progressPacket(26),1),true,'Active progress still sends immediately');
 assert.equal(hudSendDue(previous,GRAPHICAL_HUD_END,1),true,'Owned stop still sends immediately');
});
