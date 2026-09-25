#!/usr/bin/env python3
"""Non-mutating JSON syntax check; the full release validator checks semantics."""
import json
import sys
from pathlib import Path


def main(paths: list[str]) -> int:
    failed = False
    for name in paths:
        try:
            json.loads(Path(name).read_text(encoding="utf-8-sig"))
        except (OSError, UnicodeError, ValueError) as exc:
            print(f"{name}: {exc}", file=sys.stderr)
            failed = True
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
