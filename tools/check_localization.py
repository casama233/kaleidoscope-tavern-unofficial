#!/usr/bin/env python3
"""Audit advertised translations and runtime item/block labels; no game simulation."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];RT=ROOT/'runtime';TEXT=RT/'RP/texts'
locales=json.loads((TEXT/'languages.json').read_text());maps={}
for lc in locales:
    rows={}
    for line in (TEXT/f'{lc}.lang').read_text().splitlines():
        assert not line.startswith('#') or line.startswith('##'), (lc,'Bedrock comments require ##',line)
        if not line or line.startswith('##'):continue
        assert '=' in line,(lc,'invalid row')
        key,value=line.split('=',1)
        assert key not in rows,(lc,'duplicate',key)
        assert value.strip(),(lc,'empty',key)
        rows[key]=value
    maps[lc]=rows
base=maps['en_US'];tokens=lambda s:sorted(re.findall(r'%(?:\d+\$)?[sd]',s))
for lc,rows in maps.items():
    assert rows.keys()==base.keys(),(lc,'key mismatch',sorted(base.keys()-rows.keys()))
    for key,value in rows.items():assert tokens(value)==tokens(base[key]),(lc,key,'placeholder mismatch')
required=set()
for p in (RT/'BP').rglob('*.json'):
    data=json.loads(p.read_text())
    if not isinstance(data,dict):continue
    for kind in ['item','block']:
        entry=data.get('minecraft:'+kind)
        if not entry:continue
        desc=entry['description'];comp=entry.get('components',{})
        display=comp.get('minecraft:display_name');name=display.get('value') if isinstance(display,dict) else display
        if name:required.add(name)
        if kind=='block' and desc.get('menu_category'):required.add('tile.'+desc['identifier']+'.name')
        button=comp.get('minecraft:interact_button')
        if isinstance(button,str):required.add(button)
        group=desc.get('menu_category',{}).get('group')
        if group and 'kaleidoscope_tavern' in group:required.add(group)
for p in (RT/'BP/scripts').rglob('*.js'):
    required.update(re.findall(r"translate\s*:\s*['\"]([^'\"]+)['\"]",p.read_text()))
required.discard('kt.board.') # Dynamic suffixes are checked explicitly below.
required.update('kt.board.'+x for x in ['chalk','sandwich','text','placeholder','align','left','center','right'])
for key in required:
    assert key in base or not ('kt.' in key or 'kaleidoscope_tavern' in key),(key,'missing runtime key')
print(json.dumps({'locales':locales,'keysPerLocale':len(base),'runtimeLabelReferences':len(required),'duplicates':0,'missingKeys':0,'placeholderMismatches':0}))
