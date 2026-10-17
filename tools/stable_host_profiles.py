"""Exact approved stable-author host declarations, without private implementation.

Existing profiles are unchanged. New author identities are admitted only with
the six reviewed declaration digests, original/output hashes, helper hashes and
their preceding public/private source receipts.
"""
import hashlib
import json
from pathlib import Path

CATALOG = json.loads(Path(__file__).with_suffix('.json').read_text())
PROFILES = CATALOG['profiles']


def declaration_sha(spec):
    return hashlib.sha256(json.dumps(spec, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def receipt(profile):
    return {key: profile[key] for key in ['id', 'version', 'original_files', 'patched_files', 'copies']}


def validate_stable_source(profile, source):
    if source.get('owner') != profile['source_owner'] or source.get('archive_sha256') != profile['archive_sha256']:
        raise ValueError('stable host requires its exact preceding author source')
    prior = source.get('reviewed_extensions', [])
    if not isinstance(prior, list):
        raise ValueError('stable host preceding receipts must be a list')
    for name in profile['required_extensions']:
        expected = CATALOG['public_api'] if name == 'public-api' else receipt(PROFILES[name])
        if not any(isinstance(row, dict) and all(row.get(key) == value for key, value in expected.items()) for row in prior):
            raise ValueError('stable host lacks exact preceding receipt: ' + name)


def match_stable_profile(spec, owned_root=None, source=None):
    new_hosts = {p['host_uuid'] for p in PROFILES.values()}
    new_archives = {p['archive_sha256'] for p in PROFILES.values()}
    if spec.get('host_uuid') not in new_hosts and spec.get('archive_sha256') not in new_archives:
        return None
    candidates = {**PROFILES, 'public-api': CATALOG['public_api_profile']}
    found = [(name, p) for name, p in candidates.items()
             if p['id'] == spec.get('id') and p['host_uuid'] == spec.get('host_uuid')]
    if not found:
        raise ValueError('unregistered stable host declaration')
    # Distinct owner releases may share the author UUID and extension ID.
    # Match the full reviewed declaration; never choose the newest by name.
    exact = [(name, profile) for name, profile in found if declaration_sha(spec) == profile['spec_sha256']]
    if len(exact) != 1:
        raise ValueError('stable host declaration differs from the exact reviewed profile: ' + spec['id'])
    name, profile = exact[0]
    if source is not None:
        validate_stable_source(profile, source)
    if owned_root is not None:
        for record in profile['copies'].values():
            path = owned_root / record['source']
            if path.is_symlink() or not path.resolve().is_relative_to(owned_root.resolve()) or not path.is_file():
                raise ValueError('stable host helper missing or outside owned source')
            if hashlib.sha256(path.read_bytes()).hexdigest() != record['sha256']:
                raise ValueError('stable host helper differs from the exact reviewed source')
    return profile
