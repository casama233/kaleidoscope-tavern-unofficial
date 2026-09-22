import {registerTavernExtension,type TavernExtension,type ScriptSystemLike,type BarrelRecipe,type PressingRecipe,type ShakerRecipe,type ShakerInputDescriptor} from '../sdk/tavern-extension-client.js';
const payload:TavernExtension={api:1,source:'example',version:'1.0.0',recipes:[{id:'example:apple',kind:'pressing',input:['minecraft:apple'],fluid:'kaleidoscope_tavern:grape_juice',amount:250},{id:'example:wine',kind:'barrel',fluid:'minecraft:water',ingredients:[['minecraft:glow_berries']],output:{item:'kaleidoscope_tavern:wine_q3'}}],pages:[{id:'example:about',title:{en_US:'About'},body:{zh_TW:'說明'}}]};
declare const system:ScriptSystemLike;
registerTavernExtension(system,payload,{maxAttempts:3});
// @ts-expect-error API1 only
const wrongApi:TavernExtension={api:2,source:'example',version:'1.0.0'};
// @ts-expect-error Six quality IDs, never fewer
const badQuality:BarrelRecipe={id:'example:bad',kind:'barrel',fluid:'minecraft:water',ingredients:[],output:{byQuality:['x:a','x:b']}};
// @ts-expect-error unknown recipe kinds are deliberately not advertised
const unsupported:PressingRecipe={id:'example:bad',kind:'shaker',input:[],fluid:'minecraft:water',amount:125};
// @ts-expect-error Pressing cannot pretend it has barrel quality outputs
const badPress:PressingRecipe={id:'example:bad',kind:'pressing',input:['minecraft:apple'],fluid:'minecraft:water',amount:125,output:{item:'example:drink'}};

const shaker:ShakerRecipe={id:'example:mix',kind:'shaker',ingredients:[['kaleidoscope_tavern:wine_q4'],['kaleidoscope_cookery:rice'],['minecraft:apple']],output:{item:'kaleidoscope_tavern:emerald'}};
const mixed:TavernExtension={api:1,source:'example',version:'1.0.0',recipes:[shaker]};
// @ts-expect-error Shaker requires exactly three ingredient slots
const badShakerSlots:ShakerRecipe={id:'example:bad',kind:'shaker',ingredients:[['minecraft:apple']],output:{item:'example:cup'}};
// @ts-expect-error Shaker output is one item, not fermentation qualities
const badShakerQuality:ShakerRecipe={id:'example:bad',kind:'shaker',ingredients:[['minecraft:apple'],['minecraft:apple'],['minecraft:apple']],output:{byQuality:['a:b','a:c','a:d','a:e','a:f','a:g']}};
// @ts-expect-error Shaker recipes do not consume a barrel fluid
const badShakerFluid:ShakerRecipe={id:'example:bad',kind:'shaker',ingredients:[['minecraft:apple'],['minecraft:apple'],['minecraft:apple']],fluid:'minecraft:water',output:{item:'example:cup'}};

const worldLiquorInput:ShakerInputDescriptor={item:'example:gin',container:'minecraft:glass_bottle',color:0x77aaff,effects:[{effect:'minecraft:speed',duration:30,amplifier:0,probability:1}]};
const worldLiquorStyle:TavernExtension={api:1,source:'example',version:'1.0.0',shakerInputs:[worldLiquorInput]};
// @ts-expect-error effect snapshots require an explicit probability
const badWorldLiquorInput:ShakerInputDescriptor={item:'example:gin',effects:[{effect:'minecraft:speed',duration:30,amplifier:0}]};
