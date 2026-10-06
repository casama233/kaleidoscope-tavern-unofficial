# Traced native continuation, evidence and correction

Frozen 107 source: 44ff345e2aaa528b42012ec21443ae29ea6ee7ff.
Canonical 107 archive SHA256: 403ad4366dbaeff93b4cb5bc8e8477bddff833de44428a468f6f2a4162e98086.
Safe diagnostic source: 7968ce9b21acd027a0964a0befddc72e19ba2f16.
Diagnostic BP-pair archive SHA256: 2582d7860b91c9f80f634c4468e41ce1dc8eaba145deb8ef435f0692c8c27533.
No raw log, screenshot or private world is included.

Actual Minecraft 1.26.52.3 x86_64 input at 2026-10-06T01:42:48Z:
Creative glassware stack 16, one Shift/right-click lasting 100 ms, fixed pose,
verified clear virgin location. Root observed two cups. Original trace seq1–27
are complete. Ignore replayed dump duplicates and its single truncated tail.
There are zero C2 warnings in this current trace; three earlier warnings found by
the initial multi-file filter belong to a historical log and are excluded.

Relevant original rows, all transaction callbacks in tick 40274:

- seq2: playerInteractWithBlock, raw true, far ground block, queues far cup
- seq6–8: itemUse ray hits nearer ground, but owned echo=true suppresses fallback
- seq9/11/13: raw false, same far block; pending block-scoped claim suppresses them
- seq15–18: raw false, same item/slot/sneak/pose/tick, near ground block; block key
  differs so 107 normalizes false to true and queues a second target
- seq19–22: far cup execute succeeds and settles; current near claim is pending
- seq23–26: near cup execute succeeds and settles
- seq27: SneakReleased at tick 40277

This corrects the preliminary after-settlement hypothesis: the real second
placement was queued while the first was still pending. It also separates this
cause from the already repaired itemUse fallback source counterexample.

The 108 repair uses the raw false flag plus recent owned identity independently
of target/face. It does not remove error messages or transaction checks. Test
coverage replays these exact callback flags/order/tick with production modules
against explicit API doubles. Those tests are not a native acceptance result.
Root must replay the exact frozen 108/69 pair with diagnostic packs disabled.
