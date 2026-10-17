#!/usr/bin/env python3
"""Normalize Tavern JSON fields confirmed invalid by the Bedrock 1.26.51 server.

This is an overlay-time compatibility pass, not an asset generator. It changes only
schema representation (numeric material/entity values, Molang quote syntax, and
required recipe unlock descriptors) and never creates or removes game content.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

NAMESPACE = 'kaleidoscope_tavern'
BLOCK_STATE_LITERAL = re.compile(r"(\s*(?:==|!=)\s*)\"([^\"]*)\"")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def dump_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def walk_material_instances(node: Any) -> int:
    """Convert world and item_visual material ambient booleans to schema numbers."""
    changed = 0
    if isinstance(node, dict):
        for key in ('minecraft:material_instances', 'material_instances'):
            mats = node.get(key)
            if isinstance(mats, dict):
                for material in mats.values():
                    if isinstance(material, dict) and isinstance(material.get('ambient_occlusion'), bool):
                        material['ambient_occlusion'] = 1.0 if material['ambient_occlusion'] else 0.0
                        changed += 1
        for value in node.values():
            changed += walk_material_instances(value)
    elif isinstance(node, list):
        for value in node:
            changed += walk_material_instances(value)
    return changed


def normalize_block(path: Path) -> dict[str, int]:
    data = load_json(path)
    block = data.get('minecraft:block')
    if not isinstance(block, dict) or not str(block.get('description', {}).get('identifier', '')).startswith(NAMESPACE + ':'):
        return {}
    counts = {'ambient_occlusion': walk_material_instances(data)}
    components = block.get('components', {})
    fall = components.get('minecraft:entity_fall_on')
    if isinstance(fall, dict) and 'minimum_fall_distance' in fall:
        value = fall.pop('minimum_fall_distance')
        fall.setdefault('min_fall_distance', value)
        counts['entity_fall_on'] = 1
    else:
        counts['entity_fall_on'] = 0
    molang = 0
    for permutation in block.get('permutations', []):
        if not isinstance(permutation, dict):
            continue
        condition = permutation.get('condition')
        if isinstance(condition, str):
            fixed = BLOCK_STATE_LITERAL.sub(lambda m: m.group(1) + "'" + m.group(2) + "'", condition)
            if fixed != condition:
                permutation['condition'] = fixed
                molang += 1
    counts['molang_literals'] = molang
    if any(counts.values()):
        dump_json(path, data)
    return counts


def ingredient_unlocks(recipe: dict[str, Any]) -> list[dict[str, str]]:
    # A shaped recipe's ingredients live in `key`; a shapeless recipe's in
    # `ingredients`. Only copy actual item/tag descriptors into the required
    # 1.20+ unlock list, preserving their source identifiers and alternatives.
    obj = next((v for k, v in recipe.items() if k.startswith('minecraft:recipe_') and isinstance(v, dict)), None)
    if obj is None:
        return []
    source = obj.get('key', {}).values() if isinstance(obj.get('key'), dict) else obj.get('ingredients', [])
    result: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for entry in source:
        entries = entry if isinstance(entry, list) else [entry]
        for option in entries:
            if not isinstance(option, dict):
                continue
            key = 'item' if isinstance(option.get('item'), str) else 'tag' if isinstance(option.get('tag'), str) else None
            if key is None:
                continue
            pair = key, option[key]
            if pair not in seen:
                seen.add(pair)
                result.append({key: option[key]})
    return result


def normalize_recipe(path: Path) -> dict[str, int]:
    data = load_json(path)
    recipe_key = next((k for k in data if k.startswith('minecraft:recipe_')), None)
    if not recipe_key:
        return {}
    recipe = data[recipe_key]
    identifier = recipe.get('description', {}).get('identifier', '') if isinstance(recipe, dict) else ''
    if not str(identifier).startswith(NAMESPACE + ':'):
        return {}
    try:
        version = tuple(int(x) for x in str(data.get('format_version', '0')).split('.')[:2])
    except ValueError:
        version = (0, 0)
    if version < (1, 20) or 'unlock' in recipe:
        return {'recipe_unlock': 0}
    unlocks = ingredient_unlocks(data)
    if not unlocks:
        return {'recipe_unlock': 0}
    recipe['unlock'] = unlocks
    dump_json(path, data)
    return {'recipe_unlock': 1}


def normalize_entity(path: Path) -> dict[str, int]:
    data = load_json(path)
    entity = data.get('minecraft:entity')
    description = entity.get('description', {}) if isinstance(entity, dict) else {}
    if not str(description.get('identifier', '')).startswith(NAMESPACE + ':'):
        return {}
    properties = description.get('properties', {})
    changed = 0
    ranges = 0
    if isinstance(properties, dict):
        for spec in properties.values():
            if not isinstance(spec, dict) or spec.get('type') != 'float':
                continue
            if type(spec.get('default')) is int:
                spec['default'] = float(spec['default'])
                changed += 1
            value = spec.get('range')
            if isinstance(value, list):
                for index, item in enumerate(value):
                    if type(item) is int:
                        value[index] = float(item)
                        ranges += 1
    if changed or ranges:
        dump_json(path, data)
    return {'float_defaults': changed, 'float_ranges': ranges}


def normalize_runtime(runtime: Path) -> dict[str, int]:
    bp = runtime / 'BP' if (runtime / 'BP').is_dir() else runtime
    totals: dict[str, int] = {}
    for directory, function in (('blocks', normalize_block), ('recipes', normalize_recipe), ('entities', normalize_entity)):
        folder = bp / directory
        if not folder.is_dir():
            continue
        for path in sorted(folder.rglob('*.json')):
            for kind, count in function(path).items():
                totals[kind] = totals.get(kind, 0) + count
    return totals


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('runtime_root', type=Path, help='Runtime root (contains BP/), or behavior pack root')
    args = parser.parse_args()
    runtime = args.runtime_root.resolve()
    counts = normalize_runtime(runtime)
    print(json.dumps({'runtime_root': str(runtime), 'normalized': counts}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
