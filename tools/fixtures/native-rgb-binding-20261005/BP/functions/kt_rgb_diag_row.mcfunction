# Isolated seven-sample native matrix; requires Cheats and a new flat test world.
summon kt_sig_rgb_diag:baseline ~-3 ~ ~5 0 0 kt_sig_rgb_diag:red 1_BASE
summon kt_sig_rgb_diag:mask_color ~-2 ~ ~5 0 0 kt_sig_rgb_diag:red 2_MASK_COLOR
summon kt_sig_rgb_diag:overlay ~-1 ~ ~5 0 0 kt_sig_rgb_diag:red 3_OVERLAY
summon kt_sig_rgb_diag:query_overlay ~ ~ ~5 0 0 kt_sig_rgb_diag:red 4_Q_OVERLAY
summon kt_sig_rgb_diag:vertex_color ~1 ~ ~5 0 0 kt_sig_rgb_diag:red 5_VERTEX_COLOR
summon kt_sig_rgb_diag:query_vertex ~2 ~ ~5 0 0 kt_sig_rgb_diag:red 6_Q_VERTEX
summon kt_sig_rgb_diag:baked_red ~3 ~ ~5 0 0 kt_sig_rgb_diag:red 7_BAKED_RED
say RGB diagnostic row: 1BASE 2MASK_COLOR 3OVERLAY 4Q_OVERLAY 5VERTEX_COLOR 6Q_VERTEX 7BAKED_RED
