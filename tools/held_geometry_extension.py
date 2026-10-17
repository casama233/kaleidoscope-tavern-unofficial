"""Exact same-author RP geometry copies; no private or author pixels are embedded."""
import copy
from datetime import date
import hashlib
import json
from pathlib import Path
from stable_host_profiles import match_stable_profile
KIND='cookery-held-geometry-canonicalization'
OWNER_VERSION=[1,0,50]
NAMES=('red_lantern','bamboo_tray_base','bamboo_tray_stand')
PATHS={f'models/blocks/java16/{name}.geo.json':f'models/blocks/decor/{name}.geo.json' for name in NAMES}

def validate_held_geometry_owner(config,spec):
    if (config.get('repository')!='local/senluo-amw-cuisine' or config.get('version')!=OWNER_VERSION
            or spec.get('owner_version')!=OWNER_VERSION):
        raise ValueError('held geometry repair requires canonical private owner P50')

def apply_held_geometry_extension(spec,owned_root,host_root,source):
    if (type(spec.get('schema')) is not int or spec['schema']!=1 or spec.get('kind')!=KIND
            or spec.get('id')!='senluo:'+KIND or spec.get('version')!=[1,0,1]
            or spec.get('owner_version')!=OWNER_VERSION or spec.get('official_author_release') is not False):
        raise ValueError('held geometry declaration identity differs')
    try:expires=date.fromisoformat(spec['expires'])
    except (KeyError,TypeError,ValueError) as exc:raise ValueError('held geometry expiry invalid') from exc
    if expires<date.today():raise ValueError('held geometry repair expired')
    for key in ('authorization','feedback','removal_condition'):
        if not isinstance(spec.get(key),str) or not spec[key].strip():raise ValueError('held geometry review metadata missing')
    if any(spec.get(k)!=v for k,v in [('imports',{}),('copies',{}),('insertions',[]),('text_replacements',[]),('json_updates',[])]):
        raise ValueError('held geometry repair permits same-host copies only')
    profile=match_stable_profile(spec,owned_root,source)
    if profile is None or profile.get('owner_version')!=OWNER_VERSION:raise ValueError('unreviewed held geometry profile')
    if (set(spec.get('original_files',{}))!=set(PATHS) or set(spec.get('patched_files',{}))!=set(PATHS)
            or set(spec.get('host_copies',{}))!=set(PATHS)):
        raise ValueError('held geometry copy inventory differs')
    root=Path(host_root)
    def safe(name):
        path=root/name
        chain=[root,*[root.joinpath(*Path(name).parts[:i]) for i in range(1,len(Path(name).parts)+1)]]
        if any(p.is_symlink() for p in chain) or not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('held geometry file missing or outside pack')
        return path
    changes={}
    for dst,src in PATHS.items():
        op=spec['host_copies'][dst]
        if op.get('source')!=src or op.get('sha256')!=spec['patched_files'][dst]:raise ValueError('held geometry source mapping differs')
        target=safe(dst);original=target.read_bytes();replacement=safe(src).read_bytes()
        if hashlib.sha256(original).hexdigest()!=spec['original_files'][dst]:raise ValueError('held geometry original hash differs')
        if hashlib.sha256(replacement).hexdigest()!=op['sha256']:raise ValueError('held geometry source hash differs')
        def ids(raw):return [g['description']['identifier'] for g in json.loads(raw)['minecraft:geometry']]
        if ids(original)!=ids(replacement):raise ValueError('held geometry IDs changed')
        changes[target]=replacement
    # No writes until every source, target, identity and digest has passed.
    for target,raw in changes.items():target.write_bytes(raw)
    return {key:copy.deepcopy(spec[key]) for key in ('id','version','kind','owner_version','archive_sha256',
        'original_files','patched_files','copies','host_copies','authorization','feedback','removal_condition','expires','official_author_release')}
