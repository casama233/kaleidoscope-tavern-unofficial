"""Build an opt-in standalone private BP; frozen Tavern109 runtime is never copied or changed."""
import argparse, hashlib, json, subprocess, uuid, zipfile
from pathlib import Path

FROZEN_RUNTIME_TREE='72dbf54189a5e16eac7645a212b944ae1b4e19b9'
BASELINE_COMMIT='3080c5a5618fb65485cb8f082d8096f75a709826'
PATHS=['tools/diagnostics/build_camera_probe.py','tools/diagnostics/camera-probe.js','tools/diagnostics/CAMERA-PROBE.md','LICENSE-CODE']
SOURCES=[
 'https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.10?view=minecraft-bedrock-stable',
 'https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camera?view=minecraft-bedrock-stable',
 'https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/rotationkeyframe?view=minecraft-bedrock-stable',
 'https://learn.microsoft.com/en-us/minecraft/creator/documents/camerasystem/freecamerascriptapitutorial?view=minecraft-bedrock-stable',
 'https://learn.microsoft.com/en-us/minecraft/creator/documents/bedrockeditor/editorcameratool?view=minecraft-bedrock-stable',
 'https://mcblend.readthedocs.io/en/stable/camera_animations/exporting_camera_animations/#playing-camera-animations-in-minecraft',
 'https://registry.npmjs.org/@minecraft/server/-/server-2.7.0.tgz',
 'https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/event/CameraAnglesEvent.java'
]
def sha(data):return hashlib.sha256(data).hexdigest()
def encode(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
def committed_inputs(root,commit,builder=None):
 builder=(builder or Path(__file__)).resolve()
 if builder!=(root/PATHS[0]).resolve():raise ValueError('Run the committed tools/diagnostics builder')
 if subprocess.check_output(['git','rev-parse',BASELINE_COMMIT+':runtime'],cwd=root,text=True).strip()!=FROZEN_RUNTIME_TREE:raise ValueError('Frozen109 runtime tree changed')
 inputs={}
 for path in PATHS:
  data=(root/path).read_bytes()
  if data!=subprocess.check_output(['git','show',commit+':'+path],cwd=root):raise ValueError('Uncommitted diagnostic input: '+path)
  inputs[path]=data
 return inputs

def schema():
 return {'schema':2,'source_entity':'self minecraft:player only','preconditions':['single-player copied private world','Creative mode','no custom/native effects; canonical custom state verified manually in host guide','ordinary first-person perspective chosen manually','no other camera owners; caller acknowledges clean_no_other_camera'],
 'namespace':'kt_camera_probe','commands':{
  'inspect':'read-only snapshot and capability report in self-chat and content log',
  'status':'one bounded self-chat line: source, requested parameters, API/end state and sample count; not rendered readback',
  'run free_delivery clean_no_other_camera':'3-point progressing free-camera delivery control; X+2 blocks and yaw+20 degrees by2s, hold20s',
  'scene build':'preflight77 loaded air blocks; build marked11x7 wall; no player rotation/teleport',
  'scene clear':'clear only tracked unchanged marker blocks; no camera state change',
  'run normal_plus clean_no_other_camera':'playAnimation on current camera; no setCamera; Z0 to+8, hold20s',
  'run normal_minus clean_no_other_camera':'playAnimation on current camera; no setCamera; Z0 to-8, hold20s',
  'run free_zero clean_no_other_camera':'explicit near-stationary free-camera control; Z0, hold20s',
  'run free_plus clean_no_other_camera':'explicit near-stationary free camera; Z0 to+8, hold20s',
  'run free_minus clean_no_other_camera':'explicit near-stationary free camera; Z0 to-8, hold20s',
  'run free_wave clean_no_other_camera':'8s Java-formula samples using server-currentTick calibration; not exact Java client age/partialTick',
  'abort':'clear only an active owned diagnostic; cancel deferred playback'},
 'animation_schema':{'spline':'LinearSpline, three distinct eye-origin points; total X span2 blocks for delivery or0.02 for axis controls','progressKeyFrames':'alpha0 at0s to1 at2s; hold1 until end','rotationKeyFrames':{'rotation':'Vector3 {x:-captured player pitch,y:180-captured player yaw,z:diagnostic axis}; candidate inverse calibration, not official convention guarantee','easingFunc':'EasingType.Linear'},'totalTimeSeconds':'20 endpoint calibration or8 waveform'},
 'log_prefix':'[TavernCameraProbe]','log_rate':'sample every4ticks, max110 samples per test','cleanup':['timeout','explicit abort','milk completion','death/respawn','dimension change','leave','movement>0.25 block','API/sampler error','single-player/Creative/native-effect precondition change'],
 'parity_claim':False,'native_tested':False,'limitations':['Inverse Euler mapping hypothesis and native Z sign remain unverified for aligned view','Old b46464e two-point constant-progress trial is inconclusive for Z support','Establish visible free_delivery translation/yaw before evaluating roll','No active-camera getter/foreign-camera restore API','A fixed free-camera roll does not establish ordinary first-person behavior','Still screenshots prove endpoints, not continuous waveform fidelity','Scene tracking is in memory; clear scene before unloading probe or discard private world']}

def make_files(inputs,commit):
 identity=sha((commit+''.join(sha(inputs[p]) for p in PATHS)).encode())
 header=str(uuid.uuid5(uuid.NAMESPACE_URL,'tavern-camera-probe/header/'+identity));module=str(uuid.uuid5(uuid.NAMESPACE_URL,'tavern-camera-probe/module/'+identity));script_module=str(uuid.uuid5(uuid.NAMESPACE_URL,'tavern-camera-probe/script/'+identity))
 source=inputs[PATHS[1]].decode()
 if source.count('__PROBE_SOURCE_COMMIT__')!=1:raise ValueError('Invalid source provenance placeholder')
 source=source.replace('__PROBE_SOURCE_COMMIT__',commit)
 manifest={'format_version':2,'header':{'name':'Private camera parity probe '+commit[:8],'description':'Opt-in stable API2.7 camera/aim diagnostic; not a production repair','uuid':header,'version':[0,0,1],'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':module,'version':[0,0,1]},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':script_module,'version':[0,0,1]}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]}
 provenance={'schema':1,'source_commit':commit,'canonical_baseline_commit':BASELINE_COMMIT,'frozen_runtime_tree':FROZEN_RUNTIME_TREE,'identity_seed_sha256':identity,'inputs':[{'path':p,'sha256':sha(inputs[p])} for p in PATHS],'header_uuid':header,'data_module_uuid':module,'script_module_uuid':script_module,'source_links':SOURCES,'copies_canonical_bp':False,'native_tested':False,'production_ready':False,'parity_verified':False}
 files={'manifest.json':encode(manifest),'scripts/main.js':source.encode(),'probe_schema.json':encode(schema()),'diagnostic_provenance.json':encode(provenance),'CAMERA-PROBE.md':inputs[PATHS[2]],'LICENSE-CODE':inputs[PATHS[3]]}
 return files,provenance

def output_guard(root,out):
 root=root.resolve();out=out.resolve()
 if out==root or root in out.parents:raise ValueError('Diagnostic output must be outside the frozen repository')
 return out

def write_pack(inputs,commit,out,repo_root=None):
 out=output_guard(repo_root or Path(__file__).resolve().parents[2],out)
 files,provenance=make_files(inputs,commit);out.mkdir(parents=True,exist_ok=True);pack=out/('Tavern-camera-parity-probe-'+commit[:8]+'.mcpack')
 if pack.exists():raise FileExistsError('Refuse to replace an existing diagnostic archive')
 with zipfile.ZipFile(pack,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
  for path,data in sorted(files.items()):
   info=zipfile.ZipInfo(path,date_time=(2026,10,6,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;archive.writestr(info,data)
 report={**provenance,'pack':str(pack),'pack_sha256':sha(pack.read_bytes()),'pack_size':pack.stat().st_size,'files':[{'path':p,'sha256':sha(b),'size':len(b)} for p,b in sorted(files.items())]}
 (out/'camera-probe-build-report.json').write_bytes(encode(report));return report

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);parser.add_argument('--out-dir',type=Path,required=True);args=parser.parse_args();root=args.root.resolve();commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip();inputs=committed_inputs(root,commit);print(json.dumps(write_pack(inputs,commit,args.out_dir.resolve(),root),indent=2))
if __name__=='__main__':main()
