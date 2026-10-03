# EXPERIMENT FAILED: subtitle-only effect icons

**PR171 / source `73d66fcb` failed native cold initialization. Do not merge or
deploy this experiment.** Root will revert the integrated experiment to the
camera/lifecycle implementation plus the verified `c643225f` dimension repair.
The experimental source branch remains for evidence, not as the accepted path.

Root fully closed and relaunched licensed Android Bedrock 1.26.52.3, then
completed an actual `mystery_cocktail` before issuing any title command. Two
later observations showed no custom icon despite active canonical Tipsy,
`camera_api` tracking and no reported script error. World Liquor's private
candidate had the paired subtitle cache overlay, so this is not a stale addon
title binding result. A deliberate diagnostic title then made the icon appear
for the first time, along with an empty dark subtitle-background rectangle.

This supports subtitle data being retained until title activation in the tested
client; it does not expose the engine's internal binding-update mechanism.
The source/packet tests below passed but did not model this native dependency
or background artifact. Those passes cannot override the native failure.
Title priming, a title fallback and perpetual keepalive are explicitly rejected.

Root's licensed Android Bedrock 1.26.52.3 test confirms the `c643225f` dimension
repair: active Tipsy icons persist after Nether travel and return to Overworld.
That repair is retained. A separate native test fails foreign-title coexistence:
with a requested 60-second title already visible, actual Milk correctly clears
Tipsy and its icon, but the foreign title also disappears early. A no-Tipsy,
no-Milk control retains its title after twenty seconds. Private raw logs,
recordings, screenshots and world data are not attached.

## Source cause and limits of the preceding title implementation

The standalone adapter sends every owned icon change/clear through
`setTitle(packet, {fadeInDuration:0, fadeOutDuration:0, stayDuration:0})`.
This replaces title text and its timing; formatting-only content does not create
a private title channel. The UI's strict prefix cache protects icon ownership
from foreign packets, but cannot protect a native title from the server setter.
Removing the zero duration alone still replaces the foreign title's text.
The existing optional queue serializes participating packets through title writes;
it cannot save an arbitrary `/title` command that bypasses that queue.

The official [ScreenDisplay API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable)
has no title text/time/owner getter. Its subtitle-update API is documented for
previously displayed subtitle data, so this candidate does not prime it with
an owned title. Instead it uses the documented
[`titleraw` subtitle location](https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/titleraw?view=minecraft-bedrock-stable):

```text
titleraw @s subtitle {"rawtext":[{"text":"<validated formatting snapshot>"}]}
```

The command targets the executing player and sends no title, times, reset,
clear or Actionbar command. A command rejection is reported without a title
fallback. Current icons do not enter either optional title router. Observing
router availability/election remains diagnostic-only and never joins elections.

The host icon cache reads `#hud_subtitle_text_string`, retaining the same strict
prefix and duplicate-marker rejection. The binding name exists in the
[pinned Mojang HUD source](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/hud_screen.json).
Only the effect cache bindings/expression change in the host HUD; native title
and subtitle renderers, root controls, shaker controls, animations and sprites
remain unchanged. Snapshot cadence, lifecycle cancellation and `c643` bounded
dimension replay are unchanged.

**Rejected experiment:** a successful subtitle command did not update the
fresh client's custom HUD before a title appeared in root's native test.
There is no title priming or persistent keepalive if it does not. Native title
text/lifetime preservation must be remeasured. Subtitle data is itself shared:
this candidate can replace a foreign subtitle when an icon snapshot changes.
It cannot claim general foreign-subtitle coexistence or full display ownership.
Native blank-subtitle/background behavior must also be checked.

## Experimental World Liquor overlay scope — not an accepted migration

This branch does not edit World Liquor or root's unpushed `.58` integration.
The private paired addon panel followed this experiment through a targeted
canonical edit of `runtime/RP/ui/kt_world_liquor_effects.json`:

1. Inside `effect_panel.controls[0].kwl_effect_data.bindings`, change the two
   `binding_name` values from `#hud_title_text_string` to
   `#hud_subtitle_text_string`.
2. In that cache's `source_property_name` prefix expression, replace only the
   `#hud_title_text_string` references with `#hud_subtitle_text_string`.

Retain all controls, slot codes, sprite paths, the `#kwl_effect_packet` override,
`always_when_visible`, namespace, registration and optional-panel selection.
The host's existing `--world-liquor` generator now emits these subtitle bindings,
but do not run it over an unreviewed addon integration: root should apply only
the named cache edit or review the exact generator diff first. Without that edit,
the addon panel listens to the obsolete title channel; its icons are not certified.

## Source verification and historical candidate test steps

Source regressions assert the emitted subtitle opcode/JSON, zero title/Actionbar
writes or queue routes, current-status Milk clearing, rejection/exception without
fallback, and unchanged bounded dimension lifecycle. These are API/display
doubles, not a simulated native title timer or renderer. Pinned root preservation
and authored generator checks remain required. The deployed-stack audit now
rejects an addon cache still using title bindings and reports native title and
foreign-subtitle acceptance as untested; third-party router execution is labeled
reference-only.

The updated focused HUD suites pass 22/22; the combined immersion/effect-bar/HUD
suites pass 53 tests with one paired World Liquor source case skipped because
`LIQUOR_SOURCE` is unavailable. The authored generator `--check`, shaker HUD
compatibility, four UI contract tests and pinned Mojang root preservation pass
(29 controls, zero root redefinitions). The deployed-stack audit is not run by
this worker because no authorized local stack inventory was supplied. Full
release/hash admission remains blocked on root's integrated freeze/preimages;
this candidate changes exported BP/RP content and has no release identity bump.

The candidate originally proposed these private acceptance steps. Cold
initialization already failed; the sequence is retained as provenance, not as
an instruction to deploy or repeat the rejected design:

1. Fresh entry before any `/title`: complete a real long drink and verify the
   icon appears without an activation title or visible subtitle glyph/background.
2. While active, set `times 0 1200 0`, then show the same foreign title. Complete
   actual Milk. Verify the icon clears while the title remains for its original
   remaining lifetime, without being restarted or extended. Compare its expiry
   with a no-drink control.
3. Show the foreign title first, then drink; also test natural Tipsy expiry and
   the icon visibility toggle. Verify each event preserves title text/lifetime.
4. Repeat Nether/return while active, and repeat with existing queue addons.
5. Test a foreign subtitle explicitly and record the expected shared-subtitle
   limitation; do not convert a title-only pass into a general coexistence pass.

If cold initialization or title preservation fails, reject this candidate and
retain the honest engine limitation; do not fall back to overwriting titles.
Signed Java roll remains NOT_RESTORED.

## Conclusion and feasible next work

The currently investigated stable Script API and pinned JSON UI do not provide
an established, independent, script-fed icon channel that satisfies cold
initialization while preserving arbitrary native title/subtitle writers. This
is a limit of the verified paths, not a proof about every possible engine or
future API. The pinned native title control is factory-created and reads the
global title/subtitle strings; its authored JSON does not specify an alternate
server-to-client custom-packet admission mechanism. The ScreenDisplay API has
no getter to recover an unknown native title's text, remaining time or owner.

* Retain Tipsy camera/lifecycle and `c643` dimension recovery. Its existing
  automatic standalone icons still have the reproduced title coexistence limit;
  this is not a complete Java-parity or universal UI coexistence pass.
* For a future configuration that requires strict native-title preservation,
  disable automatic icon transport from session initialization and keep the
  existing explicitly opened effect-details form. The current personal hide
  toggle can send a final scoped clear when an active view is hidden, so it must
  not be described as an instantaneous safe switch during a foreign title.
* A cooperative UI arbiter can coordinate known addon title intents and declared
  lifetimes, with finite suspension/re-admission of icons. It requires all
  participating writers to use the protocol; arbitrary `/title` or external
  writers remain unsupported. Existing title-writing queues alone do not solve
  the failure, and another shared channel must not be called a complete fix.
* A future independent client channel requires a concrete supported interface
  and cold/native acceptance before implementation is presented as usable.
  No such interface has been established in this task.

No runtime, native UI control, hash gate, release identity or World Liquor
canonical source is changed by this rejection checkpoint. Raw private evidence
remains outside Git.
