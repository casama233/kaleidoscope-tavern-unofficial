#!/usr/bin/env python3
"""Build original animated native item visuals without a custom hand rig.

The established development command generates the complete mesh/atlas/item
route, including a hidden render-only target for the native ice-grape food.
"""
from animated_item_render_contract import check_or_write

if __name__=='__main__':
    print('Original animated native item routes:',check_or_write(write=True))
