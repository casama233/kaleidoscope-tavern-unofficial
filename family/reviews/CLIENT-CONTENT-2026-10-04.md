# Client content errors: 2026-10-04

The owner reported an undefined Grilling seasoning material and cascaded
missing held/placed material aliases after the 2.8.59 live update. Grilling
2.8.61 removes the custom material dependency entirely. Its existing atlas
is sampled by per-color geometry with fixed UV coordinates and native
`entity_alphatest_one_sided` materials. All 177 colors in all 16 held/placed
layers are checked to stay within their assigned palette tile. No additional
texture handles, shader UV flags or material registration are required. The
canonical generators preserve the original shapes, fill ordering and motion.
The family lock pairs the exact new source trees. Client logs are private
evidence and are not committed here.

The custom yellow croaker in the private integration also read the native cod
animation variables without initializing or driving them. Private integration
1.0.14 initializes those variables and advances its phase from entity lifetime
before the existing interpolation and vanilla cod clips. Geometry, textures,
controllers and the existing freezer/recovered repairs are retained. The
paired ChineseFood renderer cache variant advances to 1.0.10414. Private
source/native validation is required independently of these public PRs.

The isolated `header -> version: invalid string` message has no pack identity.
All 41 active live pack headers have three-integer versions; no attribution
to a server pack is established. It remains unresolved pending identifiable
client context, rather than being declared fixed by the manifest checks.

Full-family native loading, a fresh stopped-world rehearsal, admission and
post-install byte checks remain required. Client material loading and fish
animation acceptance remain pending after deployment.
