"""Recorder contract regressions using synthetic transcripts, never a BDS claim."""
import copy
import json
import pathlib
import tempfile
import unittest

from record_shaker_migration import EVIDENCE_NAME, LOG_NAME, PREFIX, validate_phase, write_evidence

VERSION = '0.1.113'


def transcript(phase):
    addon = dict(source='kaleidoscope_world_liquor', version=VERSION, recipes=60, pages=50, shakerInputs=67)
    rows = []

    def case(mode, **values):
        rows.append(dict(kind='case', mode=mode, phase=phase, **values))

    case('addon_registration', **addon)
    for index, lock in enumerate(('inventory', 'slot')):
        if phase == 'first':
            rows.append(dict(kind='case', mode='native-cross-id', source='kaleidoscope_tavern:shaker_'+('active' if index == 0 else 'pouring'),
                             target='kaleidoscope_tavern:shaker', lock=lock, adventureLists=10, rawLore=True, hostScopeDynamicTypes=4))
        else:
            rows.append(dict(kind='case', mode='saved-metadata', slot=index, lock=lock))
    case('portable-stackable-ingredient-metadata', ingredients=3, nativeEquality=True, independentClone=True, fullArbitraryNBT=False)
    for kind, counts in (('pressing_tub', [11]), ('barrel', [3, 5, 1, 1])):
        case('native-machine-write' if phase == 'first' else 'native-machine-restart-recovery', machineKind=kind,
             slots=len(counts), counts=counts, schema=2, **({'hostScopeMetadata': True} if phase == 'first' else {'completeNativeSlots': True}))
    if phase == 'first':
        case('native-aura-acquisition', duration=597, ownLease=True, nativeParticleFlagsReadable=False)
    else:
        case('native-aura-saved-restore', duration=450, ownLease=True)
        case('native-aura-foreign-handoff', duration=797, ownLease=False, nativeParticleFlagsReadable=False)
    case('native-one-tick-invisibility-expiry', nativeTicksObserved=2, scriptTicksWaited=3, playerConcealmentVerified=False)
    case('native-outline-registry', glowing=False, client=False)
    case('native-put-recovery', activations=2, idleCallbacksMeasured=False)
    case('native-splash-rolled-heal', health=6, effects=1, eventEnvelope='observer', physicalImpact=False)
    case('native-splash-persisted-hook', health=5, rawAmount=0, healAmount=3, declaredThisPhase=phase == 'first')
    case('native-splash-armor-stand-immunity', health=2, effects=0)
    for owned in (True, False):
        case('native-splash-hurt-source', owned=owned, health=14,
             event=dict(target='cow-owned' if owned else 'cow-unowned', damage=6, cause='magic', owner='owner-id' if owned else None),
             sourceMapping='magic_owner_only', directProjectileRepresented=False)
    case('native-splash-cancelled-hurt', health=20, apiAcknowledgements=1, status='APPLIED_NATIVE_INSTANT', actualHurtEvents=0, acknowledgementIsDeliveredDamage=False)

    def recipient(type_id, health, inanimate, mob):
        return dict(type=type_id, valid=True, componentIds=['minecraft:health'] if health else [], healthAvailable=health is not None,
                    health=None if health is None else dict(currentValue=health, effectiveMin=0, effectiveMax=health),
                    families=['inanimate'] if inanimate else [], inanimate=inanimate, mob=mob, errors={})

    xp = recipient('minecraft:xp_orb', None, True, False)
    case('native-vision-recipient-components', immediateXp=copy.deepcopy(xp), settledXp=copy.deepcopy(xp),
         testOnlyHealthHelper=recipient('living_effect_qa:health_helper', 100, True, False), cod=recipient('minecraft:cod', 3, False, False))
    case('native-vision-living-class', excluded='living_effect_qa:health_helper', excludedHasHealth=True, excludedHealth=100,
         excludedHasMobFamily=False, testOnlyHealthWitness=True, additionalExcluded='minecraft:xp_orb', xpHealthApiAvailable=False,
         admitted=['minecraft:cow', 'minecraft:armor_stand', 'minecraft:cod'], codHasMobFamily=False, targets=3, newTargetSounds=1,
         outline='unavailable', recipientFunctionOnly=True, playerEffectEntrance=False, client=False)
    rows.append(dict(kind='done', phase=phase, players=0, playerSessions=0, client=False, crossPackPrivateData=False, addon_registration=addon))
    return dict(phase=phase, ok=True, normal_stop=True, errors=[], player_connections=0, observations=rows)


def raw_log(row):
    return ('Version: 1.26.52.3\n'+''.join(PREFIX+json.dumps(item)+'\n' for item in row['observations'])+'Quit correctly\n').encode()


def mode(row, name):
    return next(item for item in row['observations'] if item.get('mode') == name)


class RecorderTests(unittest.TestCase):
    def reject(self, row, raw=None):
        with self.assertRaises(AssertionError):
            validate_phase(row, raw if raw is not None else raw_log(row), VERSION)

    def test_complete_expanded_first_and_restart_contracts(self):
        for phase in ('first', 'restart'):
            row = transcript(phase)
            self.assertEqual(validate_phase(row, raw_log(row), VERSION)['version'], VERSION)
        # Both acknowledged and synchronously rejected native cancellation are honest observations.
        row = transcript('restart')
        mode(row, 'native-splash-cancelled-hurt').update(status='NATIVE_HURT_REJECTED', apiAcknowledgements=0)
        validate_phase(row, raw_log(row), VERSION)

    def test_missing_duplicate_and_unexpected_modes_are_rejected(self):
        for mutation in ('missing', 'duplicate', 'unexpected', 'legacy-only'):
            with self.subTest(mutation=mutation):
                row = transcript('first')
                if mutation == 'missing':
                    row['observations'].remove(mode(row, 'portable-stackable-ingredient-metadata'))
                elif mutation == 'duplicate':
                    row['observations'].insert(-1, copy.deepcopy(mode(row, 'native-put-recovery')))
                elif mutation == 'unexpected':
                    mode(row, 'native-put-recovery')['mode'] = 'unreviewed-mode'
                else:
                    row['observations'] = [item for item in row['observations'] if item.get('mode') in ('native-cross-id', 'native-put-recovery') or item['kind'] == 'done']
                self.reject(row)

    def test_machine_kind_overwrite_and_wrong_fields_counts_or_phase_are_rejected(self):
        for mutation in ('kind-overwrite', 'missing-field', 'counts', 'phase', 'duplicate-machine', 'duplicate-hurt-owner'):
            with self.subTest(mutation=mutation):
                row = transcript('restart')
                machine = mode(row, 'native-machine-restart-recovery')
                if mutation == 'kind-overwrite':
                    machine['kind'] = machine.pop('machineKind')
                elif mutation == 'missing-field':
                    del machine['completeNativeSlots']
                elif mutation == 'counts':
                    machine['counts'] = [10]
                elif mutation == 'phase':
                    machine['phase'] = 'first'
                elif mutation == 'duplicate-machine':
                    machines = [item for item in row['observations'] if item.get('mode') == machine['mode']]
                    machines[1].update(machine)
                else:
                    hurt = [item for item in row['observations'] if item.get('mode') == 'native-splash-hurt-source']
                    hurt[1].update(hurt[0])
                self.reject(row)

    def test_false_lifecycle_and_client_claims_are_rejected(self):
        mutations = [('row', 'ok', False), ('row', 'normal_stop', False), ('row', 'player_connections', 1),
                     ('row', 'errors', ['ERROR']), ('done', 'players', False), ('done', 'playerSessions', 1),
                     ('done', 'client', True), ('done', 'crossPackPrivateData', True), ('done', 'phase', 'first')]
        for target, key, value in mutations:
            with self.subTest(target=target, key=key):
                row = transcript('restart')
                (row if target == 'row' else row['observations'][-1])[key] = value
                self.reject(row)
        row = transcript('restart')
        mode(row, 'native-aura-foreign-handoff')['ownLease'] = True
        self.reject(row)
        row = transcript('first')
        row['observations'][-1]['addon_registration']['version'] = '0.1.111'
        self.reject(row)

    def test_report_cannot_override_raw_log_or_omit_failure(self):
        row = transcript('first'); raw = raw_log(row)
        mode(row, 'portable-stackable-ingredient-metadata')['nativeEquality'] = False
        self.reject(row, raw)
        row = transcript('first'); raw = raw_log(row)
        self.reject(row, raw.replace(b'Quit correctly', b''))
        self.reject(row, raw+PREFIX.encode()+b'{"kind":"failure","error":"late failure"}\n')
        self.reject(row, raw+b'Player connected: unexpected\n')
        self.reject(row, raw.replace(b'"nativeEquality": true', b'"nativeEquality": false'))

    def test_invisibility_expiry_requires_bounded_native_clock_evidence(self):
        for key in ('nativeTicksObserved', 'scriptTicksWaited'):
            row = transcript('first')
            del mode(row, 'native-one-tick-invisibility-expiry')[key]
            self.reject(row)
        for key, values in [('nativeTicksObserved', [0, 1, 19, True, 2.5]),
                            ('scriptTicksWaited', [0, 61, True, 3.5])]:
            for value in values:
                with self.subTest(key=key, value=value):
                    row = transcript('restart')
                    mode(row, 'native-one-tick-invisibility-expiry')[key] = value
                    self.reject(row)
        row = transcript('first')
        mode(row, 'native-one-tick-invisibility-expiry')['playerConcealmentVerified'] = True
        self.reject(row)

    def test_new_outputs_never_replace_either_existing_evidence_file(self):
        for existing in (EVIDENCE_NAME, LOG_NAME):
            with self.subTest(existing=existing), tempfile.TemporaryDirectory() as directory:
                work = pathlib.Path(directory); (work/existing).write_bytes(b'original proof')
                with self.assertRaises(AssertionError):
                    write_evidence(work, {}, ['new log'])
                self.assertEqual((work/existing).read_bytes(), b'original proof')
                self.assertEqual({path.name for path in work.iterdir()}, {existing})


if __name__ == '__main__':
    unittest.main()
