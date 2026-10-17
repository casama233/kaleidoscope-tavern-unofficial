"""One pinned Cookery 1.6.1 geometry condition repair; author bytes stay owned.

The declaration lives in the private canonical integration. This consumer only
admits its reviewed hash and replaces the middle-level range's two numbers.
"""
import copy
from datetime import date
import hashlib
import json
from pathlib import Path

from stable_host_profiles import match_stable_profile

KIND = 'cookery-enamel-basin-lid-repair'
IDENTIFIER = 'kaleidoscope_cookery:enamel_basin'
HOST = 'd0ca7a68-2877-4bd5-bc82-6c7b325cccf2'
ARCHIVE = '5b01865d4dd9a455cd80dae4ddc94dc45964e074025f7d24c6f0c5e35f0fbe52'
OWNER_VERSION = [1, 0, 49]
PATH = 'blocks/kitchen/enamel_basin.json'
PREIMAGE = 'c8d09a76dc06316c61010568539a4e791c1d20e2d92e11e79d425a988458faab'
POSTIMAGE = 'fe86d6cec01398f9ef9d02ad0e48212e2a31a11a2aed974464b26c6fc10cdf30'
OIL = "(q.block_state('kaleidoscope_cookery:oil_low') + q.block_state('kaleidoscope_cookery:oil_high') * 11)"
OPEN = "q.block_state('kaleidoscope_cookery:has_lid') == false"
OLD = f'{OPEN} && {OIL} >= 1 && {OIL} <= 10'
NEW = f'{OPEN} && {OIL} >= 11 && {OIL} <= 20'
MIDDLE = 'geometry.kaleidoscope_cookery.enamel_basin_middle'
BEFORE = f'        "condition": "{OLD}",\n        "components": {{\n          "minecraft:geometry": "{MIDDLE}",'
AFTER = BEFORE.replace(OLD, NEW)


def repair_condition(raw):
    """Preserve formatting and every semantic value except permutation 3's range."""
    before = json.loads(raw)
    block = before.get('minecraft:block', {})
    rows = block.get('permutations', [])
    if (block.get('description', {}).get('identifier') != IDENTIFIER or len(rows) != 5
            or rows[3].get('condition') != OLD
            or rows[3].get('components', {}).get('minecraft:geometry') != MIDDLE):
        raise ValueError('enamel basin middle permutation differs')
    if raw.count(BEFORE.encode()) != 1:
        raise ValueError('enamel basin repair needs one exact middle geometry anchor')
    result = raw.replace(BEFORE.encode(), AFTER.encode(), 1)
    expected = copy.deepcopy(before)
    expected['minecraft:block']['permutations'][3]['condition'] = NEW
    if json.loads(result) != expected:
        raise ValueError('enamel basin repair changed other semantics')
    return result


def validate_enamel_basin_owner(config, spec):
    if (config.get('repository') != 'local/senluo-amw-cuisine'
            or config.get('version') != OWNER_VERSION or spec.get('owner_version') != OWNER_VERSION):
        raise ValueError('enamel basin repair requires canonical private owner P49')


def apply_enamel_basin_extension(spec, owned_root, host_root, source):
    """Validate the exact declaration, source and output before the sole write."""
    if (type(spec.get('schema')) is not int or spec['schema'] != 1
            or spec.get('kind') != KIND or spec.get('id') != 'senluo:' + KIND
            or spec.get('version') != [1, 0, 1] or spec.get('owner_version') != OWNER_VERSION
            or spec.get('host_uuid') != HOST or spec.get('archive_sha256') != ARCHIVE):
        raise ValueError('enamel basin declaration identity differs')
    try:
        expires = date.fromisoformat(spec['expires'])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError('enamel basin expiry is invalid') from exc
    if expires < date.today():
        raise ValueError('enamel basin repair expired')
    for key in ('removal_condition', 'feedback', 'authorization'):
        if not isinstance(spec.get(key), str) or not spec[key].strip():
            raise ValueError('enamel basin review metadata missing ' + key)
    if (spec.get('original_files') != {PATH: PREIMAGE}
            or spec.get('patched_files') != {PATH: POSTIMAGE}
            or spec.get('imports') != {} or spec.get('insertions') != []
            or spec.get('copies') != {} or spec.get('json_updates') != []
            or spec.get('text_replacements') != [dict(path=PATH, before=BEFORE, after=AFTER)]):
        raise ValueError('enamel basin repair permits only the exact middle-range replacement')
    profile = match_stable_profile(spec, owned_root, source)
    if profile is None or profile.get('owner_version') != OWNER_VERSION:
        raise ValueError('enamel basin repair requires its exact reviewed private owner')
    root = Path(host_root)
    path = root / PATH
    chain = [root, *[root.joinpath(*Path(PATH).parts[:i]) for i in range(1, len(Path(PATH).parts) + 1)]]
    if any(part.is_symlink() for part in chain) or not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('enamel basin source missing or outside pack')
    original = path.read_bytes()
    if hashlib.sha256(original).hexdigest() != PREIMAGE:
        raise ValueError('enamel basin original host hash differs')
    result = repair_condition(original)
    if hashlib.sha256(result).hexdigest() != POSTIMAGE:
        raise ValueError('enamel basin patched host hash differs')
    path.write_bytes(result)
    return {key: copy.deepcopy(spec[key]) for key in (
        'id', 'version', 'kind', 'owner_version', 'expires', 'archive_sha256',
        'original_files', 'patched_files', 'copies', 'removal_condition', 'feedback', 'authorization')}
