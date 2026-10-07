# Frozen development candidate 0.6.118

The first local freeze was completed before the independent entry-point review.
Review found that the new optional RNG argument to completeCocktail received
the native custom-component parameters object through the direct registration.
The actual registration regression reproduced container return with missing
effects and a TypeError. This candidate was not released or installed in live.

Preserve its original immutable release claim/history. The corrected callback
wrapper and native-registration regression are released with a new identity,
0.6.119; the frozen 0.6.118 identity is not reused for different runtime bytes.
