// Strongly typed game state for My Little Home.

export type RoomId = 'papa-room' | 'mummy-room' | 'kitchen';
export type DayPeriod = 'morning' | 'afternoon' | 'evening' | 'night';
export type CharacterId = 'papa' | 'mummy' | 'kid' | 'pup';
export type ParentId = 'papa' | 'mummy';

export type Expression =
  | 'neutral'
  | 'happy'
  | 'laugh'
  | 'annoyed'
  | 'irritated'
  | 'surprised'
  | 'puzzled'
  | 'love'
  | 'sleepy'
  | 'asleep'
  | 'funny'
  | 'funny2'
  | 'strain'
  | 'yawn'
  | 'dizzy'
  | 'focused';

/** What an adult (Papa / Mummy) is doing right now. Drives their pose. */
export type AdultActivity =
  | 'typing'
  | 'thinking'
  | 'stretch'
  | 'drink'
  | 'phone'
  | 'lookClock'
  | 'adjust'
  | 'lookAround'
  | 'lookBack'
  | 'lookDoor'
  | 'turned'
  | 'hug'
  | 'guitar'
  | 'play'
  | 'search'
  | 'meeting'
  | 'rest'
  | 'read'
  | 'lookKid'
  | 'catch'
  | 'throw'
  | 'holdTeddy'
  | 'dizzy'
  | 'countEyes';

export type KidPose =
  | 'stand'
  | 'walk'
  | 'sleep'
  | 'sitUp'
  | 'sit'
  | 'jump'
  | 'reach'
  | 'hold'
  | 'throw'
  | 'crouch'
  | 'hug'
  | 'lift'
  | 'liftUp'
  | 'curl'
  | 'funny'
  | 'drink'
  | 'comb'
  | 'wave'
  | 'cheer'
  | 'strum'
  | 'knock'
  | 'lie'
  | 'push'
  | 'dance'
  | 'peek'
  | 'yawn';

export type HeldItem = null | 'robot' | 'teddy' | 'duck' | 'mouse' | 'sunglasses' | 'pillow' | FoodItem;

/** Snacks made in the kitchen – carry them to Papa or Mummy. */
export type FoodItem = 'cookie' | 'sandwich' | 'banana' | 'juice' | 'popcorn' | 'cupcake';

export type KidLayer = 'front' | 'back' | 'inside';

export interface AdultState {
  activity: AdultActivity;
  expr: Expression;
  mood: 'busy' | 'happy' | 'annoyed' | 'playful' | 'sleepy';
}

export interface KidState {
  room: RoomId;
  awake: boolean;
  pose: KidPose;
  expr: Expression;
  x: number;
  y: number;
  facing: 1 | -1;
  layer: KidLayer;
  holding: HeldItem;
  /** Transient prop drawn in the kid's hands (guitar, dumbbell, bottle...). */
  prop: KidProp;
  moveMs: number;
}

export type KidProp =
  | null
  | 'guitar'
  | 'dumbbell'
  | 'barbell'
  | 'curl'
  | 'bottle'
  | 'ball'
  | 'brush'
  | 'book'
  | 'pillow'
  | 'mouse'
  | 'lollipop'
  | 'keys'
  | 'apple'
  | 'wand';


export interface PapaRoomState {
  lightOn: boolean;
  lampOn: boolean;
  laptopOn: boolean;
  curtainsOpen: boolean;
  windowOpen: boolean;
  fanSpeed: 0 | 1 | 2;
  paintingTilted: boolean;
}

export interface MummyRoomState {
  lightOn: boolean;
  lampOn: boolean;
  curtainsOpen: boolean;
  windowOpen: boolean;
  wardrobeOpen: boolean;
  fanSpeed: 0 | 1 | 2;
  alarmSound: number;
}

export interface KitchenState {
  lightOn: boolean;
  curtainsOpen: boolean;
  windowOpen: boolean;
}

export interface Dialogue {
  id: number;
  speaker: CharacterId;
  text: string;
  priority: number;
  until: number;
}

export interface Settings {
  soundEnabled: boolean;
  /** The player's name – typed on the first screen, used by Papa and Mummy. */
  kidName?: string;
}

/** Dress-up costumes from the costume chest (persisted). */
export type Outfit = 'none' | 'cape' | 'crown' | 'pirate' | 'dino' | 'chef';

export type PupPose = 'sit' | 'walk' | 'run' | 'sleep' | 'wag' | 'jump' | 'eat' | 'roll' | 'beg' | 'lick' | 'spin' | 'hide';

/** Biscuit the puppy – follows the kid between rooms. */
export interface PupState {
  room: RoomId;
  x: number;
  y: number;
  facing: 1 | -1;
  pose: PupPose;
  moveMs: number;
  /** carrying something in his mouth */
  carry: null | 'ball' | 'sock';
}

/** Short-lived visual effects keyed by name (e.g. "papa-room:ball"). */
export type FxMap = Record<string, string | number | boolean | undefined>;

export interface GameState {
  currentRoom: RoomId;
  transitioning: boolean;
  dayPeriod: DayPeriod;
  papaRoom: PapaRoomState;
  mummyRoom: MummyRoomState;
  kitchen: KitchenState;
  characters: { papa: AdultState; mummy: AdultState };
  kid: KidState;
  dialogues: Partial<Record<CharacterId, Dialogue>>;
  fx: FxMap;
  settings: Settings;
  discoveredEasterEggs: string[];
  introDone: boolean;
  outfit: Outfit;
  pup: PupState;
  /** Colour of today's gift balloon tied to the kid (null = none). */
  balloon: string | null;
  /** yyyy-mm-dd of the last daily gift opened. */
  lastGiftDay: string | null;
  /** Bumps whenever a new drawing is hung on the wall. */
  drawingVersion: number;
}
