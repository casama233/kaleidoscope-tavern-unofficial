"""Inspect migrated block states in the same isolated first/restart world.

Complete position/state signatures tolerate palette reordering and compression,
while console probes load a bounded set of existing chunks. No new blocks,
players, gameplay modules or experiments are introduced.
"""
import hashlib
import json
import re
import struct
from collections import Counter
from author_state_migration import validate_profile, transform_subchunk


def typed_states(tag):
    return {name: [value.tag_id, str(value) if value.tag_id == 8 else int(value)]
            for name, value in sorted(tag['states'].items())}


def inspect_world(world, profile):
    from leveldb import LevelDB
    rules = validate_profile(profile)
    markers = [name.encode() for name in rules]
    rows = {}; probes = []; blocks = 0
    db = LevelDB(str(world / 'db'))
    try:
        for key, raw in db.items():
            if not (len(key) in (10, 14) and key[-2] == 0x2f and any(name in raw for name in markers)):
                continue
            positions = []
            dimension = struct.unpack_from('<i', key, 8)[0] if len(key) == 14 else 0
            if dimension not in (0, 1, 2):
                raise ValueError('unknown migrated block dimension')
            chunk_x, chunk_z = struct.unpack_from('<ii', key)
            sub_y = struct.unpack('b', key[-1:])[0]
            def observe(tag, layer, palette_index, bits, packed):
                nonlocal blocks
                name = str(tag.get('name', ''))
                if name not in rules:
                    return
                states = typed_states(tag)
                first = None
                for index in range(4096):
                    word = struct.unpack_from('<I', packed, (index // (32 // bits)) * 4)[0] if bits else 0
                    value = (word >> ((index % (32 // bits)) * bits)) & ((1 << bits) - 1) if bits else 0
                    if value != palette_index:
                        continue
                    positions.append([layer, index, name, states]);blocks += 1
                    if first is None and layer == 0:
                        first = {'dimension': dimension, 'position': [chunk_x * 16 + (index >> 8), sub_y * 16 + (index & 15), chunk_z * 16 + ((index >> 4) & 15)], 'identifier': name, 'states': states}
                if first is not None:
                    probes.append(first)
            _, converted = transform_subchunk(raw, rules, observe)
            if converted:
                raise ValueError('old author state encoding remains after offline migration')
            if positions:
                rows[key.hex()] = hashlib.sha256(json.dumps(sorted(positions), sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        return {'position_state_signatures': rows, 'blocks': blocks, 'probes': probes}
    finally:
        db.close()


def probe_commands(inspection, limit=8):
    """At most eight existing chunk areas, leaving space for ordinary QA areas."""
    groups = {}
    for probe in inspection['probes']:
        x, _, z = probe['position']
        groups.setdefault((probe['dimension'], x // 16, z // 16), []).append(probe)
    selected = sorted(groups, key=lambda key: (-len(groups[key]), key))[:limit]
    start = []; delayed = []; expected = []
    dimensions = {0: 'overworld', 1: 'nether', 2: 'the_end'}
    for area, key in enumerate(selected):
        rows = groups[key]; dimension = dimensions[key[0]]
        x, y, z = rows[0]['position']
        start.append(f'execute in {dimension} run tickingarea add circle {x} {y} {z} 1 author_state_{area} true')
        for row in rows:
            x, y, z = row['position']
            values = []
            for name, (tag_id, value) in row['states'].items():
                literal = json.dumps(bool(value)) if tag_id == 1 else json.dumps(value)
                values.append(json.dumps(name) + '=' + literal)
            expected.append({'dimension': dimension, 'position': [x, y, z]})
            delayed.append(f'execute in {dimension} run testforblock {x} {y} {z} {row["identifier"]} [{",".join(values)}]')
    return start, delayed, expected


def verify(before, after, log, expected):
    retained = before['position_state_signatures'] == after['position_state_signatures'] and before['blocks'] == after['blocks']
    # Each zero-player native testforblock command emits one coordinate reply.
    # Equal coordinates in different dimensions require separate replies; a
    # partially observed group cannot identify which dimension passed.
    required = Counter(tuple(probe['position']) for probe in expected)
    messages = Counter(tuple(map(int, match)) for match in re.findall(r'(?m)^\[[^\]\r\n]+ INFO\][ \t]+Successfully found the block at (-?\d+),(-?\d+),(-?\d+)\.[ \t]*\r?$', log))
    errors = any(' ERROR]' in line or '[error]' in line.lower() for line in log.splitlines())
    observed = messages == required and not errors
    passed = sum(count for position, count in required.items() if messages[position] == count)
    return {'complete_existing_position_states_retained': retained, 'console_probes_expected': len(expected),
            'console_probes_passed': passed, 'console_probe_passed': observed,
            'console_probe_response_count': sum(messages.values()), 'console_probe_errors_present': errors,
            'blocks': after['blocks'], 'chunk_records': len(after['position_state_signatures']), 'ok': retained and observed}
