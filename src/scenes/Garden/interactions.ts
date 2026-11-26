// THE GARDEN – drive the toy excavator along a road you draw in the sand, feed the birds, water
// plants and watch them grow, dig for treasure with Biscuit, play catch-me-if-you-can, run through
// the sprinkler, swing on the mango tree and make friends with the butterflies.
import type { Ctx, InteractionDefinition } from '../../engine/InteractionManager';
import { InteractionManager } from '../../engine/InteractionManager';
import { RoomManager } from '../../engine/RoomManager';
import { DialogueManager } from '../../engine/DialogueManager';
import { AudioManager } from '../../engine/AudioManager';
import { EventBus } from '../../engine/EventManager';
import { pickVaried, randBetween } from '../../engine/random';
import { getGame, grownPlants } from '../../state/gameStore';
import type { Bird, BirdKind, GameState, PlantState } from '../../state/gameTypes';
import { GARDEN_SPOTS as SP, PLANT_X, BED_Y, SANDPIT, SOIL_PATCH, PUP_FLOOR_Y } from '../../data/spots';
import { isFood, kidHolding, kidPresent, startHoldTimeout } from '../shared';
import { pupEnter, pupInteractions } from '../pup';

const R = 'garden' as const;

const L = {
  remote: ['Draw a road in the sand for my digger!', 'Make a road with your finger. Vroom!'],
  autoRoad: ['I\'ll make a twisty road myself!', 'Okay, I\'ll draw the road!'],
  drive: ['Vroom vroom! Go, digger, go!', 'Beep beep! Digger coming through!', 'Brrrm! Follow the road!'],
  dump: ['Dig, lift... and DUMP!', 'Scoop! A sand mountain!', 'Look at my sand mountain!'],
  bigHeap: ['The biggest sand mountain ever!', 'It\'s as big as a real mountain!'],
  water: ['Drink up, little plant!', 'Water for you! Grow big!', 'Splish splash, plant bath!'],
  waterAll: ['All the plants get a drink!', 'Water time, plants!'],
  allGrown: ['My plants are all grown up!', 'Look at my beautiful garden!'],
  waitGrow: ['Grow, grow, grow! I\'ll wait.', 'It needs a little time to grow.'],
  grew: ['Look! It grew!', 'Wow! It\'s bigger!', 'It grew! Yay!'],
  sunflower: ['This sunflower is taller than me!', 'Hello, sunny flower! It\'s smiling!'],
  tomato: ['A tomato! I grew it myself!', 'Red and juicy! Let\'s give it to Papa or Mummy!'],
  flower: ['Mmm, it smells lovely!', 'Pretty pink flowers! Mummy will love them.'],
  seeds: ['Here, birdies! Come and eat!', 'Breakfast for the birds!', 'Tweet tweet! Seeds for you!'],
  birdsCome: ['Shhh... the birds are coming!', 'Look, look! Birds!'],
  sprinkler: ['Wheee! Cold water!', 'Splash! It tickles!', 'Rainbow water!'],
  swing: ['Push me higher!', 'Wheee! I\'m flying!', 'Swing, swing, swing!'],
  swingHigh: ['Higher! I can touch the sky!', 'Wheee! Up to the clouds!'],
  tree: ['A mango tree! Mangoes are my favourite!', 'Shake, shake, shake!'],
  mango: ['Bonk! A mango fell on my head!', 'A mango! Mummy can make mango shake!'],
  dig: ['Dig, Biscuit, dig!', 'What\'s under the ground?'],
  fill: ['Let\'s fill the hole before Mummy sees!', 'Pat pat pat. All fixed!'],
  catchStart: ['Catch me if you can, Biscuit? No! I\'ll catch YOU!', 'Ready, steady... I\'m coming to catch you!'],
  catchHelp: ['Tap Biscuit to catch him!', 'Quick! Tap Biscuit!'],
  missed: ['Missed! He\'s so fast!', 'Ooh! He got away!', 'Hee hee, come back!'],
  caught: ['Got you! Got you!', 'Caught you, Biscuit!'],
  swap: ['Now you catch ME, Biscuit!', 'My turn to run! Catch me if you can!'],
  pupWins: ['Ha ha ha! You caught me!', 'Puppy kisses! You win!'],
  tooFast: ['Phew! Biscuit is too fast for me!', 'I\'m tired! Let\'s play later, Biscuit.'],
  bush: ['Achoo! Flowers make me sneeze!', 'Is anybody hiding in there?'],
  barrow: ['Beep beep! Wheelbarrow coming through!', 'I\'m a gardener!'],
  butterfly: ['A butterfly on my nose! Hee hee!', 'Hello, butterfly! Be my friend!'],
  hungry: ['I\'m a garden explorer!', 'Hee hee!', 'What should we play now?'],
} as const;
const l = (k: keyof typeof L) => pickVaried('garden.' + k, L[k]);

const BIRD_NAMES: Record<BirdKind, readonly string[]> = {
  sparrow: ['A little sparrow! Chirp chirp!', 'That\'s a sparrow. It\'s small and brown!'],
  myna: ['A myna! It has a yellow beak!', 'That\'s a myna bird. It can talk a lot!'],
  bulbul: ['A bulbul! It has a red bottom! Hee hee!', 'That\'s a bulbul with a pointy hat!'],
  parrot: ['A green parrot! Hello, Mr. Parrot!', 'Wow, a parrot! Can you say my name?'],
};

const TREASURES = ['bone', 'coin', 'worm', 'key', 'dino', 'ball', 'shell'] as const;
const TREASURE_LINES: Record<(typeof TREASURES)[number], string> = {
  bone: 'A bone! Biscuit, did you hide this?',
  coin: 'A shiny gold coin! I\'m rich!',
  worm: 'Eww! A wiggly worm! Hello, wormy!',
  key: 'An old key! Maybe for a treasure chest?',
  dino: 'A dinosaur! A real dino fossil! Rawr!',
  ball: 'My lost ball! Biscuit found it!',
  shell: 'A seashell! In our garden?',
};

const inGarden = (s: GameState) => s.currentRoom === R;
const pupHere = (s: GameState) => s.pup.room === R;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ------------------------------------------------------------------ plants
function patchPlant(i: number, patch: Partial<PlantState>) {
  const plants = getGame().garden.plants.map((p, j) => (j === i ? { ...p, ...patch } : p));
  getGame().patchGarden({ plants });
}

async function waterPlant(c: Ctx, i: number) {
  await c.kidTo({ x: PLANT_X[i] - 70, y: 640, facing: 1 });
  c.kid({ pose: 'reach', expr: 'happy', prop: 'can' });
  c.sound('pour');
  const p = c.s.garden.plants[i];
  if (p.stage < 3 && p.wateredAt === null) patchPlant(i, { wateredAt: Date.now() });
  await c.wait(1100);
  c.kid({ pose: 'stand' });
}

/** Called every second by the idle director: waters turn into growth. */
let growClear: ReturnType<typeof setTimeout> | undefined;
export function gardenTick() {
  const s = getGame();
  const before = s.garden.plants;
  const next = grownPlants(before);
  if (next) {
    s.patchGarden({ plants: next });
    const i = next.findIndex((p, j) => p.stage !== before[j].stage);
    if (inGarden(s) && i >= 0) {
      AudioManager.play('grow');
      s.setFx(R + ':growAt', i);
      clearTimeout(growClear);
      growClear = setTimeout(() => getGame().clearFx(R + ':growAt'), 1600);
      if (kidPresent(s) && InteractionManager.busyPriority('kid') <= 0) DialogueManager.say('kid', l('grew'), 1);
    }
    if (next.some((p) => p.stage === 3) && s.discoverEgg('garden-grow')) {
      AudioManager.play('sparkle');
      const at = i >= 0 ? { x: PLANT_X[i], y: BED_Y - 200 } : { x: 720, y: 400 };
      s.setFx('sparkle', JSON.stringify({ ...at, id: Date.now() }));
      EventBus.emit({ type: 'EASTER_EGG_FOUND', id: 'garden-grow' });
    }
  }
  // now and then a bird or two drops by on its own
  if (inGarden(s) && s.garden.birds.length === 0 && !s.transitioning && Math.random() < 1 / 35) {
    InteractionManager.start(birdVisit(randBetween(1, 2), false));
  }
}

function plantDef(i: number): InteractionDefinition[] {
  const target = 'plant-' + i;
  return [
    {
      id: `PLANT${i}_TOMATO_PICKED`,
      room: R,
      target,
      action: 'Pick a ripe tomato – carry it to Papa or Mummy',
      category: 'combo',
      when: (s) => s.garden.plants[i].kind === 'tomato' && s.garden.plants[i].stage === 3 && !kidHolding(s),
      needsKid: true,
      uses: ['kid'],
      priority: 2,
      run: async (c) => {
        await c.kidTo({ x: PLANT_X[i] - 60, y: 650, facing: 1 });
        c.kid({ pose: 'reach', expr: 'happy' });
        c.sound('pop');
        await c.wait(400);
        patchPlant(i, { stage: 2, wateredAt: null });
        c.egg('garden-tomato', { x: PLANT_X[i], y: BED_Y - 120 });
        c.kid({ holding: 'tomato', pose: 'cheer', expr: 'laugh' });
        await c.say('kid', l('tomato'), { ms: 1800 });
        c.kid({ pose: 'stand' });
        startHoldTimeout(R);
      },
    },
    {
      id: `PLANT${i}_ADMIRED`,
      room: R,
      target,
      action: 'Smell the sunflower or the pink flowers',
      category: 'object',
      when: (s) => s.garden.plants[i].stage === 3 && s.garden.plants[i].kind !== 'tomato',
      needsKid: true,
      uses: ['kid'],
      priority: 2,
      run: async (c) => {
        const kind = c.s.garden.plants[i].kind;
        await c.kidTo({ x: PLANT_X[i] - 60, y: 650, facing: 1 });
        c.kid({ pose: kind === 'sunflower' ? 'reach' : 'crouch', expr: 'love' });
        c.sound(kind === 'sunflower' ? 'buzz' : 'aww');
        await c.say('kid', l(kind === 'sunflower' ? 'sunflower' : 'flower'), { ms: 1700 });
        c.kid({ pose: 'stand', expr: 'happy' });
      },
    },
    {
      id: `PLANT${i}_WATERED`,
      room: R,
      target,
      action: 'Water this plant – it grows a stage a little later',
      category: 'object',
      needsKid: true,
      uses: ['kid'],
      priority: 2,
      run: async (c) => {
        const p = c.s.garden.plants[i];
        c.fx(R + ':canHeld', true);
        await c.kidTo(SP.can);
        c.kid({ prop: 'can' });
        await waterPlant(c, i);
        await c.say('kid', p.wateredAt !== null ? l('waitGrow') : l('water'), { ms: 1400 });
        await c.kidTo(SP.can);
        c.kid({ prop: null });
      },
    },
  ];
}

// ------------------------------------------------------------------ birds
let birdSeq = 1;
const birdsNow = () => getGame().garden.birds;
const setBird = (id: number, patch: Partial<Bird>) =>
  getGame().patchGarden({ birds: birdsNow().map((b) => (b.id === id ? { ...b, ...patch } : b)) });

function randomKind(): BirdKind {
  const r = Math.random();
  return r < 0.12 ? 'parrot' : r < 0.42 ? 'sparrow' : r < 0.72 ? 'myna' : 'bulbul';
}

/** Birds fly in, peck at the seeds (or perch on the fence), hop about and fly off again. */
function birdVisit(count: number, withSeeds: boolean): InteractionDefinition {
  return {
    id: withSeeds ? 'BIRDS_COME_TO_EAT' : 'BIRD_DROPS_BY',
    room: R,
    target: 'birds:visit',
    action: 'Birds visit the garden',
    category: 'idle',
    uses: [],
    priority: 0.5,
    run: async (c) => {
      let mineRef = new Set<number>();
      const seeds: [number, number][] = withSeeds
        ? Array.from({ length: 7 }, () => [Math.round(randBetween(960, 1160)), Math.round(randBetween(598, 650))])
        : [];
      if (withSeeds) c.fx(R + ':seeds', JSON.stringify(seeds));
      try {
        const spots = withSeeds ? seeds : Array.from({ length: count }, () => [Math.round(randBetween(300, 1100)), 404] as [number, number]);
        const birds: Bird[] = Array.from({ length: count }, (): Bird => {
          const fromLeft = Math.random() < 0.5;
          return { id: birdSeq++, kind: randomKind(), x: fromLeft ? -60 : 1500, y: randBetween(-60, 120), facing: fromLeft ? 1 : -1, mode: 'fly', moveMs: 0 };
        });
        const mine = new Set(birds.map((b) => b.id));
        const own = () => birdsNow().filter((b) => mine.has(b.id));
        mineRef = mine;
        getGame().patchGarden({ birds: [...birdsNow(), ...birds] });
        await c.wait(60);
        for (const [k, b] of birds.entries()) {
          const [x, y] = spots[k % spots.length];
          setBird(b.id, { x, y, moveMs: 1500 + k * 250, facing: x > b.x ? 1 : -1 });
        }
        c.sound('flap');
        await c.wait(1800 + count * 250);
        own().forEach((b) => setBird(b.id, { mode: 'peck', moveMs: 0 }));
        AudioManager.play(birds[0].kind);
        const end = Date.now() + (withSeeds ? 14000 : 8000);
        while (Date.now() < end && own().length) {
          await c.wait(randBetween(900, 1600));
          const list = own().filter((b) => b.mode !== 'fly');
          if (!list.length) break;
          const b = list[Math.floor(Math.random() * list.length)];
          if (Math.random() < 0.5) {
            const nx = clamp(b.x + randBetween(-60, 60), withSeeds ? 940 : 260, withSeeds ? 1180 : 1140);
            setBird(b.id, { x: nx, facing: nx > b.x ? 1 : -1, mode: 'hop', moveMs: 380 });
            await c.wait(400);
            setBird(b.id, { mode: 'peck', moveMs: 0 });
          } else AudioManager.play(b.kind);
        }
        // off they go
        for (const b of own()) {
          const away = b.x < 720 ? -80 : 1520;
          setBird(b.id, { mode: 'fly', x: away, y: randBetween(-80, 60), facing: away > b.x ? 1 : -1, moveMs: 1600 });
          c.sound('flap');
          await c.wait(250);
        }
        await c.wait(1700);
      } finally {
        const gone = mineRef;
        getGame().patchGarden({ birds: birdsNow().filter((b) => !gone.has(b.id)) });
      }
    },
  };
}

/** Tapping a bird: the kid tells you its name (and you collect its sticker), then it flutters away. */
export function tapBird(id: number) {
  const s = getGame();
  const b = s.garden.birds.find((x) => x.id === id);
  if (!b || b.mode === 'fly') return;
  AudioManager.play(b.kind);
  AudioManager.play('flap');
  if (s.discoverEgg('bird-' + b.kind)) {
    AudioManager.play('sparkle');
    s.setFx('sparkle', JSON.stringify({ x: b.x, y: b.y - 40, id: Date.now() }));
    EventBus.emit({ type: 'EASTER_EGG_FOUND', id: 'bird-' + b.kind });
  }
  if (kidPresent(s) && InteractionManager.busyPriority('kid') <= 0) DialogueManager.say('kid', pickVaried('bird.' + b.kind, BIRD_NAMES[b.kind]), 1);
  // it flutters up, then lands somewhere else nearby
  const up = { x: clamp(b.x + randBetween(-160, 160), 260, 1180), y: b.y < 500 ? 404 : randBetween(600, 650) };
  setBird(id, { mode: 'fly', y: b.y - 120, moveMs: 450 });
  setTimeout(() => {
    if (!birdsNow().some((x) => x.id === id)) return;
    setBird(id, { ...up, facing: up.x > b.x ? 1 : -1, moveMs: 900 });
    setTimeout(() => birdsNow().some((x) => x.id === id) && setBird(id, { mode: 'peck', moveMs: 0 }), 950);
  }, 480);
}

// ------------------------------------------------------------------ butterflies
export function tapButterfly(i: number) {
  const s = getGame();
  if (!kidPresent(s)) {
    AudioManager.play('sparkle');
    return;
  }
  InteractionManager.start({
    id: 'BUTTERFLY_LANDS',
    room: R,
    target: 'butterfly',
    action: 'A butterfly lands on the kid’s nose',
    category: 'character',
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      c.fx(R + ':bflyOnKid', i);
      c.sound('sparkle');
      c.kid({ pose: 'stand', expr: 'surprised' });
      await c.wait(500);
      c.kid({ expr: 'laugh', pose: 'funny' });
      c.sound('giggle');
      c.egg('butterfly', { x: c.s.kid.x, y: c.s.kid.y - 250 });
      await c.say('kid', l('butterfly'), { ms: 2000 });
      c.kid({ pose: 'wave', expr: 'happy' });
      await c.wait(900);
    },
  });
}

// ------------------------------------------------------------------ excavator
function resample(pts: [number, number][], step: number): [number, number][] {
  const out: [number, number][] = [pts[0]];
  let [px, py] = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    let d = Math.hypot(x - px, y - py);
    while (d >= step) {
      const t = step / d;
      px += (x - px) * t;
      py += (y - py) * t;
      out.push([px, py]);
      d = Math.hypot(x - px, y - py);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const autoRoad = (): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push([SANDPIT.cx - 190 + t * 380, SANDPIT.cy + Math.sin(t * Math.PI * 2) * 40]);
  }
  return pts;
};

const driveRun = async (c: Ctx) => {
  c.fx(R + ':driving', true);
  await c.kidTo(SP.remote);
  c.kid({ prop: 'remote', pose: 'stand', expr: 'happy', facing: 1 });
  c.sound('robot');
  getGame().clearFx(R + ':trackPts');
  c.fx(R + ':draw', true);
  await c.say('kid', l('remote'), { ms: 1800, wait: false });
  // wait for the child to draw a road (or make one up after a while)
  let pts: [number, number][] | null = null;
  const until = Date.now() + 14000;
  while (Date.now() < until) {
    await c.wait(150);
    const raw = getGame().fx[R + ':trackPts'] as string | undefined;
    if (raw) {
      pts = JSON.parse(raw) as [number, number][];
      break;
    }
  }
  c.unfx(R + ':draw');
  getGame().clearFx(R + ':trackPts');
  if (!pts) {
    await c.say('kid', l('autoRoad'), { ms: 1300 });
    pts = autoRoad();
  }
  getGame().setFx(R + ':marks', JSON.stringify(pts));
  c.kid({ pose: 'cheer', expr: 'laugh' });
  void c.say('kid', l('drive'), { wait: false, ms: 1600 });
  // drive to the start of the road, then follow it
  const g = () => getGame().garden.digger;
  const moveTo = async (x: number, y: number, speed: number) => {
    const d = g();
    const dist = Math.hypot(x - d.x, y - d.y);
    if (dist < 2) return;
    const ms = Math.max(60, dist / speed);
    const facing: 1 | -1 = Math.abs(x - d.x) > 3 ? (x > d.x ? 1 : -1) : d.facing;
    getGame().patchGarden({ digger: { ...d, x, y, facing, moveMs: ms } });
    await c.wait(ms);
  };
  c.sound('engine');
  await moveTo(pts[0][0], pts[0][1], 0.25);
  c.kid({ pose: 'stand' });
  const path = resample(pts, 26);
  let lastEngine = Date.now();
  for (const [x, y] of path) {
    await moveTo(x, y, 0.16);
    if (Date.now() - lastEngine > 900) {
      c.sound('engine');
      lastEngine = Date.now();
    }
  }
  // dig, lift, swing round and dump
  const set = (patch: Partial<ReturnType<typeof g>>) => getGame().patchGarden({ digger: { ...g(), ...patch, moveMs: 0 } });
  set({ arm: 'dig' });
  c.sound('scoop');
  await c.wait(600);
  set({ load: true, arm: 'lift' });
  await c.wait(600);
  const d = g();
  set({ facing: (-d.facing) as 1 | -1 });
  await c.wait(350);
  set({ arm: 'dump', load: false });
  c.sound('scoop');
  const hx = clamp(d.x - d.facing * 95, SANDPIT.cx - SANDPIT.rx + 60, SANDPIT.cx + SANDPIT.rx - 60);
  const prev = getGame().fx[R + ':heapAt'] as string | undefined;
  const near = prev ? Math.hypot(JSON.parse(prev)[0] - hx, JSON.parse(prev)[1] - d.y) < 120 : false;
  getGame().setFx(R + ':heapAt', JSON.stringify([hx, d.y + 4]));
  const heap = near ? Math.min(4, c.s.garden.heap + 1) : 1;
  getGame().patchGarden({ heap });
  await c.wait(500);
  set({ arm: 'rest' });
  c.kid({ pose: 'cheer', expr: 'laugh' });
  c.sound('tada');
  c.egg('garden-digger', { x: hx, y: d.y - 60 });
  await c.say('kid', heap >= 4 ? l('bigHeap') : l('dump'), { ms: 1700 });
  c.kid({ prop: null, pose: 'stand' });
};

// ------------------------------------------------------------------ catch me if you can
const LAWN = { minX: 270, maxX: 1240, minY: 700, maxY: 796 };
const randLawn = (awayFrom?: { x: number }) => {
  for (let i = 0; i < 8; i++) {
    const x = randBetween(LAWN.minX, LAWN.maxX);
    if (!awayFrom || Math.abs(x - awayFrom.x) > 260) return { x, y: randBetween(LAWN.minY, LAWN.maxY) };
  }
  return { x: awayFrom && awayFrom.x > 720 ? LAWN.minX + 40 : LAWN.maxX - 40, y: 780 };
};

const catchGame: InteractionDefinition = {
  id: 'CATCH_ME_IF_YOU_CAN',
  room: R,
  target: 'catch-game',
  action: 'Catch-me-if-you-can: tap Biscuit to catch him, then he chases you',
  category: 'character',
  needsKid: true,
  uses: ['kid', 'pup'],
  priority: 2,
  run: async (c) => {
    await pupEnter(c, R);
    const p0 = c.s.pup;
    c.pup({ pose: 'beg', facing: c.s.kid.x > p0.x ? 1 : -1 });
    c.sound('yip');
    c.kid({ pose: 'cheer', expr: 'laugh', facing: p0.x > c.s.kid.x ? 1 : -1 });
    await c.say('kid', l('catchStart'), { ms: 1800 });
    c.fx(R + ':chase', 'run');
    let lastTap = Date.now();
    getGame().setFx(R + ':catchTap', 0);
    let seen = 0;
    let misses = 0;
    let nudged = false;
    let caught = false;
    let nextZoom = 0;
    const started = Date.now();
    while (Date.now() - started < 30000) {
      await c.wait(120);
      const tap = (getGame().fx[R + ':catchTap'] as number | undefined) ?? 0;
      if (tap > seen) {
        seen = tap;
        lastTap = Date.now();
        const p = c.s.pup;
        // kid dashes at Biscuit
        const side = c.s.kid.x < p.x ? -1 : 1;
        await c.kidTo({ x: p.x + side * 70, y: clamp(p.y - 6, 700, 790) }, { speed: 1.3 });
        if (misses < 2) {
          misses++;
          const to = randLawn(p);
          c.sound('yip');
          void c.pupTo(to, { run: true, pose: 'wag' });
          c.kid({ pose: 'funny', expr: 'laugh' });
          c.sound('giggle');
          await c.say('kid', l('missed'), { ms: 1100 });
          c.kid({ pose: 'stand' });
          nextZoom = Date.now() + 1400;
          continue;
        }
        c.kid({ pose: 'hug', expr: 'love', facing: (-side) as 1 | -1 });
        c.pup({ pose: 'lick', facing: side as 1 | -1 });
        c.sound('slurp');
        c.sound('giggle');
        c.fx(R + ':hearts', true);
        await c.say('kid', l('caught'), { ms: 1400 });
        c.unfx(R + ':hearts');
        caught = true;
        break;
      }
      if (Date.now() >= nextZoom) {
        void c.pupTo(randLawn(c.s.kid), { run: true, pose: 'wag' });
        c.sound('yip');
        nextZoom = Date.now() + randBetween(1500, 2200);
      }
      if (!nudged && Date.now() - lastTap > 7000) {
        nudged = true;
        void c.say('kid', l('catchHelp'), { wait: false, ms: 1600 });
      }
      if (Date.now() - lastTap > 15000) break;
    }
    c.unfx(R + ':chase');
    if (!caught) {
      c.kid({ pose: 'sit', expr: 'happy' });
      c.pup({ pose: 'wag' });
      await c.say('kid', l('tooFast'), { ms: 1700 });
      return;
    }
    // round two: Biscuit chases the kid round the garden
    c.kid({ pose: 'cheer', expr: 'laugh' });
    await c.say('kid', l('swap'), { ms: 1500 });
    const laps = [{ x: 1180, y: 782 }, { x: 420, y: 720 }, { x: 980, y: 790 }, { x: 560, y: 780 }];
    for (const spot of laps) {
      const k = c.s.kid;
      c.sound('giggle');
      const kidRun = c.kidTo(spot, { speed: 1.0 });
      await c.wait(350);
      void c.pupTo({ x: spot.x + (spot.x > k.x ? -90 : 90), y: PUP_FLOOR_Y }, { run: true, pose: 'run' });
      c.sound('bark');
      await kidRun;
      await c.wait(250);
    }
    const k = c.s.kid;
    await c.pupTo({ x: k.x + 70 * k.facing, y: PUP_FLOOR_Y }, { run: true, pose: 'jump' });
    c.kid({ pose: 'lie', expr: 'laugh' });
    c.pup({ pose: 'lick', facing: (-k.facing) as 1 | -1 });
    c.sound('slurp');
    c.sound('laugh');
    c.egg('catch-me', { x: k.x, y: k.y - 120 });
    await c.say('kid', l('pupWins'), { ms: 1800 });
    c.pup({ pose: 'wag' });
    c.kid({ pose: 'stand', expr: 'happy' });
    await c.wait(500);
  },
};

// ------------------------------------------------------------------ definitions
export const gardenInteractions: InteractionDefinition[] = [
  {
    id: 'DOOR_OPENED',
    room: R,
    target: 'door',
    action: 'Back inside to the kitchen',
    run: async () => RoomManager.go('kitchen'),
  },

  // --- excavator
  {
    id: 'DIGGER_DRIVEN',
    room: R,
    target: 'digger',
    action: 'Draw a road in the sand – the toy excavator drives along it, digs and dumps',
    category: 'object',
    when: (s) => !s.fx[R + ':driving'],
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: driveRun,
  },
  {
    id: 'SANDPIT_ROAD',
    room: R,
    target: 'sandpit',
    action: 'Draw a road in the sand – the toy excavator drives along it, digs and dumps',
    category: 'object',
    when: (s) => !s.fx[R + ':driving'],
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: driveRun,
  },

  // --- watering can & plants
  {
    id: 'PLANTS_WATERED',
    room: R,
    target: 'can',
    action: 'Pick up the watering can and water every thirsty plant',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      c.fx(R + ':canHeld', true);
      await c.kidTo(SP.can);
      c.kid({ prop: 'can', pose: 'cheer', expr: 'happy' });
      c.sound('pop');
      const todo = c.s.garden.plants.map((p, i) => (p.stage < 3 ? i : -1)).filter((i) => i >= 0);
      if (!todo.length) {
        await c.say('kid', l('allGrown'), { ms: 1600 });
        c.kid({ prop: null });
        return;
      }
      void c.say('kid', l('waterAll'), { wait: false, ms: 1300 });
      for (const i of todo.reverse()) await waterPlant(c, i);
      await c.say('kid', l('waitGrow'), { ms: 1400 });
      await c.kidTo(SP.can);
      c.kid({ prop: null });
    },
  },
  ...plantDef(0),
  ...plantDef(1),
  ...plantDef(2),

  // --- birds
  {
    id: 'BIRDS_FED',
    room: R,
    target: 'seeds',
    action: 'Scatter seeds – sparrows, mynas, bulbuls (and sometimes a parrot) come to eat',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    cooldownMs: 1500,
    run: async (c) => {
      c.fx(R + ':seedsHeld', true);
      await c.kidTo(SP.seeds);
      c.kid({ prop: 'seeds', pose: 'cheer', expr: 'happy' });
      await c.wait(300);
      await c.kidTo({ x: 1060, y: 700, facing: 1 });
      c.kid({ pose: 'throw' });
      c.sound('pour');
      void c.say('kid', l('seeds'), { wait: false, ms: 1500 });
      InteractionManager.start(birdVisit(Math.round(randBetween(3, 5)), true));
      await c.wait(700);
      c.kid({ pose: 'stand', prop: null });
      c.unfx(R + ':seedsHeld');
      await c.kidTo({ x: 880, y: 772, facing: 1 });
      c.kid({ pose: 'crouch', expr: 'surprised' });
      await c.say('kid', l('birdsCome'), { ms: 1500 });
      await c.wait(1200);
    },
  },

  // --- sprinkler
  {
    id: 'SPRINKLER_RUN',
    room: R,
    target: 'sprinkler',
    action: 'Turn on the sprinkler – run through the water (it waters the plants too)',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      c.fx(R + ':spray', true);
      c.sound('spray');
      const now = Date.now();
      getGame().patchGarden({ plants: c.s.garden.plants.map((p) => (p.stage < 3 && p.wateredAt === null ? { ...p, wateredAt: now } : p)) });
      if (pupHere(c.s) && InteractionManager.busyPriority('pup') <= 0) {
        getGame().setPup({ pose: 'jump' });
        AudioManager.play('bark');
      }
      for (const x of [300, 420, 260, 400]) {
        await c.kidTo({ x, y: 690 }, { speed: 0.9 });
        c.kid({ pose: 'jump', expr: 'laugh' });
        c.sound('splash');
        if (x === 260) void c.say('kid', l('sprinkler'), { wait: false, ms: 1500 });
        await c.wait(380);
      }
      c.sound('spray');
      c.egg('sprinkler', { x: 353, y: 520 });
      await c.wait(900);
      c.kid({ pose: 'stand' });
      if (pupHere(c.s) && InteractionManager.busyPriority('pup') <= 0) getGame().setPup({ pose: 'wag' });
    },
  },

  // --- swing & tree
  {
    id: 'SWING_HIGH',
    room: R,
    target: 'swing',
    action: 'Tap the swing 3 times quickly → super high swing (easter egg)',
    category: 'easter',
    when: (s) => kidPresent(s) && InteractionManager.tapCounter.hit('swing', 6000) >= 3,
    needsKid: true,
    uses: ['kid'],
    priority: 3,
    run: async (c) => {
      c.resetTaps('swing');
      await c.kidTo(SP.swing);
      c.kid({ layer: 'inside', expr: 'laugh' });
      c.fx(R + ':swing', 2);
      c.sound('creak');
      c.egg('garden-swing', { x: 1110, y: 360 });
      await c.say('kid', l('swingHigh'), { ms: 2000 });
      for (let i = 0; i < 3; i++) {
        c.sound(i % 2 ? 'whoosh' : 'creak');
        await c.wait(800);
      }
      c.unfx(R + ':swing');
      c.kid({ layer: 'front', ...SP.swing, pose: 'jump', moveMs: 0 });
      c.sound('boing');
      await c.wait(400);
    },
  },
  {
    id: 'SWING_RIDE',
    room: R,
    target: 'swing',
    action: 'Have a go on the swing',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.swing);
      c.kid({ layer: 'inside', expr: 'happy' });
      c.fx(R + ':swing', 1);
      c.sound('creak');
      await c.say('kid', l('swing'), { ms: 1800 });
      for (let i = 0; i < 3; i++) {
        c.sound('creak');
        await c.wait(900);
      }
      c.unfx(R + ':swing');
      c.kid({ layer: 'front', ...SP.swing, pose: 'jump', moveMs: 0 });
      c.sound('boing');
      await c.wait(400);
    },
  },
  {
    id: 'TREE_SHAKEN',
    room: R,
    target: 'tree',
    action: 'Shake the mango tree – leaves rustle, a mango drops (and sometimes a parrot flies out)',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.tree);
      c.kid({ pose: 'push', expr: 'strain', facing: 1 });
      c.fx(R + ':treeShake', true);
      c.sound('swish');
      void c.say('kid', l('tree'), { wait: false, ms: 1200 });
      await c.wait(900);
      c.unfx(R + ':treeShake');
      const k = c.s.kid;
      await c.throwItem({ kind: 'mango', from: { x: 1230, y: 290 }, to: { x: k.x - 10, y: k.y - 220 }, dur: 600, arc: 0 });
      c.sound('thud');
      c.kid({ pose: 'funny', expr: 'dizzy' });
      await c.say('kid', l('mango'), { ms: 1700 });
      if (Math.random() < 0.5 && c.s.garden.birds.length === 0) InteractionManager.start(birdVisit(1, false));
      c.kid({ pose: 'stand', expr: 'happy' });
    },
  },

  // --- digging with Biscuit
  {
    id: 'DIG_WITH_BISCUIT',
    room: R,
    target: 'soil',
    action: 'Dig in the soft soil with Biscuit – find a buried treasure',
    category: 'character',
    needsKid: true,
    uses: ['kid', 'pup'],
    priority: 2,
    run: async (c) => {
      if (c.s.garden.hole >= 3) {
        await c.kidTo(SP.soil);
        c.kid({ pose: 'crouch', expr: 'funny', prop: 'spade' });
        c.sound('dig');
        await c.say('kid', l('fill'), { ms: 1700 });
        getGame().patchGarden({ hole: 0 });
        c.sound('thud');
        c.kid({ prop: null, pose: 'stand' });
        return;
      }
      await c.kidTo(SP.soil);
      c.kid({ pose: 'crouch', expr: 'happy', prop: 'spade', facing: -1 });
      await pupEnter(c, R);
      void c.say('kid', l('dig'), { wait: false, ms: 1300 });
      await c.pupTo({ x: SOIL_PATCH.x + 80, y: SOIL_PATCH.y + 34 }, { run: true, pose: 'dig' });
      c.pup({ pose: 'dig', facing: -1 });
      for (let i = 0; i < 3; i++) {
        c.fx(R + ':dirt', Date.now());
        c.sound('dig');
        await c.wait(650);
        c.unfx(R + ':dirt');
      }
      getGame().patchGarden({ hole: c.s.garden.hole + 1 });
      const t = c.pick('garden.treasure', TREASURES);
      c.fx(R + ':treasure', t);
      c.pup({ pose: 'wag' });
      c.sound(t === 'worm' ? 'squeak' : 'tada');
      c.kid({ pose: 'cheer', expr: t === 'worm' ? 'surprised' : 'laugh', prop: null });
      c.egg('dig-treasure', { x: SOIL_PATCH.x, y: SOIL_PATCH.y - 80 });
      await c.say('kid', TREASURE_LINES[t], { ms: 2000 });
      c.sound('bark');
      await c.wait(600);
    },
  },

  // --- foreground bits
  {
    id: 'BUSH_SNIFFED',
    room: R,
    target: 'bush',
    action: 'Sniff the flowering bush',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo({ x: 1250, y: 772, facing: 1 });
      c.kid({ pose: 'peek', expr: 'puzzled' });
      c.sound('swish');
      await c.wait(600);
      c.kid({ pose: 'funny', expr: 'surprised' });
      c.sound('aww');
      await c.say('kid', l('bush'), { ms: 1500 });
    },
  },
  {
    id: 'BARROW_PUSHED',
    room: R,
    target: 'barrow',
    action: 'Play gardener with the wheelbarrow',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo({ x: 340, y: 772, facing: -1 });
      c.kid({ pose: 'push', expr: 'laugh' });
      c.sound('squeak');
      await c.say('kid', l('barrow'), { ms: 1500 });
    },
  },

  // --- Biscuit: in the garden a tap means "let's play catch!"
  {
    id: 'CATCH_TAP',
    room: R,
    target: 'pup',
    action: 'During catch-me-if-you-can: tap Biscuit to try to catch him',
    category: 'character',
    when: (s) => s.fx[R + ':chase'] === 'run',
    uses: [],
    priority: 0.2,
    run: async () => {
      getGame().setFx(R + ':catchTap', Date.now());
    },
  },
  {
    id: 'CATCH_ME_STARTED',
    room: R,
    target: 'pup',
    action: 'Tap Biscuit in the garden → catch-me-if-you-can',
    category: 'character',
    when: (s) => inGarden(s) && pupHere(s) && s.pup.pose !== 'sleep' && !isFood(kidHolding(s)) && !s.fx[R + ':chase'] && !s.fx['hs:hidden'],
    uses: [],
    priority: 0.2,
    run: async () => {
      InteractionManager.start(catchGame);
    },
  },

  // --- the kid
  {
    id: 'KID_EXPLORES',
    room: R,
    target: 'kid',
    action: 'The kid does a happy garden dance',
    category: 'character',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      c.kid({ pose: 'dance', expr: 'happy' });
      c.sound('giggle');
      await c.say('kid', l('hungry'), { ms: 1300 });
    },
  },

  ...pupInteractions(R),
];
