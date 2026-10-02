# Draft version reconciliation — 2026-10-02

This repair was first proposed as 0.6.89 in unpublished draft commit `d653bd8840ad33bb3d75b34216bdbc4393ddd7b0`. While it was being checked, an independent repair using the same version was merged into main. No release or deployment of our colliding draft was performed.

The final repair is 0.6.90, based on canonical main `769adb35a721bc13da299d87ecc7e31bc95fd04c`. Its release-history file preserves every entry from that main commit exactly, including the independently merged 0.6.89. The old draft's conflicting, unpublished 0.6.89 entry is superseded rather than misrepresented as the official release.

The reconciliation push's append-only comparison against the previous draft branch correctly flagged the replacement of that draft entry. The pull-request comparison against canonical main passed. Neither guard was disabled or relaxed. Subsequent checks must use the reconciled source and the current canonical base; the earlier failed run remains part of the audit trail.

Final locally built canonical MCAddon SHA256: `144474f46f2b379b62fe30ea2586b5ba45525dc7f71ecd8cefdba3016072fcbe`. This records package identity only. Blockbench/editor, static tests, native server loading and human client acceptance are separate; the latter two were not performed for this repair.
