# Controlled native-storage recovery prototype

A stopped-world investigation found one displaced carrier, while the other
42 retained their recorded centres. The displaced carrier still had the same
persisted identity and ownership token, the correct cabinet at its recorded
block position, and all nine original item types and quantities. Its vertical
displacement was 445.5 blocks. This condition was present before the current
T120/W87 deployment; it is not evidence that this release moved the carrier.

The public regression uses synthetic coordinates, entity identity and token.
World data, actual player coordinates and private integration scripts are not
included. The original cause of the observed movement is unproven. A scripted
teleport can move a no-gravity, no-collision helper; those entity components do
not supply a position lock.

Java stores these inventories in their owning block entities. The Bedrock port
uses a persistent native inventory entity to retain arbitrary ItemStack data.
Reanchoring that owned implementation helper is a platform adapter, not a new
Java mechanic or a claim of full inventory/client parity.

## Proof before movement

Normal reads still require each coordinate to be within 0.1 block of the
recorded centre. A normal read never returns a displaced inventory as valid.
Its recovery request only queues after-event work, including when the read
originates in a restricted before-event callback.

The separate recovery path freshly verifies:

- An exact known storage key and canonical owner block type, dimension and
  integer position. External cabinet types must still be registered with their
  owning namespace and bar/cellar layout.
- The pack-scoped native record, required flag, schema, exact key, dimension,
  recorded block position, persisted entity ID and ownership token.
- The same valid `kaleidoscope_tavern:stored_items` entity in that dimension,
  with its own owner/token properties matching this record.
- The original native container, its size, and every one of its nine indexed
  slots. Each occupied slot must match the record's identifier and amount one;
  each unoccupied slot must be empty. Layout tails and the known glassware and
  potion layouts are also checked. Container size alone is insufficient.
- A currently loaded block at the exact recorded position, with the exact
  authorized owner type. Missing/unloaded, air, replaced, foreign and unknown
  owner blocks are refused.

No item metadata is converted to JSON, and no stack is written, replaced,
reconstructed, granted or dropped by recovery. Its only mutation is moving the
same validated entity to the one recorded block centre. It never searches for
a nearby entity or substitutes another carrier with the same type.

## Native operation and failure handling

Recovery calls `tryTeleport(center, {dimension, checkForBlocks:false,
keepVelocity:false})` once. It does not clear velocity before this operation.
False or thrown results are refused. A true result must also pass the original
strict read, with unchanged record bytes, required flag and entity identity,
plus the fresh owner-block check. It does not repair inventory or metadata if
the post-operation proof fails.

Microsoft documents that [tryTeleport returns whether the operation
succeeded](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable#tryteleport)
and that [TeleportOptions controls block checks and velocity
retention](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/teleportoptions?view=minecraft-bedrock-stable).
These API declarations do not establish successful teleportation inside this
specific helper's cabinet, preservation across a real save/restart, or atomic
engine failure behaviour. Those require the native rehearsal; no direct
velocity mutation is used to assume that they work.

The installer tracks exact loaded/spawned carrier IDs and uses a persistent
iterator to inspect at most 32 handles every 20 ticks. One world-load query per
vanilla dimension discovers already loaded carriers. Healthy centred carriers
do not read or clone their nine slots during maintenance. Full proof is needed
only for a displaced candidate. Entity-load recovery is scheduled. Read
requests are deduplicated and capped at 256 queued keys; failures have a bounded
internal diagnostic list. There is no per-tick whole-world scan, actionbar
message, automatic ownership rewrite or addon-specific family exemption.

## Current evidence and remaining gate

The focused production-module tests cover the synthetic 445.5 displacement,
exact metadata/ledger preservation with zero writes, restricted-read deferral,
fresh after-event ownership, actual installed entity-load/world-load callbacks,
later addon movement, ownership/identity/token/dimension/block/layout/individual
slot refusals, and false/throw/false-positive teleport results. Existing native
storage core tests remain passing. These are API-double/source regressions,
not native BDS or player acceptance.

Before release, the native observer must exercise this actual operation with
synthetic complete ItemStack metadata, and saved-world rehearsal must explicitly
load the affected cabinet chunk rather than relying on default spawn. Both
save phases must show the same carrier, token, item metadata and contents after
successful reanchoring. Missing or truly invalid ownership remains a rejected
case. Versioning, canonical PR/CI/merge and full-family deployment are outside
this unversioned prototype.

Native capability observation completed: four first-phase cases and the queued
saved-actor restart passed on BDS1.26.51.1, with zero players and no Native errors.
The original actor and nine observable metadata stacks survived. Velocity before
and after was zero; nonzero velocity clearing is not verified. Full targeted
stopped-live-world NBT conservation and rendered client acceptance remain pending.
Placed drink-display owners additionally require their registered, validated
display record and matching native IDs; unknown display data cannot authorize a
move. Current evidence: data/native-storage-reanchor-capabilities-20261007.json.
