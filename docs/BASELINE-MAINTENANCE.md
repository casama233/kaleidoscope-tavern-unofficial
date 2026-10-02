# Baseline maintenance

1. Implement gameplay, rendering, guide and stable API fixes in canonical runtime. Do not patch them during packaging or installation.
2. Bump the release version whenever any exported file changes. Update paired manifests, module versions, guide/payload version and dependencies together.
3. Update `baseline.json` dependencies from verified upstream file metadata. Never infer UUIDs from a version label.
4. Run the repository's functional regressions. Stage reviewed source files, then run `python tools/baseline_gate.py freeze`. An existing version cannot be assigned new content.
5. Review and commit the lock/history. `python tools/baseline_gate.py check --release` and the real packager must pass from a clean commit.
6. Build a family candidate with pinned upstream archives and order. Static checks, BDS loading, client acceptance and saved-world migration are separate evidence. Under the owner’s 2026-10-03 standing instruction, pass static/BDS/saved-world checks, then update luosen live for human testing; client acceptance follows deployment.
7. Back up the consistently stopped world and retain rollback packs. Register the standing instruction and this candidate’s exact receipt SHA256 in deferred_client_acceptance, pass canonical family_guard, deploy the complete family with only the exact tested hashes, retire duplicate owned BSM hooks, then compare every installed file with the receipt. Keep client=false, production_ready=false and pending_client_acceptance until real human acceptance. Do not request repeated deployment permission; do not restart live for documentation-only changes. Subsequent drift fails closed.
8. Third-party defects require a clean latest-version reproduction and an author feedback record. Temporary fixes need reviewed hashes and a removal condition. Translation must not hide runtime replacements.

Historical artifacts and branches are evidence, not release input. A PR being closed or merged does not prove its content survives in the resulting tree. Reconcile by behaviour and verify the resulting source/export.

Family operations and integration tooling: `casama233/kaleidoscope-tavern-unofficial/family/MAINTENANCE.md`.
