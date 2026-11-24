// Strongly typed game state for My Little Home.

export type RoomId = 'papa-room' | 'mummy-room';
export type DayPeriod = 'morning' | 'afternoon' | 'evening' | 'night';
export type CharacterId = 'papa' | 'mummy' | 'kid';
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
  | 'dizzy';

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

export type HeldItem = null | 'robot' | 'teddy' | 'duck' | 'mouse' | 'sunglasses' | 'pillow';

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

export interface Dialogue {
  id: number;
  speaker: CharacterId;
  text: string;
  priority: number;
  until: number;
}

export interface Settings {
  soundEnabled: boolean;
}

/** Short-lived visual effects keyed by name (e.g. "papa-room:ball"). */
export type FxMap = Record<string, string | number | boolean | undefined>;

export interface GameState {
  currentRoom: RoomId;
  transitioning: boolean;
  dayPeriod: DayPeriod;
  papaRoom: PapaRoomState;
  mummyRoom: MummyRoomState;
  characters: { papa: AdultState; mummy: AdultState };
  kid: KidState;
  dialogues: Partial<Record<CharacterId, Dialogue>>;
  fx: FxMap;
  settings: Settings;
  discoveredEasterEggs: string[];
  introDone: boolean;
}
