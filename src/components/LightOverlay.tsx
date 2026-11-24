import { memo } from 'react';
import type { DayPeriod } from '../state/gameTypes';

export interface Glow {
  x: number;
  y: number;
  r: number;
}

/** Ambient darkness from the real time of day + room light state, with soft holes where lamps glow. */
export function ambientDarkness(period: DayPeriod, lightOn: boolean, curtainsOpen: boolean): number {
  if (lightOn) return period === 'night' ? 0.16 : period === 'evening' ? 0.08 : 0;
  const daylight = curtainsOpen ? 1 : 0.6;
  switch (period) {
    case 'morning':
    case 'afternoon':
      return 0.5 + (1 - daylight) * 0.18;
    case 'evening':
      return 0.62;
    default:
      return 0.74;
  }
}

export const LightOverlay = memo(function LightOverlay({ id, darkness, period, glows, windowRect, curtainsOpen }: { id: string; darkness: number; period: DayPeriod; glows: Glow[]; windowRect: { x: number; y: number; w: number; h: number }; curtainsOpen: boolean }) {
  const tint = period === 'night' ? '#0e1230' : period === 'evening' ? '#2a1430' : '#141026';
  const sunny = (period === 'morning' || period === 'afternoon') && curtainsOpen;
  const warm = period === 'evening' && curtainsOpen;
  const { x, y, w, h } = windowRect;
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-hole`}>
          <stop offset="0" stopColor="#000" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.85" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-warm`}>
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={warm ? '#ffc27a' : '#fff6d0'} stopOpacity="0.22" />
          <stop offset="1" stopColor={warm ? '#ffc27a' : '#fff6d0'} stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect x={0} y={0} width={1440} height={810} fill="#fff" />
          {glows.map((g, i) => (
            <circle key={i} cx={g.x} cy={g.y} r={g.r} fill={`url(#${id}-hole)`} />
          ))}
          {/* the window always lets a little light in during the day */}
          {curtainsOpen && period !== 'night' && <rect x={x} y={y} width={w} height={h} fill="#000" opacity={0.8} />}
        </mask>
      </defs>
      {(sunny || warm) && (
        <polygon className="sunbeam" points={`${x + 10},${y + h} ${x + w - 10},${y + h} ${x + w + 140},810 ${x + 60},810`} fill={`url(#${id}-beam)`} />
      )}
      <rect x={0} y={0} width={1440} height={810} fill={tint} mask={`url(#${id}-mask)`} style={{ opacity: darkness, transition: 'opacity 600ms ease' }} />
      {glows.map((g, i) => (
        <circle key={i} cx={g.x} cy={g.y} r={g.r * 0.9} fill={`url(#${id}-warm)`} style={{ mixBlendMode: 'screen', opacity: Math.min(1, 0.25 + darkness * 1.4), transition: 'opacity 600ms' }} />
      ))}
    </g>
  );
});
