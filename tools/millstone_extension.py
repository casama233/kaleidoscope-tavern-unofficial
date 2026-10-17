"""Admit one exact, private-owned Cookery161 millstone guard correction.

Declaration content and algorithms remain in the private source. No arbitrary
host text patch is admitted: profile, input, operations and output are pinned.
"""
import copy
from datetime import date
import hashlib
from pathlib import Path
from stable_host_profiles import match_stable_profile

KIND = 'cookery-millstone-extension-admission'
OWNER_VERSION = [1, 0, 50]
PATH = 'scripts/custom_components/blocks/millstone.js'
PREIMAGE = '56a991ed57479f12d9700f9bcdb7811b072bf205f5851c7c5cbb7428188f598c'
POSTIMAGE = 'f15034d22998ca38155b24358e8f9ba1da952fe5d219b4ce9e577bb5fbc9e91a'

def validate_millstone_owner(config, spec):
    if (config.get('repository') != 'local/senluo-amw-cuisine'
            or config.get('version') != OWNER_VERSION or spec.get('owner_version') != OWNER_VERSION):
        raise ValueError('millstone repair requires canonical private owner P50')

def apply_millstone_extension(spec, owned_root, host_root, source):
    if (type(spec.get('schema')) is not int or spec['schema'] != 1
            or spec.get('kind') != KIND or spec.get('id') != 'senluo:' + KIND
            or spec.get('version') != [1, 0, 1] or spec.get('owner_version') != OWNER_VERSION):
        raise ValueError('millstone declaration identity differs')
    try:
        expires = date.fromisoformat(spec['expires'])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError('millstone expiry is invalid') from exc
    if expires < date.today():raise ValueError('millstone repair expired')
    for key in ('removal_condition', 'feedback', 'authorization'):
        if not isinstance(spec.get(key), str) or not spec[key].strip():
            raise ValueError('millstone review metadata missing ' + key)
    if (spec.get('original_files') != {PATH: PREIMAGE}
            or spec.get('patched_files') != {PATH: POSTIMAGE}
            or spec.get('imports') != {} or spec.get('copies') != {}
            or spec.get('json_updates') != []):
        raise ValueError('millstone repair permits only its exact source file')
    profile = match_stable_profile(spec, owned_root, source)
    if profile is None or profile.get('owner_version') != OWNER_VERSION:
        raise ValueError('millstone repair requires exact reviewed declaration')
    replacements = spec.get('text_replacements')
    insertions = spec.get('insertions')
    if (not isinstance(replacements, list) or len(replacements) != 3
            or not isinstance(insertions, list) or len(insertions) != 1
            or any(op.get('path') != PATH for op in replacements + insertions)):
        raise ValueError('millstone operation inventory differs')
    root = Path(host_root);path = root / PATH
    chain = [root, *[root.joinpath(*Path(PATH).parts[:i]) for i in range(1, len(Path(PATH).parts) + 1)]]
    if any(p.is_symlink() for p in chain) or not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('millstone source missing or outside pack')
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != PREIMAGE:raise ValueError('millstone original hash differs')
    for op in replacements:
        before, after = op['before'].encode(), op['after'].encode()
        if not before or raw.count(before) != 1:raise ValueError('millstone guard anchor is not unique')
        raw = raw.replace(before, after, 1)
    op = insertions[0];anchor = op['anchor'].encode()
    if op.get('position') != 'before' or not anchor or raw.count(anchor) != 1:
        raise ValueError('millstone helper anchor differs')
    raw = raw.replace(anchor, op['text'].encode() + anchor, 1)
    if hashlib.sha256(raw).hexdigest() != POSTIMAGE:raise ValueError('millstone patched hash differs')
    path.write_bytes(raw)
    return {key: copy.deepcopy(spec[key]) for key in (
        'id', 'version', 'kind', 'owner_version', 'expires', 'archive_sha256',
        'original_files', 'patched_files', 'copies', 'removal_condition', 'feedback', 'authorization')}
