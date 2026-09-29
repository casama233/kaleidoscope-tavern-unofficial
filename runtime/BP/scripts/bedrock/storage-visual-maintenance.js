/** Bounded cosmetic maintenance only. Never caches inventory or slot selection. */
const scans=new WeakMap();

/** Snapshot at most budget handles, not the whole world registry. The persistent
 * iterator supplies fair progress even when a previous batch removes helpers.
 * cursor remains a numeric compatibility token for existing storage adapters.
 */
export function tickStorageVisuals(visuals,cursor,maintain,budget=128,groupOf){
 const size=visuals.size,limit=Math.min(size,Math.max(0,Math.floor(budget)));
 if(!size){scans.delete(visuals);return 0;}
 if(!limit)return cursor;
 let iterator=scans.get(visuals)??visuals.entries();
 const batch=[];
 for(let i=0;i<limit;i++){
  let next=iterator.next();
  if(next.done){iterator=visuals.entries();next=iterator.next();}
  if(next.done)break;
  batch.push(next.value);
 }
 scans.set(visuals,iterator);
 const groups=new Set();
 for(const [id,entity]of batch){
  if(visuals.get(id)!==entity)continue;
  if(!entity.isValid){visuals.delete(id);continue;}
  let group;
  // Invalid anchors must still reach the domain adapter's repair path.
  try{group=groupOf?.(entity);}catch{}
  if(group!==undefined){if(groups.has(group))continue;groups.add(group);}
  maintain(entity);
 }
 return (cursor+batch.length)%size;
}

/** Query once and snapshot anchors before any helper can be removed. */
export function storageHelpersByAnchor(block,anchorProperty){
 const byAnchor=new Map(),p=block.location;
 for(const entity of block.dimension.getEntities({location:{x:p.x+.5,y:p.y+.5,z:p.z+.5},maxDistance:2})){
  if(!entity.isValid)continue;
  const anchor=entity.getDynamicProperty(anchorProperty);
  if(typeof anchor!=='string')continue;
  const group=byAnchor.get(anchor)??[];group.push(entity);byAnchor.set(anchor,group);
 }
 return byAnchor;
}

/** Read back actual engine state: a teleported/rotated helper is still repaired.
 * Tiny tolerances allow native float rounding; yaw is compared modulo 360.
 * A failed teleport is not remembered, so the next maintenance retries it.
 */
export function syncStorageVisualPose(entity,kindProperty,kind,at,yaw){
 if(entity.getProperty(kindProperty)!==kind)entity.setProperty(kindProperty,kind);
 const rotation=entity.getRotation();
 const delta=((rotation.y-yaw+180)%360+360)%360-180;
 if(Math.abs(rotation.x)>1e-4||Math.abs(delta)>1e-4)entity.setRotation({x:0,y:yaw});
 const current=entity.location;
 if(['x','y','z'].some(axis=>Math.abs(current[axis]-at[axis])>1e-4))entity.tryTeleport(at,{checkForBlocks:false});
}
