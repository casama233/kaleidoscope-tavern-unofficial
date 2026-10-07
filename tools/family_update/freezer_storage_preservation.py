"""Read-only complete native freezer-input proof in stopped QA DB copies.

Player/block-container checks do not cover actor inventories. Match the owned
World Liquor bindings to actual actor identity, owner/token and complete NBT.
"""
import io,json,re
from pathlib import Path
from container_recovery import item_digest,block_at
NS='kaleidoscope_world_liquor'
ENTITY=NS+':freezer_inputs'
PREFIX='kwl:native_items/'
KEY=re.compile(r'^'+NS+r':storage/(overworld|nether|the_end)/(-?\d+)_(-?\d+)_(-?\d+)$')
DIMS={'overworld':0,'nether':1,'the_end':2}
def inspect(db,uuid):
 import nbtlib
 raw=db.get(b'DynamicProperties')
 properties=nbtlib.File.parse(io.BytesIO(raw),byteorder='little').get(uuid,{}) if raw else {}
 actors={}
 for key,raw in db.items():
  if not key.startswith(b'actorprefix') or ENTITY.encode() not in raw:continue
  tag=nbtlib.File.parse(io.BytesIO(raw),byteorder='little')
  if str(tag.get('identifier',''))!=ENTITY:continue
  identity=str(int(tag['UniqueID']));assert identity not in actors,'Duplicate native freezer actor';actors[identity]=tag
 result={};referenced=set()
 for property_name,value in properties.items():
  if not property_name.startswith(PREFIX):continue
  key=property_name[len(PREFIX):];match=KEY.fullmatch(key);assert match,'Unknown native freezer key'
  dimension,*coordinates=match.groups();position=[int(v)for v in coordinates];record=json.loads(str(value));ids=record.get('ids')
  assert record.get('schema')==1 and record.get('key')==key and record.get('dimension')=='minecraft:'+dimension and record.get('position')==dict(zip(['x','y','z'],position)),'Native freezer binding mismatch'
  assert int(properties['kwl:native_required/'+key])==1 and isinstance(ids,list) and len(ids)==4 and any(ids),'Native freezer marker/layout mismatch'
  machine=json.loads(str(properties[key]));assert ids==[*(machine.get('input',[])),*([None]*(4-len(machine.get('input',[]))))],'Native freezer machine/index mismatch'
  identity=record['entity'];assert identity not in referenced,'Duplicated native freezer reference';referenced.add(identity);tag=actors[identity];assert int(tag.get('DimensionId',0))==DIMS[dimension],'Native freezer dimension mismatch'
  own=tag['DynamicProperties'][uuid];assert str(own[NS+':input_owner'])==key and str(own[NS+':input_token'])==record['token'],'Native freezer actor ownership mismatch'
  bag=tag.get('ChestItems',tag.get('Inventory'));assert bag is not None,'Native freezer inventory missing'
  slots={int(item['Slot']):item for item in bag};assert len(slots)==len(bag) and all(0<=slot<4 for slot in slots),'Invalid native freezer slots'
  for slot,expected in enumerate(ids):
   item=slots.get(slot);name=str(item.get('Name',''))if item is not None else '';count=int(item.get('Count',0))if item is not None else 0
   assert (name==expected and count==1)if expected else(not name or count==0),'Native freezer items/index mismatch'
  assert str(block_at(db,tuple(position),DIMS[dimension])['name'])==NS+':freezer','Native freezer owner block missing'
  result[key]={'entity':identity,'token':record['token'],'dimension':dimension,'position':position,'ids':ids,'native_slots':4,'complete_item_nbt_sha256':item_digest(nbtlib.Compound({'Items':bag}))}
 for identity,tag in actors.items():
  if identity in referenced:continue
  bag=tag.get('ChestItems',tag.get('Inventory',[]));assert not any(int(item.get('Count',0))>0 for item in bag),'Unreferenced native freezer contents'
 return result
def inspect_world(world,uuid):
 # Opening LevelDB can write metadata: only supplied stopped QA copies, never
 # the live world or the immutable consistent backup.
 from leveldb import LevelDB
 db=LevelDB(str(Path(world)/'db'))
 try:return inspect(db,uuid)
 finally:db.close()
