// BISCUIT THE PUPPY – follows the kid from room to room, does tricks, plays fetch, eats from his
// bowl, naps, and reacts to whatever the family is doing.
import type { Ctx, InteractionDefinition } from '../engine/InteractionManager';
import { InteractionManager } from '../engine/InteractionManager';
import { DialogueManager } from '../engine/DialogueManager';
import { EventBus } from '../engine/EventManager';
import { pickVaried, randBetween } from '../engine/random';
import type { SoundName } from '../engine/AudioManager';
import { getGame } from '../state/gameStore';
import type { GameState, PupPose, RoomId } from '../state/gameTypes';
import { DOOR_X, MUMMY_SPOTS, PUP_BOWL, PUP_FLOOR_Y, PUP_RANGE } from '../data/spots';
import { kidPresent, parentOf } from './shared';

export const PUP_NAME = 'Biscuit';

const PUP_LINES = {
  woof: ['Woof!', 'Arf arf!', 'Woof woof!'],
  happy: ['Arf!', 'Yip yip!'],
  kidPet: [`Good boy, ${PUP_NAME}!`, `Who's a good puppy?`, `I love you, ${PUP_NAME}!`],
  kidRoll: ['Roll over!', 'Do a trick!'],
  kidTrickDone: ['Yay! Clever puppy!', 'He did it!'],
  kidFetch: ['Fetch, Biscuit!', 'Go get it!'],
  kidFetchBack: ['Good catch, Biscuit!', 'Again! Again!'],
  kidLick: ['Hee hee, it tickles!', 'Eww, puppy kisses!'],
  kidShh: [`Shhh... ${PUP_NAME} is sleeping.`],
  kidFeed: ['Dinner time, Biscuit!', 'Yummy food for you!'],
  mummyFeed: ['Good job feeding Biscuit, {name}!', 'Look how happy he is!'],
  papaPup: ['Ha ha! Puppy kisses for everyone!', 'Biscuit loves you more than me, {name}!'],
  kidSpin: ['He\'s chasing his tail!', 'Spin, Biscuit, spin!'],
} as const;
const pl = (key: keyof typeof PUP_LINES) => pickVaried('pup.' + key, PUP_LINES[key]);

const pupHere = (s: GameState) => s.pup.room === s.currentRoom;
const ballSpot = (room: RoomId) => (room === 'papa-room' ? { x: 692, y: 758 } : { x: 496, y: 764 });

/** Biscuit runs in through the door of `room` (or just trots over if already there). */
async function pupEnter(c: Ctx, room: RoomId) {
  if (c.s.pup.room === room) return;
  c.pup({ room, x: DOOR_X[room], y: PUP_FLOOR_Y, moveMs: 0, pose: 'run', facing: room === 'papa-room' ? 1 : -1, carry: null });
  c.fx(room + ':doorOpen', true);
  c.sound('yip');
  await c.wait(120);
  c.unfx(room + ':doorOpen');
}

/** Kid walks up next to Biscuit (on whichever side is roomier). */
async function kidToPup(c: Ctx) {
  const p = c.s.pup;
  const side = p.x > 700 ? -1 : 1;
  await c.kidTo({ x: p.x + side * 95, y: 772, facing: (-side) as 1 | -1 });
}

function pupDefs(room: RoomId): InteractionDefinition[] {
  const parent = parentOf(room);
  const [minX, maxX] = PUP_RANGE[room];
  return [
    {
      id: 'PUP_TAIL_CHASE',
      room,
      target: 'pup',
      action: 'Tap Biscuit 6 times quickly → he chases his own tail (easter egg)',
      category: 'easter',
      when: (s) => pupHere(s) && InteractionManager.tapCounter.hit('pup-spin', 3000) >= 6,
      uses: ['pup'],
      priority: 4,
      run: async (c) => {
        c.resetTaps('pup-spin');
        c.egg('pup-tail-chase', { x: c.s.pup.x, y: c.s.pup.y - 80 });
        c.pup({ pose: 'spin' });
        c.sound('yip');
        if (kidPresent(c.s)) void c.say('kid', pl('kidSpin'), { wait: false, ms: 1500 });
        await c.wait(2200);
        c.pup({ pose: 'wag' });
        c.sound('bark');
        await c.say('pup', pl('woof'), { ms: 1200 });
      },
    },
    {
      id: 'PUP_WOKEN_GENTLY',
      room,
      target: 'pup',
      action: 'Biscuit is napping – the kid tiptoes over and he wakes up wagging',
      category: 'character',
      when: (s) => pupHere(s) && s.pup.pose === 'sleep',
      needsKid: true,
      uses: ['pup', 'kid'],
      priority: 2,
      run: async (c) => {
        await kidToPup(c);
        c.kid({ pose: 'crouch', expr: 'happy' });
        await c.say('kid', pl('kidShh'), { ms: 1500 });
        c.sound('whine');
        await c.wait(500);
        c.pup({ pose: 'sit' });
        await c.wait(400);
        c.pup({ pose: 'lick' });
        c.sound('slurp');
        c.kid({ pose: 'stand', expr: 'laugh' });
        c.sound('giggle');
        await c.say('kid', pl('kidLick'), { ms: 1400 });
        c.pup({ pose: 'wag' });
        await c.wait(600);
      },
    },
    {
      id: 'PUP_PETTED',
      room,
      target: 'pup',
      action: 'Pet Biscuit – tail wags, hearts, a happy bark',
      category: 'character',
      needsKid: true,
      uses: ['pup', 'kid'],
      priority: 2,
      run: async (c) => {
        await kidToPup(c);
        c.kid({ pose: 'crouch', expr: 'love' });
        c.pup({ pose: 'wag', facing: c.s.kid.x > c.s.pup.x ? 1 : -1 });
        c.fx(room + ':pupHearts', true);
        c.sound('aww');
        await c.say('kid', pl('kidPet'), { ms: 1500 });
        c.sound('bark');
        await c.say('pup', pl('woof'), { ms: 1100 });
        c.kid({ pose: 'stand', expr: 'happy' });
        await c.wait(300);
      },
    },
    {
      id: 'PUP_ROLLS_OVER',
      room,
      target: 'pup',
      action: 'Ask Biscuit for a trick – he rolls over',
      category: 'character',
      needsKid: true,
      uses: ['pup', 'kid'],
      priority: 2,
      run: async (c) => {
        await kidToPup(c);
        c.kid({ pose: 'wave', expr: 'happy' });
        await c.say('kid', pl('kidRoll'), { ms: 1200 });
        c.pup({ pose: 'beg' });
        await c.wait(500);
        c.pup({ pose: 'roll' });
        c.sound('boing');
        await c.wait(950);
        c.pup({ pose: 'wag' });
        c.sound('bark');
        c.kid({ pose: 'cheer', expr: 'laugh' });
        await c.say('kid', pl('kidTrickDone'), { ms: 1300 });
      },
    },
    {
      id: 'PUP_FETCH',
      room,
      target: 'pup',
      action: 'Play fetch – the kid throws the ball and Biscuit brings it back',
      category: 'character',
      needsKid: true,
      uses: ['pup', 'kid'],
      priority: 2,
      run: async (c) => {
        if (c.s.fx[room + ':ballAway']) {
          // ball is busy elsewhere – a quick jump-and-bark instead
          await kidToPup(c);
          c.pup({ pose: 'jump' });
          c.sound('bark');
          await c.say('pup', pl('woof'), { ms: 1100 });
          return;
        }
        const b = ballSpot(room);
        await c.kidTo({ x: b.x - 30, y: 772, facing: 1 });
        c.kid({ pose: 'crouch', expr: 'happy' });
        await c.wait(250);
        c.fx(room + ':ballAway', true);
        c.kid({ pose: 'stand', prop: 'ball' });
        c.pup({ pose: 'beg', facing: c.s.pup.x < c.s.kid.x ? 1 : -1 });
        await c.say('kid', pl('kidFetch'), { ms: 1100 });
        const k = c.s.kid;
        const dir = k.x < (minX + maxX) / 2 ? 1 : -1;
        const land = Math.max(minX, Math.min(maxX, k.x + dir * 420));
        c.kid({ pose: 'throw', facing: dir as 1 | -1 });
        await c.wait(250);
        c.kid({ prop: null });
        void c.pupTo({ x: land - dir * 20 }, { run: true, pose: 'run' });
        await c.throwItem({ kind: 'ball', from: { x: k.x + 20 * dir, y: k.y - 190 }, to: { x: land, y: 780 }, dur: 750, arc: 140, spin: true });
        c.sound('bounce');
        await c.wait(300);
        c.pup({ carry: 'ball', pose: 'wag' });
        c.sound('yip');
        await c.wait(350);
        await c.pupTo({ x: c.s.kid.x + dir * 80 }, { run: true, pose: 'sit' });
        c.pup({ carry: null, pose: 'wag', facing: (-dir) as 1 | -1 });
        c.kid({ pose: 'cheer', expr: 'laugh', prop: 'ball' });
        c.sound('bark');
        await c.say('kid', pl('kidFetchBack'), { ms: 1300 });
        c.kid({ prop: null, pose: 'stand' });
      },
    },
    {
      id: 'PUP_LICKS_KID',
      room,
      target: 'pup',
      action: 'Biscuit jumps up and gives puppy kisses',
      category: 'character',
      needsKid: true,
      uses: ['pup', 'kid'],
      priority: 2,
      run: async (c) => {
        await kidToPup(c);
        c.pup({ pose: 'jump' });
        c.sound('yip');
        await c.wait(550);
        c.pup({ pose: 'lick' });
        c.sound('slurp');
        c.kid({ pose: 'funny', expr: 'laugh' });
        c.sound('giggle');
        await c.say('kid', pl('kidLick'), { ms: 1400 });
        if (parent === 'papa' && Math.random() < 0.5) DialogueManager.say('papa', pl('papaPup'), 0);
        c.pup({ pose: 'wag' });
        c.kid({ pose: 'stand', expr: 'happy' });
        await c.wait(400);
      },
    },
  ];
}

const bowlDef: InteractionDefinition = {
  id: 'PUP_FED',
  room: 'mummy-room',
  target: 'bowl',
  action: 'Fill Biscuit’s bowl – he races in and munches',
  category: 'object',
  needsKid: true,
  uses: ['pup', 'kid'],
  priority: 2,
  cooldownMs: 800,
  run: async (c) => {
    await c.kidTo(MUMMY_SPOTS.bowl);
    c.kid({ pose: 'crouch', expr: 'happy' });
    await c.say('kid', pl('kidFeed'), { ms: 1100, wait: false });
    c.sound('pour');
    c.fx('mummy-room:bowlFull', true);
    await c.wait(700);
    await pupEnter(c, 'mummy-room');
    c.kid({ pose: 'stand' });
    await c.pupTo({ x: PUP_BOWL.x + 52, y: PUP_FLOOR_Y }, { run: true, pose: 'eat' });
    c.pup({ facing: -1, pose: 'eat' });
    for (let i = 0; i < 3; i++) {
      c.sound('crunch');
      await c.wait(650);
    }
    c.unfx('mummy-room:bowlFull');
    c.pup({ pose: 'wag' });
    c.sound('bark');
    c.kid({ pose: 'cheer', expr: 'laugh' });
    if (InteractionManager.busyPriority('mummy') <= 0) DialogueManager.say('mummy', pickVaried('pup.mummyFeed', PUP_LINES.mummyFeed), 1);
    await c.wait(1200);
  },
};

export const pupInteractions = (room: RoomId): InteractionDefinition[] => [...pupDefs(room), ...(room === 'mummy-room' ? [bowlDef] : [])];

// ------------------------------------------------------------------ autonomous behaviour
const idle = (id: string, room: RoomId, run: (c: Ctx) => Promise<void>): InteractionDefinition => ({
  id,
  room,
  target: 'idle:pup',
  action: 'idle',
  category: 'idle',
  uses: ['pup'],
  priority: 0,
  run,
});

let nextPupAt = 0;
let lastNap = 0;

/** Biscuit's own little life. Called every second by the IdleDirector. */
export function pupTick() {
  const s = getGame();
  if (!s.introDone || s.transitioning) return;
  if (InteractionManager.isBusy('pup')) return;
  const now = Date.now();
  const p = s.pup;
  const room = s.currentRoom;
  const [minX, maxX] = PUP_RANGE[room];

  // follow the kid into the room the player is looking at
  if (p.room !== room && s.kid.room === room && s.kid.awake) {
    if (now < nextPupAt) return;
    InteractionManager.start(
      idle('PUP_FOLLOWS_KID', room, async (c) => {
        await pupEnter(c, room);
        const k = c.s.kid;
        await c.pupTo({ x: Math.max(minX, Math.min(maxX, k.x + (k.x > 700 ? -110 : 110))), y: PUP_FLOOR_Y }, { run: true, pose: 'wag' });
        c.sound('bark');
        DialogueManager.say('pup', pl('woof'), 0);
        await c.wait(900);
      }),
    );
    nextPupAt = now + randBetween(5000, 9000);
    return;
  }
  if (p.room !== room || now < nextPupAt) return;
  nextPupAt = now + randBetween(5000, 10000);

  // kid asleep → Biscuit naps too
  if (!s.kid.awake) {
    if (p.pose !== 'sleep') {
      InteractionManager.start(
        idle('PUP_NAPS', room, async (c) => {
          c.pup({ pose: 'sleep' });
          c.sound('snore');
          await c.wait(400);
        }),
      );
    }
    return;
  }
  if (p.pose === 'sleep') {
    // naps end after a while
    if (now - lastNap > 25000) InteractionManager.start(idle('PUP_WAKES', room, async (c) => {
      c.sound('whine');
      c.pup({ pose: 'sit' });
      await c.wait(600);
      c.pup({ pose: 'wag' });
      await c.wait(900);
    }));
    return;
  }

  const kidHere = s.kid.room === room;
  const far = kidHere && Math.abs(s.kid.x - p.x) > 380;
  const roll = Math.random();
  if (far && roll < 0.7) {
    InteractionManager.start(idle('PUP_TROTS_TO_KID', room, async (c) => {
      const k = c.s.kid;
      await c.pupTo({ x: Math.max(minX, Math.min(maxX, k.x + (k.x > p.x ? -100 : 100))), y: PUP_FLOOR_Y }, { pose: 'wag' });
      await c.wait(1200);
    }));
  } else if (roll < 0.45) {
    InteractionManager.start(idle('PUP_WANDERS', room, async (c) => {
      await c.pupTo({ x: randBetween(minX, maxX), y: PUP_FLOOR_Y }, { pose: Math.random() < 0.5 ? 'sit' : 'wag' });
      if (Math.random() < 0.3) {
        c.sound('yip');
        DialogueManager.say('pup', pl('happy'), 0);
      }
      await c.wait(1500);
    }));
  } else if (roll < 0.7) {
    InteractionManager.start(idle('PUP_WAGS', room, async (c) => {
      c.pup({ pose: 'wag' });
      await c.wait(2000);
    }));
  } else if (roll < 0.85 && now - lastNap > 60000) {
    lastNap = now;
    InteractionManager.start(idle('PUP_NAPS', room, async (c) => {
      c.pup({ pose: 'sleep' });
      await c.wait(400);
    }));
  } else {
    InteractionManager.start(idle('PUP_SITS', room, async (c) => {
      c.pup({ pose: 'sit', facing: (-p.facing) as 1 | -1 });
      await c.wait(1500);
    }));
  }
}

/** Biscuit reacts to what the family does (only when he isn't busy with something else). */
const REACTIONS: Record<string, { pose: PupPose; sound: SoundName; line?: boolean; ms: number }> = {
  BALL_THROWN_AT_PAPA: { pose: 'jump', sound: 'bark', line: true, ms: 1300 },
  BALL_THROWN_AT_MUMMY: { pose: 'jump', sound: 'bark', line: true, ms: 1300 },
  TOWER_CRASHED: { pose: 'jump', sound: 'yip', ms: 1100 },
  TOY_CAR_ZOOMED: { pose: 'run', sound: 'yip', ms: 900 },
  DOOR_KNOCKED: { pose: 'beg', sound: 'bark', line: true, ms: 1400 },
  KID_LAUGHS: { pose: 'spin', sound: 'yip', ms: 1200 },
  MUMMY_DANCE_BREAK: { pose: 'spin', sound: 'yip', ms: 2000 },
  PAPA_GUITAR_JAM: { pose: 'wag', sound: 'whine', ms: 2000 },
  GUITAR_PLAYED: { pose: 'beg', sound: 'whine', ms: 1400 },
  PILLOW_THROWN: { pose: 'jump', sound: 'bark', ms: 1200 },
  BED_JUMPED_ON: { pose: 'jump', sound: 'yip', ms: 1200 },
};

let wired = false;
export function wirePupReactions() {
  if (wired) return;
  wired = true;
  EventBus.on((e) => {
    const r = REACTIONS[e.type];
    const s = getGame();
    if (!r || !pupHere(s) || s.pup.pose === 'sleep' || InteractionManager.busyPriority('pup') > 0) return;
    InteractionManager.start(
      idle('PUP_REACTS', s.currentRoom, async (c) => {
        await c.wait(350);
        c.pup({ pose: r.pose });
        c.sound(r.sound);
        if (r.line) DialogueManager.say('pup', pl('woof'), 0);
        await c.wait(r.ms);
      }),
    );
  });
}

