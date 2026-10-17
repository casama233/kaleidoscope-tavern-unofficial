# Tavern 0.6.170: shaker editor arithmetic normalization

Status: stable publication requested, subject to the existing strict CI and exact package checks. Additional real-client, saved-world and soak acceptance remain unverified and are not gates for this publication. This is not a gameplay-fix or complete Java-parity claim.

## Exact change

The signed-coefficient formatter in `tools/shaker_held_frames.py` now emits explicit subtraction for the negative coefficient. Its generated resource changes only `animation.kt_mixology.shake_first_left/bones/grip/position[0]`:

```text
4.50451374 + -1.53805532 * math.sin(q.life_time * 1718.87338539247)
4.50451374 - 1.53805532 * math.sin(q.life_time * 1718.87338539247)
```

For every real sine value, `a + (-b)*s` equals `a - b*s`. All other item/player expressions, source clocks, selectors, hand dispatch, camera/socket placement, geometry, UVs, textures, materials and gameplay remain unchanged. Required package versions and owned BP/RP dependency metadata advance together without changing UUIDs.

The predecessor is published source commit `4584618e94332068749046be73d766f883b49eb6`. The animation file SHA256 changes from `01e9ebc9e822f4d6c3826dd2a04e3abff963956f176f9dea5a35862e8a3844fa` to `2740cf7f4bc4a05c432e98e591d964169b992bf8cb1553ecb4425be91f54fb06`. One appended test-only review layer reverses exactly this line to the earlier bytes; all existing layers and immutable T168/T169 witnesses are retained.

## Regression scope

The nine held-frame tests retain all existing geometry/dispatch coverage and add generated/shipped spelling checks, rejection of the original adjacent-operator and wrong-sign mutations, and numeric comparisons. The six native-frame tests remain intact. The historical T168 test selects its exact release rather than assuming it is forever the last review layer, retaining its immutable source/hash/tampering checks.

Before versioning, the exact unchanged animation candidate was independently checked with official Blockbench 5.2.2 source commit `c9ace42ef1b770bdadfe656729c7833b8feb37d2`: 4,577 source/inverse parser comparisons had zero pairwise difference; four isolated fixtures had 264 channel-axis conversion checks and no validator warnings. The original adjacent-operator warning was preserved in its original fixture. These source/parser checks do not replace actual native UI observation or prove Bedrock runtime grammar acceptance.

The original source operator sequence is not established here as a Bedrock content error. Camera adaptations, native `this` coordinates, clock epoch alignment, and later Java arm-pose layers are outside this change. Intended oscillation frequency does not establish a runtime phase-reset contract.

## Exact-family integration and known risk

Use World Liquor 0.1.148 with Tavern 0.6.170: W148 declares both exact Tavern BP/RP dependencies. The owned family lock now records Tavern 0.6.170, World Liquor 0.1.148 and Grilling 2.8.149. The Grilling source-check peer is `82a396721103ae3dc7962e6ed57e10837cb5ba6d`; pinned upstream archives, UUIDs, dependency order and deployment admission rules are unchanged. Grilling's own Cookery 1.6.0 and stable Script API requirements still apply.

Known family issue: World Liquor Treasure Guide's mob bonus can copy unrelated newly dropped items; overlapping death callbacks can multiply bonus drops. W148 retains the existing behavior; no fix is included. Reproduced against W148 source in an isolated mocked scheduler, not a native-server reproduction.

已知家族風險：World Liquor 的淘金熱（Treasure Guide）生物掉落加成可能誤複製無關的新物品，重疊死亡回呼可能放大額外掉落。W148 保留現有行為，未修補；目前證據來自隔離模擬，尚非原生伺服器實測。

## Publication evidence and remaining limitations

The stable publication scope is source/editor, existing strict CI and exact package verification. Clean frozen identity, source preservation, paired dependency/guide checks and deterministic archive verification remain mandatory. Existing CI jobs, including native-persistence smoke checks, are unchanged. A source or package check does not establish complete Java parity or native client acceptance.

Additional real-client, install/upgrade/restart/rollback, saved-world persistence and long-running soak acceptance have not been established for this exact family and are not gates for this publication. No earlier runtime/client/deployment receipt is reassigned to this candidate. Source/parser evidence above retains its stated scope; camera adaptation, clock and render-controller behavior remain distinct limitations.

Publication is requested through the existing push-to-main workflow. Merging the reviewed request into main triggers publication, so all required checks and the paired release order must be satisfied before merge. Client, production-ready and live-deployment flags remain false. Deployment admission rules are untouched, and no live deployment is part of this release.
