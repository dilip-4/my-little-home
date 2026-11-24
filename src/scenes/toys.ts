// New playful toys: building-block tower + toy car (Papa's office), soap bubbles (Mummy's room).
import type { Ctx, InteractionDefinition } from '../engine/InteractionManager';
import { InteractionManager } from '../engine/InteractionManager';
import { DialogueManager } from '../engine/DialogueManager';
import { pickVaried, randBetween } from '../engine/random';
import { FamilyMemory } from '../engine/FamilyMemory';
import { getGame } from '../state/gameStore';
import type { ParentId } from '../state/gameTypes';
import { TOYS } from '../data/dialogues';
import { CAR_HOME, MUMMY_SPOTS, PAPA_SPOTS, TOWER_BASE } from '../data/spots';
import type { BubbleSpec } from '../components/Toys';

type ToyKey = keyof typeof TOYS;
const toyLine = (key: ToyKey) => pickVaried('toy.' + key, TOYS[key]);

/** A parent comments only when free – toys never interrupt something more important. */
const parentAside = (who: ParentId, key: ToyKey) => {
  if (!busy(who)) DialogueManager.say(who, toyLine(key), 1);
};
/** Busy with something that matters (idle fidgeting doesn't count). */
const busy = (who: 'papa' | 'mummy' | 'kid') => InteractionManager.busyPriority(who) > 0;

// ------------------------------------------------------------------ block tower
const PR = 'papa-room' as const;
export const TOWER_MAX = 7;
const towerHeight = () => (getGame().fx[PR + ':tower'] as number | undefined) ?? 0;
/** Tower height lives in fx (not temp) so it survives between taps for this session. */
const setTower = (h: number) => (h > 0 ? getGame().setFx(PR + ':tower', h) : getGame().clearFx(PR + ':tower'));

async function crashTower(c: Ctx, dir: 1 | -1) {
  const h = towerHeight();
  c.fx(PR + ':towerCrash', JSON.stringify({ h, id: Date.now(), dir }));
  setTower(0);
  c.sound('crash');
  c.emit('TOWER_CRASHED', { height: h });
}

export function papaToyDefs(): InteractionDefinition[] {
  return [
    {
      id: 'TOWER_KNOCKED_DOWN',
      room: PR,
      target: 'blocks',
      action: 'Stack one block too many – the tall tower tumbles, Papa laughs',
      category: 'object',
      when: (s) => ((s.fx[PR + ':tower'] as number | undefined) ?? 0) >= TOWER_MAX - 1,
      needsKid: true,
      uses: ['kid', 'papa'],
      priority: 3,
      run: async (c) => {
        await c.kidTo(PAPA_SPOTS.blocks);
        c.kid({ pose: 'liftUp', expr: 'strain' });
        await c.wait(350);
        setTower(TOWER_MAX);
        c.sound('block');
        await c.wait(700);
        c.kid({ pose: 'stand', expr: 'surprised' });
        await crashTower(c, -1);
        c.papa({ activity: 'lookBack', expr: 'surprised' });
        await c.wait(500);
        c.kid({ pose: 'jump', expr: 'laugh' });
        c.sound('laugh');
        c.papa({ expr: 'laugh' });
        const crashes = FamilyMemory.count('TOWER_CRASHED');
        await c.say('papa', crashes === 3 ? 'Three crashes! You are a demolition expert, beta!' : toyLine('papaCrash'));
        await c.wait(900);
      },
    },
    {
      id: 'BLOCK_STACKED',
      room: PR,
      target: 'blocks',
      action: 'Stack building blocks into a wobbly tower',
      category: 'object',
      needsKid: true,
      uses: ['kid'],
      priority: 2,
      run: async (c) => {
        await c.kidTo(PAPA_SPOTS.blocks);
        c.kid({ pose: 'crouch', expr: 'focused' });
        await c.wait(260);
        const h = Math.min(TOWER_MAX - 1, towerHeight() + 1);
        c.kid({ pose: h >= 4 ? 'liftUp' : 'reach', expr: 'happy' });
        setTower(h);
        c.sound('block');
        await c.wait(380);
        if (h >= 5) {
          c.kid({ pose: 'cheer', expr: 'laugh' });
          await c.say('kid', toyLine('kidTowerTall'), { ms: 1600 });
          parentAside('papa', 'papaTowerTall');
        } else {
          c.kid({ pose: 'stand', expr: 'happy' });
          await c.say('kid', toyLine('kidBlock'), { ms: 1100 });
        }
      },
    },
    {
      id: 'TOY_CAR_ZOOMED',
      room: PR,
      target: 'car',
      action: 'Wind up the toy car – it zooms into Papa’s chair (or into the block tower!)',
      category: 'prank',
      needsKid: true,
      uses: ['kid', 'papa'],
      priority: 3,
      cooldownMs: 600,
      run: async (c) => {
        await c.kidTo(PAPA_SPOTS.car);
        c.kid({ pose: 'crouch', expr: 'funny' });
        c.sound('creak');
        await c.wait(500);
        c.kid({ pose: 'cheer', expr: 'laugh' });
        void c.say('kid', toyLine('kidCar'), { wait: false, ms: 1200 });
        c.sound('vroom');
        const tower = towerHeight();
        c.fx(PR + ':carLeft', true);
        if (tower >= 3) {
          // COMBO: toy car + block tower = monster-truck crash
          const ms = 1300;
          c.fx(PR + ':carMs', ms);
          c.fx(PR + ':carX', TOWER_BASE.x + 40);
          await c.wait(ms);
          await crashTower(c, -1);
          c.egg('car-crash', { x: TOWER_BASE.x, y: 650 });
          c.papa({ activity: 'lookBack', expr: 'surprised' });
          await c.wait(400);
          c.papa({ expr: 'laugh' });
          c.kid({ pose: 'jump', expr: 'laugh' });
          await c.say('papa', toyLine('papaCarCrash'));
        } else {
          const ms = 900;
          c.fx(PR + ':carMs', ms);
          c.fx(PR + ':carX', 962);
          c.fx(PR + ':carY', 668); // right into the chair wheels
          await c.wait(ms);
          c.sound('thud');
          c.papa({ activity: 'lookBack', expr: 'surprised' });
          await c.wait(350);
          c.papa({ expr: FamilyMemory.count(c.id) >= 3 ? 'laugh' : 'annoyed' });
          await c.say('papa', FamilyMemory.count(c.id) >= 3 ? 'Again?! I need a parking ticket for this car!' : toyLine('papaCar'));
          c.kid({ pose: 'stand', expr: 'laugh' });
          c.sound('giggle');
        }
        // reverse back home
        c.fx(PR + ':carMs', 1500);
        c.fx(PR + ':carLeft', false);
        c.fx(PR + ':carX', CAR_HOME.x);
        c.fx(PR + ':carY', CAR_HOME.y - 6);
        c.sound('vroom');
        await c.wait(1500);
      },
    },
  ];
}

// ------------------------------------------------------------------ bubbles
const MR = 'mummy-room' as const;

function makeBubbles(from: { x: number; y: number }, rainbow: boolean): BubbleSpec[] {
  const n = 8;
  const rainbowAt = rainbow ? Math.floor(randBetween(2, n - 1)) : -1;
  return Array.from({ length: n }, (_, k) => ({
    k,
    x: from.x + randBetween(-14, 14),
    y: from.y + randBetween(-10, 10),
    dx: randBetween(-200, 420),
    rise: randBetween(260, 470),
    r: k === rainbowAt ? 26 : randBetween(13, 24),
    dur: randBetween(7500, 10500),
    delay: k * 170,
    rainbow: k === rainbowAt,
  }));
}

/** Keeps the bubbles alive and reacts to popping. Has no actors, so it never blocks anyone. */
const bubbleWatch = (items: BubbleSpec[]): InteractionDefinition => ({
  id: 'BUBBLES_FLOATING',
  room: MR,
  target: 'bubbles:watch',
  action: 'Bubbles float until popped',
  category: 'idle',
  priority: 0,
  run: async (c) => {
    const g = getGame();
    g.clearFx(MR + ':rainbowPopped');
    c.fx(MR + ':bubbleLeft', items.length);
    c.fx(MR + ':bubblePops', 0);
    c.fx(MR + ':bubbles', JSON.stringify({ id: Date.now(), items }));
    const end = Date.now() + 12500;
    let cheeredRainbow = false;
    while (Date.now() < end) {
      await c.wait(250);
      const s = getGame();
      if (s.fx[MR + ':rainbowPopped'] && !cheeredRainbow) {
        cheeredRainbow = true;
        s.clearFx(MR + ':rainbowPopped');
        parentAside('mummy', 'mummyRainbow');
      }
      if (((s.fx[MR + ':bubbleLeft'] as number | undefined) ?? 1) <= 0) break;
    }
    const pops = (getGame().fx[MR + ':bubblePops'] as number | undefined) ?? 0;
    if (pops === items.length) {
      // every single bubble popped
      if (!busy('kid') && getGame().kid.room === MR) {
        getGame().setKid({ pose: 'cheer', expr: 'laugh' });
        c.sound('giggle');
      }
      c.sound('clap');
      parentAside('mummy', 'mummyAllPopped');
      await c.wait(1100);
      if (!busy('kid') && getGame().kid.room === MR && getGame().kid.awake) getGame().setKid({ pose: 'stand', expr: 'happy' });
    }
  },
});

export function mummyToyDefs(): InteractionDefinition[] {
  return [
    {
      id: 'BUBBLES_BLOWN',
      room: MR,
      target: 'bubbles',
      action: 'Blow soap bubbles – tap them to pop (a rainbow one is rare magic)',
      category: 'object',
      needsKid: true,
      uses: ['kid'],
      priority: 2,
      cooldownMs: 400,
      run: async (c) => {
        await c.kidTo(MUMMY_SPOTS.bubbles);
        c.kid({ pose: 'crouch', expr: 'happy' });
        await c.wait(280);
        c.fx(MR + ':wandOut', true);
        c.kid({ pose: 'drink', prop: 'wand', expr: 'funny', facing: 1 });
        await c.wait(350);
        c.sound('blow');
        const k = c.s.kid;
        const from = { x: k.x + 22 * k.facing, y: k.y - 210 };
        // the very first blow always has a rainbow bubble, then about one in four
        const rainbow = FamilyMemory.count(c.id) === 1 || Math.random() < 0.25;
        InteractionManager.start(bubbleWatch(makeBubbles(from, rainbow)));
        await c.wait(700);
        c.kid({ pose: 'cheer', expr: 'laugh', prop: 'wand' });
        void c.say('kid', toyLine('kidBubbles'), { wait: false, ms: 1200 });
        if (!busy('mummy')) {
          getGame().setAdult('mummy', { activity: 'lookKid', expr: 'happy' });
          DialogueManager.say('mummy', toyLine('mummyBubbles'), 0);
          setTimeout(() => {
            if (!busy('mummy') && getGame().characters.mummy.activity === 'lookKid') getGame().setAdult('mummy', { activity: 'typing', expr: 'focused' });
          }, 2600);
        }
        await c.wait(1300);
      },
    },
  ];
}

