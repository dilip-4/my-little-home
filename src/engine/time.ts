import type { DayPeriod } from '../state/gameTypes';

/** Morning 6–11, Afternoon 11–16, Evening 16–19, Night 19–6 (local device time). */
export function getDayPeriod(d: Date): DayPeriod {
  const h = d.getHours();
  if (h >= 6 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'afternoon';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

export function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function isTwelveOClock(d: Date): boolean {
  return (d.getHours() === 12 || d.getHours() === 0) && d.getMinutes() === 0;
}
