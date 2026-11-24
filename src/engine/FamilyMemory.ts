import { EventBus } from './EventManager';

/**
 * What the family remembers about this play session. Every interaction already emits its unique
 * event id on the EventBus; this just counts them so parents can react differently the first,
 * third or tenth time something happens ("Third time today you hid my mouse!").
 */
const counts = new Map<string, number>();
const lastAt = new Map<string, number>();

EventBus.on((e) => {
  counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  lastAt.set(e.type, Date.now());
});

export const FamilyMemory = {
  count(id: string): number {
    return counts.get(id) ?? 0;
  },
  /** ms since the event last happened (Infinity if never). */
  since(id: string): number {
    const t = lastAt.get(id);
    return t ? Date.now() - t : Infinity;
  },
  reset() {
    counts.clear();
    lastAt.clear();
  },
};

/**
 * Which repeat counts earn a "remembering" reaction: the 3rd and 5th time, then every third time.
 * Returns the tier (0 = normal line, 1 = noticed, 2 = exasperated-but-loving, 3 = running joke).
 */
export function repeatTier(n: number): 0 | 1 | 2 | 3 {
  if (n === 3) return 1;
  if (n === 5) return 2;
  if (n >= 8 && (n - 8) % 3 === 0) return 3;
  return 0;
}
