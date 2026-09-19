import {system} from '@minecraft/server';
import {registerTavernExtension} from './sdk/tavern-extension-client.js';
import {payload} from './payload.js';
export const registration=registerTavernExtension(system,payload);
