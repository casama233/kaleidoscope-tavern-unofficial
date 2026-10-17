# Explicit current approved runtime retention

An AMW-only family update can retain an unrelated public component's currently installed release while its canonical main contains newer runtime. This is an assembly-only selection. Canonical source paths, clean/current main identities, upstream lock, release history and completion holds remain unchanged.

Set approved_runtime_retention in the update config to an absolute JSON control path. The control has schema1, the exact eight AMW/Novelty/ecology/renderer UUIDs as allowed_changed_uuids, the captured current policy SHA256, the current policy's approved_receipt path/SHA256, and sources mapping public component keys to an absolute detached source snapshot path and its exact published commit. Snapshot paths must stay outside output, current source and live pack data.

The verifier checks all42 current pack maps, versions and reference order against that approval, its original build/static/actual CI evidence, committed baseline and runtime bytes, canonical ancestry, and clean current canonical states before and after selection. The selected commit remains labeled as the historical published runtime. It is never called current main. Current canonical CI and the retained runtime's original actual CI are recorded separately in static evidence.

Assembly uses only verified copies of the source map and in-memory owned runtime metadata. All dependency and host-extension processing still runs normally. The completed candidate must retain every one of the34 non-target byte maps/versions and the current complete reference order. Any approval, source, control or output drift fails closed. The default path without this option is unchanged.

This control does not update or release a completion hold, authorize private runtime acceptance, invent client approval, or substitute historical native logs for a new changed family. Required static/native/fresh-saved gates still apply.

Regression fixtures use synthetic JSON and small real Git repositories, including an actual family assembler run. They never launch BDS or connect player sessions.
