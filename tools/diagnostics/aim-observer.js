import { world, system, GameMode } from '@minecraft/server';

// Read-only native aim telemetry. No camera/effect/input/settings/world writes.
const SOURCE_COMMIT = '__OBSERVER_SOURCE_COMMIT__';
const DURATION_TICKS = 300, MAX_SAMPLES = 350;
const sessions = new Map(), results = new Map();
let ticker;
function say(player, value) { try { player.sendMessage('[Aim observer] ' + value); } catch {} }
function log(value) { console.info('[TavernAimObserver] ' + JSON.stringify({ sourceCommit: SOURCE_COMMIT, tick: system.currentTick, ...value })); }
function guard(player) {
  if (!player || player.typeId !== 'minecraft:player' || !player.isValid) throw Error('LIVE_PLAYER_REQUIRED');
  if (world.getAllPlayers().length !== 1 || player.getGameMode() !== GameMode.Creative) throw Error('SINGLE_PLAYER_CREATIVE_REQUIRED');
  // Native/custom effects may be active: this observes the real drink lifecycle.
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
function snapshot(player) {
  const hit = player.getBlockFromViewDirection({ maxDistance: 20 });
  return { location: { ...player.location }, dimension: player.dimension.id, rotation: { ...player.getRotation() },
    viewDirection: { ...player.getViewDirection() },
    rayTarget: hit ? { typeId: hit.block.typeId, location: { ...hit.block.location }, face: String(hit.face) } : null };
}
function record(session, current = snapshot(session.player)) {
  const base = session.base, m = session.metrics;
  m.count++;
  m.maxYaw = Math.max(m.maxYaw, Math.abs(((current.rotation.y - base.rotation.y + 180) % 360 + 360) % 360 - 180));
  m.maxPitch = Math.max(m.maxPitch, Math.abs(current.rotation.x - base.rotation.x));
  m.maxViewDelta = Math.max(m.maxViewDelta, distance(current.viewDirection, base.viewDirection));
  if (current.dimension === base.dimension) m.maxPositionDelta = Math.max(m.maxPositionDelta, distance(current.location, base.location));
  else m.otherDimensionSamples++;
  if (JSON.stringify(current.rayTarget) !== JSON.stringify(base.rayTarget)) m.rayChanges++;
  log({ event: 'sample', sessionStartTick: session.start, elapsedTicks: system.currentTick - session.start, ...current });
}
function finish(session, reason, error) {
  if (sessions.get(session.id) !== session) return;
  sessions.delete(session.id);
  const report = { reason, error: error ? String(error).slice(0, 180) : null, sessionStartTick: session.start,
    elapsedTicks: system.currentTick - session.start, metrics: session.metrics, consumptionEvents: session.consumptionEvents,
    readOnlyObserver: true, renderedVerified: false };
  results.delete(session.id); results.set(session.id, report);
  if (results.size > 8) results.delete(results.keys().next().value);
  log({ event: 'end', ...report });
  say(session.player, 'source=' + SOURCE_COMMIT.slice(0, 8) + '; end=' + reason + '; metrics=' + JSON.stringify(session.metrics));
  if (error) say(session.player, 'error=' + String(error).slice(0, 180));
  say(session.player, 'Observer stopped only. No camera/effect state changed. Movement or mouse input must be interpreted separately; server rows do not prove rendered hand/crosshair.');
  if (!sessions.size && ticker !== undefined) { system.clearRun(ticker); ticker = undefined; }
}
function tick() {
  for (const session of [...sessions.values()]) {
    try {
      guard(session.player);
      if (system.currentTick - session.start >= DURATION_TICKS || session.metrics.count >= MAX_SAMPLES) { finish(session, 'COMPLETE'); continue; }
      record(session);
    } catch (error) { finish(session, 'GUARD_OR_SNAPSHOT_ERROR', error); }
  }
}
function start(player, acknowledgement) {
  guard(player);
  if (acknowledgement !== 'private_normal_firstperson') throw Error('ACK_REQUIRED: private_normal_firstperson');
  if (sessions.has(player.id)) throw Error('OBSERVER_ALREADY_ACTIVE');
  const session = { id: player.id, player, start: system.currentTick, base: snapshot(player), consumptionEvents: 0,
    metrics: { count: 0, maxYaw: 0, maxPitch: 0, maxViewDelta: 0, maxPositionDelta: 0, otherDimensionSamples: 0, rayChanges: 0 } };
  sessions.set(player.id, session);
  log({ event: 'begin', sessionStartTick: session.start, acknowledgement, durationTicks: DURATION_TICKS, maxSamples: MAX_SAMPLES, base: session.base, effectsAllowed: true, readOnlyObserver: true });
  record(session, session.base);
  say(player, 'source=' + SOURCE_COMMIT.slice(0, 8) + '; read-only15s observer started. Effects allowed. Close chat; perform the approved drink/milk test. No camera/effect writes.');
  if (ticker === undefined) ticker = system.runInterval(tick, 1);
}
function status(player) {
  guard(player);
  const s = sessions.get(player.id), r = results.get(player.id);
  say(player, 'source=' + SOURCE_COMMIT.slice(0, 8) + '; ' + (s ? 'active; elapsedTicks=' + (system.currentTick - s.start) + '; metrics=' + JSON.stringify(s.metrics) : r ? 'end=' + r.reason + '; metrics=' + JSON.stringify(r.metrics) : 'idle'));
}
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (!event.id.startsWith('kt_aim_observer:') || event.message.length > 80 || event.sourceEntity?.typeId !== 'minecraft:player') return;
  const player = event.sourceEntity;
  try {
    const command = event.id.slice('kt_aim_observer:'.length);
    if (command === 'start') start(player, event.message.trim());
    else if (command === 'status') status(player);
    else if (command === 'abort') { const s = sessions.get(player.id); if (s) finish(s, 'EXPLICIT_ABORT'); else say(player, 'Idle; no state changed'); }
  } catch (error) { log({ event: 'request_rejected', error: String(error) }); say(player, String(error)); }
}, { namespaces: ['kt_aim_observer'] });
world.afterEvents.playerLeave.subscribe(event => { const s = sessions.get(event.playerId); if (s) finish(s, 'PLAYER_LEFT'); });
world.afterEvents.playerSpawn.subscribe(event => { const s = sessions.get(event.player.id); if (s) finish(s, 'PLAYER_SPAWN'); });
world.afterEvents.itemCompleteUse.subscribe(event => {
  const s = sessions.get(event.source?.id);
  if (!s) return;
  s.consumptionEvents++;
  // Observes consumption only; milk must not stop the post-cancellation telemetry.
  log({ event: 'item_complete_use', sessionStartTick: s.start, elapsedTicks: system.currentTick - s.start, itemType: event.itemStack?.typeId ?? null });
});
