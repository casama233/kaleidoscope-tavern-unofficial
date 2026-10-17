"""Select explicit publication and optional public prose; never publish anything."""
import argparse
import json
import os
import re
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]


def publication_enabled(request, event_name, publish_release=False):
    automatic = request.get('publication_request', True)
    if type(automatic) is not bool or type(publish_release) is not bool:
        raise ValueError('Publication flags must be booleans')
    if event_name == 'workflow_dispatch':
        return publish_release
    return event_name == 'push' and automatic


def public_notes(root, request):
    name = request.get('public_notes_path')
    if name is None:
        return None
    if not isinstance(name, str) or not name:
        raise ValueError('Public notes must name a Markdown document')
    relative = PurePosixPath(name)
    if (relative.is_absolute() or '..' in relative.parts or '\\' in name or
            not relative.parts or (relative.parts[0] != 'docs' and name != 'CHANGELOG.md') or relative.suffix != '.md'):
        raise ValueError('Public notes must remain under docs or use the existing CHANGELOG.md')
    root = Path(root).resolve()
    path = root / str(relative)
    if (not path.is_file() or not path.resolve().is_relative_to(root) or
            any(p.is_symlink() for p in [path, *path.parents] if p == root or root in p.parents)):
        raise ValueError('Public notes must be an existing regular source document')
    return path

def public_notes_text(root, request):
    inline = request.get('public_notes_inline')
    if inline is not None:
        if (not isinstance(inline, str) or not inline.strip() or len(inline) > 4096 or
                '\x00' in inline or re.search(r'/root/|/var/|file://', inline)):
            raise ValueError('Inline public notes must be short public text without private filesystem paths')
        return inline.strip() + '\n'
    path = public_notes(root, request)
    return path.read_text(encoding='utf-8') if path else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--event', required=True)
    parser.add_argument('--publish-release', choices=('true', 'false'), default='false')
    args = parser.parse_args()
    request = json.loads((ROOT / '.github/release-request.json').read_text())
    enabled = publication_enabled(request, args.event, args.publish_release == 'true')
    notes = public_notes(ROOT, request)
    if output := os.environ.get('GITHUB_OUTPUT'):
        with open(output, 'a') as stream:
            stream.write('publish=' + str(enabled).lower() + '\n')
    print(json.dumps({'publication_enabled': enabled,
                      'public_notes_path': str(notes.relative_to(ROOT)) if notes else None}))


if __name__ == '__main__':
    main()
