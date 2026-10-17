"""QA console-process mocks; no game process, world or players are created."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from family_update import native_common as m


COMMANDS = [
    'execute in overworld run tickingarea add circle 31 66 -22 1 native_storage_reanchor_0',
    'execute in nether run tickingarea add circle 24 70 32 1 author_state_1 true',
]
PROBE_COMMAND = 'execute in nether run testforblock 24 70 32 minecraft:stone []'


class ConsoleProcess:
    def __init__(self, output, fatal, foreign_ack=None):
        self.output = output;self.fatal = fatal;self.returncode = None
        self.foreign_ack = foreign_ack
        self.stdin = self;self.pending = '';self.executed = []
        self.areas = {('overworld', 'player_keep'), ('nether', 'author_state_0')}
        self.line('ERROR' if fatal else 'INFO', 'original schema failure' if fatal else 'Server started.')
        if not fatal:self.line('INFO', 'family ready')

    def line(self, level, text):
        self.output.write('[2026-10-17 02:03:21:572 '+level+'] '+text+'\n');self.output.flush()

    def write(self, text):
        self.pending += text;return len(text)

    def flush(self):
        lines = self.pending.splitlines();self.pending = ''
        for command in lines:
            self.executed.append(command)
            if command in COMMANDS:
                index = COMMANDS.index(command)
                if index == 0 and self.foreign_ack is not None:
                    center, radius = self.foreign_ack[:2]
                    suffix = self.foreign_ack[2] if len(self.foreign_ack) == 3 else ''
                    self.areas.add(('overworld', 'foreign_external'))
                    self.line('INFO', 'Added ticking area centered at '+center+' with a radius of '+str(radius)+' chunks'+suffix+'.')
                    continue
                dimension, name, center = [('overworld', 'native_storage_reanchor_0', '24, 0, -24'),
                                           ('nether', 'author_state_1', '24, 0, 40')][index]
                if (dimension, name) in self.areas:
                    self.line('ERROR', 'A ticking area with this name already exists.')
                else:
                    self.areas.add((dimension, name))
                    # Synthetic translated regression preserves BDS chunk
                    # quantization, including negative Z; the reply has no name.
                    suffix = ' marked for preload' if command.endswith(' true') else ''
                    self.line('INFO', 'Added ticking area centered at '+center+' with a radius of 1 chunks'+suffix+'.')
            elif command.startswith('execute in ') and ' run tickingarea remove ' in command:
                words = command.split();key = (words[2], words[-1])
                if key not in self.areas:self.line('ERROR', 'No ticking areas exist in the current dimension.')
                else:self.areas.remove(key);self.line('INFO', 'Removed ticking area(s)')
            elif command == 'tickingarea remove_all':
                self.areas.clear();self.line('ERROR', 'No ticking areas exist in the current dimension.')
            elif command == PROBE_COMMAND:self.line('INFO', 'Successfully found the block at 24,70,32.')
            elif command == 'stop':
                if self.fatal:self.line('INFO', 'Server started.')
                self.line('INFO', 'Server stop requested.');self.returncode = 0
            else:raise AssertionError('Unexpected QA command: '+command)

    def poll(self):return self.returncode
    def communicate(self, text, timeout):self.write(text);self.flush();return '', None
    def kill(self):self.returncode = -9
    def wait(self):return self.returncode


class NativeTickingAreaTests(unittest.TestCase):
    def run_native(self, fatal, foreign_ack=None):
        temporary = tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
        engine = Path(temporary.name) / 'engine';engine.mkdir()
        processes = []
        def launch(*args, **kwargs):
            process = ConsoleProcess(kwargs['stdout'], fatal, foreign_ack);processes.append(process);return process
        with patch.object(m.subprocess, 'Popen', side_effect=launch), patch.object(m.time, 'sleep'), \
                patch.object(m, 'STARTUP_MARKERS', ['Server started.', 'family ready']):
            result = m.native_run(engine, 'first', minimum_seconds=0, commands=COMMANDS,
                                  delayed_commands=[PROBE_COMMAND])
        return result, processes[0]

    def test_early_fatal_sends_no_add_or_area_cleanup_and_retains_original_error(self):
        result, process = self.run_native(True)
        self.assertEqual(process.executed, ['stop'])
        self.assertEqual(process.areas, {('overworld', 'player_keep'), ('nether', 'author_state_0')})
        self.assertFalse(result['ok']);self.assertFalse(result['commands_sent'])
        self.assertEqual(result['stop_reason'], 'error')
        self.assertEqual(result['ticking_areas_created'], [])
        self.assertEqual(result['ticking_area_cleanup_commands'], [])
        self.assertEqual(len(result['errors']), 1)
        self.assertIn('original schema failure', result['errors'][0])
        self.assertEqual(result['missing_startup_markers'], ['family ready'])

    def test_plain_and_preload_acknowledged_areas_are_cleaned_in_their_own_dimensions(self):
        result, process = self.run_native(False)
        self.assertTrue(result['ok']);self.assertTrue(result['commands_completed'])
        self.assertTrue(result['delayed_commands_sent'])
        self.assertEqual(result['ticking_areas_created'], [
            {'dimension': 'overworld', 'name': 'native_storage_reanchor_0'},
            {'dimension': 'nether', 'name': 'author_state_1'}])
        self.assertEqual(result['ticking_area_cleanup_commands'], [
            'execute in nether run tickingarea remove author_state_1',
            'execute in overworld run tickingarea remove native_storage_reanchor_0'])
        self.assertNotIn('tickingarea remove_all', process.executed)
        self.assertEqual(process.areas, {('overworld', 'player_keep'), ('nether', 'author_state_0')})
        self.assertEqual(result['errors'], [])

    def test_foreign_chunk_radius_or_unknown_suffix_cannot_complete_or_clean_pending_name(self):
        for acknowledgement in [('40, 0, -24', 1), ('24, 0, -24', 2),
                                ('40, 0, -24', 1, ' marked for preload'),
                                ('24, 0, -24', 2, ' marked for preload'),
                                ('24, 0, -24', 1, ' marked for preloaded'),
                                ('24, 0, -24', 1, ' marked for preload extra'),
                                ('24, 0, -24', 1, ' unknown')]:
            with self.subTest(acknowledgement=acknowledgement):
                result, process = self.run_native(False, acknowledgement)
                self.assertFalse(result['ok']);self.assertFalse(result['commands_completed'])
                self.assertFalse(result['delayed_commands_sent'])
                self.assertEqual(result['stop_reason'], 'timeout')
                self.assertEqual(result['ticking_areas_created'], [])
                self.assertEqual(result['ticking_area_cleanup_commands'], [])
                self.assertEqual(process.executed, [COMMANDS[0], 'stop'])
                self.assertEqual(process.areas, {('overworld', 'player_keep'), ('nether', 'author_state_0'),
                                                ('overworld', 'foreign_external')})


if __name__ == '__main__':unittest.main()
