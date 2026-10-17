# 0.6.158 — all incense surface repair

All eight incense variants now use the Java zero-thickness crossed flower planes with opposite, backface-culled cutout faces. Removed the collapsed-UV edge caps and the hidden fill/base duplicate face. Both open/closed models and block/item material contexts are covered; textures, shape extents, UV mapping and gameplay remain unchanged.

Focused source/geometry/material checks cover all eight textures; the only retained lid/frame contact uses transparent texels. The pinned Java 1.2.0 source and Microsoft material semantics are recorded in `data/incense-surfaces/source.json`.

Required CI and full-family stopped-save/admission/live readback are separate gates. Rendered-client acceptance remains pending (`client=false`, `production_ready=false`). Existing shaker insertion and eating/mixology UI investigations remain open.
