/** Asset-only resolver. Does not import @minecraft/server or change a world/inventory. */
export class AssetInterfaceError extends Error {
  constructor(code, message, details = {}) {
    super(message); this.name = 'AssetInterfaceError'; this.code = code; this.details = details;
  }
}
const fail = (code, message, details) => { throw new AssetInterfaceError(code, message, details); };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function clone(value) {
  try { return JSON.parse(JSON.stringify(value)); }
  catch { return fail('INVALID_REGISTRY', 'Registry must be serializable JSON'); }
}
function requireRecord(value, label) {
  if (!record(value)) fail('INVALID_ARGUMENT', `${label} must be an object`);
}

export function createAssetRegistry(input) {
  requireRecord(input, 'Registry');
  if (input.schema_version !== 1 || !Array.isArray(input.visuals) || !Array.isArray(input.icons) || !Array.isArray(input.families))
    fail('INVALID_REGISTRY', 'Expected schema_version=1, visuals, icons and families');
  const data = freeze(clone(input));
  const visuals = new Map(), icons = new Map(), byId = new Map(), families = new Map();
  for (const row of data.visuals) {
    if (!record(row) || typeof row.key !== 'string' || !record(row.binding) || typeof row.binding.id !== 'string')
      fail('INVALID_REGISTRY', 'Invalid visual record');
    if (visuals.has(row.key) || byId.has(row.binding.id)) fail('DUPLICATE_BINDING', `Duplicate visual: ${row.key}`);
    visuals.set(row.key, row); byId.set(row.binding.id, row);
  }
  for (const row of data.icons) {
    if (!record(row) || typeof row.key !== 'string' || typeof row.id !== 'string') fail('INVALID_REGISTRY', 'Invalid icon record');
    if (icons.has(row.key) || byId.has(row.id)) fail('DUPLICATE_BINDING', `Duplicate icon: ${row.key}`);
    icons.set(row.key, row); byId.set(row.id, row);
  }
  for (const family of data.families) {
    if (!record(family) || typeof family.family !== 'string' || !record(family.fields) || !Array.isArray(family.variants))
      fail('INVALID_REGISTRY', 'Invalid family contract');
    if (families.has(family.family)) fail('DUPLICATE_BINDING', `Duplicate family: ${family.family}`);
    const seen = new Set();
    for (const variant of family.variants) {
      requireRecord(variant.when, 'Variant state');
      if (!visuals.has(variant.asset)) fail('MISSING_ASSET', `Family ${family.family} references ${variant.asset}`);
      const stateKey = JSON.stringify(Object.keys(variant.when).sort().map(k => [k, variant.when[k]]));
      if (seen.has(stateKey)) fail('DUPLICATE_BINDING', `Ambiguous state: ${family.family}`);
      seen.add(stateKey);
    }
    families.set(family.family, family);
  }
  function getVisual(key) {
    if (typeof key !== 'string' || !visuals.has(key)) fail('NOT_PORTED', `No visual bound: ${String(key)}`);
    return visuals.get(key);
  }
  function getIcon(key) {
    if (typeof key !== 'string' || !icons.has(key)) fail('NOT_PORTED', `No icon bound: ${String(key)}`);
    return icons.get(key);
  }
  function selectVisual(request) {
    requireRecord(request, 'Request');
    if (Object.keys(request).some(k => !['family', 'state'].includes(k))) fail('INVALID_STATE', 'Unexpected request field');
    const family = families.get(request.family);
    if (!family) fail('NOT_PORTED', `No visual family: ${String(request.family)}`);
    const state = request.state ?? {};
    requireRecord(state, 'State');
    for (const key of Object.keys(state)) {
      if (!Object.hasOwn(family.fields, key)) fail('INVALID_STATE', `Unexpected state ${key} for ${family.family}`);
    }
    for (const [key, field] of Object.entries(family.fields)) {
      if (!Object.hasOwn(state, key)) fail('INVALID_STATE', `Missing state ${key}`);
      const value = state[key];
      if (field.type === 'integer') {
        if (!Number.isSafeInteger(value) || value < field.minimum || value > field.maximum)
          fail('INVALID_STATE', `Out-of-range integer ${key}`, { value });
      } else if (typeof value !== 'string' || !field.enum.includes(value)) {
        fail('INVALID_STATE', `Unsupported ${key}`, { value, allowed: field.enum });
      }
    }
    const match = family.variants.find(v => Object.entries(v.when).every(([k, val]) => state[k] === val));
    if (!match) fail('NOT_PORTED', 'This state combination has no converted visual');
    return getVisual(match.asset);
  }
  function blockVisual(key, context = 'world') {
    const asset = getVisual(key);
    if (asset.binding.kind !== 'block') fail('WRONG_BINDING_KIND', `${key} is an entity fixture, not a block`);
    if (!['world', 'inventory'].includes(context)) fail('UNIMPLEMENTED_CONTEXT', `No exported display binding: ${context}`);
    if (context === 'inventory') {
      if (!asset.binding.item_visual) fail('UNIMPLEMENTED_CONTEXT', `No explicit item visual: ${key}`);
      return freeze({ 'minecraft:item_visual': clone(asset.binding.item_visual) });
    }
    return freeze({ 'minecraft:geometry': clone(asset.binding.geometry), 'minecraft:material_instances': clone(asset.binding.materials) });
  }
  return Object.freeze({
    getVisual, getIcon, selectVisual, blockVisual,
    getByFixtureId(id) {
      if (!byId.has(id)) fail('NOT_PORTED', `Unknown fixture ID: ${String(id)}`);
      return byId.get(id);
    },
    listVisuals() { return data.visuals; },
    listIcons() { return data.icons; },
    listFamilies() { return data.families; },
    catalog(locale = 'zh_TW') {
      if (!['zh_TW', 'zh_CN', 'en_US'].includes(locale)) fail('UNSUPPORTED_LOCALE', 'Unsupported catalog locale');
      return freeze(data.visuals.map(row => ({ key: row.key, name: row.labels[locale], fixtureId: row.binding.id,
        geometry: row.geometry.file, editor: row.editor_file, recipes: [], engineAccepted: false })));
    }
  });
}

/** Resolve only IDs inspected from a supplied Cookery archive. No private-script API access. */
export function resolveCookeryItem(alias, mapping, lock) {
  if (!record(lock) || lock.status !== 'archive-inspected-not-engine-tested' || !record(lock.behavior))
    fail('DEPENDENCY_UNBOUND', 'No inspected Cookery archive identity is bound');
  if (!record(mapping) || mapping.schema_version !== 1 || !record(mapping.items))
    fail('INVALID_ARGUMENT', 'Expected item-map schema_version=1');
  if (typeof alias !== 'string' || !Object.hasOwn(mapping.items, alias)) fail('UNMAPPED_EXTERNAL_ID', `No verified Cookery mapping: ${String(alias)}`);
  const id = mapping.items[alias];
  const known = [...(lock.behavior.identifiers?.items ?? []), ...(lock.behavior.identifiers?.blocks ?? [])];
  if (typeof id !== 'string' || !known.includes(id)) fail('UNVERIFIED_EXTERNAL_ID', `ID was not registered by the inspected pack: ${String(id)}`);
  return id;
}
