import { memo } from 'react';
import { useGame } from '../state/gameStore';
import { MUMMY_SPEC, OUTLINE } from '../data/characters';
import { SeatedAdult, type AdultLook } from './SeatedAdult';

const C = MUMMY_SPEC.palette;
export const MUMMY_LOOK: AdultLook = {
  skin: MUMMY_SPEC.skin,
  skinShade: MUMMY_SPEC.skinShade,
  hair: MUMMY_SPEC.hair,
  shirt: C.shirt,
  shirtDark: C.shirtDark,
  collar: C.collar,
  pants: C.pants,
  pantsDark: C.pantsDark,
  shoe: C.shoe,
  chair: '#8f6bb3',
  chairDark: '#6b4d8c',
  lips: C.lips,
  lashes: true,
  drinkProp: 'mug',
  headR: 40,
};

const r = MUMMY_LOOK.headR;
const H = MUMMY_SPEC.hair;

export const mummyHairBack = (turn: number) => (
  <g>
    <path
      d={`M ${-r * 1.04} ${r * 0.1} Q ${-r * 1.18} ${-r * 1.12} ${turn * 6} ${-r * 1.14} Q ${r * 1.18} ${-r * 1.12} ${r * 1.04} ${r * 0.1} L ${r * 0.98} ${r * 0.85} Q ${turn * 6} ${r * 1.12} ${-r * 0.98} ${r * 0.85} Z`}
      fill={H}
      stroke={OUTLINE}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <circle cx={-r * 0.98 - turn * 6} cy={r * 0.25} r={r * 0.42} fill={H} stroke={OUTLINE} strokeWidth={3} />
    <path d={`M ${-r * 1.2} ${r * 0.2} q ${r * 0.2} -${r * 0.25} ${r * 0.42} -${r * 0.1}`} fill="none" stroke="#e0a83a" strokeWidth={4} strokeLinecap="round" />
  </g>
);

export const mummyHairFront = (turn: number) => {
  const t = turn * 8;
  return (
    <path
      d={`M ${-r * 0.96} ${r * 0.25} Q ${-r * 1.02} ${-r * 1.02} ${t} ${-r * 1.06} Q ${r * 1.02} ${-r * 1.02} ${r * 0.96} ${r * 0.2} Q ${r * 0.86} ${-r * 0.4} ${r * 0.35 + t} ${-r * 0.58} Q ${t - r * 0.1} ${-r * 0.35} ${-r * 0.55 + t} ${-r * 0.5} Q ${-r * 0.82} ${-r * 0.2} ${-r * 0.96} ${r * 0.25} Z`}
      fill={H}
      stroke={OUTLINE}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  );
};

export const mummyExtras = (turn: number) => {
  const dx = turn * r * 0.24;
  return (
    <g>
      <circle cx={dx} cy={-r * 0.2} r={3.6} fill={C.bindi} />
      {turn < 0.5 && <circle cx={-r * 0.95 + turn * 8} cy={r * 0.38} r={5} fill={C.gold} stroke={OUTLINE} strokeWidth={1.5} />}
      {turn > -0.5 && <circle cx={r * 0.95 + turn * 8} cy={r * 0.38} r={5} fill={C.gold} stroke={OUTLINE} strokeWidth={1.5} />}
    </g>
  );
};

export const Mummy = memo(function Mummy() {
  const m = useGame((s) => s.characters.mummy);
  const talking = useGame((s) => !!s.dialogues.mummy);
  return (
    <SeatedAdult
      look={MUMMY_LOOK}
      activity={m.activity}
      expr={m.expr}
      talking={talking}
      hairBack={mummyHairBack}
      hairFront={mummyHairFront}
      extras={mummyExtras}
      blinkDelay={2.1}
    />
  );
});
