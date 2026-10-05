# Isolated signature RGB binding matrix

This separately named BP/RP uses distinct UUIDs and seven unique entity IDs.
It does not modify canonical Tavern 0.6.104, take a new canonical identity,
or establish gameplay/client acceptance. Use only an isolated Creative test world.

Generate with generate.py. Enable both diagnostic packs, then run:

    /function kt_rgb_diag_row
    /tp @s ~ ~ ~ 0 15

The row sits five blocks ahead. Left to right:

1. BASE: source texture, ordinary alpha-test material
2. MASK_COLOR: constant-red controller color, built-in color-mask material
3. OVERLAY: constant-red overlay_color, same material
4. Q_OVERLAY: query-driven overlay_color, synced RGB properties
5. VERTEX_COLOR: constant-red controller color, COLOR_BASED material
6. Q_VERTEX: query-driven controller color, same vertex-color material
7. BAKED_RED: pre-multiplied source RGB, ordinary alpha-test ground truth

All samples have the same glass/liquid geometry and source frame. Glass is always
an independent untinted pass. The query samples default to red and support:

    /event entity @e[type=kt_sig_rgb_diag:query_overlay] kt_sig_rgb_diag:blue
    /event entity @e[type=kt_sig_rgb_diag:query_vertex] kt_sig_rgb_diag:blue

Cleanup uses /function kt_rgb_diag_clear and targets only diagnostic entity IDs.
It never targets the player or canonical Tavern helpers.

The installed client inspection distinguishes masked change-color uniforms from
vertex-color input and the overlay path. This is a binding hypothesis to test,
not an assertion that any path has already worked. Public Microsoft material
documentation describes COLOR_BASED vertex multiplication and USE_COLOR_MASK
mask multiplication. No private shader/material contents, game archives,
worlds, screenshots or raw client logs are included in this fixture.
