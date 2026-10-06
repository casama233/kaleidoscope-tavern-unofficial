import { world, system, GameMode, CameraShakeType } from '@minecraft/server';

// Manual, single-player private diagnostic. No startup effect, camera preset,
// player movement/rotation, setting changes, persistent state, or global stop.
const SOURCE_COMMIT = '__PROBE_SOURCE_COMMIT__';
const TOKEN = 'clean_no_other_shake_setting_on';
const sessions = new Map();
const results = new Map();
const BASELINE_TICKS = 20, SHAKE_TICKS = 60, AFTER_TICKS = 20, MAX_SAMPLES = 105;
let ticker;
function say(player, value) { try { player.sendMessage('[Shake probe] ' + value); } catch {} }
function log(value) { console.info('[TavernShakeProbe] ' + JSON.stringify({ sourceCommit: SOURCE_COMMIT, tick: system.currentTick, ...value })); }
function guard(player) {
  if (!player || player.typeId !== 'minecraft:player' || !player.isValid) throw Error('LIVE_PLAYER_SOURCE_REQUIRED');
  if (world.getAllPlayers().length !== 1 || player.getGameMode() !== GameMode.Creative) throw Error('SINGLE_PLAYER_CREATIVE_REQUIRED');
  if (player.getEffects().length) throw Error('CLEAR_NATIVE_EFFECTS_FIRST');
  if (player.getComponent('minecraft:health')?.currentValue <= 0) throw Error('LIVE_PLAYER_REQUIRED');
}
function snapshot(player) {
  const hit = player.getBlockFromViewDirection({ maxDistance: 20 });
  return { location: { ...player.location }, head: { ...player.getHeadLocation() }, rotation: { ...player.getRotation() }, viewDirection: { ...player.getViewDirection() },
    rayTarget: hit ? { typeId: hit.block.typeId, location: { ...hit.block.location }, face: String(hit.face) } : null };
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
function finish(session, reason, error) {
  if (sessions.get(session.id) !== session) return;
  sessions.delete(session.id);
  const report = { mode: 'single_native_rotational_shake', reason, error: error ? String(error).slice(0, 180) : null,
    retryAfterTick: session.requested ? session.shakeTick + SHAKE_TICKS + AFTER_TICKS : system.currentTick,
    retryAfterMs: session.shakeExpiresAt ?? 0, requested: session.requested, accepted: session.accepted, intensity: .05, durationSeconds: 3, samples: session.samples,
    metrics: session.metrics, cleanup: 'sampler stopped; no stopShaking/clear; owned event expires naturally', renderedVerified: false,
    allowCameraShake: 'manual acknowledgement only; never read or changed by script' };
  results.delete(session.id); results.set(session.id, report);
  if (results.size > 8) results.delete(results.keys().next().value);
  log({ event: 'end', ...report });
  say(session.player, 'end=' + reason + '; accepted=' + session.accepted + '; samples=' + session.samples + '; metrics=' + JSON.stringify(session.metrics));
  if (error) say(session.player, 'error=' + String(error).slice(0, 180));
  say(session.player, 'Sampler stopped. Any submitted shake expires after its own 3s; no global stop issued. Rendering/aim fidelity still requires native review.');
  if (!sessions.size && ticker !== undefined) { system.clearRun(ticker); ticker = undefined; }
}
function sample(session, phase) {
  const current = snapshot(session.player), base = session.base;
  const m = session.metrics[phase];
  m.count++;
  m.maxYaw = Math.max(m.maxYaw, Math.abs(((current.rotation.y - base.rotation.y + 180) % 360 + 360) % 360 - 180));
  m.maxPitch = Math.max(m.maxPitch, Math.abs(current.rotation.x - base.rotation.x));
  m.maxViewDelta = Math.max(m.maxViewDelta, distance(current.viewDirection, base.viewDirection));
  if (JSON.stringify(current.rayTarget) !== JSON.stringify(base.rayTarget)) m.rayChanges++;
  session.samples++;
  log({ event: 'sample', phase, elapsedTicks: system.currentTick - session.start, ...current });
}
function tick() {
  for (const session of [...sessions.values()]) {
    try {
      const player = session.player;
      guard(player);
      if (player.dimension.id !== session.dimension) throw Error('DIMENSION_CHANGED');
      if (distance(player.location, session.base.location) > .25) throw Error('MOVED_FROM_STATIONARY_TEST');
      const elapsed = system.currentTick - session.start;
      if (elapsed >= BASELINE_TICKS + SHAKE_TICKS + AFTER_TICKS || session.samples >= MAX_SAMPLES) {
        finish(session, 'COMPLETE'); continue;
      }
      if (!session.requested && elapsed >= BASELINE_TICKS) {
        session.requested = true;
        session.shakeTick = system.currentTick;
        session.shakeExpiresAt = Date.now() + 3000;
        // Exactly one event. No repeated pulses, camera preset or global cleanup.
        player.camera.addShake({ duration: 3, intensity: .05, type: CameraShakeType.Rotational });
        session.accepted = true;
        log({ event: 'shake_submitted', durationSeconds: 3, intensity: .05, type: 'Rotational', base: session.base });
        say(player, 'API returned: one rotational shake intensity0.05 for3s. Close chat; no mouse/movement. This is not Java sine-roll parity.');
      }
      const phase = !session.accepted ? 'before' : system.currentTick - session.shakeTick < SHAKE_TICKS ? 'during' : 'after';
      sample(session, phase);
    } catch (error) { finish(session, 'GUARD_OR_API_ERROR', error); }
  }
}
function start(player, token) {
  guard(player);
  if (token !== TOKEN) throw Error('ACK_REQUIRED: clean_no_other_shake_setting_on');
  if (sessions.has(player.id)) throw Error('TEST_ALREADY_ACTIVE');
  const previous = results.get(player.id);
  if (previous && (system.currentTick < previous.retryAfterTick || Date.now() < previous.retryAfterMs)) throw Error('WAIT_FOR_PREVIOUS_SHAKE_EXPIRY');
  if (typeof player.camera?.addShake !== 'function') throw Error('STABLE_2_10_ADD_SHAKE_UNAVAILABLE');
  const metric = () => ({ count: 0, maxYaw: 0, maxPitch: 0, maxViewDelta: 0, rayChanges: 0 });
  const session = { id: player.id, player, dimension: player.dimension.id, base: snapshot(player), start: system.currentTick,
    requested: false, accepted: false, shakeTick: undefined, samples: 0, metrics: { before: metric(), during: metric(), after: metric() } };
  sessions.set(player.id, session);
  log({ event: 'begin', acknowledgement: token, base: session.base, naturalExpiryOnly: true });
  try { sample(session, 'before'); } catch (error) { finish(session, 'SNAPSHOT_ERROR', error); return; }
  say(player, 'source=' + SOURCE_COMMIT.slice(0, 8) + '; baseline1s, one shake3s, after1s. Normal first-person and Allow Camera Shake ON must be manually verified; settings unchanged.');
  if (ticker === undefined) ticker = system.runInterval(tick, 1);
}
function status(player) {
  guard(player);
  const s = sessions.get(player.id), r = results.get(player.id);
  say(player, 'source=' + SOURCE_COMMIT.slice(0, 8) + '; ' + (s ? 'sampling; accepted=' + s.accepted + '; elapsedTicks=' + (system.currentTick - s.start) + '; metrics=' + JSON.stringify(s.metrics) : r ? 'end=' + r.reason + '; accepted=' + r.accepted + '; metrics=' + JSON.stringify(r.metrics) : 'idle; no test'));
}
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (!event.id.startsWith('kt_shake_probe:') || event.message.length > 80) return;
  const player = event.sourceEntity;
  if (player?.typeId !== 'minecraft:player') return;
  try {
    const command = event.id.slice('kt_shake_probe:'.length);
    if (command === 'start') start(player, event.message.trim());
    else if (command === 'status') status(player);
    else if (command === 'abort') { const s = sessions.get(player.id); if (s) finish(s, 'EXPLICIT_ABORT'); else say(player, 'Idle; no shake or camera state changed'); }
  } catch (error) { log({ event: 'request_rejected', error: String(error) }); say(player, String(error)); }
}, { namespaces: ['kt_shake_probe'] });
world.afterEvents.playerLeave.subscribe(event => { const s = sessions.get(event.playerId); if (s) finish(s, 'PLAYER_LEFT'); });
world.afterEvents.playerSpawn.subscribe(event => { const s = sessions.get(event.player.id); if (s) finish(s, 'PLAYER_SPAWN'); });
world.afterEvents.itemCompleteUse.subscribe(event => { if (event.itemStack?.typeId === 'minecraft:milk_bucket') { const s = sessions.get(event.source?.id); if (s) finish(s, 'MILK_ABORT'); } });
