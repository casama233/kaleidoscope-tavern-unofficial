#!/usr/bin/env python3
"""Fail builds on the compound-assignment regression; not native rendering QA."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from molang_syntax import expressions, issues

ROOT = Path(__file__).resolve().parents[2]


def audit(root: Path) -> dict:
    paths = sorted(root.rglob('*.json'))
    if not paths:
        raise ValueError(f'No JSON resources found: {root}')
    failures = []
    expression_count = 0
    for path in paths:
        value = json.loads(path.read_text(encoding='utf-8-sig'))
        expression_count += sum(1 for _ in expressions(value))
        failures.extend(dict(file=path.relative_to(root).as_posix(), **row) for row in issues(value))
    return dict(jsonFiles=len(paths), molangStrings=expression_count,
                compoundAssignments=len(failures), errors=failures,
                nativeParserTested=False, clientRenderingTested=False)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT / 'runtime')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    report = audit(args.root)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + '\n')
    for row in report['errors'][:20]:
        print(f"{row['file']}{row['pointer']}:{row['offset']}: unsupported Molang "
              f"{row['operator']!r}; use explicit assignment", file=sys.stderr)
    print(json.dumps({key: value for key, value in report.items() if key != 'errors'}))
    return 1 if report['errors'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
