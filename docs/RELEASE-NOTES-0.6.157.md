# Tavern 0.6.157 — shaker interaction diagnostics

Players report that wine insertion does nothing in a newly placed empty shaker while empty-hand pickup works. Existing error logs cannot distinguish an interaction that never reached insertion from a rejected transaction. Eating and mixology graphics also remain absent; this release does not claim either problem is fixed.

Keep the latest 24 primitive shaker interaction facts in memory: item identity, event stage, secondary-use bypass, foreign cancellation, unknown ingredient, unreadable hand and settlement result. No lore, arbitrary dynamic properties or inventory contents are logged. All gameplay decisions and UI resources retain their existing behavior.

The server console can run `scriptevent kaleidoscope_tavern:shaker_diagnostics snapshot` to read the trace, current main-hand identity/quantity, target, registry state and HUD send/error counters. Only a server-origin event with the exact `snapshot` message is accepted. Reading diagnostics does not mutate world, inventory or HUD state; send counters are not proof of client rendering.

Validation: the existing shaker interaction suite, including a new operator-only/read-only diagnostic regression, passes locally. Required source CI, complete-family stopped-save rehearsal, admission and deployment are recorded separately. Human insertion and UI acceptance remain pending.
