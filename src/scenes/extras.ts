// Dress-up chest, daily surprise gift, drawing easel + art wall, and the "welcome back" greeting.
import type { InteractionDefinition } from '../engine/InteractionManager';
import { InteractionManager } from '../engine/InteractionManager';
import { pickVaried } from '../engine/random';
import { getGame, todayKey } from '../state/gameStore';
import type { Outfit, ParentId } from '../state/gameTypes';
import { GIFT_SPOT, MUMMY_SPOTS, PAPA_SPOTS } from '../data/spots';
import { hasDrawing } from '../components/drawingStore';

export const OUTFIT_ORDER: Outfit[] = ['cape', 'crown', 'pirate', 'dino', 'chef', 'none'];

const OUTFIT_LINES: Record<Outfit, { kid: readonly string[]; mummy: readonly string[] }> = {
  cape: { kid: ['Super {name} to the rescue!', 'I can fly! Whoooosh!'], mummy: ['My superhero! Can you save me from emails?', 'Wow! Captain {name}!'] },
  crown: { kid: ['I am the king of the house!', 'Bow down to King {name}!'], mummy: ['Yes, Your Majesty! Tea for the king?', 'So royal! Such a handsome king!'] },
  pirate: { kid: ['Arrr! Where is the treasure?', 'Ahoy, Mummy! Arrr!'], mummy: ['Ahoy, Captain! The treasure is... a hug!', 'Arrr! A pirate in my bedroom!'] },
  dino: { kid: ['Raaawr! I\'m a dinosaur!', 'Stomp stomp! RAAAWR!'], mummy: ['Help! A dinosaur! ...A very cute one.', 'Ooh, scary! Do dinosaurs eat kisses?'] },
  chef: { kid: ['Chef {name} is cooking!', 'One pizza for Mummy, coming up!'], mummy: ['Chef! I\'ll have one chocolate pizza, please.', 'Mmm, what\'s on the menu today, chef?'] },
  none: { kid: ['Back to me!', 'Ta-da! Just me!'], mummy: ['There\'s my real baby!', 'Hello again, {name}!'] },
};

export const OUTFIT_STICKERS: Record<Exclude<Outfit, 'none'>, string> = {
  cape: 'outfit-cape',
  crown: 'outfit-crown',
  pirate: 'outfit-pirate',
  dino: 'outfit-dino',
  chef: 'outfit-chef',
};

const BALLOON_COLORS = ['#ff6f91', '#5fd4ff', '#ffd23f', '#6fe08a', '#9b7bff', '#ff9f43'];

const GIFT_LINES = {
  papaGift: ['Surprise! A balloon for my {name}!', 'A present for my favourite kid!'],
  mummyGift: ['Ooh, a surprise for you, {name}!'],
  kidGift: ['A balloon! Yay!', 'For me? Wowww!'],
  papaArt: ['Did you draw this? It\'s a masterpiece!', 'Wow! This is going on the wall!', 'My little artist! I love it!'],
  papaArtAgain: ['Every time I look at it, I smile.', 'Best painting in the whole house!', 'Can I take it to the office?'],
  kidArt: ['I drew it myself!', 'Look, Papa! My drawing!'],
  welcomeNew: ['Hello, {name}! Welcome to our little home!', 'Hi, {name}! Come in, come in!'],
  welcomeBack: ['{name}! You\'re back! I missed you!', 'Look who\'s back! Hi, {name}!'],
  giftHint: ['Hmm... I think there\'s a surprise box for you today!'],
} as const;
const gl = (key: keyof typeof GIFT_LINES) => pickVaried('extra.' + key, GIFT_LINES[key]);

/** Is today's surprise gift still waiting? */
export const giftWaiting = () => getGame().lastGiftDay !== todayKey();

export function papaExtraDefs(): InteractionDefinition[] {
  const R = 'papa-room' as const;
  return [
    {
      id: 'DAILY_GIFT_OPENED',
      room: R,
      target: 'gift',
      action: 'Open today’s surprise gift box – a balloon for the day',
      category: 'easter',
      when: () => giftWaiting(),
      needsKid: true,
      uses: ['kid', 'papa'],
      priority: 3,
      run: async (c) => {
        await c.kidTo(PAPA_SPOTS.gift);
        c.kid({ pose: 'reach', expr: 'surprised' });
        c.sound('unwrap');
        c.fx(R + ':giftOpen', true);
        await c.wait(700);
        const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
        getGame().setBalloon(color);
        getGame().markGiftOpened();
        c.sound('tada');
        c.egg('daily-gift', { x: GIFT_SPOT.x, y: GIFT_SPOT.y - 120 });
        c.kid({ pose: 'cheer', expr: 'laugh' });
        await c.say('kid', gl('kidGift'), { ms: 1300 });
        c.papa({ activity: 'turned', expr: 'love' });
        await c.say('papa', gl('papaGift'));
        await c.wait(400);
      },
    },
    {
      id: 'EASEL_DRAWING',
      room: R,
      target: 'easel',
      action: 'Draw a picture on the easel – it gets hung on the wall',
      category: 'object',
      needsKid: true,
      uses: ['kid'],
      priority: 2,
      run: async (c) => {
        await c.kidTo(PAPA_SPOTS.easel);
        c.kid({ pose: 'reach', expr: 'focused', facing: -1 });
        c.sound('scribble');
        await c.wait(400);
        getGame().setFx('ui:drawing', true);
      },
    },
    {
      id: 'ART_ADMIRED',
      room: R,
      target: 'artwall',
      action: 'Papa admires the drawing on the wall',
      category: 'character',
      uses: ['papa'],
      priority: 2,
      run: async (c) => {
        if (!hasDrawing()) {
          // empty frame: go draw something!
          InteractionManager.trigger('easel');
          return;
        }
        c.fx(R + ':artGlow', true);
        c.sound('sparkle');
        c.papa({ activity: 'lookBack', expr: 'love' });
        await c.say('papa', gl('papaArtAgain'));
        await c.wait(400);
      },
    },
  ];
}

/** After a drawing is saved: the kid shows Papa, he hangs it on the wall. */
export const showArtToPapa: InteractionDefinition = {
  id: 'ART_SHOWN_TO_PAPA',
  room: 'papa-room',
  target: 'artwall:new',
  action: 'Show the new drawing to Papa',
  category: 'character',
  needsKid: true,
  uses: ['kid', 'papa'],
  priority: 3,
  run: async (c) => {
    await c.kidTo(PAPA_SPOTS.nearPapa);
    c.kid({ pose: 'liftUp', expr: 'happy' });
    await c.say('kid', gl('kidArt'), { ms: 1300 });
    c.papa({ activity: 'turned', expr: 'love' });
    c.fx('papa-room:papaHearts', true);
    await c.say('papa', gl('papaArt'));
    c.fx('papa-room:artGlow', true);
    c.sound('tada');
    c.kid({ pose: 'cheer', expr: 'laugh' });
    await c.wait(1200);
  },
};

export function mummyExtraDefs(): InteractionDefinition[] {
  const R = 'mummy-room' as const;
  return [
    {
      id: 'DRESS_UP',
      room: R,
      target: 'chest',
      action: 'Dress up from the costume chest (cape, crown, pirate hat, dino hood, chef hat)',
      category: 'object',
      needsKid: true,
      uses: ['kid', 'mummy'],
      priority: 3,
      run: async (c) => {
        await c.kidTo(MUMMY_SPOTS.chest);
        c.fx(R + ':chestOpen', true);
        c.sound('creak');
        c.kid({ pose: 'crouch', expr: 'happy', facing: 1 });
        await c.wait(500);
        const cur = getGame().outfit;
        const next = OUTFIT_ORDER[(OUTFIT_ORDER.indexOf(cur) + 1) % OUTFIT_ORDER.length];
        c.sound('swish');
        getGame().setOutfit(next);
        c.kid({ pose: next === 'cape' ? 'cheer' : next === 'dino' ? 'funny' : 'jump', expr: 'laugh', facing: -1 });
        c.sound(next === 'none' ? 'pop' : 'tada');
        if (next !== 'none') getGame().discoverEgg(OUTFIT_STICKERS[next]);
        await c.say('kid', c.pick('outfit.kid.' + next, OUTFIT_LINES[next].kid), { ms: 1600 });
        c.mummy({ activity: 'turned', expr: next === 'dino' ? 'surprised' : 'laugh' });
        await c.say('mummy', c.pick('outfit.mummy.' + next, OUTFIT_LINES[next].mummy));
        await c.wait(300);
      },
    },
  ];
}

/** "Welcome back, {name}!" when the game opens (plus a hint about today's gift). */
export function welcomeDef(returning: boolean): InteractionDefinition {
  const room = getGame().currentRoom;
  const parent: ParentId = room === 'papa-room' ? 'papa' : 'mummy';
  return {
    id: returning ? 'WELCOME_BACK' : 'WELCOME_NEW',
    room,
    target: 'welcome',
    action: 'Greeting',
    category: 'idle',
    uses: [parent],
    priority: 0.5,
    run: async (c) => {
      await c.wait(900);
      c.adult(parent, { activity: 'turned', expr: 'happy' });
      await c.say(parent, gl(returning ? 'welcomeBack' : 'welcomeNew'));
      if (giftWaiting() && room === 'papa-room') await c.say('papa', gl('giftHint'));
      await c.wait(300);
    },
  };
}
