// FAMILY MOMENTS – parents occasionally start something themselves: a game of catch, a guitar jam,
// a snack, a story (bedtime at night), a dance break, a morning wake-up, or calling the kid over.
// Moments are rare (the IdleDirector spaces them out), only start when the player has been quiet
// for a while, and ANY tap cancels them (priority below every player interaction).
import type { Ctx, InteractionDefinition } from '../engine/InteractionManager';
import { ensureKid } from '../engine/InteractionManager';
import { pickVaried } from '../engine/random';
import type { GameState, ParentId, RoomId } from '../state/gameTypes';
import { MOMENTS, STORIES } from '../data/dialogues';
import { KID_BED_SPOT, MUMMY_SPOTS, PAPA_SPOTS } from '../data/spots';
import { parentHead } from './shared';
import { findBiscuitMomentRun, hideInviteMomentRun } from './hideSeek';

type MomentKey = keyof typeof MOMENTS;
const m = (c: Ctx, key: MomentKey) => c.pick('moment.' + key, MOMENTS[key]);

export interface FamilyMoment {
  def: InteractionDefinition;
  weight: number;
  /** Extra conditions on top of "kid awake and in this room" (see needs). */
  eligible: (s: GameState) => boolean;
  /** 'here' = kid awake in this room, 'away' = kid awake in the other room, 'asleep' = kid asleep here */
  needs: 'here' | 'away' | 'asleep';
}

const MOMENT_PRIORITY = 0.5;

const moment = (
  id: string,
  room: RoomId,
  needs: FamilyMoment['needs'],
  weight: number,
  cooldownMs: number,
  run: (c: Ctx) => Promise<void>,
  eligible: (s: GameState) => boolean = () => true,
): FamilyMoment => ({
  weight,
  eligible,
  needs,
  def: {
    id,
    room,
    target: 'moment:' + id,
    action: 'Family moment',
    category: 'idle',
    uses: [room === 'papa-room' ? 'papa' : 'mummy', 'kid'],
    priority: MOMENT_PRIORITY,
    cooldownMs,
    run,
  },
});

const MIN = 60_000;

/** Calls the kid from the other room – he comes running in. */
async function callKid(c: Ctx, who: ParentId) {
  c.adult(who, { activity: 'lookDoor', expr: 'happy' });
  await c.say(who, m(c, who === 'papa' ? 'papaCallKid' : 'mummyCallKid'));
  await c.wait(500);
  await ensureKid(c);
  void c.say('kid', m(c, 'kidComing'), { wait: false, ms: 1200 });
}

// ------------------------------------------------------------------ Papa
const PR = 'papa-room' as const;

const papaMoments: FamilyMoment[] = [
  moment('PAPA_PLAYS_CATCH', PR, 'here', 3, 3 * MIN, async (c) => {
    c.papa({ activity: 'turned', expr: 'happy' });
    await c.kidTo(PAPA_SPOTS.default);
    c.kid({ pose: 'stand', expr: 'happy', facing: 1 });
    await c.say('papa', m(c, 'papaCatchCall'));
    c.fx(PR + ':ballAway', true);
    const head = parentHead(PR);
    const hands = () => ({ x: c.s.kid.x + 18, y: c.s.kid.y - 150 });
    for (let round = 0; round < 3; round++) {
      c.papa({ activity: 'throw', expr: 'laugh' });
      const miss = round === 2;
      await c.throwItem({ kind: 'ball', from: head, to: miss ? { x: c.s.kid.x - 70, y: 772 } : hands(), dur: 700, arc: 110, spin: true });
      if (miss) {
        c.sound('bounce');
        c.kid({ pose: 'reach', expr: 'surprised' });
        c.papa({ activity: 'turned', expr: 'laugh' });
        await c.say('papa', m(c, 'papaCatchMiss'));
        c.kid({ pose: 'jump', expr: 'laugh' });
        c.sound('giggle');
        await c.wait(700);
        break;
      }
      c.sound('pop');
      c.kid({ pose: 'cheer', prop: 'ball', expr: 'laugh' });
      c.papa({ activity: 'catch', expr: 'happy' });
      void c.say('papa', m(c, 'papaCatchGood'), { wait: false, ms: 1100 });
      await c.wait(650);
      c.kid({ pose: 'throw', expr: 'happy' });
      await c.wait(250);
      c.kid({ prop: null, pose: 'stand' });
      await c.throwItem({ kind: 'ball', from: hands(), to: head, dur: 650, arc: 110, spin: true });
      c.sound('pop');
      await c.wait(200);
    }
    c.papa({ activity: 'turned', expr: 'happy' });
    await c.say('papa', m(c, 'papaCatchEnd'));
  }),

  moment('PAPA_GUITAR_JAM', PR, 'here', 3, 3 * MIN, async (c) => {
    c.papa({ activity: 'stretch', expr: 'yawn' });
    c.sound('yawn');
    await c.wait(900);
    c.papa({ activity: 'guitar', expr: 'happy' });
    await c.say('papa', m(c, 'papaJamCall'));
    await c.kidTo(PAPA_SPOTS.guitar);
    c.kid({ pose: 'dance', expr: 'happy', facing: 1 });
    c.guitar('papa');
    await c.wait(1500);
    c.sound('sing');
    await c.say('kid', m(c, 'kidSing'), { ms: 1500 });
    c.guitar('papa');
    c.kid({ pose: 'cheer', expr: 'laugh' });
    c.sound('sing');
    await c.wait(1800);
    c.fx(PR + ':papaHearts', true);
    c.papa({ activity: 'hug', expr: 'love' });
    c.kid({ pose: 'hug', expr: 'love' });
    await c.say('papa', m(c, 'papaJamEnd'));
    await c.wait(500);
  }),

  moment('PAPA_STRETCH_BREAK', PR, 'here', 2, 2 * MIN, async (c) => {
    c.papa({ activity: 'stretch', expr: 'yawn' });
    c.sound('yawn');
    await c.say('papa', m(c, 'papaStretchCall'));
    await c.kidTo(PAPA_SPOTS.nearPapa);
    c.kid({ pose: 'yawn', expr: 'yawn', facing: 1 });
    await c.wait(1200);
    c.kid({ pose: 'liftUp', expr: 'strain' });
    c.sound('grunt');
    await c.wait(900);
    c.papa({ activity: 'drink', expr: 'happy' });
    c.kid({ pose: 'drink', prop: 'bottle', expr: 'happy' });
    c.sound('gulp');
    await c.wait(1300);
    c.kid({ pose: 'stand', prop: null, expr: 'laugh' });
    c.papa({ activity: 'turned', expr: 'happy' });
    await c.say('papa', m(c, 'papaStretchEnd'));
  }),

  (() => {
    const m2 = moment('PUP_STEALS_PAPAS_SOCK', PR, 'here', 3, 4 * MIN, async (c) => {
      // Biscuit sneaks under the desk and runs off with Papa's sock
      await c.pupTo({ x: 1000, y: 792 }, { pose: 'sit' });
      c.pup({ carry: 'sock', pose: 'wag', facing: -1 });
      c.sound('yip');
      await c.wait(400);
      c.papa({ activity: 'lookBack', expr: 'surprised' });
      await c.say('papa', 'Hey! Biscuit took my sock!');
      void c.pupTo({ x: 330, y: 792 }, { run: true, pose: 'wag' });
      c.kid({ expr: 'laugh' });
      await c.say('kid', "I'll get it, Papa!", { ms: 1100 });
      await c.kidTo({ x: 450, y: 772 }, { speed: 0.8 });
      c.pup({ pose: 'roll' });
      c.sound('boing');
      await c.wait(900);
      c.pup({ carry: null, pose: 'wag' });
      c.kid({ pose: 'cheer', expr: 'laugh' });
      await c.say('kid', 'Got it!', { ms: 900 });
      await c.kidTo(PAPA_SPOTS.nearPapa);
      c.papa({ activity: 'turned', expr: 'laugh' });
      c.fx(PR + ':papaHearts', true);
      await c.say('papa', 'Thank you, sock rescuer! Naughty Biscuit!');
    }, (s) => s.pup.room === PR && s.pup.pose !== 'sleep');
    m2.def.uses = ['papa', 'kid', 'pup'];
    return m2;
  })(),

  moment('PAPA_HIDE_AND_SEEK', PR, 'here', 2, 5 * MIN, hideInviteMomentRun('papa'), (s) => s.dayPeriod !== 'night'),
  moment('PAPA_FIND_BISCUIT', PR, 'here', 2, 5 * MIN, findBiscuitMomentRun('papa'), (s) => s.pup.pose !== 'sleep'),

  moment('PAPA_CALLS_KID', PR, 'away', 2, 2 * MIN, async (c) => {
    await callKid(c, 'papa');
    await c.kidTo(PAPA_SPOTS.nearPapa);
    c.kid({ pose: 'wave', expr: 'happy' });
    c.papa({ activity: 'hug', expr: 'love' });
    c.fx(PR + ':papaHearts', true);
    await c.say('papa', m(c, 'papaKidArrives'));
    await c.wait(500);
  }),
];

// ------------------------------------------------------------------ Mummy
const MR = 'mummy-room' as const;

async function tellStory(c: Ctx) {
  const story = c.pick('moment.story', STORIES);
  const looks = ['happy', 'surprised', 'laugh'] as const;
  for (let i = 0; i < story.length; i++) {
    c.sound('pageFlip');
    c.kid({ expr: looks[i % looks.length] });
    await c.say('mummy', story[i]);
    await c.wait(300);
  }
}

const mummyMoments: FamilyMoment[] = [
  moment('MUMMY_OFFERS_SNACK', MR, 'here', 3, 3 * MIN, async (c) => {
    c.mummy({ activity: 'turned', expr: 'happy' });
    await c.say('mummy', m(c, 'mummySnackCall'));
    await c.kidTo(MUMMY_SPOTS.nearMummy);
    c.mummy({ activity: 'catch', expr: 'love' });
    c.kid({ pose: 'reach', expr: 'happy', facing: 1 });
    await c.wait(500);
    c.mummy({ activity: 'turned', expr: 'happy' });
    for (let i = 0; i < 3; i++) {
      c.kid({ pose: 'drink', prop: 'apple', expr: 'happy' });
      c.sound('crunch');
      await c.wait(600);
      c.kid({ pose: 'stand', expr: 'laugh' });
      await c.wait(300);
    }
    await c.say('kid', m(c, 'kidYum'), { ms: 1300 });
    c.kid({ prop: null });
    c.fx(MR + ':hearts', true);
    await c.say('mummy', m(c, 'mummySnackEnd'));
  }),

  moment('MUMMY_READS_STORY', MR, 'here', 3, 3 * MIN, async (c) => {
    c.mummy({ activity: 'turned', expr: 'love' });
    await c.say('mummy', m(c, 'mummyStoryCall'));
    await c.kidTo(MUMMY_SPOTS.pouf);
    c.kid({ pose: 'sit', expr: 'happy', facing: 1 });
    c.mummy({ activity: 'read', expr: 'happy' });
    await tellStory(c);
    c.mummy({ activity: 'turned', expr: 'happy' });
    c.kid({ pose: 'cheer', expr: 'laugh' });
    c.sound('clap');
    await c.say('mummy', m(c, 'mummyStoryEnd'));
  }, (s) => s.dayPeriod !== 'night'),

  moment('MUMMY_BEDTIME_STORY', MR, 'here', 6, 8 * MIN, async (c) => {
    c.mummy({ activity: 'turned', expr: 'love' });
    await c.say('mummy', m(c, 'mummyBedtime'));
    await c.kidTo(MUMMY_SPOTS.pouf);
    c.kid({ pose: 'sit', expr: 'sleepy', facing: 1 });
    c.mummy({ activity: 'read', expr: 'happy' });
    c.mummyRoom({ lampOn: true });
    await tellStory(c);
    c.kid({ pose: 'yawn', expr: 'yawn' });
    c.sound('yawn');
    await c.say('kid', m(c, 'kidSleepy'), { ms: 1600 });
    await c.kidTo(MUMMY_SPOTS.bedSide);
    c.kid({ ...KID_BED_SPOT, layer: 'back', pose: 'sleep', expr: 'asleep', awake: false, moveMs: 300 });
    c.sound('pillow');
    await c.wait(400);
    c.mummyRoom({ lightOn: false });
    c.sound('switch');
    c.mummy({ activity: 'lookKid', expr: 'love' });
    await c.say('mummy', m(c, 'mummyGoodnight'));
    c.sound('snore');
    await c.wait(800);
  }, (s) => s.dayPeriod === 'night'),

  moment('MUMMY_DANCE_BREAK', MR, 'here', 2, 3 * MIN, async (c) => {
    c.mummy({ activity: 'play', expr: 'laugh' });
    await c.say('mummy', m(c, 'mummyDanceCall'));
    await c.kidTo(MUMMY_SPOTS.default);
    c.kid({ pose: 'dance', expr: 'laugh' });
    c.sound('dance');
    await c.wait(2500);
    c.kid({ pose: 'cheer' });
    c.sound('dance');
    await c.wait(2500);
    c.mummy({ activity: 'turned', expr: 'happy' });
    c.kid({ pose: 'jump', expr: 'laugh' });
    c.sound('clap');
    await c.say('mummy', m(c, 'mummyDanceEnd'));
  }, (s) => s.dayPeriod !== 'night'),

  moment('MUMMY_MORNING_WAKEUP', MR, 'asleep', 8, 10 * MIN, async (c) => {
    c.mummy({ activity: 'lookKid', expr: 'love' });
    c.mummyRoom({ curtainsOpen: true });
    c.sound('swish');
    await c.wait(600);
    c.sound('birds');
    await c.say('mummy', m(c, 'mummyMorning'));
    await ensureKid(c);
    c.kid({ pose: 'cheer', expr: 'happy' });
    await c.wait(800);
  }, (s) => s.dayPeriod === 'morning'),

  moment('MUMMY_HIDE_AND_SEEK', MR, 'here', 2, 5 * MIN, hideInviteMomentRun('mummy'), (s) => s.dayPeriod !== 'night'),
  moment('MUMMY_FIND_BISCUIT', MR, 'here', 2, 5 * MIN, findBiscuitMomentRun('mummy'), (s) => s.pup.pose !== 'sleep'),

  moment('MUMMY_CALLS_KID', MR, 'away', 2, 2 * MIN, async (c) => {
    await callKid(c, 'mummy');
    await c.kidTo(MUMMY_SPOTS.nearMummy);
    c.mummy({ activity: 'hug', expr: 'love' });
    c.kid({ pose: 'hug', expr: 'love', facing: 1 });
    c.sound('kiss');
    c.fx(MR + ':hearts', true);
    await c.say('mummy', m(c, 'mummyKidArrives'));
    await c.wait(500);
  }),
];

export const familyMoments: FamilyMoment[] = [...papaMoments, ...mummyMoments];

/** Which moments could happen right now in the room the player is looking at. */
export function eligibleMoments(s: GameState, isCooling: (id: string) => boolean): FamilyMoment[] {
  return familyMoments.filter((fm) => {
    if (fm.def.room !== s.currentRoom || isCooling(fm.def.id) || !fm.eligible(s)) return false;
    const here = s.kid.room === s.currentRoom;
    if (fm.needs === 'here') return here && s.kid.awake && s.kid.layer === 'front' && !s.kid.holding;
    if (fm.needs === 'away') return !here && s.kid.awake;
    return here && !s.kid.awake;
  });
}

export const pickMoment = (list: FamilyMoment[], last: string | null): FamilyMoment | null => {
  const pool = list.length > 1 ? list.filter((x) => x.def.id !== last) : list;
  if (!pool.length) return null;
  const total = pool.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const x of pool) if ((r -= x.weight) <= 0) return x;
  return pool[0];
};

export const momentLine = (key: MomentKey) => pickVaried('moment.' + key, MOMENTS[key]);
