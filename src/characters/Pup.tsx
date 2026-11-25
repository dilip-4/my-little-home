import { memo } from 'react';
import { useGame } from '../state/gameStore';
import type { PupPose, RoomId } from '../state/gameTypes';
import { OUTLINE } from '../data/characters';
import { InteractiveObject } from '../components/InteractiveObject';
import { Zzz } from '../components/props';

const FUR = '#e8b77a';
const FUR_DARK = '#b5793f';
const BELLY = '#fbe3c0';
const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export const Sock = () => (
  <g>
    <path d="M -6 -16 L 6 -16 L 6 2 Q 18 2 18 10 Q 18 16 8 16 L -6 16 Z" fill="#fff" {...S} strokeWidth={2.5} />
    <path d="M -6 -10 L 6 -10 M -6 -4 L 6 -4" stroke="#5b8def" strokeWidth={3} />
  </g>
);

/** Biscuit the puppy. Origin = between the paws on the floor, facing +x. */
export const PupFigure = memo(function PupFigure({ pose, carry }: { pose: PupPose; carry: null | 'ball' | 'sock' }) {
  if (pose === 'sleep') {
    return (
      <g>
        <ellipse cx={0} cy={2} rx={46} ry={8} fill="#000" opacity={0.12} />
        <g className="pup-breathe">
          <path d="M -40 -4 Q -48 -30 -18 -36 Q 20 -42 38 -22 Q 46 -6 30 0 Z" fill={FUR} {...S} />
          <path d="M -44 -10 Q -60 -14 -52 -2" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" />
          <path d="M -44 -10 Q -60 -14 -52 -2" fill="none" stroke={FUR} strokeWidth={5} strokeLinecap="round" />
          <ellipse cx={30} cy={-14} rx={20} ry={16} fill={FUR} {...S} />
          <path d="M 18 -26 Q 6 -22 10 -4 Q 20 -8 22 -20 Z" fill={FUR_DARK} {...S} strokeWidth={2.5} />
          <ellipse cx={46} cy={-10} rx={9} ry={7} fill={BELLY} {...S} strokeWidth={2} />
          <circle cx={53} cy={-12} r={3.5} fill={OUTLINE} />
          <path d="M 30 -16 q 4 3 8 0" stroke={OUTLINE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(40 -40)"><Zzz /></g>
      </g>
    );
  }
  const sitting = pose === 'sit' || pose === 'beg' || pose === 'eat';
  const cls =
    pose === 'walk' ? 'pup-walk' : pose === 'run' ? 'pup-run' : pose === 'jump' ? 'pup-jump' : pose === 'roll' ? 'pup-roll' : pose === 'spin' ? 'pup-spin' : pose === 'beg' ? 'pup-beg' : undefined;
  const headDown = pose === 'eat';
  const tongue = pose === 'lick' || pose === 'wag' || pose === 'run' || pose === 'jump' || pose === 'beg';
  return (
    <g>
      <ellipse cx={0} cy={2} rx={40} ry={7} fill="#000" opacity={0.13} />
      <g className={cls}>
        {/* tail */}
        <g className={pose === 'wag' || pose === 'jump' || pose === 'beg' || pose === 'lick' ? 'pup-tail fast' : 'pup-tail'} style={{ transformOrigin: '-30px -36px' }}>
          <path d={sitting ? 'M -30 -20 Q -50 -26 -46 -48' : 'M -32 -40 Q -52 -48 -46 -70'} fill="none" stroke={OUTLINE} strokeWidth={10} strokeLinecap="round" />
          <path d={sitting ? 'M -30 -20 Q -50 -26 -46 -48' : 'M -32 -40 Q -52 -48 -46 -70'} fill="none" stroke={FUR} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* back legs */}
        {sitting ? (
          <ellipse cx={-18} cy={-12} rx={18} ry={13} fill={FUR} {...S} />
        ) : (
          <>
            <rect x={-30} y={-26} width={13} height={26} rx={6} fill={FUR_DARK} {...S} />
            <rect x={-14} y={-26} width={13} height={26} rx={6} fill={FUR} {...S} />
          </>
        )}
        {/* body */}
        <g transform={sitting ? 'rotate(-28 -10 -20)' : undefined}>
          <ellipse cx={-4} cy={-34} rx={34} ry={20} fill={FUR} {...S} />
          <ellipse cx={0} cy={-26} rx={20} ry={9} fill={BELLY} />
          <path d="M -24 -48 Q -14 -54 -4 -50" fill="none" stroke={FUR_DARK} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* front legs */}
        <rect x={12} y={-28} width={13} height={28} rx={6} fill={FUR} {...S} />
        <rect x={pose === 'beg' ? 18 : 24} y={pose === 'beg' ? -46 : -28} width={13} height={28} rx={6} fill={FUR_DARK} {...S} />
        {/* head */}
        <g transform={headDown ? 'translate(10 26) rotate(30 26 -58)' : pose === 'lick' ? 'rotate(-12 26 -58)' : undefined}>
          <circle cx={26} cy={-62} r={23} fill={FUR} {...S} />
          <ellipse cx={44} cy={-54} rx={14} ry={11} fill={BELLY} {...S} strokeWidth={2.5} />
          <ellipse cx={55} cy={-58} rx={5} ry={4} fill={OUTLINE} />
          <circle cx={32} cy={-68} r={4} fill={OUTLINE} />
          <circle cx={33.5} cy={-69.5} r={1.4} fill="#fff" />
          <path d="M 40 -48 q 6 4 12 0" stroke={OUTLINE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {tongue && <path d="M 44 -47 q 3 10 8 1 Z" fill="#ff8fa3" stroke={OUTLINE} strokeWidth={1.5} />}
          <path d="M 14 -78 Q -2 -76 2 -50 Q 14 -52 20 -68 Z" fill={FUR_DARK} {...S} strokeWidth={2.5} className="pup-ear" />
          <circle cx={20} cy={-60} r={5} fill="#ffb3c1" opacity={0.5} />
          {/* collar */}
          <path d="M 8 -44 Q 22 -36 38 -42" fill="none" stroke="#e2483f" strokeWidth={6} strokeLinecap="round" />
          <circle cx={24} cy={-36} r={4.5} fill="#ffd23f" stroke={OUTLINE} strokeWidth={1.5} />
          {carry === 'ball' && <g transform="translate(58 -46)"><circle r={11} fill="#ff6f61" {...S} strokeWidth={2.5} /><path d="M -10 0 Q 0 -5 10 0" stroke="#fff" strokeWidth={2.5} fill="none" /></g>}
          {carry === 'sock' && <g transform="translate(60 -42) rotate(20) scale(0.9)"><Sock /></g>}
        </g>
      </g>
    </g>
  );
});

/** Biscuit in a room: moves between spots with CSS transitions, tappable. */
export const PupActor = memo(function PupActor({ room }: { room: RoomId }) {
  const p = useGame((s) => s.pup);
  if (p.room !== room) return null;
  return (
    <g style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: `transform ${p.moveMs}ms ${p.moveMs > 500 ? 'linear' : 'ease-out'}` }}>
      <InteractiveObject id="pup" label="Biscuit the puppy" hit={{ x: -56, y: -96, w: 122, h: 100 }} origin="0px 0px">
        <g style={{ transform: `scaleX(${p.facing})`, transition: 'transform 160ms' }}>
          <PupFigure pose={p.pose} carry={p.carry} />
        </g>
      </InteractiveObject>
    </g>
  );
});
