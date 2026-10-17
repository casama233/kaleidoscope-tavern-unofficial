# Tavern 0.6.154

The public foundation SDK now rejects unrelated Tavern event IDs before reading
their message or parsing JSON. Large extension transfers previously paid those
costs despite being unable to change foundation state. Cabinet requests,
matching acknowledgements and effect snapshots retain their original source,
size, revision and validation checks. The matching World Liquor release vendors
the same SDK files; no client-only patch is required.

Runtime and SDK UTF-8 byte counters read string UTF-16 units directly, avoiding
the previous per-codepoint strings. Valid surrogate pairs still count as four
bytes and lone surrogates as three. The existing non-string iterable behavior
is preserved. Packet bytes, byte limits, checksums, acknowledgement timing and
scheduling do not change.

Targeted source checks cover every UTF-16 unit and surrogate boundaries against
the independent Node Buffer oracle, full guide packets, transport integrity,
unrelated event IDs with unreadable payloads, and all three foundation channels.
Existing cabinet ownership handoff and effect snapshot checks also passed.
The complete required suites belong to the paired canonical PR CI.

These changes address later transport work observed in native profiling. The
profiler started after the initial eight startup spikes, so this release does
not claim to resolve or identify those spikes. Native performance, saved-world
loading and human UI acceptance remain separate verification scopes. Watchdog
thresholds, prior gameplay repairs and pack UUIDs remain unchanged.

Paired pack, module, build and guide identities advance to 0.6.154. The T153
deployment and its receipts retain their original scope; this candidate does
not inherit client acceptance or a complete Java parity claim.
