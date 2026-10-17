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
                if key in target and encode(nbtlib.File({'value':target[key]}))!=encode(nbtlib.File({'value':value})):raise ValueError('target owner has conflicting typed property '+key)
                target[key]=value
        else:compound[new]=source
        del compound[old];changes+=1
    return changes

def transform(raw,mapping,world_properties=False,*,sequence=False,state_rules=None):
    import nbtlib
    from author_state_migration import StrictNBTStream
    stream=StrictNBTStream(raw);changes=0;state_changes=0;parts=[]
    def visit(node):
        nonlocal changes
        if isinstance(node,nbtlib.Compound):
            for name,value in list(node.items()):
                if name=='DynamicProperties':changes+=move_owners(value,mapping)
                visit(value)
        elif isinstance(node,nbtlib.List):
            for value in node:visit(value)
    while stream.tell()<len(raw):
        start=stream.tell();tag=nbtlib.File.parse(stream,byteorder='little');end=stream.tell()
        if not sequence and end!=len(raw):raise ValueError('record contains unparsed NBT suffix')
        previous=changes
        if world_properties:changes+=move_owners(tag,mapping)
        visit(tag)
        converted=0
        if state_rules:
            from author_state_migration import visit_blocks
            converted=visit_blocks(tag,state_rules);state_changes+=converted
        parts.append(encode(tag) if changes!=previous or converted else raw[start:end])
    if not parts:raise ValueError('empty NBT record')
    result=(b''.join(parts) if changes or state_changes else raw,changes)
    return (*result,state_changes) if state_rules is not None else result

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

def migrate(source,output,mapping,retire_empty=(),*,state_profile=None):
    from leveldb import LevelDB
    import nbtlib
    source=Path(source).resolve();output=Path(output).resolve()
    if output.exists() or output==source or source in output.parents:raise ValueError('use a new independent world copy')
    if not mapping or len(set(mapping.values()))!=len(mapping) or set(mapping)&set(mapping.values()):raise ValueError('invalid/chained UUID mapping')
    state_rules=None
    if state_profile is not None:
        from author_state_migration import validate_profile,transform_subchunk
        state_rules=validate_profile(state_profile)
    shutil.copytree(source,output)
    db=LevelDB(str(output/'db'));records=[];retired=[];pointers=[]
    try:
        before=fingerprint(db)
        original_hashes={key:hashlib.sha256(value).digest() for key,value in db.items()}
        markers=[uid.encode() for uid in mapping]
        state_markers=[name.encode() for name in state_rules] if state_rules else []
        updates={};deletes=[]
        for key,raw in db.items():
            if key.startswith(b'actorprefix') and any(name.encode() in raw for name in retire_empty):
                tag=nbtlib.File.parse(io.BytesIO(raw),byteorder='little')
                if str(tag.get('identifier','')) in retire_empty:
                    if has_inventory_items(tag):raise ValueError('refusing to retire a nonempty legacy inventory')
                    retired.append({'key_hex':key.hex(),'identifier':str(tag['identifier']),'items':0})
                    deletes.append(key);pointers.append(key[len(b'actorprefix'):]);continue
            count=converted=0;changed=raw
            has_states=any(name in raw for name in state_markers)
            if has_states and len(key) in (10,14) and key[-2]==0x2f:
                changed,converted=transform_subchunk(raw,state_rules)
            elif any(uid in raw for uid in markers) or has_states:
                block_actors=len(key) in (9,13) and key[-1]==0x31
                result=transform(raw,mapping,key==b'DynamicProperties',sequence=block_actors,state_rules=state_rules)
                changed,count=result[:2]
                if state_rules is not None:converted=result[2]
            if count or converted:
                updates[key]=changed;records.append({'key_hex':key.hex(),'owner_compounds':count,'block_states':converted,'before_sha256':hashlib.sha256(raw).hexdigest(),'after_sha256':hashlib.sha256(changed).hexdigest()})
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
            'block_state_profile':state_profile,'block_states_migrated':sum(r['block_states'] for r in records),
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
