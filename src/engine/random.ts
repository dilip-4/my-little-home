/** Picks a random entry while avoiding the previously picked one for the same key. */
const last = new Map<string, number>();
export function pickVaried<T>(key: string, list: readonly T[], rand: () => number = Math.random): T {
  if (list.length === 0) throw new Error('empty list for ' + key);
  if (list.length === 1) return list[0];
  const prev = last.get(key);
  let i = Math.floor(rand() * list.length);
  if (i === prev) i = (i + 1 + Math.floor(rand() * (list.length - 1))) % list.length;
  last.set(key, i);
  return list[i];
}
export const randBetween = (a: number, b: number) => a + Math.random() * (b - a);
