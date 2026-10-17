/** Frozen predecessor pages remain exact; no game API or player substitutions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GUIDE_PAGES} from '../runtime/BP/scripts/data/guide-pages.js';
import {MIXOLOGY_PAGES} from '../runtime/BP/scripts/data/mixology-pages.js';

test('all legacy page bytes match the unmodified T149 projection',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/legacy-guide-pages-t149.json',import.meta.url)));
 assert.equal(fixture.source_release,'0.6.149');
 assert.deepEqual({GUIDE_PAGES,MIXOLOGY_PAGES},fixture.pages);
 assert.equal(JSON.stringify({GUIDE_PAGES,MIXOLOGY_PAGES}),JSON.stringify(fixture.pages));
});
