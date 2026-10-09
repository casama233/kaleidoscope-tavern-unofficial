# Tavern 0.6.135 / World Liquor 0.1.112

T135 retains the complete [T134 ingredient, transaction, visual and immersion
scope](RELEASE-NOTES-0.6.134.md), including final PR297 source, the reviewed
PR298 coordinate-order repair and W110's author Dassai/cocktail updates.
World Liquor W112 now pairs with the exact T135 dependency; optional Grilling
remains G119. This document records only the new corrections and their evidence.

## Corrections from the real T134 CI run

[T134 PR302](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/302)
and [CI run 37869770416](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37869770416)
retain the failed result. Two failures exposed missing runtime support:

- **PBR companions:** add a texture set for each of the 24 ice-grape tick PNGs
  and the signature `rgb_opaque` surface. The existing canonical profiles remain
  `[0, 0, 215]` for ice grapes and `[0, 0, 170]` for the signature surface.
  Both source generators now reproduce these files. PNG, geometry, shader and
  audit rules are unchanged by this repair.
- **Native Adventure-list IDs:** native getters can return vanilla block names
  without the `minecraft:` prefix. Validation accepts their vanilla-qualified
  interpretation while preserving the original strings and list order. Existing
  metadata bounds, bidirectional native reconstruction checks and rejection before
  debit remain in place.

The Ardent failure was a test-fixture omission: the double lacked `getEffect`
with a real remaining duration. That fixture now implements the method; the
production behavior and existing assertions are unchanged.

These runtime changes receive the new T135/W112 identities. T134 release notes,
source witnesses, frozen identity, history and failed CI evidence remain intact.
W111 CI succeeded for its own candidate; that success is not transferred to the
new pairing.

## Verification and remaining acceptance

The focused visual audit and both affected generator checks pass. A single run
of the complete `tools/check_visuals.py` file also passes its later assertions:
460 material surfaces, 35 emissive surfaces, zero material errors, the expected
dyed-icon alpha coverage, 1,727 keys in each of three locales and 3,601 Tipsy rule
samples. This is static resource/rule evidence; its report explicitly records
no client, BDS or simulated-Player test for this revision. The native setter/getter
format portable regression and all 13 existing Ardent fixture cases pass separately.
Final T135/W112 canonical CI, paired native first/restart evidence and archive
verification are pending for the exact final source commits.

The first T135 [canonical run 37871245685](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37871245685)
passed 12 jobs, including package, audit, foundation and both visual source
checks. Its isolated native inventory save/restart also passed. The complete
paired observer then rejected its second ingredient, `minecraft:sugar`, with
`NOT_SHAKER_INGREDIENT`: sugar is not an accepted original cocktail ingredient.
The observer now uses three accepted stackable plum-wine inputs, retaining
distinct names and lore, Adventure lists, bidirectional native equality,
independent-clone and normal-restart assertions. No production recipe, runtime
bytes, frozen version, archive hash or acceptance check is changed. This corrects
the observer's input; it does not count the unfinished portable, machine or aura
scenes as passed. Those scenes still require the corrected canonical run.

Review of the still-unreached observer scenes also found two fixture issues.
Absent durability, enchantment and potion components now use explicit `null`
in the machine snapshot, so its persisted canonical text is valid JSON for the
restart reader; every metadata/count comparison remains intact. A two-block-high
perimeter keeps the saved aura wolf on its existing elevated platform while its
native AI and effects continue normally. The observer does not teleport it,
reapply its effect or manufacture an appearance lease after restart. These are
observer-only corrections; they do not alter packaged gameplay or certify the
scenes before the corrected native run completes.

The next [run 37872094738](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37872094738)
completed the three-input portable native-equality/independent-clone case and
both native machine writes (tub `[11]`, barrel `[3,5,1,1]`, schema 2). It then
stopped before applying the aura effect because the wolf's corner chunk was not
loaded and ticking. The entire enclosed aura scene is now translated into the
loaded `(-1,-1)` chunk, still outside Vision's range; all lifecycle assertions
remain unchanged. No paired restart is credited to that failed run.

Machine observations now retain event `kind: case` and identify the device with
`machineKind`. The evidence recorder validates the complete closed set of
phase-specific cases and their asserted fields, binds report observations to
the original log JSON, and keeps exact source/overlay file-set and byte checks.
CI runs its focused rejection cases before BDS and records new evidence only
after both native phases succeed. New files live in the disposable run directory
and refuse overwrites; the original dated native evidence remains unchanged.

The paired W112 [run 37871248554](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/37871248554)
passed all four jobs against T135 peer `10453aea0fedc4d054562239d9c31daf138c24a9`.
It verified the exact W112 archive and the combined 1,343-model allocation with
zero errors. This is package/source evidence and does not replace the pending
native paired scenes or human client acceptance.

All T134 limits remain: pure camera roll, true through-wall outlines, whole-player
renderer hiding/target clearing, native multiline editing, three arbitrary
decorated nonstackable shaker inputs, dropped-shaker display contexts, native
reach/step-height/XP pickup and incomplete effect/event semantics including Luck.
Actual input, sound, RGB/outline/particle rendering, animation synchronization
and standard/Vibrant Visuals comparisons still require human client acceptance.
The private complete-family/BSM checkpoint and LIVE world remain unavailable;
their rehearsal, deployment and readback are pending under the unchanged standing
authorization. A passing tool or earlier peer CI does not certify those outcomes.
