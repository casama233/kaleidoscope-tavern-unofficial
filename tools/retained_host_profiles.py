"""Exact P48 author variants and P49 basin carried by reviewed P49/P50 owners.

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


P50_PROFILES = {
    **PROFILES,
    'cookery-enamel-basin-lid-repair': {
        'source_commit': '2010872f17b8c23e6ffd172882089d1c6affa9fb',
        'owner_version': [1, 0, 49],
        'spec_sha256': '52bdab9e6d03a011f3219fa9122b21c6512c45d2b90c79f8c373c0725a1db558',
    },
}


# P50 source is a reviewed local candidate, not a published remote commit.
P51_PROFILES = {**P50_PROFILES, **{'cookery-millstone-extension-admission': {'source_commit': '5f91aa5eb19b67159dfcd9a8f0a0bddaf9632316', 'source_scope': 'reviewed_local_candidate', 'owner_version': [1, 0, 50], 'spec_sha256': 'dfb7cdf2fd010bbb1fe612a85a9f8b07c7f7245ca7f341a59dae89d01afada8a'}, 'cookery-held-geometry-canonicalization': {'source_commit': '5f91aa5eb19b67159dfcd9a8f0a0bddaf9632316', 'source_scope': 'reviewed_local_candidate', 'owner_version': [1, 0, 50], 'spec_sha256': '38f6804e991a5d3c765bc16190b8d6b701ca50215cb46802e4d8a9c84f6789f4'}}}


def retained_host_source(config, spec, path):
    """Return the frozen component identity and provenance, or no retention."""
    if 'retained_host_profiles' not in config:
        return None
    profiles = PROFILES if config.get('version') == OWNER_VERSION else P50_PROFILES if config.get('version') == [1, 0, 50] else P51_PROFILES if config.get('version') in ([1, 0, 51], [1, 0, 52], [1, 0, 53]) else None
    if (config.get('repository') != 'local/senluo-amw-cuisine'
            or profiles is None
            or config['retained_host_profiles'] != profiles):
        raise ValueError('unsupported retained host source profile')
    profile = profiles.get(spec.get('kind'))
    if profile is None or spec.get('owner_version') != profile['owner_version']:
        raise ValueError('retained host component identity differs')
    if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest() != profile['spec_sha256']:
        raise ValueError('retained host component differs from reviewed P48 bytes or P49 basin bytes')
    return copy.deepcopy(profile)
