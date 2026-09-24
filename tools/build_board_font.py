#!/usr/bin/env python3
"""Build redistributable Tavern board glyph atlases from GNU Unifont 15.0.06.
Requires Pillow only when regenerating art; normal release builds use committed PNGs.
The world transforms and the renderer's 16x16 glyph cells are unchanged.
"""
import gzip,json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];RT=ROOT/'runtime'
glyphs={};advances={};bold={}
# Preserve full width for East Asian ranges used by the original board layout.
ranges=[(0x3001,0x30ff,15),(0x3200,0x9fff,15),(0xac00,0xd7af,14),(0xf900,0xfaff,15),(0xff01,0xff5e,15)]
for line in gzip.decompress((ROOT/'art/fonts/unifont-15.0.06.hex.gz').read_bytes()).decode().splitlines():
    code,data=line.split(':');cp=int(code,16)
    if cp>65535 or 0xe000<=cp<=0xf8ff:continue
    width=len(data)//4;im=Image.frombytes('1',(width,16),bytes.fromhex(data)).convert('L');box=im.getbbox()
    left,right=(box[0],box[2]-1) if box else (0,-1)
    for first,last,edge in ranges:
        if first<=cp<=last:left,right=0,edge;break
    cell=Image.new('L',(16,16));w=right-left+1
    if w>0:cell.paste(im.crop((left,0,right+1,16)),(0,0))
    glyphs[cp]=cell;advances[cp]=w//2+1;bold[cp]=.5
for cp,advance in [(32,4),(0x200c,0)]:glyphs[cp]=Image.new('L',(16,16));advances[cp]=advance
missing=Image.new('L',(16,16));ImageDraw.Draw(missing).rectangle((0,0,9,13),outline=255,width=2)
for page in range(256):
    alpha=Image.new('L',(256,256))
    for low in range(256):alpha.paste(glyphs.get(page*256+low,missing),((low%16)*16,(low//16)*16))
    out=Image.new('RGBA',(256,256),(255,255,255,0));out.putalpha(alpha);out.save(RT/f'RP/textures/board_font/glyph_{page:02X}.png',optimize=True)
(RT/'BP/scripts/data/board-font.js').write_text('// Tavern Board Font: GNU Unifont 15.0.06 derived advances, in Java font-pixel units.\nexport const FONT_ADVANCES='+json.dumps([advances.get(cp,6) for cp in range(65536)],separators=(',',':'))+';\nexport const FONT_BOLD_OFFSETS='+json.dumps([bold.get(cp,.5) for cp in range(65536)],separators=(',',':'))+';\n')
print('256 GNU Unifont board atlases generated; no Minecraft bitmap-provider glyphs.')
