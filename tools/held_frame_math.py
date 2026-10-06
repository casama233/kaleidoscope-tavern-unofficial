"""Pinned native attachment-frame math; not Minecraft client acceptance."""
import math
def mul(a, b):
    return [[sum(a[i][k]*b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
def chain(*args):
    result = identity()
    for value in args: result = mul(result, value)
    return result
def identity(): return [[float(i == j) for j in range(4)] for i in range(4)]
def translate(v):
    m=identity()
    for i in range(3): m[i][3]=v[i]
    return m
def scale(v):
    m=identity()
    for i in range(3): m[i][i]=v[i]
    return m
def rotate(axis, degrees):
    a=math.radians(degrees);c=math.cos(a);s=math.sin(a);m=identity()
    i,j={'x':(1,2),'y':(2,0),'z':(0,1)}[axis]
    m[i][i]=m[j][j]=c;m[i][j]=-s;m[j][i]=s
    return m
def xyz(v): return chain(rotate('x',v[0]),rotate('y',v[1]),rotate('z',v[2]))
def zyx(v): return chain(rotate('z',v[2]),rotate('y',v[1]),rotate('x',v[0]))
def rigid_inverse(m):
    out=identity()
    for i in range(3):
        for j in range(3): out[i][j]=m[j][i]
        out[i][3]=-sum(m[j][i]*m[j][3] for j in range(3))
    return out
def point(m,p): return [sum(m[i][j]*p[j] for j in range(3))+m[i][3] for i in range(3)]
def bedrock_rotation(m):
    y=math.asin(max(-1,min(1,-m[2][0])))
    if abs(math.cos(y))<1e-8: raise ValueError('Unreviewed Euler singularity')
    x=math.atan2(m[2][1],m[2][2]);z=math.atan2(m[1][0],m[0][0])
    return [-math.degrees(x),-math.degrees(y),math.degrees(z)]
def bone_matrix(b):
    s=b.get('scale',1);s=[s]*3 if isinstance(s,(int,float)) else s
    p=b.get('position',[0,0,0]);r=b.get('rotation',[0,0,0])
    return chain(translate([-p[0],p[1],p[2]]),zyx([-r[0],-r[1],r[2]]),scale(s))
def calibration(hand):
    sign=1 if hand=='right' else -1
    # Mojang 1.26.50.4 empty_hand: arm pivot/offset, then item socket.
    # Remove the attachable pivot, which the caller composes separately.
    arm=chain(translate([-8.5*sign,12,12]),zyx([-95,45*sign,115*sign]))
    base=chain(arm,translate([sign,-7,0]),translate([0,-24,0]))
    camera=chain(translate([0,24,0]),rotate('y',180))
    return base,camera

