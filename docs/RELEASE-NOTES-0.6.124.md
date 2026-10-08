# Guide startup cost repair

LIVE 0.6.122 on 2026-10-08 recorded Tavern startup spikes of 815, 1084,
250, 1777 and 1771 ms; Cookery's largest was 4796 ms. Warnings stopped after
initialization. These observations do not establish a steady-state TPS or power problem.

The optional publisher eagerly built a chapter before a host was detected, then
rebuilt, canonicalized and encoded it on every repeated host-ready notification.
The UTF-8 splitter also allocated/iterated a string for every character.

0.6.124 prepares only after readiness, caches by explicit registry-refresh
generation, and retains host-ready retransmission of exactly the same packets.
A change during preparation still triggers the latest complete chapter afterward.
Slicing uses code-point-safe offsets; preparation yields with a 2 ms scheduling
budget and at most 16 steps per callback. Projection, JSON serialization and
canonical digest remain indivisible stages: 2 ms is a scheduling target, not a
hard bound. Diagnostics expose preparation count, slices and maximum slice time.
No recipes, locales, guide navigation or gameplay tick cadence changed.

Local verification uses the existing guide suite plus one scheduler regression
covering no-host operation, unchanged ready replay, concurrent refresh, Unicode
round-trip and cancellation. Direct comparison against 0.6.122 with World Liquor
produced identical 360 packets. Native family startup/restart and stopped-world
migration remain deployment requirements; no client-render or full Java parity
claim. Cookery's own startup and World Liquor's synchronous SDK preparation are
separate remaining hot paths.

Unreleased 0.6.123 is superseded: packaging caught an unsynchronized guide payload version. Its frozen release identity is retained and was never deployed.
