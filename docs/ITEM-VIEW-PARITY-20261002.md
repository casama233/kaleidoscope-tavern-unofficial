# Item-view parity audit, 2026-10-02

## Source and acceptance boundary

Tavern uses the SHA-pinned Java item models recorded in `art/source-jar.lock.json`
and `art/interfaces/item-art-map.json`. The item model, resolved parents and runtime
perspective overrides are authoritative; a placed block model or a same-named PNG
is not sufficient evidence of how Java displays an item.

This work does **not** certify complete client parity. Static contracts, Blockbench
preview, native BDS loading, and actual Minecraft client observations are separate.
No simulated players, production world changes, or live deployment are involved.

## Tavern 0.6.84 candidate

- All 14 paintings are Java generated sprite items. Previously the inventory used
  the placed wall model. Add same-ID item replacements with the existing source
  sprite. Preserve all wall/floor/ceiling geometry, states, drops and scripting.
- The same correction covers bell/blue/yellow pendant lamps, holder and tap:
  19 source-sprite routes total. Tap keeps native placement. The other 18 retain
  the established script-only `use_on: [{tags: "0"}]` barrier.
- Restore 74 geometric item routes: 14 sandwich boards, 16 stools, 17 string lights,
  barrel, 16 sofas, three cabinets, two racks, counter, glassware holder, table,
  pressing tub and trellis. Use dedicated Java item geometry/materials via native
  block `item_visual`; explicit items no longer force a flat icon.
- Preserve existing native versus scripted placement. Alias targets do not get
  `replace_block_item`; same-ID replacements do. Barrel/light registration-only
  placers cannot bypass multiblock or scripted placement.
- Every geometric route carries all eight Java display contexts. Missing left-hand
  context falls back to the right-hand context, as in Java. Unspecified transform
  channels use identity, not Bedrock's unrelated default. GUI auto-fit is disabled
  so source scale and translation are retained.
- Shaker remains a perspective-specific exception: generated sprite for GUI/fixed,
  3D for other Java contexts. Existing held/active matrix correction is preserved;
  dropped-item perspective remains unresolved.
- Guide source selection now respects Java's sprite/geometry mode. Painting textures
  under `block/deco/painting` no longer fall through to wall geometry; barrel's
  model atlas is no longer mistaken for a flat item icon. Offline geometric guide
  previews remain approximate (lighting, normalization), not Java screenshots.

`tools/item_render_contract.py` is the deterministic route/transform contract.
`tools/test_item_render_contract.py` is run by the aggregate release gate. Existing
placement, pickup, historical asset and protected gameplay checks remain enabled.

### Blockbench inspection

Official Blockbench 5.2.1 desktop opened the actual exported white-sofa geometry.
Display mode loaded the new third-person, first-person and GUI transforms, including
GUI translation [0.5,-0.25,0], scale 0.625 and fit-to-frame disabled. Geometry was
visible in all three inspected views. This preview lacked an automatically resolved
texture and is evidence of geometry/transforms only, **not** a texture or MC-client
acceptance result. Other items are covered by source contracts, not a claim that
all of them were individually inspected in the GUI.

## Cross-addon audit: still open

### World Liquor 0.1.46 baseline

156 item IDs: 129 generated sprites and 27 furniture models. All 129 sprite PNGs
match the pinned Java 1.1.9 pixels. The eight paintings already have same-ID item
replacements; correct PNG bytes alone do not establish native render-route behavior.

16 stools and freezer lack source-specific display transforms. Ten cabinet source
transforms happen to equal documented native defaults, but still need client checks.
27 generic furniture thumbnail renders ignore source GUI scale/translation/light.
Historical 1.1.8 freezer art differs from 1.1.9 (texture, elements and UV faces).
Do not silently label historical artwork as latest-Java parity. Cabinet display
categories and freezer dynamic ingredient/fluid/result rendering remain separate
behavioral gaps.

### Grilling 2.8.30 baseline

The verified Java 1.1.1 JAR and compiled item class show advanced rack is a generated
sprite item. Its existing 3D held override was derived from the placed-block model,
which is the wrong reference for item rendering. This needs correction and replacement
of the old test assumption.

Fixed skewer GUI sprites are intentionally substituted by Java's client renderer;
a base model's 3D GUI transform alone does not prove that flat icons are wrong.
Ground/frame geometry, dynamic/custom skewer composition, bottle non-held views,
pepper-sapling sprite route and plate content rendering need additional implementation
or client verification. Do not flatten all geometric items or convert all icons to3D.

## Client acceptance still required

Inventory/hotbar/creative; both first- and third-person hands; dropped stacks; item
frames; native/scripted placement; creative pickup; old saved stacks; native eating
and drinking; animation frame behavior; mobile input, skin and FOV differences.
BDS cannot demonstrate these rendering results. Tartaric-acid painting and some drink
icons still use complete static frame zero rather than proven native item animation.

References:
- https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_block_placer
- https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_item_visual
- https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/itemdisplaytransforms

### Independent review correction

0.6.83 was a frozen, unpublished candidate. Review caught missing explicit
unshaded face material routing;0.6.84 restores it for every geometric item and
adds a regression guard. The .83 identity is retained, never overwritten.
Java per-GUI gui_light:front is not implemented by a global face_dimming value;
per-GUI source lighting remains unverified/unported even when geometry/poses agree.

## Reconciled release state

World Liquor0.1.47 now resolves all27 native furniture routes, preserves129 sprite
routes and uses correct SINGLE cabinet item meshes. Geometry schema upgraded to
1.21.0. Latest1.1.9 artwork, GUI lighting and dynamic-content gaps remain.
Grilling2.8.32 removes the wrong rack attachable and preserves concurrent2.8.31
Board API acquisition. Reconciled16-pack BDS load/restart passes with the explicitly
labelled upstream_extended Cookery host; this is not an author-issued1.0.8 update.
Native client acceptance and production migration remain unperformed.
