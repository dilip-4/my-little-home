import type { AdultActivity, Expression, KidPose, ParentId } from '../state/gameTypes';
import { getGame } from '../state/gameStore';
import { InteractionManager, type InteractionDefinition } from './InteractionManager';
import { AudioManager, type SoundName } from './AudioManager';
import { DialogueManager } from './DialogueManager';
import { pickVaried, randBetween } from './random';
import { MUMMY, PAPA } from '../data/dialogues';

/**
 * Makes the house feel alive: characters perform small idle activities at controlled random
 * intervals. Idle runs have priority 0, so ANY player interaction cancels them, and they never
 * start while a character is busy.
 */
interface IdleAct {
  activity: AdultActivity;
  expr?: Expression;
  ms: [number, number];
  weight: number;
  sound?: SoundName;
  lines?: readonly string[];
}

const PAPA_IDLE: IdleAct[] = [
  { activity: 'thinking', expr: 'puzzled', ms: [2200, 3200], weight: 3 },
  { activity: 'stretch', expr: 'yawn', ms: [1800, 2400], weight: 2, sound: 'yawn' },
  { activity: 'drink', expr: 'happy', ms: [1800, 2300], weight: 2, sound: 'gulp' },
  { activity: 'phone', expr: 'neutral', ms: [2400, 3400], weight: 2 },
  { activity: 'lookClock', expr: 'neutral', ms: [1500, 2000], weight: 1, lines: PAPA.clock },
  { activity: 'adjust', expr: 'neutral', ms: [1200, 1500], weight: 1, sound: 'chairSpin' },
  { activity: 'meeting', expr: 'focused', ms: [12000, 18000], weight: 2, lines: PAPA.meetingTalk },
];

const MUMMY_IDLE: IdleAct[] = [
  { activity: 'drink', expr: 'happy', ms: [1800, 2400], weight: 2, sound: 'gulp' },
  { activity: 'read', expr: 'focused', ms: [3500, 5000], weight: 2 },
  { activity: 'stretch', expr: 'yawn', ms: [1800, 2400], weight: 1, sound: 'yawn' },
  { activity: 'phone', expr: 'happy', ms: [2400, 3200], weight: 2 },
  { activity: 'lookKid', expr: 'love', ms: [2000, 2800], weight: 2, lines: MUMMY.idleLookKid },
  { activity: 'meeting', expr: 'focused', ms: [12000, 18000], weight: 2, lines: MUMMY.meetingTalk },
  { activity: 'rest', expr: 'asleep', ms: [7000, 10000], weight: 1 },
];

const KID_IDLE: { pose: KidPose; expr: Expression; ms: number; sound?: SoundName }[] = [
  { pose: 'yawn', expr: 'yawn', ms: 1300, sound: 'yawn' },
  { pose: 'stand', expr: 'laugh', ms: 1100, sound: 'giggle' },
  { pose: 'wave', expr: 'happy', ms: 1200 },
  { pose: 'stand', expr: 'puzzled', ms: 1400 },
  { pose: 'dance', expr: 'happy', ms: 1600 },
];

function weighted<T extends { weight: number }>(list: T[]): T {
  const total = list.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const x of list) if ((r -= x.weight) <= 0) return x;
  return list[0];
}

function adultIdleDef(who: ParentId, act: IdleAct): InteractionDefinition {
  const room = who === 'papa' ? 'papa-room' : 'mummy-room';
  return {
    id: `IDLE_${who.toUpperCase()}_${act.activity.toUpperCase()}`,
    room,
    target: `idle:${who}`,
    action: 'idle',
    category: 'idle',
    uses: [who],
    priority: 0,
    run: async (c) => {
      c.adult(who, { activity: act.activity, expr: act.expr ?? 'neutral' });
      if (act.sound) c.sound(act.sound);
      const dur = randBetween(act.ms[0], act.ms[1]);
      if (act.lines && act.lines.length) {
        const kidAsleepHere = c.s.kid.room === room && !c.s.kid.awake;
        if (act.activity !== 'lookKid' || kidAsleepHere || Math.random() < 0.5) {
          await c.wait(500);
          DialogueManager.say(who, pickVaried(`idle.${who}.${act.activity}`, act.lines), 0);
        }
      }
      if (act.activity === 'meeting') {
        // chatty meeting: occasional lines while typing
        const end = Date.now() + dur;
        while (Date.now() < end - 3000) {
          await c.wait(randBetween(3500, 5000));
          if (Math.random() < 0.6 && act.lines) DialogueManager.say(who, pickVaried(`meet.${who}`, act.lines), 0);
        }
        return;
      }
      if (act.activity === 'rest') {
        await c.wait(dur / 2);
        AudioManager.play('snore');
      }
      await c.wait(act.activity === 'rest' ? dur / 2 : dur);
    },
  };
}

function kidIdleDef(): InteractionDefinition {
  const s = getGame();
  const room = s.kid.room;
  return {
    id: 'IDLE_KID',
    room,
    target: 'idle:kid',
    action: 'idle',
    category: 'idle',
    uses: ['kid'],
    priority: 0,
    run: async (c) => {
      if (!c.s.kid.awake) {
        c.sound('snore');
        await c.wait(1200);
        return;
      }
      const a = KID_IDLE[Math.floor(Math.random() * KID_IDLE.length)];
      c.kid({ pose: c.s.kid.holding ? 'hold' : a.pose, expr: a.expr, facing: a.expr === 'puzzled' ? ((-c.s.kid.facing) as 1 | -1) : c.s.kid.facing });
      if (a.sound) c.sound(a.sound);
      await c.wait(a.ms);
    },
  };
}

let timer: ReturnType<typeof setInterval> | undefined;
const nextAt: Record<string, number> = {};

/** Family moments (parents taking the initiative) are supplied by the scene layer. */
type MomentPicker = () => InteractionDefinition | null;
let momentPicker: MomentPicker | null = null;
let nextMomentAt = 0;
/** How long the player must be quiet before a parent starts something on their own. */
export const MOMENT_QUIET_MS = 7000;

export const IdleDirector = {
  start() {
    if (timer) return;
    const now = Date.now();
    nextAt.papa = now + randBetween(4000, 7000);
    nextAt.mummy = now + randBetween(5000, 9000);
    nextAt.kid = now + randBetween(6000, 10000);
    nextMomentAt = now + randBetween(25000, 40000);
    timer = setInterval(() => this.tick(), 1000);
  },
  setMomentPicker(fn: MomentPicker) {
    momentPicker = fn;
  },
  /** Lets a moment happen soon (tests / debugging). */
  momentSoon(ms = 0) {
    nextMomentAt = Date.now() + ms;
  },
  stop() {
    clearInterval(timer);
    timer = undefined;
  },
  tick() {
    if (typeof document !== 'undefined' && document.hidden) return;
    const s = getGame();
    if (s.transitioning || !s.introDone) return;
    const now = Date.now();
    const parent: ParentId = s.currentRoom === 'papa-room' ? 'papa' : 'mummy';
    if (momentPicker && now >= nextMomentAt) {
      const quiet = now - InteractionManager.lastUserAt > MOMENT_QUIET_MS;
      const free =
        InteractionManager.busyPriority(parent) <= 0 &&
        InteractionManager.busyPriority('kid') <= 0 &&
        !s.dialogues[parent] &&
        !s.dialogues.kid &&
        s.characters[parent].activity !== 'meeting';
      if (!quiet || !free) nextMomentAt = now + 4000;
      else {
        const def = momentPicker();
        if (def && InteractionManager.start(def)) {
          nextMomentAt = now + randBetween(60000, 100000);
          nextAt[parent] = now + 25000;
          nextAt.kid = now + 25000;
          return;
        }
        nextMomentAt = now + 15000;
      }
    }
    if (now >= nextAt[parent]) {
      if (InteractionManager.isBusy(parent) || s.dialogues[parent]) nextAt[parent] = now + 3000;
      else {
        const act = weighted(parent === 'papa' ? PAPA_IDLE : MUMMY_IDLE);
        InteractionManager.start(adultIdleDef(parent, act));
        nextAt[parent] = now + randBetween(7000, 13000) + (act.activity === 'meeting' ? 15000 : 0);
      }
    }
    if (s.kid.room === s.currentRoom && now >= nextAt.kid) {
      if (InteractionManager.isBusy('kid') || s.dialogues.kid) nextAt.kid = now + 3000;
      else {
        InteractionManager.start(kidIdleDef());
        nextAt.kid = now + randBetween(9000, 15000);
      }
    }
  },
};
