// Interaction building blocks shared by both rooms (reusable, configuration-style definitions).
import type { Ctx, InteractionDefinition } from '../engine/InteractionManager';
import { InteractionManager } from '../engine/InteractionManager';
import { RoomManager } from '../engine/RoomManager';
import { AudioManager } from '../engine/AudioManager';
import { DialogueManager } from '../engine/DialogueManager';
import { pickVaried } from '../engine/random';
import { formatTime, isTwelveOClock } from '../engine/time';
import type { FoodItem, GameState, ParentId, RoomId } from '../state/gameTypes';
import { KID, MUMMY, PAPA, REMEMBER } from '../data/dialogues';
import { FamilyMemory, repeatTier } from '../engine/FamilyMemory';
import { MUMMY_SEAT, MUMMY_SPOTS, PAPA_SEAT, PAPA_SPOTS, type Spot } from '../data/spots';

export const parentOf = (room: RoomId): ParentId => (room === 'papa-room' ? 'papa' : 'mummy');
export const spotsOf = (room: RoomId) => (room === 'papa-room' ? PAPA_SPOTS : MUMMY_SPOTS) as Record<string, Spot>;
export const roomKey = (room: RoomId) => (room === 'papa-room' ? 'papaRoom' : 'mummyRoom') as 'papaRoom' | 'mummyRoom';

/** Parent head position in scene coordinates (for things thrown at them). */
export const parentHead = (room: RoomId) =>
  room === 'papa-room' ? { x: PAPA_SEAT.x + 8, y: PAPA_SEAT.y - 196 } : { x: MUMMY_SEAT.x - 8, y: MUMMY_SEAT.y - 196 };

type LineBook = Record<string, readonly string[]>;
export const line = (c: Ctx, book: 'papa' | 'mummy' | 'kid', key: string): string => {
  const src = (book === 'papa' ? PAPA : book === 'mummy' ? MUMMY : KID) as unknown as LineBook;
  const list = src[key];
  if (!list || list.length === 0) return '';
  return c.pick(book + '.' + key, list);
};

/**
 * Parents remember: when this interaction has happened several times this session, a line with a
 * REMEMBER entry is swapped for a "you again!" reaction (3rd, 5th, then every 3rd time).
 */
export const rememberLine = (c: Ctx, who: string, key: string): string | null => {
  const tiers = REMEMBER[who + '.' + key];
  if (!tiers) return null;
  const n = FamilyMemory.count(c.id);
  const tier = repeatTier(n);
  if (!tier) return null;
  return c.pick('remember.' + who + '.' + key + tier, tiers[tier - 1]).replace('{n}', String(n));
};

export const say = (c: Ctx, who: 'papa' | 'mummy' | 'kid', key: string, opts?: { wait?: boolean; priority?: number }) => {
  const text = rememberLine(c, who, key) ?? line(c, who, key);
  return text ? c.say(who, text, opts) : Promise.resolve();
};

/** Quietly comment if the character is free (never interrupts anything). */
export const aside = (who: 'papa' | 'mummy' | 'kid', key: string) => {
  const src = (who === 'papa' ? PAPA : who === 'mummy' ? MUMMY : KID) as unknown as LineBook;
  const list = src[key];
  if (!list || list.length === 0 || InteractionManager.isBusy(who)) return;
  DialogueManager.say(who, pickVaried(who + '.' + key, list), 0);
};

export const kidPresent = (s: GameState) => s.kid.room === s.currentRoom && s.kid.awake;
export const kidHolding = (s: GameState) => (kidPresent(s) ? s.kid.holding : null);
export const isToy = (h: string | null) => h === 'robot' || h === 'duck' || h === 'teddy';
export const FOODS = ['cookie', 'sandwich', 'banana', 'juice', 'popcorn', 'cupcake', 'tomato'] as const;
export const isFood = (h: string | null): h is FoodItem => !!h && (FOODS as readonly string[]).includes(h);

// --------------------------------------------------------------- hold timeout
/** After carrying a toy for a while the kid plays with it and puts it back. Low priority: any action cancels it. */
const holdTimeout = (room: RoomId): InteractionDefinition => ({
  id: 'HOLD_TIMEOUT',
  room,
  target: 'hold:timeout',
  action: 'Kid plays with the toy and puts it back',
  category: 'idle',
  uses: ['kid'],
  priority: 0,
  run: async (c) => {
    await c.wait(9000);
    const h = c.s.kid.holding;
    if (!h) return;
    if (isFood(h)) {
      // he got hungry waiting and ate it himself
      c.kid({ pose: 'drink', expr: 'happy' });
      c.sound(h === 'juice' ? 'gulp' : 'crunch');
      await c.wait(900);
      c.kid({ holding: null, pose: 'stand', expr: 'laugh' });
      await c.say('kid', h === 'juice' ? 'Ahh! All gone!' : 'Oops, I ate it! Yummy!', { priority: 0, ms: 1400 });
      return;
    }
    c.kid({ pose: 'dance', expr: 'happy' });
    c.sound(h === 'duck' ? 'quack' : h === 'robot' ? 'robot' : 'squeak');
    await say(c, 'kid', h === 'duck' ? 'duck' : h === 'robot' ? 'robot' : 'teddy', { priority: 0 });
    await c.wait(600);
    c.kid({ holding: null });
  },
});

export function startHoldTimeout(room: RoomId) {
  InteractionManager.start(holdTimeout(room));
}

// --------------------------------------------------------------- generic room defs
const lastSwitch: Partial<Record<RoomId, number>> = {};

export function commonDefs(room: RoomId): InteractionDefinition[] {
  const parent = parentOf(room);
  const rk = roomKey(room);
  const other: RoomId = room === 'papa-room' ? 'mummy-room' : 'papa-room';
  const patch = (c: Ctx, p: Record<string, unknown>) => (rk === 'papaRoom' ? c.papaRoom(p) : c.mummyRoom(p));
  const sp = spotsOf(room);

  return [
    {
      id: 'DOOR_OPENED',
      room,
      target: 'door',
      action: 'Walk through the door to the other room',
      run: async () => {
        RoomManager.go(other);
      },
    },
    {
      id: 'LIGHT_SWITCH_CLICKED',
      room,
      target: 'switch',
      action: 'Toggle the room lights – parent reacts',
      category: 'prank',
      uses: [parent],
      priority: 3,
      sound: 'switch',
      run: async (c) => {
        const now = Date.now();
        const on = !c.s[rk].lightOn;
        patch(c, { lightOn: on });
        c.sound('switch');
        lastSwitch[room] = now;
        const otherAt = lastSwitch[other];
        if (otherAt && now - otherAt < 15000) {
          // EASTER EGG: both rooms' lights flicked in quick succession → gentle dance party
          lastSwitch[other] = 0;
          patch(c, { lightOn: false });
          c.egg('both-lights', { x: 720, y: 300 });
          c.fx('disco', true);
          c.sound('disco');
          if (kidPresent(c.s)) c.kid({ pose: 'dance', expr: 'laugh' });
          c.adult(parent, { activity: parent === 'papa' ? 'play' : 'hug', expr: 'laugh' });
          await say(c, parent, 'disco');
          await c.wait(2200);
          c.sound('disco');
          await c.wait(2000);
          c.unfx('disco');
          patch(c, { lightOn: true });
          if (kidPresent(c.s)) c.kid({ pose: 'stand', expr: 'happy' });
          return;
        }
        if (kidPresent(c.s)) void c.say('kid', line(c, 'kid', 'hee'), { wait: false, priority: 1 });
        if (!on) {
          c.adult(parent, { activity: 'lookAround', expr: 'surprised' });
          await c.wait(500);
          await say(c, parent, 'lightsOff');
          c.adult(parent, { expr: 'puzzled' });
          await c.wait(1200);
        } else {
          c.adult(parent, { activity: 'lookBack', expr: 'happy' });
          await say(c, parent, 'lightsOn');
        }
      },
    },
    {
      id: 'CURTAINS_TOGGLED',
      room,
      target: 'curtains',
      action: 'Open / close the curtains',
      run: async (c) => {
        patch(c, { curtainsOpen: !c.s[rk].curtainsOpen });
        c.sound('swish');
      },
    },
    {
      id: 'WINDOW_TOGGLED',
      room,
      target: 'window',
      action: 'Open / close the window (birds by day, crickets by night)',
      run: async (c) => {
        const open = !c.s[rk].windowOpen;
        patch(c, { windowOpen: open, ...(open ? { curtainsOpen: true } : {}) });
        c.sound('creak');
        if (open) {
          await c.wait(500);
          c.sound(c.s.dayPeriod === 'night' ? 'crickets' : 'birds');
          if (parent === 'papa') aside('papa', 'window');
          await c.wait(900);
          c.sound(c.s.dayPeriod === 'night' ? 'crickets' : 'birds');
        }
      },
    },
    {
      id: 'FAN_SPEED_CHANGED',
      room,
      target: 'fan',
      action: 'Cycle the ceiling fan speed',
      run: async (c) => {
        const next = ((c.s[rk].fanSpeed + 1) % 3) as 0 | 1 | 2;
        patch(c, { fanSpeed: next });
        c.sound('switch');
        AudioManager.setFan(next);
        if (next === 2) c.sound('whoosh');
      },
    },
    {
      id: 'CLOCK_CHECKED',
      room,
      target: 'clock',
      action: 'Clock tells the real time with a cuckoo (special chime at 12:00)',
      cooldownMs: 800,
      run: async (c) => {
        const d = new Date();
        const t = formatTime(d);
        c.fx('cuckoo', true);
        if (isTwelveOClock(d)) {
          c.egg('twelve-oclock', { x: room === 'papa-room' ? 1210 : 735, y: 150 });
          c.sound('bigChime');
          if (kidPresent(c.s)) await c.say('kid', `It's 12 o'clock! Ding dong!`);
        } else {
          c.sound('cuckoo');
          if (kidPresent(c.s)) await c.say('kid', c.pick('kid.time', KID.time(t)), { priority: 1 });
          else DialogueManager.say(parent, `It's ${t} already!`, 1);
        }
        await c.wait(900);
        c.sound('chime');
        await c.wait(700);
      },
    },
    {
      id: 'UNEXPECTED_SOUND',
      room,
      target: 'plant',
      action: 'Kid hides by the plant and makes a funny animal sound',
      category: 'prank',
      needsKid: true,
      uses: [parent],
      priority: 2,
      cooldownMs: 1500,
      run: async (c) => {
        const animal = parent === 'papa' ? 'moo' : 'meow';
        await c.kidTo(sp.plant);
        c.kid({ pose: 'crouch', expr: 'funny' });
        c.sound(animal);
        await c.say('kid', line(c, 'kid', animal), { ms: 1300 });
        c.adult(parent, { activity: 'lookAround', expr: 'puzzled' });
        await say(c, parent, parent === 'papa' ? 'plant' : 'meow');
        c.kid({ pose: 'peek', expr: 'laugh' });
        c.sound('giggle');
        await c.wait(1100);
      },
    },
    {
      id: 'KID_DRINKS_WATER',
      room,
      target: 'bottle',
      action: 'Kid drinks water (Water bottle + Kid)',
      category: 'combo',
      needsKid: true,
      priority: 2,
      run: async (c) => {
        await c.kidTo(sp.bottle);
        c.kid({ pose: 'reach' });
        await c.wait(350);
        c.kid({ pose: 'drink', prop: 'bottle', expr: 'happy' });
        c.sound('gulp');
        await c.wait(1300);
        c.kid({ pose: 'stand', expr: 'laugh' });
        await say(c, 'kid', 'drink');
        aside(parent, 'bottle');
        c.kid({ pose: 'reach' });
        await c.wait(300);
      },
    },
    {
      id: parent === 'papa' ? 'BALL_THROWN_AT_PAPA' : 'BALL_THROWN_AT_MUMMY',
      room,
      target: 'ball',
      action: parent === 'papa' ? 'Kid throws the ball – it bonks Papa (Ball + Papa)' : 'Kid throws the ball – Mummy catches it and throws it back (Ball + Mummy)',
      category: 'prank',
      needsKid: true,
      uses: [parent],
      priority: 3,
      cooldownMs: 1200,
      run: async (c) => {
        await c.kidTo(sp.ball);
        c.kid({ pose: 'reach', expr: 'happy' });
        await c.wait(250);
        c.fx(room + ':ballAway', true);
        c.kid({ pose: 'throw', prop: 'ball', facing: parent === 'papa' ? 1 : 1 });
        if (parent === 'mummy') void c.say('kid', line(c, 'kid', 'catchBall'), { wait: false });
        await c.wait(450);
        const k = c.s.kid;
        const head = parentHead(room);
        c.kid({ prop: null, pose: 'stand' });
        await c.throwItem({ kind: 'ball', from: { x: k.x + 20 * k.facing, y: k.y - 215 }, to: head, dur: 650, arc: 120, spin: true });
        if (parent === 'papa') {
          c.sound('bounce');
          c.papa({ activity: 'lookBack', expr: 'surprised' });
          void c.throwItem({ kind: 'ball', from: head, to: { x: 820, y: 768 }, dur: 600, arc: 70, spin: true });
          await say(c, 'papa', 'ball');
          c.kid({ expr: 'laugh', pose: 'jump' });
          c.sound('giggle');
          c.papa({ expr: 'laugh' });
          await c.wait(1200);
        } else {
          c.sound('pop');
          c.mummy({ activity: 'catch', expr: 'happy' });
          await say(c, 'mummy', 'ball');
          c.mummy({ activity: 'throw', expr: 'laugh' });
          const kk = c.s.kid;
          await c.throwItem({ kind: 'ball', from: head, to: { x: kk.x, y: kk.y - 150 }, dur: 650, arc: 90, spin: true });
          c.kid({ pose: 'cheer', expr: 'laugh' });
          c.sound('giggle');
          await c.wait(900);
        }
      },
    },
  ];
}

/** Kid tapped: wake / play with held toy / laugh egg / funny face behind the parent. */
export function kidDefs(room: RoomId, wakeRun: ((c: Ctx) => Promise<void>) | null): InteractionDefinition[] {
  const parent = parentOf(room);
  const sp = spotsOf(room);
  const defs: InteractionDefinition[] = [];
  if (wakeRun) {
    defs.push({
      id: 'KID_WOKEN_UP',
      room,
      target: 'kid',
      action: 'Wake the sleeping kid',
      when: (s) => s.kid.room === room && !s.kid.awake,
      uses: ['kid', parent],
      priority: 3,
      run: wakeRun,
    });
  }
  defs.push(
    {
      id: 'KID_LAUGHS',
      room,
      target: 'kid',
      action: 'Tap the kid five times quickly → giant giggle fit (easter egg)',
      category: 'easter',
      when: (s) => kidPresent(s) && InteractionManager.tapCounter.hit('kid-peek', 2600) >= 5,
      uses: ['kid'],
      priority: 4,
      run: async (c) => {
        InteractionManager.tapCounter.reset('kid-peek');
        const k = c.s.kid;
        c.egg('kid-laugh', { x: k.x, y: k.y - 160 });
        c.kid({ pose: 'jump', expr: 'laugh' });
        c.sound('laugh');
        await say(c, 'kid', 'laugh');
        c.sound('giggle');
        aside(parent, 'laugh');
        await c.wait(800);
      },
    },
    {
      id: 'KID_PLAYS_WITH_TOY',
      room,
      target: 'kid',
      action: 'Squeeze the toy the kid is holding (teddy dances after 4 squeezes)',
      when: (s) => isToy(kidHolding(s)),
      uses: ['kid'],
      priority: 2,
      run: async (c) => {
        const h = c.s.kid.holding;
        const n = c.taps('toy-squeeze', 5000);
        if (h === 'teddy' && n >= 4) {
          c.resetTaps('toy-squeeze');
          const k = c.s.kid;
          c.egg('teddy-dance', { x: k.x, y: k.y - 150 });
          c.kid({ pose: 'dance', expr: 'laugh' });
          c.sound('teddyDance');
          await c.say('kid', 'Mr. Fluff is dancing!');
          await c.wait(800);
          startHoldTimeout(room);
          return;
        }
        c.kid({ pose: 'cheer', expr: 'happy' });
        c.sound(h === 'duck' ? 'quack' : h === 'robot' ? 'robot' : 'squeak');
        await say(c, 'kid', h === 'duck' ? 'duck' : h === 'robot' ? 'robot' : 'teddy');
        startHoldTimeout(room);
      },
    },
    {
      id: parent === 'papa' ? 'FUNNY_FACE_BEHIND_PAPA' : 'FUNNY_FACE_BEHIND_MUMMY',
      room,
      target: 'kid',
      action: 'Kid sneaks behind the parent and makes funny faces – and gets caught',
      category: 'prank',
      when: (s) => kidPresent(s) && !isToy(s.kid.holding),
      uses: ['kid', parent],
      priority: 2,
      cooldownMs: 600,
      run: async (c) => {
        await c.kidTo(parent === 'papa' ? sp.behindPapa : sp.behindMummy);
        c.kid({ pose: 'funny', expr: 'funny', facing: parent === 'papa' ? 1 : -1 });
        c.sound('giggle');
        await c.wait(1000);
        c.kid({ expr: 'funny2' });
        await c.wait(900);
        c.adult(parent, { activity: 'lookBack', expr: 'surprised' });
        c.kid({ pose: 'stand', expr: 'surprised' });
        await c.wait(400);
        await say(c, parent, 'funnyCaught');
        c.adult(parent, { expr: 'laugh' });
        c.kid({ expr: 'laugh', pose: 'jump' });
        c.sound('laugh');
        await c.wait(1000);
      },
    },
  );
  return defs;
}
