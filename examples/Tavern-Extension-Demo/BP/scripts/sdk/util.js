/** Pure utilities: no Minecraft imports, commands, network or ambient state. */
export class TavernError extends Error {
  constructor(code, detail = '') { super(detail ? `${code}: ${detail}` : code); this.name='TavernError'; this.code=code; }
}
export function check(ok, code, detail='') { if (!ok) throw new TavernError(code,detail); }
export function id(value) { check(typeof value==='string' && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value) && value.length<=160,'INVALID_ID');return value; }
export function integer(n,min,max,field='number') { check(Number.isInteger(n)&&n>=min&&n<=max,'INVALID_NUMBER',field);return n; }
export function text(s,max=4096) { check(typeof s==='string'&&s.length<=max,'INVALID_TEXT');return s; }
export function clone(value) { return JSON.parse(JSON.stringify(value)); }
export function freeze(value) { if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);} return value; }
export function canonical(value) {
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export function utf8Bytes(s) { let n=0;for(const c of s){const v=c.codePointAt(0);n+=v<128?1:v<2048?2:v<65536?3:4;}return n; }
/** Integrity checksum, NOT a signature/authentication mechanism. */
export function digest(s) { let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0'); }
export function localeText(value,locale='zh_TW') { if(typeof value==='string')return value;return value?.[locale]??value?.en_US??value?.zh_TW??value?.zh_CN??''; }
export function localeMap(value) { check(value&&typeof value==='object'&&!Array.isArray(value),'INVALID_LOCALE_MAP');const result={};for(const [k,v]of Object.entries(value)){check(['zh_TW','zh_CN','en_US'].includes(k),'UNSUPPORTED_LOCALE');result[k]=text(v,8192);}check(Object.keys(result).length>0,'EMPTY_LOCALE_MAP');return result; }
export function sorted(items,fn=x=>x.id) { return [...items].sort((a,b)=>fn(a)<fn(b)?-1:fn(a)>fn(b)?1:0); }
