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

All T134 limits remain: pure camera roll, true through-wall outlines, whole-player
renderer hiding/target clearing, native multiline editing, three arbitrary
decorated nonstackable shaker inputs, dropped-shaker display contexts, native
reach/step-height/XP pickup and incomplete effect/event semantics including Luck.
Actual input, sound, RGB/outline/particle rendering, animation synchronization
and standard/Vibrant Visuals comparisons still require human client acceptance.
The private complete-family/BSM checkpoint and LIVE world remain unavailable;
their rehearsal, deployment and readback are pending under the unchanged standing
authorization. A passing tool or earlier peer CI does not certify those outcomes.
