# Maintained changes

## 0.6.143

修正酒館板面原生单行输入容量与保存上限失配，保留三语精确scope、foreign表单及原玩法；同步原作者Immersive Eating1.1.0身份迁移与当前差距索引。正式多行与真人client仍待验，详见 [本版说明](docs/RELEASE-NOTES-0.6.143.md)。

## 0.6.142

保留 canonical T141 板面换行、雪克杯來源辨識與最新指南，加入已測載入／initialSpawn 光效修復及嚴格原生來源綁定；配對 W119。 見[本版說明](docs/RELEASE-NOTES-0.6.142.md)。

## 0.6.141

完整承接已發布 T140 的四頁 AMW 指南、三語七入口及共用 Cookery 投影；修正板面溢出／index 0 空格換行、雪克杯原生 metadata 與 fresh amount 手勢，配套 W118 LivingEntity 類別修補及 G122。既有試驗來源回歸保留，新候選原生首次／重啟與嚴格 recorder 通過，完整 CI 由修補 PR 執行；真人、私人家族與 LIVE 分別待驗證；不覆寫主線 T140 note／history。見 [本版說明](docs/RELEASE-NOTES-0.6.141.md)。

## 0.6.139

整合已發布的三語指南／共享 Cookery 入口與固定 T138 的光效時計、重啟、原料保存、倒轉及視覺沉浸修補；配套 W116／G122。歷史相同版號的不同 trial 原值保留，使用新身份。 見 [本版說明](docs/RELEASE-NOTES-0.6.139.md)。

## 0.6.138

- Integrate observed native effect countdowns and fresh save readbacks with the exact T137 entityLoad acknowledgement repair.
- Preserve all Mob, anchor, ingredient, source visual and quiet immersion fixes; pair W115 and retain G120.
- Keep parallel T136/W113 identity histories separate and retain scoped historical native evidence.
- Add only isolated pending-client multiline tools; require current-candidate native and canonical CI.

## 0.6.137

- 修正已保存原生光效被重啟 EffectAdd 誤判為外部刷新；保留本輪倒轉 Mob 與 W114 重生錨修復。
- [本版驗證與限制](docs/RELEASE-NOTES-0.6.137.md)。


## 0.6.136

- 修正 Upside Down 的完整 Mob 名單與魚類分類；配對 W113 重生錨觀察；保留 T135 全部功能，修正原生 observer 原料及地形隔離。
- 詳細範圍及驗收限制見 [本版說明](docs/RELEASE-NOTES-0.6.136.md)。

## 0.6.135

- Retain T134's complete ingredient, transaction, visual and immersion scope, including the reviewed PR297/PR298 repairs and W110 author updates.
- Repair both runtime gaps exposed by T134 CI run `37869770416`: add 24 ice-grape and one RGB PBR companion with reproducible canonical profiles, and accept native bare vanilla Adventure-list IDs while preserving their original strings, order and reconstruction checks.
- Give the Ardent test fixture a duration-aware `getEffect` implementation; preserve production behavior and the existing assertions.
- Pair with World Liquor 0.1.112 and retain G119. Preserve the failed T134 run, its frozen identity/history and successful W111 CI; final T135/W112 CI and native/client/LIVE acceptance remain pending. [T135 scope](docs/RELEASE-NOTES-0.6.135.md) records the focused repair and verification boundaries.

## 0.6.134

- Preserve final PR297 source `727fd885` including the explicit XP-orb/health-helper observer distinction, and carry PR298 head `625ff769`'s finite-XYZ native storage comparison without rewriting T133 history or claiming that PR298 has merged.
- Retain complete native machine ingredients, metadata-sensitive merging and rollback; preserve supported portable stackable shaker metadata and reject unprovable reconstruction before debit.
- Restore source Creative fluid handling, direct-hand extraction, Adventure machine use and checked destruction drops.
- Add source status particles, bounded native-effect appearance ownership, prompt grass-invisibility exit and explicit Tipsy yaw opt-in.
- Restore separate board foreground/outlines, animated ice-grape ingredients and source-shaded arbitrary RGB; share texture clocks across recreated helpers and retain exact geometry allocations.
- Pair with World Liquor 0.1.111, preserving W110's current-author Dassai amplitudes and four cocktail model/atlas repairs; optional Grilling remains 2.8.119. [T134 integration scope](docs/RELEASE-NOTES-0.6.134.md) records the retained sources and pending final CI, native/client and LIVE boundaries.

## 0.6.132

- Share Java instant-health/harm dispatch with splash delivery, including source potion immunity, per-recipient policy snapshots, owner attribution and compatible addon declarations.
- Repair native held-item shaker interaction, post-consumption/offhand-placement pickup echoes, immediate retry after rollback, and independent native storage cleanup.
- Preserve Vision's query-time living recipients and include reviewed vanilla fish without the Native mob family.
- Add four source-derived guide flipbooks with foreign-image fallback, preserve literal board escapes and remove the extra slot HUD fade.
- Pair with World Liquor 0.1.109 and optional Grilling 2.8.119; [source and verification scope](docs/RELEASE-NOTES-0.6.132.md) retains explicit native/client and branch differences.

## 0.6.131

- Preserve direct-touch glassware hits, restore empty-seat orientation and transactional seat switching, and allow Java ordinary use in Adventure mode.
- Complete source-routed offhand shaker storage, completion, pouring and left-hand poses; guard stale stops, cross-hand echoes, foreign cancellation and immediate retries.
- Restore quiet shaker no-ops, original insufficient-ingredient text and chat delivery for low recipe quality.
- Bind four animated item sprites to native item visuals and retain source frame timing and generated edge geometry.
- Decouple Vision's new-target audio from unavailable Glowing and improve known Molotov fire-placement predicates.
- Transact board material/data writes together and restore source trellis wax/axe consumption rules.
- Pair with World Liquor 0.1.108 and Grilling 2.8.118; see [release notes](docs/RELEASE-NOTES-0.6.131.md) for scoped tests and unresolved native/client differences.

## 0.6.130

- Reduce redundant rack/cabinet queries and visual setters; retain bounded repair and unloaded-owner safety.
- Schedule shaker PUT recovery only during its active visual permutation.
- Complete per-tick Ardent finalization and native living Bloody Mary kill healing.
- Register existing Japanese/Russian partial locales with exact native aliases and English fallback checks.
- Preserve and verify supported host-scope outer metadata during legacy shaker ID migration, with rollback.
- Pair with World Liquor 0.1.107; see [release notes](docs/RELEASE-NOTES-0.6.130.md) for native evidence and remaining client/API limits.


## 0.6.129

- Gate shaker ingredients by Java categories and explicit addon inputs, return containers before debiting ingredients, and restore Creative placement and sneak air-swing clearing.
- Preserve complete placed shaker carriers with transactional native storage; keep unsupported decorated ingredient intake rejected.
- Align cup/shaker physical bounds, interpolate the owned progress cursor, and expire stopped progress promptly.
- Show actual cocktail effects and colored ingredient information through shared tooltips and guide data; add personal shaker volume settings.
- Use native destruction drops for Ardent Heat and improve low-input/collision/velocity handling for the High Heels adapter.
- Record the failed three-potion nested-storage native experiment and retain explicit Java/client limitations. See [release scope](docs/RELEASE-NOTES-0.6.129.md).

## 0.6.128

- Enforce frozen identity for release, archive and complete-family assembly, including CI packs.
- Validate the ordered startup body through actual registration/installer calls.
- Preserve carried shaker metadata on completion/serving; an aborted shake does not write inventory.
- Keep source tests, native saved-world gates and pending client acceptance distinct.

## 0.6.127

- Current-source main-hand shaker framing and preservation of third-person arm yaw; full current client matrix remains pending.
- Replace a tautological selector assertion with shipped-condition boundary checks and one discriminating mutation.
- Separate current build/install guidance from historical README snapshots.

## Earlier versions

The immutable runtime identities are in release-history.json. Detailed existing release notes remain under docs/RELEASE-NOTES-*.md; original evidence retains its date/version/scope. The previous README snapshots are in docs/archive/. No historical release is relabelled as the current candidate.

## 0.6.136

- Rewrite the three-language Tavern guide following the original Bedrock author’s short paragraphs and preparation links. Preserve the seven entrances and complete source recipes; correct operation instructions and formatting.
- Use the same Tavern projection and UI for the optional Cookery chapter through registered G121 hooks, with a bounded handoff and original-flow fallback.
- Retain the T132 runtime baseline. The failed unmerged T135 persistence work remains separate; client reading and rendering acceptance are pending.
