"""Archive indexing must reduce reads without trusting mutable path names."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
from family_bundle import assemble


class ArchiveIndexTests(unittest.TestCase):
    def fixture(self, root, count=3):
        archives, upstream, order = [], [], []
        for index in range(count):
            uid = f'author-{index}'
            manifest = {'header': {'uuid': uid, 'version': [1, 0, 0]}, 'modules': [{'type': 'data'}]}
            path = root / f'{index}.mcaddon'
            with zipfile.ZipFile(path, 'w') as archive:
                archive.writestr('Pack/manifest.json', json.dumps(manifest))
                archive.writestr('Pack/fixture.json', '{}')
            archives.append(path)
            upstream.append({'name': uid, 'project_id': index, 'file_id': 1, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'packs': [{'uuid': uid, 'version': [1, 0, 0]}]})
            order.append(uid)
        return archives, {'owned': [], 'upstream': upstream, 'order': {'behavior': order, 'resource': []}}

    def test_each_archive_is_indexed_once_and_rechecked_once_at_use(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archives, lock = self.fixture(root)
            original = Path.read_bytes
            reads = {path: 0 for path in archives}
            def counted(path):
                if path in reads:
                    reads[path] += 1
                return original(path)
            with patch.object(Path, 'read_bytes', counted), contextlib.redirect_stdout(io.StringIO()):
                receipt = assemble(lock, {}, [*archives, archives[0]], root / 'candidate')
            self.assertEqual(list(reads.values()), [2, 2, 2])
            self.assertEqual(len(receipt['packs']), 3)

    def test_replacement_between_index_and_use_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archives, lock = self.fixture(root, 1)
            original = Path.read_bytes
            calls = 0
            def changed(path):
                nonlocal calls
                data = original(path)
                if path == archives[0]:
                    calls += 1
                    if calls == 2:
                        return data + b'changed after indexing'
                return data
            with patch.object(Path, 'read_bytes', changed), self.assertRaisesRegex(SystemExit, 'archive changed after indexing'):
                assemble(lock, {}, archives, root / 'candidate')


if __name__ == '__main__':
    unittest.main()
