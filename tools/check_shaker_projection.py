"""Keep full-mesh hypothetical overflow visible; fail closed for native acceptance.

No camera is inferred from a head pivot or Java's separately reset hand FOV.
The report is static sensitivity evidence, not a Minecraft player simulation.
"""
import argparse,copy,hashlib,json,sys
from pathlib import Path
from shaker_full_projection import bounds,corners,dot,frustum,records,variation_support

ROOT=Path(__file__).resolve().parents[1]
FRAME_PATH=ROOT/'art/interfaces/native-fp-frame-1.26.50.4.json'
CONTEXT_PATH=ROOT/'art/interfaces/shaker-display-context.json'
ANIMATION_PATH=ROOT/'runtime/RP/animations/runtime_shaker.animation.json'
GEOMETRY_PATH=ROOT/'runtime/RP/models/entity/runtime_shaker_held.geo.json'

def load(p):return json.loads(p.read_text(encoding='utf-8'))

def report():
 frame=load(FRAME_PATH);context=load(CONTEXT_PATH)
 geometry=load(GEOMETRY_PATH)['minecraft:geometry'][0]
 animations=load(ANIMATION_PATH)['animations'];rows=[];legacy=[]
 for skin,profile in context['source_skin_profiles'].items():
  sf=copy.deepcopy(frame);sf['player_bones'].update(profile['bones'])
  for name in ('hold_first','shake_first'):
   for pitch in (-85,0,85):
    rr=[r for wave in ((-1,1) if name=='shake_first' else (0,))
        for r in records(sf,geometry,animations['animation.kt_mixology.'+name],wave,pitch)]
    for width,height in ((1180,792),(1920,1080),(1024,768)):
     for fov in (35,60,70,90,110): # Sensitivity samples, not verified slider endpoints.
      for convention in ('horizontal','vertical'):
       bb=bounds(rr,width/height,convention,fov)
       row={'skin_source':skin,'state':name,'pitch_hypothesis':pitch,
            'viewport':[width,height],'fov_hypothesis':fov,'convention':convention,
            'corner_count':len(rr),'ndc_bounds':bb,
            'strict_viewport_inside':all(-1<a<=b<1 for a,b in bb)}
       rows.append(row)
       if skin=='classic' and fov==60:
        for label,limit,variations in (('eight_percent_margin',.92,False),('variation_inside',1,True)):
         violations=[]
         for edge,n in frustum(fov,width/height,convention,limit):
          support=variation_support(sf,n,pitch) if variations else 0
          for r in rr:
           value=dot(n,r['camera'])+support
           if value>=0:violations.append({'edge':edge,'cube':r['cube'],
            'corner':r['corner'],'wave':r['wave'],'plane_excess':value})
         legacy.append({**{k:v for k,v in row.items() if k!='ndc_bounds'},
                        'diagnostic':label,'limit':limit,'violation_count':len(violations),
                        'violations':violations})
 return {'schema':1,'status':'unknown_native_display_context',
  'native_accepted':False,'native_projection_gate_passed':False,
  'animation_sha256':hashlib.sha256(ANIMATION_PATH.read_bytes()).hexdigest(),
  'mesh_corner_count':len(list(corners(geometry))),
  'context':context['bedrock_native_context'],
  'hypothesis_notes':[
   'Head pivot is a model bone, not a measured camera eye.',
   'Horizontal and vertical conventions are alternatives, not two simultaneous engine requirements.',
   'Short-arm compensation and player scale inheritance are unknown; source Slim geometry is not measured skin acceptance.',
   'Pitch covariance follows the assumed shared frame, not an observed engine pitch transform.',
   'Variation support preserves the previous +/-0.5 local X budget as sensitivity, not a Slim offset.'
  ],'sensitivity_rows':rows,'original_fov60_diagnostics':legacy}

def main(argv=None):
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--report',type=Path)
 parser.add_argument('--require-native-context',action='store_true')
 args=parser.parse_args(argv);result=report()
 if args.report:
  args.report.parent.mkdir(parents=True,exist_ok=True)
  args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'status':result['status'],'native_projection_gate_passed':False,
  'mesh_corners':result['mesh_corner_count'],'sensitivity_rows':len(result['sensitivity_rows']),
  'original_fov60_violations':sum(r['violation_count'] for r in result['original_fov60_diagnostics'])}))
 if args.require_native_context:
  print('BLOCKED: no calibrated Bedrock held camera/projection, near plane, skin compensation or pitch context. Static source tests cannot substitute for native validation.',file=sys.stderr)
  return 2
 return 0

if __name__=='__main__':sys.exit(main())
