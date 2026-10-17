# Tavern Board Font

Derived from GNU Unifont **15.0.06** by Roman Czyborra, Paul Hardy and the contributors listed in `README-Unifont.txt`. Distributed here under the SIL Open Font License 1.1; the upstream also offers GPL with the font embedding exception. See `COPYING-Unifont.txt`, copied unchanged from the source distribution.

Inputs:

- https://unifoundry.com/pub/unifont/unifont-15.0.06/font-builds/unifont-15.0.06.hex.gz
- License/readme: https://unifoundry.com/pub/unifont/unifont-15.0.06/unifont-15.0.06.tar.gz

`python3 tools/build_board_font.py` requires Pillow and regenerates the committed board atlases and advance widths from `unifont-15.0.06.hex.gz`. Normal package builds need no font tooling. The generator crops glyph ink, preserves full-width East Asian cells, excludes private-use characters, and uses the existing board renderer's 16-pixel UV cells. Modified atlases are called **Tavern Board Font** and retain the font license. No Minecraft bitmap-provider textures are inputs.
