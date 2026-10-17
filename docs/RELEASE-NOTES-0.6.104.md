# 0.6.104: Native signature RGB tint candidate

On the exact public 0.6.102 pack, a real Minecraft 1.26.52.3 client rendered
white/gray signature liquid after the existing color_red event. Geometry and
white source texture were present, but the custom USE_COLOR_MASK route did not
apply the RGB tint. This is a confirmed failed native witness for 0.6.102.

This fresh candidate uses the directly supported built-in
entity_alphatest_change_color material and the six existing full source frames
for arbitrary RGB. That path has identity UVs and no custom material/UV-animation
dependency. Exact Java mixtures retain the unchanged 336-entry atlas route,
and glass remains a separate untinted pass. Stored payload schemas are unchanged.

Microsoft's [custom item example](https://learn.microsoft.com/en-us/minecraft/creator/documents/addcustomitems?view=minecraft-bedrock-stable)
uses the built-in material for dye tint, while its
[material guidance](https://learn.microsoft.com/en-us/minecraft/creator/documents/material-files?view=minecraft-bedrock-stable)
warns that custom material behavior can vary between game versions.

Version 0.6.102 remains immutable. This 0.6.104 source-only draft must receive a
new native RGB verdict before aggregate integration, release or deployment.
Neither static contracts nor command success establishes rendered acceptance.
