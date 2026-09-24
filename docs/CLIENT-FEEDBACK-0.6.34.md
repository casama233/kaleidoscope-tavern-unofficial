# Java comparison for 0.6.34

Reference: KaleidoscopeTavern `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`.

| Report | Cause and change |
| --- | --- |
| Missing glow | Java `shade:false` faces existed as `unshaded` geometry material slots but many block materials omitted the slot. Bind these with face dimming off. Retain actual Java light levels; give luminous surfaces MER emission maps for Vibrant Visuals. Source audit: `data/java-lighting-audit.json`. |
| Painting edges | Generated wall/ceiling UVs sampled column 0 outside the Java frame. Use the frame's columns/rows 1 and 14. Floor model already uses these strips. |
| Center alignment | Glyph cubes spanned local X -8..0 while layout used a zero-based pen. Shift the mesh origin to X 0, retaining glyph advances and board transforms; helper signature revision 34 replaces old glyph helpers. |
| Guide icons | Old guide data used placeholders and flat UV sheets, with sofas sharing a stool icon. Build exact entry images from original Java item sprites or the packaged item's geometry and texture. Keep 140 explicit bindings and provenance. |
| Support flicker | Original meshes include opposing faces at zero thickness. Double-sided materials rendered overlapping faces. Use single-sided alpha materials for these fixtures and stool entities. |
| Molotov | Java `MolotovBlockItem` uses a 72,000-tick use window with a 10-tick minimum, fixed velocity 0.8. Previous Bedrock use duration was 0.25 seconds below the 0.5-second threshold. Keep the native projectile with a 3,600-second use window. Append Molotov renderer kinds (16 compact/26 full) without renumbering saved wines; the block state keeps its existing 16-value range while the DP/entity stores the exact kind, and route redstone to `thrown_molotov` rather than drink-effect projectiles. Java barrel recipe uses lava and empty bottles; tap source also supports lava cauldrons. |

Ordinary Java wine/cocktail blocks do not define light emission. Mystery cocktail particles, circular rack end-rod particles, incense effects and animated Java texture strips already have runtime paths; they are not evidence that every beverage should emit block light. Client display-tick timing differs between editions.

Technical references: [Throwable](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_throwable?view=minecraft-bedrock-stable), [Texture sets](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/texturesetsreference/texturesetsconcepts/texturesetsintroduction?view=minecraft-bedrock-stable).

BDS checks cannot verify mobile rasterization, PBR bloom or touch gestures. These fixes are code/resource corrections awaiting client visual confirmation, not claims of completed screenshot acceptance.
