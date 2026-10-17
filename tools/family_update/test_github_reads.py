"""Mock the external GET command, retaining its exact response and diagnostics."""
import io
import json
import subprocess
import unittest
from unittest.mock import call, patch
from family_update import github_reads as m
from family_update import workflow


class GitHubReadTests(unittest.TestCase):
    def result(self, code, stdout=b'', stderr=b''):
        return subprocess.CompletedProcess(['gh'], code, stdout, stderr)

    def capture(self):
        raw = io.BytesIO()
        stream = io.TextIOWrapper(raw, encoding='utf-8')
        self.addCleanup(stream.close)
        self.enterContext(patch.object(m.sys, 'stderr', stream))
        return raw

    def test_workflow_json_retries_explicit_temporary_failures_and_keeps_stderr(self):
        for diagnostic in [b'net/http: TLS handshake timeout\n', b'gh: HTTP 502\n',
                           b'gh: HTTP 503: Service Unavailable\n', b'gh: HTTP 504\n',
                           b'read: connection reset by peer\n']:
            with self.subTest(diagnostic=diagnostic):
                output = self.capture()
                with patch.object(m.subprocess, 'run', side_effect=[self.result(1, stderr=diagnostic),
                        self.result(0, b'{"source":"fresh"}')]) as run, patch.object(m.time, 'sleep') as sleep:
                    self.assertEqual(workflow.gh_json('repos/owner/repo/pulls/47'), {'source': 'fresh'})
                    self.assertEqual(run.call_count, 2)
                    self.assertEqual(run.call_args.args[0], ['gh', 'api', '--method', 'GET', 'repos/owner/repo/pulls/47'])
                    sleep.assert_called_once_with(.5)
                    self.assertEqual(output.getvalue(), diagnostic)

    def test_auth_missing_resources_and_bad_json_do_not_retry(self):
        output = self.capture()
        diagnostics = [b'gh: HTTP 401: Bad credentials\n', b'gh: HTTP 403: Forbidden\n',
                       b'gh: HTTP 404: Not Found\n', b'gh auth login\n',
                       b'gh: HTTP 404; previous TLS handshake timeout\n']
        for diagnostic in diagnostics:
            with self.subTest(diagnostic=diagnostic), \
                    patch.object(m.subprocess, 'run', return_value=self.result(1, stderr=diagnostic)) as run, \
                    patch.object(m.time, 'sleep') as sleep:
                with self.assertRaises(subprocess.CalledProcessError):m.api_json('repos/owner/missing')
                run.assert_called_once();sleep.assert_not_called()
        self.assertEqual(output.getvalue(), b''.join(diagnostics))
        with patch.object(m.subprocess, 'run', return_value=self.result(0, b'not JSON')) as run, \
                patch.object(m.time, 'sleep') as sleep:
            with self.assertRaises(json.JSONDecodeError):m.api_json('repos/owner/repo')
            run.assert_called_once();sleep.assert_not_called()

    def test_final_failure_is_bounded_and_retains_every_diagnostic_and_last_error(self):
        diagnostics = [b'TLS handshake timeout\n', b'HTTP 503\n', b'connection reset by peer\n']
        output = self.capture()
        with patch.object(m.subprocess, 'run', side_effect=[self.result(1, b'last-body', raw) for raw in diagnostics]) as run, \
                patch.object(m.time, 'sleep') as sleep:
            with self.assertRaises(subprocess.CalledProcessError) as failure:m.api_bytes('repos/owner/repo')
            self.assertEqual(run.call_count, 3)
            self.assertEqual(sleep.call_args_list, [call(.5), call(1)])
            self.assertEqual(failure.exception.stderr, diagnostics[-1])
            self.assertEqual(failure.exception.output, b'last-body')
            self.assertEqual(output.getvalue(), b''.join(diagnostics))

    def test_zip_bytes_are_unchanged_and_successful_reads_are_never_cached(self):
        raw_zip = b'PK\x03\x04\xff\x00exact original ZIP bytes'
        self.capture()
        with patch.object(m.subprocess, 'run', side_effect=[self.result(1, stderr=b'TLS handshake timeout\n'),
                self.result(0, raw_zip), self.result(0, b'{"id":1}'), self.result(0, b'{"id":2}')]) as run, \
                patch.object(m.time, 'sleep'):
            self.assertEqual(m.api_bytes('repos/owner/repo/actions/artifacts/7/zip'), raw_zip)
            self.assertEqual(m.api_json('repos/owner/repo'), {'id': 1})
            self.assertEqual(m.api_json('repos/owner/repo'), {'id': 2})
            self.assertEqual(run.call_count, 4)


if __name__ == '__main__':
    unittest.main()
