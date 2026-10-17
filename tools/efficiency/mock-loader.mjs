/** Only native APIs are doubled; all imported Tavern modules are production files. */
export async function resolve(specifier,context,next){
 if(specifier==='@minecraft/server'||specifier==='@minecraft/server-ui')return {url:new URL('./mock-server.mjs',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}
