# 煙火目前範圍與 live 部署要求

來源鎖同步 Grilling 2.8.82 BP/RP，保留酒館 0.6.115、世界名酒 0.1.82 及現行 Cookery 1.6.0／私有整合。來源鎖更新本身不代表已安裝。

已保留 PR205 的世界名酒修復及通用 source-hold 准入工具；只撤銷其依据本輪較早指示登記的 Grilling 2.8.72→2.8.73 部署保留，原因為下述使用者明確調整。其他來源的完成門檻不因本輪自動解除。

使用者原先要求 100% Java 一致後更新 live；其後明確回覆「接受明列的平台差異，繼續完成其餘可移植部分」，並補充「重點是無任何邏輯 BUG，客戶端驗收可以交給 dot」。因此原先阻止中間 live 更新的門檻已按使用者指示調整：完成可移植邏輯修復、canonical PR／CI／合併和完整家族 static／BDS／本次停服存檔演練後，必須依既有持續授權更新 live，供 dot 完成客戶端驗收；不重複索取部署許可。

[Grilling PR137](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/137) 修復普通串原生傷害、致死回饋與暫存生命判定。[Grilling PR138](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/138) 整合瓶子剩餘狀態／分層／取回、Java 100 tick 熱期限，以及 lore 容量和熱度資料保存。全部現有存檔精確熱期限在讀取時保留，正常再加熱／合併才寫新原作期限。25 個真實物品／容器案例及重啟後 25 筆資料通過，沒有模擬玩家；這不代替真人聲畫。

完整來源、平台差異、歷史分支身份衝突与驗證範圍見 [Grilling 2.8.74](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/STATUS-A2.8.74.md) 與 [目前目標](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/JAVA-FIDELITY-GOAL-20261007.md)。剩餘吸收值、CapsLock／麻木準星、原版新要塞來源、任意 Java-only 回呼、動態背包模型和原生 fluid／聲畫引擎差異仍明列。

部署前取得完整收據、正常停服一致備份、回退包及本次保存檔演練；只登記本候選收據的 deferred_client_acceptance，通過 canonical／BSM family_guard 後安裝。部署與未知 BUG 零風險都不能由 hash 證明；沒有真人驗收時持續保留 client=false、production_ready=false、pending_client_acceptance。

相同不可變候選已通過的 CI／原生證據重用，不為了相同 hash 反覆重測。純文件／來源鎖變更不為酒館另換 runtime 或重啟。

## Coherent G78 candidate

Grilling PR141 starts from canonical G74, combines reviewed Git differences from corrected peer G76 (`ce7b75171537877ba92d1ec7c3ed92e33d10a4d6`) and seasoning/output PR140 (`9c33d3f5fa65db1b0701ee25cb1d0f6a0b1b7766`), and fixes the additional real native RawMessage key-order expiry rollback. Both conflicting unpublished G75 and G77 identities and their original branch histories remain intact; canonical output takes a fresh G78 identity. G73 health/audio feedback and G74 bottle/icon/heat repairs survive. World Liquor 0.1.79 and private integration 1.0.20 remain paired.

Bounded Grilling evidence records twelve real item/storage cases, all 128 legal native rack state/facing combinations, two expiry cases and thirty-one persisted item records after normal restart. These checks do not certify input, audio, rendering or multiplayer acceptance. Owner-accepted platform differences remain explicit; client=false, production_ready=false, pending_client_acceptance. Complete family CI/static/BDS/fresh stopped-world rehearsal and exact live readback are still required.

Additional peer source `028dd532`/`4dbd904` provides original-texture/FIXED six-tool projections and opt-in rack hit/admission diagnostics. Fresh G78 native checks bind all owned bytes, three bottle-stack intent/admission cases, eight non-owning tool projections and six model properties after engine ticks. This does not generate client clicks; peer upper bottle insertion refusal remains unresolved and is not marked fixed. The current Grilling status is `docs/STATUS-A2.8.78.md`; earlier G77 evidence retains its original source identity.

## G79 physical rack hit correction

[Grilling PR139](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/139) now bases on canonical G78 and fixes the newly diagnosed negative-axis native hit mirroring: the observed upper shelf `.6744117737` was reported as `.3255882263` and selected lower tool slot 7. The category guard correctly prevented the wrong insertion. Same-event head/view rays intersect only the clicked rack selection box; known direct touch retains its off-crosshair tap through sign-aware native decoding. Existing hand, range, sneak, facing, category and transactional ownership checks remain. This candidate retains G78 source repairs and all earlier published history; client/input/sound/render acceptance remains pending.

This G79 pairing also retains the latest canonical World Liquor 0.1.80 / PR53 TreasureBlock correction, including its distinct Java/client evidence scope. It is not a downgrade to the older G78 deployment family.

## Coherent G81 release-stop and jar projection repair

Grilling PR143 retains canonical G79 and integrates the proven nonterminal stop-before-leave race correction with PR142 jar-projection source. Both conflicting unpublished G80 commits/claims/history stay intact, and new output uses G81. The meal transaction detaches before rewards; complete/unknown clocks keep native priority. Existing jar groups translate in reflected model X to their saved hit cells, preserving all storage/UV/mask/interaction and lower tool data. Full logout event order and G81 client/audio/render acceptance remain pending with dot. T115/L82/private1020/Cookery160 remain paired, including the concurrent canonical living-effect repairs; this lock change adds no Tavern runtime changes.


## G82 current Java Cookery default-particle correction

Grilling PR144 corrects only suspicious stir fry seven stage palette textures, from directly reviewed official Forge/NeoForge Cookery1.6.0 generated-particle sources.99 qualifying palettes reviewed;98 already match. Original G81 gameplay/rack/stop fixes and T115/L82/private1020/BedrockCookery160 remain.14 Cookery catalog entries,3 Grilling particle providers, dynamic tint and native renderer acceptance remain explicitly incomplete. Unchanged source/functional evidence is reused; canonical full-family gates still precede live development deployment with dot/client pending.


## G85 finite projectile-dodge repair

G85 reserves finite200-tick charges before cancelling impacts and acknowledges
each native debit once. Admitted dodge precedes Grilling Invincible; depleted
protection retains its damage fallback. Original two-site portal audio, an owned
PLAYERS flatulence range16 alias,16 attempts, source vanilla logical-height
bounds and single-rider exit are paired without changing Tavern runtime.

Affected native cow/arrow evidence confirms1/200/401 capacities, fee/health,
lethal and combined-effect paths. Two sound API calls were accepted. A focused
actual-helper case confirms target-only exit and next-tick passenger-list
acknowledgement; a prior failed immediate-list measurement is retained and
explained by a separate native timing diagnostic. No source or core rerun was
needed for that measurement correction.

Impact-stage SKIP_ENTITY, ground/no-liquid/navigation/game-event equivalence,
custom dimensions, infinite durations, generic silence/category queries and
real client behavior remain separate limitations. The full goal remains active.
Canonical PR/check/merge and full-family admission are required before update;
client=false and production_ready=false remain until actual client acceptance.


## G86 sampled-body liquid and Hinder class repair

G86 adds a read-only whole-native-body liquid admission check after targeted
rider exit and before teleport. Liquid/waterlogged/source-carrier cells and
unknown reads reject the sampled attempt; remaining dry attempts retain the
original16-sample budget and independent fee/audio behavior. Post-exit dimension
and re-riding context changes close the attempted movement. Hinder now requires
the reviewed native LivingEntity mapping for both responsible actor and victim,
excluding health-bearing vehicles without adding positive-health/damage gates.

Original Forge and NeoForge whole-cell predicates are reviewed separately.
Actual AABB/current readback and selected fluid cases, including naturally
constructed upward/downward bubble columns, have scoped isolated evidence.
Full native movement/Hinder outcomes and family admission are recorded at their
own boundaries. Java downward support search, collision geometry, phase order
and actual client rendering/audio remain unfinished; no100% claim follows.
Tavern output stays at0.6.117; its lock/source notes pair the new Grilling runtime
and preserve other maintenance changes.


## G94 original flatulence sound origin and pitch

G94 restores the cue to the center of the player's floored BlockPos and rounds
pitch at the original random float cast, multiply and add. The actual producer
keeps impulse, ten Cloud particles at continuous coordinates, held-sneak edge
and independent sound failure handling. PLAYERS/range16/original host samples
and all G86 fee/movement/Hinder fixes are retained. No ground-table runtime
changes are included in this sound release.

Five new helper and five affected producer source-adapter cases passed. An
isolated native observation confirms actual cow location/float calculations and
existing sound-alias API acceptance with a normal stop and no players. It does
not exercise the new main consumer or certify packet delivery, physical sneak
input, heard audio or client rendering. Cloud attraction/Gaussian stages and
other portable movement gaps remain open. Full candidate Git/family/saved-world
admission is required before the standing live development update; client and
production_ready remain false. This pairing preserves canonical Tavern0.6.119
and World Liquor0.1.85, including concurrent drink-source fixes.

The initial87 sound proposal was superseded before merge/deployment after
concurrent diagnostic histories87–93 were discovered. Both sources and claims
remain preserved. This pairing uses the fresh94 canonical-source release and
does not import the diagnostic rendering or its conflicting historical locks.
