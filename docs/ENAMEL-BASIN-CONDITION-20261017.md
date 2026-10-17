# Cookery 1.6.1 enamel basin condition admission

The clean Cookery 1.6.1 BP declares five geometry permutations. Its open
middle-level permutation repeats the low-level `1..10` condition, so it overrides
the low geometry and leaves `11..20` using the default lidded geometry. Oil state
encoding remains `oil_low + oil_high * 11`; the existing script and models are
not changed.

The private P49 declaration targets only
`blocks/kitchen/enamel_basin.json`, changing the middle permutation's lower and
upper bounds to `11` and `20`. A unique condition/geometry prefix permits one
byte-preserving replacement. The consumer also verifies that parsed JSON differs
only at `minecraft:block.permutations[3].condition`.

- Author archive: `5b01865d4dd9a455cd80dae4ddc94dc45964e074025f7d24c6f0c5e35f0fbe52`
- Original block: `c8d09a76dc06316c61010568539a4e791c1d20e2d92e11e79d425a988458faab`
- Repaired block: `fe86d6cec01398f9ef9d02ad0e48212e2a31a11a2aed974464b26c6fc10cdf30`
- Canonical declaration digest: `067c9dad99a72eef99533c0891c40a32cba12c45d840ca7b7dcf8a33af3293a9`

The exact stable-author profile requires the existing public API receipt and
canonical private owner P49. Unreviewed operations, different paths, changed
hashes, expired declarations and symlinked input paths fail before writing.
Author UUIDs, manifests, scripts, models, collision boxes and all other block
bytes remain unchanged. The source archive remains immutable.

P49 carries the exact P48 ChineseFood and Nether declarations via a finite
`retained_host_profiles` map. Their component owner remains P48, while the family
receipt records source package P49 and the retained declaration's original
commit and hash. Existing validation of those P48 source/output profiles still
runs. This does not regenerate their manifests or Saturation companion bytes.
The public Tavern runtime remains 0.6.173; this PR changes family tooling only.

`test_enamel_basin_extension.py` uses synthetic source fixtures, not author files,
to evaluate every declared state: both lid values, three high digits and eleven
low digits. It detects the original 20 wrong open-state selections and zero
after the repair. Closed states, empty state and open totals 21..32 preserve their
existing geometry. Admission, failed writes and retained assembly routing have
separate regression tests. The exact consumer was also exercised locally against
the pinned clean author block and produced the recorded repaired hash.

The existing Java upstream index has no Cookery entry. This repair makes no new
Java-parity claim. These are source/static checks; native loading, saved-world
migration, rendered client acceptance and deployment are separate gates and
are not performed by this tooling PR.
