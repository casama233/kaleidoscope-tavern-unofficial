"""Compare ALL locked main/generated resources against a supplied release JAR.
Does not execute classes or modify assets. A byte match is not proof of download authenticity.
"""
from __future__ import annotations
import argparse
import hashlib
from pathlib import Path
import zipfile
from interface_common import ROOT, InterfaceError, read, dump, sha


def compare(root: Path, jar: Path) -> dict:
    if not jar.is_file() or jar.stat().st_size > 256 * 1024 * 1024:
        raise InterfaceError('JAR missing or exceeds the 256 MiB input limit')
    lock_path = root/'sources.lock.json'; lock = read(lock_path); selected = {}; excluded = []
    for row in lock['assets']:
        prefix = next((p for p in ('src/main/resources/','src/generated/resources/') if row['path'].startswith(p)), None)
        if not prefix:
            excluded.append(row['path']); continue
        member = row['path'][len(prefix):]
        if member in selected and selected[member]['sha256'] != row['local_sha256']:
            raise InterfaceError('Conflicting locked resource definitions: ' + member)
        entry = selected.setdefault(member, {'sha256': row['local_sha256'], 'sources': []})
        entry['sources'].append(row['path'])
    rows = []
    with zipfile.ZipFile(jar) as z:
        names = [x.filename for x in z.infolist()]
        if len(names) > 50000 or len(names) != len(set(names)):
            raise InterfaceError('Too many or duplicate JAR members')
        for member, expected in sorted(selected.items()):
            try: info = z.getinfo(member)
            except KeyError:
                rows.append({'path': member, 'status': 'missing', 'source_paths': expected['sources']}); continue
            if info.file_size > 16 * 1024 * 1024 or info.flag_bits & 1:
                raise InterfaceError('Oversized/encrypted resource: ' + member)
            actual = hashlib.sha256(z.read(info)).hexdigest()
            rows.append({'path': member, 'status': 'equal' if actual == expected['sha256'] else 'different',
                         'source_paths': expected['sources'], 'jar_member_sha256': actual, 'source_sha256': expected['sha256']})
    return {'schema_version': 2, 'jar_name': jar.name, 'jar_sha256': sha(jar),
            'authenticity': 'User-supplied archive; verify download origin separately',
            'source_commit': lock['commit'], 'source_lock_sha256': sha(lock_path),
            'coverage': 'All locked main AND generated resource entries; NOT the full mod, Java classes, or unacquired assets',
            'selected_resource_count': len(rows), 'excluded_nonresource_paths': excluded,
            'all_selected_resources_equal': bool(rows) and all(r['status'] == 'equal' for r in rows), 'results': rows}

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('jar',type=Path)
    p.add_argument('--output',type=Path,default=ROOT/'docs/release-comparison.json');a=p.parse_args()
    try:
        report=compare(ROOT,a.jar);dump(a.output,report);print(a.output)
        print('Selected resources:',report['selected_resource_count'],'all equal:',report['all_selected_resources_equal'])
        raise SystemExit(0 if report['all_selected_resources_equal'] else 1)
    except (OSError,ValueError,zipfile.BadZipFile) as e:
        p.error(str(e))
