"""Synthetic console captures; no BDS, LIVE world or simulated players."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from family_update import native_common as m
from family_update.test_native_ticking_areas import COMMANDS, PROBE_COMMAND, ConsoleProcess


def profile_bytes(end=200):
    return json.dumps({'nodes': [{'id': 1, 'callFrame': {'functionName': 'synthetic'}}],
                       'samples': [1], 'timeDeltas': [end], 'startTime': 0, 'endTime': end}).encode()


class ProfileConsole(ConsoleProcess):
    def __init__(self, output, engine, mode, capture):
        self.engine = engine;self.mode = mode;self.capture = capture
        super().__init__(output, mode == 'early_error', ('40, 0, -24', 1) if mode == 'timeout' else None)

    def flush(self):
        lines = self.pending.splitlines();self.pending = ''
        for command in lines:
            if command == 'script profiler start':
                self.executed.append(command);self.line('INFO', 'Synthetic profiler started')
                if self.mode == 'error':self.line('ERROR', 'original post-start script failure')
            elif command == 'script profiler stop':
                self.executed.append(command)
                self.capture(self.engine)
                self.line('INFO', 'Synthetic profiler stopped')
            else:
                self.pending = command+'\n';super().flush()


class NativeCpuProfileTests(unittest.TestCase):
    def make_engine(self):
        temporary = tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
        engine = Path(temporary.name) / 'engine';engine.mkdir()
        return engine

    @staticmethod
    def capture(engine):
        directory = engine / 'profiles';directory.mkdir(exist_ok=True)
        (directory / 'new.cpuprofile').write_bytes(profile_bytes())

    def run_native(self, engine, enabled=True, mode='ready', capture=None):
        processes = []
        def launch(*args, **kwargs):
            process = ProfileConsole(kwargs['stdout'], engine, mode, capture or self.capture)
            processes.append(process);return process
        with patch.object(m.subprocess, 'Popen', side_effect=launch), patch.object(m.time, 'sleep'), \
                patch.object(m, 'STARTUP_MARKERS', ['Server started.', 'family ready']):
            result = m.native_run(engine, 'first', minimum_seconds=0, commands=COMMANDS,
                                  delayed_commands=[PROBE_COMMAND], cpu_profile=enabled)
        return result, processes[0]

    def test_disabled_keeps_commands_and_ignores_profiles_path(self):
        engine = self.make_engine();outside = engine.parent / 'outside';outside.mkdir()
        (engine / 'profiles').symlink_to(outside, target_is_directory=True)
        with patch.object(m, '_cpu_profile_files', side_effect=AssertionError('Disabled capture must not scan')):
            result, process = self.run_native(engine, enabled=False)
        self.assertTrue(result['ok']);self.assertNotIn('cpu_profile', result);self.assertNotIn('profiled', result)
        self.assertFalse(any(command.startswith('script profiler') for command in process.executed))
        self.assertEqual(process.executed, [*COMMANDS, PROBE_COMMAND,
                                          'execute in nether run tickingarea remove author_state_1',
                                          'execute in overworld run tickingarea remove native_storage_reanchor_0', 'stop'])

    def test_capture_stops_before_cleanup_and_only_collects_new_or_changed_files(self):
        engine = self.make_engine();directory = engine / 'profiles';directory.mkdir()
        (directory / 'unchanged.cpuprofile').write_bytes(profile_bytes(100))
        (directory / 'changed.cpuprofile').write_bytes(profile_bytes(100))
        def capture(engine):
            self.capture(engine)
            (engine / 'profiles/changed.cpuprofile').write_bytes(profile_bytes(300))
        result, process = self.run_native(engine, capture=capture)
        self.assertTrue(result['ok']);self.assertTrue(result['profiled']);self.assertTrue(result['cpu_profile']['ok'])
        self.assertEqual(process.executed.count('script profiler start'), 1)
        self.assertEqual(process.executed.count('script profiler stop'), 1)
        self.assertLess(process.executed.index('script profiler start'), process.executed.index(COMMANDS[0]))
        stop = process.executed.index('script profiler stop')
        self.assertLess(stop, process.executed.index('execute in nether run tickingarea remove author_state_1'))
        self.assertEqual(process.executed[-1], 'stop')
        files = result['cpu_profile']['files']
        self.assertEqual({row['path'] for row in files}, {'profiles/new.cpuprofile', 'profiles/changed.cpuprofile'})
        for row in files:
            raw = (engine / row['path']).read_bytes()
            self.assertEqual(row['sha256'], hashlib.sha256(raw).hexdigest());self.assertEqual(row['bytes'], len(raw))
        self.assertEqual(result['cpu_profile']['errors'], [])
        self.assertEqual(process.areas, {('overworld', 'player_keep'), ('nether', 'author_state_0')})

    def test_error_and_timeout_stop_started_capture_without_hiding_native_failure(self):
        for mode in ['error', 'timeout']:
            with self.subTest(mode=mode):
                result, process = self.run_native(self.make_engine(), mode=mode)
                self.assertFalse(result['ok']);self.assertEqual(result['stop_reason'], mode)
                self.assertTrue(result['cpu_profile']['ok'])
                self.assertLess(process.executed.index('script profiler stop'), process.executed.index('stop'))
                if mode == 'error':self.assertIn('original post-start script failure', result['errors'][0])
                else:self.assertEqual(result['errors'], [])

    def test_missing_or_invalid_artifact_is_not_success(self):
        for raw in [None, b'', b'not JSON', b'{"nodes":[],"samples":[]}']:
            with self.subTest(raw=raw):
                def capture(engine):
                    if raw is not None:
                        (engine / 'profiles').mkdir()
                        (engine / 'profiles/new.cpuprofile').write_bytes(raw)
                result, process = self.run_native(self.make_engine(), capture=capture)
                self.assertFalse(result['ok']);self.assertFalse(result['cpu_profile']['ok'])
                self.assertTrue(result['profiled']);self.assertEqual(result['cpu_profile']['files'], [])
                self.assertTrue(result['cpu_profile']['errors'])
                self.assertEqual(process.executed[-1], 'stop')

    def test_existing_profile_symlinks_are_rejected_before_engine_launch(self):
        for kind in ['directory', 'file']:
            with self.subTest(kind=kind):
                engine = self.make_engine();outside = engine.parent / 'outside';outside.mkdir()
                (outside / 'external.cpuprofile').write_bytes(profile_bytes())
                if kind == 'directory':(engine / 'profiles').symlink_to(outside, target_is_directory=True)
                else:
                    (engine / 'profiles').mkdir()
                    (engine / 'profiles/external.cpuprofile').symlink_to(outside / 'external.cpuprofile')
                with patch.object(m.subprocess, 'Popen') as launch, self.assertRaisesRegex(ValueError, 'symlink|regular file'):
                    m.native_run(engine, 'first', cpu_profile=True)
                launch.assert_not_called()

    def test_new_profile_symlink_does_not_admit_external_target(self):
        engine = self.make_engine();outside = engine.parent / 'external.cpuprofile';outside.write_bytes(profile_bytes())
        def capture(engine):
            (engine / 'profiles').mkdir()
            (engine / 'profiles/new.cpuprofile').symlink_to(outside)
        result, process = self.run_native(engine, capture=capture)
        self.assertFalse(result['ok']);self.assertEqual(result['cpu_profile']['files'], [])
        self.assertTrue(any('regular file' in error for error in result['cpu_profile']['errors']))
        self.assertEqual(process.executed[-1], 'stop')

    def test_early_fatal_does_not_start_or_stop_capture(self):
        result, process = self.run_native(self.make_engine(), mode='early_error')
        self.assertEqual(process.executed, ['stop']);self.assertFalse(result['profiled'])
        self.assertFalse(result['ok']);self.assertFalse(result['cpu_profile']['ok'])
        self.assertEqual(len(result['errors']), 1);self.assertIn('original schema failure', result['errors'][0])


if __name__ == '__main__':unittest.main()
