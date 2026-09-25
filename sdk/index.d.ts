export type LocaleText = Partial<Record<'zh_TW'|'zh_CN'|'en_US',string>>;
export type Output = {item:string;byQuality?:never}|{byQuality:[string,string,string,string,string,string];item?:never};
export type PressingRecipe = {id:string;kind:'pressing';input:string[];fluid:string;amount:number;title?:LocaleText};
export type BarrelRecipe = {id:string;kind:'barrel';fluid:string;ingredients:string[][];carrier?:string;unitTime?:number;noIngredientCount?:number;output:Output;title?:LocaleText};
export type ShakerRecipe = {id:string;kind:'shaker';ingredients:[string[],string[],string[]];output:{item:string;byQuality?:never};carrier?:string;title?:LocaleText};
export type GuideCategory = 'equipment'|'barrel'|'cocktail'|'storage'|'cultivation'|'furniture'|'lighting'|'incense'|'art'|'boards'|'food';
export type GuideCrafting = {method:'Crafting Table';result:string;ingredients:string[];count?:number;time?:0};
export type GuidePage = {id:string;title:LocaleText;body:LocaleText;recipeIds?:string[];icon?:string;item?:string;category?:GuideCategory;crafting?:GuideCrafting[]};
export type EffectSnapshot = {effect:string;duration:number;amplifier:number;probability:number};
export type ShakerInputDescriptor = {item:string;container?:string|null;color?:number;effects?:EffectSnapshot[]};
export type TavernExtension = {api:1;source:string;version:string;title?:LocaleText;recipes?:(PressingRecipe|BarrelRecipe|ShakerRecipe)[];pages?:GuidePage[];shakerInputs?:ShakerInputDescriptor[]};
export interface ScriptSystemLike {run(fn:()=>void):number;runTimeout(fn:()=>void,ticks:number):number;clearRun(id:number):void;sendScriptEvent(id:string,message:string):void;afterEvents:{scriptEventReceive:{subscribe(fn:(event:{id:string;message:string;sourceType:string})=>void,options?:{namespaces:string[]}):unknown;unsubscribe(fn:(event:{id:string;message:string;sourceType:string})=>void):void}};}
export declare function registerTavernExtension(system:ScriptSystemLike,payload:TavernExtension,options?:{log?:(message:string)=>void;maxAttempts?:number}):{readonly registered:boolean;readonly attempts:number;dispose():void};
