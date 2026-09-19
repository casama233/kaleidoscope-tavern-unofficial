export type Fixture = 'barrel'|'pressing_tub';
export interface FrameSchedule { sequence:number[]; durations:number[]; slots:number; interpolate:boolean; }
export interface ParticleState { x:number;y:number;z:number;dx:number;dy:number;dz:number; }
export function liquidFrame(fixture:Fixture, amount:number):Readonly<{fixture:Fixture;amount:number;capacity:number;visible:boolean;yBlocks:number;widthBlocks:number}>;
export function sourceFrame(schedule:FrameSchedule,tick:number):Readonly<{frame:number;nextFrame:number;step:number;blend:number}>;
export function boardRotation(rotation:number):Readonly<{rotation:number;yawDegrees:number;event:string}>;
export function shakerSourcePose(timeTicks:number,hand?:'left'|'right',active?:boolean):Readonly<{wave:number;translationBlocks:readonly number[];firstPersonRotationXDegrees:number;armRotationXRadians:number;armRotationZRadians:number}>|null;
export function rgbProperties(red:number,green:number,blue:number):Readonly<Record<'kt_art:red'|'kt_art:green'|'kt_art:blue',number>>;
export function incenseStep(state:ParticleState,random:number[],firefly?:boolean):Readonly<ParticleState>;
