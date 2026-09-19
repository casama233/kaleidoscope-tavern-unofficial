import { readFile } from 'node:fs/promises';
import { createAssetRegistry } from './index.mjs';
const raw = JSON.parse(await readFile(new URL('../interfaces/asset-registry.json', import.meta.url), 'utf8'));
const api = createAssetRegistry(raw);
const sofa = api.selectVisual({family: 'sofa', state: {color: 'blue', shape: 'left_corner'}});
console.log(JSON.stringify({fixtureId: sofa.binding.id, worldBinding: api.blockVisual(sofa.key),
  engineAccepted: sofa.engine_accepted, gameplayConnected: sofa.runtime_connected}, null, 2));
