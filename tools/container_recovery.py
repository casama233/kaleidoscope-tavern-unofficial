"""Inspect and restore typed custom block inventories in isolated stopped copies.

Never restore a chunk wholesale. A recovery plan carries the exact historical
NBT record; every unrelated database key and sibling block entity is preserved.
"""
import base64, hashlib, io, json, math, struct
from pathlib import Path

def decode_records(raw):
    import nbtlib
    stream=io.BytesIO(raw);records=[]
    while stream.tell()<len(raw):
        start=stream.tell();tag=nbtlib.File.parse(stream,byteorder='little')
        records.append((tag,raw[start:stream.tell()]))
    return records

def position(tag):
    return tuple(int(tag[k]) for k in ('x','y','z'))

def chunk_key(pos,kind,dimension=0):
    x,y,z=pos;prefix=struct.pack('<ii',x//16,z//16)
    return prefix+(struct.pack('<i',dimension) if dimension else b'')+bytes([kind])

def block_at(db,pos,dimension=0):
    """Read a v8/v9 persistent subchunk palette without modifying it."""
    import nbtlib
    x,y,z=pos;cy=y//16
    raw=db.get(chunk_key(pos,0x2f,dimension)+struct.pack('<b',cy))
    stream=io.BytesIO(raw);version=stream.read(1)[0]
    if version not in (8,9):raise ValueError('unsupported subchunk version')
    count=stream.read(1)[0]
    if version==9 and struct.unpack('<b',stream.read(1))[0]!=cy:raise ValueError('subchunk coordinate differs')
    if not count:raise ValueError('missing block storage')
    header=stream.read(1)[0];bits=header>>1
    if header&1 or bits not in (0,1,2,3,4,5,6,8,16):raise ValueError('unsupported runtime palette')
    if bits:
        per=32//bits;n=math.ceil(4096/per);words=struct.unpack('<'+'I'*n,stream.read(4*n))
        i=(x%16)*256+(z%16)*16+y%16;index=(words[i//per]>>(bits*(i%per)))&((1<<bits)-1)
        entries=struct.unpack('<I',stream.read(4))[0]
    else:index=0;entries=1
    if not 0<=index<entries<=65536:raise ValueError('invalid palette index')
    selected=None
    for i in range(entries):
        tag=nbtlib.File.parse(stream,byteorder='little')
        if i==index:selected=tag
    return selected

def item_digest(tag):
    import nbtlib
    # Canonicalize compound key order while retaining every NBT type and value.
    def ordered(value):
        if isinstance(value,nbtlib.Compound):return nbtlib.Compound({k:ordered(value[k]) for k in sorted(value)})
        if isinstance(value,nbtlib.List):return type(value)(ordered(v) for v in value)
        return value
    stream=io.BytesIO();nbtlib.File({'Items':ordered(tag.get('Items',nbtlib.List[nbtlib.Compound]()))}).write(stream,byteorder='little')
    return hashlib.sha256(stream.getvalue()).hexdigest()

def inventories(db):
    result={}
    for key,raw in db.items():
        if len(key) not in (9,13) or key[-1]!=0x31:continue
        dimension=struct.unpack('<i',key[8:12])[0] if len(key)==13 else 0
        for tag,body in decode_records(raw):
            if str(tag.get('id',''))!='DataDriven' or not tag.get('Items'):continue
            pos=position(tag);block=block_at(db,pos,dimension)
            items=[{'slot':int(i['Slot']),'name':str(i['Name']),'count':int(i['Count'])} for i in tag['Items']]
            record={'key_hex':key.hex(),'position':list(pos),'dimension':dimension,
                    'block':str(block['name']),'items_sha256':item_digest(tag),'items':items}
            name=f'{dimension}:{pos[0]},{pos[1]},{pos[2]}'
            if name in result:raise ValueError('duplicate custom container position')
            result[name]=record
    return result

def recover(db,plan):
    """Write only planned missing/empty containers; reject conflicts atomically."""
    import nbtlib
    if plan.get('schema')!=1 or not plan.get('source') or not plan.get('records'):raise ValueError('missing recovery provenance')
    updates={};proof=[];seen=set()
    for row in plan['records']:
        raw=base64.b64decode(row['nbt_base64'],validate=True)
        if hashlib.sha256(raw).hexdigest()!=row['sha256']:raise ValueError('historical record hash differs')
        records=decode_records(raw)
        if len(records)!=1:raise ValueError('one historical block entity is required')
        tag=records[0][0];pos=position(tag);dim=row.get('dimension',0)
        if str(tag.get('id',''))!='DataDriven' or list(pos)!=row['position']:raise ValueError('historical container position/type differs')
        if tuple([dim,*pos]) in seen:raise ValueError('duplicate recovery position')
        seen.add(tuple([dim,*pos]));block=block_at(db,pos,dim)
        if str(block['name'])!=row['block'] or not row['block'].startswith('kaleidoscope_chinesefood:freezer'):raise ValueError('target is no longer the original freezer')
        items=tag.get('Items');slots=[int(item['Slot']) for item in items]
        if not isinstance(items,nbtlib.List) or len(slots)!=len(set(slots)) or any(slot<0 or slot>=54 for slot in slots):raise ValueError('invalid historical inventory')
        key=chunk_key(pos,0x31,dim)
        try:before=updates[key] if key in updates else db.get(key)
        except KeyError:before=b''
        siblings=decode_records(before);matches=[(i,t,b) for i,(t,b) in enumerate(siblings) if position(t)==pos]
        if len(matches)>1:raise ValueError('duplicate live container position')
        if matches:
            index,current,body=matches[0]
            if str(current.get('id',''))!='DataDriven':raise ValueError('conflicting live block entity')
            if current.get('Items'):
                if item_digest(current)==item_digest(tag):continue
                raise ValueError('refusing to overwrite a nonempty live inventory')
            # Preserve any new metadata from an empty current container.
            current['Items']=tag['Items'];stream=io.BytesIO();current.write(stream,byteorder='little')
            siblings[index]=(current,stream.getvalue())
        else:siblings.append((tag,raw))
        updates[key]=b''.join(body for _,body in siblings)
        proof.append({'position':list(pos),'dimension':dim,'block':row['block'],
                      'historical_record_sha256':row['sha256'],'items_sha256':item_digest(tag),
                      'stacks':len(items),'count':sum(int(i['Count']) for i in items)})
    original={key:hashlib.sha256(value).digest() for key,value in db.items()}
    db.putBatch(updates)
    if set(db.keys())!=set(original)|set(updates):raise ValueError('unexpected recovery database keys')
    for key,digest in original.items():
        expected=hashlib.sha256(updates[key]).digest() if key in updates else digest
        if hashlib.sha256(db.get(key)).digest()!=expected:raise ValueError('unrelated database record changed')
    return {'source':plan['source'],'restored':proof,'changed_keys':[key.hex() for key in updates],
            'unrelated_records_preserved':True,'whole_chunk_restored':False}

def recover_world(world,plan):
    from leveldb import LevelDB
    db=LevelDB(str(Path(world)/'db'))
    try:return recover(db,plan)
    finally:db.close()

def inventory_world(world):
    from leveldb import LevelDB
    db=LevelDB(str(Path(world)/'db'))
    try:return inventories(db)
    finally:db.close()
