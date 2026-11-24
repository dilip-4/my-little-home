import { memo, type CSSProperties } from 'react';
import type { Expression, HeldItem, KidPose, KidProp } from '../state/gameTypes';
import { KID_SPEC, OUTLINE } from '../data/characters';
import { Face, Hand, Limb, limbEnd } from './parts';
import {
  Apple, Ball, Barbell, Book, BubbleWand, Bottle, CurlRod, Dumbbell, Duck, Guitar, Hairbrush, Keys, Lollipop, OfficeMouse, Pillow, Robot, Sunglasses, Teddy, Zzz,
} from '../components/props';

const P = KID_SPEC.palette;
const SKIN = KID_SPEC.skin;

// [armOut, forearmOut] per side (positive = outward/up, mirrored automatically for the right side)
interface PoseDef {
  l: [number, number];
  r: [number, number];
  legs: [number, number];
  legsR?: [number, number];
  dy?: number;
  rot?: number;
  cls?: string;
  headTilt?: number;
}

const POSES: Record<KidPose, PoseDef> = {
  stand: { l: [10, -6], r: [10, -6], legs: [3, 0], cls: 'k-breathe' },
  walk: { l: [24, -12], r: [-16, -18], legs: [8, -6], legsR: [-6, 4], cls: 'k-walk' },
  jump: { l: [150, 15], r: [150, 15], legs: [18, -35], cls: 'k-jump' },
  reach: { l: [12, -8], r: [165, 0], legs: [3, 0], headTilt: -8 },
  hold: { l: [-25, -95], r: [-25, -95], legs: [3, 0], cls: 'k-breathe' },
  throw: { l: [45, -20], r: [170, 35], legs: [12, 0], rot: -6 },
  crouch: { l: [-30, -80], r: [-30, -80], legs: [70, -140], dy: 48 },
  hug: { l: [95, 30], r: [95, 30], legs: [3, 0], cls: 'k-breathe' },
  lift: { l: [8, 0], r: [8, 0], legs: [20, -30], dy: 8, cls: 'k-shake' },
  liftUp: { l: [168, 0], r: [168, 0], legs: [14, -10], cls: 'k-shake' },
  curl: { l: [5, 150], r: [5, 150], legs: [8, 0] },
  funny: { l: [130, 110], r: [130, 110], legs: [10, 0], cls: 'k-wiggle' },
  drink: { l: [10, -6], r: [-30, -120], legs: [3, 0], headTilt: -10 },
  comb: { l: [10, -6], r: [150, 40], legs: [3, 0] },
  wave: { l: [10, -6], r: [150, -25], legs: [3, 0], cls: 'k-bob' },
  cheer: { l: [155, -10], r: [155, -10], legs: [12, 0], cls: 'k-jump-small' },
  strum: { l: [70, 50], r: [-20, -80], legs: [6, 0], cls: 'k-strum' },
  knock: { l: [10, -6], r: [100, 20], legs: [3, 0] },
  lie: { l: [10, -6], r: [10, -6], legs: [3, 0] },
  sleep: { l: [10, -6], r: [10, -6], legs: [3, 0], cls: 'k-sleep' },
  sitUp: { l: [150, 0], r: [150, 0], legs: [80, -80], dy: 40 },
  sit: { l: [15, -10], r: [15, -10], legs: [80, -80], dy: 40, cls: 'k-breathe' },
  push: { l: [80, 5], r: [85, 5], legs: [14, 0], rot: 8 },
  dance: { l: [130, 40], r: [60, -40], legs: [12, 0], cls: 'k-dance' },
  peek: { l: [-30, -80], r: [-30, -80], legs: [70, -140], dy: 26 },
  yawn: { l: [165, -10], r: [165, -10], legs: [3, 0] },
};

const SH = { l: { x: -28, y: -116 }, r: { x: 28, y: -116 } };
const ARM = { len: 24, len2: 23 };

export interface KidFigureProps {
  pose: KidPose;
  expr: Expression;
  prop?: KidProp;
  holding?: HeldItem;
  talking?: boolean;
  hairFlat?: boolean;
}

export const KidFigure = memo(function KidFigure({ pose, expr, prop, holding, talking, hairFlat }: KidFigureProps) {
  let def = POSES[pose] ?? POSES.stand;
  const carrying = holding && holding !== 'sunglasses' && holding !== 'mouse';
  if (carrying && (pose === 'stand' || pose === 'walk')) def = { ...def, l: POSES.hold.l, r: POSES.hold.r };
  const la = def.l[0], lb = def.l[1];
  const ra = -def.r[0], rb = -def.r[1];
  const [lg, lk] = def.legs;
  const [rg, rk] = def.legsR ?? def.legs;
  const dy = def.dy ?? 0;
  const lHand = limbEnd(SH.l.x, SH.l.y, la, ARM.len, lb, ARM.len2);
  const rHand = limbEnd(SH.r.x, SH.r.y, ra, ARM.len, rb, ARM.len2);
  const mid = { x: (lHand.x + rHand.x) / 2, y: (lHand.y + rHand.y) / 2 };
  const lying = pose === 'lie' || pose === 'sleep';

  const style: CSSProperties = {
    ['--skin' as string]: SKIN,
    ['--skin-shade' as string]: KID_SPEC.skinShade,
  };

  const shoe = (
    <g>
      <rect x={-7} y={-6} width={14} height={8} fill={P.sock} stroke={OUTLINE} strokeWidth={2} />
      <path d="M -11 2 Q -12 -4 -4 -4 L 6 -4 Q 16 -3 15 6 Q 14 10 4 10 L -8 10 Q -12 9 -11 2 Z" fill={P.shoe} stroke={OUTLINE} strokeWidth={2.5} />
    </g>
  );

  const propNode = (() => {
    switch (prop) {
      case 'guitar': return <g transform="translate(-4 -86) rotate(-62) scale(0.62)"><Guitar /></g>;
      case 'dumbbell': return <g transform={`translate(${rHand.x} ${rHand.y}) scale(0.8)`}><Dumbbell /></g>;
      case 'barbell': return <g transform={`translate(${mid.x} ${mid.y}) scale(0.72)`}><Barbell /></g>;
      case 'curl': return <g transform={`translate(${mid.x} ${mid.y}) scale(0.75)`}><CurlRod /></g>;
      case 'bottle': return <g transform={`translate(${rHand.x} ${rHand.y}) rotate(${pose === 'drink' ? 150 : 0}) scale(0.8)`}><Bottle /></g>;
      case 'ball': return <g transform={`translate(${rHand.x} ${rHand.y})`}><Ball r={16} /></g>;
      case 'brush': return <g transform={`translate(${rHand.x} ${rHand.y}) rotate(-120) scale(0.8)`}><g className="brush-move"><Hairbrush /></g></g>;
      case 'book': return <g transform={`translate(${mid.x} ${mid.y - 6}) scale(0.9)`}><Book open /></g>;
      case 'pillow': return <g transform={`translate(${pose === 'throw' ? rHand.x : mid.x} ${(pose === 'throw' ? rHand.y : mid.y) - 6}) scale(0.62)`}><Pillow /></g>;
      case 'mouse': return <g transform={`translate(${lHand.x} ${lHand.y})`}><OfficeMouse /></g>;
      case 'lollipop': return <g transform={`translate(${rHand.x} ${rHand.y - 10}) scale(0.8)`}><Lollipop /></g>;
      case 'apple': return <g transform={`translate(${rHand.x} ${rHand.y - 6}) scale(0.8)`}><Apple /></g>;
      case 'wand': return <g transform={`translate(${rHand.x} ${rHand.y}) rotate(${pose === 'drink' ? -70 : -20})`}><BubbleWand /></g>;
      case 'keys': return <g transform={`translate(${rHand.x} ${rHand.y}) scale(0.9)`}><g className="k-wiggle"><Keys /></g></g>;
      default: return null;
    }
  })();

  const heldNode = (() => {
    switch (holding) {
      case 'robot': return <g transform={`translate(${mid.x} ${mid.y + 14}) scale(0.7)`}><Robot /></g>;
      case 'teddy': return <g transform={`translate(${mid.x} ${mid.y + 22}) scale(0.62)`} className="teddy-held"><Teddy /></g>;
      case 'duck': return <g transform={`translate(${mid.x} ${mid.y + 4}) scale(0.85)`}><Duck /></g>;
      case 'pillow': return <g transform={`translate(${mid.x} ${mid.y}) scale(0.6)`}><Pillow /></g>;
      default: return null;
    }
  })();

  const armProps = { len: ARM.len, len2: ARM.len2, w: 13, w2: 12, color: P.shirt, color2: SKIN };

  return (
    <g style={style} className="kid-figure">
      <g style={{ transform: lying ? 'rotate(-90deg)' : 'none', transition: 'transform 400ms ease' }}>
        <g className={def.cls}>
          <g style={{ transform: `translateY(${dy}px) rotate(${def.rot ?? 0}deg)`, transition: 'transform 300ms ease', transformOrigin: '0px -60px' }}>
            {/* legs */}
            <g style={{ transform: `translateY(${-dy}px)`, transition: 'transform 300ms ease' }}>
              <Limb x={-13} y={-52 + dy} a={lg} b={lk} len={26} len2={24} w={16} color={SKIN} end={shoe} />
              <Limb x={13} y={-52 + dy} a={-rg} b={-rk} len={26} len2={24} w={16} color={SKIN} end={<g transform="scale(-1 1)">{shoe}</g>} />
            </g>
            {/* back arm when holding guitar etc. drawn behind body */}
            <Limb x={SH.l.x} y={SH.l.y} a={la} b={lb} {...armProps} end={<Hand r={8.5} skin={SKIN} />} />
            {/* shorts */}
            <path d="M -33 -74 L 33 -74 L 36 -44 Q 18 -39 3 -46 L -3 -46 Q -18 -39 -36 -44 Z" fill={P.shorts} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
            {/* torso */}
            <path d="M -30 -123 Q 0 -131 30 -123 Q 37 -98 34 -68 Q 0 -61 -34 -68 Q -37 -98 -30 -123 Z" fill={P.shirt} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
            <path d="M -30 -80 Q 0 -74 32 -80" fill="none" stroke={P.shirtDark} strokeWidth={3} opacity={0.6} />
            <path d="M 0 -110 l 5 10 l 11 1 l -8 8 l 3 11 l -11 -6 l -11 6 l 3 -11 l -8 -8 l 11 -1 Z" fill={P.star} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
            {propNode && prop === 'guitar' && propNode}
            {/* head */}
            <g style={{ transform: `rotate(${def.headTilt ?? 0}deg)`, transformOrigin: '0px -128px', transition: 'transform 300ms ease' }}>
              <rect x={-9} y={-134} width={18} height={14} fill={SKIN} stroke={OUTLINE} strokeWidth={2.5} />
              <g transform="translate(0 -174)">
                <circle cx={-49} cy={4} r={11} fill={SKIN} stroke={OUTLINE} strokeWidth={3} />
                <circle cx={49} cy={4} r={11} fill={SKIN} stroke={OUTLINE} strokeWidth={3} />
                <ellipse cx={0} cy={0} rx={50} ry={48} fill={SKIN} stroke={OUTLINE} strokeWidth={3} />
                <Face r={48} expr={expr} hairColor={KID_SPEC.hair} talking={talking} blinkDelay={1.3} blush={0.55} />
                {/* hair */}
                <path d="M -50 -6 Q -56 -52 -8 -54 Q 44 -58 51 -8 Q 44 -30 26 -32 Q 18 -22 4 -30 Q -10 -20 -22 -30 Q -38 -26 -50 -6 Z" fill={KID_SPEC.hair} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
                <g className={hairFlat ? 'tuft flat' : 'tuft'}>
                  <path d="M -4 -52 Q -10 -74 6 -78 Q 2 -66 12 -60 Q 18 -72 26 -68 Q 18 -58 14 -50 Z" fill={KID_SPEC.hair} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
                </g>
                {holding === 'sunglasses' && <g transform="translate(0 -2) scale(1.05)"><Sunglasses /></g>}
              </g>
            </g>
            {heldNode}
            <Limb x={SH.r.x} y={SH.r.y} a={ra} b={rb} {...armProps} end={<Hand r={8.5} skin={SKIN} />} />
            {propNode && prop !== 'guitar' && propNode}
          </g>
        </g>
      </g>
      {pose === 'sleep' && (
        <g transform="translate(-200 -60)">
          <Zzz />
        </g>
      )}
    </g>
  );
});
