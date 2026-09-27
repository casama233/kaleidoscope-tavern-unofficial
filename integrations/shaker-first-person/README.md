# First-person shaker animation hotfix

The user confirmed the cup is visible while idle, but disappears/stops moving while shaking; third-person shaking works. The current third-person player animation unconditionally resets/rotates `rightarm`, which is also a parent of the first-person held-item attachment. This is the identified render-pose conflict; device acceptance is still pending.

The source fix removes the unconditional reset. The first version used `q.is_first_person`; the follow-up user clip still showed large arm-like excursions. The updated version uses the native player controller’s `v.is_first_person`. Every arm rotation channel returns zero in first person and `target - this` in third person, preserving the Java third-person target after additive blending. Existing attachable hold/shake animation, native hold/release logic and recipes remain unchanged.

This temporary PBR-declared RP overrides `animations/runtime_shaker.animation.json` for live Tavern 0.6.56, without replacing any player entity definition. Version 1.0.1 also adds non-positional `.local` shaker/end sound events. Two matching server script hotfixes send these only to the operator; nearby other players receive the original positional events once. Do not deploy the script sound change without this resource update. It must be above the Tavern RP. The same change is present in the source runtime; remove this temporary overlay once a normal Tavern release containing the fix is deployed, so it cannot shadow future animation changes.

Validation: `python3 tools/check_shaker_first_person.py`, `python3 tools/check_motion.py`. These are resource/pose checks, not client rendering or simulated-player tests. Actual acceptance requires normal idle cup visibility, visible first-person shaking, unchanged third-person shaking, and normal return on release/switch slot.

References:
- Java: ShakerAnimation.java (source in /root/tavern-official-current).
- https://learn.microsoft.com/en-us/minecraft/creator/documents/molang/syntax-guide
- https://learn.microsoft.com/en-us/minecraft/creator/documents/animations/animationsoverview

Follow-up evidence: user video 20260927-0616-20.8170473.mp4, shaker visible intermittently below screen edge; sampled left-channel RMS exceeded right by up to 8.6 dB during shaking. Neither perspective repair nor audio balance is accepted as fixed until another real-client check. Original player controller uses `variable.is_first_person`: https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/animation_controllers/player.animation_controllers.json . Official sound schema defines `is3D`: https://github.com/Mojang/bedrock-schemas/blob/main/schemas/rp/sounds/index.schema.json .
