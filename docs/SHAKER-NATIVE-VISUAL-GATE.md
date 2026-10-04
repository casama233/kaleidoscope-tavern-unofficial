# Shaker native visual acceptance (pending)

This source gate admits bounded human observations only. No native recording is supplied with this change. The generated template has 216 `not_run` cases; it is not acceptance evidence. Camera/near-plane calibration stays `unknown`, and `full_clip_volume_proved` stays false even after visual admission. Existing .92/1.0 source diagnostics remain diagnostics.

The fixed capture scope is classic/slim skin × original 1180×792 / actual 16:9 viewport × measured low/60/high world FOV × first person / third-person front / third-person rear × level / upper pitch limit / lower pitch limit × standing / walking. Low and high are the actual available settings below and above 60, recorded in the receipt. Main right hand only. Record graphics mode, view bobbing and dynamic FOV. This scope makes no claim about other platforms, custom skins, VR, offhand or intermediate FOVs.

## Prepare locally

Keep config, receipts, video, raw frames and named reviewer records outside the Git checkout. Copy `SHAKER-NATIVE-VISUAL-CONFIG.example.json` to a private directory and replace every path. `family_receipt` and `tested_family_receipt` are paired-family inventories containing complete per-pack `files` maps, UUID, side, version and both pack orders; `family_root` and `installed_family_root` contain UUID-named behavior/resource pack directories and the real `world_behavior_packs.json` / `world_resource_packs.json` order. Include every candidate export under opaque `export1`, `export2`, etc. Decoder paths refer to trusted local executables.

Set canonical version before testing. Commit source/runtime changes first; prepare refuses dirty source/runtime. Run:

```text
python tools/check_shaker_visual_acceptance.py template --output <private>/pending.json
python tools/check_shaker_visual_acceptance.py prepare --config <private>/config.json
```

`template` only generates blank rows. `prepare` writes a new receipt named by config and binds current commit, complete BP/RP trees, complete paired-family contents/order, real installed order and every export byte hash. It leaves every case `not_run`; it never grants a pass. Neither command overwrites existing receipts. Delete or rename the separate generic template before choosing the same target for prepare.

## Capture and review

Use the actual native client and installed stack. Record the complete window without cropping, scaling, compositing or interpolation. Show client version, classic/slim selection, actual FOV, viewport dimensions and pack stack in the original recording; identify those raw frame indices in each case. Keep settings proof and actions in the same recording. Record at least 12 fps without gaps (prefer 60 fps); 4 fps contact sheets are insufficient. Recordings may contain several cases, but their action frame ranges cannot overlap, even under aliased video IDs.

For each case record idle, use start, at least three seconds of sustained shaking, and return to idle. For level/standing cases also record cancellation, natural completion and re-equipping. `segments` are inclusive decoded video frame-index pairs; `frame_range` covers the complete action case. `reviewed_intervals` must cover that range exactly once, with no gaps, and `reviewed_frame_count` must agree. Human review covers every captured action frame and all visible model contours, including transitions, size behavior, arm/socket attachment and render errors. Third-person observations require an unobstructed cup view; unclear occlusion is inconclusive.

Record actual gameplay `viewport_rect` as [x,y,width,height] inside the full recording. Measure the minimum complete-cup contour gap at all four viewport edges across the entire case, with pixel uncertainty; each gap must exceed that uncertainty. A corner/sample alone cannot establish a pass. Mark unresolved contours, clipping, missing transitions or mismatched settings as `fail` or `inconclusive`.

Catalog each private original recording with a random UUID key, `kind: native_recording`, `origin: native_client_capture`, safe relative path and SHA256. Extract full-resolution PNG frames directly from that recording without edits; catalog each under a different UUID with `kind: raw_video_frame`, `origin: decoded_native_recording`, path, SHA256, `video_id` and zero-based `frame_index`. Each case needs these frame roles: left_edge, right_edge, top_edge, bottom_edge, use_entry, shake_sample, return_idle, skin_setting, fov_setting, viewport_setting, pack_stack. Frames can represent several roles where appropriate; edge/action frames must lie in their case/action intervals. Contact sheets are optional private review aids and are never evidence catalog entries.

The checker uses [ffprobe frame timestamps/dimensions](https://ffmpeg.org/ffprobe.html) and [ffmpeg framehash](https://ffmpeg.org/ffmpeg-formats.html#framehash) in RGB24 to match PNG pixels to decoded original frame indices. It rereads file/package hashes after decoding. Missing decoder, files, settings, cases, frames, review coverage, or any outcome other than `observed_pass` blocks admission.

After completing the receipt, an actual reviewer separately supplies a private review record containing schema 1, kind `human_native_review`, exact receipt SHA256, decision `approve_scoped_observations`, private `reviewer_identity`, opaque `reviewer_id` matching all rows (e.g. r001), sorted complete `case_ids`, and timezone-aware `reviewed_at`. A separately supplied `native_review_registry` (schema 1), outside checkout and media root, maps that exact receipt hash under `approved_reviews` to `record_path` and `record_sha256`. The record path is relative to the registry directory. There is no automatic review creation/approval command. Changing the receipt requires a new actual review binding. Hashes prove binding and integrity; they cannot prove that a dishonest operator captured Minecraft. Production must trust the independent reviewer registry.

## Check and publish

```text
python tools/check_shaker_visual_acceptance.py check --config <private>/config.json --summary <new-public-summary.json>
python tools/check_release.py --require-native-visual --native-visual-config <private>/config.json
```

Exit 2 / blocked means pending or failed; exit 0 with `observed_scope_pass` requires complete local evidence and independent review. A top-level true flag, a reduced matrix, synthetic fixture record or contact sheet cannot admit. Synthetic unit tests exercise helpers only and generate no successful production receipt. Do not relabel or submit their fixtures.

Only the derived summary may be published: opaque reviewer/case IDs, commit/pack/export/receipt/review/media hashes, recorded coverage, measured gaps and scoped outcomes. Private media, file paths, reviewer names, logs and original receipt stay local. The summary preserves evidence identity through hashes. Source/static `check_release.py` defaults to native NOT_RUN; production promotion must explicitly require this gate. `--require-shaker-camera-calibration` is an optional research gate and is not a prerequisite for these observed-scope results.

A later explicit tested-commit ancestor is accepted only through baseline/history/docs-only changes and identical complete BP/RP, paired-family file maps, installed order and raw export bytes. Family receipt source metadata may change during freeze; tested receipt identity remains pinned. Any runtime, export bytes or installed stack change requires new capture/review. Animation-only equality is insufficient.
