# Preserve historical tests across the 0.6.120 completion repair

The new test-only functional layer binds the exact reviewed current mixology
and bottle adapters back to the exact 0.6.119 predecessors. The original 0.6.119
review then restores its earlier predecessor and all existing historical
preimage/golden guards stay intact. Six mixology, eight bottle and 3 pickup-feedback line deltas
are explicitly reviewed; no earlier review, historical hash or preimage is
rewritten. The new drink-completion module is a separately bound addition.

Layers append newest releases and project newest-to-oldest. Each step checks
its exact current hash, ordered/in-bounds/nonoverlapping reverse operations,
and exact predecessor. Unknown bytes and corrupted predecessors still fail.
This code is never used in packaging, assembly, runtime or live deployment.
The actual current callbacks are tested independently, including the four
counterexamples that fail against unmodified 0.6.119.
