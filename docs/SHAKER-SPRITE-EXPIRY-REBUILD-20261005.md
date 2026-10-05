# Shaker sprite expiry rebuild

This draft starts from canonical Tavern 0.6.95, commit
`efae0c4cfdcf67309744dce42dd2eb350d5eff05`. It reconstructs the lost progress
expiry behavior; it does not claim to recover the original unpublished commit.

## Repair

The factory packet previously kept its parent alpha at 1 and relied exclusively
on `destroy_at_end` to remove its images. Every owned slot image, progress bar and
cursor now starts its own 0.5-second wait followed by a 0.1-second linear fade to
zero. The non-looping terminal alpha stays zero even if parent destruction is
not sufficient. Existing 0.6-second parent cleanup remains a secondary cleanup.
The wait covers the current 10-tick periodic slot refresh. Progress packets,
held-item models, cup entities and all gameplay mechanics are unchanged. Idle
handling still never writes an empty/off Actionbar or clears another addon's UI.

The wait-to-alpha chain follows Mojang's native `anim_chat_txt_wait` /
`anim_chat_txt_alpha` pattern in the repository's pinned
[Bedrock HUD reference](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/hud_screen.json).
The original [Java ShakerOverlay](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/gui/overlay/ShakerOverlay.java)
only renders progress while the shaker is actively being used. Finite local
expiry is the Bedrock packet fallback for returning to that idle state.

## Validation and release boundary

The new `tools/shaker-hud-expiry.test.mjs` checks the full concrete/inherited image
set, refresh coverage, terminal zero-alpha chain and protocol isolation. Its
numeric alpha samples are structural animation regressions, not native renderer
or simulated-player tests.

This branch is the source-backed 0.6.100 draft candidate, with a new paired
manifest/diagnostic/guide identity and append-only frozen lock/history. It does
not publish a release/archive or deploy to a server. Combined integration must
allocate another new identity and pass canonical release/family gates. Rendered client acceptance remains pending: check normal
hold/release, repeated starts, interrupted use, switching held items, target
changes and foreign Actionbar coexistence, and confirm the placed cup remains
visible while progress stays absent after release.
