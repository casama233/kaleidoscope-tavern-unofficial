/** The same scenarios run against the pinned baseline and the candidate runtime.
 * Counters are API attempts, NOT engine CPU time, packets, disk writes or watts.
 */
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {Dimension,Player,world,system,counters,resetCounters} from './mock-server.mjs';
const root=path.resolve(process.argv[2]??'.'),load=p=>import(pathToFileURL(path.join(root,'runtime/BP/scripts',p)).href);
const cellar=await load('bedrock/cellar-cabinet.js'),core=await load('core/cellar-cabinet.js'),board=await load('bedrock/board-text.js'),ambient=await load('bedrock/java-ambient.js'),effects=await load('bedrock/custom-effects.js');
const NS='kaleidoscope_tavern',report={kind:'mock_api_counts_not_native_performance',cellars:[]};
for(const [count,full]of [[1,false],[1,true],[10,true],[100,true]]){
 cellar.CELLAR_CABINET_TEST.visuals.clear();world.dp.clear();const d=new Dimension(),blocks=[],state={schema:1,revision:0,slots:Array(9).fill(full?NS+':empty_bottle':null)};
 for(let i=0;i<count;i++){const b=d.block(NS+':cellar_cabinet',{x:i*4,y:0,z:0},{[NS+':facing']:i%4});blocks.push(b);world.setDynamicProperty(core.cellarCabinetKey(d.id,b.location),JSON.stringify(state));cellar.syncCellarCabinetVisuals(b,state);}
 resetCounters();for(const b of blocks)cellar.syncCellarCabinetVisuals(b,state);cellar.tickCellarCabinets();
 report.cellars.push({count,full,helpers:d.entities.size,queries:counters.queries,mutationCalls:counters.propertyWrites+counters.rotations+counters.teleports});
}
const d=new Dimension(),info={kind:'chalk',large:true,facing:'north',root:{x:0,y:0,z:0}},data={text:'A'.repeat(300),color:'white',glowing:false,alignment:'left',verticalAlignment:'top'};
board.renderBoardText(d,info,data,null,'measured');data.text='B'+data.text.slice(1);resetCounters();board.renderBoardText(d,info,data,null,'measured');report.boardEdit={glyphs:d.entities.size,spawned:counters.spawns,removed:counters.removes};
const a=new Dimension(),b=a.block('test:ambient');ambient.registerJavaAmbient(b,()=>{});world.players=[new Player(a,{x:1000,y:0,z:0}),new Player(new Dimension('minecraft:nether'))];let draws=0;const random=Math.random;Math.random=()=>{draws++;return .5;};try{ambient.pulseJavaAmbient();}finally{Math.random=random;}report.unrelatedAmbient={players:2,randomCallsPerTick:draws};
world.players=[new Player(new Dimension())];resetCounters();for(let i=1;i<=20;i++){system.currentTick++;effects.tickArdentHeat();effects.tickHighHeels();if(i%5===0)effects.tickCustomEffects();}report.idleEffects={ticks:20,reads:counters.playerReads,writes:counters.playerWrites,playerLists:counters.playerLists};
console.log(JSON.stringify(report,null,2));
