# 0.6.73 — Luminous Bride storage material

- Match the Java cutout/inside-shell effect in racks, cabinets and thrown displays by selecting the native one-sided alpha-test material only for Luminous Bride.
- The storage helpers previously used double-sided alpha testing, unlike the existing single-sided placed bottle. Backfaces filled the bottle with an opaque cyan panel and hid the interior effect.
- Preserve textures, geometry identifiers, storage indices, orientations, offsets, hit detection, UUIDs and saved data.
- Keep all four geometry files and all textures byte-identical. Add exact asset hashes and real binding regressions for five storage families plus thrown drinks.
- Static checks and BDS loading are separate from Minecraft client acceptance. No client acceptance is claimed by this release.
