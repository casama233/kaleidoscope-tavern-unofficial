"""Exact reviewed author state conversions; preserve storage indices and other NBT.

Only persistent v8/v9 block palettes are accepted. Zero-bit uniform storage has
one NBT root and no count; positive widths use a little-endian 32-bit count.
The declaration pins the original/new author definitions and encoding sources.
"""
import io
import struct
import nbtlib

PREFIX = 'kaleidoscope_cookery:'
COLORS = ('white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink',
          'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black')


class StrictNBTStream(io.BytesIO):
    """nbtlib otherwise treats a missing End tag at EOF as a valid compound."""
    def read(self, size=-1):
        data = super().read(size)
        if size >= 0 and len(data) != size:
            raise ValueError('truncated binary/NBT record')
        return data


def validate_profile(profile):
    if profile.get('schema') != 1 or profile.get('kind') != 'cookery161_nether102_states':
        raise ValueError('unreviewed author state profile')
    rules = profile.get('blocks', [])
    if len(rules) != 28 or len({r['identifier'] for r in rules}) != 28:
        raise ValueError('author state migration requires all 28 reviewed definitions')
    for row in rules:
        if row['conversion'] not in ('chair_carpet', 'table_carpet', 'basin_oil', 'board_mode'):
            raise ValueError('unsupported author state conversion')
        for key in ('before_sha256', 'after_sha256'):
            value = row[key]
            if len(value) != 64 or any(c not in '0123456789abcdef' for c in value):
                raise ValueError('incomplete author definition digest')
    return {r['identifier']: r for r in rules}


def validate_states(states, domains):
    for key, allowed in domains.items():
        if key not in states:
            raise ValueError('missing reviewed block state ' + key)
        value = states[key]
        expected = nbtlib.Byte if type(allowed[0]) is bool else nbtlib.Int if type(allowed[0]) is int else nbtlib.String
        if type(value) is not expected or value not in allowed:
            raise ValueError('invalid reviewed block state ' + key)


def convert_block(node, rules):
    """Convert named palette/item Block compounds, never arbitrary named data."""
    name = node.get('name')
    if not isinstance(name, nbtlib.String) or str(name) not in rules:
        return 0
    states = node.get('states')
    if not isinstance(states, nbtlib.Compound):
        raise ValueError('reviewed author block lacks a state compound')
    rule = rules[str(name)]
    before, after = rule['before_states'], rule['after_states']
    removed = set(before) - set(after)
    if not removed.intersection(states):
        validate_states(states, after)
        return 0
    validate_states(states, before)
    if (set(after) - set(before)).intersection(states):
        raise ValueError('mixed old/new author state encoding')
    kind = rule['conversion']
    if kind in ('chair_carpet', 'table_carpet'):
        stem = 'chair' if kind == 'chair_carpet' else 'table'
        color = PREFIX + ('carpet_color' if stem == 'chair' else 'table_carpet')
        status = COLORS.index(str(states[color])) + 1 if states[PREFIX + 'has_carpet'] else 0
        states[PREFIX + stem + '_carpet_slot'] = nbtlib.Int(status % 9)
        states[PREFIX + stem + '_carpet_bank'] = nbtlib.Int(status // 9)
    elif kind == 'basin_oil':
        amount = 32 if states[PREFIX + 'oil_full'] else int(states[PREFIX + 'oil_low']) + (16 if states[PREFIX + 'oil_high'] else 0)
        states[PREFIX + 'oil_low'] = nbtlib.Int(amount % 11)
        states[PREFIX + 'oil_high'] = nbtlib.Int(amount // 11)
    elif kind == 'board_mode':
        # 1.6.1 folds presence into this existing state's meaning: zero empty,
        # one builtin, two/three native extension slots one/two. The builtin
        # item index, cutting progress and recovery token retain their meaning.
        states[PREFIX + 'extension_board_model'] = nbtlib.Int(
            int(states[PREFIX + 'extension_board_model']) + 1 if states[PREFIX + 'board_has_food'] else 0)
    for key in removed:
        del states[key]
    validate_states(states, after)
    return 1


def visit_blocks(node, rules):
    changes = 0
    if isinstance(node, nbtlib.Compound):
        changes += convert_block(node, rules)
        for value in node.values():
            changes += visit_blocks(value, rules)
    elif isinstance(node, nbtlib.List):
        for value in node:
            changes += visit_blocks(value, rules)
    return changes


def transform_subchunk(raw, rules, observer=None):
    """Keep headers, palette order, packed indices and untouched roots byte exact."""
    if len(raw) < 2 or raw[0] not in (8, 9):
        raise ValueError('unsupported author subchunk version')
    stream = StrictNBTStream(raw)
    header_size = 3 if raw[0] == 9 else 2
    if len(raw) < header_size or raw[1] not in (1, 2):
        raise ValueError('unsupported author subchunk storage count')
    output = [stream.read(header_size)]
    changes = 0
    for layer in range(raw[1]):
        head = stream.read(1)
        if not head or head[0] & 1:
            raise ValueError('expected persistent palette storage')
        bits = head[0] >> 1
        if bits not in (0, 1, 2, 3, 4, 5, 6, 8, 16):
            raise ValueError('unsupported author palette bit width')
        words = (4096 + 32 // bits - 1) // (32 // bits) if bits else 0
        packed = stream.read(words * 4)
        if len(packed) != words * 4:
            raise ValueError('truncated palette indices')
        count_bytes = stream.read(4) if bits else b''
        if bits and len(count_bytes) != 4:
            raise ValueError('missing palette count')
        count = struct.unpack('<I', count_bytes)[0] if bits else 1
        if not 1 <= count <= min(4096, 1 << bits if bits else 1):
            raise ValueError('invalid persistent palette count')
        if bits:
            mask = (1 << bits) - 1
            for index in range(4096):
                word = struct.unpack_from('<I', packed, (index // (32 // bits)) * 4)[0]
                if ((word >> ((index % (32 // bits)) * bits)) & mask) >= count:
                    raise ValueError('palette index outside reviewed storage')
        output.extend((head, packed, count_bytes))
        for palette_index in range(count):
            start = stream.tell()
            tag = nbtlib.File.parse(stream, byteorder='little')
            end = stream.tell()
            changed = convert_block(tag, rules)
            changes += changed
            if observer is not None:
                observer(tag, layer, palette_index, bits, packed)
            if changed:
                encoded = io.BytesIO()
                tag.write(encoded, byteorder='little')
                output.append(encoded.getvalue())
            else:
                output.append(raw[start:end])
    if stream.tell() != len(raw):
        raise ValueError('subchunk contains an unparsed suffix')
    return b''.join(output) if changes else raw, changes
