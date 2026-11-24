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
} satisfies Record<string, Spot>;

/** New toys: block tower base, toy-car parking spot, bubble bottle. */
export const TOWER_BASE = { x: 535, y: 792 };
export const CAR_HOME = { x: 1255, y: 787 };
export const BUBBLE_BOTTLE = { x: 590, y: 794 };
