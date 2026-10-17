# 0.6.156 — restore glassware aim selection

The user reports that previously working hanging-glass pickup is reversed again. T131 changed direct Touch to prefer the old Down-face event correction instead of the pre-existing eye/selection-box intersection. The current LIVE diagnostic rows confirm Touch takes that event path. The old tests asserted the same assumed mirror and did not guard the prior working input-selection order.

Restore the pre-T131 aim preference for every input mode, retaining native-hit fallback when the eye intersection is unavailable. Preserve the existing saved-state/render compensation, geometry, slot IDs, native ItemStack storage and all other furniture behavior. This is a narrow restoration of the previous selection decision, not another axis flip or a world-data migration. Direct touch follows the eye target, as before T131; independently tapping away from that target is not a newly validated capability.

The production-event regression fails on the prior adapter and passes with the restoration; existing furniture interactions and four-facing holder insertion/removal checks pass. Full canonical CI and complete-family save/admission/deployment are separate requirements. Human pickup still needs confirmation. The user also reports UI regression; its current missing/appearance/timing symptom has been requested and no further UI change is guessed in this release. T155/G133 UI bytes are unchanged. `client=false`, `production_ready=false`.

Paired World Liquor 0.1.133 changes identity/dependencies only. Grilling remains 2.8.133. Java read-only author status checked 2026-10-13T10:23:04Z; this restores the Bedrock input adapter, not Java recipes or assets.
