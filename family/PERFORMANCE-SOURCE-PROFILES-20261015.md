# P41 freezer and Saturation source profiles

These profiles admit the reviewed P40→P41 integration repair and exactly two
Saturation 1.5.5→1.5.6 successors. Source CI proves scheduling behavior in its
fixtures. Native loading and saved data preservation still use this deployment's
single stopped-world copy, first load and restart. Client acceptance and
`production_ready` remain false.

Download these artifacts from the final successful canonical private PR CI:

| Artifact | Required files | Config key |
| --- | --- | --- |
| `native-freezer-performance` | `native-freezer-performance.json`, `.tap` | `extension_performance_validation`: absolute JSON path |
| `family-hud-functional` | `family-hud-functional.json`, `.log` | `extension_hud_validation`: absolute JSON path |
| `saturation-scheduling-functional` | `saturation-scheduling-functional.json`, `.log` | Referenced by the prospective review below |

Keep each log beside its JSON with its original basename. Set
`extension_hud_pull_request` to the merged P41 private PR. Use the exact clean
merged private source with repository ID 1406868911. Change the freezer startup
marker in `startup_markers` to
`[Senluo native freezer 1.0.1] storage registered`.

`extension_performance_validation` takes precedence over the earlier HUD-only
profiles. It allows only five private runtime paths: the two manifests, the
native freezer helper and its two ChineseFood extension declarations. It checks
the immutable P40 preimages, helper copy checksum, author preimages, retained
renderer removal, unchanged blocks/assets, ChineseFood owner41/local10441 pair
and exact existing Tavern168/Grilling144/WorldLiquor146/Saturation1.5.6 providers.
The helper's seven executed source cases include external hopper changes,
normal completion at tick40 and isolation of an invalid storage part. The HUD
report separately conserves all other private runtime files and 29 controls.

Set `prospective_preserved_inputs` to an absolute review JSON outside Git
sources. Its exact shape is:

```json
{
  "schema": 1,
  "profile": "senluo-saturation-scheduling-20261015",
  "source_commit": "<current merged private commit>",
  "recipe": {
    "path": "companion-sources/saturation-scheduling-20261015/recipe.json",
    "sha256": "3aa8c85905cf2cd15f15df35fb0a5bad01eb878dbbd2f8a6f232b7531b25e9a3"
  },
  "source_validation": {
    "path": "<absolute downloaded saturation-scheduling-functional.json>",
    "sha256": "<actual downloaded JSON checksum>"
  },
  "packs": {
    "JS_BP": {
      "path": "<separate compiler output>/JS_BP",
      "uuid": "f65e943a-2128-4da8-9196-e9bf5b86739d"
    },
    "JS_RP": {
      "path": "<separate compiler output>/JS_RP",
      "uuid": "9071b6bc-915d-4d26-8486-05bb8db48762"
    }
  }
}
```

Generate these two outputs with the private canonical
`tools/build_saturation_scheduling.py --output <separate output directory>`.
Inputs must exactly match the admitted 1.5.5 file maps and the unchanged earlier
HUD producer. The successor permits the unique `system.runJob(saturation());`
caller replacement and paired manifests; generator body, other scripts and UI
stay exact. It cannot approve installed drift or partial pairs. The previous
five-pack HUD profile and its historical archive identity remain unchanged.

The new source proof executes twelve cases against both current 1.5.5 and clean
author1.6 script. Its official file9071891 boundary is 28,351 bytes,
SHA256 `42084b762ef1508a1918dcd9d39f17fb418fd02887e589d47c6e3cc8936d3434`.
The private committed `author-file-boundary.json` retains official API hashes
and the original failed CI caused by using a historical container checksum.
That historical report remains unchanged. Equal script bytes do not establish
equal archive identity.

Static evidence records both JSON proofs, their original TAP/log files, the
recipe, diagnosis and official boundary. After the same saved-world rehearsal,
`freezer-performance-native-validation.json` and
`saturation-scheduling-native-validation.json` bind the exact candidate and
source. The freezer binding also retains the existing full container inventory
report. Installation requires these bindings. The final reviewed receipt
directly references all these files so retention can preserve their sources.

Local verification covers admission/rejection cases and orchestration using
temporary records; it does not launch BDS or a client. Full existing suites run
once in the final Tavern CI.
