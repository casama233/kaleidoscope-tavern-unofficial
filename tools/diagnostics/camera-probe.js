import { world, system, LinearSpline, EasingType, GameMode } from '@minecraft/server';

// Opt-in private diagnostic. No startup camera, player rotation/teleport,
// input-permission changes, production effect changes, or parity assertion.
const SOURCE_COMMIT = '__PROBE_SOURCE_COMMIT__';
const NAMESPACE = 'kt_camera_probe';
const HOLD_TICKS = 400;
const WAVE_TICKS = 160;
const SAMPLE_INTERVAL = 4;
const MAX_ROWS = 110;
const TOKEN = 'clean_no_other_camera';
const sessions = new Map();
const scenes = new Map();
const reports = new Map();
let ticker;

const vec = value => ({ x: +value.x.toFixed(6), y: +value.y.toFixed(6), z: +value.z.toFixed(6) });
const rotation = value => ({ x: +value.x.toFixed(6), y: +value.y.toFixed(6) });
const javaRoll = ticks => Math.sin(ticks / 19) * .6 + Math.cos(ticks / 13) * .3 + Math.sin(ticks / 9) * .1;
function log(row) {
  console.info('[TavernCameraProbe] ' + JSON.stringify({ sourceCommit: SOURCE_COMMIT, tick: system.currentTick, ...row }));
}
function say(player, message) {
  try { player.sendMessage('[Camera probe] ' + message); } catch { /* offline handle */ }
}
function status(player) {
  requirePrivate(player);
  const session = sessions.get(player.id);
  const report = reports.get(player.id);
  say(player, 'source=' + SOURCE_COMMIT.slice(0, 8) + '; ' + (report ?? 'no test submitted') +
    (session ? '; elapsedTicks=' + (system.currentTick - session.start) + '; samples=' + session.rows : '; idle') +
    '; camera rendering is not readable by this API');
}
function remember(player, value) {
  reports.delete(player.id);
  reports.set(player.id, value);
  if (reports.size > 8) reports.delete(reports.keys().next().value);
}
function parameters(session) {
  return 'mode=' + session.mode + '; 3 points; alpha=0->1; pathX=' + (session.mode === 'free_delivery' ? 2 : .02) +
    '; yawDelta=' + (session.mode === 'free_delivery' ? 20 : 0) + '; z=' +
    (session.mode === 'free_wave' ? 'Java-wave' : session.mode.endsWith('minus') ? -8 : session.mode.endsWith('plus') ? 8 : 0) +
    '; duration=' + session.duration / 20 + 's';
}
function requirePrivate(player) {
  if (!player || player.typeId !== 'minecraft:player') throw new Error('PLAYER_SOURCE_REQUIRED');
  if (world.getAllPlayers().length !== 1) throw new Error('SINGLE_PLAYER_PRIVATE_WORLD_REQUIRED');
  if (player.getGameMode() !== GameMode.Creative) throw new Error('CREATIVE_PRIVATE_WORLD_REQUIRED');
}
function requireClean(player) {
  requirePrivate(player);
  // Host custom effects are BP-UUID scoped and cannot be read here. The
  // command token acknowledges the canonical guide's empty-effect baseline.
  if (player.getEffects().length) throw new Error('CLEAR_NATIVE_EFFECTS_FIRST');
  if (!player.isValid || player.getComponent('minecraft:health')?.currentValue <= 0) throw new Error('LIVE_PLAYER_REQUIRED');
  if (typeof player.camera?.playAnimation !== 'function') throw new Error('CAMERA_PLAY_ANIMATION_UNAVAILABLE');
}
function snapshot(player) {
  const hit = player.getBlockFromViewDirection({ maxDistance: 20 });
  return {
    location: vec(player.location), head: vec(player.getHeadLocation()),
    rotation: rotation(player.getRotation()), viewDirection: vec(player.getViewDirection()),
    rayTarget: hit ? { typeId: hit.block.typeId, location: vec(hit.block.location), face: String(hit.face) } : null
  };
}
function stopTickerWhenEmpty() {
  if (!sessions.size && ticker !== undefined) { system.clearRun(ticker); ticker = undefined; }
}
function finish(session, reason, error) {
  if (sessions.get(session.id) !== session) return;
  sessions.delete(session.id);
  if (session.pending !== undefined) system.clearRun(session.pending);
  let clearError = null;
  if (session.ownsCamera) {
    try { session.player.camera.clear(); } catch (e) { clearError = String(e); }
  }
  let end = null;
  try { end = snapshot(session.player); } catch { /* offline handle */ }
  log({ event: 'end', mode: session.mode, reason, error: error ?? null, clearAttempted: session.ownsCamera, clearError, samples: session.rows, end });
  remember(session.player, parameters(session) + '; end=' + reason + '; samples=' + session.rows +
    '; cleanup=' + (clearError ? 'failed' : session.ownsCamera ? 'clear returned' : 'not owned') +
    (error ? '; error=' + String(error).slice(0, 180) : ''));
  try { status(session.player); } catch { /* ended/offline precondition */ }
  stopTickerWhenEmpty();
}
function optionsFor(session) {
  const duration = session.duration / 20;
  const base = session.base.rotation;
  const make = (timeSeconds, z) => ({ timeSeconds, rotation: { x: base.x, y: base.y, z }, easingFunc: EasingType.Linear });
  let keys;
  if (session.mode === 'free_delivery') {
    keys = [make(0, 0), { ...make(2, 0), rotation: { x: base.x, y: base.y + 20, z: 0 } }, { ...make(duration, 0), rotation: { x: base.x, y: base.y + 20, z: 0 } }];
  } else if (session.mode === 'free_wave') {
    keys = Array.from({ length: WAVE_TICKS + 1 }, (_, i) => make(i / 20, javaRoll(session.start + i)));
  } else {
    const z = session.mode.endsWith('minus') ? -8 : session.mode.endsWith('zero') ? 0 : 8;
    keys = [make(0, 0), make(.25, z), make(duration, z)];
  }
  return {
    animation: {
      // Three distinct points and actual progress remove the old trial's
      // unvalidated two-point/constant-alpha construction. Hold after 2s.
      progressKeyFrames: [{ timeSeconds: 0, alpha: 0, easingFunc: EasingType.Linear }, { timeSeconds: 2, alpha: 1, easingFunc: EasingType.Linear }, { timeSeconds: duration, alpha: 1, easingFunc: EasingType.Linear }],
      rotationKeyFrames: keys
    },
    totalTimeSeconds: duration
  };
}
function play(session) {
  if (sessions.get(session.id) !== session) return;
  session.pending = undefined;
  try {
    requireClean(session.player);
    if (session.player.dimension.id !== session.dimension) throw new Error('DIMENSION_CHANGED_BEFORE_PLAY');
    if (Math.hypot(session.player.location.x - session.base.location.x, session.player.location.y - session.base.location.y, session.player.location.z - session.base.location.z) > .25) throw new Error('MOVED_BEFORE_PLAY');
    const spline = new LinearSpline();
    const head = session.base.head;
    const distance = session.mode === 'free_delivery' ? 2 : .02;
    spline.controlPoints = [head, { ...head, x: head.x + distance / 2 }, { ...head, x: head.x + distance }];
    // Own only this acknowledged private test, including a normal-camera
    // attempt that might succeed. clear() has no foreign-state restore API.
    session.ownsCamera = true;
    session.player.camera.playAnimation(spline, optionsFor(session));
    session.animationTick = system.currentTick;
    session.until = system.currentTick + session.duration + 2;
    log({ event: 'animation_started', mode: session.mode, sourceDoesNotCallPlayerRotationOrTeleport: true,
      phaseBasis: session.mode === 'free_wave' ? 'server_currentTick_calibration_not_java_player_age_or_partialTick' : 'held_axis_endpoint',
      totalTimeSeconds: session.duration / 20, snapshot: snapshot(session.player) });
    remember(session.player, parameters(session) + '; API=returned (rendering unverified)');
    status(session.player);
  } catch (e) { finish(session, 'API_ERROR', String(e)); }
}
function start(player, mode, acknowledgement) {
  const modes = ['normal_plus', 'normal_minus', 'free_delivery', 'free_zero', 'free_plus', 'free_minus', 'free_wave'];
  if (!modes.includes(mode) || acknowledgement !== TOKEN) throw new Error('USE_RUN_MODE_CLEAN_NO_OTHER_CAMERA_ACK');
  requireClean(player);
  if (sessions.has(player.id)) throw new Error('ABORT_CURRENT_TEST_FIRST');
  const session = { id: player.id, player, mode, start: system.currentTick, dimension: player.dimension.id,
    base: snapshot(player), duration: mode === 'free_wave' ? WAVE_TICKS : HOLD_TICKS,
    until: system.currentTick + (mode === 'free_wave' ? WAVE_TICKS : HOLD_TICKS) + 4,
    rows: 0, ownsCamera: false, pending: undefined, animationTick: undefined };
  sessions.set(player.id, session);
  log({ event: 'begin', mode, acknowledgement, base: session.base, cameraGetterUnavailable: true, customEffectBaseline: 'manual_host_guide_required_uuid_scoped' });
  if (ticker === undefined) ticker = system.runInterval(tick, 1);
  if (mode.startsWith('normal_')) {
    // Deliberately no setCamera here: inspect the current ordinary camera first.
    play(session);
  } else {
    try {
      session.ownsCamera = true;
      player.camera.setCamera('minecraft:free', { location: session.base.head, rotation: session.base.rotation });
      session.pending = system.runTimeout(() => play(session), 2);
    } catch (e) { finish(session, 'API_ERROR', String(e)); }
  }
}
function tick() {
  for (const session of [...sessions.values()]) {
    try {
      const player = session.player;
      if (!player.isValid) { finish(session, 'PLAYER_INVALID'); continue; }
      if (world.getAllPlayers().length !== 1 || player.getGameMode() !== GameMode.Creative) { finish(session, 'PRIVATE_PRECONDITION_CHANGED'); continue; }
      if (player.getEffects().length) { finish(session, 'NATIVE_EFFECTS_CHANGED'); continue; }
      if (player.dimension.id !== session.dimension) { finish(session, 'DIMENSION_CHANGED'); continue; }
      if (player.getComponent('minecraft:health')?.currentValue <= 0) { finish(session, 'PLAYER_DEAD'); continue; }
      if (system.currentTick >= session.until) { finish(session, 'TIMEOUT'); continue; }
      if (Math.hypot(player.location.x - session.base.location.x, player.location.y - session.base.location.y, player.location.z - session.base.location.z) > .25) {
        finish(session, 'MOVED_FROM_STATIONARY_TEST'); continue;
      }
      if ((system.currentTick - session.start) % SAMPLE_INTERVAL !== 0 || session.rows >= MAX_ROWS) continue;
      session.rows++;
      const current = snapshot(player);
      const deltaYaw = ((current.rotation.y - session.base.rotation.y + 180) % 360 + 360) % 360 - 180;
      log({ event: 'sample', mode: session.mode, elapsedTicks: system.currentTick - session.start,
        deltaYaw: +deltaYaw.toFixed(6), deltaPitch: +(current.rotation.x - session.base.rotation.x).toFixed(6), ...current });
    } catch (e) { finish(session, 'SAMPLER_ERROR', String(e)); }
  }
}
function buildScene(player) {
  requirePrivate(player);
  if (sessions.has(player.id)) throw new Error('ABORT_CAMERA_TEST_BEFORE_SCENE_EDIT');
  if (scenes.has(player.id)) throw new Error('CLEAR_EXISTING_PROBE_SCENE_FIRST');
  const head = player.getHeadLocation(), yaw = player.getRotation().y * Math.PI / 180;
  const direction = Math.abs(Math.sin(yaw)) > Math.abs(Math.cos(yaw)) ? { x: -Math.sign(Math.sin(yaw)), z: 0 } : { x: 0, z: Math.sign(Math.cos(yaw)) || 1 };
  const right = { x: -direction.z, z: direction.x };
  const center = { x: Math.floor(head.x + direction.x * 7), y: Math.floor(head.y) + 3, z: Math.floor(head.z + direction.z * 7) };
  const cells = [];
  for (let y = -3; y <= 3; y++) for (let x = -5; x <= 5; x++) {
    const location = { x: center.x + right.x * x, y: center.y + y, z: center.z + right.z * x };
    const block = player.dimension.getBlock(location);
    if (!block || !block.isAir) throw new Error('SCENE_REQUIRES_77_LOADED_AIR_BLOCKS');
    let typeId = x === 0 || y === 0 ? 'minecraft:black_concrete' : (x + y) % 2 ? 'minecraft:light_gray_concrete' : 'minecraft:white_concrete';
    if (x === 0 && y === 0) typeId = 'minecraft:lime_concrete';
    if (Math.abs(x) === 5 && Math.abs(y) === 3) typeId = 'minecraft:' + (y > 0 ? x < 0 ? 'red' : 'blue' : x < 0 ? 'yellow' : 'cyan') + '_concrete';
    cells.push({ location, typeId });
  }
  const scene = { dimension: player.dimension, cells: [] };
  scenes.set(player.id, scene);
  try {
    for (const cell of cells) {
      const block = player.dimension.getBlock(cell.location);
      if (!block?.isAir) throw new Error('SCENE_AIR_PREFLIGHT_CHANGED');
      scene.cells.push(cell);
      block.setType(cell.typeId);
    }
  } catch (e) { clearScene(player); throw e; }
  log({ event: 'scene_built', cells: cells.length, center, targetCenter: { x: center.x + .5, y: center.y + .5, z: center.z + .5 }, direction });
  say(player, 'Marked wall built; manually aim at lime center near ' + JSON.stringify(center) + '. No player rotation or teleport was applied.');
}
function clearScene(player) {
  const scene = scenes.get(player.id);
  if (!scene) { say(player, 'No tracked scene in this script lifetime'); return; }
  let cleared = 0, kept = 0;
  for (const cell of scene.cells) {
    try {
      const block = scene.dimension.getBlock(cell.location);
      if (block?.typeId === cell.typeId) { block.setType('minecraft:air'); cleared++; } else kept++;
    } catch { kept++; }
  }
  scenes.delete(player.id);
  log({ event: 'scene_cleared', cleared, kept });
  say(player, 'Scene cleanup: ' + cleared + ' own matching blocks cleared, ' + kept + ' unavailable/changed blocks kept');
}
function handle(event) {
  if (!event.id.startsWith(NAMESPACE + ':') || event.message.length > 96) return;
  const player = event.sourceEntity;
  if (player?.typeId !== 'minecraft:player') return;
  try {
    const command = event.id.slice(NAMESPACE.length + 1);
    const words = event.message.trim().split(/\s+/);
    if (command === 'run') start(player, words[0], words[1]);
    else if (command === 'scene' && words[0] === 'build') buildScene(player);
    else if (command === 'scene' && words[0] === 'clear') { if (sessions.has(player.id)) throw new Error('ABORT_CAMERA_TEST_FIRST'); clearScene(player); }
    else if (command === 'abort') {
      const session = sessions.get(player.id);
      if (session) finish(session, 'EXPLICIT_ABORT'); else say(player, 'No owned camera test; no clear issued');
    } else if (command === 'status') status(player);
    else if (command === 'inspect') { requirePrivate(player); log({ event: 'inspect', snapshot: snapshot(player), active: sessions.get(player.id)?.mode ?? null, playAnimationAvailable: typeof player.camera?.playAnimation === 'function' }); say(player, 'snapshot=' + JSON.stringify(snapshot(player)) + '; playAnimation=' + (typeof player.camera?.playAnimation === 'function')); status(player); }
  } catch (e) { log({ event: 'request_rejected', command: event.id, error: String(e) }); say(player, String(e)); }
}
system.afterEvents.scriptEventReceive.subscribe(handle, { namespaces: [NAMESPACE] });
world.afterEvents.itemCompleteUse.subscribe(event => { if (event.itemStack?.typeId === 'minecraft:milk_bucket') { const session = sessions.get(event.source?.id); if (session) finish(session, 'MILK_ABORT'); } });
world.afterEvents.playerSpawn.subscribe(event => { const session = sessions.get(event.player.id); if (session) finish(session, 'PLAYER_SPAWN'); });
world.afterEvents.playerLeave.subscribe(event => { const session = sessions.get(event.playerId); if (session) finish(session, 'PLAYER_LEFT'); });
