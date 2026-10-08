# 0.6.125 — selected author 1.0.1 improvements

Keep this maintained Tavern and its saved identities. Addon liquids can now
provide their own barrel and pressing-tub surfaces instead of borrowing a built-in
grape/water rig. Machine display helpers reject damage and potion effects.

Reviewed source: Loyallay's [Bedrock Tavern 1.0.1, CF9075867](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-tavern-unoffical/files/9075867),
published 2026-10-06. Official archive SHA1
`a760513a25d0f89026ead9afe80cbdaf51c13d98` was verified at download.
This is an independent adaptation of the exposed contract and behavior, not an
import of the complete author scripts. Existing Java gameplay remains authoritative.

## Optional addon contract

API 1 advertises `external_fluid_visuals`. Existing `custom_fluids` and `rigSuffix`
registrations work unchanged. A fluid may supply:

```js
{ id: 'your_addon:tea', filled: 'your_addon:tea_bucket',
  title: { en_US: 'Tea' },
  visuals: { barrel: 'your_addon:tea_surface',
             pressing_tub: 'your_addon:press_surface' } }
```

Each visual identifier must belong to the registering source namespace. Only
`barrel` and `pressing_tub` are accepted. The addon supplies its own entity,
client entity, geometry and textures. Define integer, client-synchronized entity
property `kt_art:amount`, range 0–4000 for barrel or 0–1000 for pressing tub.
Use a persistent, stationary, noncolliding visual entity. The host positions it
at machine origin +(0.5, 0, 0.5), updates amount and owns its lifecycle. An omitted
machine kind uses `rigSuffix` when supplied, otherwise has no liquid surface.
The optional API changes no built-in fluid, recipe, quantity or timing.

The host persists its own marker and machine anchor on spawned visuals. It cleans
them when liquid empties, the barrel closes, a registered visual changes or the
machine is removed. Entity-load orphan cleanup includes these addon-owned visuals.
Only known built-in helpers or explicitly marked machine visuals receive damage/
effect immunity; unrelated entities with `kt:anchor` remain untouched. No new
polling task, server configuration or required companion pack is introduced.

## Review decisions and remaining differences

| Author 1.0.1 change | Maintained host decision |
| --- | --- |
| External liquid visuals | Adapted to existing atomic registry and saved ownership |
| Helper combat/effect immunity | Adapted with narrower ownership checks |
| External 1–16 quality profiles | Not implemented in this release; existing six-grade contract remains explicit |
| Cellar cabinet east/west rotation | Not copied: conflicts with current pinned Java PoseStack matrix; current-source/client comparison still required |
| Grape/ladder state consolidation | Not copied: our block identities/state adapters differ; needs separate migration review |
| Placeable-drink guard and guide changes | Existing Java use-order routing and independent seven-section guide retained |

Targeted source regression calls the actual registry, visual synchronizer and
subscribed event callbacks, covering foreign namespace rejection without registry
mutation, amount updates, close/reopen, replacement, cleanup and foreign-entity
isolation. Required remote CI, complete family BDS and stopped-save rehearsal are
separate deployment gates. No simulated players. These checks do not certify
rendering, actual client interactions or complete Java parity.

Client scene: open and close an ordinary filled barrel; throw a splash potion near
its display and an adjacent mob (mob should still receive effects). In an addon
using the contract above, compare empty/1000/4000 mB, reopen, remove the machine,
then reconnect. Check for a single correctly positioned surface and no leftovers.
Tavern-only worlds must continue showing their original built-in liquid surfaces.
