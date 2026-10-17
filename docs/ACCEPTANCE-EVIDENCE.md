# Offline family acceptance evidence preflight

This tool checks an explicitly supplied acceptance record, not the current live
server. It does not modify existing receipts, admission policy, releases, labels,
versions, source pins or deployment. The existing published `prerelease=false`
releases are not retroactively failed or reclassified. T166/G142/W144/P39 remains
repository-reported deployment with client acceptance pending; see
[the existing baseline](../family/BASELINE-STATUS.md).

## Actual enforcement boundary

Run from the repository root:

```sh
python tools/family_update/acceptance_evidence.py --record /local/evidence/acceptance.json
python tools/family_update/acceptance_evidence.py --record /local/evidence/acceptance.json --request accepted
python tools/family_update/acceptance_evidence.py --record /local/evidence/acceptance.json --request stable
```

Inspection of an honest pending record returns zero even when evidence is
missing, and reports `promotion_ready=false` plus blockers. Explicit promotion
requests return nonzero unless all evidence matches. A record that already
claims `accepted` or `stable` also fails closed without matching evidence.
Unknown status/schema and malformed JSON fail. Nothing is promoted by success.

The existing unconditional `baseline` CI job discovers this module's tests via
`unittest discover -s tools/family_update -p 'test_*.py'`. This is an offline
preflight and regression-tested interface, **not a gate wired into every release
or deployment entry point**. The release workflow is unchanged. The full-tree
source admission and `ci_impact.py` are unchanged. Documentation-only edits do
not trigger runtime retests; unknown runtime/build inputs retain fail-closed CI.

## Record and original evidence

Keep actual records and private reports outside public Git. There is no new
current-baseline file or second pack manifest. All references have a relative
`path` and exact original `sha256`; paths may not escape the record directory.
Reports are read, hash-checked and never rewritten. A minimal honest pending
record can be inspected before original reports are available:

```json
{
  "schema": 1,
  "status": "pending_client_acceptance",
  "repository_reported_deployment": {
    "summary": "family/BASELINE-STATUS.md; repository report only"
  },
  "evidence": {},
  "unresolved_blockers": ["Full current client acceptance is missing"]
}
```

For promotion preflight, `evidence` must reference:

- `candidate`: existing raw `family-receipt.json` (schema 1), including every
  pack's UUID/version/side/files/dependencies/source and complete two-sided order
- `reviewed`: existing `reviewed-family-receipt.json`; packs, sources and order
  must equal the raw candidate, with static/BDS/saved-world gates true
- `build`: existing `build-evidence.json`, tying the raw receipt digest to pack
  count and original repository/commit/full-tree identities; every owned pack
  must match a non-working source. Retained-source special cases that do not
  match this conservative rule require a separately reviewed extension
- `admission`: existing `admission-report.json`, binding both raw and reviewed
  digests and the complete pack count
- `readback`: existing `poststart-verification.json`, binding the reviewed
  receipt, count, exact files/order, drift, startup, quality and RUNNING state
- `client`: the new human-client receipt described below

`direct_readback_report_verified=true` means the supplied original direct-readback
report was checked, not that this tool connected to LIVE or observed it now.
`repository_reported_deployment` is displayed separately and never satisfies a
gate. Missing original reports are a traceability blocker, not an instruction
to redeploy to manufacture replacements.

## Human-client receipt

The record's `acceptance_context` and client's `context` must match exactly and
contain these nonempty strings: `engine`, `api`, `client_version`, `device`,
`input_method`, `gui_profile`, `settings_sha256`, `initial_state_sha256`. The last
two are SHA-256 identities of the relevant configuration and initial state.
Use one record per reviewed device/input/context; this does not certify every
possible platform or full Java parity.

The client receipt has `schema: 1`, `method: "human_client"`, original
`recorded_at`, the exact `candidate_receipt_sha256`, and
`runtime_inventory_sha256` from inspection output. That runtime digest is a
computed projection of the existing receipt's pack bytes/identity/dependencies
and order, separate from source SHA/full tree and archive/receipt digests. It
is not a replacement checksum manifest or permission to weaken admission.

`scenarios` is an object with every following key:

- `eating.first_use`, `eating.complete`, `eating.cancel`, `eating.slot_switch`, `eating.rapid_reopen`
- `shaker.first_use`, `shaker.complete`, `shaker.cancel`, `shaker.slot_switch`, `shaker.rapid_reopen`
- `inventory_conservation`, `save_rejoin`, `hud_coexistence`

Every scenario requires `result: "PASS"`, nonempty `observations`, and nonempty
`captures`, each a path/SHA-256 reference to original evidence. The same video
may support several observations without retesting. Extra scenarios are allowed
but must also pass. Missing, failed, blocked and inconclusive cases cannot be
promoted. The record must explicitly have `unresolved_blockers: []`.

This is structural/provenance consistency, not a media-content classifier or
observer authentication. Review must establish that captures actually show the
claimed actions on the named candidate, that core gameplay and affected
neighbors are sufficiently covered, and that known defects are resolved. A
self-authored JSON or synthetic test fixture is not actual acceptance. BDS,
CI, Blockbench and historical unversioned clips cannot replace human-client
receipts. The test fixtures are explicitly synthetic and are never published as
current client evidence.

Original source proofs and receipt dates stay pinned after prose changes.
Optional `documentation_source` may identify a newer documentation commit; it
never replaces the tested/deployed source. Reuse only these exact candidate
reports. This tool does not implement dependency-aware evidence caching,
rebind old client evidence to changed packs, relax full-tree admission, or
change the existing deferred-client development-deployment policy.
