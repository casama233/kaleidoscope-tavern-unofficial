#!/usr/bin/env python3
"""Migrate dynamic-property owners in an isolated copy of a stopped world.

Requires amulet-leveldb==1.0.7 and nbtlib==2.0.4. No manifest or gameplay edits.
The caller must use a consistent stopped-world source, rehearse native loading,
and retain the source backup before adopting the resulting database.
"""
from pathlib import Path
import argparse, hashlib, io, json, shutil

def encode(tag):
    stream=io.BytesIO();tag.write(stream,byteorder='little');return stream.getvalue()

def move_owners(compound,mapping):
    import nbtlib
    changes=0
    for old,new in mapping.items():
        if old not in compound:continue
        source=compound[old]
        if not isinstance(source,nbtlib.Compound):raise ValueError('invalid dynamic-property owner compound')
        if new in compound:
            target=compound[new]
            if not isinstance(target,nbtlib.Compound):raise ValueError('invalid target owner compound')
            for key,value in source.items():
                if key in target and target[key]!=value:raise ValueError('target owner has conflicting property '+key)
                target[key]=value
        else:compound[new]=source
        del compound[old];changes+=1
    return changes

def transform(raw,mapping,world_properties=False):
    import nbtlib
    stream=io.BytesIO(raw);tag=nbtlib.File.parse(stream,byteorder='little')
    if stream.tell()!=len(raw):raise ValueError('record contains unparsed NBT suffix')
    changes=move_owners(tag,mapping) if world_properties else 0
    def visit(node):
        nonlocal changes
        if isinstance(node,nbtlib.Compound):
            for name,value in list(node.items()):
                if name=='DynamicProperties':changes+=move_owners(value,mapping)
                visit(value)
        elif isinstance(node,nbtlib.List):
            for value in node:visit(value)
    visit(tag)
    return encode(tag) if changes else raw,changes

def fingerprint(db):
    digest=hashlib.sha256();count=0
    for key,value in db.items():
        digest.update(len(key).to_bytes(8,'little'));digest.update(key)
        digest.update(len(value).to_bytes(8,'little'));digest.update(value);count+=1
    return {'records':count,'sha256':digest.hexdigest()}

def has_inventory_items(tag):
    import nbtlib
    for field in ['Items','ChestItems','Inventory','Armor','ArmorItems','Mainhand','HandItems','Offhand']:
        value=tag.get(field)
        if value is None:continue
        if not isinstance(value,nbtlib.List):raise ValueError('unknown legacy inventory encoding')
        for item in value:
            if not isinstance(item,nbtlib.Compound):raise ValueError('unknown legacy item encoding')
            if int(item.get('Count',0))!=0 or str(item.get('Name','')):return True
    return False

def migrate(source,output,mapping,retire_empty=()):
    from leveldb import LevelDB
    import nbtlib
    source=Path(source).resolve();output=Path(output).resolve()
    if output.exists() or output==source or source in output.parents:raise ValueError('use a new independent world copy')
    if not mapping or len(set(mapping.values()))!=len(mapping) or set(mapping)&set(mapping.values()):raise ValueError('invalid/chained UUID mapping')
    shutil.copytree(source,output)
    db=LevelDB(str(output/'db'));records=[];retired=[];pointers=[]
    try:
        before=fingerprint(db)
        original_hashes={key:hashlib.sha256(value).digest() for key,value in db.items()}
        markers=[uid.encode() for uid in mapping]
        updates={};deletes=[]
        for key,raw in db.items():
            if key.startswith(b'actorprefix') and any(name.encode() in raw for name in retire_empty):
                tag=nbtlib.File.parse(io.BytesIO(raw),byteorder='little')
                if str(tag.get('identifier','')) in retire_empty:
                    if has_inventory_items(tag):raise ValueError('refusing to retire a nonempty legacy inventory')
                    retired.append({'key_hex':key.hex(),'identifier':str(tag['identifier']),'items':0})
                    deletes.append(key);pointers.append(key[len(b'actorprefix'):]);continue
            if any(uid in raw for uid in markers):
                changed,count=transform(raw,mapping,key==b'DynamicProperties')
                if count:
                    updates[key]=changed;records.append({'key_hex':key.hex(),'owner_compounds':count,'before_sha256':hashlib.sha256(raw).hexdigest(),'after_sha256':hashlib.sha256(changed).hexdigest()})
        for key,raw in db.items():
            if key.startswith(b'digp') and any(pointer in raw for pointer in pointers):
                if len(raw)%8:raise ValueError('invalid entity index record')
                kept=b''.join(raw[i:i+8] for i in range(0,len(raw),8) if raw[i:i+8] not in pointers)
                updates[key]=kept
        db.putBatch(updates)
        for key in deletes:db.delete(key)
        after=fingerprint(db)
        # Every untouched key/value must still have its exact original bytes.
        actual_keys=set(db.keys())
        if actual_keys!=set(original_hashes)-set(deletes):raise ValueError('database keys changed unexpectedly')
        for key,digest in original_hashes.items():
            if key in deletes:continue
            expected=hashlib.sha256(updates[key]).digest() if key in updates else digest
            if hashlib.sha256(db.get(key)).digest()!=expected:raise ValueError('unrelated database record changed')
        return {'schema':1,'source':str(source),'output':str(output),'uuid_mapping':mapping,
            'before':before,'after':after,'changed_records':records,'retired_empty_entities':retired,
            'entity_index_records_changed':len(updates)-len(records),'unrelated_records_preserved':True,
            'client':False,'native_loading':False,'saved_world_migration':False}
    finally:db.close()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--mapping',type=Path,required=True);parser.add_argument('--report',type=Path,required=True)
    parser.add_argument('--retire-empty-entity',action='append',default=[])
    args=parser.parse_args();result=migrate(args.source,args.output,json.loads(args.mapping.read_text()),args.retire_empty_entity)
    args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'changed_records':len(result['changed_records']),'retired_empty_entities':len(result['retired_empty_entities']),'saved_world_migration':False}))
if __name__=='__main__':main()
