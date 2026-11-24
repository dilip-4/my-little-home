// CHARACTER REFERENCE SHEET
// Every rendering of Papa, Mummy and the Kid reads its look from here, so they stay identical
// across rooms, poses and animations. (A visual version renders at  /#sheet )

export const OUTLINE = '#5a3b2a';
export const OUTLINE_W = 3;

export interface CharacterSpec {
  name: string;
  faceShape: string;
  skin: string;
  skinShade: string;
  hair: string;
  eyes: string;
  clothing: string;
  proportions: string;
  palette: Record<string, string>;
  expressionStyle: string;
  poses: string[];
}

export const PAPA_SPEC: CharacterSpec = {
  name: 'Papa',
  faceShape: 'Rounded oval, soft square jaw with a short trimmed beard',
  skin: '#c68a63',
  skinShade: '#a8704e',
  hair: '#2a201c',
  eyes: 'Dark brown dot eyes behind rounded rectangular glasses',
  clothing: 'Teal-blue polo shirt with white collar trim, grey joggers, white sneakers',
  proportions: 'Adult, 1 : 3.4 head-to-seated-body, broad shoulders',
  palette: {
    shirt: '#3c7fae',
    shirtDark: '#2f6790',
    collar: '#eef4f8',
    pants: '#5b6070',
    pantsDark: '#4a4e5c',
    shoe: '#f2f0ea',
    glasses: '#2f2a28',
  },
  expressionStyle: 'Dry and focused while working, eyebrows do most of the talking; big warm grin when he gives in',
  poses: ['typing', 'thinking', 'stretch', 'drink', 'phone', 'lookClock', 'lookBack', 'turned', 'hug', 'guitar', 'play', 'search', 'meeting', 'dizzy'],
};

export const MUMMY_SPEC: CharacterSpec = {
  name: 'Mummy',
  faceShape: 'Soft heart-shaped face, rounded chin',
  skin: '#d49a72',
  skinShade: '#b87d58',
  hair: '#231a18',
  eyes: 'Dark almond eyes with lashes, small red bindi',
  clothing: 'Coral kurta with mustard trim, indigo leggings, gold stud earrings',
  proportions: 'Adult, slightly smaller than Papa, long hair in a low bun',
  palette: {
    shirt: '#e2705c',
    shirtDark: '#c65a48',
    collar: '#f2b640',
    pants: '#3e4a72',
    pantsDark: '#323c5e',
    shoe: '#c9566a',
    lips: '#bf4f5c',
    bindi: '#c8283a',
    gold: '#e9b949',
  },
  expressionStyle: 'Warm, playful, teasing; raises one eyebrow before she laughs',
  poses: ['typing', 'drink tea', 'read', 'stretch', 'phone', 'lookKid', 'meeting', 'rest', 'turned', 'hug', 'catch', 'throw', 'holdTeddy'],
};

export const KID_SPEC: CharacterSpec = {
  name: 'Atharv (the Kid)',
  faceShape: 'Big round face, chubby cheeks, always slightly blushing',
  skin: '#d9a179',
  skinShade: '#bf8660',
  hair: '#261c18',
  eyes: 'Big shiny dark eyes with a white highlight',
  clothing: 'Sunny yellow T-shirt with an orange star, red shorts, white socks, blue sneakers',
  proportions: 'About 5 years old: head is 1/3 of total height, short limbs',
  palette: {
    shirt: '#f5c343',
    shirtDark: '#dca62a',
    star: '#f08a3c',
    shorts: '#de5a4c',
    shortsDark: '#c34638',
    sock: '#ffffff',
    shoe: '#3f72b8',
  },
  expressionStyle: 'Huge, readable expressions: cheeky grin, funny faces, sleepy, surprised',
  poses: ['sleep', 'sitUp', 'stand', 'walk', 'jump', 'throw', 'crouch', 'hug', 'lift', 'liftUp', 'curl', 'funny', 'drink', 'comb', 'wave', 'cheer', 'strum', 'knock', 'lie', 'dance', 'peek', 'yawn'],
};
