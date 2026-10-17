# Stable author adaptation and collision repair — 2026-10-16

Candidate: Tavern 0.6.173, Grilling 2.8.150, World Liquor 0.1.151 and private integration 1.0.45. Source/CI admission and the stopped-save rehearsal precede LIVE installation. This source document does not assert that installation or human acceptance has completed.

| Author package | Reviewed stable source | Treatment |
| --- | --- | --- |
| Cookery | 1.6.1 / CurseForge file 9123386 | Public family API 0.2.11, exact private hooks and new author identities |
| ChineseFood | 1.0.5 / 9123382 | Retain reviewed repairs; paired local identity 1.0.10545 |
| Nether | 1.0.2 / 9123379 | New author identities and furniture state conversion |
| End | 1.0.2 / 9123371 | New author identities |
| Java Saturation | 1.6 / 9071891 | Build local 1.6.10045 from the complete clean author input; preserve admitted HUD/scheduling repairs |

ImmersiveEating 1.1.0 remains current. Existing Essentials, Farmer's Delight and Ribbits maintenance variants retain their admitted repairs and identities. A larger local version is not a newer author release. Farmer's Delight Plus is a different project and is not substituted. Marketplace products without a verifiable version feed remain explicitly unverified for latest-version status. BDS 1.26.52.3 is the stable target; preview channels and new experiments are excluded.

The Java source checks restore the barrel edge cuts, grill height, four-facing rack depth and its aim/touch intersections. World Liquor restores freezer, seven cups, sixteen three-part stool collisions and ten cabinet safe boxes. [Tavern source proof](evidence/barrel-collision-20261016.md), [Grilling source proof](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/evidence/collision-shapes-20261016.md), [World Liquor source proof](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/main/docs/evidence/collision-shapes-20261016.md).

The four author upgrades replace eight pack identities. The canonical migration declaration binds every old admitted manifest, author archive, new pair and all 28 changed block definitions. Four BP dynamic-property owners move together. Chair/table carpet color and presence become the author's base-nine slot/bank encoding; basin oil preserves 0–32 through base-eleven encoding. Chopping-board empty/builtin/extension modes convert to 0/1/2–3 from the old presence and slot pair; removing the presence flag alone would lose that meaning. Food model indices, cutting stage, extension recovery and stored item NBT remain intact. Both versions have identical builtin recipe/index mappings and extension recovery functions; stored JSON contains no retired permutation state to replay. Conflicting typed properties, mixed schemas, truncation and unknown storage encodings fail closed.

Offline conversion changes only reviewed NBT roots. Palette indices/order, other storage layers, unrelated database keys/values and unmodified NBT roots remain byte exact. The same stopped-save copy supplies both native first start and restart, comparing every affected position's typed states and original player/container metadata. Bounded console probes load existing chunks and check their states; no players or test gameplay modules are installed. The persistent palette codec follows [Prismarine's implementation](https://github.com/PrismarineJS/prismarine-chunk/blob/master/src/bedrock/1.3/SubChunk.js) and the [zero-bit persistent-storage implementation](https://docs.rs/crate/bedrock-world/0.3.5/source/src/chunk.rs).

Stable Saturation's clean HUD still contains global native-alpha overrides. The compiler retains the admitted removal/selective-carrier repair. Its final gameplay/UI/asset bytes equal the existing repaired local version; the new identity records the complete latest author source, not an invented new gameplay feature.

Targeted source/data regression checks precede canonical PR CI. This candidate retains `client=false`, `production_ready=false` and pending human acceptance. BDS/source success cannot verify rendered HUD, audio/animation alignment, physical contact feel, touch precision or actual high-latency recovery. The original missing shaker-progress report and earlier failures are not relabeled as passed.

The initial frozen T171/W149 candidates retained stale internal version labels and were not deployed. Their original frozen hashes and the failed W149 CI remain recorded. T173/W151 use fresh identities with matching manifests, modules, dependencies, payload labels and release-history entries.

T172/W150 also remained undeployed: the old diagnostic BUILD_VERSION was exposed by package/peer CI, and shallow CI checkout lacked the fixed collision predecessor. T173/W151 include the diagnostic identity and a bounded pre-freeze check of all existing identity guards; the history lookup fetches fixed sources and remains repository-bound. P44 successful source CI retains its original T172/W150 pairing; new P45 source/main proof is required for this final family.
