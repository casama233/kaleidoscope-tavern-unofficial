/** Client-side pure utilities used by the public Tavern extension SDK. */
export class TavernError extends Error {
 constructor(code,detail=''){super(detail?`${code}: ${detail}`:code);this.name='TavernError';this.code=code;}
}
export function check(ok,code,detail=''){if(!ok)throw new TavernError(code,detail);}
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export function utf8Bytes(s){let n=0;for(const c of s){const v=c.codePointAt(0);n+=v<128?1:v<2048?2:v<65536?3:4;}return n;}
/** Integrity checksum, NOT a signature/authentication mechanism. */
export function digest(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16).padStart(8,'0');}
