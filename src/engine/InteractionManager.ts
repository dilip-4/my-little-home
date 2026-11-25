import type {
  AdultState,
  CharacterId,
  GameState,
  KidState,
  MummyRoomState,
  PapaRoomState,
  ParentId,
  PupState,
  RoomId,
} from '../state/gameTypes';
import { defaultAdult, getGame } from '../state/gameStore';
import { AudioManager, type GuitarTune, type SoundName } from './AudioManager';
import { DialogueManager, readingTime } from './DialogueManager';
import { CooldownTracker, TapCounter } from './cooldowns';
import { pickVaried } from './random';
import { EventBus } from './EventManager';
import { KID_BED_SPOT, MUMMY_SPOTS, PAPA_SPOTS, type Spot } from '../data/spots';

/**
 * Event-driven interaction pipeline:
 *   USER INPUT → InteractionManager.trigger → definition lookup (context guards, rotation, cooldown)
 *   → lock check (priorities) → GameEvent emitted → definition.run(ctx) which drives
 *   character reactions, animation, dialogue, sound and state updates → cleanup / reset.
 */

export type Category = 'object' | 'prank' | 'combo' | 'character' | 'easter' | 'idle';

export interface InteractionDefinition {
  /** Unique game event identifier, e.g. BALL_THROWN_AT_PAPA */
  id: string;
  room: RoomId;
  /** Hotspot id that triggers it */
  target: string;
  action: string;
  category?: Category;
  /** Characters this interaction animates (they get locked while it runs) */
  uses?: CharacterId[];
  priority?: number;
  cooldownMs?: number;
  /** The kid must be awake and in the room (he will wake / run in first) */
  needsKid?: boolean;
  /** Contextual guard – contextual matches win over plain rotating variants */
  when?: (s: GameState) => boolean;
  sound?: SoundName;
  run: (c: Ctx) => Promise<void>;
}

class Aborted extends Error {
  constructor() {
    super('aborted');
  }
}

interface Running {
  runId: number;
  def: InteractionDefinition;
  ctrl: AbortController;
  actors: CharacterId[];
  priority: number;
  tempFx: Set<string>;
}

export interface ProjectileFx {
  id: number;
  kind: 'ball' | 'pillow' | 'book' | 'duck' | 'dino' | 'toy';
  from: { x: number; y: number };
  to: { x: number; y: number };
  dur: number;
  arc: number;
  spin?: boolean;
}

export class Ctx {
  constructor(private r: Running, private mgr: InteractionManagerImpl) {}
  get signal() {
    return this.r.ctrl.signal;
  }
  get s(): GameState {
    return getGame();
  }
  get room(): RoomId {
    return this.r.def.room;
  }
  /** The running interaction's event id. */
  get id(): string {
    return this.r.def.id;
  }
  check() {
    if (this.r.ctrl.signal.aborted) throw new Aborted();
  }
  wait(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.signal.aborted) return reject(new Aborted());
      const t = setTimeout(() => {
        this.signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(t);
        reject(new Aborted());
      };
      this.signal.addEventListener('abort', onAbort, { once: true });
    });
  }
  /** Picks a varied line from a list (never the same twice in a row). */
  pick<T>(key: string, lines: readonly T[]): T {
    return pickVaried(key, lines);
  }
  /** Shows a speech bubble and waits for (most of) its reading time. */
  async say(who: CharacterId, text: string, opts: { wait?: boolean; priority?: number; ms?: number } = {}) {
    this.check();
    const ms = opts.ms ?? readingTime(text);
    DialogueManager.say(who, text, opts.priority ?? this.r.priority, ms);
    if (opts.wait !== false) await this.wait(Math.min(ms, 900 + text.length * 40));
  }
  sound(name: SoundName) {
    if (!this.signal.aborted) AudioManager.play(name);
  }
  guitar(t: GuitarTune) {
    if (!this.signal.aborted) AudioManager.guitar(t);
  }
  adult(id: ParentId, patch: Partial<AdultState>) {
    this.check();
    getGame().setAdult(id, patch);
  }
  papa(patch: Partial<AdultState>) {
    this.adult('papa', patch);
  }
  mummy(patch: Partial<AdultState>) {
    this.adult('mummy', patch);
  }
  kid(patch: Partial<KidState>) {
    this.check();
    getGame().setKid(patch);
  }
  pup(patch: Partial<PupState>) {
    this.check();
    getGame().setPup(patch);
  }
  /** Trots Biscuit to a spot (same room) and waits until he arrives. */
  async pupTo(spot: { x: number; y?: number }, opts: { run?: boolean; pose?: PupState['pose'] } = {}) {
    this.check();
    const p = getGame().pup;
    const y = spot.y ?? p.y;
    const dist = Math.hypot(spot.x - p.x, y - p.y);
    if (dist < 6) return;
    const ms = Math.max(220, Math.min(1600, dist / (opts.run ? 0.9 : 0.5)));
    this.pup({ x: spot.x, y, facing: spot.x >= p.x ? 1 : -1, moveMs: ms, pose: opts.run ? 'run' : 'walk' });
    await this.wait(ms);
    this.pup({ moveMs: 0, pose: opts.pose ?? 'sit' });
  }
  papaRoom(patch: Partial<PapaRoomState>) {
    getGame().patchPapaRoom(patch);
  }
  mummyRoom(patch: Partial<MummyRoomState>) {
    getGame().patchMummyRoom(patch);
  }
  /** Temporary visual effect – removed automatically when the interaction ends. */
  fx(key: string, value: GameState['fx'][string]) {
    this.check();
    this.r.tempFx.add(key);
    getGame().setFx(key, value);
  }
  unfx(key: string) {
    this.r.tempFx.delete(key);
    getGame().clearFx(key);
  }
  /** Small bounce on an object (purely visual). */
  bump(target: string) {
    this.mgr.bump(target);
  }
  taps(key: string, windowMs: number) {
    return this.mgr.tapCounter.hit(key, windowMs);
  }
  resetTaps(key: string) {
    this.mgr.tapCounter.reset(key);
  }
  /** Marks an easter egg as discovered (always plays a sparkle). */
  egg(id: string, at?: { x: number; y: number }) {
    getGame().discoverEgg(id);
    AudioManager.play('sparkle');
    getGame().setFx('sparkle', JSON.stringify({ ...(at ?? { x: 720, y: 400 }), id: Date.now() }));
    EventBus.emit({ type: 'EASTER_EGG_FOUND', id });
  }
  /** Walks the kid to a spot and waits for the walk to finish. */
  async kidTo(spot: Spot, opts: { pose?: KidState['pose']; speed?: number } = {}) {
    this.check();
    const k = getGame().kid;
    const dist = Math.hypot(spot.x - k.x, spot.y - k.y);
    if (dist < 8) {
      this.kid({ facing: spot.facing ?? k.facing });
      return;
    }
    const ms = Math.max(260, Math.min(1500, dist / (opts.speed ?? 0.55)));
    const facing: 1 | -1 = spot.x > k.x ? 1 : -1;
    this.kid({ x: spot.x, y: spot.y, facing, moveMs: ms, pose: 'walk' });
    if (dist > 120) this.sound('footsteps');
    await this.wait(ms);
    this.kid({ pose: opts.pose ?? 'stand', facing: spot.facing ?? facing, moveMs: 0 });
  }
  /** Throws something along an arc and resolves when it lands. */
  async throwItem(p: Omit<ProjectileFx, 'id'>) {
    this.check();
    const id = Date.now();
    this.fx('projectile', JSON.stringify({ ...p, id }));
    this.sound('whoosh');
    await this.wait(p.dur);
    this.unfx('projectile');
  }
  emit(type: string, extra: Record<string, unknown> = {}) {
    EventBus.emit({ type, ...extra });
  }
}

type DefaultsFn = (actor: CharacterId) => void;

class InteractionManagerImpl {
  private defs: InteractionDefinition[] = [];
  private running = new Map<number, Running>();
  private nextRunId = 1;
  private rotation = new Map<string, number>();
  readonly cooldowns = new CooldownTracker();
  readonly tapCounter = new TapCounter();
  private bumpTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private resetActor: DefaultsFn = defaultReset;
  /** Last time the player tapped something (family moments wait for a quiet moment). */
  lastUserAt = 0;

  register(defs: InteractionDefinition[]) {
    for (const d of defs) {
      if (this.defs.some((x) => x.id === d.id && x.room === d.room)) continue;
      this.defs.push(d);
    }
  }

  definitions() {
    return this.defs;
  }

  isBusy(actor: CharacterId): boolean {
    for (const r of this.running.values()) if (r.actors.includes(actor)) return true;
    return false;
  }

  busyPriority(actor: CharacterId): number {
    let p = -1;
    for (const r of this.running.values()) if (r.actors.includes(actor)) p = Math.max(p, r.priority);
    return p;
  }

  bump(target: string) {
    const g = getGame();
    const key = 'bump:' + target;
    g.setFx(key, Date.now());
    clearTimeout(this.bumpTimers.get(key));
    this.bumpTimers.set(
      key,
      setTimeout(() => getGame().clearFx(key), 600),
    );
  }

  /** Called by hotspots. Returns the started event id or null. */
  trigger(target: string): string | null {
    const s = getGame();
    if (s.transitioning) return null;
    this.lastUserAt = Date.now();
    const room = s.currentRoom;
    const all = this.defs.filter((d) => d.target === target && d.room === room);
    if (all.length === 0) return null;
    const passing = all.filter((d) => (d.when ? d.when(s) : true));
    const contextual = passing.filter((d) => d.when);
    const pool = (contextual.length ? contextual : passing).filter((d) => d.category !== 'idle');
    if (pool.length === 0) {
      this.bump(target);
      return null;
    }
    // contextual matches are ordered by importance: first non-cooling one wins
    let chosen: InteractionDefinition | null = null;
    if (contextual.length) {
      chosen = pool.find((d) => !this.cooldowns.isCooling(d.id)) ?? null;
      if (chosen) return this.start(chosen) ? chosen.id : null;
    }
    // otherwise rotate through plain variants, skipping ones still cooling down
    const rotKey = room + ':' + target;
    const start = this.rotation.get(rotKey) ?? 0;
    for (let i = 0; !chosen && i < pool.length; i++) {
      const d = pool[(start + i) % pool.length];
      if (!this.cooldowns.isCooling(d.id)) {
        chosen = d;
        this.rotation.set(rotKey, (start + i + 1) % pool.length);
        break;
      }
    }
    if (!chosen) {
      // everything cooling down – gentle feedback so the tap never feels dead
      this.bump(target);
      AudioManager.play('tap');
      return null;
    }
    return this.start(chosen) ? chosen.id : null;
  }

  /** Runs a definition directly (used by idle director and chained events). */
  start(def: InteractionDefinition, opts: { force?: boolean } = {}): boolean {
    const s = getGame();
    const priority = def.priority ?? 1;
    const actors = [...new Set([...(def.uses ?? []), ...(def.needsKid ? (['kid'] as CharacterId[]) : [])])];

    // Lock check: an important running interaction is never cancelled by a lesser one.
    const toAbort = new Set<Running>();
    for (const r of this.running.values()) {
      const overlaps = r.actors.some((a) => actors.includes(a)) || r.def.target === def.target;
      if (!overlaps) continue;
      const sameTarget = r.def.target === def.target && r.def.room === def.room;
      if (opts.force || sameTarget || r.priority < priority) toAbort.add(r);
      else {
        this.bump(def.target);
        return false;
      }
    }
    toAbort.forEach((r) => this.abortRun(r, false));
    // a cancelled action never leaves its prop (apple, bottle, wand...) in the kid's hands
    if (actors.includes('kid') && [...toAbort].some((r) => r.actors.includes('kid')) && s.kid.prop) getGame().setKid({ prop: null });

    this.cooldowns.start(def.id, def.cooldownMs ?? 0);
    const run: Running = {
      runId: this.nextRunId++,
      def,
      ctrl: new AbortController(),
      actors,
      priority,
      tempFx: new Set(),
    };
    this.running.set(run.runId, run);
    if (priority > 0) {
      this.bump(def.target);
      EventBus.emit({ type: def.id, room: s.currentRoom, target: def.target });
    }
    const ctx = new Ctx(run, this);
    const body = async () => {
      if (def.needsKid) await ensureKid(ctx);
      await def.run(ctx);
    };
    body()
      .catch((e) => {
        if (!(e instanceof Aborted)) console.warn('[interaction]', def.id, e);
      })
      .finally(() => this.finish(run));
    return true;
  }

  private finish(run: Running) {
    if (!this.running.has(run.runId)) return;
    this.running.delete(run.runId);
    this.cleanup(run);
  }

  private cleanup(run: Running) {
    run.tempFx.forEach((k) => getGame().clearFx(k));
    for (const a of run.actors) {
      // only reset if no other run took over this actor
      if (!this.isBusy(a)) this.resetActor(a);
    }
  }

  private abortRun(run: Running, resetNow = true) {
    if (!this.running.has(run.runId)) return;
    run.ctrl.abort();
    this.running.delete(run.runId);
    run.tempFx.forEach((k) => getGame().clearFx(k));
    if (resetNow) for (const a of run.actors) if (!this.isBusy(a)) this.resetActor(a);
  }

  /** Cancels everything (room change). Characters return to their normal activity. */
  abortAll() {
    [...this.running.values()].forEach((r) => this.abortRun(r, true));
  }

  runningIds() {
    return [...this.running.values()].map((r) => r.def.id);
  }
}

/** Return a character to its normal activity after an interaction. */
function defaultReset(actor: CharacterId) {
  const g = getGame();
  if (actor === 'kid') {
    const k = g.kid;
    if (!k.awake) {
      g.setKid({ pose: 'sleep', expr: 'asleep', prop: null, layer: 'back', ...KID_BED_SPOT });
      return;
    }
    const patch: Partial<KidState> = { pose: 'stand', expr: 'happy', prop: null, moveMs: 0 };
    if (k.layer !== 'front') {
      const spot = k.room === 'papa-room' ? PAPA_SPOTS.default : MUMMY_SPOTS.default;
      Object.assign(patch, { layer: 'front', x: spot.x, y: spot.y });
    }
    if (k.y < 700 && k.layer === 'front') {
      // was on furniture – hop down
      Object.assign(patch, { y: 772, moveMs: 300 });
    }
    g.setKid(patch);
  } else if (actor === 'pup') {
    g.setPup({ pose: g.pup.pose === 'sleep' ? 'sleep' : 'sit', moveMs: 0, carry: null });
  } else {
    g.setAdult(actor, { ...defaultAdult() });
  }
}

/** Makes sure the kid is awake and in the current room before an action needs him. */
export async function ensureKid(c: Ctx) {
  const s = getGame();
  const k = s.kid;
  const room = s.currentRoom;
  if (k.room === room && k.awake) return;
  if (k.room === room && !k.awake) {
    // quick wake-up on the bed, then hop down
    c.kid({ pose: 'sitUp', expr: 'sleepy' });
    c.sound('yawn');
    await c.say('kid', c.pick('kid.quickWake', ['Mmm... I\'m up!', 'Huh? I\'m awake!']), { ms: 1400 });
    c.kid({ awake: true, pose: 'stand', expr: 'happy', layer: 'front', x: MUMMY_SPOTS.bedSide.x, y: 772, moveMs: 350 });
    c.sound('boing');
    await c.wait(380);
    c.kid({ moveMs: 0 });
    return;
  }
  // kid is in the other room – he comes running through the door
  const door = room === 'papa-room' ? PAPA_SPOTS.door : MUMMY_SPOTS.door;
  const wasAsleep = !k.awake;
  c.kid({ room, awake: true, x: door.x, y: door.y, moveMs: 0, pose: 'walk', expr: 'happy', layer: 'front' });
  c.fx(room + ':doorOpen', true);
  c.sound('doorOpen');
  await c.wait(60);
  const entry = room === 'papa-room' ? { x: 330, y: 772 } : { x: 1150, y: 772 };
  await c.kidTo(entry, { speed: 0.7 });
  c.unfx(room + ':doorOpen');
  c.sound('doorClose');
  if (wasAsleep) {
    void c.say('kid', c.pick('kid.arrive', ['I\'m awake! I\'m awake!', 'I\'m here!']), { wait: false, priority: 2 });
    if (room === 'papa-room' && !InteractionManager.isBusy('papa'))
      DialogueManager.say('papa', pickVaried('papa.wake', ['Oh! Look who\'s awake!', 'Good morning, sleepy champ!']), 1);
    await c.wait(500);
  }
}

export const InteractionManager = new InteractionManagerImpl();
