import { system } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

// Replaced with a JSON literal by generate_board_probe.py. This is not production.
const config = /*__PROBE_CONFIG__*/ null;
const active = new Set();
const horizontal = ['left', 'center', 'right', 'justify', 'distributed'];
const vertical = ['top', 'middle', 'bottom'];
const guideNames = ['depth_charge', 'mystery_cocktail', 'nether_special', 'ice_grape'];
const rawSeed = 'raw first line\nraw second line; literal \\n; backslash \\; 中文';

function emit(player, data) {
  const row = { probe: 'kt_board_multiline', client_tested: false, ...data };
  // Copy this explicit diagnostic output; it is not an automatic acceptance record.
  console.warn('[KT_CLIENT_PARITY] ' + JSON.stringify(row));
  player.sendMessage('[KT probe] ' + JSON.stringify(row));
}

function makeSeed(kind, mode) {
  if (mode === 'raw') return rawSeed;
  const limit = config.kinds[kind] ?? 100;
  const count = mode === 'over' ? limit + 1 : mode === 'limit' ? limit : 101;
  return 'A'.repeat(count - 8) + 'END12345';
}

async function show(player, words) {
  const [kind = 'sandwich', mode = 'raw'] = words;
  if (kind === 'guide') {
    const form = new ActionFormData().title('KT guide image control probe')
      .body('Inspect all four source flipbooks, then the ordinary vanilla icon. No guide navigation is changed.');
    for (const name of guideNames) form.button(name, 'textures/ui/tavern_entries/' + name);
    form.button('Foreign ordinary image', 'textures/items/apple');
    const answer = await form.show(player);
    emit(player, { kind, canceled: answer.canceled, selection: answer.selection ?? null });
    return;
  }
  if (!(kind in config.kinds) && !['foreign', 'near_marker', 'wrong_field'].includes(kind)) {
    throw new Error('Use sandwich|small|large|foreign|near_marker|wrong_field|guide, optionally raw|101|limit|over');
  }
  if (!['raw', '101', 'limit', 'over'].includes(mode)) throw new Error('Invalid seed mode');
  const seed = makeSeed(kind, mode);
  const title = kind === 'foreign' ? 'Unowned ordinary form' : config.titlePrefix + (kind === 'wrong_field' ? 'sandwich' : kind);
  const form = new ModalFormData().title(title)
    .textField(kind === 'wrong_field' ? 'Unowned field' : config.field,
      'Raw newline and literal backslash-n are different', { defaultValue: seed })
    .dropdown('Horizontal (index 1)', horizontal, { defaultValueIndex: 3 })
    .dropdown('Vertical (index 2)', vertical, { defaultValueIndex: 2 });
  const answer = await form.show(player);
  const values = answer.formValues ?? null;
  const returned = typeof values?.[0] === 'string' ? values[0] : null;
  emit(player, {
    kind, mode, canceled: answer.canceled, cancellationReason: answer.cancelationReason ?? null,
    seedLengthUtf16: seed.length, seed, values, untouchedDefaultEqual: returned === seed,
    returnedLengthUtf16: returned?.length ?? null,
    rawNewlineCount: returned === null ? null : (returned.match(/\n/g) ?? []).length,
    literalBackslashNCount: returned === null ? null : (returned.match(/\\n/g) ?? []).length,
    expectedUntouchedDropdowns: [3, 2],
    valuesHaveExpectedShape: Array.isArray(values) && values.length === 3 && returned !== null
      && Number.isInteger(values[1]) && values[1] >= 0 && values[1] < horizontal.length
      && Number.isInteger(values[2]) && values[2] >= 0 && values[2] < vertical.length,
  });
}

// Real manually invoking player only. No runCommand, player simulation, camera,
// world persistence, block edits, board codec, inventory or effect mutation.
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== 'kt_client_parity:board') return;
  const player = event.sourceEntity;
  if (player?.typeId !== 'minecraft:player') return;
  if (active.has(player.id)) {
    player.sendMessage('[KT probe] A diagnostic form is already open.');
    return;
  }
  active.add(player.id);
  // Close the command/chat UI before the modal opens. No automatic retry loop.
  system.runTimeout(() => {
    show(player, event.message.trim().split(/\s+/).filter(Boolean))
      .catch(error => emit(player, { error: String(error) }))
      .finally(() => active.delete(player.id));
  }, 10);
});
