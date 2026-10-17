# Cookery 1.6.1 resource-pack installation prerequisite

This applies only to a complete family candidate carrying the reviewed P50
`cookery-held-geometry-canonicalization` extension. It is not a standalone
author release or permission to install an unadmitted candidate.

The assembler replaces exactly three Cookery RP geometry files for the red
lantern and bamboo tray with the same author's canonical geometry. It preserves
the Cookery RP manifest: UUID `c9df2982-d72e-4bbf-a72c-b77de4ea915b`, version
`1.6.1`. P50's own version does not give the repaired Cookery RP a new identity.
Replacing server files therefore does not establish that an existing client
has discarded its earlier Cookery 1.6.1 resources or downloaded these bytes.

## Required before client acceptance

Use either a clean client resource-pack installation with no older Cookery RP,
or have the user remove only the previously installed/cached Cookery RP and
then install/download the exact reviewed family resource packs again. Remove
any duplicate enabled Cookery RP that could mask the repaired resources.
Do this only after the complete candidate has passed its applicable admission
gates and is available for the intended installation or server.

This is a targeted resource-pack step, not deleting a world, player data, the
whole application, or all unrelated resource packs. The assistant must not
delete client cache data without the user's authorization. If the old Cookery
RP cannot be identified unambiguously, stop and ask rather than removing other
data. Do not relabel the author pack or change its UUID/version during install
to force a refresh; any identity change needs its own reviewed source update.

Record which clean-install or targeted-removal route was actually completed,
the exact candidate receipt, and the client's observed result. Then inspect
the repaired lantern and bamboo tray in the affected held/world views. Source
hashes, server readback and BDS startup do not render these client views and
cannot certify cache refresh. Until those human observations exist, keep
`client=false`, `production_ready=false` and `pending_client_acceptance`.
