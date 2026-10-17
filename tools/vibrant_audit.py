#!/usr/bin/env python3
"""Read-only manifest/MCAddon/BDS-stack preflight. No server or third-party writes.

PBR min-engine rule: Microsoft Learn CHKMANIF134 (1.21.120).
Requiring EVERY selected RP to declare PBR is an optional deployment policy,
not a claim that Microsoft requires every legacy pack to opt in.
"""
from __future__ import annotations
import argparse
import io
import json
import re
import stat
import sys
import zipfile
from collections import defaultdict
from pathlib import Path, PurePosixPath

PBR_MIN = (1, 21, 120)
UUID = re.compile(r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\Z")
MAX_MANIFEST = 2 * 1024 * 1024
MAX_ARCHIVE = 64 * 1024 * 1024


def version(value):
    if isinstance(value, str) and re.fullmatch(r"\d+\.\d+\.\d+", value):
        value = [int(x) for x in value.split('.')]
    if not isinstance(value, (list, tuple)) or len(value) != 3 or any(type(n) is not int or n < 0 for n in value):
        raise ValueError(f"expected numeric three-part pack version, got {value!r}")
    return tuple(value)


def uid(value):
    if not isinstance(value, str) or not UUID.fullmatch(value):
        raise ValueError(f"invalid UUID: {value!r}")
    return value.lower()


def record(origin, raw):
    if len(raw) > MAX_MANIFEST:
        raise ValueError(f"manifest too large: {origin}")
    doc = json.loads(raw.decode('utf-8-sig'))
    h = doc['header']
    return {'origin': str(origin), 'doc': doc, 'uuid': uid(h['uuid']), 'version': version(h['version'])}


def manifest_file(path):
    path = Path(path)
    if path.is_symlink() or path.stat().st_size > MAX_MANIFEST:
        raise ValueError(f"symlink or oversized manifest: {path}")
    return record(path, path.read_bytes())


def source_records(paths):
    records = []
    for path in map(Path, paths):
        if path.is_file():
            records.append(manifest_file(path))
        else:
            found = sorted(path.rglob('manifest.json'))
            if not found:
                raise ValueError(f"no manifests in {path}")
            records.extend(manifest_file(p) for p in found)
    return records


def archive_records(path):
    """Read flat MCAddon or nested MCPack manifests without extracting files."""
    result = []
    budget = [0]
    def visit(stream, label, depth=0):
        if depth > 2:
            raise ValueError('nested archive depth limit exceeded')
        with zipfile.ZipFile(stream) as z:
            names = set()
            if len(z.infolist()) > 20000:
                raise ValueError('archive entry limit exceeded')
            for info in z.infolist():
                name = info.filename
                p = PurePosixPath(name)
                if name in names or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name:
                    raise ValueError(f"duplicate or unsafe archive path: {label}!{name}")
                names.add(name)
                if stat.S_ISLNK(info.external_attr >> 16):
                    raise ValueError(f"archive symlink: {name}")
                if info.is_dir():
                    continue
                if p.name == 'manifest.json' or p.suffix.lower() == '.mcpack':
                    limit = MAX_MANIFEST if p.name == 'manifest.json' else MAX_ARCHIVE
                    budget[0] += info.file_size
                    if info.file_size > limit or budget[0] > MAX_ARCHIVE:
                        raise ValueError('archive read budget exceeded')
                    raw = z.read(info)
                    if p.name == 'manifest.json':
                        result.append(record(f'{label}!{name}', raw))
                    else:
                        visit(io.BytesIO(raw), f'{label}!{name}', depth + 1)
    visit(path, str(path))
    if not result:
        raise ValueError(f'no manifests in {path}')
    return result


def audit(records, *, require_all_pbr=True, complete=False, engine=None):
    errors, warnings, external = [], [], []
    by_uuid = defaultdict(list)
    modules = {}
    rps = declared = 0
    for r in records:
        by_uuid[r['uuid']].append(r)
    for identifier, rows in by_uuid.items():
        if len(rows) > 1:
            errors.append(f"duplicate active pack UUID {identifier}: " + ', '.join(r['origin'] for r in rows))
    for r in records:
        d, origin = r['doc'], r['origin']
        try:
            if d.get('format_version') != 2:
                raise ValueError('this gate supports manifest format_version 2 only; review newer formats explicitly')
            rows = d.get('modules')
            if not isinstance(rows, list) or not rows:
                raise ValueError('missing modules')
            is_rp = any(m.get('type') == 'resources' for m in rows)
            minimum = version(d['header']['min_engine_version'])
            if engine is not None and minimum > version(engine):
                errors.append(f'{origin}: min_engine_version {minimum} exceeds target engine {engine}')
            for m in rows:
                module_id = uid(m['uuid'])
                if module_id in modules or module_id in by_uuid:
                    errors.append(f'{origin}: duplicate module/header UUID {module_id}')
                modules[module_id] = origin
                if version(m['version']) != r['version']:
                    warnings.append(f'{origin}: module/header version differs; review cache/version policy')
            caps = d.get('capabilities', [])
            if not isinstance(caps, list) or any(not isinstance(c, str) for c in caps):
                raise ValueError('capabilities must be a string array')
            if is_rp:
                rps += 1
                declared += int('pbr' in caps or 'raytraced' in caps)
                if not ({'pbr', 'raytraced'} & set(caps)):
                    (errors if require_all_pbr else warnings).append(f'{origin}: RP missing PBR declaration (stack policy)')
            if 'pbr' in caps and minimum < PBR_MIN:
                errors.append(f'{origin}: pbr requires min_engine_version >= {PBR_MIN}; got {minimum}')
            seen_deps = set()
            for dep in d.get('dependencies', []):
                if ('uuid' in dep) == ('module_name' in dep):
                    raise ValueError('dependency needs exactly one of uuid/module_name')
                key = uid(dep['uuid']) if 'uuid' in dep else dep['module_name']
                if not isinstance(key, str) or not key or key in seen_deps:
                    raise ValueError('invalid/duplicate dependency identifier')
                seen_deps.add(key)
                if 'module_name' in dep:
                    # Script API dependencies are NOT pack version dependencies.
                    if not isinstance(dep.get('version'), str) or not dep['version']:
                        raise ValueError('script API dependency needs a nonempty version string')
                    continue
                required = version(dep['version'])
                target = by_uuid.get(key, [])
                if not target:
                    text = f'{origin}: unresolved external pack {key} @ {required}'
                    (errors if complete else external).append(text)
                elif len(target) == 1 and target[0]['version'] != required:
                    errors.append(f"{origin}: stale dependency {key} needs {required}, active {target[0]['version']}")
        except (KeyError, TypeError, ValueError, AttributeError) as e:
            errors.append(f'{origin}: {e}')
    if not records:
        errors.append('no selected manifests; cannot certify an empty scan')
    return {'schema': 1, 'ok': not errors, 'errors': errors, 'warnings': warnings,
            'unverified_external_dependencies': external, 'packs_checked': len(records),
            'resource_packs': rps, 'declared_resource_packs': declared,
            'scope_complete': complete and not errors, 'client_tested': False,
            'policy_require_all_pbr': require_all_pbr}


def verify_export(paths, archive):
    """Fail on source/archive mismatch, including lost capabilities and stale deps."""
    source = source_records(paths)
    built = archive_records(archive)
    for rows in (source, built):
        report = audit(rows)
        if not report['ok']:
            raise ValueError('\n'.join(report['errors']))
    before = {r['uuid']: r['doc'] for r in source}
    after = {r['uuid']: r['doc'] for r in built}
    if before != after:
        raise ValueError('exported manifests do not match source; refusing stale/re-generated pack')
    return report


def server_records(root, world=None):
    """Only installed pack roots and selected world; never choose highest version."""
    root = Path(root).resolve()
    problems, warnings = [], []
    properties = {}
    for line in (root / 'server.properties').read_text(encoding='utf-8-sig').splitlines():
        if not line.strip() or line.lstrip().startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        k, v = k.strip(), v.strip()
        if k in ('level-name', 'disable-client-vibrant-visuals'):
            if k in properties:
                problems.append(f'duplicate server property: {k}')
            properties[k] = v
    # Explicit false is this project's deployment contract, not an inferred default.
    if properties.get('disable-client-vibrant-visuals') != 'false':
        problems.append('server policy: explicitly set disable-client-vibrant-visuals=false')
    world = world or properties.get('level-name')
    if not world or world in ('.', '..') or any(c in world for c in '/\\:'):
        raise ValueError('world must be a single directory name from level-name or --world')
    folder = root / 'worlds' / world
    if not folder.is_dir() or not folder.resolve().is_relative_to(root / 'worlds'):
        raise ValueError('selected world missing or escapes server/worlds')
    available = defaultdict(list)
    for parent in (root, folder):
        for kind in ('behavior_packs', 'resource_packs', 'development_behavior_packs', 'development_resource_packs'):
            for p in sorted((parent / kind).glob('*/manifest.json')):
                try:
                    if not p.resolve().is_relative_to(root):
                        raise ValueError(f'pack path escapes server root: {p}')
                    r = manifest_file(p)
                    available[(r['uuid'], r['version'])].append(r)
                except (OSError, ValueError, KeyError, TypeError) as e:
                    problems.append(f'{p}: {e}')
    queue = []
    reference_count = 0
    for filename, expected_rp in (('world_behavior_packs.json', False), ('world_resource_packs.json', True)):
        p = folder / filename
        if not p.exists():
            warnings.append(f'world has no {filename}')
            continue
        refs = json.loads(p.read_text(encoding='utf-8-sig'))
        if not isinstance(refs, list):
            raise ValueError(f'{p}: expected array')
        seen = set()
        for row in refs:
            key = (uid(row['pack_id']), version(row['version']))
            if key in seen:
                problems.append(f'{p}: duplicate world reference {key}')
            seen.add(key)
            queue.append((key, str(p), expected_rp))
            reference_count += 1
    selected = {}
    while queue:
        key, owner, expected_rp = queue.pop(0)
        candidates = available.get(key, [])
        if len(candidates) != 1:
            found = sorted({v for (u, v) in available if u == key[0]})
            problems.append(f'{owner}: reference {key} resolves to {len(candidates)} copies; installed versions={found}. No automatic retargeting.')
            continue
        r = candidates[0]
        actual_rp = any(m.get('type') == 'resources' for m in r['doc'].get('modules', []))
        if expected_rp is not None and actual_rp != expected_rp:
            problems.append(f'{owner}: pack {key} is in the wrong world list')
        if key in selected:
            continue
        selected[key] = r
        for dep in r['doc'].get('dependencies', []):
            if 'uuid' in dep:
                queue.append(((uid(dep['uuid']), version(dep['version'])), r['origin'], None))
    if reference_count == 0:
        problems.append('no enabled world pack references found')
    return list(selected.values()), problems, warnings


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--pack', action='append', default=[], type=Path, help='manifest or pack directory, repeatable')
    p.add_argument('--archive', type=Path, help='MCAddon; with --pack also compare exported manifests')
    p.add_argument('--server-root', type=Path, help='read-only BDS deployment preflight, no live changes')
    p.add_argument('--world', help='single world directory; defaults to level-name')
    p.add_argument('--engine', help='target manifest engine version, e.g. 1.26.50 (not marketing 26.50)')
    p.add_argument('--require-all-pbr', action='store_true', help='opt into the strict whole-stack declaration policy')
    p.add_argument('--report', type=Path)
    args = p.parse_args()
    try:
        extra, notes = [], []
        if args.server_root:
            if args.pack or args.archive:
                raise ValueError('server mode cannot be mixed with package mode')
            rows, extra, notes = server_records(args.server_root, args.world)
        else:
            if args.world:
                raise ValueError('--world requires --server-root')
            rows = source_records(args.pack) if args.pack else archive_records(args.archive) if args.archive else []
            if args.pack and args.archive:
                verify_export(args.pack, args.archive)
        report = audit(rows, require_all_pbr=(not args.server_root or args.require_all_pbr),
                       complete=bool(args.server_root), engine=version(args.engine) if args.engine else None)
        report['errors'].extend(extra)
        report['warnings'].extend(notes)
        report['ok'] = not report['errors']
        report['scope_complete'] = bool(args.server_root) and report['ok']
    except (OSError, ValueError, KeyError, TypeError, AttributeError, zipfile.BadZipFile) as e:
        report = {'schema': 1, 'ok': False, 'errors': [str(e)], 'client_tested': False}
    text = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(text, encoding='utf-8')
    print(text, end='')
    return 0 if report['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())
