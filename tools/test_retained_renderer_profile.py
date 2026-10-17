"""Finite profile gates with synthetic bytes; no private payload or client."""
import copy
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from family_bundle import renderer_source_version


class RetainedRenderer(unittest.TestCase):
    def test_retained_profiles_require_the_same_frozen_component_and_reject_other_versions(self):
        config = {'repository': 'local/senluo-amw-cuisine', 'version': [1, 0, 35],
                  'retained_renderer_profile': {'source_commit': '8d05a3da291861048dc7e759be3ba96fde45ebb8',
                                               'spec_sha256': '292e337a073ea713c22c84c66f85a2c8cb9d2d5c453c308b1569107d2656b703'}}
        with TemporaryDirectory() as directory:
            path = Path(directory) / 'synthetic.json'
            path.write_bytes(b'synthetic fixture only')
            # Only the branch/identity predicate is isolated here; real assembly
            # hashes the actual committed private file without this test stub.
            with patch('family_bundle.hashlib.sha256') as digest:
                digest.return_value.hexdigest.return_value = config['retained_renderer_profile']['spec_sha256']
                for version in [[1, 0, 34], [1, 0, 35], [1, 0, 36], [1, 0, 37], [1, 0, 38], [1, 0, 39], [1, 0, 40]]:
                    config['version'] = version
                    self.assertEqual(renderer_source_version(config, {'owner_version': [1, 0, 32]}, path), [1, 0, 32])
                wrong = copy.deepcopy(config)
                wrong['version'] = [1, 0, 41]
                with self.assertRaises(SystemExit):
                    renderer_source_version(wrong, {'owner_version': [1, 0, 32]}, path)
                with self.assertRaises(SystemExit):
                    renderer_source_version(config, {'owner_version': [1, 0, 35]}, path)
            with self.assertRaises(SystemExit):
                renderer_source_version(config, {'owner_version': [1, 0, 32]}, path)


if __name__ == '__main__':
    unittest.main()
