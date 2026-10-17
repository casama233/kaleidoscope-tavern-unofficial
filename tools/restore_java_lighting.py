#!/usr/bin/env python3
"""Compatibility entry point for the canonical reviewed PBR generator.

Do not infer emissive pixels from shade=false faces on a light-emitting block:
shared glass/rack atlases include ordinary reflective surfaces. The explicit
masks and source RGBA hashes in data/pbr-emission-masks.json own emission.
"""
from refresh_visual_compat import audit

if __name__ == '__main__':
    result = audit(write=True)
    if result['errors']:
        raise SystemExit('\n'.join(result['errors']))
    print('Refreshed canonical PBR profiles:', result['summary'])
