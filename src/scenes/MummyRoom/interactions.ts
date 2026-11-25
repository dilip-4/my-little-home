// MUMMY'S BEDROOM & WORKSPACE – interaction catalogue. Mummy has her own personality:
// warmer and more playful than Papa, she plays back (catches balls, throws pillows back).
import type { Ctx, InteractionDefinition } from '../../engine/InteractionManager';
import type { Expression } from '../../state/gameTypes';
import { InteractionManager } from '../../engine/InteractionManager';
import { KID_BED_SPOT, MUMMY_SPOTS as SP } from '../../data/spots';
import { mummyToyDefs } from '../toys';
import { pupInteractions } from '../pup';
import { snackToMummy } from '../snacks';
import { mummyExtraDefs } from '../extras';
import { aside, commonDefs, isToy, kidDefs, kidHolding, kidPresent, parentHead, say, startHoldTimeout } from '../shared';

const R = 'mummy-room' as const;
const kidAsleep = (s: Ctx['s']) => s.kid.room === R && !s.kid.awake;

/** The full wake-up sequence (bed, alarm clock or tapping the sleeping kid). */
async function wakeKid(c: Ctx) {
  c.kid({ pose: 'sleep', expr: 'sleepy' });
  await c.wait(400);
  c.kid({ pose: 'sitUp', expr: 'yawn', layer: 'back', x: KID_BED_SPOT.x - 120, y: 560 });
  c.sound('yawn');
  await say(c, 'kid', 'yawn');
  c.kid({ expr: 'sleepy', pose: 'sit' });
  await c.wait(500);
  c.kid({ expr: 'happy' });
  await say(c, 'kid', 'wake');
  c.kid({ awake: true, layer: 'front', pose: 'jump', x: SP.bedSide.x, y: 772, moveMs: 350, expr: 'laugh' });
  c.sound('boing');
  await c.wait(380);
  c.kid({ pose: 'cheer', moveMs: 0 });
  c.mummy({ activity: 'lookKid', expr: 'happy' });
  await say(c, 'mummy', 'wakeKid');
  c.kid({ pose: 'stand' });
}

async function hopIntoBed(c: Ctx) {
  await c.kidTo(SP.bedSide);
  c.kid({ pose: 'jump' });
  c.sound('boing');
  c.kid({ layer: 'back', x: KID_BED_SPOT.x, y: KID_BED_SPOT.y, pose: 'lie', moveMs: 0 });
  await c.wait(250);
}

async function hopOutOfBed(c: Ctx) {
  c.kid({ layer: 'front', pose: 'jump', x: SP.bedSide.x, y: 772, moveMs: 350 });
  c.sound('boing');
  await c.wait(380);
  c.kid({ pose: 'stand', moveMs: 0 });
}

export const mummyRoomInteractions: InteractionDefinition[] = [
  snackToMummy,
  ...commonDefs(R),

  // ------------------------------------------------------------------ Mummy
  {
    id: 'MUMMY_WOKEN_UP',
    room: R,
    target: 'mummy',
    action: 'Wake Mummy up while she is resting her eyes',
    when: (s) => s.characters.mummy.activity === 'rest',
    uses: ['mummy'],
    priority: 3,
    run: async (c) => {
      c.mummy({ activity: 'turned', expr: 'surprised' });
      c.sound('pop');
      await say(c, 'mummy', 'wake');
      c.mummy({ expr: 'laugh' });
      await c.wait(700);
    },
  },
  {
    id: 'MUMMY_MEETING_INTERRUPTED',
    room: R,
    target: 'mummy',
    action: 'Interrupt Mummy’s video meeting',
    category: 'prank',
    when: (s) => s.characters.mummy.activity === 'meeting',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 3,
    run: meetingInterrupt,
  },
  {
    id: 'TEDDY_GIVEN_TO_MUMMY',
    room: R,
    target: 'mummy',
    action: 'Give Mummy the teddy bear – she smiles and cuddles it (Teddy + Mummy)',
    category: 'combo',
    when: (s) => kidHolding(s) === 'teddy',
    uses: ['mummy', 'kid'],
    priority: 3,
    run: async (c) => {
      await c.kidTo(SP.nearMummy);
      c.kid({ pose: 'hold', expr: 'happy' });
      await c.wait(300);
      c.kid({ holding: null, pose: 'cheer' });
      c.mummy({ activity: 'holdTeddy', expr: 'love' });
      c.fx(R + ':hearts', true);
      c.sound('squeak');
      await say(c, 'mummy', 'teddyGift');
      await c.wait(1600);
      c.sound('aww');
    },
  },
  {
    id: 'TOY_BROUGHT_TO_MUMMY',
    room: R,
    target: 'mummy',
    action: 'Bring Mummy a toy – quick game together',
    category: 'combo',
    when: (s) => isToy(kidHolding(s)),
    uses: ['mummy', 'kid'],
    priority: 3,
    run: async (c) => {
      const toy = c.s.kid.holding;
      await c.kidTo(SP.nearMummy);
      c.kid({ pose: 'hold', expr: 'happy' });
      c.mummy({ activity: 'turned', expr: 'happy' });
      await c.wait(300);
      c.mummy({ activity: 'play', expr: 'laugh' });
      c.sound(toy === 'duck' ? 'quack' : 'robot');
      await say(c, 'mummy', 'bringToy');
      c.kid({ pose: 'jump', expr: 'laugh' });
      c.sound('giggle');
      await c.wait(1200);
      c.kid({ holding: null });
    },
  },
  {
    id: 'MUMMY_TALK',
    room: R,
    target: 'mummy',
    action: 'Talk to Mummy',
    category: 'character',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.nearMummy);
      c.kid({ pose: 'wave', expr: 'happy' });
      c.mummy({ activity: 'lookKid', expr: 'happy' });
      await say(c, 'mummy', 'talk');
      c.kid({ pose: 'stand', expr: 'laugh' });
      await c.wait(300);
    },
  },
  {
    id: 'ASK_MUMMY_TO_PLAY',
    room: R,
    target: 'mummy',
    action: 'Ask Mummy to play',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.nearMummy);
      c.kid({ pose: 'cheer', expr: 'happy' });
      await say(c, 'kid', 'wantPlay');
      c.mummy({ activity: 'turned', expr: 'puzzled' });
      await say(c, 'mummy', 'askPlay');
      c.mummy({ expr: 'happy' });
      c.kid({ pose: 'stand' });
      await c.wait(400);
    },
  },
  {
    id: 'MUMMY_HUGGED',
    room: R,
    target: 'mummy',
    action: 'Hug Mummy',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.nearMummy);
      c.kid({ pose: 'hug', expr: 'love' });
      c.mummy({ activity: 'hug', expr: 'love' });
      c.fx(R + ':hearts', true);
      c.sound('kiss');
      await say(c, 'mummy', 'hug');
      await c.wait(900);
    },
  },
  {
    id: 'SURPRISE_HUG_MUMMY',
    room: R,
    target: 'mummy',
    action: 'Sneak up and surprise Mummy with a hug',
    category: 'prank',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.behindMummy, { speed: 0.35 });
      c.kid({ pose: 'hug', expr: 'laugh' });
      c.mummy({ activity: 'lookBack', expr: 'surprised' });
      c.sound('pop');
      await c.wait(500);
      c.mummy({ activity: 'hug', expr: 'love' });
      c.fx(R + ':hearts', true);
      await say(c, 'mummy', 'surpriseHug');
      await c.wait(700);
    },
  },

  // ------------------------------------------------------------------ bed / pillow / blanket
  {
    id: 'KID_WAKES_UP',
    room: R,
    target: 'bed',
    action: 'Wake-up sequence: yawn, sit up, “Good morning!”',
    when: kidAsleep,
    uses: ['kid', 'mummy'],
    priority: 3,
    run: wakeKid,
  },
  {
    id: 'BED_JUMPED_ON',
    room: R,
    target: 'bed',
    action: 'Kid jumps on the bed – Mummy objects (with a smile)',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'mummy'],
    priority: 2,
    run: async (c) => {
      await c.kidTo({ x: 300, y: 772 });
      c.kid({ y: SP.bed.y, moveMs: 260, pose: 'jump', expr: 'laugh' });
      await c.wait(280);
      c.kid({ moveMs: 0 });
      for (let i = 0; i < 4; i++) {
        c.fx(R + ':bedBounce', true);
        c.sound('boing');
        if (i === 0) void say(c, 'kid', 'wheee', { wait: false });
        if (i === 1) {
          c.mummy({ activity: 'lookKid', expr: 'annoyed' });
          void say(c, 'mummy', 'bedJump', { wait: false });
        }
        await c.wait(480);
        c.unfx(R + ':bedBounce');
        await c.wait(40);
      }
      c.mummy({ expr: 'laugh' });
      await c.wait(600);
    },
  },
  {
    id: 'PILLOW_THROWN',
    room: R,
    target: 'pillow',
    action: 'Pillow fight! Kid throws, Mummy throws it back (Pillow + Parent)',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'mummy'],
    priority: 3,
    cooldownMs: 1200,
    run: async (c) => {
      await c.kidTo(SP.pillow);
      c.kid({ pose: 'reach', expr: 'funny' });
      await c.wait(250);
      c.fx(R + ':pillowAway', true);
      c.kid({ pose: 'throw', prop: 'pillow', facing: 1 });
      void say(c, 'kid', 'pillow', { wait: false });
      await c.wait(450);
      c.kid({ prop: null, pose: 'stand' });
      const k = c.s.kid;
      const head = parentHead(R);
      await c.throwItem({ kind: 'pillow', from: { x: k.x + 20, y: k.y - 220 }, to: head, dur: 750, arc: 120, spin: true });
      c.sound('pillow');
      c.mummy({ activity: 'turned', expr: 'surprised' });
      await say(c, 'mummy', 'pillow');
      c.mummy({ activity: 'throw', expr: 'laugh' });
      const kk = c.s.kid;
      await c.throwItem({ kind: 'pillow', from: head, to: { x: kk.x, y: kk.y - 170 }, dur: 750, arc: 100, spin: true });
      c.sound('pillow');
      c.kid({ pose: 'sit', expr: 'laugh' });
      c.sound('giggle');
      await c.wait(900);
      c.kid({ pose: 'stand' });
      await c.throwItem({ kind: 'pillow', from: { x: kk.x, y: kk.y - 120 }, to: { x: 182, y: 526 }, dur: 600, arc: 80 });
    },
  },
  {
    id: 'BLANKET_SNUGGLE',
    room: R,
    target: 'blanket',
    action: 'Tuck the sleeping kid in – he mumbles in his sleep',
    when: kidAsleep,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      c.sound('snore');
      c.fx(R + ':blanketWiggle', true);
      await say(c, 'kid', 'sleepTalk');
      await c.wait(600);
    },
  },
  {
    id: 'HIDE_UNDER_BLANKET',
    room: R,
    target: 'blanket',
    action: 'Hide under the blanket (Blanket + Kid) – “Why is the blanket giggling?”',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'mummy'],
    priority: 2,
    run: async (c) => {
      await hopIntoBed(c);
      c.fx(R + ':blanketHide', true);
      c.sound('giggle');
      await say(c, 'kid', 'hide', { priority: 1 });
      c.mummy({ activity: 'lookKid', expr: 'puzzled' });
      await say(c, 'mummy', 'blanket');
      c.unfx(R + ':blanketHide');
      c.kid({ pose: 'sitUp', expr: 'laugh', x: KID_BED_SPOT.x - 120, y: 560 });
      c.sound('pop');
      await say(c, 'kid', 'peek');
      c.mummy({ expr: 'laugh' });
      await say(c, 'mummy', 'blanketFound');
      await hopOutOfBed(c);
    },
  },
  {
    id: 'PRETEND_SLEEP_FOR_MUMMY',
    room: R,
    target: 'blanket',
    action: 'Pretend to sleep when Mummy looks',
    category: 'prank',
    needsKid: true,
    uses: ['kid', 'mummy'],
    priority: 2,
    run: async (c) => {
      await hopIntoBed(c);
      c.kid({ expr: 'asleep' });
      c.sound('snore');
      await say(c, 'kid', 'zzz');
      c.mummy({ activity: 'lookKid', expr: 'love' });
      await say(c, 'mummy', 'sleepCheck');
      c.kid({ expr: 'funny', pose: 'sitUp', x: KID_BED_SPOT.x - 120, y: 560 });
      c.sound('giggle');
      await say(c, 'kid', 'gotcha');
      c.mummy({ activity: 'turned', expr: 'laugh' });
      await say(c, 'mummy', 'sleepCaught');
      await hopOutOfBed(c);
    },
  },
  {
    id: 'TEDDY_SQUEAKS',
    room: R,
    target: 'teddy',
    action: 'Teddy squeaks and wiggles (kid is still asleep)',
    when: kidAsleep,
    run: async (c) => {
      c.fx(R + ':teddyWiggle', true);
      c.sound('squeak');
      await c.wait(700);
    },
  },
  {
    id: 'TEDDY_PICKED_UP',
    room: R,
    target: 'teddy',
    action: 'Kid picks up and hugs the teddy (then give it to Mummy or put it on her desk)',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.teddy);
      c.kid({ pose: 'reach', expr: 'happy' });
      c.fx(R + ':teddyWiggle', true);
      c.sound('squeak');
      await c.wait(350);
      c.kid({ holding: 'teddy', pose: 'stand', expr: 'love' });
      await say(c, 'kid', 'teddy');
      startHoldTimeout(R);
    },
  },

  // ------------------------------------------------------------------ Mummy's desk
  {
    id: 'TEDDY_ON_MUMMYS_DESK',
    room: R,
    target: 'laptop',
    action: 'Put the teddy on Mummy’s desk – she finds a new coworker',
    category: 'prank',
    when: (s) => kidHolding(s) === 'teddy',
    uses: ['kid', 'mummy'],
    priority: 3,
    run: async (c) => {
      await c.kidTo(SP.laptop);
      c.kid({ pose: 'reach' });
      await c.wait(300);
      c.kid({ holding: null, pose: 'stand', expr: 'funny' });
      c.fx(R + ':teddyDesk', true);
      c.sound('squeak');
      await c.kidTo(SP.default);
      c.kid({ pose: 'crouch', expr: 'laugh' });
      c.mummy({ activity: 'thinking', expr: 'surprised' });
      await c.wait(500);
      c.mummy({ expr: 'love' });
      await say(c, 'mummy', 'teddyDesk');
      await c.wait(1500);
    },
  },
  {
    id: 'TOY_ON_MUMMYS_LAPTOP',
    room: R,
    target: 'laptop',
    action: 'Put a toy on Mummy’s laptop (Toy + Laptop)',
    category: 'combo',
    when: (s) => isToy(kidHolding(s)),
    uses: ['kid', 'mummy'],
    priority: 3,
    run: async (c) => {
      await c.kidTo(SP.laptop);
      c.kid({ pose: 'reach' });
      await c.wait(300);
      c.kid({ holding: null, pose: 'stand', expr: 'funny' });
      c.fx(R + ':duckDesk', true);
      c.sound('quack');
      c.mummy({ activity: 'thinking', expr: 'surprised' });
      await c.wait(500);
      c.mummy({ expr: 'laugh' });
      await say(c, 'mummy', 'toyLaptop');
      await c.wait(1200);
    },
  },
  {
    id: 'MUMMY_MEETING_LAPTOP',
    room: R,
    target: 'laptop',
    action: 'Wave into Mummy’s video meeting',
    category: 'prank',
    when: (s) => s.characters.mummy.activity === 'meeting',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 3,
    run: meetingInterrupt,
  },
  {
    id: 'MUMMY_LAPTOP_DISTURBED',
    room: R,
    target: 'laptop',
    action: 'Kid types on Mummy’s laptop – she reacts',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.laptop);
      c.kid({ pose: 'reach', expr: 'funny' });
      c.sound('typing');
      await c.wait(400);
      c.mummy({ activity: 'lookBack', expr: 'annoyed' });
      await say(c, 'mummy', 'laptop');
      c.mummy({ expr: 'happy' });
      c.kid({ pose: 'stand', expr: 'laugh' });
      await c.wait(400);
    },
  },
  {
    id: 'MUG_INTERRUPTED',
    room: R,
    target: 'mug',
    action: 'Kid peeks into Mummy’s tea – she rescues it',
    needsKid: true,
    uses: ['mummy', 'kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.mug);
      c.kid({ pose: 'reach', expr: 'puzzled' });
      await say(c, 'kid', 'eww');
      c.mummy({ activity: 'lookBack', expr: 'surprised' });
      await say(c, 'mummy', 'mug');
      c.mummy({ activity: 'drink', expr: 'happy' });
      c.sound('gulp');
      c.kid({ pose: 'stand', expr: 'funny' });
      await c.wait(1400);
    },
  },
  {
    id: 'SIT_BESIDE_MUMMY',
    room: R,
    target: 'pouf',
    action: 'Sit beside Mummy and “work” together',
    needsKid: true,
    uses: ['kid', 'mummy'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.pouf);
      c.kid({ pose: 'sit', expr: 'happy', facing: -1 });
      c.sound('pillow');
      c.mummy({ activity: 'lookKid', expr: 'love' });
      await say(c, 'mummy', 'sitBeside');
      c.kid({ pose: 'sit', expr: 'focused' });
      c.sound('typing');
      await say(c, 'kid', 'coworker');
      await c.wait(900);
    },
  },

  // ------------------------------------------------------------------ dressing table / wardrobe
  {
    id: 'MIRROR_WINKS_BACK',
    room: R,
    target: 'mirror',
    action: 'Make 5 faces quickly → the reflection winks back (easter egg)',
    category: 'easter',
    when: (s) => kidPresent(s) && InteractionManager.tapCounter.hit('mirror', 9000) >= 5,
    uses: ['kid'],
    priority: 3,
    run: async (c) => {
      c.resetTaps('mirror');
      await c.kidTo(SP.mirror);
      c.kid({ pose: 'stand', expr: 'neutral', facing: 1 });
      c.fx(R + ':mirrorFace', 'funny');
      c.egg('mirror-wink', { x: 1017, y: 448 });
      await c.wait(900);
      c.kid({ expr: 'surprised' });
      await c.say('kid', 'Huh?! My reflection winked!');
      c.fx(R + ':mirrorFace', 'laugh');
      c.kid({ expr: 'laugh', pose: 'jump' });
      c.sound('giggle');
      await c.wait(900);
    },
  },
  {
    id: 'FUNNY_FACES_IN_MIRROR',
    room: R,
    target: 'mirror',
    action: 'Kid makes funny faces in the mirror',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.mirror);
      c.kid({ facing: 1 });
      const seqs: Expression[][] = [['funny', 'funny2', 'laugh'], ['funny2', 'surprised', 'funny'], ['strain', 'funny', 'laugh']];
      const faces = c.pick('mirror-seq', seqs);
      for (const f of faces) {
        c.kid({ expr: f, pose: f === 'laugh' ? 'cheer' : 'funny' });
        c.fx(R + ':mirrorFace', f);
        c.sound(f === 'laugh' ? 'giggle' : 'boing');
        await c.wait(800);
      }
      await say(c, 'kid', 'mirror');
    },
  },
  {
    id: 'HAIR_COMBED',
    room: R,
    target: 'brush',
    action: 'Kid combs his hair flat – the tuft springs back up',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.brush);
      c.kid({ prop: 'brush', pose: 'comb', expr: 'focused' });
      c.sound('brush');
      c.fx('kid:hairFlat', true);
      await c.wait(900);
      c.kid({ pose: 'stand', prop: null, expr: 'happy' });
      await say(c, 'kid', 'brush');
      c.unfx('kid:hairFlat');
      c.sound('boing');
      c.kid({ expr: 'surprised' });
      await c.wait(600);
      c.kid({ expr: 'laugh' });
      c.sound('giggle');
      await c.wait(500);
    },
  },
  {
    id: 'HANDBAG_SURPRISE',
    room: R,
    target: 'bag',
    action: 'Open Mummy’s handbag – a different surprise every time',
    needsKid: true,
    uses: ['kid', 'mummy'],
    priority: 2,
    run: async (c) => {
      const items = ['sunglasses', 'lollipop', 'keys', 'note'] as const;
      const n = InteractionManager.tapCounter.hit('bag-cycle', 1e9);
      const item = items[(n - 1) % items.length];
      await c.kidTo(SP.bag);
      c.kid({ pose: 'reach', expr: 'happy' });
      c.fx(R + ':bagOpen', true);
      c.sound('zip');
      await c.wait(300);
      c.fx(R + ':bagItem', item);
      c.sound('pop');
      await c.wait(700);
      c.unfx(R + ':bagItem');
      if (item === 'sunglasses') {
        c.kid({ holding: 'sunglasses', pose: 'cheer', expr: 'happy' });
        await say(c, 'kid', 'cool');
        c.mummy({ activity: 'lookBack', expr: 'laugh' });
        await say(c, 'mummy', 'sunglasses');
        c.kid({ holding: null });
      } else if (item === 'lollipop') {
        c.kid({ prop: 'lollipop', pose: 'reach', expr: 'laugh' });
        await say(c, 'kid', 'lolly');
        c.mummy({ activity: 'lookBack', expr: 'puzzled' });
        await say(c, 'mummy', 'lolly');
      } else if (item === 'keys') {
        c.kid({ prop: 'keys', pose: 'reach', expr: 'happy' });
        c.sound('jingle');
        await say(c, 'kid', 'keys');
        c.mummy({ activity: 'lookBack', expr: 'happy' });
        await say(c, 'mummy', 'keys');
      } else {
        c.fx(R + ':bagItem', 'note');
        await say(c, 'kid', 'note');
        c.mummy({ activity: 'lookBack', expr: 'love' });
        c.fx(R + ':hearts', true);
        await say(c, 'mummy', 'note');
      }
    },
  },
  {
    id: 'WARDROBE_OPENED',
    room: R,
    target: 'wardrobe',
    action: 'Open the wardrobe',
    when: (s) => !s.mummyRoom.wardrobeOpen,
    run: async (c) => {
      c.mummyRoom({ wardrobeOpen: true });
      c.sound('creak');
    },
  },
  {
    id: 'HIDE_IN_WARDROBE',
    room: R,
    target: 'wardrobe',
    action: 'Hide inside the open wardrobe (door stays ajar) – Mummy searches',
    category: 'prank',
    when: (s) => s.mummyRoom.wardrobeOpen,
    needsKid: true,
    uses: ['kid', 'mummy'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.wardrobe);
      c.kid({ layer: 'inside', x: SP.inWardrobe.x, y: SP.inWardrobe.y, pose: 'crouch', expr: 'funny', moveMs: 0 });
      c.mummyRoom({ wardrobeOpen: false });
      c.fx(R + ':wardrobeAjar', true);
      c.sound('creak');
      await say(c, 'kid', 'hidden', { priority: 1 });
      c.mummy({ activity: 'lookAround', expr: 'puzzled' });
      await say(c, 'mummy', 'wardrobeLook');
      c.mummyRoom({ wardrobeOpen: true });
      c.sound('creak');
      c.kid({ pose: 'cheer', expr: 'laugh' });
      await say(c, 'kid', 'boo');
      c.mummy({ activity: 'turned', expr: 'laugh' });
      await say(c, 'mummy', 'wardrobeFound');
      c.kid({ layer: 'front', x: SP.wardrobe.x, y: SP.wardrobe.y, pose: 'jump' });
      await c.wait(300);
      c.mummyRoom({ wardrobeOpen: false });
      c.sound('doorClose');
    },
  },

  // ------------------------------------------------------------------ bedside / shelves / basket
  {
    id: 'BEDSIDE_LAMP_TOGGLED',
    room: R,
    target: 'lamp',
    action: 'Toggle the bedside lamp',
    run: async (c) => {
      c.mummyRoom({ lampOn: !c.s.mummyRoom.lampOn });
      c.sound('switch');
    },
  },
  {
    id: 'ALARM_CLOCK_CHANGED',
    room: R,
    target: 'alarm',
    action: 'Alarm clock rings with a new sound each time (wakes a sleeping kid!)',
    uses: ['mummy', 'kid'],
    priority: 3,
    cooldownMs: 600,
    run: async (c) => {
      const n = (c.s.mummyRoom.alarmSound + 1) % 4;
      c.mummyRoom({ alarmSound: n });
      c.fx(R + ':alarmRing', true);
      c.sound((['alarm0', 'alarm1', 'alarm2', 'alarm3'] as const)[n]);
      await c.wait(1200);
      c.unfx(R + ':alarmRing');
      if (kidAsleep(c.s)) {
        await wakeKid(c);
        return;
      }
      c.mummy({ activity: 'lookKid', expr: 'puzzled' });
      await say(c, 'mummy', 'alarm');
    },
  },
  {
    id: 'TOY_BASKET_OPENED',
    room: R,
    target: 'basket',
    action: 'Toys pop out of the basket, kid grabs the rubber duck',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.basket);
      c.kid({ pose: 'crouch', expr: 'happy' });
      c.fx(R + ':basketOpen', true);
      c.sound('pop');
      await c.wait(250);
      c.sound('pop');
      await c.wait(500);
      c.kid({ holding: 'duck', pose: 'cheer', expr: 'laugh' });
      c.sound('quack');
      await say(c, 'kid', 'duck');
      c.unfx(R + ':basketOpen');
      startHoldTimeout(R);
    },
  },
  {
    id: 'SECRET_NOTE_FOUND',
    room: R,
    target: 'books',
    action: 'Tap the books 4 times → Mummy’s secret love note (easter egg)',
    category: 'easter',
    when: () => InteractionManager.tapCounter.hit('mummy-books', 9000) >= 4,
    uses: ['mummy'],
    priority: 3,
    run: async (c) => {
      c.resetTaps('mummy-books');
      c.fx(R + ':booksWiggle', true);
      c.fx(R + ':note', true);
      c.egg('secret-note', { x: 740, y: 200 });
      c.mummy({ activity: 'turned', expr: 'love' });
      c.fx(R + ':hearts', true);
      await say(c, 'mummy', 'booksSecret');
      await c.wait(1500);
    },
  },
  {
    id: 'STORYBOOK_OPENED',
    room: R,
    target: 'books',
    action: 'A storybook drops into the kid’s hands and opens',
    needsKid: true,
    uses: ['kid'],
    priority: 2,
    run: async (c) => {
      await c.kidTo(SP.shelf);
      c.kid({ pose: 'reach', expr: 'happy' });
      c.fx(R + ':booksWiggle', true);
      c.fx(R + ':bookOut', true);
      const k = c.s.kid;
      await c.throwItem({ kind: 'book', from: { x: 674, y: 274 }, to: { x: k.x, y: k.y - 100 }, dur: 550, arc: 40 });
      c.kid({ pose: 'hold', prop: 'book', expr: 'love' });
      c.sound('pageFlip');
      await c.wait(500);
      c.sound('pageFlip');
      aside('mummy', 'books');
      await c.wait(1800);
    },
  },
  {
    id: 'FAMILY_PHOTOS_VIEWED',
    room: R,
    target: 'photo',
    action: 'Photos pop forward, Mummy remembers',
    uses: ['mummy'],
    priority: 2,
    run: async (c) => {
      c.fx(R + ':photoZoom', true);
      c.sound('aww');
      c.mummy({ activity: 'lookKid', expr: 'love' });
      c.fx(R + ':hearts', true);
      await say(c, 'mummy', 'photo');
      await c.wait(400);
    },
  },
  {
    id: 'FLOWER_PAINTING',
    room: R,
    target: 'painting',
    action: 'Flower painting wiggles',
    run: async (c) => {
      c.sound('sparkle');
      if (kidPresent(c.s)) await say(c, 'kid', 'flower');
    },
  },

  ...mummyToyDefs(),
  ...mummyExtraDefs(),
  ...pupInteractions(R),

  ...kidDefs(R, wakeKid),
];

async function meetingInterrupt(c: Ctx) {
  await c.kidTo(SP.laptop);
  c.kid({ pose: 'wave', expr: 'happy', facing: 1 });
  c.fx(R + ':laptop', 'kidwave');
  c.sound('giggle');
  c.mummy({ activity: 'lookBack', expr: 'surprised' });
  await c.wait(600);
  c.mummy({ activity: 'turned', expr: 'laugh' });
  await say(c, 'mummy', 'meeting');
  await c.wait(900);
}
