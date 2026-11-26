// Snacks made in the kitchen can be carried to Papa or Mummy – they stop, eat and react.
import type { InteractionDefinition } from '../engine/InteractionManager';
import { FamilyMemory } from '../engine/FamilyMemory';
import type { FoodItem, ParentId } from '../state/gameTypes';
import { MUMMY_SPOTS, PAPA_SPOTS } from '../data/spots';
import { isFood, kidHolding } from './shared';

const REACT: Record<ParentId, Record<FoodItem, readonly string[]>> = {
  papa: {
    cookie: ['A cookie? Shh, don\'t tell Mummy!', 'Mmm! Cookie break, my favourite meeting.'],
    sandwich: ['You made me a sandwich? Best chef in the world!', 'Wow, a {name} special! Delicious!'],
    banana: ['A banana! Monkey food for Papa monkey! Ooh ooh!', 'Thank you! Energy for more work.'],
    juice: ['Juice! Cheers, {name}!', 'Ahh, just what I needed. Thank you!'],
    popcorn: ['Popcorn? Is it movie time already?', 'Pop pop! Don\'t tell my boss.'],
    cupcake: ['A cupcake! Is it my birthday?', 'You baked this? Chef {name}, you are amazing!'],
    tomato: ['You grew this tomato yourself? Farmer {name}!', 'A real garden tomato! So juicy!'],
  },
  mummy: {
    cookie: ['A cookie for me? Who\'s been in the cookie jar, hmm?', 'Thank you, sweetie! Half for you?'],
    sandwich: ['Did you make this yourself? I\'m so proud of you!', 'Mmm! Best sandwich ever, chef!'],
    banana: ['A banana! You know Mummy loves fruit.', 'Thank you, my jaan!'],
    juice: ['Juice for Mummy? So thoughtful!', 'Cheers! Clink!'],
    popcorn: ['Popcorn! Shall we watch a movie later?', 'Mmm, crunchy! Thank you, baby.'],
    cupcake: ['A cupcake with love? My heart is full!', 'You baked this? Little master chef!'],
    tomato: ["From your own plant? I'm so proud of you!", 'What a red, shiny tomato! Thank you, gardener!'],
  },
};

const MANY: Record<ParentId, readonly string[]> = {
  papa: ['Another snack? I\'ll be as round as a ball!', 'You are the best snack delivery service!'],
  mummy: ['So many treats today! Are you my little waiter?', 'Snack delivery again! Five stars!'],
};

function snackFor(parent: ParentId): InteractionDefinition {
  const room = parent === 'papa' ? 'papa-room' : 'mummy-room';
  const near = parent === 'papa' ? PAPA_SPOTS.nearPapa : MUMMY_SPOTS.nearMummy;
  return {
    id: parent === 'papa' ? 'SNACK_GIVEN_TO_PAPA' : 'SNACK_GIVEN_TO_MUMMY',
    room,
    target: parent,
    action: `Bring ${parent === 'papa' ? 'Papa' : 'Mummy'} a snack from the kitchen – they stop and eat it`,
    category: 'combo',
    when: (s) => isFood(kidHolding(s)),
    uses: ['kid', parent],
    priority: 4,
    run: async (c) => {
      const food = c.s.kid.holding as FoodItem;
      await c.kidTo(near);
      c.kid({ pose: 'liftUp', expr: 'happy' });
      c.adult(parent, { activity: 'turned', expr: 'surprised' });
      await c.say('kid', `Here, ${parent === 'papa' ? 'Papa' : 'Mummy'}! For you!`, { ms: 1200 });
      c.kid({ holding: null, pose: 'cheer', expr: 'laugh' });
      c.adult(parent, { activity: 'drink', expr: 'happy' });
      c.sound(food === 'juice' ? 'gulp' : 'crunch');
      await c.wait(800);
      c.adult(parent, { activity: 'hug', expr: 'love' });
      c.fx(parent === 'papa' ? 'papa-room:papaHearts' : 'mummy-room:hearts', true);
      c.egg(parent === 'papa' ? 'snack-papa' : 'snack-mummy', { x: parent === 'papa' ? 930 : 900, y: 300 });
      const n = FamilyMemory.count(c.id);
      await c.say(parent, n >= 3 && n % 2 === 1 ? c.pick('snack.many.' + parent, MANY[parent]) : c.pick(`snack.${parent}.${food}`, REACT[parent][food]));
      c.kid({ pose: 'hug', expr: 'love' });
      await c.wait(700);
    },
  };
}

export const snackToPapa = snackFor('papa');
export const snackToMummy = snackFor('mummy');
