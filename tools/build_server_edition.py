#!/usr/bin/env python3
"""Build the Tavern C6 server edition (0.6.2) from the in-repo runtime.

Deltas over upstream runtime/ (see docs/C6-SERVER-0.6.2.md):
  1. Re-apply tools/server-edition.patch (the carried 0.6.1 server fixes:
     native loading, pressing, Cookery table support, Molang/AO fields).
  2. Bump the pack version to 0.6.2 (header, modules, cross-pack dependency,
     display names) and the init banner in scripts/main.js.
  3. Add the unlock data that 1.20+ crafting recipes require (17 sofas, tavern
     table, bar counter) — the engine rejects them without it.
  4. recipes/table.json: minecraft:fences is not a Bedrock item tag; the whole
     recipe is rejected until it names a concrete fence item.

Usage:  python tools/build_server_edition.py [OUT_DIR]
"""
import json, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PATCH = HERE / 'server-edition.patch'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'build/server-edition-0.6.2'

if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
subprocess.run(['git', 'archive', head], cwd=ROOT, stdout=open(OUT / 'src.tar', 'wb'), check=True)
subprocess.run(['tar', 'xf', 'src.tar', '-C', OUT, 'runtime'], cwd=OUT, check=True)
(OUT / 'src.tar').unlink()
(OUT / 'SOURCE_HEAD').write_text(head + '\n')

dry = subprocess.run(['patch', '-p1', '--dry-run', '-i', str(PATCH)], cwd=OUT, capture_output=True, text=True)
assert dry.returncode == 0, dry.stdout + dry.stderr
subprocess.run(['patch', '-p1', '-i', str(PATCH)], cwd=OUT, check=True)
assert not list(OUT.rglob('*.rej')) and not list(OUT.rglob('*.orig'))

def bump(text):
    for old, new in [
        ('[\n      0,\n      6,\n      1\n    ]', '[\n      0,\n      6,\n      2\n    ]'),
        ('[\n        0,\n        6,\n        1\n      ]', '[\n        0,\n        6,\n        2\n      ]'),
        ('0.6.1', '0.6.2'),
    ]:
        text = text.replace(old, new)
    return text

for f in ['runtime/BP/manifest.json', 'runtime/RP/manifest.json']:
    p = OUT / f
    t = bump(p.read_text(encoding='utf-8'))
    json.loads(t); p.write_text(t, encoding='utf-8')

UNLOCK = {'table.json': 'minecraft:iron_ingot', 'bar_counter.json': 'minecraft:gold_nugget'}
recipes = OUT / 'runtime/BP/recipes'
added = []
for p in sorted(recipes.glob('*.json')):
    j = json.loads(p.read_text(encoding='utf-8'))
    r = j.get('minecraft:recipe_shaped')
    if r is None or 'unlock' in r: continue
    if p.stem.endswith('_sofa'):
        gate = next(v['item'] for v in r['key'].values() if v.get('item', '').endswith('_wool'))
    else:
        gate = UNLOCK[p.name]
    r['unlock'] = [{'item': gate}]
    p.write_text(json.dumps(j, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    added.append((p.name, gate))

p = recipes / 'table.json'
j = json.loads(p.read_text(encoding='utf-8'))
r = j['minecraft:recipe_shaped']
fixed = 0
for v in r['key'].values():
    if v.get('tag') == 'minecraft:fences':
        del v['tag']; v['item'] = 'minecraft:oak_fence'; fixed += 1
assert fixed == 1, fixed
p.write_text(json.dumps(j, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

m = OUT / 'runtime/BP/scripts/main.js'
t = m.read_text(encoding='utf-8')
assert t.count('Server edition 0.6.1.') == 1
m.write_text(t.replace('Server edition 0.6.1.', 'Server edition 0.6.2.'), encoding='utf-8')

bp = json.loads((OUT / 'runtime/BP/manifest.json').read_text(encoding='utf-8'))
rp = json.loads((OUT / 'runtime/RP/manifest.json').read_text(encoding='utf-8'))
assert bp['header']['version'] == [0, 6, 2] and rp['header']['version'] == [0, 6, 2]
assert all(mm['version'] == [0, 6, 2] for mm in bp['modules'] + rp['modules'])
assert next(d for d in bp['dependencies'] if 'uuid' in d)['version'] == [0, 6, 2]
print('upstream', head)
print('unlock added:', len(added), '| fences tag fixed:', fixed)
print('OK server edition 0.6.2 ->', OUT)
