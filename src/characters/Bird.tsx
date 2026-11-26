import type { Bird, BirdKind } from '../state/gameTypes';
import { OUTLINE } from '../data/characters';

/** Garden birds: sparrow, myna, bulbul and the odd parrot. Origin = feet, facing +x. */
const BIRD_LOOK: Record<BirdKind, { body: string; wing: string; head: string; beak: string; belly: string }> = {
  sparrow: { body: '#b07a4a', wing: '#7a4f2a', head: '#8e8e8e', beak: '#3b3f46', belly: '#e9dcc6' },
  myna: { body: '#6b4a3a', wing: '#3d2a22', head: '#2b2222', beak: '#ffc21a', belly: '#8a6a5a' },
  bulbul: { body: '#8a7a6a', wing: '#5e5248', head: '#2b2222', beak: '#2b2222', belly: '#e9e2d6' },
  parrot: { body: '#4fc24a', wing: '#2f9a3a', head: '#5fd45a', beak: '#e2483f', belly: '#8fe07a' },
};

export const BirdFigure = ({ kind, mode }: { kind: BirdKind; mode: Bird['mode'] }) => {
  const c = BIRD_LOOK[kind];
  return (
    <g className={mode === 'peck' ? 'bird-peck' : mode === 'hop' ? 'bird-hop' : undefined}>
      {mode !== 'fly' && <ellipse cx={0} cy={2} rx={16} ry={3} fill="#000" opacity={0.12} />}
      {/* tail */}
      <path d={kind === 'parrot' ? 'M -14 -14 L -44 -2 L -40 -10 Z' : 'M -14 -14 L -32 -8 L -30 -18 Z'} fill={c.wing} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
      {mode !== 'fly' && <path d="M -2 -4 L -4 2 M 6 -4 L 6 2" stroke="#d07a3a" strokeWidth={2.5} strokeLinecap="round" />}
      <ellipse cx={0} cy={-16} rx={17} ry={12} fill={c.body} stroke={OUTLINE} strokeWidth={2.5} />
      <ellipse cx={4} cy={-11} rx={10} ry={6} fill={c.belly} />
      {kind === 'bulbul' && <ellipse cx={-10} cy={-6} rx={5} ry={4} fill="#e2483f" />}
      <g className={mode === 'peck' ? 'bird-head' : undefined} style={{ transformOrigin: '10px -18px' }}>
        <circle cx={14} cy={-28} r={10} fill={c.head} stroke={OUTLINE} strokeWidth={2.5} />
        {kind === 'bulbul' && <path d="M 8 -36 L 10 -48 L 16 -37 Z" fill={c.head} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />}
        {kind === 'bulbul' && <circle cx={14} cy={-24} r={4} fill="#fff" />}
        {kind === 'sparrow' && <path d="M 14 -20 Q 20 -16 24 -22" stroke={OUTLINE} strokeWidth={4} fill="none" />}
        {kind === 'myna' && <path d="M 16 -33 Q 22 -30 18 -25 Z" fill="#ffc21a" />}
        <circle cx={17} cy={-30} r={2.4} fill={kind === 'myna' || kind === 'bulbul' ? '#fff' : OUTLINE} />
        <circle cx={17.5} cy={-30} r={1.3} fill={OUTLINE} />
        <path d={kind === 'parrot' ? 'M 22 -30 Q 32 -28 26 -20 L 22 -24 Z' : 'M 23 -29 L 31 -27 L 23 -25 Z'} fill={c.beak} stroke={OUTLINE} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
      <g className={mode === 'fly' ? 'bird-wing' : undefined} style={{ transformOrigin: '-2px -18px' }}>
        <path d="M -8 -20 Q 2 -34 10 -18 Q 0 -12 -8 -20 Z" fill={c.wing} stroke={OUTLINE} strokeWidth={2} />
      </g>
    </g>
  );
};

