"""Reject known JS/C compound-assignment syntax in Bedrock Molang.

This is a targeted lexical regression guard, not a full Molang compiler or a
client-render test. Do not execute expressions as JavaScript to validate Molang:
JavaScript accepts the very operators which caused the 0.6.64 content errors.
Reference: https://learn.microsoft.com/en-us/minecraft/creator/documents/molang/syntax-guide
"""
from __future__ import annotations

import re
from typing import Any, Iterator

# Longest token first. Ignore quoted Molang string literals, which support no
# escape sequence; keep character positions for useful content-log diagnostics.
COMPOUND = re.compile(r'\?\?=|\*\*=|>>>=|>>=|<<=|[+*/%&|^\-]=')
SCOPE = re.compile(r'\b(?:variable|v|temp|t|query|q|context|c|math)\.[a-z_]', re.I)
QUOTED = re.compile(r"'[^']*'")


def unquoted(expression: str) -> str:
    return QUOTED.sub(lambda match: ' ' * len(match[0]), expression)


def compound_assignments(expression: str) -> list[tuple[int, str]]:
    """Return offsets/tokens without interpreting arithmetic or quoted text."""
    return [(match.start(), match[0]) for match in COMPOUND.finditer(unquoted(expression))]


def strings(value: Any, pointer: str = '') -> Iterator[tuple[str, str]]:
    """Walk JSON string values, including array elements and nested events."""
    if isinstance(value, dict):
        for key, child in value.items():
            escaped = key.replace('~', '~0').replace('/', '~1')
            yield from strings(child, pointer + '/' + escaped)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from strings(child, pointer + '/' + str(index))
    elif isinstance(value, str):
        yield pointer, value


def expressions(value: Any) -> Iterator[tuple[str, str]]:
    for pointer, text in strings(value):
        key = pointer.rsplit('/', 1)[-1]
        if key == 'expression' or key.endswith('_expression') or SCOPE.search(unquoted(text)):
            yield pointer, text


def issues(value: Any) -> list[dict[str, Any]]:
    return [dict(pointer=pointer, offset=offset, operator=operator)
            for pointer, expression in expressions(value)
            for offset, operator in compound_assignments(expression)]


def validate(value: Any, source: str = '<generated>') -> None:
    failures = issues(value)
    if failures:
        first = failures[0]
        raise ValueError(f"{source}{first['pointer']} at {first['offset']}: unsupported "
                         f"Molang compound assignment {first['operator']!r}; "
                         "write an explicit assignment (for example v.x=v.x+(amount);)")
