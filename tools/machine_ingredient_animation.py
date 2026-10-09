"""Java tick-interpolated ingredient sprites for the two native helper families.

SpriteContents.InterpolationData in the reviewed 1.20.1 client interpolates RGB
at each texture tick and preserves the current frame's alpha. In particular,
blending RGBA would make ice-grape pixels appear/disappear at the wrong time.
These authored frames use ordinary entity textures, not a terrain atlas key
that a client-entity material cannot sample. No server tick/particle is added.
All helpers share the level tick clock. A newly rendered/recreated ingredient
must not restart a texture animation that Java's atlas animates globally.
See art/interfaces/texture-animation-clock-reference.json for native sample
evidence and the explicit remaining client synchronization check.
"""
import io
import json
from pathlib import Path
from PIL import Image
from refresh_visual_compat import profile

NS = 'kaleidoscope_tavern'
ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads(path.read_text())


def ice_grape_frames(root=ROOT):
    reference = read(root / 'art/interfaces/animated-item-java-reference.json')['sources']['ice_grape']
    source = Image.open(root / reference['texture']).convert('RGBA')
    metadata = reference['java_animation_metadata']['animation']
    sequence = metadata.get('frames', list(range(source.height // 16)))
    entries = [(row['index'], row.get('time', metadata.get('frametime', 1)))
               if isinstance(row, dict) else (row, metadata.get('frametime', 1))
               for row in sequence]
    assert metadata.get('interpolate') and entries == [(i, 2) for i in range(12)]
    frames = [source.crop((0, i * 16, 16, (i + 1) * 16)) for i, _ in entries]
    result = []
    for index, (current, (_, duration)) in enumerate(zip(frames, entries)):
        following = frames[(index + 1) % len(frames)]
        for tick in range(duration):
            # Integer form of Java's (int)(weight * a + (1-weight) * b).
            image = Image.new('RGBA', current.size)
            image.putdata([tuple((a[c] * (duration - tick) + b[c] * tick) // duration
                                for c in range(3)) + (a[3],)
                           for a, b in zip(current.getdata(), following.getdata())])
            result.append(image)
    return result


def bindings():
    return {f'ice_tick_{i}': f'textures/kt_runtime/machine_ingredients/ice_grape/tick_{i:02d}'
            for i in range(24)}


def controller(rc, property_name, kind):
    """Retain static catalogue aliases; only the actual ice selection animates."""
    rc['arrays']['textures']['Array.ice_grape_ticks'] = [f'Texture.{name}' for name in bindings()]
    rc['textures'] = [f"q.property('{NS}:{property_name}') == {kind} ? "
                      "Array.ice_grape_ticks[math.mod(math.floor(q.time_stamp), 24)] : "
                      f"Array.kind[q.property('{NS}:{property_name}')-1]"]


def outputs(root=ROOT):
    result = {}
    for i, image in enumerate(ice_grape_frames(root)):
        buffer = io.BytesIO()
        image.save(buffer, format='PNG', optimize=True)
        texture = bindings()[f'ice_tick_{i}']
        result[f'runtime/RP/{texture}.png'] = buffer.getvalue()
        # Retain the same conservative PBR profile as the original ice-grape
        # frames; frame generation must also reproduce their surface metadata.
        surface = {'format_version': '1.16.100', 'minecraft:texture_set': {
            'color': Path(texture).name,
            'metalness_emissive_roughness': [0, 0, profile(texture)[1]]}}
        result[f'runtime/RP/{texture}.texture_set.json'] = json.dumps(surface, indent=2) + '\n'
    for slot in range(8):
        suffix = '' if slot == 0 else f'_{slot}'
        name = f'runtime/RP/entity/runtime_pressing_tub_ingredients{suffix}.entity.json'
        value = read(root / name)
        value['minecraft:client_entity']['description']['textures'].update(bindings())
        result[name] = json.dumps(value, indent=2) + '\n'
    name = 'runtime/RP/render_controllers/runtime_pressing_ingredients.render_controllers.json'
    value = read(root / name)
    controller(value['render_controllers']['controller.render.kt_runtime.pressing_ingredients'], 'grape_kind', 2)
    result[name] = json.dumps(value, indent=2) + '\n'
    return result
