# Synchronous instant health/harm prototype

This dispatcher is prepared as canonical T0.6.122, based on merged T0.6.121.
Scoped Native observations below supplement the earlier T120 phase evidence.
Remote CI, family saved-world gates and deployment are separate; no real
Player or rendered client acceptance is claimed.

Source scope is Tavern NeoForge **1.2.0 / Minecraft 1.21.1**, author file
[8350856](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-tavern/files/8350856).
`DrinkBlockItem:150`, `CocktailBlockItem:96` and
`SignatureCocktailBlockItem:52` pass the drinker as direct source, indirect source
and target, with intensity 1.0. They call instantaneous effects directly before
continuing the source entry loop and returning the container.

The common dispatcher covers vanilla instant health/harm from bottles, ordinary
registered addon cocktails and signature cocktails. Source `HealOrHarmMobEffect`
selects heal/hurt using its harm flag and `LivingEntity.isInvertedHealAndHarm`.
The latter reads the Java `INVERTED_HEALING_AND_HARM` entity-type tag, whose default
expansion includes skeleton/zombie variants and horses, bogged, zoglin, phantom
and wither. `vanilla-instant-entities.js` has explicit 1.21.1 counterparts and
Native aliases, including zombie_pigman, zombie_villager_v2, villager_v2,
evocation_illager and tropicalfish. It does not infer this Java tag from a Native
undead family or treat an unknown identifier as a normal living actor. Newer
Minecraft entities and arbitrary addon classes need a declaration.

`javaInstantOperation` preserves the source operation separately from amount:
Java signed 32-bit `(4 or 6) << amplifier`, double multiplication and `+0.5`,
double-to-int narrowing, and int-to-float conversion. Shift distances wrap modulo
32. Overflow may produce negative amounts; that does not change heal into hurt.
The instantaneous method differs from the timed tick method's nonnegative heal
clamp. The helper implements saturating `d2i` and NaN-to-zero rather than using
JavaScript rounding or powers of two. The projectile signed-delta path remained
a separate gap at T122; the T132 extension below replaces that runtime path.

Heal calls process the explicitly declared heal rule, then obtain fresh readable
health attributes. In the NeoForge 1.21.1 maintained branch,
[the LivingEntity patch](https://raw.githubusercontent.com/neoforged/NeoForge/1.21.1/patches/net/minecraft/world/entity/LivingEntity.java.patch)
invokes the heal hook before its amount/positive-health gates;
[EventHooks](https://raw.githubusercontent.com/neoforged/NeoForge/1.21.1/src/main/java/net/neoforged/neoforge/event/EventHooks.java)
allows cancellation or a changed amount. The prototype supports only declared
passthrough, cancellation, sequential float multiply/add, or unknown rules.
Thus a zero raw amount can still be changed by a declared hook. It does not
pretend that a health setter invokes arbitrary Java/Native heal callbacks or
synchronous cross-pack executable code. Nonpositive post-hook amounts do not
heal, zero-health actors are not resurrected, and positive heals use source float
addition and the freshly read Native effective maximum/minimum. Native health
attribute equivalence is still an adaptation requirement.

For hurt, author self-source means Java `indirectMagic(self,self)`. Native uses
`applyDamage(amount,{cause:magic,damagingEntity:self})`; it does not subtract HP
itself. This preserves the available causing actor but the stable
[damage API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityapplydamageoptions?view=minecraft-bedrock-stable)
cannot select a Java damage-type Holder. Java indirect_magic bypasses armor but
not Resistance, Protection, absorption or hurt cooldown. It is not in the
NO_KNOCKBACK tag, while plain magic is. Native tags, hurt frames, class-specific
hurt overrides, knockback, kill credit and modifier/event phases therefore need
affected-path evidence. ArmorStand's baseline source hurt rejects this damage
type, so it has a specific reject policy. EnderDragon's body/phase path remains
unknown rather than a guessed generic Native hit. Neither fact excludes their
separate heal branch. Nonpositive hurt amounts still attempt the declared hurt
policy/API; source zero/negative hurt hooks and animations remain unverified.

## T132: splash delivery and source potion policy

`storage-projectile.js` now invokes the same dispatcher for instant health/harm.
It retains the actual impact intensity, direct-hit potency and resolved latch.
Source selection and operation no longer come from a Native undead family or
the sign of a computed delta. Damage maps to Native magic with the available
owner, or with no attacker when ownerless. `sourceMapping=magic_owner_only`
explicitly records that the stable API does not also represent the direct
projectile under a chosen magic cause. It does not certify Java damage tags,
knockback or final damage after all event cancellations.

The potion gate is independent of class, heal inversion and the drink entry.
`captureInstantSplashPolicy` snapshots it once before each target's full row
loop. Known source nonliving/immune targets reject all rows, including timed
and custom effects. An earlier row killing the target does not recapture this
gate or suppress the remaining source row calls. Healing still runs its
declared hook before its own positive-health gate and does not resurrect.

The optional profile field `affectedByPotions` accepts `false`, `true` or
`"alive"`. In the maintained NeoForge 1.21.1 policy, vanilla living targets use
`"alive"`, while ArmorStand uses false. An explicitly constant custom override
can use true or false. Existing schema-1 profiles lacking the field still load
and work for drinking; their instant splash policy is unknown until the same
owner updates it. Unknown custom timed/custom recipients retain the earlier
Native family adapter; this compatibility boundary is not complete Java class
or override parity.

The two source branches actually differ. Read-only bytecode from the official
[1.20.1 metadata](https://piston-meta.mojang.com/v1/packages/760a390e336b2b6202ec5906757cee3a929a7c85/1.20.1.json)
and [1.21.1 metadata](https://piston-meta.mojang.com/v1/packages/cedfc3b6dcbca34e2b478d498bf1d56a8fa2f404/1.21.1.json)
was checked against Mojang's SHA-1. The client JAR hashes are respectively
`0c3ec587af28e5a785c0b4a7b8a30f9a8f78f838` and
`30c73b1c5da787909b2f73340419fdf13b9def88`; the 1.21.1 mappings hash is
`2244b6f072256667bcd9a73df124d6c58de77992`. The 1.20.1 LivingEntity `ft`
returns true, whereas 1.21.1 LivingEntity `btn.fC` (source line 3401) tests
`!isDeadOrDying`. ArmorStand returns false in both. In 1.21.1,
`cob.applySplash` (133–166) evaluates that gate before the row loop and passes
the projectile, owner, target, amplifier and intensity to the instant call.
No original JAR is distributed in this repository. These source observations
do not imply that the Forge and NeoForge policies are identical.

The current zero-player paired observer exercises real native entities,
rolled Carignan healing, a saved declared zero-amount hook, ArmorStand immunity,
owned/ownerless damage events and cancellation. The impact envelope is an
explicit observer input, not an observed physical collision or Player use.
Its exact engine/source and first/restart results belong to the current CI.

## Reachable addon declarations

After world load, a producer sends the Server script event
`kaleidoscope_tavern:declare_instant_entity_profile` with JSON such as:

```json
{
  "schema": 1,
  "owner": "example_addon",
  "revision": "1.0.0",
  "type": "example_addon:undead_actor",
  "sourceType": "example_addon:undead_actor",
  "living": true,
  "affectedByPotions": "alive",
  "inverted": true,
  "healHook": {"mode": "passthrough"},
  "damagePolicy": "native"
}
```

`healHook.mode` may be passthrough, cancel, unknown, or scale_add with finite
float `multiply` and `add`. `damagePolicy` may be native, reject or unknown. The
source facts are declared by the producer, not proven merely by accepting JSON.
The rules describe the pinned source operation; they do not import another
Minecraft branch or arbitrary mutable mod hooks. More complex/current per-actor
hook state needs an explicit future adapter and remains unknown.

The actual `main.js` installer subscribes to this event. It requires Server
origin without entity/block/initiator, strict keys/types and a 4096-byte message.
At most 128 profiles and 30000 UTF-8 bytes are persisted in this pack's world
dynamic property. A type has one declared owner; another owner's overwrite is
rejected rather than silently composing incompatible source rules. Producers can
revise their own profile. Malformed persisted data stays unknown and cannot
silently restore vanilla defaults. Registration returns
`kaleidoscope_tavern:instant_entity_profile_result` with owner/type/revision and
accepted/reason. Producers must wait for a received acceptance before relying on
the declaration. Publication failure does not undo a persisted record or emit a
false rejection. No registration path reads world properties in early execution.

Unknown or rejected rows retain a bounded internal diagnostic, continue the next
source entry and settle the captured drink once. They never queue a one-tick
instant fallback, replay granted effects, reroll the whole cocktail, or add HUD
text. Existing Java nextFloat thresholds, per-entry draw/dispatch and post-effect
container/mode handling remain in place. Timed effects, Saturation and other
instant identities are outside this pair-specific prototype.

## Evidence still required

The committed T120 observations prove only that Native cow instant tags execute
next tick and direct magic damage/health writes can execute immediately. They do
not prove this prototype's self-attributed damage pipeline. New scoped Native
checks must cover source actor fields and velocity, normal/undead inversion,
armor/durability and Protection, Resistance, partially consumed absorption,
same-tick hurt cooldown, and health_boost/Resistance immediately before the
instant row. Higher-amplifier/nonpositive API behavior also needs evidence.
Real-player lethal drinks, totems, Creative rules and death/drop aliases still
require client comparison. A direct API test cannot be called complete Java
event, audio, death or addon-hook equivalence.

The focused tests use actual production callbacks/API-shaped fixtures and
independent Java numeric reference values. They are not simulated players,
Native BDS observations or rendered-client acceptance. No Mojang/author JAR,
private script, credential, world or machine log is redistributed.

## Native observations, 2026-10-08

The actual four-module dispatcher was exercised in independent fresh worlds
with the coherent T121/G101/W88 family. No players or simulated players were
used. Fifteen usable health/source cases from the second run are retained;
that run terminated before its final equipment case because of an unloaded
scene location, and is not relabelled successful. The third run only covers
the missing equipment scenes plus a lethal totem case. Its three cases passed.
The initial observer used an incorrect Cow20 scene maximum; that failed scene
is retained and the valid Cow10 source cases supersede it.

Observed synchronous heal/harm, Cow/Skeleton inversion, maximum clamping,
same-tick Resistance and Health Boost, absorption, repeated/larger same-tick
hurt cooldown, later cancellation and lethal health0 match the scoped source
health expectations. Magic reports self as its causing actor. Negative/zero
hurt returns false without changing health; Java nonpositive hurt hook, hurt
frame and animation equivalence is not established.

Native Piglins were equipped through a scoped QA loot command because their
script equippable component is unavailable. Diamond armor does not reduce
the six-point magic hurt; Protection IV reduces it to5.04. Independent stopped
QA NBT confirms the diamond chestplate, Protection IV and unchanged durability0.
The lethal24-point case consumes a held totem and synchronously leaves health1.
These are real mob observations, not Player armor/Creative/PvP or client proof.

Important remaining boundaries: the stable applyDamage return value is true
even for later cancellation or a same-tick repeat with no new hurt callback.
APPLIED_NATIVE_INSTANT describes API dispatch, not proof of accepted damage.
Native afterHurt/death callbacks occur after the caller returns, though health
already changes before return. Velocity observations show no horizontal magic
knockback; Java indirect_magic knockback, exact event/hook stages, arbitrary
custom classes, executable heal hooks and the captured-hand death-drop alias
remain unresolved. This release must not be described as complete Java parity.
