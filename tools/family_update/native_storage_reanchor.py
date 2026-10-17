"""Targeted read-only proof of owned cabinet carrier restoration in QA DB copies."""
import hashlib,io,json,re
from pathlib import Path
from container_recovery import block_at,item_digest

DIMENSIONS={'minecraft:overworld':0,'minecraft:nether':1,'minecraft:the_end':2}
KEY=re.compile(r'^kt:extension_storage/([a-z0-9_.-]+)/([a-z0-9_./-]+)/(overworld|nether|the_end)/(-?\d+)_(-?\d+)_(-?\d+)$')
def plan_rows(plan):
 assert plan.get('schema')==1 and isinstance(plan.get('keys'),list) and 0<len(plan['keys'])<=16,'Invalid native storage scene plan'
 assert len(plan['keys'])==len(set(plan['keys'])),'Duplicate native storage scene'
 rows=[]
 for key in plan['keys']:
  assert isinstance(key,str) and len(key)<=512
  match=KEY.fullmatch(key);assert match,'Scene currently supports registered external cabinet keys'
  source,block,dimension,x,y,z=match.groups();position=[int(x),int(y),int(z)];assert all(-30000000<=v<=30000000 for v in [position[0],position[2]])
  assert (-64 if dimension=='overworld' else 0)<=position[1]<=(319 if dimension=='overworld' else 255)
  rows.append({'key':key,'block':source+':'+block,'dimension':'minecraft:'+dimension,'position':position})
 return rows

def inspect(db,plan,uuid):
 import nbtlib
 rows=plan_rows(plan);raw=db.get(b'DynamicProperties');assert raw,'World properties unavailable'
 world=nbtlib.File.parse(io.BytesIO(raw),byteorder='little');properties=world[uuid]
 actors={}
 for key,raw in db.items():
  if not key.startswith(b'actorprefix') or b'kaleidoscope_tavern:stored_items' not in raw:continue
  tag=nbtlib.File.parse(io.BytesIO(raw),byteorder='little')
  if str(tag.get('identifier',''))!='kaleidoscope_tavern:stored_items':continue
  actor=str(int(tag['UniqueID']));assert actor not in actors,'Duplicate native actor identity';actors[actor]=tag
 result=[]
 for row in rows:
  key=row['key'];ledger=str(properties['kt:native_items/'+key]);record=json.loads(ledger)
  assert int(properties['kt:native_required/'+key])==1 and record['schema']==1 and record['key']==key
  assert record['dimension']==row['dimension'] and record['position']==dict(zip(['x','y','z'],row['position']))
  assert isinstance(record['ids'],list) and len(record['ids'])==9 and any(record['ids'])
  assert isinstance(record['entity'],str) and isinstance(record['token'],str) and record['token']
  tag=actors[record['entity']];assert int(tag.get('DimensionId',0))==DIMENSIONS[row['dimension']]
  own=tag['DynamicProperties'][uuid]
  assert str(own['kaleidoscope_tavern:storage_owner'])==key and str(own['kaleidoscope_tavern:storage_token'])==record['token']
  items=tag.get('ChestItems',tag.get('Inventory'));assert items is not None
  slots={int(item['Slot']):item for item in items};assert len(slots)==len(items) and all(0<=slot<9 for slot in slots)
  for slot,expected in enumerate(record['ids']):
   item=slots.get(slot);name=str(item.get('Name','')) if item is not None else '';count=int(item.get('Count',0)) if item is not None else 0
   assert (name==expected and count==1) if expected else (not name or count==0),'Native slot does not match original ledger'
  block=block_at(db,tuple(row['position']),DIMENSIONS[row['dimension']]);assert str(block['name'])==row['block'],'Owner block replaced or missing'
  position=[float(v) for v in tag['Pos']];assert len(position)==3
  digest=item_digest(nbtlib.Compound({'Items':items}))
  result.append({**row,'entity':record['entity'],'ledger_sha256':hashlib.sha256(ledger.encode()).hexdigest(),'full_nbt_items_sha256':digest,'native_position':position,'centered':all(abs(position[i]-row['position'][i]-.5)<.1 for i in range(3)),'native_slots':9})
 return result

def inspect_world(world,plan,uuid):
 # The caller supplies only its stopped independent rehearsal copy. Opening
 # LevelDB can change metadata; never call this on live or immutable backups.
 from leveldb import LevelDB
 db=LevelDB(str(Path(world)/'db'))
 try:return inspect(db,plan,uuid)
 finally:db.close()

def verify(before,after):
 assert len(before)==len(after)
 for old,new in zip(before,after):
  assert new['centered'],'Owned native carrier was not restored in the loaded QA chunk'
  for field in ['key','block','dimension','position','entity','ledger_sha256','full_nbt_items_sha256','native_slots']:
   assert old[field]==new[field],'Native recovery changed identity, owner or original full item metadata: '+field
 return True

def commands(plan):
 return [f"execute in {row['dimension'].split(':')[1]} run tickingarea add circle {row['position'][0]} {row['position'][1]} {row['position'][2]} 1 native_storage_reanchor_{i}" for i,row in enumerate(plan_rows(plan))]
