// Reusable small object illustrations (drawn around their own origin) used by rooms & characters.
import { OUTLINE } from '../data/characters';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export const Ball = ({ r = 20 }: { r?: number }) => (
  <g>
    <circle r={r} fill="#ef5d5d" {...S} />
    <path d={`M ${-r} 0 Q 0 ${r * 0.55} ${r} 0`} fill="none" stroke="#fff" strokeWidth={r * 0.28} />
    <path d={`M ${-r * 0.2} ${-r} Q ${r * 0.35} 0 ${-r * 0.2} ${r}`} fill="none" stroke="#ffd34d" strokeWidth={r * 0.25} />
    <circle r={r} fill="none" {...S} />
    <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.22} ry={r * 0.12} fill="#fff" opacity={0.6} />
  </g>
);

export const Robot = () => (
  <g>
    <line x1={0} y1={-46} x2={0} y2={-58} {...S} />
    <circle cx={0} cy={-60} r={5} fill="#f2545b" {...S} />
    <rect x={-20} y={-46} width={40} height={30} rx={8} fill="#9fb8cc" {...S} />
    <circle cx={-8} cy={-32} r={5} fill="#fff" stroke={OUTLINE} strokeWidth={2} />
    <circle cx={8} cy={-32} r={5} fill="#fff" stroke={OUTLINE} strokeWidth={2} />
    <circle cx={-8} cy={-32} r={2} fill={OUTLINE} />
    <circle cx={8} cy={-32} r={2} fill={OUTLINE} />
    <path d="M -6 -22 Q 0 -18 6 -22" fill="none" stroke={OUTLINE} strokeWidth={2} />
    <rect x={-17} y={-14} width={34} height={26} rx={6} fill="#6f93b3" {...S} />
    <circle cx={0} cy={-1} r={5} fill="#ffd34d" stroke={OUTLINE} strokeWidth={2} />
    <rect x={-15} y={12} width={10} height={10} rx={3} fill="#4d6f8f" {...S} />
    <rect x={5} y={12} width={10} height={10} rx={3} fill="#4d6f8f" {...S} />
  </g>
);

export const Teddy = ({ s = 1 }: { s?: number }) => (
  <g transform={`scale(${s})`}>
    <circle cx={-22} cy={-58} r={11} fill="#b9814f" {...S} />
    <circle cx={22} cy={-58} r={11} fill="#b9814f" {...S} />
    <circle cx={-22} cy={-58} r={5} fill="#e3b58a" />
    <circle cx={22} cy={-58} r={5} fill="#e3b58a" />
    <ellipse cx={0} cy={-8} rx={30} ry={28} fill="#b9814f" {...S} />
    <ellipse cx={0} cy={-4} rx={17} ry={16} fill="#e3b58a" />
    <ellipse cx={-26} cy={16} rx={12} ry={10} fill="#b9814f" {...S} />
    <ellipse cx={26} cy={16} rx={12} ry={10} fill="#b9814f" {...S} />
    <circle cx={0} cy={-46} r={26} fill="#c48a56" {...S} />
    <ellipse cx={0} cy={-38} rx={12} ry={9} fill="#e3b58a" />
    <ellipse cx={0} cy={-42} rx={5} ry={4} fill={OUTLINE} />
    <circle cx={-9} cy={-52} r={3.5} fill={OUTLINE} />
    <circle cx={9} cy={-52} r={3.5} fill={OUTLINE} />
    <path d="M -5 -34 Q 0 -30 5 -34" fill="none" stroke={OUTLINE} strokeWidth={2} />
    <path d="M -10 -22 L 0 -16 L 10 -22 L 10 -12 L 0 -18 L -10 -12 Z" fill="#e65a6b" stroke={OUTLINE} strokeWidth={2} />
  </g>
);

export const Duck = () => (
  <g>
    <ellipse cx={0} cy={0} rx={22} ry={15} fill="#ffd23f" {...S} />
    <circle cx={12} cy={-16} r={12} fill="#ffd23f" {...S} />
    <path d="M 22 -16 L 33 -13 L 22 -10 Z" fill="#f28c28" {...S} />
    <circle cx={15} cy={-19} r={2.5} fill={OUTLINE} />
    <path d="M -10 -4 Q -2 4 8 -2" fill="none" stroke="#e6b51c" strokeWidth={3} />
  </g>
);

export const Bottle = ({ color = '#5ab4d6' }: { color?: string }) => (
  <g>
    <rect x={-10} y={-44} width={20} height={44} rx={6} fill={color} {...S} />
    <rect x={-7} y={-54} width={14} height={11} rx={3} fill="#2f5d7a" {...S} />
    <rect x={-10} y={-32} width={20} height={12} fill="#ffffff" opacity={0.5} />
    <rect x={-6} y={-40} width={3} height={30} rx={1.5} fill="#fff" opacity={0.6} />
  </g>
);

export const Mug = () => (
  <g>
    <path d="M 12 -24 Q 26 -24 24 -14 Q 22 -6 12 -8" fill="none" stroke={OUTLINE} strokeWidth={4} />
    <rect x={-14} y={-30} width={28} height={30} rx={5} fill="#f4efe6" {...S} />
    <path d="M -8 -17 q 4 -6 8 0 q 4 -6 8 0 q -8 10 -8 10 q 0 0 -8 -10" fill="#e66a7b" />
  </g>
);

export const Phone = ({ glow = false }: { glow?: boolean }) => (
  <g>
    <rect x={-11} y={-20} width={22} height={40} rx={5} fill="#2c2f3a" {...S} />
    <rect x={-8} y={-15} width={16} height={28} rx={2} fill={glow ? '#bfe8ff' : '#3a4a68'} />
    {glow && <rect x={-6} y={-12} width={12} height={4} rx={2} fill="#ff8f6b" />}
  </g>
);

export const Guitar = () => (
  <g>
    <rect x={-6} y={-150} width={12} height={110} rx={3} fill="#8a5a33" {...S} />
    <rect x={-10} y={-178} width={20} height={30} rx={6} fill="#5e3b22" {...S} />
    {[-170, -162, -154].map((y) => (
      <g key={y}>
        <circle cx={-13} cy={y} r={3} fill="#e8d6a8" />
        <circle cx={13} cy={y} r={3} fill="#e8d6a8" />
      </g>
    ))}
    <path d="M 0 -50 C -40 -55 -44 -15 -26 0 C -50 20 -40 62 0 62 C 40 62 50 20 26 0 C 44 -15 40 -55 0 -50 Z" fill="#e48a3c" {...S} />
    <path d="M 0 -42 C -30 -46 -34 -14 -18 0 C -38 18 -30 52 0 52 C 30 52 38 18 18 0 C 34 -14 30 -46 0 -42 Z" fill="#f3a650" />
    <circle cx={0} cy={0} r={11} fill="#4a2c1a" stroke={OUTLINE} strokeWidth={2} />
    <rect x={-14} y={30} width={28} height={6} rx={2} fill="#4a2c1a" />
    {[-3, 0, 3].map((dx) => (
      <line key={dx} x1={dx} y1={-148} x2={dx} y2={33} stroke="#f5eedc" strokeWidth={1} className="guitar-string" />
    ))}
  </g>
);

export const Dumbbell = () => (
  <g>
    <rect x={-20} y={-3} width={40} height={6} rx={3} fill="#8d939c" {...S} />
    <rect x={-30} y={-14} width={12} height={28} rx={4} fill="#3d4450" {...S} />
    <rect x={18} y={-14} width={12} height={28} rx={4} fill="#3d4450" {...S} />
  </g>
);

export const Barbell = ({ w = 170 }: { w?: number }) => (
  <g>
    <rect x={-w / 2} y={-3} width={w} height={6} rx={3} fill="#a3a9b2" {...S} />
    <rect x={-w / 2 + 6} y={-26} width={14} height={52} rx={5} fill="#d9534f" {...S} />
    <rect x={-w / 2 + 20} y={-20} width={10} height={40} rx={4} fill="#2f343d" {...S} />
    <rect x={w / 2 - 20} y={-26} width={14} height={52} rx={5} fill="#d9534f" {...S} />
    <rect x={w / 2 - 30} y={-20} width={10} height={40} rx={4} fill="#2f343d" {...S} />
  </g>
);

export const CurlRod = ({ w = 120 }: { w?: number }) => (
  <g>
    <path d={`M ${-w / 2} 0 L ${-w / 4} 0 L ${-w / 8} -6 L 0 0 L ${w / 8} -6 L ${w / 4} 0 L ${w / 2} 0`} fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinejoin="round" />
    <path d={`M ${-w / 2} 0 L ${-w / 4} 0 L ${-w / 8} -6 L 0 0 L ${w / 8} -6 L ${w / 4} 0 L ${w / 2} 0`} fill="none" stroke="#b4bac3" strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2 - 4} y={-15} width={12} height={30} rx={4} fill="#3a7bd5" {...S} />
    <rect x={w / 2 - 8} y={-15} width={12} height={30} rx={4} fill="#3a7bd5" {...S} />
  </g>
);

export const Hairbrush = () => (
  <g>
    <rect x={-5} y={0} width={10} height={34} rx={5} fill="#c9566a" {...S} />
    <ellipse cx={0} cy={-10} rx={14} ry={18} fill="#e7798b" {...S} />
    {[-6, 0, 6].map((x) => [-18, -10, -2].map((y) => <circle key={x + ':' + y} cx={x} cy={y} r={1.8} fill="#fff" />))}
  </g>
);

export const Book = ({ color = '#4f9d69', open = false }: { color?: string; open?: boolean }) =>
  open ? (
    <g>
      <path d="M 0 -20 Q -20 -26 -40 -20 L -40 22 Q -20 16 0 22 Z" fill="#fffaf0" {...S} />
      <path d="M 0 -20 Q 20 -26 40 -20 L 40 22 Q 20 16 0 22 Z" fill="#fffaf0" {...S} />
      <circle cx={-20} cy={-2} r={8} fill="#ffcf4a" />
      <path d="M 10 8 L 18 -6 L 26 8 Z" fill="#6cc070" />
      <path d="M 22 8 L 30 -2 L 36 8 Z" fill="#4f9d69" />
    </g>
  ) : (
    <g>
      <rect x={-16} y={-22} width={32} height={44} rx={3} fill={color} {...S} />
      <rect x={-12} y={-14} width={24} height={8} rx={2} fill="#fff" opacity={0.7} />
    </g>
  );

export const Pillow = ({ w = 110, h = 44, color = '#f8f3ff' }: { w?: number; h?: number; color?: string }) => (
  <g>
    <path d={`M ${-w / 2} ${-h / 2 + 6} Q 0 ${-h / 2 - 6} ${w / 2} ${-h / 2 + 6} Q ${w / 2 + 6} 0 ${w / 2} ${h / 2 - 6} Q 0 ${h / 2 + 6} ${-w / 2} ${h / 2 - 6} Q ${-w / 2 - 6} 0 ${-w / 2} ${-h / 2 + 6} Z`} fill={color} {...S} />
    <path d={`M ${-w / 2 + 14} ${-h / 2 + 10} Q 0 ${-h / 2 + 2} ${w / 2 - 14} ${-h / 2 + 10}`} fill="none" stroke="#d8cdea" strokeWidth={3} />
  </g>
);

export const Sunglasses = () => (
  <g>
    <rect x={-34} y={-9} width={28} height={18} rx={7} fill="#1d2330" {...S} />
    <rect x={6} y={-9} width={28} height={18} rx={7} fill="#1d2330" {...S} />
    <path d="M -6 -3 Q 0 -8 6 -3" fill="none" stroke={OUTLINE} strokeWidth={3} />
    <rect x={-28} y={-5} width={9} height={4} rx={2} fill="#fff" opacity={0.7} />
    <rect x={12} y={-5} width={9} height={4} rx={2} fill="#fff" opacity={0.7} />
  </g>
);

export const Lollipop = () => (
  <g>
    <line x1={0} y1={0} x2={0} y2={34} stroke="#f4f0e8" strokeWidth={5} />
    <circle cx={0} cy={-8} r={15} fill="#ff7eb6" {...S} />
    <path d="M 0 -8 m -9 0 a 9 9 0 1 1 9 9 a 5 5 0 1 1 -4 -6" fill="none" stroke="#fff" strokeWidth={3} />
  </g>
);

export const Keys = () => (
  <g>
    <circle cx={0} cy={-10} r={9} fill="none" stroke="#e0b43c" strokeWidth={4} />
    <rect x={-3} y={-2} width={6} height={24} rx={2} fill="#e0b43c" stroke={OUTLINE} strokeWidth={1.5} />
    <rect x={3} y={12} width={6} height={4} fill="#e0b43c" />
    <rect x={8} y={-6} width={5} height={22} rx={2} fill="#c0c6ce" stroke={OUTLINE} strokeWidth={1.5} transform="rotate(25)" />
  </g>
);

export const Dino = () => (
  <g>
    <path d="M -30 10 Q -36 -10 -14 -12 Q -6 -34 14 -30 Q 30 -28 28 -16 Q 22 -10 12 -12 Q 18 4 10 14 L 6 22 L -2 22 L 0 12 L -14 12 L -16 22 L -24 22 L -22 10 Q -34 18 -44 16 Q -34 12 -30 10 Z" fill="#6cc070" {...S} />
    <circle cx={18} cy={-22} r={2.5} fill={OUTLINE} />
    <path d="M -12 -14 l 4 -7 l 4 6 l 4 -7 l 4 6" fill="#ffd34d" stroke={OUTLINE} strokeWidth={2} />
  </g>
);

export const Heart = ({ s = 1, color = '#ff6f91' }: { s?: number; color?: string }) => (
  <path transform={`scale(${s})`} d="M 0 8 C -14 -2 -12 -14 -5 -14 C -2 -14 0 -11 0 -9 C 0 -11 2 -14 5 -14 C 12 -14 14 -2 0 8 Z" fill={color} stroke={OUTLINE} strokeWidth={2} />
);

export const Note = () => (
  <g>
    <rect x={-20} y={-16} width={40} height={30} rx={3} fill="#fff6d8" {...S} transform="rotate(-6)" />
    <Heart s={0.8} />
  </g>
);

export const ToyCar = () => (
  <g>
    <path d="M -24 6 L -24 -6 Q -18 -8 -12 -8 L -6 -18 L 10 -18 L 16 -8 L 24 -6 L 24 6 Z" fill="#3fa7d6" {...S} />
    <rect x={-4} y={-15} width={9} height={7} fill="#e9f6ff" />
    <circle cx={-13} cy={7} r={6} fill="#2d2d2d" stroke={OUTLINE} strokeWidth={2} />
    <circle cx={13} cy={7} r={6} fill="#2d2d2d" stroke={OUTLINE} strokeWidth={2} />
  </g>
);

export const Blocks = () => (
  <g>
    <rect x={-22} y={-14} width={20} height={20} rx={3} fill="#f2545b" {...S} />
    <rect x={2} y={-14} width={20} height={20} rx={3} fill="#4fb0e8" {...S} />
    <rect x={-10} y={-34} width={20} height={20} rx={3} fill="#ffd23f" {...S} />
  </g>
);

export const OfficeMouse = () => (
  <g>
    <ellipse cx={0} cy={0} rx={13} ry={8} fill="#e9ecf1" {...S} />
    <line x1={0} y1={-8} x2={0} y2={-2} stroke={OUTLINE} strokeWidth={2} />
  </g>
);

export const Zzz = () => (
  <g className="zzz">
    <text x={0} y={0} fontSize={26} fontWeight={700} fill="#7c8cc8">z</text>
    <text x={14} y={-20} fontSize={20} fontWeight={700} fill="#7c8cc8">z</text>
    <text x={26} y={-36} fontSize={15} fontWeight={700} fill="#7c8cc8">z</text>
  </g>
);

export const Apple = () => (
  <g>
    <path d="M 0 -12 C -14 -20 -20 -4 -16 6 C -12 16 -4 16 0 13 C 4 16 12 16 16 6 C 20 -4 14 -20 0 -12 Z" fill="#e8483f" {...S} />
    <path d="M -9 -6 q -3 5 0 10" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.5} fill="none" />
    <path d="M 0 -12 Q 1 -20 4 -24" stroke={OUTLINE} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M 3 -20 Q 12 -26 15 -18 Q 8 -15 3 -20 Z" fill="#6fbf4a" stroke={OUTLINE} strokeWidth={2} />
  </g>
);

export const BubbleWand = () => (
  <g>
    <line x1={0} y1={0} x2={0} y2={-34} stroke="#ff7eb6" strokeWidth={5} strokeLinecap="round" />
    <line x1={0} y1={0} x2={0} y2={-34} stroke={OUTLINE} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
    <circle cx={0} cy={-44} r={10} fill="rgba(200,240,255,0.35)" stroke="#ff7eb6" strokeWidth={4} />
  </g>
);

export const BubbleBottle = ({ wand = true }: { wand?: boolean }) => (
  <g>
    <rect x={-13} y={-36} width={26} height={36} rx={7} fill="#8fd9ff" {...S} />
    <rect x={-13} y={-22} width={26} height={12} fill="#fff" opacity={0.6} />
    <circle cx={-2} cy={-16} r={4} fill="none" stroke="#5aa9d6" strokeWidth={1.5} />
    <circle cx={5} cy={-14} r={2.5} fill="none" stroke="#5aa9d6" strokeWidth={1.5} />
    <rect x={-9} y={-44} width={18} height={10} rx={3} fill="#ff7eb6" {...S} strokeWidth={2} />
    {wand && (
      <g>
        <line x1={10} y1={-40} x2={16} y2={-68} stroke="#ff7eb6" strokeWidth={4} strokeLinecap="round" />
        <circle cx={17} cy={-74} r={7} fill="none" stroke="#ff7eb6" strokeWidth={3} />
      </g>
    )}
  </g>
);

// ------------------------------------------------------------------ kitchen food
export const Cookie = () => (
  <g>
    <circle r={15} fill="#d9a05b" {...S} />
    {[[-6, -5], [5, -7], [7, 5], [-4, 7], [0, 0]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={2.6} fill="#5a3b2a" />
    ))}
  </g>
);

export const Sandwich = ({ layers = 5 }: { layers?: number }) => (
  <g>
    {layers >= 1 && <path d="M -26 8 L 26 8 L 0 -18 Z" fill="#f3d39b" {...S} strokeWidth={2.5} />}
    {layers >= 2 && <path d="M -22 2 L 22 2" stroke="#ffd23f" strokeWidth={6} strokeLinecap="round" />}
    {layers >= 3 && <path d="M -18 -3 L 18 -3" stroke="#e2483f" strokeWidth={5} strokeLinecap="round" />}
    {layers >= 4 && <path d="M -14 -8 Q 0 -4 14 -8" stroke="#6fbf4a" strokeWidth={5} strokeLinecap="round" fill="none" />}
    {layers >= 5 && <path d="M -16 -6 L 16 -6 L 0 -26 Z" fill="#f3d39b" {...S} strokeWidth={2.5} />}
  </g>
);

export const Banana = () => (
  <g>
    <path d="M -20 -6 Q 0 22 24 -10 Q 22 -2 12 6 Q -4 14 -20 -6 Z" fill="#ffd23f" {...S} strokeWidth={2.5} />
    <path d="M 24 -10 l 4 -4" stroke="#5a3b2a" strokeWidth={4} strokeLinecap="round" />
  </g>
);

export const JuiceBox = () => (
  <g>
    <rect x={-11} y={-20} width={22} height={30} rx={3} fill="#ff9f43" {...S} strokeWidth={2.5} />
    <circle cx={0} cy={-4} r={6} fill="#ffd23f" stroke={OUTLINE} strokeWidth={1.5} />
    <path d="M 5 -20 L 9 -32 L 15 -34" fill="none" stroke="#5fd4ff" strokeWidth={3} strokeLinecap="round" />
  </g>
);

export const Popcorn = () => (
  <g>
    {[[-10, -18], [0, -22], [10, -18], [-5, -26], [6, -28]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={6} fill="#fff6d0" stroke={OUTLINE} strokeWidth={1.8} />
    ))}
    <path d="M -15 -14 L 15 -14 L 11 14 L -11 14 Z" fill="#fff" {...S} strokeWidth={2.5} />
    <path d="M -8 -14 L -6 14 M 2 -14 L 2 14 M 10 -14 L 8 14" stroke="#e2483f" strokeWidth={4} />
  </g>
);

export const Cupcake = ({ candle = false }: { candle?: boolean }) => (
  <g>
    <path d="M -14 0 L 14 0 L 10 18 L -10 18 Z" fill="#7fc8e8" {...S} strokeWidth={2.5} />
    <path d="M -17 2 Q -20 -14 -6 -14 Q 0 -24 8 -14 Q 20 -14 17 2 Z" fill="#ffb3d1" {...S} strokeWidth={2.5} />
    {candle ? (
      <g>
        <rect x={-2} y={-32} width={4} height={14} fill="#5fd4ff" stroke={OUTLINE} strokeWidth={1.5} />
        <path d="M 0 -42 Q 5 -36 0 -33 Q -5 -36 0 -42 Z" fill="#ffb347" className="flame" />
      </g>
    ) : (
      <circle cx={0} cy={-18} r={4.5} fill="#e2483f" stroke={OUTLINE} strokeWidth={1.5} />
    )}
  </g>
);

/** Renders any food item by name. */
export const Food = ({ item }: { item: string }) =>
  item === 'cookie' ? <Cookie /> : item === 'sandwich' ? <Sandwich /> : item === 'banana' ? <Banana /> : item === 'juice' ? <JuiceBox /> : item === 'popcorn' ? <Popcorn /> : item === 'cupcake' ? <Cupcake /> : null;
