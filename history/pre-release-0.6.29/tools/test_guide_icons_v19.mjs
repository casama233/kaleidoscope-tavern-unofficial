import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');
const bp = path.join(root, 'runtime/BP');
const rp = path.join(root, 'runtime/RP');
const dataDir = path.join(bp, 'scripts/data');
const { BUILTIN_RECIPES } = await import(pathToFileURL(path.join(dataDir, 'recipes.js')));
const { SHAKER_RECIPES } = await import(pathToFileURL(path.join(dataDir, 'mixology.js')));
const { EFFECT_PAGES } = await import(pathToFileURL(path.join(dataDir, 'effect-pages.js')));
const atlas = JSON.parse(fs.readFileSync(path.join(rp, 'textures/item_texture.json'), 'utf8')).texture_data;
const itemIcons = {};
for (const file of fs.readdirSync(path.join(bp, 'items')).filter(x => x.endsWith('.json'))) {
  const item = JSON.parse(fs.readFileSync(path.join(bp, 'items', file), 'utf8'))['minecraft:item'];
  const raw = item.components?.['minecraft:icon'];
  const key = typeof raw === 'string' ? raw : raw?.texture ?? raw?.default?.texture;
  const value = atlas[key]?.textures;
  if (item.description?.identifier && typeof value === 'string' && fs.existsSync(path.join(rp, `${value}.png`))) {
    itemIcons[item.description.identifier] = value;
  }
}
assert.ok(Object.keys(itemIcons).length > 0, 'runtime item icons should resolve through the actual RP atlas');

const sourcePath = path.join(dataDir, 'cookery-guide-payload.js');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.replace('import { EFFECT_PAGES } from "./effect-pages.js";', `const EFFECT_PAGES=${JSON.stringify(EFFECT_PAGES)};`);
source = source.replace('const GUIDE_ITEM_ICONS={};', `const GUIDE_ITEM_ICONS=${JSON.stringify(itemIcons)};`);
assert.ok(!source.includes('import '), 'test projection should not depend on an un-injected module');
const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const recipes = [...BUILTIN_RECIPES, ...SHAKER_RECIPES];
const registry = {
  list: () => [{ source: 'kaleidoscope_tavern' }],
  allPages: () => EFFECT_PAGES,
  allRecipes: () => recipes,
};
const payload = module.buildCookeryGuidePayload(registry);
for (const node of [...payload.categories, ...payload.entries]) {
  assert.ok(node.icon, `GUI node has icon: ${node.id ?? node.labelKey}`);
  assert.ok(fs.existsSync(path.join(rp, `${node.icon}.png`)), `GUI icon has a packaged texture: ${node.icon}`);
}
const byId = new Map(payload.entries.map(entry => [entry.id, entry]));
let barrel = 0, shaker = 0, pressing = 0, effects = 0;
for (const recipe of recipes) {
  const entry = byId.get(recipe.id);
  assert.ok(entry, `recipe entry missing: ${recipe.id}`);
  let expectedItem;
  if (recipe.kind === 'barrel') { expectedItem = recipe.output.byQuality?.[0] ?? recipe.output.item; barrel++; }
  else if (recipe.kind === 'shaker') { expectedItem = recipe.output.item; shaker++; }
  else if (recipe.kind === 'pressing') { expectedItem = `kaleidoscope_tavern:${recipe.id.split('/').at(-1)}`; pressing++; }
  assert.equal(entry.icon, itemIcons[expectedItem], `${recipe.id} must use its actual output/bucket item icon (${expectedItem})`);
  assert.ok(fs.existsSync(path.join(rp, `${entry.icon}.png`)), `missing recipe icon asset: ${entry.icon}`);
}
for (const page of EFFECT_PAGES) {
  const entry = byId.get(page.id);
  const linked = recipes.find(recipe => recipe.id === page.recipeIds?.[0]);
  const slug = page.id.split('/').at(-1);
  const output = linked?.output?.byQuality?.[0] ?? linked?.output?.item ?? `kaleidoscope_tavern:${slug}_q1`;
  assert.equal(entry?.icon, itemIcons[output], `${page.id} must use the corresponding quality drink icon (${output})`);
  assert.ok(fs.existsSync(path.join(rp, `${entry.icon}.png`)), `missing effect icon asset: ${entry.icon}`);
  effects++;
}
const refine = fs.readFileSync(path.join(repo, 'refine_guides.py'), 'utf8');
assert.ok(refine.includes('GUIDE_ITEM_ICONS={};') && refine.includes('item_icons[ident] = path'), 'build generator must inject icons resolved from BP definitions and RP atlas');
console.log(`PASS: ${barrel} barrel recipes, ${shaker} cocktails, ${pressing} juice recipes, ${effects} drink-effect pages use matching runtime item icons`);
