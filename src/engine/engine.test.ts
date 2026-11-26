import { describe, expect, it, vi, beforeEach } from 'vitest';
import { currentStage, initialPapaTap, PAPA_TAP_WINDOW_MS, resetPapaTap, tapPapa } from './papaTapMachine';
import { getDayPeriod, isTwelveOClock, formatTime } from './time';
import { CooldownTracker, TapCounter } from './cooldowns';
import { pickVaried } from './random';
import { InteractionManager, type InteractionDefinition } from './InteractionManager';
import { getGame, useGame, createInitialState } from '../state/gameStore';
import { papaRoomInteractions } from '../scenes/PapaRoom/interactions';
import { mummyRoomInteractions } from '../scenes/MummyRoom/interactions';

describe("Papa's three-tap state machine", () => {
  it('escalates 1 → 2 → 3 when taps are within 5 s', () => {
    let s = tapPapa(initialPapaTap, 1000);
    expect(s.stage).toBe(1);
    s = tapPapa(s, 1000 + 4900);
    expect(s.stage).toBe(2);
    s = tapPapa(s, 1000 + 4900 + 5000);
    expect(s.stage).toBe(3);
  });
  it('resets to stage 1 when the second tap is late', () => {
    let s = tapPapa(initialPapaTap, 0);
    s = tapPapa(s, PAPA_TAP_WINDOW_MS + 1);
    expect(s.stage).toBe(1);
  });
  it('resets when the third tap is late', () => {
    let s = tapPapa(initialPapaTap, 0);
    s = tapPapa(s, 3000);
    s = tapPapa(s, 3000 + PAPA_TAP_WINDOW_MS + 50);
    expect(s.stage).toBe(1);
  });
  it('reports expired sequences as idle', () => {
    const s = tapPapa(initialPapaTap, 0);
    expect(currentStage(s, 4000)).toBe(1);
    expect(currentStage(s, 5001)).toBe(0);
  });
  it('starts a fresh sequence after completion', () => {
    let s = tapPapa(tapPapa(tapPapa(initialPapaTap, 0), 100), 200);
    expect(s.stage).toBe(3);
    s = tapPapa(s, 300);
    expect(s.stage).toBe(1);
    expect(resetPapaTap().stage).toBe(0);
  });
});

describe('time helpers', () => {
  const at = (h: number, m = 0) => new Date(2026, 0, 1, h, m);
  it('maps hours to day periods', () => {
    expect(getDayPeriod(at(6))).toBe('morning');
    expect(getDayPeriod(at(10, 59))).toBe('morning');
    expect(getDayPeriod(at(11))).toBe('afternoon');
    expect(getDayPeriod(at(16))).toBe('evening');
    expect(getDayPeriod(at(19))).toBe('night');
    expect(getDayPeriod(at(3))).toBe('night');
  });
  it('detects 12:00 and formats time', () => {
    expect(isTwelveOClock(at(12, 0))).toBe(true);
    expect(isTwelveOClock(at(0, 0))).toBe(true);
    expect(isTwelveOClock(at(12, 1))).toBe(false);
    expect(formatTime(at(15, 7))).toBe('3:07 PM');
  });
});

describe('cooldowns, tap counter, varied picks', () => {
  it('cools down by timestamp', () => {
    let now = 0;
    const c = new CooldownTracker(() => now);
    c.start('a', 1000);
    expect(c.isCooling('a')).toBe(true);
    now = 1001;
    expect(c.isCooling('a')).toBe(false);
  });
  it('counts taps in a sliding window', () => {
    let now = 0;
    const t = new TapCounter(() => now);
    expect(t.hit('x', 1000)).toBe(1);
    now = 500;
    expect(t.hit('x', 1000)).toBe(2);
    now = 1600;
    expect(t.hit('x', 1000)).toBe(1);
  });
  it('never repeats the same line twice in a row', () => {
    const list = ['a', 'b', 'c'];
    let prev = '';
    for (let i = 0; i < 200; i++) {
      const v = pickVaried('test', list);
      expect(v).not.toBe(prev);
      prev = v;
    }
  });
});

describe('InteractionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    InteractionManager.abortAll();
    useGame.setState({ ...createInitialState(), introDone: true });
  });

  const def = (id: string, target: string, priority: number, uses: ('papa' | 'kid')[], ms = 1000, cooldownMs = 0): InteractionDefinition => ({
    id,
    room: 'papa-room',
    target,
    action: id,
    uses,
    priority,
    cooldownMs,
    run: async (c) => {
      c.papa({ expr: 'surprised' });
      await c.wait(ms);
    },
  });

  it('a lesser interaction never cancels a more important one', () => {
    InteractionManager.register([def('T_BALL', 't-ball', 3, ['papa']), def('T_LAPTOP', 't-laptop', 2, ['papa'])]);
    expect(InteractionManager.trigger('t-ball')).toBe('T_BALL');
    expect(InteractionManager.trigger('t-laptop')).toBeNull();
    expect(InteractionManager.runningIds()).toContain('T_BALL');
  });

  it('a more important interaction replaces a lesser one and releases locks afterwards', async () => {
    InteractionManager.register([def('T_LOW', 't-low', 1, ['papa'], 5000), def('T_HIGH', 't-high', 3, ['papa'], 500)]);
    InteractionManager.trigger('t-low');
    expect(InteractionManager.trigger('t-high')).toBe('T_HIGH');
    expect(InteractionManager.runningIds()).toEqual(['T_HIGH']);
    await vi.advanceTimersByTimeAsync(600);
    expect(InteractionManager.isBusy('papa')).toBe(false);
    expect(getGame().characters.papa.activity).toBe('typing');
  });

  it('respects cooldowns', () => {
    InteractionManager.register([def('T_COOL', 't-cool', 1, [], 10, 2000)]);
    expect(InteractionManager.trigger('t-cool')).toBe('T_COOL');
    expect(InteractionManager.trigger('t-cool')).toBeNull();
  });

  it('every room definition has a unique event id per room', () => {
    for (const list of [papaRoomInteractions, mummyRoomInteractions]) {
      const ids = list.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('ships 30+ meaningful player interactions across both rooms', () => {
    const meaningful = [...papaRoomInteractions, ...mummyRoomInteractions].filter((d) => d.category !== 'idle');
    expect(meaningful.length).toBeGreaterThanOrEqual(40);
  });
});

describe('family memory, moments and new toys', () => {
  it('remembers repeated events and escalates at 3, 5, 8, 11...', async () => {
    const { FamilyMemory, repeatTier } = await import('./FamilyMemory');
    const { EventBus } = await import('./EventManager');
    FamilyMemory.reset();
    for (let i = 0; i < 4; i++) EventBus.emit({ type: 'TEST_REPEAT' });
    expect(FamilyMemory.count('TEST_REPEAT')).toBe(4);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 11].map(repeatTier)).toEqual([0, 0, 1, 0, 2, 0, 0, 3, 0, 3]);
  });

  it('only offers moments that fit the time of day and where the kid is', async () => {
    const { eligibleMoments } = await import('../scenes/moments');
    const base = { ...createInitialState(), introDone: true };
    const ids = (s: typeof base) => eligibleMoments(s, () => false).map((m) => m.def.id);
    // kid asleep in Mummy's room, morning → only the wake-up moment
    expect(ids({ ...base, currentRoom: 'mummy-room', dayPeriod: 'morning' })).toEqual(['MUMMY_MORNING_WAKEUP']);
    // kid awake with Mummy at night → bedtime story, never dance
    const night = ids({ ...base, currentRoom: 'mummy-room', dayPeriod: 'night', kid: { ...base.kid, awake: true, layer: 'front' } });
    expect(night).toContain('MUMMY_BEDTIME_STORY');
    expect(night).not.toContain('MUMMY_DANCE_BREAK');
    // Papa calls the kid only when he is awake in the other room
    const papa = ids({ ...base, currentRoom: 'papa-room', kid: { ...base.kid, awake: true, layer: 'front' } });
    expect(papa).toEqual(['PAPA_CALLS_KID']);
  });

  it('every new toy is reachable by a tap', () => {
    const all = [...papaRoomInteractions, ...mummyRoomInteractions];
    for (const t of ['blocks', 'car', 'bubbles']) expect(all.some((d) => d.target === t)).toBe(true);
  });
});

describe('name, outfits, puppy and stickers', () => {
  it('puts the player name into every line', async () => {
    const { withName } = await import('./DialogueManager');
    useGame.setState({ ...createInitialState(), settings: { soundEnabled: true, kidName: 'Mira' } });
    expect(withName('{name}! Come say hi to Papa!')).toBe('Mira! Come say hi to Papa!');
    useGame.setState({ ...createInitialState(), settings: { soundEnabled: true } });
    expect(withName('Hi, {name}!')).toBe('Hi, buddy!');
  });

  it('the costume chest cycles through every outfit and back', async () => {
    const { OUTFIT_ORDER } = await import('../scenes/extras');
    expect(new Set(OUTFIT_ORDER).size).toBe(OUTFIT_ORDER.length);
    expect(OUTFIT_ORDER[OUTFIT_ORDER.length - 1]).toBe('none');
  });

  it('Biscuit can be tapped in both rooms and fed in Mummy’s room', () => {
    const all = [...papaRoomInteractions, ...mummyRoomInteractions];
    expect(all.some((d) => d.room === 'papa-room' && d.target === 'pup')).toBe(true);
    expect(all.some((d) => d.room === 'mummy-room' && d.target === 'pup')).toBe(true);
    expect(all.some((d) => d.target === 'bowl')).toBe(true);
    for (const t of ['chest', 'easel', 'gift', 'artwall']) expect(all.some((d) => d.target === t)).toBe(true);
  });

  it('every sticker has a unique id', async () => {
    const { STICKERS } = await import('../components/StickerBook');
    const ids = STICKERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('kitchen', () => {
  it('has every kitchen object wired up', async () => {
    const { kitchenInteractions } = await import('../scenes/Kitchen/interactions');
    for (const t of ['fridge', 'cookies', 'fruit', 'sink', 'board', 'microwave', 'oven', 'table', 'door', 'switch', 'pup'])
      expect(kitchenInteractions.some((d) => d.target === t)).toBe(true);
    const ids = kitchenInteractions.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a snack carried to a parent wins over their other reactions', () => {
    expect(papaRoomInteractions[0].id).toBe('SNACK_GIVEN_TO_PAPA');
    expect(mummyRoomInteractions[0].id).toBe('SNACK_GIVEN_TO_MUMMY');
    const base = { ...createInitialState(), currentRoom: 'papa-room' as const };
    const holding = { ...base, kid: { ...base.kid, room: 'papa-room' as const, awake: true, holding: 'cookie' as const } };
    expect(papaRoomInteractions[0].when!(holding)).toBe(true);
    expect(papaRoomInteractions[0].when!({ ...holding, kid: { ...holding.kid, holding: 'robot' } })).toBe(false);
  });
});

describe('garden', () => {
  it('has every garden thing wired up, with unique event ids', async () => {
    const { gardenInteractions } = await import('../scenes/Garden/interactions');
    for (const t of ['digger', 'sandpit', 'can', 'plant-0', 'plant-1', 'plant-2', 'seeds', 'sprinkler', 'swing', 'tree', 'soil', 'bush', 'barrow', 'door', 'pup', 'kid'])
      expect(gardenInteractions.some((d) => d.target === t)).toBe(true);
    const ids = gardenInteractions.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a watered plant grows one stage after GROW_MS, and never past fully grown', async () => {
    const { grownPlants, GROW_MS } = await import('../state/gameStore');
    const t = 1_000_000;
    const plants = [
      { kind: 'sunflower' as const, stage: 0 as const, wateredAt: t },
      { kind: 'tomato' as const, stage: 3 as const, wateredAt: t },
      { kind: 'flower' as const, stage: 1 as const, wateredAt: null },
    ];
    expect(grownPlants(plants, t + GROW_MS - 1)).toBeNull();
    const next = grownPlants(plants, t + GROW_MS)!;
    expect(next.map((p) => p.stage)).toEqual([1, 3, 1]);
    expect(next.every((p) => p.wateredAt === null || p.kind === 'flower')).toBe(true);
  });

  it('in the garden, tapping Biscuit starts catch-me (and catches during the game)', async () => {
    const { gardenInteractions } = await import('../scenes/Garden/interactions');
    const base = createInitialState();
    const s = { ...base, currentRoom: 'garden' as const, pup: { ...base.pup, room: 'garden' as const, pose: 'sit' as const } };
    const start = gardenInteractions.find((d) => d.id === 'CATCH_ME_STARTED')!;
    const tap = gardenInteractions.find((d) => d.id === 'CATCH_TAP')!;
    expect(start.when!(s)).toBe(true);
    expect(tap.when!(s)).toBe(false);
    const chasing = { ...s, fx: { 'garden:chase': 'run' } };
    expect(start.when!(chasing)).toBe(false);
    expect(tap.when!(chasing)).toBe(true);
    // the catch tap comes before the starter, so it wins while a game is running
    expect(gardenInteractions.indexOf(tap)).toBeLessThan(gardenInteractions.indexOf(start));
  });
});

describe('hide-and-seek', () => {
  it('every room has at least two hiding spots with unique ids', async () => {
    const { spotsIn } = await import('../scenes/hideSeek');
    for (const room of ['papa-room', 'mummy-room', 'kitchen', 'garden'] as const) {
      const ids = spotsIn(room).map((s) => s.id);
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('a giggle only gives the kid away while he is hiding', async () => {
    const { giggleDefs, tailFoundDefs } = await import('../scenes/hideSeek');
    const base = createInitialState();
    const papaGiggle = giggleDefs.find((d) => d.room === 'papa-room')!;
    expect(papaGiggle.when!({ ...base, fx: {} })).toBe(false);
    expect(papaGiggle.when!({ ...base, fx: { 'hs:hidden': 'sofa' } })).toBe(true);
    const tail = tailFoundDefs.find((d) => d.room === 'papa-room')!;
    expect(tail.when!({ ...base, pup: { ...base.pup, pose: 'hide' }, fx: { 'hs:pupHidden': 'desk' } })).toBe(true);
    expect(tail.when!(base)).toBe(false);
  });
});

describe('boy/girl words', () => {
  it('swaps every gendered word and never leaves a {token} behind', async () => {
    const { withName } = await import('./DialogueManager');
    const dlg = await import('../data/dialogues');
    const all: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === 'string') all.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk([dlg.PAPA, dlg.MUMMY, dlg.KID, dlg.REMEMBER, dlg.MOMENTS, dlg.STORIES, dlg.TOYS]);
    for (const gender of ['boy', 'girl'] as const) {
      useGame.setState({ ...createInitialState(), settings: { soundEnabled: true, kidName: 'Sam', kidGender: gender } });
      // {n} and {place} are filled in by the interaction itself before the bubble is shown
      for (const line of all) expect(withName(line).replace(/\{(n|place)\}/g, '')).not.toMatch(/[{}]/);
    }
    useGame.setState({ ...createInitialState(), settings: { soundEnabled: true, kidGender: 'girl' } });
    expect(withName('Good {boy}! Is {he} hiding?')).toBe('Good girl! Is she hiding?');
  });
});
