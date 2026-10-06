# 煙火目前範圍與 live 部署要求

來源鎖同步 Grilling 2.8.77 BP/RP，保留酒館 0.6.114、世界名酒 0.1.79 及現行 Cookery 1.6.0／私有整合。來源鎖更新本身不代表已安裝。

已保留 PR205 的世界名酒修復及通用 source-hold 准入工具；只撤銷其依据本輪較早指示登記的 Grilling 2.8.72→2.8.73 部署保留，原因為下述使用者明確調整。其他來源的完成門檻不因本輪自動解除。

使用者原先要求 100% Java 一致後更新 live；其後明確回覆「接受明列的平台差異，繼續完成其餘可移植部分」，並補充「重點是無任何邏輯 BUG，客戶端驗收可以交給 dot」。因此原先阻止中間 live 更新的門檻已按使用者指示調整：完成可移植邏輯修復、canonical PR／CI／合併和完整家族 static／BDS／本次停服存檔演練後，必須依既有持續授權更新 live，供 dot 完成客戶端驗收；不重複索取部署許可。

[Grilling PR137](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/137) 修復普通串原生傷害、致死回饋與暫存生命判定。[Grilling PR138](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/138) 整合瓶子剩餘狀態／分層／取回、Java 100 tick 熱期限，以及 lore 容量和熱度資料保存。全部現有存檔精確熱期限在讀取時保留，正常再加熱／合併才寫新原作期限。25 個真實物品／容器案例及重啟後 25 筆資料通過，沒有模擬玩家；這不代替真人聲畫。

完整來源、平台差異、歷史分支身份衝突与驗證範圍見 [Grilling 2.8.74](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/STATUS-A2.8.74.md) 與 [目前目標](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/JAVA-FIDELITY-GOAL-20261007.md)。剩餘吸收值、CapsLock／麻木準星、原版新要塞來源、任意 Java-only 回呼、動態背包模型和原生 fluid／聲畫引擎差異仍明列。

部署前取得完整收據、正常停服一致備份、回退包及本次保存檔演練；只登記本候選收據的 deferred_client_acceptance，通過 canonical／BSM family_guard 後安裝。部署與未知 BUG 零風險都不能由 hash 證明；沒有真人驗收時持續保留 client=false、production_ready=false、pending_client_acceptance。

相同不可變候選已通過的 CI／原生證據重用，不為了相同 hash 反覆重測。純文件／來源鎖變更不為酒館另換 runtime 或重啟。

## Coherent G77 candidate

Grilling PR141 starts from canonical G74, combines reviewed Git differences from corrected peer G76 (`ce7b75171537877ba92d1ec7c3ed92e33d10a4d6`) and seasoning/output PR140 (`9c33d3f5fa65db1b0701ee25cb1d0f6a0b1b7766`), and fixes the additional real native RawMessage key-order expiry rollback. Both conflicting unpublished G75 identities and their original branch histories remain intact; canonical output takes a fresh G77 identity. G73 health/audio feedback and G74 bottle/icon/heat repairs survive. World Liquor 0.1.79 and private integration 1.0.20 remain paired.

Bounded Grilling evidence records twelve real item/storage cases, all 128 legal native rack state/facing combinations, two expiry cases and thirty-one persisted item records after normal restart. These checks do not certify input, audio, rendering or multiplayer acceptance. Owner-accepted platform differences remain explicit; client=false, production_ready=false, pending_client_acceptance. Complete family CI/static/BDS/fresh stopped-world rehearsal and exact live readback are still required.
