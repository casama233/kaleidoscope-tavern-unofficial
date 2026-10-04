"""Independent static frustum math, never native Minecraft acceptance.

Uses serialized runtime bones and source-backed reference pivots. No generator,
expected(), or calibration() import. The head-centered camera is hypothetical.
Actual held FOV/eye, player scale inheritance and short-arm compensation remain
unmeasured. Optional socket X +/-0.5 is a sensitivity budget, not a slim skin.
"""
import itertools,math

WAVE='math.sin(q.life_time * 1718.87338539247)'
def ident():return [[float(i==j) for j in range(4)] for i in range(4)]
def mm(a,b):return [[sum(a[i][k]*b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
def compose(*matrices):
 m=ident()
 for n in matrices:m=mm(m,n)
 return m
def tr(v):
 m=ident()
 for i in range(3):m[i][3]=v[i]
 return m
def rotation(axis,degrees):
 m=ident();a=math.radians(degrees);c=math.cos(a);s=math.sin(a)
 i,j={'x':(1,2),'y':(2,0),'z':(0,1)}[axis]
 m[i][i]=m[j][j]=c;m[i][j]=-s;m[j][i]=s
 return m
def bedrock_rotation(r):return compose(rotation('z',r[2]),rotation('y',-r[1]),rotation('x',-r[0]))
def inverse_rigid(m):
 out=ident()
 for i in range(3):
  for j in range(3):out[i][j]=m[j][i]
  out[i][3]=-sum(m[j][i]*m[j][3] for j in range(3))
 return out
def transform(m,p):return [sum(m[i][j]*p[j] for j in range(3))+m[i][3] for i in range(3)]
def vector(m,p):return [sum(m[i][j]*p[j] for j in range(3)) for i in range(3)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def clip_violations(matrix,points,xy_limit=.92,depth_convention='minus_one_to_one'):
 """Test the full homogeneous clip volume, without inferring an engine FOV.

 Matrix is local mesh -> clip, including the actual model/view/projection.
 A measured context must provide its depth convention; this pure calculation
 does not supply or authenticate native renderer evidence.
 """
 if depth_convention not in ('minus_one_to_one','zero_to_one'):raise ValueError(depth_convention)
 if not 0<xy_limit<=1:raise ValueError('Invalid viewport margin')
 if len(matrix)!=4 or any(len(row)!=4 for row in matrix):raise ValueError('Expected 4x4 clip matrix')
 if not all(math.isfinite(x) for row in matrix for x in row):raise ValueError('Non-finite clip matrix')
 failures=[]
 for ci,corner,p in points:
  x,y,z,w=[sum(row[i]*p[i] for i in range(3))+row[3] for row in matrix]
  excess={'behind_eye':-w,'right':x-xy_limit*w,'left':-x-xy_limit*w,
          'top':y-xy_limit*w,'bottom':-y-xy_limit*w,
          'near':-z-w if depth_convention=='minus_one_to_one' else -z,'far':z-w}
  # XY budget is strict, eye must be positive; native near/far boundaries
  # themselves are inclusive. Never perspective-divide a nonpositive w.
  for edge,value in excess.items():
   breaches=value>0 if edge in ('near','far') else value>=0
   if breaches:
    failures.append({'cube':ci,'corner':corner,'edge':edge,'excess':value})
 return failures
def evaluate(value,wave):
 if isinstance(value,(int,float)):return value
 return eval(value.replace(WAVE,'wave'),{'__builtins__':{}},{'wave':wave})
def bone_transform(b,wave):
 p=[evaluate(v,wave) for v in b.get('position',[0,0,0])];r=b.get('rotation',[0,0,0]);s=b.get('scale',1)
 s=[s]*3 if isinstance(s,(int,float)) else s
 sm=ident()
 for i in range(3):sm[i][i]=s[i]
 return compose(tr([-p[0],p[1],p[2]]),bedrock_rotation(r),sm)
def corners(geometry):
 for bone in geometry['bones']:
  for ci,cube in enumerate(bone.get('cubes',[])):
   for c in itertools.product((0,1),repeat=3):yield ci,c,[cube['origin'][i]+c[i]*cube['size'][i] for i in range(3)]
def reference_socket(frame,pitch=0):
 b=frame['player_bones'];arm=b['rightarm']['pivot'];item=b['rightitem']['pivot'];p=frame['empty_hand']['rightarm']['position'];head=b['head']['pivot']
 # Exact non-VR empty_hand rotation and item Y/Z pivot cancellation.
 arm_matrix=compose(tr([-arm[0]-p[0],arm[1]+p[1],p[2]]),bedrock_rotation([95,-45,115]))
 socket=compose(arm_matrix,tr([arm[0]-item[0],-7,0]))
 body=compose(tr(head),bedrock_rotation([pitch,0,0]),tr([-v for v in head]))
 camera=compose(body,tr(head),rotation('y',180))
 return compose(body,socket),camera,compose(inverse_rigid(camera),body,arm_matrix)
def records(frame,geometry,animation,wave=0,pitch=0):
 socket,camera,_=reference_socket(frame,pitch)
 m=compose(inverse_rigid(camera),socket,bone_transform(animation['bones']['grip'],wave),tr([0,-24,0]))
 return [{'cube':ci,'corner':c,'wave':wave,'camera':transform(m,p)} for ci,c,p in corners(geometry)]
def half_angles(fov,aspect,convention):
 if not math.isfinite(fov) or not 0<fov<180:raise ValueError('FOV must be between 0 and 180 degrees')
 if not math.isfinite(aspect) or aspect<=0:raise ValueError('Aspect ratio must be positive')
 h=v=math.tan(math.radians(fov/2))
 if convention=='vertical':h*=aspect
 elif convention=='horizontal':v/=aspect
 else:raise ValueError(convention)
 return h,v
def frustum(fov,aspect,convention,limit=1):
 h,v=half_angles(fov,aspect,convention)
 return [('right',[1,0,h*limit]),('left',[-1,0,h*limit]),('top',[0,1,v*limit]),('bottom',[0,-1,v*limit])]
def walking_support(normal,hand_bob_max=.1):
 # Camera/body X is the Molang arm-position X after geometry reflection
 # and the 180-degree camera transform. theta=-walk_distance*180 degrees.
 # X=9.75*b*sin(theta), Y=-15*b*abs(cos(theta)), Z=0, b in [0,.1].
 a=normal[0]*9.75*hand_bob_max;b=-normal[1]*15*hand_bob_max
 return math.hypot(a,b) if b>0 else abs(a)
def variation_support(frame,normal,pitch=0,walking=True,breathing=.5,socket_x=.5):
 _,_,arm_camera=reference_socket(frame,pitch)
 return (walking_support(normal) if walking else 0)+breathing*abs(dot(normal,vector(arm_camera,[0,1,0])))+socket_x*abs(dot(normal,vector(arm_camera,[1,0,0])))
def bounds(records,aspect,convention,fov=60):
 h,v=half_angles(fov,aspect,convention)
 if any(p['camera'][2]>=0 for p in records):raise ValueError('Perspective bounds require strictly positive depth')
 values=[(p['camera'][0]/(-p['camera'][2]*h),p['camera'][1]/(-p['camera'][2]*v)) for p in records]
 return [[min(p[i] for p in values),max(p[i] for p in values)] for i in range(2)]
def fit_depth(records,frame,limit=.92,variations=False,optimize_y=True,preserve_x=True):
 kh=math.tan(math.radians(30))*limit;kv=kh/(16/9)
 normals=dict(frustum(60,16/9,'horizontal',limit))
 support={edge:variation_support(frame,n) if variations else 0 for edge,n in normals.items()}
 a=max(dot(normals['top'],r['camera']) for r in records)+support['top']
 b=max(dot(normals['bottom'],r['camera']) for r in records)+support['bottom']
 ar=max(dot(normals['right'],r['camera']) for r in records)+support['right']
 bl=max(dot(normals['left'],r['camera']) for r in records)+support['left']
 dy=(b-a)/2 if optimize_y else 0
 back=max((a+dy)/kv,(b-dy)/kv,ar/kh if preserve_x else (ar+bl)/(2*kh),0)
 lower=bl-kh*back;upper=kh*back-ar
 dx=0 if preserve_x else min(max(0,lower),upper)
 return {'delta':[dx,dy,-back],'supports':support,'vertical_required_depth':max((a+dy)/kv,(b-dy)/kv),'horizontal_required_depth':ar/kh if preserve_x else (ar+bl)/(2*kh)}
