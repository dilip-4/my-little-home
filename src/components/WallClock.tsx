import { memo } from 'react';
import { useClock } from '../engine/clock';
import { OUTLINE } from '../data/characters';

/** Analog wall clock showing the device's real local time. Hands move every second. */
export const WallClock = memo(function WallClock({ x, y, r = 46, rim = '#e9a23b', face = '#fffaf0', cuckoo = false }: { x: number; y: number; r?: number; rim?: string; face?: string; cuckoo?: boolean }) {
  const now = useClock((s) => s.now);
  const d = new Date(now);
  const sec = d.getSeconds();
  const min = d.getMinutes() + sec / 60;
  const hr = (d.getHours() % 12) + min / 60;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={4} cy={r + 10} rx={r * 0.8} ry={6} fill="#000" opacity={0.08} />
      <circle r={r + 7} fill={rim} stroke={OUTLINE} strokeWidth={3} />
      <circle r={r} fill={face} stroke={OUTLINE} strokeWidth={2} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        const big = i % 3 === 0;
        return (
          <line key={i} x1={Math.sin(a) * (r - (big ? 12 : 8))} y1={-Math.cos(a) * (r - (big ? 12 : 8))} x2={Math.sin(a) * (r - 4)} y2={-Math.cos(a) * (r - 4)} stroke={OUTLINE} strokeWidth={big ? 4 : 2} strokeLinecap="round" />
        );
      })}
      <line x1={0} y1={6} x2={0} y2={-r * 0.5} stroke={OUTLINE} strokeWidth={6} strokeLinecap="round" transform={`rotate(${hr * 30})`} />
      <line x1={0} y1={8} x2={0} y2={-r * 0.75} stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" transform={`rotate(${min * 6})`} />
      <line x1={0} y1={10} x2={0} y2={-r * 0.82} stroke="#e0533d" strokeWidth={2} strokeLinecap="round" transform={`rotate(${sec * 6})`} />
      <circle r={5} fill="#e0533d" stroke={OUTLINE} strokeWidth={1.5} />
      {cuckoo && (
        <g transform={`translate(0 ${-r - 6})`}><g className="cuckoo-pop">
          <ellipse cx={0} cy={-14} rx={14} ry={11} fill="#7dc4e4" stroke={OUTLINE} strokeWidth={2.5} />
          <circle cx={8} cy={-24} r={8} fill="#7dc4e4" stroke={OUTLINE} strokeWidth={2.5} />
          <path d="M 15 -25 L 24 -22 L 15 -19 Z" fill="#f2a23c" stroke={OUTLINE} strokeWidth={1.5} />
          <circle cx={10} cy={-26} r={1.8} fill={OUTLINE} />
        </g></g>
      )}
    </g>
  );
});
