# 0.6.121: restore verified native storage helpers

A moved invisible inventory helper could permanently block a cabinet while its
original nine item stacks remained intact. Verified owned helpers now return
to their one recorded owner block. Identity, scoped ownership, every slot,
layout and the loaded block must all agree first. Unknown, missing, foreign,
replaced and corrupt ownership stays rejected. No inventory, ownership record
or item metadata is recreated or rewritten by the repair.

Read callbacks retain their strict position check and only enqueue recovery;
the write runs afterwards with fresh proof. Loaded helpers use a bounded
maintenance index. All existing native storage key families, including placed
drink displays, are covered; the addon does not depend on luosen or AMW.

Native observer cases verified restoration after a 445.5-block displacement,
refusal of foreign token/missing slot/missing block, and queued restoration
after saving and restarting the same entity. Original observable item metadata
and record bytes survived. The observer did not demonstrate nonzero velocity
clearing. It used no players and is not client or complete family acceptance.

The optional family saved-world scene explicitly loads selected cabinet chunks
in the fresh stopped-copy rehearsal and requires the same persisted identity,
ledger and full native item NBT in both load phases. Real world coordinates and
data remain outside this public repository. Full family gates and human client
acceptance remain separate. See NATIVE-STORAGE-REANCHOR-PROTOTYPE.md.
