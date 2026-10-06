# 煙火來源更新與 live 完成門檻

本次來源鎖指向已凍結 Grilling 2.8.73 的 BP/RP；它同步源碼，不代表已安裝。酒館／世界名酒與私有整合 runtime 不改動。

使用者本輪要求森羅煙火 100% 還原 Java（音效、邏輯、特效、細節）完成後再更新 live。這項具體要求適用於本輪煙火修改；不能以先前「每候選更新 live」的通常流程替代此完成門檻。完整 Java 一致尚未成立，本輪不部署中間版，不將 client 或 production_ready 標為 true。

[Grilling PR #137](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/137) 修復普通串傷害路徑、致死回饋與原生暫存生命判定，並記錄實際 BDS 結果。穩定 API 不提供剩餘吸收值，因此部分已消耗護盾的致死判定仍不精確；CapsLock、個人準星、原版新要塞來源、一般 Java 回呼及全部聲畫仍有開放缺口。它不是 100% 完成版。

完整目標與驗收條件：[Grilling 完整目標](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/fix/java-fidelity-20261006/docs/JAVA-FIDELITY-GOAL-20261007.md)。只有實際滿足此條件，或使用者明確調整平台替代範圍後，才進入既有完整家族部署程序。

相同不可變候選已有成功 CI／原生證據會重用；發版、原包、候選、停服備份／存檔及部署邊界的必要准入仍保留。文件與來源鎖變更不需要為酒館換包或重啟。
