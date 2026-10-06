# Native title-capture probe

This is an opt-in, private-world diagnostic RP, not a production repair or release.
It contains no BP, script, automatic title sender, or gameplay changes. Canonical
Tavern 0.6.107 runtime and its frozen archives remain untouched.

## Preserved negative evidence

- Exact Tavern 0.6.106 / World Liquor 0.1.67: normal Mystery drinking produced an
  active Slightly Tipsy status; guide details confirmed icons enabled, but no
  custom icon rendered
- Positive-duration exact formatting title produced native title background;
  adding X produced native X, still without a custom icon
- Exact cold-loaded Tavern 0.6.107 / World Liquor 0.1.68, with explicit sibling
  lookup on every image: normal Mystery drinking still produced no icon
- Native diagnosis at 2026-10-06 01:14:23 UTC reported statusTicks 3271,
  optedOut false, adapterTracked true, attempts 329, lastSkip null and lastError
  null. This proves status/adapter tracking, not camera rendering or icon capture

The sibling flag was therefore insufficient. No duration or rendering fix is
claimed. Formatting-prefix precision, global binding, and visibility-change
capture are isolated together below.

## Build after committing the diagnostic source

Run from the repository root:

    python3 tools/diagnostics/test_effect_capture_probe.py
    python3 tools/diagnostics/build_effect_capture_probe.py --out-dir /absolute/new/output

The builder requires the exact frozen 107 HUD SHA256
00bad600debd3f2491aa9942304f9f2437d5a6a04428a6dff4ed8f5bbbbf680d.
It refuses a different HUD and an existing output archive. Both diagnostic UUIDs
are derived from the committed source identity, builder hash, original HUD
hash, sprite bytes and asset-license bytes. Rebuilding identical inputs is deterministic. A different committed source
gets a new diagnostic pack identity. The output report contains every file hash. The builder refuses inputs whose
bytes do not match the committed tree, including the builder itself, original
HUD, sprite and mandatory asset license. Run the committed tools/diagnostics copy only.

The probe preserves the entire frozen Tavern HUD and appends one probe mount.
Namespaced, fully typed probe definitions are registered separately. No vanilla
control is replaced, and the real Tavern/Liquor panel remains available. The
original Tipsy sprite is copied into a probe-owned texture path with its asset
license. This RP must be highest priority, above the exact Tavern/Liquor pair;
otherwise another HUD override may hide the diagnostic mount.

## Display

At upper right, below native top icons:

- `Capture probe: MOUNT OK` and its unconditional Tipsy sprite verify the
  diagnostic mount and basic sprite rendering separately
- Six rows show LIVE and CACHE gate acceptance (`Y` or `-`). CACHE evaluates
  that row's predicate against stored text, not merely whether it is populated
- A small Tipsy sprite appears next to Y only when the accepted text also contains
  the exact Tipsy slot token
- `raw:` binds the current global title directly; X or KTEF: can make it readable

Rows:

1. `fmt slice12`: original precision predicate, 12 JavaScript code units
2. `fmt slice18`: alternate precision predicate, 18 UTF-8 bytes
3. `fmt contains`: full formatting-prefix substring, no precision assumption
4. `fmt exact`: whole exact Mystery-only packet, no precision assumption
5. `ascii slice5`: ASCII `KTEF:` prefix, independent calibration
6. `any nonempty`: trivial global-binding/caching calibration

LIVE controls read the global title directly. Each CACHE control has its own
visibility_changed data latch and explicit sibling lookup. Matching cache values
remain after unrelated titles or title expiry; these intentionally persist for
observation. A cached Y is not the current title's acceptance. No countdown or
application state is changed by this pack.

## Bounded native sequence

1. Normally save and close Minecraft. Verify the probe archive and all report
   hashes, then activate it above the exact 107/68 pair in a private test world
2. Cold-load. Confirm MOUNT OK before changing title state, and capture a screenshot
   If the marker is absent, stop: priority/mount/load is not established
3. Establish no active custom effects first (complete milk use if needed and
   inspect the guide snapshot) before the final cold load. If effects were active
   at join, clear them, save/quit and cold-load again, because milk does not clear
   the exact-packet latch. Record initial rows and confirm no row token
   sprite; a scoped empty-formatting header can legitimately show a gate Y
   without a token sprite. Mystery must then be the only custom effect, so its
   fixed code6 token occupies slot0. Drink Mystery normally with icons enabled
   and the original zero-duration transport. Record all six LIVE/CACHE rows after about one second. This must
   precede positive synthetic titles, which otherwise prime the diagnostic caches
4. Use positive-duration formatting packet plus X to observe the global binding:

    /title @s times 0 200 0
    /titleraw @s title {"rawtext":[{"text":"\u00a7r\u00a7d\u00a7e\u00a7a\u00a7d\u00a7r\u00a70\u00a70\u00a70\u00a76\u00a7rX"}]}

   Close chat, wait about one second, record all rows plus native X/raw X
5. Send an unrelated title, close chat, record LIVE changes and retained CACHE:

    /titleraw @s title {"rawtext":[{"text":"FOREIGN"}]}

6. Calibrate ASCII prefix with the same token:

    /titleraw @s title {"rawtext":[{"text":"KTEF:\u00a70\u00a70\u00a70\u00a76\u00a7rX"}]}

7. Exercise whole-packet matching without X:

    /titleraw @s title {"rawtext":[{"text":"\u00a7r\u00a7d\u00a7e\u00a7a\u00a7d\u00a7r\u00a70\u00a70\u00a70\u00a76\u00a7r"}]}

8. Preserve screenshots, content logs, pack identities and exact input sequence
   Normally save/quit and deactivate this diagnostic RP before ordinary play

Interpretation:

- Only slice18 accepts formatting: evidence favors byte-precision mismatch
- Only slice12 accepts formatting: precision12 matches this BMP prefix; this
  does not distinguish characters from UTF-16 units generally. Investigate the
  original cache/mount next
- Contains/exact work, both slices fail: formatting precision remains the fault
  boundary, without asserting a specific precision unit
- ASCII/nonempty work but all formatting gates fail: inspect formatting
  preservation or normalization in the global title binding
- LIVE works but corresponding CACHE does not: latch/scope is the fault boundary
- Positive title works but the earlier fresh normal zero-duration pass does not:
  zero-duration observation/delivery is implicated, without proving duration
  is the sole cause; do not turn on a persistent
  production title without a reviewed tradeoff
- MOUNT OK works but even nonempty/raw fail on visible X: global-binding/context
  availability needs inspection

These are observations to distinguish, not simulated native test results. The
structural tests do not evaluate Bedrock expressions or prove native rendering.

Primary pattern reference: pinned Mojang v1.26.50.4 HUD
https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/hud_screen.json
