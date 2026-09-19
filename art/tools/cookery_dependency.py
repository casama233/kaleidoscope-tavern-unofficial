#!/usr/bin/env python3
"""Inspect a locally supplied Cookery .mcaddon and bind its real pack identities.

Python 3.10+, standard library only. Never downloads or executes upstream code.
Default is inspection only. --apply modifies only the selected Tavern project,
not Cookery. This is an identity/inventory tool, NOT a game compatibility test.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
from typing import Any
from uuid import UUID
import zipfile

MAX_ARCHIVE_BYTES = 64 * 1024 * 1024
MAX_EXPANDED_BYTES = 256 * 1024 * 1024
MAX_ENTRY_BYTES = 64 * 1024 * 1024
MAX_JSON_BYTES = 8 * 1024 * 1024
MAX_ENTRIES = 30000
MAX_DEPTH = 3

class AuditError(ValueError):
    pass

def jsonc(data: bytes) -> Any:
    """Accept UTF-8/BOM, // and /* */ comments and trailing commas, not JS."""
    text = data.decode('utf-8-sig')
    out: list[str] = []
    i, quoted, escaped = 0, False, False
    while i < len(text):
        c = text[i]
        if quoted:
            out.append(c)
            if escaped:
                escaped = False
            elif c == '\\':
                escaped = True
            elif c == '"':
                quoted = False
            i += 1
        elif c == '"':
            quoted = True
            out.append(c)
            i += 1
        elif text[i:i+2] == '//':
            end = text.find('\n', i + 2)
            i = len(text) if end == -1 else end
        elif text[i:i+2] == '/*':
            end = text.find('*/', i + 2)
            if end == -1:
                raise AuditError('Unclosed JSON comment')
            out.append(' ')
            i = end + 2
        else:
            out.append(c)
            i += 1
    text = ''.join(out)
    out, i, quoted, escaped = [], 0, False, False
    while i < len(text):
        c = text[i]
        if quoted:
            out.append(c)
            if escaped: escaped = False
            elif c == '\\': escaped = True
            elif c == '"': quoted = False
        elif c == '"':
            quoted = True
            out.append(c)
        elif c == ',':
            j = i + 1
            while j < len(text) and text[j].isspace(): j += 1
            if j >= len(text) or text[j] not in '}]': out.append(c)
        else:
            out.append(c)
        i += 1
    def unique_pairs(pairs):
        d = {}
        for k, v in pairs:
            if k in d: raise AuditError(f'Duplicate JSON key: {k}')
            d[k] = v
        return d
    return json.loads(''.join(out), object_pairs_hook=unique_pairs)

def safe_name(name: str) -> str:
    if '\\' in name or '\x00' in name:
        raise AuditError(f'Unsafe archive path: {name!r}')
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or (path.parts and ':' in path.parts[0]):
        raise AuditError(f'Unsafe archive path: {name!r}')
    return str(path)

def walk_archive(data: bytes, label: str, budget: dict[str, int], depth: int = 0):
    if depth > MAX_DEPTH: raise AuditError('Nested archive depth limit exceeded')
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        infos = z.infolist()
        seen = set()
        for info in infos:
            name = safe_name(info.filename)
            if name in seen: raise AuditError(f'Duplicate archive member: {name}')
            seen.add(name)
            if info.is_dir(): continue
            budget['entries'] += 1
            budget['bytes'] += info.file_size
            if budget['entries'] > MAX_ENTRIES or budget['bytes'] > MAX_EXPANDED_BYTES:
                raise AuditError('Archive expansion limit exceeded')
            if info.file_size > MAX_ENTRY_BYTES:
                raise AuditError(f'Archive entry too large: {name}')
            if info.flag_bits & 1:
                raise AuditError('Encrypted packs are not supported')
        files = {safe_name(x.filename): x for x in infos if not x.is_dir()}
        roots = sorted(n[:-len('manifest.json')] for n in files
                       if PurePosixPath(n).name == 'manifest.json'
                       and '__MACOSX/' not in n)
        for root in roots:
            member = root + 'manifest.json'
            if files[member].file_size > MAX_JSON_BYTES:
                raise AuditError('Manifest too large')
            manifest = jsonc(z.read(member))
            if not isinstance(manifest, dict): raise AuditError('Manifest is not an object')
            h = manifest.get('header', {})
            types = {m.get('type') for m in manifest.get('modules', []) if isinstance(m, dict)}
            role = 'behavior' if 'data' in types else ('resource' if 'resources' in types else None)
            if role is None: continue
            pack_uuid = str(UUID(h.get('uuid', '')))
            if UUID(pack_uuid).int == 0: raise AuditError('Null header UUID is invalid')
            version = h.get('version')
            if not (isinstance(version, list) and len(version) == 3
                    and all(type(x) is int and x >= 0 for x in version)):
                raise AuditError('This tool requires a three-integer header.version')
            identifiers: dict[str, list[str]] = {'items': [], 'blocks': [], 'entities': [], 'recipes': []}
            scripts, overrides, unreadable_json = [], [], []
            for n, inf in files.items():
                if not n.startswith(root): continue
                # Files under another manifest root belong to that pack, not this one.
                if any(r != root and r.startswith(root) and n.startswith(r) for r in roots): continue
                rel = n[len(root):]
                if rel.lower().endswith('.js'): scripts.append(rel)
                if rel.lower().endswith('player.json'): overrides.append(rel)
                if not rel.endswith('.json') or rel == 'manifest.json': continue
                if inf.file_size > MAX_JSON_BYTES:
                    unreadable_json.append(rel)
                    continue
                try:
                    doc = jsonc(z.read(n))
                except (ValueError, UnicodeError):
                    unreadable_json.append(rel)
                    continue
                if not isinstance(doc, dict): continue
                for key, val in doc.items():
                    if not isinstance(val, dict): continue
                    desc = val.get('description', {})
                    ident = desc.get('identifier') if isinstance(desc, dict) else None
                    if not isinstance(ident, str): continue
                    group = {'minecraft:item': 'items', 'minecraft:block': 'blocks',
                             'minecraft:entity': 'entities', 'minecraft:client_entity': 'entities'}.get(key)
                    if key.startswith('minecraft:recipe_'): group = 'recipes'
                    if group: identifiers[group].append(ident)
            yield {
                'role': role, 'name': h.get('name'), 'uuid': pack_uuid,
                'version': version, 'min_engine_version': h.get('min_engine_version'),
                'archive_manifest': label + '!' + member,
                'manifest_sha256': hashlib.sha256(z.read(member)).hexdigest(),
                'modules': manifest.get('modules', []),
                'dependencies': manifest.get('dependencies', []),
                'capabilities': manifest.get('capabilities', []),
                'metadata': manifest.get('metadata', {}),
                'identifiers': {k: sorted(set(v)) for k, v in identifiers.items()},
                'script_paths': sorted(scripts), 'player_json_paths': sorted(overrides),
                'unparsed_json_paths': sorted(unreadable_json)
            }
        for n, inf in files.items():
            if n.lower().endswith(('.mcpack', '.mcaddon', '.zip')):
                yield from walk_archive(z.read(inf), label + '!' + n, budget, depth + 1)

def inspect(archive: Path) -> dict[str, Any]:
    if not archive.is_file(): raise AuditError(f'Archive does not exist: {archive}')
    if archive.stat().st_size > MAX_ARCHIVE_BYTES: raise AuditError('Archive too large')
    raw = archive.read_bytes()
    packs = list(walk_archive(raw, archive.name, {'entries': 0, 'bytes': 0}))
    bp = [x for x in packs if x['role'] == 'behavior']
    rp = [x for x in packs if x['role'] == 'resource']
    if len(bp) != 1 or len(rp) != 1:
        raise AuditError(f'Need exactly one BP and one RP; found {len(bp)} BP, {len(rp)} RP. Select the base Cookery addon, not a modpack.')
    if bp[0]['uuid'] == rp[0]['uuid']: raise AuditError('BP and RP header UUIDs must differ')
    # Identity verification is ultimately manual: names can be changed or localized.
    # Reject clearly unrelated files rather than silently binding an arbitrary addon.
    names = ' '.join(str(x['name']) for x in packs).lower()
    ids = bp[0]['identifiers']['items'] + bp[0]['identifiers']['blocks']
    if 'cookery' not in names and not any('cookery' in x.lower() for x in ids):
        raise AuditError('No Cookery marker found. Review the archive manually; do not bypass by renaming it.')
    return {
        'schema_version': 1, 'required': True,
        'status': 'archive-inspected-not-engine-tested',
        'source_archive': archive.name, 'archive_sha256': hashlib.sha256(raw).hexdigest(),
        'authenticity': 'User must verify download origin; local hash is not an authenticity certificate.',
        'engine_compatibility_verified': False,
        'behavior': bp[0], 'resource': rp[0]
    }

def atomic_bytes(path: Path, raw: bytes):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='.cookery-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as f: f.write(raw)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def encoded(doc: Any) -> bytes:
    return (json.dumps(doc, indent=2, ensure_ascii=False) + '\n').encode('utf-8')

def bind(project: Path, report: dict[str, Any]) -> list[str]:
    project = project.resolve()
    config_path = project / 'config.json'
    config = jsonc(config_path.read_bytes())
    packs = config.get('packs', {})
    paths = {}
    for key, role in [('behaviorPack', 'behavior'), ('resourcePack', 'resource')]:
        raw_path = packs.get(key)
        if not isinstance(raw_path, str): raise AuditError(f'Missing bridge pack mapping: {key}')
        target = (project / raw_path / 'manifest.json').resolve()
        if not target.is_relative_to(project): raise AuditError('Target manifest escapes selected project')
        if not target.is_file(): raise AuditError(f'Missing target manifest: {target}')
        paths[role] = target
    if paths['behavior'] == paths['resource']: raise AuditError('BP and RP target paths are identical')
    lockpath = project / 'compat/cookery.lock.json'
    previous = jsonc(lockpath.read_bytes()) if lockpath.exists() else {}
    originals: dict[Path, bytes | None] = {}
    changes: dict[Path, bytes] = {}
    for role, path in paths.items():
        original = path.read_bytes()
        doc = jsonc(original)
        own_uuid = str(UUID(doc['header']['uuid']))
        if own_uuid in {report['behavior']['uuid'], report['resource']['uuid']}:
            raise AuditError('Refusing to modify the Cookery base pack itself')
        dep = report[role]
        old_uuid = previous.get(role, {}).get('uuid')
        dependencies = doc.get('dependencies', [])
        if not isinstance(dependencies, list): raise AuditError('Invalid target dependency array')
        dependencies = [x for x in dependencies
                        if x.get('uuid') not in {dep['uuid'], old_uuid} or 'uuid' not in x]
        dependencies.append({'uuid': dep['uuid'], 'version': dep['version']})
        doc['dependencies'] = dependencies
        # Existing own UUIDs, Script API versions, unrelated dependencies and content stay intact.
        originals[path] = original
        changes[path] = encoded(doc)
    originals[lockpath] = lockpath.read_bytes() if lockpath.exists() else None
    changes[lockpath] = encoded(report)
    # Durable byte-for-byte backups are made before touching existing manifests.
    for path in paths.values():
        digest = hashlib.sha256(originals[path]).hexdigest()[:16]
        backup = project / '.dependency-backups' / (path.parent.name + '-' + digest + '.json')
        if not backup.exists(): atomic_bytes(backup, originals[path])
    written = []
    try:
        for path, content in changes.items():
            atomic_bytes(path, content)
            written.append(path)
    except Exception:
        for path in reversed(written):
            old = originals[path]
            if old is None: path.unlink(missing_ok=True)
            else: atomic_bytes(path, old)
        raise
    return [str(p.relative_to(project)) for p in changes]

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--project', type=Path, help='Extracted bridge Tavern project root')
    parser.add_argument('--apply', action='store_true', help='Write dependencies into the Tavern project')
    parser.add_argument('--report', type=Path, help='Write inspection report to this new path')
    args = parser.parse_args()
    try:
        if args.apply and args.project is None: raise AuditError('--apply requires --project')
        report = inspect(args.archive)
        if args.report:
            if args.report.exists(): raise AuditError('Report path exists; choose a new name')
            atomic_bytes(args.report, encoded(report))
        if args.apply:
            written = bind(args.project, report)
            print('Updated Tavern only: ' + ', '.join(written))
        else:
            print('INSPECTION ONLY — no project modified')
        for role in ('behavior', 'resource'):
            p = report[role]
            print(f"{role}: {p['uuid']} version={p['version']} manifest={p['archive_manifest']}")
            print('  items/blocks/entities/recipes: ' + str({k: len(v) for k, v in p['identifiers'].items()}))
            print('  Script API/native dependencies: ' + str([d for d in p['dependencies'] if 'module_name' in d]))
        print('NOT VERIFIED: Minecraft load, behavior compatibility, UI, multiplayer, Realms or achievements.')
        return 0
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile, RuntimeError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
