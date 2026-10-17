# Historical preservation view for the reviewed 0.6.119 drink repair

PR229's functional regressions passed, but its legacy pick/storage preservation
checks still expected the previously reviewed scripts. This repair registers the
actual Java-backed functional delta; it does not rewrite gameplay to pass an old
assertion or replace any frozen runtime file.

`data/baseline-reconciliation.json` adds a test-only
`reviewedFunctionalDeltas` layer for exactly these existing scripts:

- `bedrock/mixology.js`: Java 24-bit draws and float probability, plus the native
  completion wrapper that keeps SDK parameters out of the injected RNG.
- `bedrock/drink-effects.js`: lazy bottle draw/dispatch, the last Survival
  container returned to the hand, and current NeoForge's default Poison-only
  HONEY cure before the juice container return.
- `core/drink-effects.js`: selected rows yielded between draws while preserving
  the public eager array API for potion builders.

The reviewed predecessor is merged main
`bdb06176dd52f63cc23ee8a67942187327591a9b`. The functional changes were reviewed in
`79b1dc9e` and `3d59c3f6`; the rejected 0.6.118 freeze is retained and not installed.
Source methods, SDK boundary and remaining platform/lifecycle gaps are recorded
in `COCKTAIL-EFFECT-ROLL-20261007.md`; actual completion regressions are in
`tools/cocktail-effect-roll.test.mjs` and their existing CI entry.

`tools/baseline_reference.py` first checks the complete frozen 0.6.119 postimage,
reverses only the recorded source edits, and verifies the exact predecessor
bytes. The existing reconciliation then verifies its unchanged `after` hash and
restores its unchanged original preimage. Files without an older reconciliation
row return the exact predecessor to their existing downstream guards. Every
previous `before`, `after`, compressed preimage, baseline commit, pick golden and
launch/storage preservation assertion remains unchanged.

The regression rejects unreviewed postimage bytes, a corrupted reverse delta,
a corrupted original historical preimage, and a ledger that is not explicitly
test-only. This projection is an in-memory read used by preservation tests. It
does not feed runtime output, packaging payloads or deployment. Runtime 0.6.119,
release hashes and immutable history are unchanged; successful source/API tests
remain distinct from native BDS, saved-world and actual client acceptance.
