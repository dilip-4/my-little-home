// HIDE-AND-SEEK – two real games:
//  1. "You hide!"  Papa or Mummy covers their eyes and counts to ten while the child picks a
//     hiding spot. Then they search (guessing wrong spots first). Tapping the kid while hidden makes
//     him giggle and gives him away. In the kitchen, Biscuit is the seeker and sniffs him out.
//  2. "Find Biscuit!"  The puppy hides somewhere with just his tail sticking out; the child searches.
import type { Ctx, InteractionDefinition } from '../engine/InteractionManager';
import { InteractionManager } from '../engine/InteractionManager';
import { DialogueManager } from '../engine/DialogueManager';
import { AudioManager } from '../engine/AudioManager';
import { pickVaried } from '../engine/random';
import { getGame } from '../state/gameStore';
import type { CharacterId, RoomId } from '../state/gameTypes';
import { KID_BED_SPOT, MUMMY_SPOTS, PUP_FLOOR_Y } from '../data/spots';
import { pupEnter } from './pup';

export interface HideSpot {
  id: string;
  room: RoomId;
  /** words the seeker uses: "Is he {place}?" */
  place: string;
  /** where the glowing marker sits */
  marker: { x: number; y: number };
  /** where Biscuit's tail pokes out when he hides here */
  tail: { x: number; y: number };
  enter: (c: Ctx) => Promise<void>;
  exit: (c: Ctx) => Promise<void>;
}

const COVER = 'hs:cover';

const crouchBehindCover = (id: string, x: number, pose: 'peek' | 'crouch' = 'peek', facing: 1 | -1 = 1): Pick<HideSpot, 'enter' | 'exit'> => ({
  enter: async (c) => {
    await c.kidTo({ x, y: 772 });
    c.kid({ pose, expr: 'funny', facing });
    c.fx(COVER, id);
  },
  exit: async (c) => {
    c.unfx(COVER);
    // step out in front of the cover, on the open side
    c.kid({ pose: 'jump', expr: 'laugh', x: x + facing * 90, moveMs: 250 });
    c.sound('boing');
    await c.wait(300);
    c.kid({ moveMs: 0 });
  },
});

export const HIDE_SPOTS: HideSpot[] = [
  // ---------------------------------------------------------------- Papa's office
  {
    id: 'sofa',
    room: 'papa-room',
    place: 'behind the sofa',
    marker: { x: 565, y: 500 },
    tail: { x: 708, y: 600 },
    enter: async (c) => {
      await c.kidTo({ x: 400, y: 772 });
      c.kid({ layer: 'back', x: 500, y: 640, pose: 'crouch', expr: 'funny', moveMs: 0 });
    },
    exit: async (c) => {
      c.kid({ layer: 'front', x: 395, y: 772, pose: 'jump', expr: 'laugh', moveMs: 0 });
      c.sound('boing');
      await c.wait(350);
    },
  },
  {
    id: 'desk',
    room: 'papa-room',
    place: 'behind my desk',
    marker: { x: 1110, y: 560 },
    tail: { x: 1240, y: 650 },
    enter: async (c) => {
      await c.kidTo({ x: 1100, y: 772 });
      c.kid({ layer: 'back', x: 1110, y: 650, pose: 'crouch', expr: 'funny', moveMs: 0 });
    },
    exit: async (c) => {
      c.kid({ layer: 'front', x: 1100, y: 772, pose: 'jump', expr: 'laugh', moveMs: 0 });
      c.sound('boing');
      await c.wait(350);
    },
  },
  {
    id: 'plant',
    room: 'papa-room',
    place: 'behind the plant',
    marker: { x: 1390, y: 620 },
    tail: { x: 1350, y: 790 },
    ...crouchBehindCover('plant', 1330, 'crouch', -1),
  },
  // ---------------------------------------------------------------- Mummy's room
  {
    id: 'blanket',
    room: 'mummy-room',
    place: 'under the blanket',
    marker: { x: 360, y: 520 },
    tail: { x: 470, y: 590 },
    enter: async (c) => {
      await c.kidTo(MUMMY_SPOTS.bedSide);
      c.kid({ pose: 'jump' });
      c.sound('boing');
      c.kid({ layer: 'back', x: KID_BED_SPOT.x, y: KID_BED_SPOT.y, pose: 'lie', moveMs: 0 });
      await c.wait(250);
      c.fx('mummy-room:blanketHide', true);
    },
    exit: async (c) => {
      c.unfx('mummy-room:blanketHide');
      c.kid({ pose: 'sitUp', expr: 'laugh', x: KID_BED_SPOT.x - 120, y: 560 });
      c.sound('pop');
      await c.wait(500);
      c.kid({ layer: 'front', pose: 'jump', x: MUMMY_SPOTS.bedSide.x, y: 772, moveMs: 350 });
      c.sound('boing');
      await c.wait(380);
      c.kid({ moveMs: 0 });
    },
  },
  {
    id: 'wardrobe',
    room: 'mummy-room',
    place: 'in the wardrobe',
    marker: { x: 1155, y: 420 },
    tail: { x: 1222, y: 650 },
    enter: async (c) => {
      await c.kidTo(MUMMY_SPOTS.wardrobe);
      c.mummyRoom({ wardrobeOpen: true });
      c.sound('creak');
      await c.wait(300);
      c.kid({ layer: 'inside', x: MUMMY_SPOTS.inWardrobe.x, y: MUMMY_SPOTS.inWardrobe.y, pose: 'crouch', expr: 'funny', moveMs: 0 });
      c.mummyRoom({ wardrobeOpen: false });
      c.fx('mummy-room:wardrobeAjar', true);
    },
    exit: async (c) => {
      c.mummyRoom({ wardrobeOpen: true });
      c.sound('creak');
      c.kid({ pose: 'cheer', expr: 'laugh' });
      await c.wait(400);
      c.kid({ layer: 'front', x: MUMMY_SPOTS.wardrobe.x, y: MUMMY_SPOTS.wardrobe.y, pose: 'jump' });
      await c.wait(300);
      c.mummyRoom({ wardrobeOpen: false });
      c.sound('doorClose');
    },
  },
  {
    id: 'chest',
    room: 'mummy-room',
    place: 'behind the costume chest',
    marker: { x: 1180, y: 680 },
    tail: { x: 1246, y: 790 },
    ...crouchBehindCover('chest', 1180, 'peek', -1),
  },
  {
    id: 'basket',
    room: 'mummy-room',
    place: 'behind the toy basket',
    marker: { x: 382, y: 650 },
    tail: { x: 442, y: 790 },
    ...crouchBehindCover('basket', 382, 'peek', 1),
  },
  // ---------------------------------------------------------------- kitchen
  {
    id: 'table',
    room: 'kitchen',
    place: 'under the table',
    marker: { x: 1255, y: 540 },
    tail: { x: 1360, y: 760 },
    ...crouchBehindCover('table', 1255, 'crouch', 1),
  },
  {
    id: 'fridge',
    room: 'kitchen',
    place: 'behind the fridge',
    marker: { x: 335, y: 260 },
    tail: { x: 420, y: 650 },
    ...crouchBehindCover('fridge', 236, 'peek', 1),
  },
];

export const spotsIn = (room: RoomId) => HIDE_SPOTS.filter((s) => s.room === room);

// ------------------------------------------------------------------ lines
const SEEK = {
  papaStart: ['Hide-and-seek? Okay! I\'ll count to ten. Go hide!', 'Papa is counting! Hide, quick!'],
  mummyStart: ['Let\'s play hide-and-seek! I\'m covering my eyes...', 'Mummy is counting! Go, go, hide!'],
  ready: ['Ready or not, here I come!', 'Coming to find you!'],
  guess: ['Is {he} {place}? ...No!', 'Hmm, {place}? Nope!', 'Maybe {place}? Not there...'],
  giggle: ['Wait... I heard a giggle!', 'Shh... what was that giggle?'],
  found: ['FOUND YOU! You were {place}!', 'Aha! There you are, {place}!', 'Gotcha! Hiding {place}!'],
  again: ['Hiding {place} again? I know your favourite spot!', 'Ha! {place} again, just like last time!'],
  kidPick: ['Where should I hide?', 'Shh... where can I hide?'],
  kidHid: ['Shhh...', 'Hee hee... they\'ll never find me!'],
  kidAuto: ['Quick, here!', 'Ooh, this spot!'],
  kidGiggle: ['Hee hee hee!', 'Pfff... hee hee!'],
  kidSeek: ['Biscuit? Where are you?', 'Where did Biscuit go?'],
  kidNotHere: ['Not here!', 'Hmm... not here!', 'Just a sock! Not Biscuit.'],
  kidFound: ['FOUND YOU, Biscuit!', 'There you are, silly puppy!'],
  pupGiveUp: ['Woof! Here I am!'],
  momentBiscuit: ['Psst, {name}! Biscuit is hiding. Can you find him?', 'Where did Biscuit go? Let\'s find him!'],
} as const;
const sl = (k: keyof typeof SEEK, place = '') => pickVaried('hs.' + k, SEEK[k]).replace('{place}', place);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const lastSpot: Partial<Record<RoomId, string>> = {};

/** Markers the child can tap. 'hide' = choose where to hide, 'seek' = search for Biscuit. */
const showMarkers = (c: Ctx, mode: 'hide' | 'seek', room: RoomId) => c.fx('hs:markers', JSON.stringify({ mode, room }));

async function waitPick(c: Ctx, untilMs: number): Promise<string | null> {
  getGame().clearFx('hs:pick');
  while (Date.now() < untilMs) {
    const pick = getGame().fx['hs:pick'] as string | undefined;
    if (pick) {
      getGame().clearFx('hs:pick');
      return pick;
    }
    await c.wait(150);
  }
  return null;
}

// ------------------------------------------------------------------ game 1: the child hides
function hideGame(room: RoomId): InteractionDefinition {
  const seeker: CharacterId = room === 'papa-room' ? 'papa' : room === 'mummy-room' ? 'mummy' : 'pup';
  return {
    id: 'HIDE_AND_SEEK',
    room,
    target: 'hs:game',
    action: 'Hide-and-seek: pick a hiding spot while the seeker counts to ten',
    category: 'character',
    needsKid: true,
    uses: seeker === 'pup' ? ['kid', 'pup'] : ['kid', seeker],
    priority: 3,
    run: async (c) => {
      const spots = spotsIn(room);
      // --- counting
      if (seeker === 'pup') {
        await pupEnter(c, room);
        await c.pupTo({ x: 640, y: PUP_FLOOR_Y }, { pose: 'sit' });
        c.pup({ pose: 'sit', facing: -1 });
        await c.say('kid', 'Biscuit, you seek! Close your eyes!', { ms: 1600 });
      } else {
        c.adult(seeker, { activity: 'countEyes', expr: 'happy' });
        await c.say(seeker, sl(seeker === 'papa' ? 'papaStart' : 'mummyStart'));
      }
      showMarkers(c, 'hide', room);
      void c.say('kid', sl('kidPick'), { wait: false, ms: 1800 });
      let picked: HideSpot | null = null;
      let n = 1;
      let hiding: Promise<void> | null = null;
      while (n <= 10) {
        if (seeker === 'pup') {
          if (n % 3 === 1) c.sound('yip');
        } else DialogueManager.say(seeker, n === 10 ? '...ten!' : `${n}...`, 3, 900);
        c.sound('tap');
        const pick: string | null = picked ? null : await waitPick(c, Date.now() + 750);
        if (!picked && pick) {
          picked = spots.find((s) => s.id === pick) ?? null;
          if (picked) {
            c.unfx('hs:markers');
            c.sound('whoosh');
            hiding = picked.enter(c);
          }
        } else if (picked) await c.wait(750);
        n++;
      }
      if (!picked) {
        // the child didn't choose: the kid picks a spot himself (never stalls)
        c.unfx('hs:markers');
        picked = spots[Math.floor(Math.random() * spots.length)];
        void c.say('kid', sl('kidAuto'), { wait: false, ms: 900 });
        hiding = picked.enter(c);
      }
      if (hiding) await hiding;
      void c.say('kid', sl('kidHid'), { wait: false, ms: 1400, priority: 1 });
      await c.wait(600);

      // --- seeking
      getGame().clearFx('hs:giggle');
      c.fx('hs:hidden', picked.id);
      if (seeker === 'pup') {
        c.sound('bark');
        await c.say('pup', 'Woof!', { ms: 900 });
      } else {
        c.adult(seeker, { activity: 'lookAround', expr: 'happy' });
        await c.say(seeker, sl('ready'));
      }
      const others = spots.filter((s) => s.id !== picked!.id).sort(() => Math.random() - 0.5);
      const sameAsLast = lastSpot[room] === picked.id;
      const wrongGuesses = sameAsLast ? 0 : Math.min(others.length, 1 + Math.floor(Math.random() * 2));
      let gaveAway = false;
      for (let i = 0; i < wrongGuesses; i++) {
        if (getGame().fx['hs:giggle']) {
          gaveAway = true;
          break;
        }
        const g = others[i];
        if (seeker === 'pup') {
          await c.pupTo({ x: g.tail.x - 30 }, { pose: 'sit' });
          c.sound('whine');
        } else {
          c.adult(seeker, { activity: i % 2 ? 'lookBack' : 'search', expr: 'puzzled' });
          await c.say(seeker, sl('guess', g.place));
        }
        // give the child a moment to make the kid giggle
        for (let t = 0; t < 8 && !getGame().fx['hs:giggle']; t++) await c.wait(150);
        if (getGame().fx['hs:giggle']) gaveAway = true;
      }
      if (gaveAway && seeker !== 'pup') {
        c.adult(seeker, { activity: 'lookAround', expr: 'surprised' });
        await c.say(seeker, sl('giggle'));
      }
      // --- found!
      if (seeker === 'pup') {
        await c.pupTo({ x: picked.tail.x - 40 }, { run: true, pose: 'jump' });
        c.sound('bark');
      } else c.adult(seeker, { activity: 'turned', expr: 'laugh' });
      c.unfx('hs:hidden');
      await picked.exit(c);
      c.sound('laugh');
      c.egg(gaveAway ? 'giggle-giveaway' : 'hide-seek', { x: c.s.kid.x, y: c.s.kid.y - 260 });
      if (seeker === 'pup') {
        c.pup({ pose: 'lick' });
        c.sound('slurp');
        await c.say('kid', 'Biscuit found me! Hee hee!', { ms: 1500 });
      } else {
        const line = sameAsLast ? sl('again', picked.place) : sl('found', picked.place);
        await c.say(seeker, cap(line));
        c.adult(seeker, { activity: 'hug', expr: 'love' });
        c.kid({ pose: 'hug', expr: 'love' });
        await c.wait(900);
      }
      lastSpot[room] = picked.id;
    },
  };
}

/** The kid can't keep quiet: tapping him while hidden makes him giggle (no actors – never blocks). */
export const giggleDefs: InteractionDefinition[] = (['papa-room', 'mummy-room', 'kitchen'] as RoomId[]).map((room) => ({
  id: 'HIDDEN_KID_GIGGLES',
  room,
  target: 'kid',
  action: 'While hiding, tap the kid – he giggles and gives himself away',
  category: 'character',
  when: (s) => !!s.fx['hs:hidden'] && s.currentRoom === room,
  priority: 1,
  run: async () => {
    const g = getGame();
    g.setFx('hs:giggle', true);
    DialogueManager.say('kid', sl('kidGiggle'), 4, 1100);
    InteractionManager.bump('kid');
    AudioManager.play('giggle');
  },
}));

// ------------------------------------------------------------------ game 2: find Biscuit
function findBiscuitGame(room: RoomId): InteractionDefinition {
  return {
    id: 'FIND_BISCUIT',
    room,
    target: 'hs:game',
    action: 'Find Biscuit: the puppy hides with only his tail showing – search the spots',
    category: 'character',
    needsKid: true,
    uses: ['kid', 'pup'],
    priority: 3,
    run: async (c) => {
      const spots = spotsIn(room);
      const hide = spots[Math.floor(Math.random() * spots.length)];
      // Biscuit runs off and hides
      if (c.s.pup.room !== room) await pupEnter(c, room);
      await c.pupTo({ x: hide.tail.x }, { run: true, pose: 'sit' });
      c.pup({ x: hide.tail.x, y: hide.tail.y, pose: 'hide', moveMs: 0 });
      c.fx('hs:pupHidden', hide.id);
      c.kid({ pose: 'stand', expr: 'puzzled' });
      await c.say('kid', sl('kidSeek'), { ms: 1500 });
      showMarkers(c, 'seek', room);
      const end = Date.now() + 40000;
      let found = false;
      const tried = new Set<string>();
      while (Date.now() < end && !found) {
        const pick = await waitPick(c, end);
        if (!pick) break;
        if (pick === 'pup' || pick === hide.id) {
          found = true;
          break;
        }
        const spot = spots.find((s) => s.id === pick);
        if (!spot) continue;
        {
          await c.kidTo({ x: spot.marker.x, y: 772 });
          c.kid({ pose: 'peek', expr: 'puzzled' });
          c.sound('hmm');
          tried.add(spot.id);
          await c.say('kid', sl('kidNotHere'), { ms: 1000 });
          c.kid({ pose: 'stand' });
        }
      }
      c.unfx('hs:markers');
      c.unfx('hs:pupHidden');
      if (!found) {
        // Biscuit gets bored and pops out by himself
        c.pup({ pose: 'jump', x: hide.tail.x - 30, y: PUP_FLOOR_Y });
        c.sound('bark');
        await c.say('pup', sl('pupGiveUp'), { ms: 1200 });
        return;
      }
      await c.kidTo({ x: Math.min(1250, hide.marker.x), y: 772 });
      c.pup({ pose: 'jump', x: hide.tail.x - 30, y: PUP_FLOOR_Y, moveMs: 200 });
      c.sound('bark');
      c.kid({ pose: 'cheer', expr: 'laugh' });
      c.egg('found-biscuit', { x: hide.tail.x, y: 640 });
      await c.say('kid', sl('kidFound'), { ms: 1400 });
      c.pup({ pose: 'lick', moveMs: 0 });
      c.sound('slurp');
      c.kid({ pose: 'hug', expr: 'love' });
      await c.wait(900);
    },
  };
}

/** Tapping Biscuit's tail while he hides finds him straight away. */
export const tailFoundDefs: InteractionDefinition[] = (['papa-room', 'mummy-room', 'kitchen'] as RoomId[]).map((room) => ({
  id: 'BISCUIT_TAIL_TAPPED',
  room,
  target: 'pup',
  action: 'Tap Biscuit’s tail sticking out – found him!',
  category: 'character',
  when: (s) => s.pup.pose === 'hide' && !!s.fx['hs:pupHidden'],
  priority: 1,
  run: async () => {
    getGame().setFx('hs:pick', 'pup');
  },
}));

/** A parent invites the child to play hide-and-seek (family moment). */
export function hideInviteMomentRun(parent: 'papa' | 'mummy') {
  return async (c: Ctx) => {
    c.adult(parent, { activity: 'turned', expr: 'happy' });
    await c.say(parent, parent === 'papa' ? 'Work break! Hide-and-seek, {name}?' : 'Shall we play hide-and-seek, {name}?');
    InteractionManager.start(hideGame(c.room));
  };
}

/** HUD button: hide-and-seek with the parent (or Biscuit seeks in the kitchen). */
export function startHideAndSeek() {
  const room = getGame().currentRoom;
  if (getGame().fx['hs:markers'] || getGame().fx['hs:hidden']) return false;
  return InteractionManager.start(hideGame(room));
}

export function startFindBiscuit() {
  const room = getGame().currentRoom;
  return InteractionManager.start(findBiscuitGame(room));
}

/** A parent sometimes suggests finding Biscuit (family moment). */
export function findBiscuitMomentRun(parent: 'papa' | 'mummy') {
  return async (c: Ctx) => {
    c.adult(parent, { activity: 'turned', expr: 'happy' });
    await c.say(parent, sl('momentBiscuit'));
    InteractionManager.start(findBiscuitGame(c.room));
  };
}
