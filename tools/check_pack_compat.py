#!/usr/bin/env python3
"""Read-only block material/registry input audit. No game simulation.

Usage: python tools/check_pack_compat.py --bp path/to/BP [--bp another/BP]
External block references are reported, not guessed to exist or rewritten to air.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METHODS = {'opaque', 'blend', 'alpha_test', 'alpha_test_single_sided', 'double_sided'}

def load(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))

def material_methods(materials):
    def resolve(name, seen):
        if name in seen:
            raise ValueError('cyclic material alias: '+name)
        value = materials[name]
        if isinstance(value, str):
            if value not in materials:
                raise ValueError('unresolved material alias: '+value)
            return resolve(value, seen | {name})
        if not isinstance(value, dict):
            raise ValueError('invalid material instance: '+name)
        method = value.get('render_method', 'opaque')
        if method not in METHODS:
            raise ValueError('unknown render method: '+str(method))
        return method
    return {resolve(k, set()) for k in materials}

def audit(roots):
    blocks, namespaces, documents = {}, set(), []
    errors, externals, maps, cross_state = [], set(), 0, []
    for root in roots:
        for p in sorted(root.rglob('*.json')):
            j=load(p);documents.append((p,j))
            if not isinstance(j,dict) or 'minecraft:block' not in j:continue
            block=j['minecraft:block'];bid=block.get('description',{}).get('identifier')
            if not isinstance(bid,str) or ':' not in bid or not bid.strip():
                errors.append(f'{p}: invalid block identifier {bid!r}');continue
            if bid in blocks:errors.append(f'{p}: duplicate block identifier {bid} (also {blocks[bid]})')
            blocks[bid]=p;namespaces.add(bid.split(':')[0])
    def reference(value, where):
        if isinstance(value,dict):value=value.get('name')
        if not isinstance(value,str) or not value.strip() or ':' not in value:
            errors.append(f'{where}: empty/invalid block reference {value!r}');return
        if value in blocks:return
        if value.split(':')[0] in namespaces:errors.append(f'{where}: missing local block {value}')
        else:externals.add(value)
    for p,j in documents:
        if not isinstance(j,dict):continue
        if 'minecraft:block' in j:
            b=j['minecraft:block'];base=b.get('components',{});seen=set()
            components=[('base',base)]
            for i,perm in enumerate(b.get('permutations',[])):
                effective=dict(base);effective.update(perm.get('components',{}));components.append((f'permutation[{i}]',effective))
            for label,c in components:
                for where,m in [(label,c.get('minecraft:material_instances')),
                    (label+'.item_visual',c.get('minecraft:item_visual',{}).get('material_instances'))]:
                    if m is None:continue
                    maps+=1
                    try:
                        methods=material_methods(m);seen.update(methods)
                        if len(methods)>1:errors.append(f'{p} {where}: mixed material methods {sorted(methods)}')
                    except (KeyError,ValueError) as e:errors.append(f'{p} {where}: {e}')
            # Different valid maps are a separate review item, NOT proof that
            # mutually exclusive states or item visuals trigger an engine error.
            if len(seen)>1:cross_state.append({'block':b['description']['identifier'],'methods':sorted(seen)})
        item=j.get('minecraft:item',{}).get('components',{})
        if 'minecraft:block_placer' in item:
            placer=item['minecraft:block_placer'];reference(placer.get('block'),f'{p}: block_placer')
            for target in placer.get('use_on',[]):reference(target,f'{p}: block_placer.use_on')
        def walk(v,path):
            if isinstance(v,dict):
                for key,value in v.items():
                    if key in ('places_block','may_replace','may_attach_to','base_block','trunk_block','leaves_block'):
                        values=value if isinstance(value,list) else [value]
                        for ref in values:
                            # Feature placement descriptors can be structured rules;
                            # inspect only literal block-id/name forms here.
                            if isinstance(ref,str) or isinstance(ref,dict) and 'name' in ref:reference(ref,f'{p}:{path}/{key}')
                    walk(value,path+'/'+key)
            elif isinstance(v,list):
                for i,value in enumerate(v):walk(value,path+'/'+str(i))
        if 'features' in p.parts:walk(j,'')
    return {'blocks':len(blocks),'materialMaps':maps,'errors':errors,
            'crossStateOrItemMethodsForReview':cross_state,'externalBlockReferences':sorted(externals),
            'engineTested':False,'blankEngineLogAttributed':False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bp',action='append',type=Path)
    parser.add_argument('--report',type=Path)
    args=parser.parse_args();result=audit(args.bp or [ROOT/'runtime/BP'])
    text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    if args.report:args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(text,encoding='utf-8')
    print(text,end='')
    if result['errors']:raise SystemExit(1)
if __name__=='__main__':main()
