"""Shared strict JSON, confined paths and atomic writes. Not a Minecraft API."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tempfile
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
class InterfaceError(ValueError):
    pass

def read(path: Path) -> Any:
    def pairs(rows):
        data = {}
        for key, value in rows:
            if key in data:
                raise InterfaceError(f'Duplicate JSON key: {path}: {key}')
            data[key] = value
        return data
    return json.loads(path.read_text(encoding='utf-8-sig'), object_pairs_hook=pairs,
                      parse_constant=lambda v: (_ for _ in ()).throw(InterfaceError(f'Nonfinite number: {v}')))

def encoded(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode('utf-8')

def atomic(path: Path, raw: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.tavern-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(raw)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)

def dump(path: Path, value: Any) -> None:
    atomic(path, encoded(value))

def within(root: Path, relative: str, *, must_exist: bool = True) -> Path:
    if not isinstance(relative, str) or not relative or '\\' in relative or '\x00' in relative:
        raise InterfaceError(f'Invalid relative path: {relative!r}')
    part = PurePosixPath(relative)
    if part.is_absolute() or '..' in part.parts or ':' in part.parts[0]:
        raise InterfaceError(f'Path escapes project: {relative}')
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise InterfaceError(f'Path escapes project: {relative}')
    if must_exist and not path.is_file():
        raise InterfaceError(f'Missing file (case-sensitive): {relative}')
    return path

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def version(value: Any) -> bool:
    return isinstance(value, list) and len(value) == 3 and all(type(x) is int and x >= 0 for x in value)

def transaction(changes: dict[Path, bytes], backup_dir: Path) -> list[str]:
    """Rollback on Python I/O exceptions; not a cross-file power-loss transaction."""
    originals = {p: p.read_bytes() if p.exists() else None for p in changes}
    backup_dir.mkdir(parents=True, exist_ok=True)
    for path, raw in originals.items():
        if raw is not None:
            name = hashlib.sha256(str(path).encode()).hexdigest()[:10] + '-' + hashlib.sha256(raw).hexdigest()[:16]
            backup = backup_dir / (name + '-' + path.name)
            if not backup.exists():
                atomic(backup, raw)
    written = []
    try:
        for path, raw in changes.items():
            if originals[path] == raw:
                continue
            atomic(path, raw)
            written.append(path)
    except Exception:
        for path in reversed(written):
            if originals[path] is None:
                path.unlink(missing_ok=True)
            else:
                atomic(path, originals[path])
        raise
    return [str(p) for p in written]
