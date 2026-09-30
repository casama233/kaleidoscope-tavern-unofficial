# 0.6.68 baseline reconciliation candidate

- Runtime compatibility repairs are maintained in this repository's canonical source.
- Public Cookery dependencies use the verified 1.0.8 UUIDs, not the 1.0.6 identity with a changed version.
- Installation must not rewrite gameplay scripts or block definitions.
- `baseline.json` and `release-history.json` bind the release identity to its source fingerprints.
- CI and the actual packaging commands reject drift, uncommitted runtime and mismatched exports.
- Existing saved-world identities require an explicit migration plan; do not install over luosen by changing UUIDs blindly.

Status: source reconciliation candidate. Native BDS and client acceptance are recorded separately in the family receipt.
