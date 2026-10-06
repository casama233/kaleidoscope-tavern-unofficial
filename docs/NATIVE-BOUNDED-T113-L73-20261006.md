# T113/L73 bounded native placement and custom HUD observations

Recorded 2026-10-06 at 13:17:13 UTC on the actual Bedrock 1.26.52.3
x86_64 Linux cloud-native client, using the standard Noor skin in Survival.
Only Tavern 0.6.113 and World Liquor 0.1.73 were active, with Liquor above
Tavern. No diagnostic pack, observer or shake sampler was active. These are
bounded actual-client observations, not simulated-player tests or full-family
acceptance.

## Exact runtime checkpoints

- Tavern source: `3a25d23a9643bad4883892ca0cf7221261b535f2`
- Tavern archive SHA256: `61aecaa062258dc567b76a726c06d8814e5a57b17350be893cfe3f0c7ba0b58c`
- World Liquor source: `12738347abaeda25759b8fa0ffeb868f97331783`
- World Liquor archive SHA256: `879d836dafe05943057af2f0078984b7eaba5cb234b20045f8e6acdda9db64c2`

The installation receipt binds those public source checkpoints and exact
archives to the isolated two-pack test installation. This document changes no
runtime, archive, release history or dependency pin. Liquor's Tavern source pin
remains the tested runtime checkpoint; documentation commits do not require
pair-pin churn.

## Observed results

- Two separate 100 ms Shift/right-click empty-glass placements, releasing
  sneak between them, each placed one glass. The stack changed 16 to 15 to 14;
  no cancellation message was observed in those attempts.
- Actual Bloody Mary consumption produced the rose custom-effect icon, which
  remained visible in sampled settled frames.
- Actual Gin Tonic consumption returned an empty glass and produced its red
  continuous-heal icon. Consuming a second Bloody Mary while Gin Tonic was
  active showed both custom icons together.
- The Gin Tonic icon disappeared on natural expiration while the Bloody Mary
  rose remained. Exact effect duration in ticks was not instrumented.
- Actual milk consumption cleared the rose by the settled screenshot. The
  first immediate frame still showed it, so no exact cleanup-latency claim is
  made.
- Around the World was actually consumed and multiple native effects,
  including blindness, were observed. Milk cleared the observed native
  effects and the custom Bloody Mary icon. This does not comprehensively
  verify the cocktail's effect semantics.

## Sampled screenshot identities

The eight screenshots were inspected. Only their filenames and SHA256
identities are recorded here; no world, user data, machine paths or private
installation receipt is published.

- `t113_placement.jpg`: `2c26a61a786b8a7d4b6fc5a9403a4fc6d4a29bdb3c4efef1fd8fe2d139d5ba81`
- `t113_placement_repeat.jpg`: `1bddc84555cf5bda7c3e0065a585a48d737659193b83013a79ea9459a824a70d`
- `t113_bloody_hud_settled.jpg`: `b493b2921e382abbda641ca36c5c75acbdc13984310f2a46b3cf9c8e603557fb`
- `l73_gin_hud_settled.jpg`: `c23f50ac450d626c1d38f2c741fdd9b65afe7b42242c5d0958dd45a2408583ba`
- `pair_combined_hud_settled.jpg`: `f86a836ec71904bf81990000131e35d67e1c678334ddf47dc6d29b32b7d74d01`
- `t113_l73_milk.jpg`: `29824d1afbd461129de627d1797d9983e89276709cd969e870b547e29e4f5165`
- `pair_gin_expiry.jpg`: `a9edd099b86a940b860389903ddee718d1edb3bdb05817a1b5e336a0909a1f52`
- `pair_final_milk_settled.jpg`: `abaf8dcdabede54d66ca835500852034dc057565b107d1781af3e2d89a22f56a`

## Limits and unchanged gates

This establishes only the listed placements and sampled custom-icon flows.
It does not establish all 48/80 effect icons, every-frame flicker freedom,
mobile/network behavior, exact timing, microtipsy camera behavior, audio,
Highball flight, complete Java parity or full-family pack-order deployment
and saved-world migration. No audio device was available. Full client
acceptance and production readiness remain pending.

The missing current BSM Java-upstream status still blocks merge, release and
deployment. This evidence neither substitutes for that status nor relaxes the
branch-specific upstream review, full-family native loading/restart,
saved-world rehearsal or canonical/BSM admission requirements. PR #200 remains
a draft; no live deployment or release is performed.
