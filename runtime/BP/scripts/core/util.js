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
export function utf8Bytes(s) {
 // Keep the public iterable fallback; wire strings need no per-codepoint string.
 if(typeof s!=='string'){let n=0;for(const c of s){const v=c.codePointAt(0);n+=v<128?1:v<2048?2:v<65536?3:4;}return n;}
 let n=0;
 for(let i=0;i<s.length;i++){
  const v=s.charCodeAt(i);
  if(v<128)n++;
  else if(v<2048)n+=2;
  else if(v>=0xd800&&v<=0xdbff&&i+1<s.length&&s.charCodeAt(i+1)>=0xdc00&&s.charCodeAt(i+1)<=0xdfff){n+=4;i++;}
  else n+=3;
 }
 return n;
}
/** Integrity checksum, NOT a signature/authentication mechanism. */
export function digest(s) { let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0'); }
export function localeText(value,locale='zh_TW') { if(typeof value==='string')return value;return value?.[locale]??value?.en_US??value?.zh_TW??value?.zh_CN??''; }
export function localeMap(value) { check(value&&typeof value==='object'&&!Array.isArray(value),'INVALID_LOCALE_MAP');const result={};for(const [k,v]of Object.entries(value)){check(['zh_TW','zh_CN','en_US'].includes(k),'UNSUPPORTED_LOCALE');result[k]=text(v,8192);}check(Object.keys(result).length>0,'EMPTY_LOCALE_MAP');return result; }
export function sorted(items,fn=x=>x.id) { return [...items].sort((a,b)=>fn(a)<fn(b)?-1:fn(a)>fn(b)?1:0); }

/** JSON data preparation with bounded work between yields. Wire order is unchanged. */
function* quotedTokens(value){
 let prefix='"';
 if(value.length===0){yield '""';return;}
 for(let start=0;start<value.length;){
  let end=Math.min(value.length,start+1024);
  if(end<value.length){
   const left=value.charCodeAt(end-1),right=value.charCodeAt(end);
   if(left>=0xd800&&left<=0xdbff&&right>=0xdc00&&right<=0xdfff)end--;
  }
  const escaped=JSON.stringify(value.slice(start,end)).slice(1,-1);
  yield prefix+escaped+(end===value.length?'"':'');
  prefix='';start=end;
 }
}

function* jsonTokens(value,canonicalKeys,arrayMember=false){
 if(typeof value==='string'){yield* quotedTokens(value);return;}
 if(Array.isArray(value)){
  yield '[';
  for(let i=0;i<value.length;i++){
   if(i)yield ',';
   if(canonicalKeys&&!Object.hasOwn(value,i))continue;
   yield* jsonTokens(value[i],canonicalKeys,true);
  }
  yield ']';return;
 }
 if(value&&typeof value==='object'){
  yield '{';let comma=false;
  const keys=Object.keys(value);if(canonicalKeys)keys.sort();
  for(const key of keys){
   const row=value[key];
   if(!canonicalKeys&&['undefined','function','symbol'].includes(typeof row))continue;
   if(comma)yield ',';comma=true;
   yield* quotedTokens(key);yield ':';yield* jsonTokens(row,canonicalKeys);
  }
  yield '}';return;
 }
 const encoded=JSON.stringify(value);
 yield encoded===undefined?(canonicalKeys?(arrayMember?'':'undefined'):'null'):encoded;
}
export function* prepareJson(value,{canonicalKeys=false}={}){
 const parts=[];let units=0,tokens=0;
 for(const token of jsonTokens(value,canonicalKeys)){
  parts.push(token);units+=token.length;
  if(++tokens>=128||units>=2048){units=0;tokens=0;yield;}
 }
 return parts.join('');
}
export function* prepareDigest(value){
 let h=2166136261;
 for(let i=0;i<value.length;i++){
  h^=value.charCodeAt(i);h=Math.imul(h,16777619);
  if((i+1)%2048===0)yield;
 }
 return (h>>>0).toString(16).padStart(8,'0');
}
/** JSON clone for owned plain data, without one large stringify/parse step. */
export function* prepareClone(value){
 let nodes=0;
 function* copy(row){
  if(++nodes%64===0)yield;
  if(Array.isArray(row)){const out=[];for(const item of row)out.push(yield* copy(item));return out;}
  if(row&&typeof row==='object'){const out={};for(const [key,item]of Object.entries(row))if(!['undefined','function','symbol'].includes(typeof item))out[key]=yield* copy(item);return out;}
  return typeof row==='number'&&!Number.isFinite(row)?null:row;
 }
 return yield* copy(value);
}
/** Exact UTF-8 cost inside a JSON-quoted string, excluding its two quotes. */
export function jsonCodepointBytes(code){
 return code===34||code===92||code===8||code===9||code===10||code===12||code===13?2:
  code<32||code>=0xd800&&code<=0xdfff?6:code<128?1:code<2048?2:code<65536?3:4;
}
export function finishPreparation(job){let result;do{result=job.next();}while(!result.done);return result.value;}

/** Item definition tags are fixed for this boot; extension tag mutations remain separate. */
export function cacheItemDefinitionTags(read){
 const values=new Map();
 return id=>{if(values.has(id))return values.get(id);try{const tags=Object.freeze([...read(id)]);values.set(id,tags);return tags;}catch{return [];}};
}

/** Known native item definitions are fixed for this boot. Retry unknown/error reads. */
export function cacheNativeItemDefinitionExists(read){
 const known=new Set();
 return id=>{
  if(known.has(id))return true;
  const exists=!!read(id);
  if(exists)known.add(id);
  return exists;
 };
}
