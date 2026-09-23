#!/usr/bin/env python3
"""Build the Tavern C6 server edition (0.6.5) from the in-repo runtime.

Deltas over upstream runtime/ (see docs/C6-SERVER.md):
  1. Re-apply tools/server-edition.patch (the carried 0.6.1 server fixes:
     native loading, pressing, Cookery table support, Molang/AO fields).
  2. Bump the pack version to 0.6.5 (header, modules, cross-pack dependency,
     display names) and the init banner in scripts/main.js.
  3. Add the unlock data that 1.20+ crafting recipes require (17 sofas, tavern
     table, bar counter) — the engine rejects them without it.
  4. recipes/table.json: minecraft:fences is not a Bedrock item tag; the whole
     recipe is rejected until it names a concrete fence item.

Usage:  python tools/build_server_edition.py [OUT_DIR]
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PATCH = HERE / 'server-edition.patch'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'build/server-edition-0.6.5'

if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
subprocess.run(['git', 'archive', head], cwd=ROOT, stdout=open(OUT / 'src.tar', 'wb'), check=True)
subprocess.run(['tar', 'xf', 'src.tar', '-C', OUT, 'runtime'], cwd=OUT, check=True)
(OUT / 'src.tar').unlink()
(OUT / 'SOURCE_HEAD').write_text(head + '\n')

dry = subprocess.run(['patch', '-p1', '--dry-run', '-i', str(PATCH)], cwd=OUT, capture_output=True, text=True)
# Upstream reworded the BP manifest description and the two main.js banners, so
# exactly three patch hunks no longer apply; this tool re-does those edits itself.
assert dry.stdout.count('FAILED') >= 5, dry.stdout + dry.stderr  # hunk lines + summary lines; new upstream rewrites drop hunks
apply = subprocess.run(['patch', '-p1', '-i', str(PATCH)], cwd=OUT, capture_output=True, text=True)
assert apply.stdout.count('FAILED') >= 5, apply.stdout + apply.stderr
for rej in list(OUT.rglob('*.rej')):
    rej.unlink()
for orig in list(OUT.rglob('*.orig')):
    orig.unlink()

m = OUT / 'runtime/BP/manifest.json'
j = json.loads(m.read_text(encoding='utf-8'))
assert j['header']['name'] == '森羅物語：酒館 C6 | 功能開發版', j['header']['name']
j['header']['name'] = '森羅物語：酒館 0.6.5 | 伺服器修正版 BP'
j['header']['description'] = 'Tavern C6 server fixes: native loading, pressing, recipes and Cookery table support.'
j['header']['version'] = [0, 6, 5]  # the failed hunk also carried the header version bump
m.write_text(json.dumps(j, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

def bump(text):
    """Rewrite every 0.6.x version array and the 0.6.x display strings to 0.6.5."""
    text = re.sub(r'\[\s*0,\s*6,\s*\d+\s*\]', '[0, 6, 5]', text)
    text = text.replace('0.6.0', '0.6.5').replace('0.6.1', '0.6.5').replace('0.6.2', '0.6.5')
    text = text.replace('0.6.3', '0.6.5').replace('0.6.4', '0.6.5')
    return text

for f in ['runtime/BP/manifest.json', 'runtime/RP/manifest.json']:
    p = OUT / f
    t = bump(p.read_text(encoding='utf-8'))
    json.loads(t); p.write_text(t, encoding='utf-8')

recipes = OUT / 'runtime/BP/recipes'
PREFERENCE = ['minecraft:iron_ingot', 'minecraft:gold_nugget', 'minecraft:bucket', 'minecraft:oak_fence']
def gate_for(r):
    items = [v.get('item') for v in r['key'].values() if v.get('item')]
    for want in PREFERENCE:
        if want in items: return want
    wools = [x for x in items if x.endswith('_wool')]
    if wools: return wools[0]
    assert items, 'no concrete ingredient to unlock with'
    return items[0]
added = []
for p in sorted(recipes.glob('*.json')):
    j = json.loads(p.read_text(encoding='utf-8'))
    r = j.get('minecraft:recipe_shaped')
    if r is None or 'unlock' in r: continue
    gate = gate_for(r)
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

# Upstream uses two Java-era item ids this BDS rejects as recipe ingredients:
# minecraft:item_frame (the Bedrock item is minecraft:frame) and
# minecraft:oak_trapdoor (accepted as minecraft:trapdoor). Rewrite every
# recipe, shaped or shapeless, then record what changed.
RENAME = {'minecraft:item_frame': 'minecraft:frame', 'minecraft:oak_trapdoor': 'minecraft:trapdoor'}
for p in sorted(recipes.glob('*.json')):
    j = json.loads(p.read_text(encoding='utf-8'))
    r = j.get('minecraft:recipe_shapeless') or j.get('minecraft:recipe_shaped')
    if r is None: continue
    changed = 0
    for i in r.get('ingredients', []):
        if isinstance(i, dict) and i.get('item') in RENAME:
            i['item'] = RENAME[i['item']]; changed += 1
    for v in r.get('key', {}).values():
        if isinstance(v, dict) and v.get('item') in RENAME:
            v['item'] = RENAME[v['item']]; changed += 1
    if changed:
        p.write_text(json.dumps(j, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print(p.name, 'renamed ingredients x', changed)

# The 0.6.1 patch still applies its lid guard (with fuzz) into the build output:
# closing the lid is refused while non-empty slots hold different counts, so
# advanceBarrel()'s Math.min(...) + slots.fill(null) cannot silently eat
# materials. Assert it is really there, and supply the message only when the
# source runtime has not already incorporated it.
core = OUT / 'runtime/BP/scripts/core/machines.js'
t = core.read_text(encoding='utf-8')
assert "UNEQUAL_INGREDIENT_COUNTS" in t, 'lid guard missing from the patched core'
bed = OUT / 'runtime/BP/scripts/bedrock/machines.js'
t = bed.read_text(encoding='utf-8')
if 'UNEQUAL_INGREDIENT_COUNTS' not in t:
    assert t.count('const CN={') == 1
    t = t.replace('const CN={', "const CN={UNEQUAL_INGREDIENT_COUNTS:'\u5404\u7a2e\u539f\u6599\u6578\u91cf\u5fc5\u9808\u76f8\u540c\uff1b\u8acb\u7a7a\u624b\u53d6\u56de\u5f8c\u91cd\u65b0\u6295\u6599\u3002',", 1)
    bed.write_text(t, encoding='utf-8')
print('lid guard and message asserted')

# The 1.20+ shapeless painting recipes also need unlock data; gate on the first
# concrete ingredient.
for p in sorted(recipes.glob('*.json')):
    j = json.loads(p.read_text(encoding='utf-8'))
    r = j.get('minecraft:recipe_shapeless')
    if r is None or 'unlock' in r: continue
    items = [i.get('item') for i in r.get('ingredients', []) if isinstance(i, dict) and i.get('item')]
    assert items, p.name
    r['unlock'] = [{'item': items[0]}]
    p.write_text(json.dumps(j, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    added.append((p.name, items[0]))

# Creative catalog group names must carry a namespace (schema rejects bare keys).
cat = OUT / 'runtime/BP/item_catalog/crafting_item_catalog.json'
if cat.exists():
    j = json.loads(cat.read_text(encoding='utf-8'))
    fixed_catalog = 0
    for c in j['minecraft:crafting_items_catalog']['categories']:
        for g in c.get('groups', []):
            name = g.get('group_identifier', {}).get('name', '')
            if ':' not in name:
                parts = name.replace('item_group.', '').replace('.name', '').split('.')
                ns = parts[0] if parts else 'kaleidoscope_tavern'
                g['group_identifier']['name'] = ns + ':' + ('_'.join(parts[1:]) or 'tavern')
                fixed_catalog += 1
    cat.write_text(json.dumps(j, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('catalog group names namespaced:', fixed_catalog)

m = OUT / 'runtime/BP/scripts/main.js'
t = m.read_text(encoding='utf-8')
assert t.count("build:'C6 / 0.6.0'") == 1, 'diagnostic build string drifted'
t = t.replace("build:'C6 / 0.6.0'", "build:'C6 / 0.6.5-server'")
old_banner = "console.warn('[Tavern C6] Cookery guide chapter and Tavern extension v1 initialized. Development build: engine/visual acceptance required.');"
assert t.count(old_banner) == 1, 'init banner drifted'
t = t.replace(old_banner, "console.warn('[Tavern C6] Cookery guide chapter and Tavern extension v1 initialized. Server edition 0.6.5.');")
m.write_text(t, encoding='utf-8')

bp = json.loads((OUT / 'runtime/BP/manifest.json').read_text(encoding='utf-8'))
rp = json.loads((OUT / 'runtime/RP/manifest.json').read_text(encoding='utf-8'))
assert bp['header']['version'] == [0, 6, 5] and rp['header']['version'] == [0, 6, 5]
assert all(mm['version'] == [0, 6, 5] for mm in bp['modules'] + rp['modules'])
assert next(d for d in bp['dependencies'] if 'uuid' in d)['version'] == [0, 6, 5]
print('upstream', head)
print('unlock added:', len(added), '| fences tag fixed:', fixed)
print('OK server edition 0.6.5 ->', OUT)
