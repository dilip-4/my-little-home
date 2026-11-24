import { memo } from 'react';
import { useGame } from '../state/gameStore';
import { PAPA_SPEC, OUTLINE } from '../data/characters';
import { SeatedAdult, type AdultLook } from './SeatedAdult';

const C = PAPA_SPEC.palette;
export const PAPA_LOOK: AdultLook = {
  skin: PAPA_SPEC.skin,
  skinShade: PAPA_SPEC.skinShade,
  hair: PAPA_SPEC.hair,
  shirt: C.shirt,
  shirtDark: C.shirtDark,
  collar: C.collar,
  pants: C.pants,
  pantsDark: C.pantsDark,
  shoe: C.shoe,
  chair: '#3a3f4a',
  chairDark: '#22252c',
  drinkProp: 'bottle',
  headR: 42,
};

const r = PAPA_LOOK.headR;
const H = PAPA_SPEC.hair;

export const papaHairBack = (turn: number) =>
  turn > 0.2 ? (
    <path d={`M ${-r * 0.92} ${-r * 0.2} Q ${-r * 1.02} ${r * 0.35} ${-r * 0.72} ${r * 0.42} L ${-r * 0.5} ${-r * 0.3} Z`} fill={H} stroke={OUTLINE} strokeWidth={3} />
  ) : null;

export const papaHairFront = (turn: number) => {
  const t = turn * 10;
  return (
    <g>
      <path
        d={`M ${-r * 0.95} ${r * 0.02} Q ${-r * 1.04} ${-r * 1.0} ${t} ${-r * 1.08} Q ${r * 1.04} ${-r * 1.02} ${r * 0.95} ${-r * 0.1} Q ${r * 0.78} ${-r * 0.5} ${r * 0.35 + t} ${-r * 0.6} Q ${t - r * 0.05} ${-r * 0.42} ${-r * 0.4 + t} ${-r * 0.62} Q ${-r * 0.75} ${-r * 0.5} ${-r * 0.95} ${r * 0.02} Z`}
        fill={H}
        stroke={OUTLINE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d={`M ${-r * 0.2 + t} ${-r * 0.98} Q ${r * 0.25 + t} ${-r * 0.9} ${r * 0.5 + t} ${-r * 0.72}`} fill="none" stroke="#4a3a33" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

export const papaExtras = (turn: number) => {
  const dx = turn * r * 0.24;
  const ex = r * 0.34;
  const g = C.glasses;
  return (
    <g>
      {/* beard */}
      <path
        d={`M ${-r * 0.86} ${r * 0.12} Q ${-r * 0.72} ${r * 0.98} ${dx} ${r * 1.02} Q ${r * 0.72} ${r * 0.98} ${r * 0.86} ${r * 0.12} Q ${r * 0.62} ${r * 0.66} ${dx} ${r * 0.7} Q ${-r * 0.62} ${r * 0.66} ${-r * 0.86} ${r * 0.12} Z`}
        fill={H}
        opacity={0.88}
      />
      <path d={`M ${dx - r * 0.24} ${r * 0.31} Q ${dx} ${r * 0.2} ${dx + r * 0.24} ${r * 0.31}`} fill="none" stroke={H} strokeWidth={6} strokeLinecap="round" />
      {/* glasses */}
      <rect x={-ex + dx - r * 0.22} y={-r * 0.2} width={r * 0.44} height={r * 0.34} rx={7} fill="#dff3ff" fillOpacity={0.18} stroke={g} strokeWidth={3.5} />
      <rect x={ex + dx - r * 0.22} y={-r * 0.2} width={r * 0.44} height={r * 0.34} rx={7} fill="#dff3ff" fillOpacity={0.18} stroke={g} strokeWidth={3.5} />
      <path d={`M ${-ex + dx + r * 0.22} ${-r * 0.06} Q ${dx} ${-r * 0.14} ${ex + dx - r * 0.22} ${-r * 0.06}`} fill="none" stroke={g} strokeWidth={3} />
      {turn > 0.2 && <line x1={-ex + dx - r * 0.22} y1={-r * 0.06} x2={-r * 0.9} y2={-r * 0.02} stroke={g} strokeWidth={3} />}
      {turn < -0.2 && <line x1={ex + dx + r * 0.22} y1={-r * 0.06} x2={r * 0.9} y2={-r * 0.02} stroke={g} strokeWidth={3} />}
    </g>
  );
};

export const Papa = memo(function Papa() {
  const papa = useGame((s) => s.characters.papa);
  const talking = useGame((s) => !!s.dialogues.papa);
  const spinning = useGame((s) => !!s.fx['papa:spin']);
  return (
    <SeatedAdult
      look={PAPA_LOOK}
      activity={papa.activity}
      expr={papa.expr}
      talking={talking}
      spinning={spinning}
      hairBack={papaHairBack}
      hairFront={papaHairFront}
      extras={papaExtras}
      blinkDelay={0.4}
    />
  );
});
