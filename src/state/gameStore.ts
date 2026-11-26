import { create } from 'zustand';
import type {
  AdultState,
  CharacterId,
  DayPeriod,
  Dialogue,
  GameState,
  GardenState,
  PlantState,
  KidState,
  KidGender,
  KitchenState,
  MummyRoomState,
  Outfit,
  PapaRoomState,
  PupState,
  ParentId,
  RoomId,
} from './gameTypes';
import { getDayPeriod } from '../engine/time';
import { KID_BED_SPOT } from '../data/spots';

const STORAGE_KEY = 'my-little-home:v1';

export const initialPapaRoom: PapaRoomState = {
  lightOn: true,
  lampOn: true,
  laptopOn: true,
  curtainsOpen: true,
  windowOpen: false,
  fanSpeed: 1,
  paintingTilted: false,
};

export const initialMummyRoom: MummyRoomState = {
  lightOn: true,
  lampOn: true,
  curtainsOpen: true,
  windowOpen: false,
  wardrobeOpen: false,
  fanSpeed: 1,
  alarmSound: 0,
};

export const initialKitchen: KitchenState = { lightOn: true, curtainsOpen: true, windowOpen: false };

/** A watered plant grows to its next stage this long after watering. */
export const GROW_MS = 15000;
export const initialPlants = (): PlantState[] => [
  { kind: 'sunflower', stage: 0, wateredAt: null },
  { kind: 'tomato', stage: 0, wateredAt: null },
  { kind: 'flower', stage: 0, wateredAt: null },
];
export const initialGarden = (): GardenState => ({
  plants: initialPlants(),
  birds: [],
  digger: { x: 700, y: 716, facing: 1, moveMs: 0, arm: 'rest', load: false },
  heap: 0,
  hole: 0,
});
/** Applies any growth that is due (also catches up after the game was closed). */
export function grownPlants(plants: PlantState[], now = Date.now()): PlantState[] | null {
  let changed = false;
  const next = plants.map((p) => {
    if (p.wateredAt === null || now - p.wateredAt < GROW_MS) return p;
    changed = true;
    return { ...p, stage: Math.min(3, p.stage + 1) as PlantState['stage'], wateredAt: null };
  });
  return changed ? next : null;
}

export const initialKid: KidState = {
  room: 'mummy-room',
  awake: false,
  pose: 'sleep',
  expr: 'asleep',
  x: KID_BED_SPOT.x,
  y: KID_BED_SPOT.y,
  facing: 1,
  layer: 'back',
  holding: null,
  prop: null,
  moveMs: 0,
};

export const initialPup: PupState = { room: 'papa-room', x: 935, y: 790, facing: 1, pose: 'sleep', moveMs: 0, carry: null };

export const defaultAdult = (): AdultState => ({ activity: 'typing', expr: 'focused', mood: 'busy' });

export function createInitialState(now = new Date()): GameState {
  return {
    currentRoom: 'papa-room',
    transitioning: false,
    dayPeriod: getDayPeriod(now),
    papaRoom: { ...initialPapaRoom },
    mummyRoom: { ...initialMummyRoom },
    kitchen: { ...initialKitchen },
    garden: initialGarden(),
    characters: { papa: defaultAdult(), mummy: defaultAdult() },
    kid: { ...initialKid },
    dialogues: {},
    fx: {},
    settings: { soundEnabled: true },
    discoveredEasterEggs: [],
    introDone: false,
    outfit: 'none',
    pup: { ...initialPup },
    balloon: null,
    lastGiftDay: null,
    drawingVersion: 0,
  };
}

interface Persisted {
  settings?: GameState['settings'];
  papaRoom?: Partial<PapaRoomState>;
  mummyRoom?: Partial<MummyRoomState>;
  discoveredEasterEggs?: string[];
  outfit?: Outfit;
  balloon?: string | null;
  lastGiftDay?: string | null;
  plants?: PlantState[];
}

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

function loadPersisted(): Persisted {
  try {
    if (typeof localStorage === 'undefined') return {};
    if (typeof location !== 'undefined' && location.search.includes('fresh')) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch {
    return {};
  }
}

function hydrate(base: GameState): GameState {
  const p = loadPersisted();
  return {
    ...base,
    settings: { ...base.settings, ...(p.settings ?? {}) },
    // main room lights always start on so a new session opens on a bright, welcoming home
    papaRoom: { ...base.papaRoom, ...(p.papaRoom ?? {}), lightOn: true },
    mummyRoom: { ...base.mummyRoom, ...(p.mummyRoom ?? {}), lightOn: true },
    discoveredEasterEggs: Array.isArray(p.discoveredEasterEggs) ? p.discoveredEasterEggs : [],
    outfit: p.outfit ?? 'none',
    garden: {
      ...base.garden,
      plants: Array.isArray(p.plants) && p.plants.length === 3 ? (grownPlants(p.plants) ?? p.plants) : base.garden.plants,
    },
    lastGiftDay: p.lastGiftDay ?? null,
    // today's balloon stays for the day it was given
    balloon: p.lastGiftDay === todayKey() ? (p.balloon ?? null) : null,
  };
}

export interface GameActions {
  setRoom: (room: RoomId) => void;
  setTransitioning: (v: boolean) => void;
  setDayPeriod: (p: DayPeriod) => void;
  patchPapaRoom: (patch: Partial<PapaRoomState>) => void;
  patchMummyRoom: (patch: Partial<MummyRoomState>) => void;
  patchKitchen: (patch: Partial<KitchenState>) => void;
  patchGarden: (patch: Partial<GardenState>) => void;
  setAdult: (id: ParentId, patch: Partial<AdultState>) => void;
  setKid: (patch: Partial<KidState>) => void;
  showDialogue: (d: Dialogue) => void;
  clearDialogue: (speaker: CharacterId, id?: number) => void;
  setFx: (key: string, value: GameState['fx'][string]) => void;
  clearFx: (key: string) => void;
  toggleSound: () => void;
  discoverEgg: (id: string) => boolean;
  setIntroDone: () => void;
  setKidName: (name: string) => void;
  setKidGender: (g: KidGender) => void;
  setVolume: (v: number) => void;
  setOutfit: (o: Outfit) => void;
  setPup: (patch: Partial<PupState>) => void;
  setBalloon: (color: string | null) => void;
  markGiftOpened: () => void;
  bumpDrawing: () => void;
  resetSession: () => void;
}

export type Store = GameState & GameActions;

export const useGame = create<Store>()((set, get) => ({
  ...hydrate(createInitialState()),

  setRoom: (room) => set({ currentRoom: room }),
  setTransitioning: (v) => set({ transitioning: v }),
  setDayPeriod: (p) => {
    if (get().dayPeriod !== p) set({ dayPeriod: p });
  },
  patchPapaRoom: (patch) => set((s) => ({ papaRoom: { ...s.papaRoom, ...patch } })),
  patchMummyRoom: (patch) => set((s) => ({ mummyRoom: { ...s.mummyRoom, ...patch } })),
  patchKitchen: (patch) => set((s) => ({ kitchen: { ...s.kitchen, ...patch } })),
  patchGarden: (patch) => set((s) => ({ garden: { ...s.garden, ...patch } })),
  setAdult: (id, patch) =>
    set((s) => ({ characters: { ...s.characters, [id]: { ...s.characters[id], ...patch } } })),
  setKid: (patch) => set((s) => ({ kid: { ...s.kid, ...patch } })),
  showDialogue: (d) => set((s) => ({ dialogues: { ...s.dialogues, [d.speaker]: d } })),
  clearDialogue: (speaker, id) =>
    set((s) => {
      const cur = s.dialogues[speaker];
      if (!cur || (id !== undefined && cur.id !== id)) return s;
      const next = { ...s.dialogues };
      delete next[speaker];
      return { dialogues: next };
    }),
  setFx: (key, value) => set((s) => ({ fx: { ...s.fx, [key]: value } })),
  clearFx: (key) =>
    set((s) => {
      if (!(key in s.fx)) return s;
      const next = { ...s.fx };
      delete next[key];
      return { fx: next };
    }),
  toggleSound: () => set((s) => ({ settings: { ...s.settings, soundEnabled: !s.settings.soundEnabled } })),
  discoverEgg: (id) => {
    if (get().discoveredEasterEggs.includes(id)) return false;
    set((s) => ({ discoveredEasterEggs: [...s.discoveredEasterEggs, id] }));
    return true;
  },
  setIntroDone: () => set({ introDone: true }),
  setKidName: (name) => set((s) => ({ settings: { ...s.settings, kidName: name.trim().slice(0, 16) } })),
  setKidGender: (g) => set((s) => ({ settings: { ...s.settings, kidGender: g } })),
  setVolume: (v) => set((s) => ({ settings: { ...s.settings, volume: Math.max(0, Math.min(1, v)) } })),
  setOutfit: (o) => set({ outfit: o }),
  setPup: (patch) => set((s) => ({ pup: { ...s.pup, ...patch } })),
  setBalloon: (color) => set({ balloon: color }),
  markGiftOpened: () => set({ lastGiftDay: todayKey() }),
  bumpDrawing: () => set((s) => ({ drawingVersion: s.drawingVersion + 1 })),
  resetSession: () =>
    set({ ...createInitialState(), settings: get().settings, outfit: get().outfit, balloon: get().balloon, lastGiftDay: get().lastGiftDay, introDone: true, garden: { ...initialGarden(), plants: get().garden.plants } }),
}));

// Persist settings + durable room toggles (never transient dialogue / animation state).
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let savingStopped = false;
/** Used by "Start over": stop writing so the erased data isn't saved again before reload. */
export const stopSaving = () => {
  savingStopped = true;
  clearTimeout(saveTimer);
};
useGame.subscribe((s, prev) => {
  if (savingStopped) return;
  if (
    s.settings === prev.settings &&
    s.papaRoom === prev.papaRoom &&
    s.mummyRoom === prev.mummyRoom &&
    s.discoveredEasterEggs === prev.discoveredEasterEggs &&
    s.outfit === prev.outfit &&
    s.balloon === prev.balloon &&
    s.lastGiftDay === prev.lastGiftDay &&
    s.garden.plants === prev.garden.plants
  )
    return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data: Persisted = {
        settings: s.settings,
        papaRoom: s.papaRoom,
        mummyRoom: s.mummyRoom,
        discoveredEasterEggs: s.discoveredEasterEggs,
        outfit: s.outfit,
        balloon: s.balloon,
        lastGiftDay: s.lastGiftDay,
        plants: s.garden.plants,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable – ignore */
    }
  }, 300);
});

export const getGame = () => useGame.getState();
