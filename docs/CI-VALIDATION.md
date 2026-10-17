# Canonical validation

All validation jobs share `.github/workflows/validation.yml`. A feature branch
runs through its pull request; only `main` also has a push run. New commits
cancel an older validation run for the same pull request or branch. Manual runs
always request every suite. Publication and historical source-transfer/archive
workflows remain separate because their actions are not interchangeable with CI.

The `impact` job reads the complete pull-request diff or the entire main push
range once. It includes deleted paths and both sides of renames. An unavailable
comparison, unknown event or unknown file selects full validation. It writes the
decision and input paths to the run summary so skipped work is reviewable.

| Changed input | Validation |
| --- | --- |
| Ordinary Markdown in `docs/`, top-level family instructions or named root documentation | Baseline and family regressions |
| Family lock/feedback or explicitly registered family tools, including `tools/family_update.py` and its package | Baseline and family regressions, including the update orchestrator tests |
| Runtime, tests, fixtures, tools, data, SDK, art, manifests, dependency/CI configuration, baseline/release history, packaged release notes or any unrecognised path | Every validation job |

This is an explicit input classification, not a blanket file-extension filter.
For example, `tools/fixtures/reference.md` and packaged
`docs/RELEASE-NOTES-*.md` still select all suites. Family orchestration fixtures
are covered by the unconditional family-update regression discovery. New family
tools that are not registered select all suites until their coverage is reviewed.

`baseline` always checks the canonical release/history lock and runs baseline,
family guard/bundle/saved-world/upstream-watch, CI-impact, release-CLI and bridge-project
regressions. It discovers `tools/family_update/test_*.py` when the orchestrator is
present. This small suite is retained even for prose changes.

The existing check job IDs are preserved: `baseline`, `bridge`, `package`,
`catalog`, `audit`, `efficiency`, `foundation`, `glassware-hit-basis`, `mechanics`,
`scripts`, `native-persistence` and `tap-carriers`. Runtime jobs use explicit
job conditions, so an inexpensive change completes with skipped jobs instead of
leaving required checks pending behind workflow path filters. Pinned
Java/peer/baseline revisions and evidence uploads remain in their corresponding
jobs. Identical checks have one owner:

- `baseline` owns the bridge guard regressions, whose current-project test runs
  the project checks. Windows still downloads checksum-pinned Dash, compiles,
  checks the complete export (including the project checks), and rejects drift.
- `catalog` owns the paired creative catalog test; `foundation` retains the
  distinct cross-pack adapter and effect tests.
- `glassware-hit-basis` owns the pure hit-basis tests; `scripts` retains pickup
  core and adapter tests.
- `package` reproduces storage geometry and rejects drift, then runs
  `check_release.py --java-source ... --baseline ...` once. That aggregate
  command passes the pins to both source checks and writes the same storage and
  launch evidence. Its no-argument local entrypoint still runs every check.

The effect-bar test in `foundation` remains because its `LIQUOR_SOURCE` enables
a cross-pack case that the standalone package check does not exercise.

To inspect a prospective change locally:

```sh
python tools/ci_impact.py --paths family/upstream.lock.json docs/BASELINE-MAINTENANCE.md
python tools/test_ci_impact.py
```

CI results remain scoped to what each suite actually verifies. Script doubles
and native BDS loading do not provide human-client rendering acceptance. Family
deployment still requires the canonical candidate receipt, actual native and
saved-world evidence, and the deployment admission procedure.
