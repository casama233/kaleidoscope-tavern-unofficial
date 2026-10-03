# Private native Tipsy observer

This is optional diagnostic source outside `runtime/`. It is not imported by
canonical `main.js`, exported in the canonical pack, or automatically armed.
No runtime, manifest, release identity, frozen history, shaker, inventory or
effect implementation is changed by this diagnostic commit. Root controls the
private same-UUID staging BP import and real-client actions. Keep all native
console output and recordings private; do not commit or attach them to GitHub.

## Private staging installation

Copy `examples/diagnostics/tipsy-observer.js` into **only the private candidate**
at `BP/scripts/diagnostics/tipsy-observer.js`. Its only static dependency is the
existing `@minecraft/server`; the canonical read functions are injected.

Add these imports to the private candidate's `scripts/main.js`:

```js
import {installTipsyObserver} from './diagnostics/tipsy-observer.js';
import {statusNow as obsStatusNow} from './bedrock/custom-effects.js';
import {activeStatus as obsActiveStatus} from './core/custom-effects.js';
import {tipsyVisualState as obsTipsyState} from './bedrock/tipsy-visual.js';
```

After the existing canonical installer calls, including `installCustomEffects()`,
add this private-only call (do not call the canonical installer a second time):

```js
installTipsyObserver({
  statusNow:obsStatusNow,
  activeStatus:obsActiveStatus,
  tipsyVisualState:obsTipsyState
});
```

This order leaves the existing Milk clear subscriber registered before the
observer. Preserve root's candidate UUIDs and version/cache controls. No native
diagnostic success or new release/freeze is claimed by this source.

## Real-player procedure

From the actual player, explicitly arm one 90-second session:

```mcfunction
scriptevent kaleidoscope_tavern:tipsy_observe start 90
```

Then really consume `kaleidoscope_tavern:vodka_q4`. The observer does not provide
items, add effects or complete use. Capture the private console lines for
`vodka_complete` and `vodka_plus2`. Repeat the actual Milk interaction while
Tipsy is still active, then capture `milk_complete`, `milk_plus2` and
`milk_plus7`. In a separate armed drink session, allow natural expiry and capture
`expiry_seen`, `expiry_plus2` and `expiry_plus7`.

Stop early with the same player's command:

```mcfunction
scriptevent kaleidoscope_tavern:tipsy_observe stop
```

`start` defaults to 90 seconds; `start N` accepts integer 1–90. A restart closes
that player's prior session. Window expiry, departure, invalid handles, event
overload and line budget terminate observation. At most four player sessions
are retained, with one shared tick updater only while sessions exist. A session
has at most 120 ordinary/error-fragment lines plus its two stop lines. There is
no world-wide player enumeration, persistent property or data file writing.

## Evidence fields and limits

Each `[KTObs]` line is short and identifies only an anonymous session number.

* `e`: start, complete-use, delayed observation, sampled state or stop.
* `t`: actual console observation tick; `rT`: tick of the reported read. Stop
  lines may carry the last snapshot, so do not treat a different `rT` as a fresh
  read. `dt` is ticks since this session started.
* `rem`/`amp`: strongest canonical Tipsy entry from `activeStatus(statusNow(p))`.
* `track`/`n`/`tr`/`skip`/`err`: actual `tipsyVisualState(p,status)` tracker,
  attempt count, current transport, skip reason and error presence. `last` keeps
  the last observed active transport when current tracking has disappeared.
* `due`/`lag`: scheduled tick and actual lateness of a delayed record. A label
  such as `milk_plus2` certifies the second tick only when `t=due`, `rT=t` and
  `lag=0`; a late callback is explicitly marked rather than accepted as exact.

For root's Milk acceptance, require an observed active transport before Milk,
then `milk_plus2` at the exact second tick with `rem=0`, `track=0`, `err=0`.
Natural `expiry_seen` can precede the same-tick camera updater; `expiry_plus2`
and `expiry_plus7` establish the later read-only state. An early clear is not
mislabelled as natural expiry. The observer does not enforce these outcomes or
repair a failed clear; it records the actual result.

A failed read prints unknown remaining/tracking values, not fabricated zeroes.
Changed errors are split into short `[KTObsErr]` fragments, capped at 144
characters total. No player name/entity ID or complete JSON/stack dump is logged.

This establishes status/tracker timing on the native server clock. It does not
measure screen motion, delivery latency or rendered residual duration. The
last submitted shake's maximum 0.25-second duration is a separate source/API
bound; root must still visually assess its natural expiry and preservation of
foreign shake. The observer never clears/stops any camera or effects.

## Source tests

```sh
node --loader ./tools/efficiency/mock-loader.mjs --test tools/tipsy-observer.test.mjs
```

Tests drive actual canonical read/drink/clear modules with API dependency
doubles. Fixture setup is explicitly separate from the observer. They cover
inert installation, explicit player arming, exact Milk+2, natural expiry+2/+7,
late callbacks, no mutation, unknown-on-read-error, bounded shutdown and absence
from canonical `main.js`. They are not SimulatedPlayer, native BDS, use or client
acceptance evidence.
