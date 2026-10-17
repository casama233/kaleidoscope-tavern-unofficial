import {world,system,ItemStack,BlockPermutation} from '@minecraft/server';
import {setItemProperty,getItemProperty,setItemLore,getItemLore} from './itemData.js';
function assert(ok,label){if(!ok)throw Error(label);}
system.runTimeout(async()=>{
 try{
  const dimension=world.getDimension('overworld');
  await world.tickingAreaManager.createTickingArea('baseline-probe',{dimension,from:{x:1024,y:0,z:1024},to:{x:1039,y:100,z:1039}});
  system.runTimeout(()=>{
   try{
    const pos={x:1025,y:80,z:1025},block=dimension.getBlock(pos);
    block.setPermutation(BlockPermutation.resolve('minecraft:chest'));
    const c=block.getComponent('minecraft:inventory').container;
    const a=new ItemStack('minecraft:stick',4);a.nameTag='Native metadata probe';setItemLore(a,['保留原有說明']);setItemProperty(a,'probe:quality',3);
    c.setItem(0,a);const restored=c.getItem(0);
    assert(restored.amount===4&&restored.nameTag===a.nameTag,'native container identity');
    assert(getItemProperty(restored,'probe:quality')===3&&getItemLore(restored)[0]==='保留原有說明','native metadata and lore');
    const b=restored.clone();setItemProperty(b,'probe:quality',5);
    assert(getItemProperty(restored,'probe:quality')===3&&getItemProperty(b,'probe:quality')===5,'immutable metadata');
    assert(!restored.isStackableWith(b),'different metadata never merges');
    assert(restored.isStackableWith(restored.clone()),'same metadata stacks');
    const unique=new ItemStack('minecraft:wooden_sword');setItemProperty(unique,'probe:quality',2);
    assert(getItemProperty(unique,'probe:quality')===2,'unstackable native dynamic property');
    console.log('BASELINE_GRILLING_PASS '+JSON.stringify({nativeContainer:true,stackableMetadata:true,immutable:true,lore:true,unstackable:true,client:false}));
   }catch(e){console.error('BASELINE_GRILLING_FAIL '+e+' '+e.stack);}
  },60);
 }catch(e){console.error('BASELINE_GRILLING_FAIL '+e+' '+e.stack);}
},100);
