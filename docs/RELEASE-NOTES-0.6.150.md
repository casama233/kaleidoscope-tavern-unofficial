# Tavern 0.6.150

Legacy API page imports previously generated the full canonical guide
synchronously during module evaluation. The canonical build now generates the
21 products used by those pages, preserving all 28 page objects byte for byte.
The seven guide entrances and the complete guide producer retain their existing
content, recipes and ordering. This work does not move generation to the first
player who opens a book.

`node tools/build_legacy_guide_projection.mjs --check` rejects a stale product
projection during the existing release check. Its inputs are the current guide,
recipes and the two actual declarative page consumers. The independent T149
fixture retains the old page output and its source commit.

The runtime and public SDK quote strings with native `JSON.stringify` in chunks
of at most 1024 UTF16 units. Valid surrogate pairs remain together; empty
strings, control characters, lone surrogates and long keys retain exact JSON.
Object order, checksums, packets and atomic publication are unchanged by this
serializer change. The paired release identity and guide version advance to
0.6.150.

Targeted local guide, standalone, startup preparation and legacy page checks
passed. Pure Node output equivalence does not establish Bedrock startup
performance or client rendering. Native startup and client acceptance for this
release remain pending; the existing live T149 bytes have not been changed.
