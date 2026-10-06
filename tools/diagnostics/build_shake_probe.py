"""Build committed standalone shake telemetry; never copy/change canonical runtime."""
import argparse,hashlib,json,subprocess,uuid,zipfile
from pathlib import Path
PATHS=['tools/diagnostics/build_shake_probe.py','tools/diagnostics/shake-probe.js','tools/diagnostics/SHAKE-PROBE.md','tools/diagnostics/test_shake_probe.py','LICENSE-CODE']
def sha(data):return hashlib.sha256(data).hexdigest()
def encode(value):return (json.dumps(value,indent=2)+'\n').encode()
def inputs(root,commit):
 out={}
 for p in PATHS:
  data=(root/p).read_bytes()
  if data!=subprocess.check_output(['git','show',commit+':'+p],cwd=root):raise ValueError('Uncommitted diagnostic input: '+p)
  out[p]=data
 return out

def files(data,commit):
 seed=sha((commit+''.join(sha(data[p]) for p in PATHS)).encode());ids={kind:str(uuid.uuid5(uuid.NAMESPACE_URL,'tavern-shake-probe/'+kind+'/'+seed)) for kind in ['header','data','script']}
 script=data[PATHS[1]].decode()
 if script.count('__PROBE_SOURCE_COMMIT__')!=1:raise ValueError('Invalid provenance marker')
 manifest={'format_version':2,'header':{'name':'Private native shake sampler '+commit[:8],'description':'Opt-in single3s shake and aim telemetry; approximate effect, not Java parity','uuid':ids['header'],'version':[0,0,1],'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':ids['data'],'version':[0,0,1]},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':ids['script'],'version':[0,0,1]}],'dependencies':[{'module_name':'@minecraft/server','version':'2.10.0'}]}
 provenance={'schema':1,'source_commit':commit,'identity_seed_sha256':seed,'header_uuid':ids['header'],'data_module_uuid':ids['data'],'script_module_uuid':ids['script'],'inputs':[{'path':p,'sha256':sha(data[p])}for p in PATHS],'copies_canonical_runtime':False,'native_tested':False,'production_ready':False,'parity_verified':False,'safety':{'startup_effect':False,'one_event':True,'duration_seconds':3,'intensity':.05,'type':'Rotational','sampler_ticks':100,'max_samples':105,'global_stop':False,'camera_preset_change':False,'user_setting_changed':False,'natural_expiry_only':True}}
 return {'manifest.json':encode(manifest),'scripts/main.js':script.replace('__PROBE_SOURCE_COMMIT__',commit).encode(),'diagnostic_provenance.json':encode(provenance),'SHAKE-PROBE.md':data[PATHS[2]],'LICENSE-CODE':data['LICENSE-CODE']},provenance

def build(root,out,commit,data):
 root=root.resolve();out=out.resolve()
 if out==root or root in out.parents:raise ValueError('Output must be outside repository')
 contents,provenance=files(data,commit);out.mkdir(parents=True,exist_ok=True);pack=out/('Tavern-native-shake-probe-'+commit[:8]+'.mcpack')
 with zipfile.ZipFile(pack,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
  for p,d in sorted(contents.items()):
   info=zipfile.ZipInfo(p,date_time=(2026,10,6,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,d)
 report={**provenance,'pack':str(pack),'pack_size':pack.stat().st_size,'pack_sha256':sha(pack.read_bytes()),'files':[{'path':p,'size':len(d),'sha256':sha(d)}for p,d in sorted(contents.items())]}
 (out/'shake-probe-build-report.json').write_bytes(encode(report));return report
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out-dir',type=Path,required=True);a=p.parse_args();root=Path(__file__).resolve().parents[2];commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip();print(json.dumps(build(root,a.out_dir,commit,inputs(root,commit)),indent=2))
