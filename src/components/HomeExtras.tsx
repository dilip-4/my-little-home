import { memo, useMemo } from 'react';
import { useGame } from '../state/gameStore';
import { OUTLINE } from '../data/characters';
import { latestDrawing } from './drawingStore';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** The newest drawing (re-read whenever a new one is hung up). */
function useLatestDrawing() {
  const v = useGame((s) => s.drawingVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => latestDrawing(), [v]);
}

/** Small wooden easel with crayons; shows the latest drawing on its paper. */
export const Easel = memo(function Easel({ x, y }: { x: number; y: number }) {
  const art = useLatestDrawing();
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M -26 20 L -8 -120 M 26 20 L 8 -120 M 0 -120 L 0 24" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" />
      <path d="M -26 20 L -8 -120 M 26 20 L 8 -120 M 0 -120 L 0 24" stroke="#c48a56" strokeWidth={5} strokeLinecap="round" />
      <rect x={-32} y={-118} width={64} height={52} rx={3} fill="#fffdf7" {...S} />
      {art ? (
        <image href={art} x={-28} y={-114} width={56} height={44} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <g>
          <path d="M -18 -86 q 10 -16 20 0 t 20 0" stroke="#e2483f" strokeWidth={3} fill="none" strokeLinecap="round" />
          <circle cx={14} cy={-104} r={6} fill="#ffd23f" />
        </g>
      )}
      <rect x={-34} y={-66} width={68} height={8} rx={3} fill="#a66d3f" {...S} strokeWidth={2} />
      {['#e2483f', '#4fb0e8', '#6fbf4a', '#ffd23f'].map((c, i) => (
        <rect key={c} x={-26 + i * 14} y={-74} width={8} height={10} rx={2} fill={c} stroke={OUTLINE} strokeWidth={1.5} />
      ))}
    </g>
  );
});

/** Picture frame on Papa's wall: the kid's own art (or an inviting empty frame). */
export const ArtFrame = memo(function ArtFrame({ x, y, w, h, glow }: { x: number; y: number; w: number; h: number; glow: boolean }) {
  const art = useLatestDrawing();
  return (
    <g className={glow ? 'photo-zoom' : undefined} style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}>
      <line x1={x + w / 2} y1={y - 14} x2={x + 10} y2={y + 4} stroke={OUTLINE} strokeWidth={2} />
      <line x1={x + w / 2} y1={y - 14} x2={x + w - 10} y2={y + 4} stroke={OUTLINE} strokeWidth={2} />
      <circle cx={x + w / 2} cy={y - 14} r={4} fill={OUTLINE} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#ff9f43" {...S} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} fill="#fffdf7" stroke={OUTLINE} strokeWidth={2} />
      {art ? (
        <image href={art} x={x + 8} y={y + 8} width={w - 16} height={h - 16} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <g>
          <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} fill="none" stroke="#d8c3ae" strokeWidth={3} strokeDasharray="8 6" />
          <path d={`M ${x + w / 2 - 14} ${y + h / 2 + 12} L ${x + w / 2 - 6} ${y + h / 2 - 4} L ${x + w / 2 + 14} ${y + h / 2 - 24} L ${x + w / 2 + 20} ${y + h / 2 - 18} L ${x + w / 2} ${y + h / 2 + 2} Z`} fill="#e2483f" {...S} strokeWidth={2} />
        </g>
      )}
      {/* little star sticker on the corner */}
      <path transform={`translate(${x + w - 6} ${y + 6}) scale(0.8)`} d="M 0 -12 L 3.5 -4 L 12 -3.5 L 5.5 2.5 L 7.5 11 L 0 6.5 L -7.5 11 L -5.5 2.5 L -12 -3.5 L -3.5 -4 Z" fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
    </g>
  );
});

/** Today's surprise box (bounces gently to be noticed). */
export const GiftBox = memo(function GiftBox({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={2} rx={40} ry={7} fill="#000" opacity={0.14} />
      <g className={open ? undefined : 'gift-bounce'}>
        <rect x={-32} y={-54} width={64} height={54} rx={5} fill="#9b7bff" {...S} />
        <rect x={-7} y={-54} width={14} height={54} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
        <g style={{ transform: open ? 'translate(18px, -40px) rotate(28deg)' : 'none', transition: 'transform 400ms cubic-bezier(.3,1.6,.5,1)' }}>
          <rect x={-38} y={-70} width={76} height={18} rx={5} fill="#b59dff" {...S} />
          <rect x={-7} y={-70} width={14} height={18} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
          <path d="M 0 -70 C -22 -94 -34 -70 0 -70 C 34 -70 22 -94 0 -70 Z" fill="#ffd23f" {...S} />
        </g>
      </g>
    </g>
  );
});

/** Biscuit's food bowl (full when just filled). */
export const DogBowl = ({ x, y, full }: { x: number; y: number; full: boolean }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={0} rx={34} ry={6} fill="#000" opacity={0.13} />
    {full && (
      <g>
        {[-16, -6, 4, 14, -10, 0, 10].map((dx, i) => (
          <circle key={i} cx={dx} cy={i < 4 ? -20 : -25} r={5} fill="#a0612f" stroke={OUTLINE} strokeWidth={1.5} />
        ))}
      </g>
    )}
    <path d="M -30 -20 L 30 -20 L 24 0 L -24 0 Z" fill="#e2483f" {...S} />
    <ellipse cx={0} cy={-20} rx={30} ry={6} fill="#ff8a7a" stroke={OUTLINE} strokeWidth={2.5} />
    <path d="M -8 -10 c -3 -4 3 -6 4 -2 c 1 -4 7 -2 4 2 l -4 4 Z" fill="#fff" />
  </g>
);

/** Costume chest with a cape poking out. */
export const CostumeChest = ({ x, y, open }: { x: number; y: number; open: boolean }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={0} rx={62} ry={8} fill="#000" opacity={0.14} />
    <rect x={-56} y={-62} width={112} height={62} rx={8} fill="#c9566a" {...S} />
    <path d="M -56 -40 L 56 -40" stroke="#a8435a" strokeWidth={4} />
    {[-30, 0, 30].map((dx) => (
      <circle key={dx} cx={dx} cy={-20} r={6} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
    ))}
    {!open && <path d="M 24 -62 Q 36 -54 30 -40" fill="#e2483f" {...S} strokeWidth={2.5} />}
    <g style={{ transform: open ? 'translate(-56px, -62px) rotate(-70deg) translate(56px, 62px)' : 'none', transition: 'transform 350ms cubic-bezier(.3,1.5,.5,1)' }}>
      <path d="M -60 -62 Q -60 -88 0 -88 Q 60 -88 60 -62 Z" fill="#d9677c" {...S} />
      <rect x={-10} y={-72} width={20} height={14} rx={3} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
    </g>
    {open && (
      <g className="pop-in">
        <path d="M -30 -66 l -6 -16 l 10 6 l 6 -12 l 6 12 l 10 -6 l -6 16 Z" fill="#ffd23f" {...S} strokeWidth={2} />
        <path d="M 14 -64 Q 26 -84 40 -70 Q 30 -62 14 -64 Z" fill="#2d2d3a" {...S} strokeWidth={2} />
      </g>
    )}
  </g>
);
