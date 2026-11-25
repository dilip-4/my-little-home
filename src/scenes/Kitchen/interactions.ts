// THE KITCHEN – the kid's (and Biscuit's) room: raid the fridge, sneak cookies, build a sandwich,
// pop popcorn, wash hands with bubbles, drum on the table, bake a cake in the chef hat... and carry
// snacks to Papa and Mummy.
import type { Ctx, InteractionDefinition } from '../../engine/InteractionManager';
import { InteractionManager } from '../../engine/InteractionManager';
import { RoomManager } from '../../engine/RoomManager';
import { DialogueManager } from '../../engine/DialogueManager';
import { pickVaried } from '../../engine/random';
import { formatTime } from '../../engine/time';
import { getGame } from '../../state/gameStore';
import type { FoodItem } from '../../state/gameTypes';
import { KITCHEN_SPOTS as SP } from '../../data/spots';
import { KID } from '../../data/dialogues';
import { isFood, kidHolding, kidPresent, startHoldTimeout } from '../shared';
import { bubbleWatch, makeBubbles } from '../toys';
import { pupInteractions } from '../pup';

const R = 'kitchen' as const;

const L = {
  fridgeCold: ['Brrr! It\'s so cold in here!', 'Hello, Mr. Cheese!', 'Ooh, what\'s for snack?'],
  juice: ['Juice box! Yay!', 'Orange juice for me!'],
  cookieSneak: ['Shhh... just one cookie.', 'Nobody is looking... cookie time!'],
  cookieMonster: ['COOKIE MONSTER! Nom nom nom!'],
  banana: ['A banana! Ooh ooh aah aah!', 'Banana for a monkey!'],
  juggle: ['Look! I can juggle!'],
  wash: ['Scrub scrub! Clean hands!', 'Wash wash wash! Bubbles!'],
  layers: ['Bread!', 'Cheese!', 'Tomato!', 'Lettuce!', 'More bread! Done!'],
  sandwichReady: ['My super sandwich! Who wants it?', 'Ta-da! Sandwich for Papa or Mummy?'],
  popcorn: ['Popcorn! Pop pop pop!', 'It\'s popping!'],
  ovenNoHat: ['I need my chef hat first!', 'A chef needs a chef hat! It\'s in the costume chest.'],
  cake: ['Cake is ready! Happy un-birthday!', 'I baked a cake! Let\'s share!'],
  drums: ['Boom boom tap!', 'Ba-dum tss!', 'I\'m a drummer!'],
  band: ['Kitchen band! Biscuit, sing!'],
  eat: ['Yum yum!', 'Mmm! So good!'],
  spooky: ['Spooky kitchen! Hee hee!', 'Who turned off the sun?'],
  plant: ['Grow, little plant, grow!'],
  hungry: ['I\'m hungry! What\'s in the fridge?', 'Snack time!', 'Hee hee!'],
} as const;
const l = (k: keyof typeof L) => pickVaried('kitchen.' + k, L[k]);

const pupBark = () => {
  const s = getGame();
  if (s.pup.room === R && InteractionManager.busyPriority('pup') <= 0) DialogueManager.say('pup', 'Woof!', 0);
};

async function grab(c: Ctx, item: FoodItem, line: string) {
  c.kid({ holding: item, pose: 'cheer', expr: 'laugh' });
  await c.say('kid', line, { ms: 1400 });
  c.kid({ pose: 'stand' });
  startHoldTimeout(R);
}

export const kitchenInteractions: InteractionDefinition[] = [
  // ------------------------------------------------------------------ room basics
  {
    id: 'DOOR_OPENED',
    room: R,
    target: 'door',
    action: 'Back to Papa’s office',
    run: async () => RoomManager.go('papa-room'),
  },
  {
    id: 'KITCHEN_LIGHT_SWITCHED',
    room: R,
    target: 'switch',
    action: 'Toggle the kitchen light',
    category: 'object',
    run: async (c) => {
      const on = !c.s.kitchen.lightOn;
      getGame().patchKitchen({ lightOn: on });
      c.sound('switch');
      if (!on && kidPresent(c.s)) await c.say('kid', l('spooky'), { ms: 1300, priority: 1 });
    },
  },
  {
    id: 'CURTAINS_TOGGLED',
    room: R,
    target: 'curtains',
    action: 'Open / close the curtains',
    run: async (c) => {
      getGame().patchKitchen({ curtainsOpen: !c.s.kitchen.curtainsOpen });
      c.sound('swish');
    },
  },
  {
    id: 'WINDOW_TOGGLED',
    room: R,
    target: 'window',
    action: 'Open / close the window',
    run: async (c) => {
      const open = !c.s.kitchen.windowOpen;
      getGame().patchKitchen({ windowOpen: open, ...(open ? { curtainsOpen: true } : {}) });
      c.sound('creak');
      if (open) {
        await c.wait(500);
        c.sound(c.s.dayPeriod === 'night' ? 'crickets' : 'birds');
      }
    },
  },
  {
    id: 'CLOCK_CHECKED',
    room: R,
    target: 'clock',
    action: 'The kitchen clock says the real time',
    cooldownMs: 800,
    run: async (c) => {
      c.fx('cuckoo', true);
      c.sound('cuckoo');
      if (kidPresent(c.s)) await c.say('kid', c.pick('kid.time', KID.time(formatTime(new Date()))), { priority: 1 });
      await c.wait(900);
    },
  },
  {
    id: 'PLANT_WATERED',
    room: R,
    target: 'plant',
    action: 'Water the windowsill plant',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.sink);
      c.kid({ pose: 'reach', expr: 'happy' });
      c.sound('pour');
      await c.say('kid', l('plant'), { ms: 1300 });
    },
  },

  // ------------------------------------------------------------------ fridge
  {
    id: 'CHEESE_WINKS',
    room: R,
    target: 'fridge',
    action: 'Open the fridge 5 times quickly → the cheese winks (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('fridge', 7000) >= 5,
    needsKid: true,
    uses: ['kid'],
    priority: 4,
    run: async (c) => {
      c.resetTaps('fridge');
      await c.kidTo(SP.fridge);
      c.fx(R + ':fridgeOpen', true);
      c.sound('creak');
      await c.wait(500);
      c.fx(R + ':cheeseWink', true);
      c.egg('cheese-wink', { x: 300, y: 500 });
      c.kid({ pose: 'jump', expr: 'surprised' });
      await c.say('kid', 'The cheese winked at me!', { ms: 1600 });
      c.kid({ expr: 'laugh' });
      c.sound('giggle');
      await c.wait(700);
    },
  },
  {
    id: 'FRIDGE_JUICE',
    room: R,
    target: 'fridge',
    action: 'Open the fridge and take a juice box (carry it to Papa or Mummy!)',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.fridge);
      c.fx(R + ':fridgeOpen', true);
      c.sound('creak');
      c.kid({ pose: 'reach', expr: 'surprised' });
      await c.wait(600);
      c.sound('clink');
      c.unfx(R + ':fridgeOpen');
      c.sound('doorClose');
      await grab(c, 'juice', l('juice'));
    },
  },
  {
    id: 'FRIDGE_PEEK',
    room: R,
    target: 'fridge',
    action: 'Peek into the cold fridge – Biscuit hopes for a treat',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.fridge);
      c.fx(R + ':fridgeOpen', true);
      c.sound('creak');
      c.kid({ pose: 'peek', expr: 'surprised', facing: -1 });
      pupBark();
      await c.say('kid', l('fridgeCold'), { ms: 1500 });
      c.kid({ pose: 'stand', expr: 'funny' });
      c.sound('hmm');
      await c.wait(500);
    },
  },

  // ------------------------------------------------------------------ cookie jar
  {
    id: 'COOKIE_MONSTER',
    room: R,
    target: 'cookies',
    action: 'Tap the cookie jar 5 times quickly → cookie monster (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('cookies', 6000) >= 5,
    needsKid: true,
    uses: ['kid'],
    priority: 4,
    run: async (c) => {
      c.resetTaps('cookies');
      await c.kidTo(SP.cookies);
      c.fx(R + ':jarOpen', true);
      c.egg('cookie-monster', { x: 505, y: 400 });
      c.kid({ pose: 'funny', expr: 'funny' });
      for (let i = 0; i < 3; i++) {
        c.sound('crunch');
        await c.wait(450);
      }
      await c.say('kid', l('cookieMonster'), { ms: 1600 });
      c.kid({ pose: 'jump', expr: 'laugh' });
      c.sound('laugh');
      await c.wait(700);
    },
  },
  {
    id: 'COOKIE_SNEAKED',
    room: R,
    target: 'cookies',
    action: 'Sneak a cookie from the jar',
    category: 'prank',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.cookies);
      c.kid({ pose: 'reach', expr: 'funny' });
      c.fx(R + ':jarOpen', true);
      c.sound('clink');
      await c.wait(400);
      c.kid({ pose: 'stand', facing: -1 });
      await c.say('kid', l('cookieSneak'), { ms: 1300 });
      c.unfx(R + ':jarOpen');
      c.sound('clink');
      c.kid({ facing: 1 });
      await grab(c, 'cookie', 'Got one! Hee hee!');
    },
  },

  // ------------------------------------------------------------------ fruit
  {
    id: 'FRUIT_JUGGLE',
    room: R,
    target: 'fruit',
    action: 'Tap the fruit bowl 3 times quickly → the kid juggles (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('fruit', 4000) >= 3,
    needsKid: true,
    uses: ['kid'],
    priority: 4,
    run: async (c) => {
      c.resetTaps('fruit');
      await c.kidTo(SP.fruit);
      c.fx(R + ':juggle', true);
      c.kid({ pose: 'cheer', expr: 'laugh' });
      c.egg('fruit-juggle', { x: c.s.kid.x, y: c.s.kid.y - 320 });
      c.sound('teddyDance');
      await c.say('kid', l('juggle'), { ms: 2400 });
      await c.wait(600);
    },
  },
  {
    id: 'BANANA_TAKEN',
    room: R,
    target: 'fruit',
    action: 'Take a banana from the fruit bowl',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.fruit);
      c.kid({ pose: 'reach', expr: 'happy' });
      await c.wait(350);
      await grab(c, 'banana', l('banana'));
    },
  },

  // ------------------------------------------------------------------ sink
  {
    id: 'HANDS_WASHED',
    room: R,
    target: 'sink',
    action: 'Wash hands – soap bubbles float up (pop them!)',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    cooldownMs: 400,
    run: async (c) => {
      await c.kidTo(SP.sink);
      c.kid({ pose: 'reach', expr: 'happy', facing: 1 });
      c.fx(R + ':tap', true);
      c.sound('splash');
      await c.wait(500);
      InteractionManager.start(bubbleWatch(makeBubbles({ x: 810, y: 440 }, Math.random() < 0.2), R));
      c.kid({ pose: 'funny', expr: 'laugh' });
      c.sound('brush');
      await c.say('kid', l('wash'), { ms: 1500 });
      c.unfx(R + ':tap');
      c.kid({ pose: 'cheer' });
      await c.wait(400);
    },
  },

  // ------------------------------------------------------------------ sandwich
  {
    id: 'SANDWICH_BUILT',
    room: R,
    target: 'board',
    action: 'Build a sandwich one layer at a time, then carry it to Papa or Mummy',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.board);
      const layers = (getGame().fx[R + ':sandwich'] as number | undefined) ?? 0;
      if (layers >= 5) {
        getGame().clearFx(R + ':sandwich');
        c.kid({ pose: 'reach' });
        await c.wait(250);
        c.sound('tada');
        await grab(c, 'sandwich', l('sandwichReady'));
        return;
      }
      c.kid({ pose: 'reach', expr: 'focused', facing: 1 });
      await c.wait(250);
      getGame().setFx(R + ':sandwich', layers + 1);
      c.sound(layers === 4 ? 'tada' : 'pop');
      c.kid({ pose: layers === 4 ? 'cheer' : 'stand', expr: 'happy' });
      await c.say('kid', L.layers[layers], { ms: 1000 });
    },
  },

  // ------------------------------------------------------------------ microwave popcorn
  {
    id: 'POPCORN_POPPED',
    room: R,
    target: 'microwave',
    action: 'Make popcorn in the microwave – pop pop pop, ding!',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    cooldownMs: 600,
    run: async (c) => {
      await c.kidTo(SP.microwave);
      c.kid({ pose: 'reach', expr: 'happy', facing: 1 });
      c.sound('tap');
      c.fx(R + ':micro', true);
      c.sound('hum');
      await c.wait(900);
      c.fx(R + ':popcorn', true);
      c.kid({ pose: 'jump', expr: 'surprised' });
      for (let i = 0; i < 5; i++) {
        c.sound('pop');
        await c.wait(220);
      }
      void c.say('kid', l('popcorn'), { wait: false, ms: 1200 });
      await c.wait(400);
      c.unfx(R + ':micro');
      c.unfx(R + ':popcorn');
      c.sound('ding');
      pupBark();
      await grab(c, 'popcorn', 'Popcorn for everyone!');
    },
  },

  // ------------------------------------------------------------------ oven
  {
    id: 'CAKE_BAKED',
    room: R,
    target: 'oven',
    action: 'Wearing the chef hat? Bake a cake – it appears on the table with candles',
    category: 'easter',
    when: (s) => s.outfit === 'chef',
    needsKid: true,
    uses: ['kid'],
    priority: 3,
    cooldownMs: 1500,
    run: async (c) => {
      await c.kidTo(SP.oven);
      c.kid({ pose: 'crouch', expr: 'focused', facing: -1 });
      c.fx(R + ':ovenOn', true);
      c.sound('hum');
      await c.say('kid', 'Chef is baking! Wait for it...', { ms: 1600 });
      await c.wait(1200);
      c.sound('ding');
      c.unfx(R + ':ovenOn');
      getGame().setFx(R + ':cake', true);
      c.egg('chef-cake', { x: 1255, y: 520 });
      await c.kidTo(SP.table);
      c.kid({ pose: 'cheer', expr: 'laugh' });
      c.sound('birthday');
      await c.say('kid', l('cake'), { ms: 1800 });
      pupBark();
      c.kid({ holding: 'cupcake', pose: 'stand' });
      await c.say('kid', 'A slice for Papa and Mummy!', { ms: 1400 });
      startHoldTimeout(R);
    },
  },
  {
    id: 'OVEN_NEEDS_CHEF',
    room: R,
    target: 'oven',
    action: 'Oven: the kid needs his chef hat first (hint to the costume chest)',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.oven);
      c.kid({ pose: 'peek', expr: 'puzzled', facing: -1 });
      c.sound('hmm');
      await c.say('kid', l('ovenNoHat'), { ms: 1900 });
    },
  },

  // ------------------------------------------------------------------ table
  {
    id: 'SNACK_AT_TABLE',
    room: R,
    target: 'table',
    action: 'Eat the snack at the table – Biscuit begs for crumbs',
    category: 'combo',
    when: (s) => isFood(kidHolding(s)),
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      const food = c.s.kid.holding;
      await c.kidTo(SP.table);
      c.kid({ pose: 'drink', expr: 'happy' });
      c.sound(food === 'juice' ? 'gulp' : 'crunch');
      await c.wait(700);
      c.sound(food === 'juice' ? 'gulp' : 'crunch');
      c.kid({ holding: null, pose: 'stand', expr: 'laugh' });
      pupBark();
      await c.say('kid', l('eat'), { ms: 1200 });
    },
  },
  {
    id: 'TABLE_BAND',
    room: R,
    target: 'table',
    action: 'Drum on the table 6 times quickly → kitchen band with Biscuit (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('table', 7000) >= 6,
    needsKid: true,
    uses: ['kid'],
    priority: 4,
    run: async (c) => {
      c.resetTaps('table');
      await c.kidTo(SP.table);
      c.egg('table-band', { x: 1255, y: 520 });
      c.kid({ pose: 'dance', expr: 'laugh' });
      await c.say('kid', l('band'), { ms: 1300, wait: false });
      for (let i = 0; i < 3; i++) {
        c.sound('drum');
        if (i === 1) c.sound('whine');
        await c.wait(650);
      }
      c.sound('tada');
      c.kid({ pose: 'cheer' });
      pupBark();
      await c.wait(700);
    },
  },
  {
    id: 'TABLE_DRUMMING',
    room: R,
    target: 'table',
    action: 'Drum on the kitchen table',
    category: 'object',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.table);
      c.kid({ pose: 'push', expr: 'laugh', facing: 1 });
      c.sound('drum');
      await c.say('kid', l('drums'), { ms: 1200 });
      c.kid({ pose: 'stand' });
    },
  },

  // ------------------------------------------------------------------ the kid himself
  {
    id: 'KID_LAUGHS',
    room: R,
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
      await c.say('kid', 'Ha ha ha ha!');
    },
  },
  {
    id: 'KID_HUNGRY',
    room: R,
    target: 'kid',
    action: 'The kid rubs his tummy – snack time!',
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
