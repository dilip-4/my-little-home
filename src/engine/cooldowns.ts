/** Tracks per-key cooldowns using timestamps. */
export class CooldownTracker {
  private until = new Map<string, number>();
  constructor(private now: () => number = () => Date.now()) {}
  isCooling(key: string): boolean {
    return (this.until.get(key) ?? 0) > this.now();
  }
  start(key: string, ms: number) {
    if (ms > 0) this.until.set(key, this.now() + ms);
  }
  remaining(key: string): number {
    return Math.max(0, (this.until.get(key) ?? 0) - this.now());
  }
  clear() {
    this.until.clear();
  }
}

/** Counts rapid taps in a sliding window (used for easter eggs). */
export class TapCounter {
  private taps = new Map<string, number[]>();
  constructor(private now: () => number = () => Date.now()) {}
  hit(key: string, windowMs: number): number {
    const t = this.now();
    const list = (this.taps.get(key) ?? []).filter((x) => t - x <= windowMs);
    list.push(t);
    this.taps.set(key, list);
    return list.length;
  }
  reset(key: string) {
    this.taps.delete(key);
  }
}
