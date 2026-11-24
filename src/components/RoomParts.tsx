import { memo, type ReactNode } from 'react';
import type { DayPeriod } from '../state/gameTypes';
import { OUTLINE } from '../data/characters';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

// ---------------------------------------------------------------- room shell
interface ShellProps {
  id: string;
  wall: string;
  wallDeep: string;
  wainscot: string;
  pattern: 'leaf' | 'dots';
  patternColor: string;
}

/** Walls, ceiling trim, wainscot, skirting and the shared oak floor used by every room. */
export const RoomShell = memo(function RoomShell({ id, wall, wallDeep, wainscot, pattern, patternColor }: ShellProps) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wallDeep} />
          <stop offset="0.35" stopColor={wall} />
          <stop offset="1" stopColor={wall} />
        </linearGradient>
        <pattern id={`${id}-pat`} width="64" height="64" patternUnits="userSpaceOnUse">
          {pattern === 'leaf' ? (
            <path d="M 16 20 q 8 -12 16 0 q -8 12 -16 0 Z M 48 52 q 8 -12 16 0 q -8 12 -16 0 Z" fill={patternColor} />
          ) : (
            <g fill={patternColor}>
              <circle cx="16" cy="16" r="4" />
              <circle cx="48" cy="48" r="4" />
              <path d="M 48 12 l 3 6 l 6 1 l -5 4 l 1 6 l -5 -3 l -5 3 l 1 -6 l -5 -4 l 6 -1 Z" />
            </g>
          )}
        </pattern>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b97c4b" />
          <stop offset="1" stopColor="#d29a64" />
        </linearGradient>
        <linearGradient id={`${id}-shadowTop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2414" stopOpacity="0.28" />
          <stop offset="1" stopColor="#3b2414" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1440} height={650} fill={`url(#${id}-wall)`} />
      <rect x={0} y={30} width={1440} height={420} fill={`url(#${id}-pat)`} opacity={0.55} />
      {/* wainscot */}
      <rect x={0} y={452} width={1440} height={182} fill={wainscot} />
      <rect x={0} y={446} width={1440} height={12} fill="#fff6ea" stroke={OUTLINE} strokeWidth={2} />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={i * 82 + 14} y={474} width={62} height={138} rx={6} fill="none" stroke="#000" strokeOpacity={0.07} strokeWidth={3} />
      ))}
      {/* crown molding */}
      <rect x={0} y={0} width={1440} height={26} fill="#fff4e4" />
      <rect x={0} y={24} width={1440} height={8} fill="#ead8bf" />
      {/* floor */}
      <rect x={0} y={640} width={1440} height={170} fill={`url(#${id}-floor)`} />
      {[668, 702, 742, 790].map((y, i) => (
        <line key={y} x1={0} y1={y} x2={1440} y2={y} stroke="#9c6539" strokeWidth={2} opacity={0.45 - i * 0.05} />
      ))}
      {[[120, 640, 668], [430, 640, 668], [780, 640, 668], [1130, 640, 668], [260, 668, 702], [640, 668, 702], [980, 668, 702], [1330, 668, 702], [90, 702, 742], [520, 702, 742], [880, 702, 742], [1250, 702, 742], [300, 742, 790], [700, 742, 790], [1100, 742, 790]].map(([x, a, b]) => (
        <line key={`${x}-${a}`} x1={x} y1={a} x2={x} y2={b} stroke="#9c6539" strokeWidth={2} opacity={0.35} />
      ))}
      <rect x={0} y={640} width={1440} height={40} fill={`url(#${id}-shadowTop)`} />
      {/* skirting */}
      <rect x={0} y={626} width={1440} height={20} fill="#fff6ea" stroke={OUTLINE} strokeWidth={2} />
    </g>
  );
});

// ---------------------------------------------------------------- window
const SKY: Record<DayPeriod, [string, string]> = {
  morning: ['#9fd8f5', '#fff1cf'],
  afternoon: ['#6fc0f0', '#c9ecff'],
  evening: ['#f39a6b', '#ffd59e'],
  night: ['#1d2650', '#3b4a85'],
};

export const WindowView = memo(function WindowView({ id, x, y, w, h, period, open }: { id: string; x: number; y: number; w: number; h: number; period: DayPeriod; open: boolean }) {
  const [top, bottom] = SKY[period];
  const night = period === 'night';
  const sashW = w / 2 - 10;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} style={{ transition: 'stop-color 2s' }} />
          <stop offset="1" stopColor={bottom} style={{ transition: 'stop-color 2s' }} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} />
        </clipPath>
      </defs>
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={8} fill="#fffaf2" {...S} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
        {night ? (
          <g>
            <circle cx={x + w * 0.72} cy={y + h * 0.28} r={26} fill="#fff6d8" />
            <circle cx={x + w * 0.72 + 11} cy={y + h * 0.28 - 7} r={22} fill={top} />
            {[[0.15, 0.2], [0.3, 0.12], [0.45, 0.3], [0.2, 0.45], [0.58, 0.15], [0.88, 0.5], [0.38, 0.5]].map(([a, b], i) => (
              <circle key={i} className="twinkle" style={{ animationDelay: `${i * 0.7}s` }} cx={x + w * a} cy={y + h * b} r={2.4} fill="#fff" />
            ))}
          </g>
        ) : (
          <g>
            <circle cx={x + w * (period === 'morning' ? 0.25 : period === 'evening' ? 0.78 : 0.6)} cy={y + h * (period === 'afternoon' ? 0.22 : 0.48)} r={30} fill={period === 'evening' ? '#ffb347' : '#ffe066'} opacity={0.95} />
            <g className="cloud-drift">
              <path d={`M ${x + 30} ${y + 90} q 10 -24 34 -14 q 14 -20 36 -4 q 22 -2 20 18 Z`} fill="#fff" opacity={0.9} />
              <path d={`M ${x + w - 120} ${y + 60} q 8 -18 26 -10 q 12 -16 28 -2 q 18 0 16 14 Z`} fill="#fff" opacity={0.8} />
            </g>
          </g>
        )}
        {/* distant neighbourhood */}
        <path d={`M ${x} ${y + h - 50} q 40 -40 80 -10 q 40 -50 90 -5 q 50 -40 100 0 q 40 -30 ${w} 0 L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={night ? '#26315c' : '#7fbf7a'} />
        <rect x={x + w * 0.55} y={y + h - 95} width={60} height={60} fill={night ? '#30396a' : '#f2c9a0'} />
        <path d={`M ${x + w * 0.55 - 8} ${y + h - 95} L ${x + w * 0.55 + 30} ${y + h - 125} L ${x + w * 0.55 + 68} ${y + h - 95} Z`} fill={night ? '#3a2f55' : '#d9665b'} />
        <rect x={x + w * 0.55 + 22} y={y + h - 80} width={16} height={16} fill={night ? '#ffe08a' : '#bfe3f5'} />
        <g className="tree-sway" style={{ transformOrigin: `${x + 40}px ${y + h}px` }}>
          <rect x={x + 34} y={y + h - 80} width={12} height={80} fill={night ? '#2c2440' : '#8b5a3c'} />
          <circle cx={x + 40} cy={y + h - 95} r={34} fill={night ? '#22403b' : '#5aa65a'} />
          <circle cx={x + 64} cy={y + h - 80} r={22} fill={night ? '#22403b' : '#6cb86a'} />
        </g>
        {!night && (
          <g className="bird-fly">
            <path d={`M ${x - 40} ${y + 60} q 8 -8 14 0 q 6 -8 14 0`} fill="none" stroke="#3d3d3d" strokeWidth={2.5} />
          </g>
        )}
      </g>
      {/* sashes */}
      <g style={{ transformOrigin: `${x + 10}px ${y}px`, transform: open ? 'scaleX(0.25)' : 'none', transition: 'transform 600ms ease' }}>
        <rect x={x + 10} y={y + 10} width={sashW} height={h - 20} fill="#cdeaff" fillOpacity={0.15} stroke="#fffaf2" strokeWidth={10} />
        <line x1={x + 10} y1={y + h / 2} x2={x + 10 + sashW} y2={y + h / 2} stroke="#fffaf2" strokeWidth={8} />
        <path d={`M ${x + 30} ${y + 40} l 30 -20 M ${x + 30} ${y + 62} l 50 -34`} stroke="#fff" strokeWidth={5} opacity={0.45} />
      </g>
      <g style={{ transformOrigin: `${x + w - 10}px ${y}px`, transform: open ? 'scaleX(0.25)' : 'none', transition: 'transform 600ms ease' }}>
        <rect x={x + w - 10 - sashW} y={y + 10} width={sashW} height={h - 20} fill="#cdeaff" fillOpacity={0.15} stroke="#fffaf2" strokeWidth={10} />
        <line x1={x + w - 10 - sashW} y1={y + h / 2} x2={x + w - 10} y2={y + h / 2} stroke="#fffaf2" strokeWidth={8} />
      </g>
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} fill="none" stroke={OUTLINE} strokeWidth={2} />
      <rect x={x - 18} y={y + h + 4} width={w + 36} height={16} rx={4} fill="#fff6ea" {...S} />
    </g>
  );
});

// ---------------------------------------------------------------- curtains
export const Curtains = memo(function Curtains({ x, y, w, h, open, color, colorDark, windy }: { x: number; y: number; w: number; h: number; open: boolean; color: string; colorDark: string; windy?: boolean }) {
  const panel = (side: -1 | 1) => {
    const px = side === -1 ? x : x + w / 2;
    const origin = side === -1 ? `${x}px ${y}px` : `${x + w}px ${y}px`;
    const folds = [0.2, 0.45, 0.7];
    return (
      <g style={{ transformOrigin: origin, transform: open ? 'scaleX(0.3)' : 'scaleX(1)', transition: 'transform 700ms cubic-bezier(.5,.1,.3,1)' }}>
        <g className={windy ? 'curtain-windy' : 'curtain-sway'} style={{ transformOrigin: origin, animationDelay: side === 1 ? '1.2s' : '0s' }}>
          <path d={`M ${px} ${y} L ${px + w / 2} ${y} L ${px + w / 2 + side * 0} ${y + h} Q ${px + w / 4} ${y + h + 14} ${px} ${y + h} Z`} fill={color} {...S} />
          {folds.map((f) => (
            <path key={f} d={`M ${px + (w / 2) * f} ${y + 6} Q ${px + (w / 2) * f + 6} ${y + h / 2} ${px + (w / 2) * f} ${y + h - 4}`} stroke={colorDark} strokeWidth={6} fill="none" opacity={0.55} />
          ))}
        </g>
      </g>
    );
  };
  return (
    <g>
      {panel(-1)}
      {panel(1)}
      <rect x={x - 26} y={y - 12} width={w + 52} height={10} rx={5} fill="#a8774f" {...S} />
      <circle cx={x - 28} cy={y - 7} r={9} fill="#a8774f" {...S} />
      <circle cx={x + w + 28} cy={y - 7} r={9} fill="#a8774f" {...S} />
    </g>
  );
});

// ---------------------------------------------------------------- ceiling fan
export const CeilingFan = memo(function CeilingFan({ x, speed }: { x: number; speed: 0 | 1 | 2 }) {
  const cls = speed === 0 ? '' : speed === 1 ? 'fan-slow' : 'fan-fast';
  return (
    <g>
      <rect x={x - 5} y={20} width={10} height={40} fill="#d7c5ad" {...S} />
      <g transform={`translate(${x} 74) scale(1 0.2)`}>
        <g className={cls}>
          {[0, 90, 180, 270].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M 10 -12 Q 110 -26 130 0 Q 110 26 10 12 Z" fill="#f5ead8" stroke={OUTLINE} strokeWidth={8} />
          ))}
        </g>
      </g>
      <path d={`M ${x - 26} 60 Q ${x} 50 ${x + 26} 60 L ${x + 22} 82 Q ${x} 90 ${x - 22} 82 Z`} fill="#c89b6a" {...S} />
      <ellipse cx={x} cy={92} rx={14} ry={10} fill="#fff3c4" {...S} />
    </g>
  );
});

// ---------------------------------------------------------------- plants
export const Plant = memo(function Plant({ x, y, s = 1, pot = '#d9785a' }: { x: number; y: number; s?: number; pot?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={44} ry={8} fill="#000" opacity={0.12} />
      <g className="plant-sway" style={{ transformOrigin: '0px -70px' }}>
        {[[-60, -150, -16], [-30, -190, -4], [10, -200, 6], [44, -160, 16], [62, -110, 26], [-62, -100, -24], [20, -130, 4], [-20, -140, -6]].map(([lx, ly, rot], i) => (
          <g key={i}>
            <path d={`M 0 -70 Q ${lx * 0.5} ${(ly - 70) / 2} ${lx} ${ly}`} stroke="#3f7d45" strokeWidth={4} fill="none" />
            <ellipse cx={lx} cy={ly} rx={14} ry={30} transform={`rotate(${rot + (lx > 0 ? 40 : -40)} ${lx} ${ly})`} fill={i % 2 ? '#5fae5c' : '#4d9a50'} {...S} strokeWidth={2.5} />
            <path d={`M ${lx} ${ly - 22} L ${lx} ${ly + 22}`} transform={`rotate(${rot + (lx > 0 ? 40 : -40)} ${lx} ${ly})`} stroke="#3f7d45" strokeWidth={2} />
          </g>
        ))}
      </g>
      <path d="M -40 -76 L 40 -76 L 32 0 L -32 0 Z" fill={pot} {...S} />
      <rect x={-44} y={-84} width={88} height={14} rx={5} fill={pot} {...S} />
      <path d="M -30 -50 Q 0 -40 30 -50" stroke="#fff" strokeOpacity={0.35} strokeWidth={4} fill="none" />
    </g>
  );
});

// ---------------------------------------------------------------- misc wall bits
export const LightSwitch = ({ x, y, on }: { x: number; y: number; on: boolean }) => (
  <g>
    <rect x={x} y={y} width={30} height={46} rx={6} fill="#fffdf8" {...S} />
    <rect x={x + 9} y={y + 10} width={12} height={26} rx={4} fill="#e8e2d6" stroke={OUTLINE} strokeWidth={2} />
    <rect x={x + 10} y={on ? y + 11 : y + 23} width={10} height={12} rx={3} fill={on ? '#ffd34d' : '#9aa0a8'} style={{ transition: 'y 150ms' }} />
  </g>
);

export const Frame = ({ x, y, w, h, color = '#b8834f', children, mat = '#fff8ec' }: { x: number; y: number; w: number; h: number; color?: string; mat?: string; children?: ReactNode }) => (
  <g>
    <rect x={x + 4} y={y + 6} width={w} height={h} rx={4} fill="#000" opacity={0.1} />
    <rect x={x} y={y} width={w} height={h} rx={4} fill={color} {...S} />
    <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} fill={mat} stroke={OUTLINE} strokeWidth={1.5} />
    <svg x={x + 12} y={y + 12} width={w - 24} height={h - 24} viewBox={`0 0 ${w - 24} ${h - 24}`} overflow="hidden">
      {children}
    </svg>
  </g>
);

export const Outlet = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x} y={y} width={26} height={34} rx={5} fill="#fffdf8" {...S} strokeWidth={2} />
    <rect x={x + 8} y={y + 8} width={3} height={8} fill={OUTLINE} />
    <rect x={x + 15} y={y + 8} width={3} height={8} fill={OUTLINE} />
    <circle cx={x + 13} cy={y + 24} r={2.5} fill={OUTLINE} />
  </g>
);

/** Little family portrait used in frames (the same three characters, simplified). */
export const FamilyMini = ({ w, h, beach = false }: { w: number; h: number; beach?: boolean }) => (
  <g>
    <rect width={w} height={h} fill={beach ? '#9fd8f5' : '#ffe9c7'} />
    {beach && <rect y={h * 0.62} width={w} height={h * 0.38} fill="#f3d58b" />}
    {beach && <rect y={h * 0.55} width={w} height={h * 0.1} fill="#5fb3e0" />}
    {[[w * 0.3, h * 0.42, '#c68a63', '#3c7fae', 0.16], [w * 0.7, h * 0.44, '#d49a72', '#e2705c', 0.15], [w * 0.5, h * 0.62, '#d9a179', '#f5c343', 0.12]].map(([cx, cy, skin, shirt, rr], i) => (
      <g key={i}>
        <rect x={(cx as number) - w * (rr as number)} y={(cy as number) + h * 0.08} width={w * (rr as number) * 2} height={h} rx={10} fill={shirt as string} />
        <circle cx={cx as number} cy={cy as number} r={w * (rr as number)} fill={skin as string} />
        <path d={`M ${(cx as number) - w * (rr as number)} ${cy} q ${w * (rr as number)} -${w * (rr as number) * 1.6} ${w * (rr as number) * 2} 0`} fill="#2a201c" />
        <path d={`M ${(cx as number) - 5} ${(cy as number) + 5} q 5 5 10 0`} stroke="#5a3b2a" strokeWidth={2} fill="none" />
      </g>
    ))}
  </g>
);
