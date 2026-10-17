"""The two unchanged P48 author variants carried by the narrow P49 repair.

Retention is bound to an exact owner, prior source commit and declaration bytes.
It never relabels the existing ChineseFood/Nether outputs as newly generated.
"""
import copy
import hashlib

SOURCE_COMMIT = '0e877a6a5f371b1fcbe14503e5df474e5855c991'
OWNER_VERSION = [1, 0, 49]
COMPONENT_VERSION = [1, 0, 48]
PROFILES = {
    'chinesefood-doll-renderer-cleanup': {
        'source_commit': SOURCE_COMMIT,
        'owner_version': COMPONENT_VERSION,
        'spec_sha256': '90ed99beb102576fb364009abaa9a3247f1ad081d6804a92a612169eaa12b48e',
    },
    'nether-placeable-drinks-schema-repair': {
        'source_commit': SOURCE_COMMIT,
        'owner_version': COMPONENT_VERSION,
        'spec_sha256': '7509850c5c728af344ca2a5f563296aa885cf3e571d784a558f0c6dd424de204',
    },
}


def retained_host_source(config, spec, path):
    """Return the frozen component identity and provenance, or no retention."""
    if 'retained_host_profiles' not in config:
        return None
    if (config.get('repository') != 'local/senluo-amw-cuisine'
            or config.get('version') != OWNER_VERSION
            or config['retained_host_profiles'] != PROFILES):
        raise ValueError('unsupported retained host source profile')
    profile = PROFILES.get(spec.get('kind'))
    if profile is None or spec.get('owner_version') != COMPONENT_VERSION:
        raise ValueError('retained host component identity differs')
    if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest() != profile['spec_sha256']:
        raise ValueError('retained host component differs from reviewed P48 bytes')
    return copy.deepcopy(profile)
