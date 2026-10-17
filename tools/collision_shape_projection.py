"""Exact, test-only collision deltas over immutable public runtime predecessors.

Only the named shape properties may differ. Never use this historical view to
build or install a pack. Source-specific shape checks validate the new behavior.
"""
import copy
from functools import lru_cache
import json
from pathlib import Path
import subprocess

TAVERN_PREVIOUS = '3bd8f6ca285b5ef5f6e9abe962d12873dfae5752'
WORLD_PREVIOUS = '978c2594040555a668e842f3452d98a07973db34'
PREFIX = 'runtime/BP/blocks/'
CUPS = frozenset(('around_the_world', 'gin_tonic', 'highball', 'jerk',
                  'long_island_iced_tea', 'pine_colada', 'shrimp_cocktail'))
COLORS = frozenset(('black', 'blue', 'brown', 'cyan', 'gray', 'green',
                    'light_blue', 'light_gray', 'lime', 'magenta', 'orange',
                    'pink', 'purple', 'red', 'white', 'yellow'))
WOODS = frozenset(('birch', 'cherry', 'dark_oak', 'oak', 'spruce'))
WORLD_PATHS = frozenset({PREFIX + 'freezer.json'} |
                        {PREFIX + 'cup_' + name + '.json' for name in CUPS} |
                        {PREFIX + 'bar_stool_' + name + '.json' for name in COLORS} |
                        {PREFIX + wood + suffix + '.json' for wood in WOODS
                         for suffix in ('_bar_cabinet', '_cellar_cabinet')})
FREEZER = {'origin': [-8, 0, -7], 'size': [16, 12, 13]}
CUP = {'origin': [-4, 0, -4], 'size': [8, 10, 8]}
SAFE = {'origin': [-7.999, 0.001, -7.999], 'size': [15.998, 15.998, 15.998]}
STOOL = [{'origin': [-6, 0, -6], 'size': [12, 1, 12]},
         {'origin': [-1, 1, -1], 'size': [2, 11, 2]},
         {'origin': [-5, 12, -5], 'size': [10, 3, 10]}]


def barrel_permutations():
    result = []
    for directions, axis, sign, origin, size in (
        (('north', 'south'), 'dx', -1, [-4, 0, -8], [12, 16, 16]),
        (('north', 'south'), 'dx', 1, [-8, 0, -8], [12, 16, 16]),
        (('east', 'west'), 'dz', -1, [-8, 0, -4], [16, 16, 12]),
        (('east', 'west'), 'dz', 1, [-8, 0, -8], [16, 16, 12]),
    ):
        condition = (f"(q.block_state('minecraft:cardinal_direction') == '{directions[0]}' || "
                     f"q.block_state('minecraft:cardinal_direction') == '{directions[1]}') && "
                     f"q.block_state('kaleidoscope_tavern:{axis}') == {sign}")
        box = {'origin': origin, 'size': size}
        result.append({'condition': condition, 'components': {
            'minecraft:collision_box': box, 'minecraft:selection_box': copy.deepcopy(box)}})
    return result


@lru_cache(maxsize=64)
def immutable_before(root, commit, name):
    return subprocess.check_output(['git', 'show', commit + ':' + name], cwd=root)


def collision_preimage(root, name, data):
    if name != PREFIX + 'barrel_part.json' and name not in WORLD_PATHS:
        return data
    root = Path(root).resolve()
    # Paired catalog guards call this helper for both repositories. A shared
    # relative filename never authorizes using the other repository's history.
    baseline = root / 'baseline.json'
    repository = json.loads(baseline.read_text()).get('repository') if baseline.is_file() else None
    if name == PREFIX + 'barrel_part.json' and repository == 'casama233/kaleidoscope-tavern-unofficial':
        commit = TAVERN_PREVIOUS
    elif name in WORLD_PATHS and repository == 'casama233/kaleidoscope-world-liquor-unofficial':
        commit = WORLD_PREVIOUS
    else:
        return data
    before = immutable_before(str(root), commit, name)
    # Unchanged predecessors remain readable by historical test contexts.
    if data == before:
        return data
    original = json.loads(before)
    expected = copy.deepcopy(original)
    block = expected['minecraft:block']
    if commit == TAVERN_PREVIOUS:
        assert 'permutations' not in block, 'Immutable barrel predecessor changed'
        block['permutations'] = barrel_permutations()
    else:
        components = block['components']
        if name == PREFIX + 'freezer.json':
            components['minecraft:collision_box'] = FREEZER
            components['minecraft:selection_box'] = FREEZER
        elif name.startswith(PREFIX + 'cup_'):
            components['minecraft:collision_box'] = CUP
            components['minecraft:selection_box'] = CUP
        elif name.endswith('_cabinet.json'):
            components['minecraft:collision_box'] = SAFE
            components['minecraft:selection_box'] = SAFE
        else:
            components['minecraft:collision_box'] = STOOL
    assert json.loads(data) == expected, ('Collision delta exceeds the source-reviewed shape', name)
    return before
