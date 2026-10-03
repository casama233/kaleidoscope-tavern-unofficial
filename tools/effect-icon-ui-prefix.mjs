/** JSON-UI expressions, not Molang. Do not truncate non-ASCII format markers. */
import {EFFECT_ICON_PREFIX} from '../runtime/BP/scripts/core/effect-icons.js';

export function effectIconPrefixExpression(){
 const text='#hud_subtitle_text_string',prefix=`'${EFFECT_ICON_PREFIX}'`,rest=`(${text} - ${prefix})`;
 // Reconstruction requires the marker at the start. The second comparison
 // rejects a duplicate marker under either remove-first or remove-all string
 // subtraction semantics. A prefix-only packet remains a valid clear snapshot.
 return `((${prefix} + ${rest}) = ${text} and (${rest} - ${prefix}) = ${rest})`;
}

/** Test-only semantic model; native client validation is still required. */
export function matchesEffectIconPrefix(text,remove){
 const rest=remove(text,EFFECT_ICON_PREFIX);
 return EFFECT_ICON_PREFIX+rest===text&&remove(rest,EFFECT_ICON_PREFIX)===rest;
}
