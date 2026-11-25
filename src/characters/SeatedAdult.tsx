import { memo, type CSSProperties, type ReactNode } from 'react';
import type { AdultActivity, Expression } from '../state/gameTypes';
import { OUTLINE } from '../data/characters';
import { Face, Hand, Limb } from './parts';
import { Book, Bottle, Guitar, Mug, Phone, Teddy } from '../components/props';

/**
 * Shared rig for the two seated adults. Origin = seat point. Faces +x (towards the desk).
 * Mummy reuses it mirrored. Activities map onto a small set of reusable poses.
 */
export interface AdultLook {
  skin: string;
  skinShade: string;
  hair: string;
  shirt: string;
  shirtDark: string;
  collar: string;
  pants: string;
  pantsDark: string;
  shoe: string;
  chair: string;
  chairDark: string;
  lips?: string;
  lashes?: boolean;
  drinkProp: 'bottle' | 'mug';
  headR: number;
}

interface Pose {
  front: boolean;
  near: [number, number];
  far: [number, number];
  turn: number;
  tilt?: number;
  headCls?: string;
  bodyCls?: string;
  handsCls?: string;
  prop?: 'drink' | 'phone' | 'guitar' | 'book' | 'teddy';
}

const POSES: Record<AdultActivity, Pose> = {
  typing: { front: false, near: [-15, -80], far: [-12, -84], turn: 0.6, handsCls: 'typing-hand' },
  meeting: { front: false, near: [-15, -80], far: [-12, -84], turn: 0.6, handsCls: 'typing-hand' },
  thinking: { front: false, near: [-40, -160], far: [-12, -84], turn: 0.4, tilt: -4 },
  stretch: { front: false, near: [178, 4], far: [172, 6], turn: 0.2, tilt: -6 },
  drink: { front: false, near: [-60, -150], far: [-12, -84], turn: 0.3, tilt: -10, prop: 'drink' },
  phone: { front: false, near: [-50, -120], far: [-12, -84], turn: 0.6, tilt: 6, prop: 'phone' },
  lookClock: { front: false, near: [-15, -80], far: [-12, -84], turn: -0.1, tilt: -12 },
  adjust: { front: false, near: [10, -10], far: [8, -12], turn: 0.4, bodyCls: 'adult-adjust' },
  lookAround: { front: false, near: [-15, -80], far: [-12, -84], turn: 0, headCls: 'look-around' },
  lookBack: { front: false, near: [-15, -80], far: [-12, -84], turn: -0.6, tilt: 4 },
  lookDoor: { front: false, near: [-15, -80], far: [-12, -84], turn: -0.75, tilt: -2 },
  lookKid: { front: false, near: [-15, -80], far: [-12, -84], turn: -0.55, tilt: 8 },
  turned: { front: true, near: [12, -60], far: [12, -60], turn: 0 },
  hug: { front: true, near: [80, 50], far: [80, 50], turn: 0, tilt: 4 },
  guitar: { front: true, near: [-25, -75], far: [55, 70], turn: 0, tilt: 6, prop: 'guitar', bodyCls: 'adult-groove' },
  play: { front: true, near: [-150, 0], far: [20, -40], turn: 0, bodyCls: 'adult-groove' },
  search: { front: false, near: [-35, -40], far: [-30, -50], turn: -0.3, tilt: 14, bodyCls: 'adult-search' },
  rest: { front: false, near: [-30, -150], far: [-12, -84], turn: 0.3, tilt: 16 },
  read: { front: false, near: [-45, -100], far: [-40, -100], turn: 0.4, tilt: 10, prop: 'book' },
  catch: { front: true, near: [150, 10], far: [150, 10], turn: 0 },
  throw: { front: true, near: [-170, -30], far: [30, -20], turn: 0 },
  holdTeddy: { front: true, near: [-30, -100], far: [-30, -100], turn: 0, tilt: 6, prop: 'teddy' },
  dizzy: { front: true, near: [20, -10], far: [20, -10], turn: 0, headCls: 'head-wobble' },
  countEyes: { front: true, near: [-28, -172], far: [-28, -172], turn: 0, tilt: 6 },
};

export interface SeatedAdultProps {
  look: AdultLook;
  activity: AdultActivity;
  expr: Expression;
  talking?: boolean;
  hairBack: (turn: number) => ReactNode;
  hairFront: (turn: number) => ReactNode;
  extras?: (turn: number, r: number) => ReactNode;
  spinning?: boolean;
  blinkDelay?: number;
}

export const SeatedAdult = memo(function SeatedAdult(p: SeatedAdultProps) {
  const { look, activity, expr } = p;
  const pose = POSES[activity] ?? POSES.typing;
  const L = look;
  const r = L.headR;
  const front = pose.front;
  const style: CSSProperties = { ['--skin' as string]: L.skin, ['--skin-shade' as string]: L.skinShade };
  const shoe = (
    <path d="M -10 -4 L 8 -4 Q 30 -2 30 8 L -10 8 Q -14 2 -10 -4 Z" fill={L.shoe} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
  );
  const frontShoe = <ellipse cx={0} cy={4} rx={15} ry={9} fill={L.shoe} stroke={OUTLINE} strokeWidth={3} />;

  // arm angles: near arm in front of torso, far arm behind (side view); in front view they mirror
  const nearA = front ? -pose.near[0] : pose.near[0];
  const nearB = front ? -pose.near[1] : pose.near[1];
  const farA = pose.far[0];
  const farB = pose.far[1];
  const shX = front ? 38 : 14;
  const farShX = front ? -38 : -10;
  const armBase = { len: 58, len2: 54, w: 22, w2: 17, color: L.shirt, color2: L.skin };

  const drinkProp = L.drinkProp === 'mug' ? <g transform="rotate(200) translate(0 10)"><Mug /></g> : <g transform="rotate(205)"><Bottle /></g>;
  const nearEnd = (
    <g>
      {pose.prop === 'drink' && drinkProp}
      {pose.prop === 'phone' && <g transform="rotate(180) translate(0 6)"><Phone glow /></g>}
      <Hand r={10} skin={L.skin} />
    </g>
  );

  const chairBack = front ? (
    <g>
      <rect x={-50} y={-175} width={100} height={150} rx={26} fill={L.chair} stroke={OUTLINE} strokeWidth={3} />
      <rect x={-38} y={-160} width={76} height={110} rx={20} fill={L.chairDark} opacity={0.35} />
    </g>
  ) : (
    <g>
      <path d="M -70 -170 Q -78 -100 -62 -24 L -40 -24 Q -52 -100 -46 -170 Q -58 -182 -70 -170 Z" fill={L.chair} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-58} y={-40} width={10} height={30} fill={L.chairDark} stroke={OUTLINE} strokeWidth={2.5} />
    </g>
  );

  const chairBase = (
    <g>
      <rect x={-6} y={14} width={12} height={58} fill="#9aa0a8" stroke={OUTLINE} strokeWidth={3} />
      <path d="M -60 82 L 60 82 M -40 76 L 0 70 L 40 76" stroke={OUTLINE} strokeWidth={8} strokeLinecap="round" fill="none" />
      <path d="M -60 82 L 60 82 M -40 76 L 0 70 L 40 76" stroke="#555b66" strokeWidth={4} strokeLinecap="round" fill="none" />
      {[-60, 0, 60].map((x) => (
        <circle key={x} cx={x} cy={88} r={7} fill="#2e3138" stroke={OUTLINE} strokeWidth={2} />
      ))}
      <ellipse cx={0} cy={8} rx={60} ry={13} fill={L.chair} stroke={OUTLINE} strokeWidth={3} />
    </g>
  );

  const headX = front ? 0 : 8;
  const headY = -196;
  const torso = front
    ? 'M -42 4 Q -50 -80 -44 -138 Q 0 -160 44 -138 Q 50 -80 42 4 Z'
    : 'M -34 4 Q -44 -80 -30 -140 Q -2 -158 30 -142 Q 42 -80 36 4 Z';

  const legs = front ? (
    <g>
      <Limb x={-20} y={-4} a={4} b={-4} len={24} len2={78} w={30} w2={24} color={L.pants} end={frontShoe} />
      <Limb x={20} y={-4} a={-4} b={4} len={24} len2={78} w={30} w2={24} color={L.pants} end={frontShoe} />
    </g>
  ) : (
    <g>
      <Limb x={-4} y={-8} a={-88} b={86} len={66} len2={74} w={30} w2={24} color={L.pantsDark} end={shoe} />
      <Limb x={4} y={0} a={-90} b={90} len={66} len2={74} w={30} w2={24} color={L.pants} end={shoe} />
    </g>
  );

  const turn = pose.turn;
  return (
    <g style={style}>
      <g className={p.spinning ? 'chair-spin' : undefined}>
        {chairBack}
        {chairBase}
        <g className={pose.bodyCls}>
          {!front && <Limb x={farShX} y={-134} a={farA} b={farB} {...armBase} color={L.shirtDark} end={<Hand r={10} skin={L.skinShade} />} endClass={pose.handsCls} />}
          {legs}
          {front && <Limb x={farShX} y={-132} a={farA} b={farB} {...armBase} end={<Hand r={10} skin={L.skin} />} />}
          <path d={torso} fill={L.shirt} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
          <path d={front ? 'M -18 -148 L 0 -126 L 18 -148' : 'M -6 -150 L 8 -128 L 22 -146'} fill="none" stroke={L.collar} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          {/* head */}
          <g style={{ transform: `translate(${headX}px, 0px) rotate(${pose.tilt ?? 0}deg)`, transformOrigin: '0px -150px', transition: 'transform 380ms ease' }}>
            <g className={pose.headCls}>
              <rect x={-11} y={-166} width={22} height={22} fill={L.skin} stroke={OUTLINE} strokeWidth={3} />
              <g transform={`translate(0 ${headY})`}>
                {p.hairBack(turn)}
                {turn < 0.5 && <ellipse cx={-r * 0.95 + turn * 8} cy={6} rx={8} ry={11} fill={L.skin} stroke={OUTLINE} strokeWidth={3} />}
                {turn > -0.5 && <ellipse cx={r * 0.95 + turn * 8} cy={6} rx={8} ry={11} fill={L.skin} stroke={OUTLINE} strokeWidth={3} />}
                <ellipse cx={turn * 3} cy={0} rx={r * 0.92} ry={r} fill={L.skin} stroke={OUTLINE} strokeWidth={3} />
                <Face r={r} expr={expr} turn={turn} hairColor={L.hair} talking={p.talking} lashes={L.lashes} lips={L.lips} blinkDelay={p.blinkDelay} blush={0.3} />
                {p.hairFront(turn)}
                {p.extras?.(turn, r)}
              </g>
            </g>
          </g>
          {pose.prop === 'guitar' && <g transform="translate(6 -70) rotate(-58) scale(0.82)"><Guitar /></g>}
          {pose.prop === 'book' && <g transform="translate(70 -128) scale(1.1)"><Book open /></g>}
          {pose.prop === 'teddy' && <g transform="translate(0 -56) scale(0.85)"><Teddy /></g>}
          <Limb x={shX} y={-134} a={nearA} b={nearB} {...armBase} end={nearEnd} endClass={pose.handsCls} />
        </g>
      </g>
    </g>
  );
});
