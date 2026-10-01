# 0.6.75 — retained custom-effect HUD candidate

**Draft repair candidate; native JSON UI/client acceptance is still pending.**

The custom effect bar (including Bloody Mary) previously reused the native
ActionBar text every 20 ticks. A second continuous writer can replace that text
between every refresh. The old design explicitly did not support this case.

This candidate gives effect messages a namespaced prefix and adds a retained
text control outside the ActionBar-reset factory. The factory is only a transport
input. Unrelated packets, including Java Saturation's `!js.` data, do not become
the stored effect text. Expiry/milk/death and opt-out clear the owned view;
reconnect resets its display without changing authoritative effect storage.

No native effect aliases, title/subtitle writes, player.json, or third-party
pack modifications are introduced. Original shaker slot/progress and ordinary
ActionBar hints remain separately filtered/rendered.

Checks distinguish a model of retained packet semantics from actual Minecraft
JSON UI execution. The 11 new regression tests and existing 27 effect-bar tests
are not an engine rendering test. A continuous writer may still overwrite a
packet before the client captures it. Simultaneous third-party HUD behavior,
clear delivery, reconnect, GUI scale and mobile rendering need native acceptance.
Do not call this live-fixed based on BDS startup or these unit checks.

Paired World Liquor: 0.1.40. Existing pack UUIDs and gameplay storage are unchanged.
