"""Only explicit, non-destructive visual-inspection commands. No world edits/tick loops."""
from __future__ import annotations
import re
from pathlib import Path
from interface_common import read
COORD = re.compile(r'^(?:[~^](?:-?\d+(?:\.\d+)?)?|-?\d+(?:\.\d+)?)$')

def make_command_validator(root: Path):
    def ids(folder,key):
        return {read(p)[key]['description']['identifier'] for p in (root/folder).glob('*.json')}
    items = ids('VisualLab_BP/blocks','minecraft:block') | ids('VisualLab_BP/items','minecraft:item')
    entities = ids('VisualLab_BP/entities','minecraft:entity')
    particles = {read(p)['particle_effect']['description']['identifier'] for p in (root/'RP/particles').glob('*.json')}
    p=root/'RP/sounds/sound_definitions.json'
    sounds=set(read(p)['sound_definitions']) if p.exists() else set()
    def valid(command: str) -> bool:
        t=command.split()
        if not t:return True
        if t[0]=='give':
            return len(t)==4 and t[1]=='@s' and t[3]=='1' and t[2] in items
        if t[0] in ('summon','particle'):
            names=entities if t[0]=='summon' else particles
            return len(t)==5 and t[1] in names and all(COORD.fullmatch(v) for v in t[2:])
        if t[0]=='playsound':
            return len(t)==6 and t[1] in sounds and t[2]=='@s' and all(COORD.fullmatch(v) for v in t[3:])
        return False
    return valid

def command_valid(root: Path, command: str) -> bool:
    return make_command_validator(root)(command)
