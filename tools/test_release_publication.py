"""Publication authorization and source-document boundaries; no remote writes."""
from pathlib import Path
import tempfile
import unittest

from release_publication import publication_enabled, public_notes, public_notes_text


class ReleasePublication(unittest.TestCase):
    def test_inline_notes_are_short_public_text_and_preserve_path_mode(self):
        self.assertEqual(public_notes_text(Path('.'), {'public_notes_inline': 'Current repair.\n\nClient confirmation pending.'}),
                         'Current repair.\n\nClient confirmation pending.\n')
        for text in ['', '/root/private/source', 'file:///world', '\x00', 'x' * 4097, False]:
            with self.subTest(text=text), self.assertRaises(ValueError):
                public_notes_text(Path('.'), {'public_notes_inline': text})

    def test_new_request_requires_explicit_manual_publication(self):
        request = {'publication_request': False}
        self.assertFalse(publication_enabled(request, 'push'))
        self.assertFalse(publication_enabled(request, 'workflow_dispatch'))
        self.assertTrue(publication_enabled(request, 'workflow_dispatch', True))
        self.assertFalse(publication_enabled(request, 'pull_request', True))

    def test_old_requests_keep_automatic_push_behavior(self):
        self.assertTrue(publication_enabled({}, 'push'))
        self.assertFalse(publication_enabled({}, 'workflow_dispatch'))
        self.assertTrue(publication_enabled({}, 'workflow_dispatch', True))

    def test_strings_cannot_turn_false_into_publication(self):
        with self.assertRaises(ValueError):
            publication_enabled({'publication_request': 'false'}, 'push')
        with self.assertRaises(ValueError):
            publication_enabled({'publication_request': False}, 'workflow_dispatch', 'false')

    def test_optional_notes_preserve_original_and_reject_path_escape(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'docs').mkdir()
            original = root / 'docs/RELEASE-NOTES-0.6.147.md'
            original.write_text('Immutable diagnostic draft evidence')
            public = root / 'docs/PUBLICATION-T147.md'
            public.write_text('Current bounded public release explanation')
            self.assertIsNone(public_notes(root, {}))
            self.assertEqual(public_notes(root, {'public_notes_path': 'docs/PUBLICATION-T147.md'}), public)
            changelog = root / 'CHANGELOG.md'
            changelog.write_text('Current release entry')
            self.assertEqual(public_notes(root, {'public_notes_path': 'CHANGELOG.md'}), changelog)
            self.assertEqual(original.read_text(), 'Immutable diagnostic draft evidence')
            for name in ('../outside.md', 'docs/../outside.md', str(public), 'runtime/RP/notes.md',
                         'docs\\PUBLICATION-T147.md', 'docs/missing.md'):
                with self.subTest(name=name), self.assertRaises(ValueError):
                    public_notes(root, {'public_notes_path': name})
            (root / 'docs/link.md').symlink_to(public)
            with self.assertRaises(ValueError):
                public_notes(root, {'public_notes_path': 'docs/link.md'})


if __name__ == '__main__':
    unittest.main()
