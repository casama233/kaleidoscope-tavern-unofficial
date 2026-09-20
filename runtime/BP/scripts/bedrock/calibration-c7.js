/** C7 engine-side probe for native shaker input and hand/spout calibration. Does not claim visual acceptance. */
import {world,system,ScriptEventSource} from '@minecraft/server';
import {nativeUseDiagnostics} from './mixology.js';
import {HAND_CALIBRATION} from '../data/hand-calibration.js';
export const calibrationDiagnostics={requests:0,last:null,engineAcceptance:'NOT_RUN'};
function report(player){const n=nativeUseDiagnostics;const c=HAND_CALIBRATION;const msg=`§b[Tavern C7] native start=${n.starts} release=${n.releases} cancel=${n.cancelled} dup=${n.duplicateStops} | spout=${c.spout.position.join(',')} | wrist=NOT_CALIBRATED`;try{player?.sendMessage(msg);player?.onScreenDisplay?.setActionBar(msg);}catch{}calibrationDiagnostics.requests++;calibrationDiagnostics.last={tick:system.currentTick,starts:n.starts,releases:n.releases,cancelled:n.cancelled,spout:c.spout,wristStatus:c.status};return msg;}
export function installCalibrationC7(){world.afterEvents.scriptEventReceive?.subscribe(e=>{if(e.id!=='kaleidoscope_tavern:c7_calibration')return;if(e.sourceType!==ScriptEventSource.Entity||e.sourceEntity?.typeId!=='minecraft:player')return;report(e.sourceEntity);},{namespaces:['kaleidoscope_tavern']});}
export const CALIBRATION_TEST={report};
