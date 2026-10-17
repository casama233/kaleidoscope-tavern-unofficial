"""Exact Nether 1.0.2 schema repair, paired with compatibility release 48.

Remove two unused empty component references. Retain all other author block
semantics and manifest metadata, advancing only the paired local versions.
"""
import copy
import hashlib
import json
from datetime import date
from pathlib import Path

from stable_host_profiles import declaration_sha, match_stable_profile, validate_stable_source

BP = '36cbd4fe-5677-495e-9caf-c267a83d116d'
RP = '2b53ecef-9319-4ee5-9808-1b9fb0f260dc'
ARCHIVE = '85533af5fe733b1943e8058bb665a6b2bca4f3259c458496e624272e4e7d3733'
OWNER_VERSION = [1, 0, 48]
LOCAL_VERSION = [1, 0, 10248]
AUTHOR_VERSION = [1, 0, 2]
GUARD = 'kaleidoscope_tavern:placeable_drink_placement_guard'
BLOCKS = ('BP/blocks/placeable/soul_brandy.json', 'BP/blocks/placeable/warped_conny.json')
FILES = ('BP/manifest.json', 'RP/manifest.json', *BLOCKS)


def _version(value, expected):
    return (isinstance(value, list) and len(value) == 3
            and all(type(part) is int for part in value) and value == expected)


def patch_manifests(bp, rp):
    """Change only header, module and exact peer dependency versions."""
    result = []
    for original, uid, peer in ((bp, BP, RP), (rp, RP, BP)):
        value = copy.deepcopy(original)
        header = value.get('header', {})
        if header.get('uuid') != uid or not _version(header.get('version'), AUTHOR_VERSION):
            raise ValueError('Nether repair requires original author manifest identity')
        modules = value.get('modules')
        if not isinstance(modules, list) or not modules:
            raise ValueError('Nether repair requires original author modules')
        for module in modules:
            if not isinstance(module, dict) or not _version(module.get('version'), AUTHOR_VERSION):
                raise ValueError('Nether original author module version differs')
            module['version'] = LOCAL_VERSION.copy()
        dependencies = value.get('dependencies')
        if not isinstance(dependencies, list) or any(not isinstance(row, dict) for row in dependencies):
            raise ValueError('Nether original author dependencies differ')
        paired = [row for row in dependencies if row.get('uuid') == peer]
        if len(paired) != 1 or not _version(paired[0].get('version'), AUTHOR_VERSION):
            raise ValueError('Nether original author peer dependency differs')
        header['version'] = LOCAL_VERSION.copy()
        paired[0]['version'] = LOCAL_VERSION.copy()
        result.append(value)
    return result


def remove_empty_guard(original):
    """Reject missing/nonempty references; preserve every other JSON value."""
    value = copy.deepcopy(original)
    block = value.get('minecraft:block', {})
    components = block.get('components', {})
    if not isinstance(components, dict) or type(components.get(GUARD)) is not dict or components[GUARD]:
        raise ValueError('Nether repair requires the exact empty placement guard')
    del components[GUARD]
    return value


def apply_nether_extension(spec, bp_root, rp_root, bp_source, rp_source, owner_version):
    """Validate the reviewed four-file repair completely before writing."""
    if type(spec.get('schema')) is not int or spec['schema'] != 1 or spec.get('kind') != 'nether-placeable-drinks-schema-repair':
        raise ValueError('unknown Nether extension')
    if spec.get('id') != 'senluo:nether-placeable-drinks-schema-repair':
        raise ValueError('Nether extension declaration identity differs')
    if spec.get('host_uuid') != BP or spec.get('behavior_uuid') != BP or spec.get('resource_uuid') != RP:
        raise ValueError('Nether extension target differs')
    if not _version(owner_version, OWNER_VERSION) or not _version(spec.get('owner_version'), OWNER_VERSION):
        raise ValueError('Nether repair requires its exact reviewed owner release')
    if not _version(spec.get('local_pack_version'), LOCAL_VERSION):
        raise ValueError('Nether local pair must advance with owner release 48')
    if spec.get('archive_sha256') != ARCHIVE:
        raise ValueError('Nether repair requires the pinned clean author archive')
    if spec.get('official_author_release') is not False:
        raise ValueError('Nether repair must declare a local, unofficial author variant')
    try:
        expires = date.fromisoformat(spec['expires'])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError('Nether extension expiry is invalid') from exc
    if expires < date.today():
        raise ValueError('Nether extension expired')
    for key in ('removal_condition', 'feedback', 'authorization'):
        if not isinstance(spec.get(key), str) or not spec[key].strip():
            raise ValueError('Nether review metadata missing ' + key)
    for key in ('original_files', 'patched_files'):
        if not isinstance(spec.get(key), dict) or set(spec[key]) != set(FILES):
            raise ValueError('Nether file inventory differs')
    expected_updates = [dict(path=name, mode='reviewed_remove',
                             pointer=['minecraft:block', 'components', GUARD], value={})
                        for name in BLOCKS]
    if (spec.get('json_updates') != expected_updates or spec.get('imports') != {}
            or spec.get('insertions') != [] or spec.get('copies') != {}):
        raise ValueError('Nether repair permits only its two reviewed empty guard removals')
    profile = match_stable_profile(spec)
    if profile is None:
        raise ValueError('unregistered stable Nether repair declaration')
    if not _version(profile.get('owner_version'), OWNER_VERSION):
        raise ValueError('stable Nether repair requires its exact reviewed owner')
    for source in (bp_source, rp_source):
        if source.get('owner') != 'upstream' or source.get('archive_sha256') != ARCHIVE:
            raise ValueError('Nether repair requires the pinned clean author source')
        validate_stable_source(profile, source)

    roots = {'BP': Path(bp_root), 'RP': Path(rp_root)}
    paths, original_values = {}, {}
    for name in FILES:
        prefix, relative = name.split('/', 1)
        root = roots[prefix]
        path = root / relative
        chain = [root, *[root.joinpath(*Path(relative).parts[:i])
                         for i in range(1, len(Path(relative).parts) + 1)]]
        if any(part.is_symlink() for part in chain) or not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Nether original file missing or outside pack ' + name)
        raw = path.read_bytes()
        if hashlib.sha256(raw).hexdigest() != spec['original_files'][name]:
            raise ValueError('Nether original file differs ' + name)
        paths[name] = path
        original_values[name] = json.loads(raw)
    bp, rp = patch_manifests(original_values['BP/manifest.json'], original_values['RP/manifest.json'])
    changes = {'BP/manifest.json': bp, 'RP/manifest.json': rp}
    changes.update({name: remove_empty_guard(original_values[name]) for name in BLOCKS})
    encoded = {name: (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
               for name, value in changes.items()}
    for name, raw in encoded.items():
        if hashlib.sha256(raw).hexdigest() != spec['patched_files'][name]:
            raise ValueError('reviewed Nether output differs ' + name)
    for name, raw in encoded.items():
        paths[name].write_bytes(raw)
    receipt = {key: copy.deepcopy(spec[key]) for key in (
        'id', 'version', 'kind', 'host_uuid', 'behavior_uuid', 'resource_uuid',
        'owner_version', 'local_pack_version', 'expires', 'archive_sha256',
        'original_files', 'patched_files', 'copies', 'removal_condition', 'feedback', 'authorization')}
    receipt.update(spec_sha256=declaration_sha(spec), official_author_release=False)
    return receipt
