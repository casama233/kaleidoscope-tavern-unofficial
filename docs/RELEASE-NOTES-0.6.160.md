# 0.6.160 — animated item edge depth

Fixes depth charge, mystery cocktail, nether special and ice grape held sprites. The former Java-to-Bedrock conversion reflected side X positions while the front UV mapped U to positive X. It also treated up/down UV origins alike. Side positions, east/west face normals and up-face U direction now match the unchanged front/back sprite.

Preserves the original one-model-unit thickness, Java boundary spans, face counts, display transforms, source pixels, flipbook timing/interpolation and native drink/eat components. The original conversion hash remains as an immutable preimage; an independent per-frame boundary check rejects the predecessor and verifies the corrected shell.

Bedrock face and UV corner reference: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/schemasreference/schemas/minecraftschema_geometry_1.21.0?view=minecraft-bedrock-stable

Required CI and full-family saved-world/admission/live readback remain separate. Client rendering is pending (`client=false`, `production_ready=false`). Incense repair is retained; the eating/mixology UI investigation remains open.
