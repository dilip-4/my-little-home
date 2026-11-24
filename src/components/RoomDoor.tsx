import { memo, type ReactNode } from 'react';
import { OUTLINE } from '../data/characters';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const };

/** A real door in the wall: frame, panel, knob and a little sign. Opens from its hinge side. */
export const RoomDoor = memo(function RoomDoor({ x, y, w, h, hinge, open, color, sign, peekLight }: { x: number; y: number; w: number; h: number; hinge: 'left' | 'right'; open: boolean; color: string; sign?: ReactNode; peekLight: string }) {
  const hx = hinge === 'left' ? x : x + w;
  const knobX = hinge === 'left' ? x + w - 22 : x + 22;
  return (
    <g>
      {/* frame + opening (seen when the door swings) */}
      <rect x={x - 14} y={y - 14} width={w + 28} height={h + 14} rx={4} fill="#fff6ea" {...S} />
      <rect x={x} y={y} width={w} height={h} fill="#4a3226" />
      <rect x={x} y={y} width={w} height={h} fill={peekLight} opacity={0.55} />
      <path d={`M ${x} ${y + h} L ${x + w} ${y + h} L ${x + w - 18} ${y + h - 20} L ${x + 18} ${y + h - 20} Z`} fill="#b97c4b" opacity={0.5} />
      {/* light leaking under the door */}
      <rect x={x + 6} y={y + h - 4} width={w - 12} height={4} fill="#ffe9a8" opacity={open ? 0 : 0.7} />
      <g style={{ transformOrigin: `${hx}px ${y}px`, transform: open ? 'scaleX(0.16) skewY(4deg)' : 'none', transition: 'transform 420ms cubic-bezier(.5,.1,.3,1)' }}>
        <rect x={x} y={y} width={w} height={h} rx={3} fill={color} {...S} />
        <rect x={x + 18} y={y + 22} width={w - 36} height={h * 0.36} rx={6} fill="none" stroke="#000" strokeOpacity={0.14} strokeWidth={4} />
        <rect x={x + 18} y={y + h * 0.48} width={w - 36} height={h * 0.44} rx={6} fill="none" stroke="#000" strokeOpacity={0.14} strokeWidth={4} />
        <circle cx={knobX} cy={y + h * 0.52} r={9} fill="#f0c44c" {...S} />
        <rect x={knobX - 4} y={y + h * 0.52 + 12} width={8} height={12} rx={3} fill="#d9a836" stroke={OUTLINE} strokeWidth={2} />
        {sign}
      </g>
    </g>
  );
});
