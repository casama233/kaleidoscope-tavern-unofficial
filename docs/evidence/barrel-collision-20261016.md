# Barrel edge collision restoration

The barrel's invisible part blocks previously used full cubes at every position.
The author instead cuts four pixels from each outer column for north/south barrels
and each outer row for east/west barrels. Walking and aiming beside the barrel
could therefore contact empty space.

Four part permutations now restore both physical collision and selection to those
source shapes. All three layers share the same rule; the central bottom core stays
full. Placement coordinates, block states, storage ownership, brewing, tap routing,
models and animations remain unchanged.

Both maintained author branches agree:

- [Forge 1.20.1 source](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/block/brew/BarrelBlock.java)
- [NeoForge 1.21.1 source](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/a1afba34981a00e89d57130d3dc8f1e64f1820a2/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/block/brew/BarrelBlock.java)

The [source witness](../../data/java-parity/barrel-shape-source.json) binds the
complete class hashes and preserves its original constants and `getShape` method.
`check_barrel_collision.py` executes that original Java method with only state/box
stubs, then compares 108 shipped block states. Regression cases reject the old full
cube, the wrong world axis, a reversed edge and selection retaining the old wall.
The historical projection only admits the exact four permutations over immutable
T170 source and rejects unrelated component or state changes.

These are source checks. Native entity contact, current-client ray tracing and
human gameplay acceptance remain pending; `client=false`.
