// PAPA'S OFFICE – interaction catalogue. Every entry is a configuration object handled by the
// central InteractionManager (locks, cooldowns, priorities, cleanup).
import type { Ctx, InteractionDefinition } from '../../engine/InteractionManager';
import { InteractionManager } from '../../engine/InteractionManager';
import { initialPapaTap, PAPA_TAP_WINDOW_MS, resetPapaTap, tapPapa, type PapaTapState } from '../../engine/papaTapMachine';
import { PAPA_SPOTS as SP } from '../../data/spots';
import { papaToyDefs } from '../toys';
import { aside, commonDefs, isToy, kidDefs, kidHolding, kidPresent, line, parentHead, say, startHoldTimeout } from '../shared';

const R = 'papa-room' as const;

// ---- Papa's three-tap finite-state machine (timestamp driven, see engine/papaTapMachine.ts)
let tapState: PapaTapState = { ...initialPapaTap };
export const getPapaTapState = () => tapState;
export const resetPapaTapState = () => (tapState = resetPapaTap());

async function holdLook(c: Ctx, since: number) {
  // keep the reaction on screen for the rest of the window (but never longer than 3.4s)
  const left = PAPA_TAP_WINDOW_MS - (Date.now() - since);
  await c.wait(Math.max(600, Math.min(3400, left)));
}

async function bringToyToPapa(c: Ctx) {
  const toy = c.s.kid.holding;
  await c.kidTo(SP.nearPapa);
  c.kid({ pose: 'hold', expr: 'happy' });
  c.papa({ activity: 'turned', expr: 'surprised' });
  await c.wait(400);
  c.papa({ activity: 'play', expr: 'laugh' });
  c.sound(toy === 'robot' ? 'robot' : toy === 'duck' ? 'quack' : 'squeak');
  await say(c, 'papa', 'bringToy');
  c.kid({ pose: 'jump', expr: 'laugh' });
  c.sound('giggle');
  await c.wait(1300);
  c.papa({ activity: 'turned', expr: 'happy' });
  await c.say('papa', 'Okay, back to work. Love you!');
  c.kid({ holding: null });
}

async function toyOnKeyboard(c: Ctx) {
  await c.kidTo(SP.keyboard);
  c.kid({ pose: 'reach', expr: 'funny' });
  await c.wait(350);
  c.kid({ holding: null });
  c.fx(R + ':robotKeyboard', true);
  c.sound('robot');
  await c.kidTo(SP.behindPapa);
  c.kid({ pose: 'crouch', expr: 'laugh' });
  c.sound('giggle');
  c.papa({ activity: 'thinking', expr: 'surprised' });
  await c.wait(700);
  await say(c, 'papa', 'toyKeyboard');
  c.papa({ activity: 'lookBack', expr: 'laugh' });
  c.kid({ pose: 'cheer' });
  await c.wait(1300);
}

export const papaRoomInteractions: InteractionDefinition[] = [
  ...commonDefs(R),

  // ------------------------------------------------------------------ Papa
  {
    id: 'TOY_BROUGHT_TO_PAPA',
    room: R,
    target: 'papa',
    action: 'Bring a toy to Papa – he stops working and plays briefly',
    category: 'combo',
    when: (s) => isToy(kidHolding(s)),
    uses: ['papa', 'kid'],
    priority: 3,
    run: bringToyToPapa,
  },
  {
    id: 'PAPA_TAPPED',
    room: R,
    target: 'papa',
    action: "Papa's three-tap dialogue (each tap within 5 s escalates)",
    category: 'character',
    needsKid: true,
    uses: ['papa', 'kid'],
    priority: 2,
    run: async (c) => {
      const now = Date.now();
      tapState = tapPapa(tapState, now);
      const stage = tapState.stage;
      c.emit('PAPA_TAP_STAGE_' + stage);
      if (stage === 1) {
        if (Math.abs(c.s.kid.x - SP.behindPapa.x) > 140) void c.kidTo(SP.behindPapa);
        c.papa({ activity: 'lookBack', expr: 'annoyed' });
        await say(c, 'papa', 'stage1', { wait: false });
        await holdLook(c, now);
        return;
      }
      if (stage === 2) {
        c.papa({ activity: 'lookBack', expr: 'irritated' });
        c.kid({ pose: 'wave', expr: 'happy' });
        await say(c, 'papa', 'stage2', { wait: false });
        await holdLook(c, now);
        return;
      }
      // stage 3 – Papa turns around fully, then the kid answers
      tapState = resetPapaTap();
      c.papa({ activity: 'turned', expr: 'neutral' });
      c.sound('chairSpin');
      await say(c, 'papa', 'stage3');
      await c.kidTo(SP.nearPapa);
      const wantsHug = Math.random() < 0.6;
      await say(c, 'kid', wantsHug ? 'wantHug' : 'wantPlay');
      if (wantsHug) {
        c.kid({ pose: 'hug', expr: 'love' });
        c.papa({ activity: 'hug', expr: 'love' });
        c.fx(R + ':papaHearts', true);
        c.sound('aww');
        await say(c, 'papa', 'hug');
        await c.wait(900);
      } else {
        c.papa({ activity: 'play', expr: 'laugh' });
        c.kid({ pose: 'jump', expr: 'laugh' });
        c.sound('giggle');
        await say(c, 'papa', 'play');
        await c.wait(800);
      }
    },
  },

  // ------------------------------------------------------------------ laptop / keyboard / mouse
  {
    id: 'TOY_ON_LAPTOP',
    room: R,
    target: 'laptop',
    action: 'Put the carried toy on Papa’s keyboard (Toy + Laptop)',
    category: 'combo',
    when: (s) => isToy(kidHolding(s)),
    uses: ['papa', 'kid'],
    priority: 3,
    run: toyOnKeyboard,
  },
  {
    id: 'PAPA_MEETING_INTERRUPTED',
    room: R,
    target: 'laptop',
    action: 'Pop into Papa’s video meeting',
    category: 'prank',
    when: (s) => s.characters.papa.activity === 'meeting',
    needsKid: true,
    uses: ['papa', 'kid'],
    priority: 3,
    run: async (c) => {
      await c.kidTo(SP.laptop);
      c.kid({ pose: 'wave', expr: 'happy' });
      c.fx(R + ':laptop', 'kid');
      c.papa({ activity: 'lookBack', expr: 'surprised' });
      await c.wait(500);
      c.papa({ activity: 'turned', expr: 'laugh' });
      c.sound('giggle');
      await say(c, 'papa', 'meetingInterrupt');
      await c.wait(900);
    },
  },
  {
    id: 'LAPTOP_DISTURBED',
    room: R,
    target: 'laptop',
    action: 'Kid bangs on the laptop – screen fills with stars, Papa complains',
    needsKid: true,
    uses: ['papa', 'kid'],
    priority: 2,
    cooldownMs: 600,
    run: async (c) => {
      await c.kidTo(SP.laptop);
      c.kid({ pose: 'reach', expr: 'funny' });
      c.sound('typing');
      c.fx(R + ':laptop', 'stars');
      c.papa({ activity: 'lookBack', expr: 'annoyed' });
      await c.wait(400);
      await say(c, 'papa', 'laptop');
      c.kid({ pose: 'stand', expr: 'laugh' });
      await c.wait(500);
    },
  },
  {
    id: 'TOY_ON_KEYBOARD',
    room: R,
    target: 'keyboard',
    action: 'Put a toy on Papa’s keyboard – he discovers it',
    category: 'prank',
    when: (s) => isToy(kidHolding(s)),
    uses: ['papa', 'kid'],
    priority: 3,
    run: toyOnKeyboard,
  },
  {
    id: 'KEYBOARD_MASHED',
    room: R,
    target: 'keyboard',
    action: 'Typing sound, gibberish on the monitor, Papa reacts',
    needsKid: true,
    uses: ['papa', 'kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.keyboard);
      c.kid({ pose: 'reach', expr: 'funny' });
      c.sound('typing');
      c.fx(R + ':keys', true);
      c.fx(R + ':monitor', c.pick('kbd', ['jjjjkkkk!!', 'bananaaaa', 'asdfghjkl', 'poop :)']));
      await c.wait(500);
      c.sound('typing');
      c.papa({ activity: 'lookBack', expr: 'surprised' });
      await c.wait(400);
      c.papa({ expr: 'puzzled' });
      await say(c, 'papa', 'keyboard');
      c.kid({ pose: 'stand', expr: 'laugh' });
      c.sound('giggle');
      await c.wait(600);
    },
  },
  {
    id: 'MOUSE_HIDDEN',
    room: R,
    target: 'mouse',
    action: 'Hide Papa’s mouse – he searches for it',
    category: 'prank',
    needsKid: true,
    uses: ['papa', 'kid'],
    priority: 3,
    run: async (c) => {
      await c.kidTo(SP.mouse);
      c.kid({ pose: 'reach', expr: 'funny' });
      await c.wait(300);
      c.fx(R + ':mouseGone', true);
      c.kid({ pose: 'stand', prop: 'mouse' });
      await c.kidTo(SP.default);
      c.kid({ facing: -1, expr: 'funny' });
      c.papa({ activity: 'search', expr: 'puzzled' });
      await say(c, 'papa', 'mouseLost');
      c.papa({ activity: 'lookAround' });
      c.sound('giggle');
      await c.wait(1600);
      await c.kidTo(SP.mouse);
      c.kid({ pose: 'reach', prop: null });
      c.unfx(R + ':mouseGone');
      c.papa({ activity: 'lookBack', expr: 'happy' });
      await say(c, 'papa', 'mouseFound');
      c.kid({ pose: 'stand', expr: 'laugh' });
      await c.wait(500);
    },
  },

  // ------------------------------------------------------------------ desk things
  {
    id: 'DESK_LAMP_TOGGLED',
    room: R,
    target: 'lamp',
    action: 'Toggle the desk lamp',
    run: async (c) => {
      c.papaRoom({ lampOn: !c.s.papaRoom.lampOn });
      c.sound('switch');
    },
  },
  {
    id: 'PHONE_FUNNY_NOTIFICATION',
    room: R,
    target: 'phone',
    action: 'Tap the phone 4 times → silly notification (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('papa-phone', 9000) >= 4,
    uses: ['papa'],
    priority: 3,
    run: async (c) => {
      c.resetTaps('papa-phone');
      c.egg('funny-notification', { x: 1130, y: 420 });
      c.fx(R + ':phoneFunny', true);
      c.sound('notify');
      c.papa({ activity: 'phone', expr: 'laugh' });
      await say(c, 'papa', 'phoneFunny');
      c.sound('laugh');
      await c.wait(1200);
    },
  },
  {
    id: 'PHONE_RINGS',
    room: R,
    target: 'phone',
    action: 'Ring Papa’s phone – he answers, nobody is there',
    category: 'prank',
    uses: ['papa'],
    priority: 3,
    cooldownMs: 800,
    run: async (c) => {
      c.fx(R + ':phoneRing', true);
      c.sound('phoneRing');
      c.papa({ activity: 'lookBack', expr: 'surprised' });
      await c.wait(1400);
      c.unfx(R + ':phoneRing');
      c.papa({ activity: 'phone', expr: 'neutral' });
      await say(c, 'papa', 'phonePick');
      c.papa({ expr: 'puzzled' });
      await say(c, 'papa', 'phone');
      if (kidPresent(c.s)) {
        c.sound('giggle');
        void c.say('kid', line(c, 'kid', 'hee'), { wait: false });
      }
      await c.wait(600);
    },
  },
  {
    id: 'CHAIR_SPUN',
    room: R,
    target: 'chair',
    action: 'Spin Papa’s chair (Chair + Kid) – he gets dizzy',
    category: 'prank',
    needsKid: true,
    uses: ['papa', 'kid'],
    priority: 3,
    cooldownMs: 1000,
    run: async (c) => {
      await c.kidTo(SP.chair);
      c.kid({ pose: 'push', expr: 'funny' });
      c.sound('chairSpin');
      c.fx('papa:spin', true);
      c.papa({ expr: 'surprised' });
      await c.wait(1300);
      c.unfx('papa:spin');
      c.papa({ activity: 'dizzy', expr: 'dizzy' });
      c.kid({ pose: 'stand', expr: 'laugh' });
      c.sound('giggle');
      await say(c, 'papa', 'chair');
      await c.wait(700);
    },
  },

  // ------------------------------------------------------------------ guitar
  {
    id: 'GUITAR_PLAYED',
    room: R,
    target: 'guitar',
    action: 'Kid plays loud guitar (Papa reacts); 3rd tap Papa plays; 5 quick taps = funny tune',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'papa'],
    priority: 3,
    run: async (c) => {
      const n = c.taps('guitar', 9000);
      if (Math.abs(c.s.kid.x - SP.guitar.x) > 10) await c.kidTo(SP.guitar);
      if (n >= 5) {
        c.resetTaps('guitar');
        c.egg('funny-tune', { x: 760, y: 300 });
        c.kid({ prop: 'guitar', pose: 'strum', expr: 'funny' });
        c.guitar('funny');
        c.papa({ activity: 'lookBack', expr: 'laugh' });
        await c.wait(900);
        c.kid({ prop: null, pose: 'dance', expr: 'laugh' });
        c.sound('laugh');
        await c.say('papa', 'Ha ha! What was THAT song?');
        await c.wait(600);
        return;
      }
      if (n === 3) {
        c.kid({ prop: null, pose: 'stand', expr: 'happy' });
        c.papa({ activity: 'guitar', expr: 'happy' });
        await say(c, 'papa', 'guitarPapa', { wait: false });
        await c.wait(600);
        c.guitar('papa');
        c.kid({ pose: 'dance', expr: 'laugh' });
        await c.wait(2600);
        c.kid({ pose: 'cheer' });
        c.sound('giggle');
        await c.wait(700);
        return;
      }
      c.kid({ prop: 'guitar', pose: 'strum', expr: 'laugh' });
      c.guitar(n % 2 ? 'kid' : 'kid2');
      await c.wait(700);
      c.papa({ activity: 'lookBack', expr: 'surprised' });
      await c.wait(300);
      c.papa({ expr: 'annoyed' });
      await say(c, 'papa', 'guitarLoud');
      c.kid({ expr: 'happy' });
      await c.wait(500);
    },
  },

  // ------------------------------------------------------------------ gym corner
  {
    id: 'DUMBBELL_LIFTED',
    room: R,
    target: 'dumbbell',
    action: 'Kid tries to lift a dumbbell – and manages it (Dumbbell + Kid)',
    category: 'combo',
    needsKid: true,
    uses: ['kid', 'papa'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.dumbbell);
      c.kid({ pose: 'lift', prop: 'dumbbell', expr: 'strain' });
      c.sound('grunt');
      await say(c, 'kid', 'strong', { wait: false });
      await c.wait(1100);
      c.kid({ pose: 'reach', expr: 'happy' });
      c.sound('boing');
      await c.say('kid', "I'm super strong!");
      c.papa({ activity: 'lookBack', expr: 'happy' });
      await say(c, 'papa', 'dumbbell');
      c.kid({ pose: 'lift', expr: 'happy' });
      await c.wait(400);
      c.sound('thud');
    },
  },
  {
    id: 'BARBELL_STRUGGLE',
    room: R,
    target: 'barbell',
    action: 'Kid struggles with the heavy barbell and plops down',
    needsKid: true,
    uses: ['kid', 'papa'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.barbell);
      c.kid({ pose: 'lift', prop: 'barbell', expr: 'strain' });
      c.sound('grunt');
      await c.wait(900);
      c.sound('grunt');
      await say(c, 'kid', 'stuck');
      c.kid({ pose: 'sit', prop: null, expr: 'surprised' });
      c.sound('thud');
      c.papa({ activity: 'lookBack', expr: 'laugh' });
      await say(c, 'papa', 'barbell');
      c.kid({ expr: 'laugh' });
      c.sound('giggle');
      await c.wait(700);
    },
  },
  {
    id: 'CURL_ROD_CURLED',
    room: R,
    target: 'curl',
    action: 'Kid does three bicep curls with the EZ bar',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.curl);
      c.kid({ pose: 'lift', prop: 'curl', expr: 'focused' });
      await c.wait(350);
      for (let i = 1; i <= 3; i++) {
        c.kid({ pose: 'curl', expr: 'strain' });
        c.sound('grunt');
        void c.say('kid', ['One!', 'Two!', 'Three!'][i - 1], { wait: false, ms: 700 });
        await c.wait(550);
        c.kid({ pose: 'lift', expr: 'happy' });
        await c.wait(400);
      }
      c.kid({ prop: null, pose: 'curl', expr: 'happy' });
      await say(c, 'kid', 'muscles');
      aside('papa', 'curl');
      await c.wait(400);
    },
  },

  // ------------------------------------------------------------------ sofa (3 rotating variants)
  {
    id: 'SOFA_JUMPED_ON',
    room: R,
    target: 'sofa',
    action: 'Kid bounces on the sofa',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo({ x: SP.sofa.x, y: 772 });
      c.kid({ y: SP.sofa.y, moveMs: 250, pose: 'jump', expr: 'laugh' });
      await c.wait(260);
      c.kid({ moveMs: 0 });
      for (let i = 0; i < 3; i++) {
        c.fx(R + ':sofaSquish', true);
        c.sound('boing');
        if (i === 0) void say(c, 'kid', 'wheee', { wait: false });
        await c.wait(480);
        c.unfx(R + ':sofaSquish');
        await c.wait(60);
      }
    },
  },
  {
    id: 'KID_PRETENDS_TO_SLEEP',
    room: R,
    target: 'sofa',
    action: 'Kid pretends to sleep on the sofa – Papa checks on him',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'papa'],
    priority: 2,
    run: async (c) => {
      await c.kidTo({ x: SP.sofaLie.x, y: 772 });
      c.kid({ x: SP.sofaLie.x, y: SP.sofaLie.y, moveMs: 250, pose: 'lie', expr: 'asleep' });
      await c.wait(300);
      c.sound('snore');
      await say(c, 'kid', 'zzz');
      c.papa({ activity: 'lookBack', expr: 'love' });
      await say(c, 'papa', 'sleepCheck');
      c.kid({ expr: 'funny' });
      c.sound('giggle');
      await say(c, 'kid', 'gotcha');
      c.papa({ activity: 'turned', expr: 'laugh' });
      await say(c, 'papa', 'sleepCaught');
    },
  },
  {
    id: 'HIDE_BEHIND_SOFA',
    room: R,
    target: 'sofa',
    action: 'Hide behind the sofa – “Where did my little monkey go?”',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'papa'],
    priority: 2,
    run: async (c) => {
      await c.kidTo({ x: 400, y: 772 });
      c.kid({ layer: 'back', x: SP.behindSofa.x, y: SP.behindSofa.y, pose: 'crouch', expr: 'funny', moveMs: 0 });
      await say(c, 'kid', 'hidden', { priority: 1 });
      c.papa({ activity: 'lookAround', expr: 'puzzled' });
      await say(c, 'papa', 'hideLook');
      await c.wait(900);
      c.kid({ pose: 'peek', expr: 'laugh' });
      c.sound('giggle');
      await say(c, 'kid', 'boo');
      c.papa({ activity: 'turned', expr: 'happy' });
      await say(c, 'papa', 'found');
      // climb back out from behind the sofa
      c.kid({ layer: 'front', x: 395, y: 772, pose: 'jump', moveMs: 0 });
      c.sound('boing');
      await c.wait(350);
    },
  },

  // ------------------------------------------------------------------ walls & shelves
  {
    id: 'FAMILY_PHOTO_SPECIAL',
    room: R,
    target: 'photo',
    action: 'Tap the family photo 4 times → special message (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('papa-photo', 8000) >= 4,
    uses: ['papa'],
    priority: 3,
    run: async (c) => {
      c.resetTaps('papa-photo');
      c.egg('family-photo', { x: 326, y: 266 });
      c.fx(R + ':photoZoom', true);
      c.fx(R + ':papaHearts', true);
      c.papa({ activity: 'turned', expr: 'love' });
      await say(c, 'papa', 'photoSpecial');
      await c.wait(800);
    },
  },
  {
    id: 'FAMILY_PHOTO_VIEWED',
    room: R,
    target: 'photo',
    action: 'Photo pops forward, Papa remembers a family moment',
    uses: ['papa'],
    priority: 2,
    run: async (c) => {
      c.fx(R + ':photoZoom', true);
      c.sound('aww');
      c.papa({ activity: 'lookBack', expr: 'love' });
      await say(c, 'papa', 'photo');
      await c.wait(400);
    },
  },
  {
    id: 'BOOKSHELF_SECRET',
    room: R,
    target: 'bookshelf',
    action: 'Tap the bookshelf 5 times → Papa’s old toy dinosaur appears (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('papa-books', 9000) >= 5,
    uses: ['papa'],
    priority: 3,
    run: async (c) => {
      c.resetTaps('papa-books');
      c.fx(R + ':booksWiggle', true);
      c.sound('thud');
      await c.wait(400);
      c.fx(R + ':dino', true);
      c.egg('hidden-dino', { x: 372, y: 430 });
      if (kidPresent(c.s)) await say(c, 'kid', 'dino');
      c.papa({ activity: 'turned', expr: 'surprised' });
      await say(c, 'papa', 'bookshelfSecret');
      c.papa({ expr: 'happy' });
      await c.wait(2500);
    },
  },
  {
    id: 'BOOK_FELL',
    room: R,
    target: 'bookshelf',
    action: 'Books wobble and one falls safely onto the rug',
    cooldownMs: 600,
    run: async (c) => {
      c.fx(R + ':booksWiggle', true);
      c.sound('pageFlip');
      await c.wait(350);
      c.fx(R + ':bookOut', true);
      await c.throwItem({ kind: 'book', from: { x: 337, y: 360 }, to: { x: 420, y: 760 }, dur: 650, arc: 30, spin: true });
      c.sound('thud');
      if (kidPresent(c.s)) void say(c, 'kid', 'oops', { wait: false });
      aside('papa', 'bookshelf');
      c.fx(R + ':bookOnFloor', true);
      await c.wait(1200);
      c.unfx(R + ':bookOut');
    },
  },
  {
    id: 'PAINTING_TILTED',
    room: R,
    target: 'painting',
    action: 'Painting tilts crooked / straightens',
    run: async (c) => {
      const t = !c.s.papaRoom.paintingTilted;
      c.papaRoom({ paintingTilted: t });
      c.sound('creak');
      if (t) {
        await c.wait(700);
        aside('papa', 'painting');
      }
    },
  },
  {
    id: 'DOOR_KNOCKED',
    room: R,
    target: 'hanger',
    action: 'Knock on the door and hide – Papa looks at the door',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'papa'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.doorKnock);
      c.kid({ pose: 'knock', expr: 'funny', facing: -1 });
      c.fx(R + ':knock', true);
      c.sound('knock');
      await c.wait(700);
      await c.kidTo(SP.hideDoor, { speed: 0.9 });
      c.kid({ pose: 'crouch', expr: 'laugh' });
      c.papa({ activity: 'lookDoor', expr: 'puzzled' });
      await say(c, 'papa', 'knock');
      c.sound('giggle');
      c.papa({ activity: 'lookBack', expr: 'happy' });
      await c.wait(900);
    },
  },

  // ------------------------------------------------------------------ toys
  {
    id: 'ROBOT_PICKED_UP',
    room: R,
    target: 'robot',
    action: 'Pick up the toy robot (then tap Papa or his keyboard)',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      if (c.s.kid.holding === 'robot') return;
      await c.kidTo(SP.robot);
      c.kid({ pose: 'crouch', expr: 'happy' });
      await c.wait(300);
      c.kid({ holding: 'robot', pose: 'stand' });
      c.sound('robot');
      await say(c, 'kid', 'robot');
      startHoldTimeout(R);
    },
  },

  ...papaToyDefs(),

  ...kidDefs(R, null),
];

// ------------------------------------------------------------------ idle behaviour (low priority)
export const papaIdle: { activity: Parameters<Ctx['papa']>[0]['activity']; ms: number; sound?: 'gulp' | 'chairSpin'; weight: number; line?: string }[] = [
  { activity: 'thinking', ms: 2600, weight: 3 },
  { activity: 'stretch', ms: 2200, weight: 2, line: 'idleStretch' },
  { activity: 'drink', ms: 2200, sound: 'gulp', weight: 2 },
  { activity: 'phone', ms: 2800, weight: 2 },
  { activity: 'lookClock', ms: 1800, weight: 1, line: 'idleClock' },
  { activity: 'adjust', ms: 1400, sound: 'chairSpin', weight: 1 },
  { activity: 'meeting', ms: 14000, weight: 2 },
];

// keep a reference so the default tap-state reset is used in tests
export const _papaHead = parentHead(R);
