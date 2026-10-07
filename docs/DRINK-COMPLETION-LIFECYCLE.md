# Drinking completion: effects before container settlement

Source scope: Tavern NeoForge **1.2.0 / Minecraft 1.21.1**, author file
[8350856](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-tavern/files/8350856).
This repair does not import mechanics from the separate Minecraft 26.1.2 branch.

`DrinkBlockItem.finishUsingItem` (source lines 117–126) and
`CocktailBlockItem.finishUsingItem` (68–77) add effects before testing the
player's current Creative state, shrinking the original stack, and returning
the container. `SignatureCocktailBlockItem.addDrinkEffect` (45–58) likewise
rolls and dispatches each entry immediately. `IHasContainer.returnContainerToEntity`
(33–44) returns a new container when the original stack is empty; otherwise it
gives the player a container while returning the original stack.

Mojang 1.21.1 `LivingEntity.completeUsingItem` (original source lines 3266–3284)
checks the use-stack reference before calling `finishUsingItem`, then writes a
different returned stack to the logical interaction hand. There is no second
hand-reference check after the item's effects. `Player.setItemSlot` (1923–1931)
writes MAINHAND through the **current** inventory selection. Consequently, when
an effect changes selection during completion, the last Survival drink shrinks
the original slot and the returned container replaces the currently selected
mainhand. Stacked drinks return the original stack, so they do not replace that
new mainhand. Normal client selection changes before completion cancel use;
they are a different case from mutation inside completion.

The production callbacks now capture the completed use stack and its original
slot, reject an observably mismatched completion entry before any random draw,
effect, or cure, dispatch all source entries, and then obtain the current game
mode and a fresh inventory. Juice's Poison cure also precedes settlement. The
entry guard uses the readable comparison described below; the stable API cannot
prove Java's reference equality. The rules are:

- Creative gives a container into the fresh inventory without debiting or
  requiring the original slot to survive the effects.
- The last Survival drink debits its captured origin and returns the container
  to the current logical mainhand. Existing containers elsewhere do not redirect
  this return.
- Stacked Survival debits its captured origin and inserts the container using
  current compatible stacks and free slots. Insertion consumes the source's two
  pickup-sound random draws **after** effect draws and dispatches. Direct last-item
  hand returns and fully overflowed drops do not consume those two draws.
- Overflow uses the existing shared drop adapter (player y + 0.5, initial
  vertical velocity 0.2, and a 40-tick pickup guard). Its timer base and native
  item merge/ownership behavior remain platform differences.
- A changed amount, changed observable metadata, or missing original use stack
  is explicitly unresolved for Survival. The code does not search other same-ID
  items or nearby drops, overwrite a guessed stack, restore a pre-effect bag,
  or replay effects. A zero-health player with a still available intact original
  stack is not excluded merely because health is zero.

The readable comparison includes names, raw lore, dynamic properties,
CanDestroy/CanPlaceOn lists, item locking and keep-on-death flags, durability,
enchantments, and dye color. Native `isStackableWith` is used for stackable items
with a separate amount check. It includes custom data but returns false for
nonstackable items, which require the readable comparison. This establishes
observable metadata equality, **not native object identity**. See the primary
[ItemStack API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable).

The SDK returns copies: [ContainerSlot.getItem](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/containerslot?view=minecraft-bedrock-stable)
explicitly creates an exact copy, and [Container.getItem](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container?view=minecraft-bedrock-stable)
does not return a reference to the slot. The
[completion event](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcompleteuseevent?view=minecraft-bedrock-stable)
does not promise the Java local-stack alias. Java can keep that alias when death
moves the stack into a dropped ItemEntity and subsequently shrink it. The stable
API exposes no corresponding transferable native alias. Hidden native fields
and replacement by an observably identical stack also cannot be distinguished.
Those death/drop and identity cases remain unimplemented, rather than a claimed
source-faithful fallback.

All effect identities use the same effect-first dispatch path; dangerous or
addon effects are not left on the old container-first path. Dispatch order is
not a claim of synchronous native execution. The 2026-10-07 native nonplayer
observation found `addEffect('instant_damage', 1)` left health unchanged in the
call and applied damage/death on the next tick. Thus native instant damage/heal
timing remains distinct from Java's synchronous instant-effect call stack and
requires its own adapter investigation. Script `afterEvents` are also documented
as deferred in the [World API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable).

Accepted native/custom effect dispatches isolate Bedrock API exceptions per entry,
as the ordinary bottle adapter already does. Each entry still consumes its one
source random draw before dispatch; a rejected dispatch records a bounded internal
`mixologyDiagnostics.effectErrors` entry, grants no replacement effect, and allows
the remaining entries and one container settlement to complete. It does not emit
an Actionbar message, retry successful effects, or clamp zero duration. Native
R3 confirmed that timed `addEffect` calls with duration zero throw, so aborting
after an earlier successful entry would leave granted effects on an unconsumed
drink. This error policy is an explicit Bedrock API adaptation, not a claim to
reproduce an exceptional Java mod-hook call stack. Malformed payloads and mismatched
entry hands still reject before any random draw. See the independent
[native phase observations](NATIVE-DRINK-PHASE-20261007.md).

`tools/drink-completion-lifecycle.test.mjs` exercises the actual production bottle
and cocktail callbacks using API fixtures: effect visibility of the original
drink; stale entries including same-ID payload changes and juice cure rejection;
both mode transitions; single/stacked selection changes; ten readable
metadata mutations; lost original stacks; intact zero-health stacks; fresh
post-effect capacity; pickup RNG order; overflow; first/second dispatch rejection;
and write-error rollback without effect replay. These are script regressions, not Native player or rendered-client
acceptance. The required human scenes remain single/stacked/Creative drinks with
existing containers, a full inventory, a lethal drink with keepInventory on/off,
and selection/cancellation during use.
