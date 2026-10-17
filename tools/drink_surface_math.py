"""Static convex-face geometry inspection in model units; no client simulation."""
import math
FACES={'east':(0,1),'west':(0,-1),'up':(1,1),'down':(1,-1),'south':(2,1),'north':(2,-1)}
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def rotate(v,angles):
 x,y,z=v
 for axis,degrees in enumerate(angles):
  c,s=math.cos(math.radians(degrees)),math.sin(math.radians(degrees))
  if axis==0:y,z=y*c-z*s,y*s+z*c
  elif axis==1:x,z=x*c+z*s,-x*s+z*c
  else:x,y=x*c-y*s,x*s+y*c
 return x,y,z

def project(point,node):
 p=node.get('pivot',[0,0,0]);return add(p,rotate(sub(point,p),node.get('rotation',[0,0,0])))
def area(p):return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]+p[:1])))/2 if len(p)>2 else 0

def overlap(a,b):
 # Convex Sutherland-Hodgman clipping; winding independent.
 winding=sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(b,b[1:]+b[:1]));sign=1 if winding>0 else -1
 def side(p,u,v):return sign*((v[0]-u[0])*(p[1]-u[1])-(v[1]-u[1])*(p[0]-u[0]))
 for u,v in zip(b,b[1:]+b[:1]):
  old=a;a=[]
  if not old:break
  for p,q in zip(old,old[1:]+old[:1]):
   dp,dq=side(p,u,v),side(q,u,v)
   if dp>=-1e-9:a.append(p)
   if (dp>1e-9 and dq<-1e-9) or (dp<-1e-9 and dq>1e-9):
    t=dp/(dp-dq);a.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
 return area(a)

def faces(geo):
 bones={b['name']:b for b in geo['bones']};result=[]
 for bi,bone in enumerate(geo['bones']):
  chain=[];b=bone
  while b:
   chain.append(b);b=bones.get(b.get('parent'))
  for ci,c in enumerate(bone.get('cubes',[])):
   if not isinstance(c.get('uv'),dict):continue
   for f,uv in c['uv'].items():
    if f not in FACES:continue
    axis,sign=FACES[f];axes=[i for i in range(3) if i!=axis]
    if min(c['size'][i] for i in axes)<1e-7:continue
    points=[]
    for u,v in [(0,0),(1,0),(1,1),(0,1)]:
     p=list(c['origin']);p[axis]+=c['size'][axis] if sign==1 else 0
     p[axes[0]]+=u*c['size'][axes[0]];p[axes[1]]+=v*c['size'][axes[1]]
     p=project(p,c)
     for node in chain:p=project(p,node)
     points.append(p)
    n=[0,0,0];n[axis]=sign;n=rotate(n,c.get('rotation',[0,0,0]))
    for node in chain:n=rotate(n,node.get('rotation',[0,0,0]))
    result.append({'bone':bi,'cube':ci,'face':f,'points':points,'normal':n,'axis':axis,'sign':sign,'thin':min(c['size'])<=.125001})
 return result

def conflicts(geo,tolerance=.025,two_sided=False):
 rows=faces(geo);result=[]
 for i,a in enumerate(rows):
  for b in rows[i+1:]:
   if (a['bone'],a['cube'])==(b['bone'],b['cube']):continue
   alignment=dot(a['normal'],b['normal'])
   if (abs(alignment) if two_sided else alignment)<.999999:continue
   distance=dot(a['normal'],sub(b['points'][0],a['points'][0]))
   if abs(distance)>tolerance:continue
   skip=max(range(3),key=lambda n:abs(a['normal'][n]));axes=[n for n in range(3) if n!=skip]
   pa=[tuple(p[n] for n in axes) for p in a['points']];pb=[tuple(p[n] for n in axes) for p in b['points']]
   if overlap(pa,pb)>1e-6:result.append((a,b,distance,area(pa),area(pb)))
 return result
