import type { ReactNode } from 'react';
import type { Expression } from '../state/gameTypes';
import { OUTLINE } from '../data/characters';

/** Forward kinematics for a two-segment limb (angles in degrees, 0 = pointing down). */
export function limbEnd(x: number, y: number, a: number, len: number, b: number, len2: number) {
  const r1 = (a * Math.PI) / 180;
  const ex = x - len * Math.sin(r1);
  const ey = y + len * Math.cos(r1);
  const r2 = ((a + b) * Math.PI) / 180;
  return { x: ex - len2 * Math.sin(r2), y: ey + len2 * Math.cos(r2), angle: a + b };
}

interface LimbProps {
  x: number;
  y: number;
  a: number;
  b: number;
  len: number;
  len2: number;
  w: number;
  w2?: number;
  color: string;
  color2?: string;
  end?: ReactNode;
  endClass?: string;
  ms?: number;
}

/** A two-segment limb whose joints animate with CSS transitions. */
export function Limb({ x, y, a, b, len, len2, w, w2, color, color2, end, endClass, ms = 380 }: LimbProps) {
  const t = `transform ${ms}ms cubic-bezier(.4,.1,.3,1)`;
  const lw2 = w2 ?? w;
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) rotate(${a}deg)`, transition: t }}>
      <line x1={0} y1={0} x2={0} y2={len} stroke={OUTLINE} strokeWidth={w + 5} strokeLinecap="round" />
      <g style={{ transform: `translate(0px, ${len}px) rotate(${b}deg)`, transition: t }}>
        <line x1={0} y1={0} x2={0} y2={len2} stroke={OUTLINE} strokeWidth={lw2 + 5} strokeLinecap="round" />
        <line x1={0} y1={0} x2={0} y2={len2} stroke={color2 ?? color} strokeWidth={lw2} strokeLinecap="round" />
        <g transform={`translate(0 ${len2})`}>
          <g className={endClass}>{end}</g>
        </g>
      </g>
      <line x1={0} y1={0} x2={0} y2={len} stroke={color} strokeWidth={w} strokeLinecap="round" />
    </g>
  );
}

export const Hand = ({ r, skin }: { r: number; skin: string }) => (
  <circle r={r} fill={skin} stroke={OUTLINE} strokeWidth={2.5} />
);

interface FaceProps {
  r: number;
  expr: Expression;
  turn?: number;
  hairColor: string;
  talking?: boolean;
  lashes?: boolean;
  lips?: string;
  blinkDelay?: number;
  blush?: number;
}

const OPEN_EYES: Expression[] = ['neutral', 'surprised', 'annoyed', 'irritated', 'puzzled', 'focused', 'sleepy', 'funny2'];

/** Shared cartoon face: eyes, brows, nose, mouth and cheeks for every character. */
export function Face({ r, expr, turn = 0, hairColor, talking, lashes, lips, blinkDelay = 0, blush = 0.45 }: FaceProps) {
  const dx = turn * r * 0.24;
  const eyeX = r * 0.34;
  const eyeY = -r * 0.02;
  const ew = r * 0.11;
  const eh = r * 0.14;
  const dark = '#2b1c16';
  const mouthY = r * 0.4;
  const mw = r * 0.17;

  const eye = (side: -1 | 1) => {
    const cx = side * eyeX + dx;
    const far = turn !== 0 && Math.sign(turn) !== side ? 0.8 : 1;
    const closedUp = (
      <path d={`M ${cx - ew * 1.2} ${eyeY + 2} Q ${cx} ${eyeY - eh * 1.3} ${cx + ew * 1.2} ${eyeY + 2}`} stroke={dark} strokeWidth={4} fill="none" strokeLinecap="round" />
    );
    const closedDown = (
      <path d={`M ${cx - ew * 1.2} ${eyeY - 2} Q ${cx} ${eyeY + eh * 1.1} ${cx + ew * 1.2} ${eyeY - 2}`} stroke={dark} strokeWidth={4} fill="none" strokeLinecap="round" />
    );
    switch (expr) {
      case 'happy':
      case 'laugh':
      case 'love':
        return closedUp;
      case 'asleep':
      case 'yawn':
        return closedDown;
      case 'strain':
        return (
          <path d={`M ${cx - ew * side} ${eyeY - eh} L ${cx + ew * side} ${eyeY} L ${cx - ew * side} ${eyeY + eh}`} stroke={dark} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        );
      case 'dizzy':
        return (
          <g>
            <circle cx={cx} cy={eyeY} r={ew * 1.3} fill="none" stroke={dark} strokeWidth={3} />
            <circle cx={cx + 1} cy={eyeY + 1} r={ew * 0.55} fill="none" stroke={dark} strokeWidth={3} />
          </g>
        );
      case 'funny':
        if (side === -1) return closedUp;
        break;
      default:
        break;
    }
    const big = expr === 'surprised' || expr === 'funny' ? 1.3 : 1;
    let pupilX = turn * 2;
    if (expr === 'funny2') pupilX = -side * ew * 0.6;
    return (
      <g>
        {expr === 'funny2' ? (
          <>
            <ellipse cx={cx} cy={eyeY} rx={ew * 1.5} ry={eh * 1.4} fill="#fff" stroke={dark} strokeWidth={2} />
            <circle cx={cx + pupilX} cy={eyeY + 2} r={ew * 0.75} fill={dark} />
          </>
        ) : (
          <>
            <ellipse cx={cx + pupilX} cy={eyeY} rx={ew * big * far} ry={eh * big} fill={dark} />
            <circle cx={cx + pupilX - ew * 0.3} cy={eyeY - eh * 0.4} r={ew * 0.35} fill="#fff" />
          </>
        )}
        {lashes && (
          <path d={`M ${cx + side * ew * 0.6} ${eyeY - eh * 0.9} l ${side * 5} -5`} stroke={dark} strokeWidth={2.5} strokeLinecap="round" />
        )}
      </g>
    );
  };

  // lids for annoyed / sleepy looks
  const lid = (side: -1 | 1) => {
    if (expr !== 'annoyed' && expr !== 'irritated' && expr !== 'sleepy') return null;
    const cx = side * eyeX + dx;
    const h = expr === 'sleepy' ? eh * 1.1 : eh * 0.8;
    return <rect x={cx - ew * 1.6} y={eyeY - eh * 1.5} width={ew * 3.2} height={h + 1} fill="var(--skin)" />;
  };

  // eyebrows
  const browY = -r * 0.3;
  let lAng = 0, rAng = 0, lift = 0;
  if (expr === 'annoyed') { lAng = 10; rAng = -10; }
  if (expr === 'irritated') { lAng = 22; rAng = -22; lift = 3; }
  if (expr === 'surprised') lift = -7;
  if (expr === 'puzzled') { lAng = -12; rAng = 6; }
  if (expr === 'strain') { lAng = 18; rAng = -18; }
  if (expr === 'happy' || expr === 'laugh' || expr === 'love') lift = -3;
  const brow = (side: -1 | 1, ang: number) => {
    const cx = side * eyeX + dx;
    const y = browY + lift + (expr === 'puzzled' && side === -1 ? -6 : 0);
    return (
      <path
        d={`M ${cx - r * 0.12} ${y + 2} Q ${cx} ${y - 3} ${cx + r * 0.12} ${y + 2}`}
        stroke={hairColor}
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(${ang} ${cx} ${y})`}
      />
    );
  };

  const mx = dx * 0.85;
  const lipColor = lips ?? '#8a3a32';
  let mouth: ReactNode;
  const openTalk = talking && !['laugh', 'surprised', 'yawn', 'asleep', 'funny', 'strain'].includes(expr);
  if (openTalk) {
    mouth = (
      <g className="talk-mouth">
        <ellipse cx={mx} cy={mouthY} rx={mw * 0.75} ry={r * 0.09} fill="#7b2f2c" stroke={lipColor} strokeWidth={2} />
      </g>
    );
  } else {
    switch (expr) {
      case 'happy':
      case 'love':
        mouth = (
          <g>
            <path d={`M ${mx - mw} ${mouthY - 3} Q ${mx} ${mouthY + r * 0.26} ${mx + mw} ${mouthY - 3} Z`} fill="#7b2f2c" stroke={lipColor} strokeWidth={2.5} strokeLinejoin="round" />
            <path d={`M ${mx - mw * 0.5} ${mouthY + r * 0.1} Q ${mx} ${mouthY + r * 0.02} ${mx + mw * 0.5} ${mouthY + r * 0.1} Q ${mx} ${mouthY + r * 0.2} ${mx - mw * 0.5} ${mouthY + r * 0.1}`} fill="#e7787a" />
          </g>
        );
        break;
      case 'laugh':
        mouth = (
          <g className="laugh-mouth">
            <path d={`M ${mx - mw * 1.2} ${mouthY - 5} Q ${mx} ${mouthY + r * 0.38} ${mx + mw * 1.2} ${mouthY - 5} Z`} fill="#7b2f2c" stroke={lipColor} strokeWidth={2.5} strokeLinejoin="round" />
            <ellipse cx={mx} cy={mouthY + r * 0.15} rx={mw * 0.6} ry={r * 0.07} fill="#e7787a" />
          </g>
        );
        break;
      case 'surprised':
      case 'yawn':
        mouth = <ellipse cx={mx} cy={mouthY + 2} rx={expr === 'yawn' ? mw * 0.7 : mw * 0.5} ry={expr === 'yawn' ? r * 0.18 : r * 0.11} fill="#7b2f2c" stroke={lipColor} strokeWidth={2} />;
        break;
      case 'annoyed':
        mouth = <path d={`M ${mx - mw * 0.8} ${mouthY} L ${mx + mw * 0.8} ${mouthY + 2}`} stroke={lipColor} strokeWidth={4} strokeLinecap="round" />;
        break;
      case 'irritated':
        mouth = <path d={`M ${mx - mw} ${mouthY + 5} Q ${mx} ${mouthY - 6} ${mx + mw} ${mouthY + 5}`} stroke={lipColor} strokeWidth={4} fill="none" strokeLinecap="round" />;
        break;
      case 'puzzled':
      case 'dizzy':
        mouth = <path d={`M ${mx - mw} ${mouthY} Q ${mx - mw / 2} ${mouthY - 6} ${mx} ${mouthY} Q ${mx + mw / 2} ${mouthY + 6} ${mx + mw} ${mouthY}`} stroke={lipColor} strokeWidth={4} fill="none" strokeLinecap="round" />;
        break;
      case 'funny':
      case 'funny2':
        mouth = (
          <g>
            <path d={`M ${mx - mw} ${mouthY - 2} Q ${mx} ${mouthY + 10} ${mx + mw} ${mouthY - 2}`} stroke={lipColor} strokeWidth={4} fill="#7b2f2c" strokeLinecap="round" />
            <path d={`M ${mx - mw * 0.45} ${mouthY + 3} L ${mx - mw * 0.45} ${mouthY + r * 0.25} Q ${mx} ${mouthY + r * 0.38} ${mx + mw * 0.45} ${mouthY + r * 0.25} L ${mx + mw * 0.45} ${mouthY + 3} Z`} fill="#f0848a" stroke="#c75a62" strokeWidth={2} />
          </g>
        );
        break;
      case 'strain':
        mouth = (
          <g>
            <rect x={mx - mw} y={mouthY - 6} width={mw * 2} height={12} rx={5} fill="#fff" stroke={lipColor} strokeWidth={2.5} />
            <line x1={mx - mw} y1={mouthY} x2={mx + mw} y2={mouthY} stroke="#c9b9b0" strokeWidth={1.5} />
          </g>
        );
        break;
      case 'asleep':
        mouth = <ellipse cx={mx} cy={mouthY} rx={4} ry={3} fill="#7b2f2c" />;
        break;
      default:
        mouth = <path d={`M ${mx - mw * 0.8} ${mouthY} Q ${mx} ${mouthY + r * 0.12} ${mx + mw * 0.8} ${mouthY}`} stroke={lipColor} strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
  }

  const blushOp = expr === 'love' || expr === 'laugh' || expr === 'strain' ? 0.75 : blush;
  const blinkable = OPEN_EYES.includes(expr) || expr === 'funny';
  return (
    <g>
      <ellipse cx={-eyeX * 1.45 + dx} cy={r * 0.25} rx={r * 0.15} ry={r * 0.09} fill="#ee7f7a" opacity={blushOp} />
      <ellipse cx={eyeX * 1.45 + dx} cy={r * 0.25} rx={r * 0.15} ry={r * 0.09} fill="#ee7f7a" opacity={blushOp} />
      <g className={blinkable ? 'blink' : undefined} style={{ animationDelay: `${blinkDelay}s` }}>
        {eye(-1)}
        {eye(1)}
      </g>
      {lid(-1)}
      {lid(1)}
      {brow(-1, lAng)}
      {brow(1, rAng)}
      <path d={`M ${dx * 1.3 - 3} ${r * 0.14} Q ${dx * 1.3 + 2 + turn * 4} ${r * 0.24} ${dx * 1.3 + 5} ${r * 0.15}`} stroke="var(--skin-shade)" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      {mouth}
    </g>
  );
}
