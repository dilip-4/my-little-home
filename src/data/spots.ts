import type { RoomId } from '../state/gameTypes';
// Logical scene coordinates (1440 x 810). Kid spots are feet positions.
export const SCENE_W = 1440;
export const SCENE_H = 810;

export interface Spot {
  x: number;
  y: number;
  facing?: 1 | -1;
}

export const KID_BED_SPOT: Spot = { x: 372, y: 512 };

export const PAPA_SEAT = { x: 915, y: 560 };
export const MUMMY_SEAT = { x: 905, y: 572 };

export const BUBBLE_ANCHORS = {
  papa: { x: 915, y: 262 },
  mummy: { x: 905, y: 262 },
};

export const PAPA_SPOTS = {
  door: { x: 120, y: 770, facing: 1 },
  default: { x: 600, y: 772, facing: 1 },
  behindPapa: { x: 790, y: 772, facing: 1 },
  nearPapa: { x: 815, y: 772, facing: 1 },
  bookshelf: { x: 330, y: 770, facing: 1 },
  sofa: { x: 565, y: 600, facing: 1 },
  sofaLie: { x: 655, y: 575, facing: 1 },
  behindSofa: { x: 500, y: 640, facing: 1 },
  guitar: { x: 715, y: 772, facing: 1 },
  chair: { x: 800, y: 772, facing: 1 },
  laptop: { x: 1040, y: 778, facing: 1 },
  phone: { x: 1130, y: 778, facing: 1 },
  keyboard: { x: 1205, y: 778, facing: 1 },
  mouse: { x: 1285, y: 778, facing: 1 },
  bottle: { x: 1320, y: 778, facing: -1 },
  dumbbell: { x: 1050, y: 788, facing: 1 },
  barbell: { x: 330, y: 790, facing: 1 },
  curl: { x: 1145, y: 788, facing: -1 },
  ball: { x: 690, y: 772, facing: 1 },
  robot: { x: 460, y: 772, facing: 1 },
  plant: { x: 1300, y: 772, facing: 1 },
  doorKnock: { x: 230, y: 772, facing: -1 },
  hideDoor: { x: 290, y: 772, facing: -1 },
  blocks: { x: 612, y: 772, facing: -1 },
  car: { x: 1295, y: 778, facing: -1 },
  easel: { x: 330, y: 772, facing: -1 },
  gift: { x: 600, y: 772, facing: 1 },
} satisfies Record<string, Spot>;

export const MUMMY_SPOTS = {
  door: { x: 1343, y: 770, facing: -1 },
  default: { x: 700, y: 772, facing: -1 },
  bed: { x: 300, y: 545, facing: 1 },
  bedSide: { x: 250, y: 772, facing: 1 },
  pillow: { x: 200, y: 772, facing: 1 },
  nearMummy: { x: 1000, y: 772, facing: -1 },
  behindMummy: { x: 1015, y: 772, facing: -1 },
  lamp: { x: 540, y: 772, facing: 1 },
  alarm: { x: 560, y: 772, facing: 1 },
  basket: { x: 455, y: 772, facing: -1 },
  ball: { x: 520, y: 772, facing: 1 },
  shelf: { x: 720, y: 772, facing: 1 },
  bottle: { x: 640, y: 772, facing: 1 },
  mug: { x: 690, y: 772, facing: 1 },
  laptop: { x: 760, y: 772, facing: 1 },
  pouf: { x: 845, y: 742, facing: -1 },
  mirror: { x: 1015, y: 772, facing: 1 },
  brush: { x: 1000, y: 772, facing: 1 },
  bag: { x: 1060, y: 772, facing: 1 },
  wardrobe: { x: 1150, y: 772, facing: 1 },
  inWardrobe: { x: 1150, y: 640, facing: 1 },
  teddy: { x: 420, y: 772, facing: 1 },
  plant: { x: 1180, y: 772, facing: 1 },
  bubbles: { x: 630, y: 772, facing: 1 },
  bowl: { x: 960, y: 772, facing: 1 },
  chest: { x: 1110, y: 772, facing: 1 },
} satisfies Record<string, Spot>;

/** New toys: block tower base, toy-car parking spot, bubble bottle. */
export const TOWER_BASE = { x: 535, y: 792 };
export const CAR_HOME = { x: 1255, y: 787 };
export const BUBBLE_BOTTLE = { x: 590, y: 794 };

/** Biscuit's bowl and the costume chest (Mummy's room), easel + daily gift (Papa's office). */
export const PUP_BOWL = { x: 1020, y: 796 };
export const COSTUME_CHEST = { x: 1180, y: 798 };
export const EASEL = { x: 222, y: 700 };
export const GIFT_SPOT = { x: 646, y: 568 };
export const PUP_FLOOR_Y = 792;
/** Where Biscuit may wander in each room. */
export const PUP_RANGE = { 'papa-room': [240, 1240], 'mummy-room': [520, 1230], kitchen: [260, 1060], garden: [240, 1300] } as const;
export const DOOR_X = { 'papa-room': 130, 'mummy-room': 1330, kitchen: 130, garden: 130 } as const;

export const KITCHEN_SPOTS = {
  door: { x: 120, y: 770, facing: 1 },
  default: { x: 640, y: 772, facing: 1 },
  fridge: { x: 440, y: 772, facing: -1 },
  cookies: { x: 520, y: 772, facing: 1 },
  fruit: { x: 610, y: 772, facing: 1 },
  sink: { x: 790, y: 772, facing: 1 },
  board: { x: 930, y: 772, facing: 1 },
  microwave: { x: 1010, y: 772, facing: 1 },
  oven: { x: 700, y: 772, facing: 1 },
  table: { x: 1190, y: 772, facing: 1 },
  chair: { x: 1300, y: 700, facing: -1 },
  switch: { x: 230, y: 772, facing: -1 },
} satisfies Record<string, Spot>;

export const GARDEN_SPOTS = {
  door: { x: 120, y: 770, facing: 1 },
  default: { x: 470, y: 772, facing: 1 },
  remote: { x: 520, y: 772, facing: 1 },
  soil: { x: 500, y: 772, facing: -1 },
  sprinkler: { x: 250, y: 700, facing: 1 },
  bed: { x: 700, y: 640, facing: 1 },
  can: { x: 440, y: 700, facing: 1 },
  seeds: { x: 1170, y: 700, facing: 1 },
  swing: { x: 1110, y: 760, facing: -1 },
  tree: { x: 1250, y: 760, facing: 1 },
} satisfies Record<string, Spot>;
/** Plant stems (feet of each plant in the flower bed). */
export const PLANT_X = [600, 710, 820] as const;
export const BED_Y = 600;
/** The sandpit the excavator drives in (an ellipse). */
export const SANDPIT = { cx: 840, cy: 728, rx: 250, ry: 70 };
export const SOIL_PATCH = { x: 300, y: 742 };
export const SWING = { x: 1110, top: 330, seat: 640 };

/** Per-room door, entry and resting spots (used when the kid moves between rooms). */
export const ROOM_DOOR: Record<RoomId, Spot> = {
  'papa-room': PAPA_SPOTS.door,
  'mummy-room': MUMMY_SPOTS.door,
  kitchen: KITCHEN_SPOTS.door,
  garden: GARDEN_SPOTS.door,
};
export const ROOM_ENTRY: Record<RoomId, Spot> = {
  'papa-room': { x: 330, y: 772 },
  'mummy-room': { x: 1150, y: 772 },
  kitchen: { x: 330, y: 772 },
  garden: { x: 300, y: 772 },
};
export const ROOM_DEFAULT: Record<RoomId, Spot> = {
  'papa-room': PAPA_SPOTS.default,
  'mummy-room': MUMMY_SPOTS.default,
  kitchen: KITCHEN_SPOTS.default,
  garden: GARDEN_SPOTS.default,
};
