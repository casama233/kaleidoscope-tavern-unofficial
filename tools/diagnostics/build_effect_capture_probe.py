"""Build a separate, additive RP for native title-binding diagnosis; never a release pack.

No BP, scripts, packet sender, gameplay changes, or canonical runtime writes.
Activate above the exact Tavern/Liquor candidates in a private test world only.
"""
import argparse, copy, hashlib, json, subprocess, uuid, zipfile
from pathlib import Path

PREFIX='§r§d§e§a§d§r'
TOKEN='§0§0§0§6§r'
PACKET=PREFIX+TOKEN
ASCII='KTEF:'
NAMESPACE='kt_effect_capture_probe'
EXPECTED_HUD_SHA='00bad600debd3f2491aa9942304f9f2437d5a6a04428a6dff4ed8f5bbbbf680d'

def encode(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
def digest(data):return hashlib.sha256(data).hexdigest()
def contains(value,needle):return f"(not (({value} - '{needle}') = {value}))"
def predicates(value):
 return [
  ('fmt slice12',f"(('%.12s' * {value}) = '{PREFIX}')"),
  ('fmt slice18',f"(('%.18s' * {value}) = '{PREFIX}')"),
  ('fmt contains',contains(value,PREFIX)),
  ('fmt exact',f"({value} = '{PACKET}')"),
  ('ascii slice5',f"(('%.5s' * {value}) = '{ASCII}')"),
  ('any nonempty',f"(not ({value} = ''))")
 ]

def global_binding(local):return {'binding_type':'global','binding_name':'#hud_title_text_string','binding_name_override':local}
def sibling_binding(source,local):
 return {'binding_type':'view','source_control_name':source,'resolve_sibling_scope':True,'source_property_name':local,'target_property_name':local}
def label(text,xy,size=(118,12),color=(1,1,1)):
 return {'type':'label','text':text,'localize':False,'shadow':True,'font_size':'small','size':list(size),'anchor_from':'top_left','anchor_to':'top_left','offset':list(xy),'color':list(color)}
def view(expr):return {'binding_type':'view','source_property_name':expr,'target_property_name':'#visible'}

def probe_panel():
 panel={'type':'panel','size':[218,112],'anchor_from':'top_right','anchor_to':'top_right','offset':[-4,44],'layer':60,'controls':[]}
 controls=panel['controls']
 controls.append({'mount_marker':label('Capture probe: MOUNT OK',(0,0),(218,12),(1,.85,.25))})
 controls.append({'static_sprite':{'type':'image','texture':'textures/kt_effect_capture_probe/slightly_tipsy','size':[12,12],'anchor_from':'top_left','anchor_to':'top_left','offset':[198,0],'layer':1,'bilinear':False}})
 controls.append({'column_live':label('LIVE',(126,12),(36,12))})
 controls.append({'column_cache':label('CACHE',(170,12),(46,12))})
 for index,(name,_) in enumerate(predicates('#unused')):
  live=f'#probe_live_{index}';cached=f'#probe_cached_{index}';source=f'probe_data_{index}';gate=predicates(live)[index][1];cache_gate=predicates('#hud_title_text_string')[index][1];y=25+index*12
  controls.append({source:{'type':'panel','size':[0,0],'property_bag':{cached:''},'bindings':[
   {'binding_type':'global','binding_name':'#hud_title_text_string'},
   {'binding_type':'global','binding_name':'#hud_title_text_string','binding_name_override':cached,'binding_condition':'visibility_changed'},
   view(f'(not (#hud_title_text_string = {cached}) and {cache_gate})')
  ]}})
  controls.append({f'gate_label_{index}':label(name,(0,y))})
  for column,prop,base,x,accepted in [('live',live,global_binding(live),126,gate),('cache',cached,sibling_binding(source,cached),170,predicates(cached)[index][1])]:
   for suffix,text,expr,color in [('yes','Y',accepted,(.3,1,.3)),('no','-',f'(not {accepted})',(.6,.6,.6))]:
    control=label(text,(x,y),(10,12),color);control['property_bag']={prop:''};control['bindings']=[copy.deepcopy(base),view(expr)]
    controls.append({f'{column}_{suffix}_{index}':control})
   icon={'type':'image','texture':'textures/kt_effect_capture_probe/slightly_tipsy','size':[12,12],'anchor_from':'top_left','anchor_to':'top_left','offset':[x+12,y],'layer':1,'bilinear':False,'property_bag':{prop:''},'bindings':[copy.deepcopy(base),view(f'({accepted} and {contains(prop,TOKEN)})')]}
   controls.append({f'{column}_icon_{index}':icon})
 raw=label('#probe_raw_live',(42,100),(174,12));raw['property_bag']={'#probe_raw_live':''};raw['bindings']=[global_binding('#probe_raw_live')]
 controls.append({'raw_caption':label('raw:',(0,100),(38,12))});controls.append({'raw_live':raw})
 return panel

def verify_committed_inputs(root,source_commit,builder_path=None):
 builder_path=(builder_path or Path(__file__)).resolve();expected=(root/'tools/diagnostics/build_effect_capture_probe.py').resolve()
 if builder_path!=expected:raise ValueError('Build from the committed tools/diagnostics builder path')
 paths=['tools/diagnostics/build_effect_capture_probe.py','runtime/RP/ui/hud_screen.json','runtime/RP/textures/kaleidoscope_tavern_jar/mob_effect/slightly_tipsy.png','LICENSE-ASSETS']
 for path in paths:
  committed=subprocess.check_output(['git','show',source_commit+':'+path],cwd=root)
  if (root/path).read_bytes()!=committed:raise ValueError('Uncommitted probe input: '+path)

def create_files(root,source_commit,expected_hud_sha=EXPECTED_HUD_SHA):
 hud_bytes=(root/'runtime/RP/ui/hud_screen.json').read_bytes();hud_sha=digest(hud_bytes)
 if hud_sha!=expected_hud_sha:raise ValueError('Unexpected frozen runtime HUD hash: '+hud_sha)
 base=json.loads(hud_bytes);hud=copy.deepcopy(base)
 mount={'array_name':'controls','operation':'insert_back','value':[{'kt_effect_capture_probe@'+NAMESPACE+'.probe_panel':{}}]}
 hud['root_panel']['modifications'].append(mount)
 sprite=(root/'runtime/RP/textures/kaleidoscope_tavern_jar/mob_effect/slightly_tipsy.png').read_bytes();license_bytes=(root/'LICENSE-ASSETS').read_bytes()
 source_sha=digest(Path(__file__).read_bytes());identity=digest((source_commit+hud_sha+source_sha+digest(sprite)+digest(license_bytes)).encode())
 header=str(uuid.uuid5(uuid.NAMESPACE_URL,'kt-effect-capture-probe/header/'+identity));module=str(uuid.uuid5(uuid.NAMESPACE_URL,'kt-effect-capture-probe/module/'+identity))
 manifest={'format_version':2,'header':{'name':'Tavern title-capture probe '+source_commit[:8],'description':'Private native diagnosis only; no gameplay or automatic title sender','uuid':header,'version':[0,0,1],'min_engine_version':[1,26,50]},'modules':[{'type':'resources','uuid':module,'version':[0,0,1]}]}
 provenance={'schema':1,'purpose':'Native prefix/global/cache isolation. Not a release or a production fix.','source_commit':source_commit,'source_hud_sha256':hud_sha,'builder_sha256':source_sha,'identity_seed_sha256':identity,'client_verified':False,'header_uuid':header,'module_uuid':module,'gates':[{ 'name':name,'expression':expr } for name,expr in predicates('#hud_title_text_string')],'prefix_js_code_units':len(PREFIX),'prefix_utf8_bytes':len(PREFIX.encode()),'format_packet':PACKET,'ascii_packet':ASCII+TOKEN}
 provenance['sprite_sha256']=digest(sprite);provenance['asset_license_sha256']=digest(license_bytes)
 files={'manifest.json':encode(manifest),'ui/hud_screen.json':encode(hud),'ui/_ui_defs.json':encode({'ui_defs':['ui/kt_effect_capture_probe.json']}),'ui/kt_effect_capture_probe.json':encode({'namespace':NAMESPACE,'probe_panel':probe_panel()}),'textures/kt_effect_capture_probe/slightly_tipsy.png':sprite,'diagnostic_provenance.json':encode(provenance)}
 files['LICENSE-ASSETS']=license_bytes
 return files,provenance

def write_pack(root,out,source_commit,expected_hud_sha=EXPECTED_HUD_SHA):
 files,provenance=create_files(root,source_commit,expected_hud_sha);out.mkdir(parents=True,exist_ok=True)
 pack=out/('Tavern-effect-capture-probe-'+source_commit[:8]+'.mcpack')
 if pack.exists():raise FileExistsError('Refuse to replace existing probe archive: '+str(pack))
 with zipfile.ZipFile(pack,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
  for name,data in sorted(files.items()):
   info=zipfile.ZipInfo(name,date_time=(2026,10,6,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;archive.writestr(info,data)
 report={**provenance,'pack':str(pack),'pack_sha256':digest(pack.read_bytes()),'pack_size':pack.stat().st_size,'files':[{'path':name,'sha256':digest(data),'size':len(data)} for name,data in sorted(files.items())]}
 (out/'probe-build-report.json').write_bytes(encode(report));return report

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--tavern-root',type=Path,default=Path(__file__).resolve().parents[2]);parser.add_argument('--out-dir',type=Path,required=True);parser.add_argument('--expected-hud-sha256',default=EXPECTED_HUD_SHA);args=parser.parse_args();root=args.tavern_root.resolve()
 source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
 verify_committed_inputs(root,source_commit)
 print(json.dumps(write_pack(root,args.out_dir.resolve(),source_commit,args.expected_hud_sha256),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
