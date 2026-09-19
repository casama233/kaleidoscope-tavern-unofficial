export type LocaleText = Partial<Record<'zh_TW'|'zh_CN'|'en_US',string>>;
export type Output = {item:string;byQuality?:never}|{byQuality:[string,string,string,string,string,string];item?:never};
export type PressingRecipe = {id:string;kind:'pressing';input:string[];fluid:string;amount:number;title?:LocaleText};
export type BarrelRecipe = {id:string;kind:'barrel';fluid:string;ingredients:string[][];carrier?:string;unitTime?:number;noIngredientCount?:number;output:Output;title?:LocaleText};
export type GuidePage = {id:string;title:LocaleText;body:LocaleText;recipeIds?:string[];icon?:string};
export type TavernExtension = {api:1;source:string;version:string;title?:LocaleText;recipes?:(PressingRecipe|BarrelRecipe)[];pages?:GuidePage[]};
export interface ScriptSystemLike {run(fn:()=>void):number;runTimeout(fn:()=>void,ticks:number):number;clearRun(id:number):void;sendScriptEvent(id:string,message:string):void;afterEvents:{scriptEventReceive:{subscribe(fn:(event:{id:string;message:string;sourceType:string})=>void,options?:{namespaces:string[]}):unknown;unsubscribe(fn:(event:{id:string;message:string;sourceType:string})=>void):void}};}
export declare function registerTavernExtension(system:ScriptSystemLike,payload:TavernExtension,options?:{log?:(message:string)=>void;maxAttempts?:number}):{readonly registered:boolean;readonly attempts:number;dispose():void};
