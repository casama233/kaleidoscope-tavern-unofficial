#!/usr/bin/env python3
"""One-time test-only migration. Never edits archived fixtures or runtime.
Validate the current production contract before updating stale expectations.
"""
from pathlib import Path
import subprocess
root=Path.cwd()
def replace_one(path,old,new):
 p=root/path;text=p.read_text();assert text.count(old)==1,(path,'ambiguous or changed anchor');p.write_text(text.replace(old,new))
potions=(root/'runtime/BP/scripts/core/potions.js').read_text()
assert "['Consume','ThrownSplash','ThrownLingering'].includes(p.deliveryId)" in potions
inventory=(root/'runtime/BP/scripts/core/inventory.js').read_text()
assert 'take===0&&!before[selected]?[...others,selected]:[selected,...others]' in inventory
replace_one('tools/foundation/mock-loader.mjs','// Explicit test-only fixture additions for World Liquor and current stable API.','''// Explicit test-only fixture additions for World Liquor and current stable API.
// Keep the archived fake-server immutable. Its old delivery IDs and missing
// Entity.isValid do not describe the current production API used by the host.
potionDeliveries.clear();
for(const [id,item]of [['Consume','minecraft:potion'],['ThrownSplash','minecraft:splash_potion'],['ThrownLingering','minecraft:lingering_potion']])potionDeliveries.set(id,item);
Object.defineProperty(Entity.prototype,'isValid',{get(){return !this.removed;}});
Object.defineProperty(Player.prototype,'isValid',{get(){return !this.removed;}});''')
replace_one('tools/creative-pick.test.mjs',"potion={effectId:'minecraft:strong_swiftness',deliveryId:'minecraft:consumable'}", "potion={effectId:'minecraft:strong_swiftness',deliveryId:'Consume'}")
replace_one('tools/creative-pick.test.mjs',"test('water bottle is real water',()=>assert.equal(potionIdentity(resolveCreativePick(block(NS+':bottle_water'))).effectId,'minecraft:water'));", """test('water bottle is real water with a native Consume delivery',()=>{
 const item=resolveCreativePick(block(NS+':bottle_water'));
 assert.equal(item.typeId,'minecraft:potion');
 assert.deepEqual(potionIdentity(item),{effectId:'minecraft:water',deliveryId:'Consume'});
});
for(const deliveryId of ['minecraft:consumable','minecraft:splash','minecraft:lingering'])test('obsolete guessed potion delivery is rejected: '+deliveryId,()=>{
 const b=block(NS+':potion_bottle');
 world.setDynamicProperty(bottleDisplayKey(b),JSON.stringify({item:'minecraft:potion',potion:{effectId:'minecraft:water',deliveryId}}));
 const before=[...world.dp];assert.throws(()=>resolveCreativePick(b),/POTION_DELIVERY_UNSUPPORTED/);assert.deepEqual([...world.dp],before);
});""")
replace_one('tools/foundation/foundation.test.mjs',"assert.equal(p.inventory.getItem(0).typeId,regular.items[5]);assert.equal(host.load(b).state.left,null);", """// Empty-hand collection intentionally preserves the empty hand for repeat use.
 assert.equal(p.inventory.getItem(0),undefined);
 assert.deepEqual(p.inventory.items.filter(Boolean).map(item=>[item.typeId,item.amount]),[[regular.items[5],1]]);
 assert.equal(host.load(b).state.left,null);""")
assert subprocess.check_output(['git','diff','--','runtime','history'])==b''
print('Updated three live test files only; archived fixture and production runtime unchanged.')
