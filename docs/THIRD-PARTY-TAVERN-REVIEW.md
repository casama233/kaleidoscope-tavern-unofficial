# Loyallay Tavern 1.0.1: published-package review

Reviewed 2026-10-08 against our `d295390e1023ec0a8f38c82ebbfd1ddc1eacb509` repair base. This is a read-only inspection of the actual published add-on, not a client playtest. No third-party runtime source or assets are incorporated by this review.

## Provenance and notices

| Field | Verified value |
| --- | --- |
| Publisher | Loyallay |
| Project | [Kaleidoscope Tavern — Unofficial Bedrock Edition Port](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-tavern-unoffical), project 1718691 |
| Inspected release | [Kaleidoscope Tavern v1.0.1.mcaddon](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-tavern-unoffical/files/9075867), file 9075867, uploaded 2026-10-06 |
| Public download | [CurseForge CDN archive](https://mediafilez.forgecdn.net/files/9075/867/Kaleidoscope%20Tavern%20v1.0.1.mcaddon) |
| Archive identity | 6,026,965 bytes; SHA-256 `0e5bff97a1a2626e7ec153c262323966d080beeb2eee5d033b3f0206bbd6e325` |
| Package manifests | BP/RP version `[1,0,1]`, minimum engine `[1,26,1]`; `@minecraft/server` 2.7.0 and `@minecraft/server-ui` 2.0.0 |
| Website license label | [CC BY 4.0](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-tavern-unoffical/license) |
| Included notices | Both packs' `license.txt:11–39` retain upstream BSD 3-Clause code terms; `:41–64` identify original/adapted Tavern resources as CC BY-NC-SA 4.0; fonts retain separate notices. `CREDITS.txt:7` and `ATTRIBUTION.txt` identify casama233 and Tavern port contributors as earlier implementation/reference. |

The website's general license label should not be treated as replacing the more specific bundled resource/font notices. Our changes use our own implementation and upstream/Mojang references; copying this package is unnecessary. The temporary archive and extracted files are outside the Git worktree.

Paths below are relative to the archive's `Kaleidoscope Tavern v1.0.1 [BP]` or `[RP]` directory.

## Useful designs to consider

| Design | Actual implementation evidence | What we can use |
| --- | --- | --- |
| Adjustable presentation | `BP/scripts/core/tavern-guidebook.js:252–284` offers particle density, sound level and detailed-feedback controls. `BP/scripts/utils/accessibility.js:6–39` persists choices and calculates 0.5/1/1.5 multipliers. | Offer optional presentation controls while retaining original defaults. Apply sound preferences to the receiving player; shared world effects need a separate design. |
| Explicit guide language choice | `BP/scripts/core/tavern-guidebook.js:26–52,286–304` stores the selected guide language with English fallback. The RP contains 29 `.lang` tables. | Make language/settings discoverable and preserve fallback behavior. File coverage does not prove translation accuracy; our existing language flow should be extended rather than replaced. |
| Scoped placement preference | `BP/scripts/utils/gameplay-settings.js:22–32` checks the `placeable_drink` item tag before applying an optional sneak-to-place preference. | Keep any future interaction preference explicitly scoped to Tavern drinks, with Java-compatible default behavior. Do not globally intercept unrelated blocks. |

There is a significant implementation caveat in the presentation preferences: `accessibility.js:40–64` uses the first player returned by `dimension.getPlayers()` for dimension-wide sounds/particles. This does not establish the nearest player and does not give each observer independent settings. We should absorb the option design, not that world-effect routing.

### Adopted: personal shaker volume

Our repair independently implements the useful settings design in
`runtime/BP/scripts/core/presentation-settings.js` and the existing standalone
guide settings popup. No author source or assets were copied. The original seven
content roots and guide entrances remain; the existing language button now opens
language and volume settings with the same three languages and three sound
levels: less/normal/more, scaling by 0.5/1/1.5. Normal is the unchanged default,
including when a stored sound value is absent, unknown or unreadable.

Only the owner's `.local` shaker and completion sound calls in
`runtime/BP/scripts/bedrock/immersion.js` apply the multiplier. Observer volume,
pitch, location, audible radius and world sounds retain their original arguments.
This uses the existing recipient-specific routing; Microsoft documents
[Player.playSound](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable#playsound)
and [PlayerSoundOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playersoundoptions?view=minecraft-bedrock-stable).

Saving snapshots both raw preferences, validates both selections and confirms
both writes by reading them back. A failed/unacknowledged save attempts to restore
both original values, including absent or legacy values; an unconfirmed rollback
is explicitly reported. Cancel, close and a response from an expired guide
session write nothing. `tools/presentation-settings.test.mjs` and the focused
settings/navigation coverage in `tools/standalone-guide.test.mjs` verify these
branches and the actual sound-adapter call arguments (50 combined tests). These
are script/SDK-call regressions, not client audibility or rendered-form tests.

## Cocktail and shaker comparison

| Area | Published-package mechanism | Consequence for our repair |
| --- | --- | --- |
| Recipe completion | `BP/scripts/bedrock/mixology.js:170–227,425–430` records the start tick, finishes on release and automatically completes after tick 110. | No newly demonstrated solution to the timing/recognition issues under repair. Retain the Java-derived logic and our newer item-metadata preservation. |
| Portable shaker tooltip | `BP/scripts/bedrock/mixology.js:66–71` rebuilds the item and writes generic gray ingredient/result names. `resultItem:73–80` attaches signature payload/color but no effect lore. | Does not solve our effect-description or exact ingredient-tooltip gaps. Our dedicated tooltip work remains necessary. |
| HUD | `BP/scripts/bedrock/shaker-screen.js:98–110` sends a title texture index every tick. `:83–91,119–130,137–150` sends an off title and clears Actionbar on exit. `RP/ui/hud_screen.json` uses fixed cursor positions and overrides title visibility. | Does not provide smooth interpolation. Keep our readable Actionbar transport, owned finite sprite expiry and title/foreign-HUD isolation. |
| Ingredient insertion animation | `BP/scripts/bedrock/immersion.js:15–19` resets the placed shaker's visual state and plays the empty-bottle sound. | This path does not implement the original lid/PUT animation. Preserve our existing source-derived animation. |
| Held animation | `BP/scripts/bedrock/immersion.js:30–34` calls player animations; the RP includes shaker attachable/controller files. | Resource presence and animation calls do not prove player rendering. No client result was inferred from this package. Our native hand/socket work remains the baseline. |
| Inventory icons | `BP/items/mystery_cocktail.json` and `depth_charge.json` select `kt_c3_*` atlas keys. Both resolved PNGs in `RP/textures/items/family/` are static 16×16 images. None of the 16 `flipbook_textures.json` tiles intersects the item atlas. | The author does not provide a demonstrated animated native inventory-icon route. Do not restore the old custom hand rigs or point native icons at unsupported animation expressions. |
| Vision/reach/step/stealth | `BP/scripts/bedrock/custom-effects.js:102–116,124–161,330–366` still uses invisibility, routed item-use reach, attempted `glowing`, and teleport-based stepping. `BP/scripts/core/custom-effects.js:4–15,52,75–88` identifies those adapters. | These do not close the Java engine differences. They are not evidence that `glowing` or native reach/step attributes became available. |
| Experience attraction | `BP/scripts/bedrock/custom-effects.js:463–477` moves the existing XP orb while preserving native pickup/value. | Sound principle, already present in our adapter; no guessed XP grant or new parity advantage. |

## Native platform boundary and validation

Microsoft's [item icon component](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_icon?view=minecraft-bedrock-stable) documents item-atlas keys and texture variants, not a frame-expression property. The [animated block texture guide](https://learn.microsoft.com/en-us/minecraft/creator/documents/createanimatedblocktexture?view=minecraft-bedrock-stable) describes terrain flipbooks. Mojang's [native JSON UI animations](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/progress_screen.json) support UI flipbooks, but that is a different rendering surface from a native inventory item. Neither this published package nor the inspected official interfaces establishes a supported native animated-item route that preserves our normal hand/use behavior.

Completed checks: public release metadata, archive size/hash and safe ZIP extraction; manifest/notices read; targeted static tracing of the files above; two resolved icon dimensions; item-atlas/flipbook intersection. No author code was executed. No Bedrock Dedicated Server or player client was started. GUI scale, frame pacing, sound audibility, handheld views and UI conflicts still require actual client acceptance.
