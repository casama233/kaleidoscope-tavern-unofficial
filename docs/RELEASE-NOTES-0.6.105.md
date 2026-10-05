# Tavern 0.6.105 reconstructed public-test candidate

This is a new coherent reconstruction from public Tavern 0.6.95. It is not
restoration of lost T98 bytes. Unrelated main fixes, original Java gameplay,
pack UUIDs, stored schemas and the fixed guide navigation remain preserved.

The four prioritized repairs are combined in canonical source:

- Finite per-sprite shaker slot, progress-bar and cursor expiry, preserving
  native/foreign HUD controls and the existing packet lifetime
- Authoritative Java ingredient categories and existing addon ingredientTags,
  retaining 26 recipes, 56 addon inputs, exact-item slots and quality rules
- All sixteen Java ingredient HUD colors with existing protocol indices intact
- Exact 336-entry baked Java signature RGB atlas retained for every legitimate
  one-, two- and three-color mean. All 69 core and 56 current addon descriptors
  produce 250 reachable colors, all covered by this shaded atlas. Verified
  query-overlay tint is used only for external RGB outside that domain; that
  fallback has flat texture shading and is not Java pixel-equivalent

The earlier 0.6.102/0.6.104 arbitrary-RGB material candidates failed native tint
checks and stay immutable. Their bounded failure records are included separately;
those failures do not describe the normal baked Java mixture route. Exact native
acceptance of this final candidate must be established against its frozen bytes.

New 0.6.105 identity covers both manifests/modules, guide payload, diagnostics and
canonical hashes/history. Dependency-only World Liquor 0.1.66 retains the existing
0.1.58 gameplay/assets, changing only version/dependency metadata for this host.

The aggregate Git checkpoint is published before extensive aggregate checks.
Static/regression, native BDS load, saved-world and actual rendered-client evidence
are separate. No merge, public Release, live deployment or full client acceptance
is claimed by this source checkpoint. Slightly Tipsy exact Java camera-only roll
remains unimplemented. Artifact suffix baseline1 matches the existing diagnostic
build identity; publication requests are finalized separately after acceptance.
