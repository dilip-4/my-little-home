import { create } from 'zustand';
import { getDayPeriod } from './time';
import { getGame } from '../state/gameStore';

/** Real local time, updated every second. Kept outside the main store to avoid re-rendering the world. */
export const useClock = create<{ now: number }>(() => ({ now: Date.now() }));

let timer: ReturnType<typeof setInterval> | undefined;
export function startClock() {
  if (timer) return () => {};
  const tick = () => {
    const d = new Date();
    useClock.setState({ now: d.getTime() });
    getGame().setDayPeriod(getDayPeriod(d));
  };
  tick();
  // align to the next whole second so the second hand ticks crisply
  const align = setTimeout(() => {
    tick();
    timer = setInterval(tick, 1000);
  }, 1000 - (Date.now() % 1000));
  return () => {
    clearTimeout(align);
    clearInterval(timer);
    timer = undefined;
  };
}
