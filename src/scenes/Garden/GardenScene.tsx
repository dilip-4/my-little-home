import { memo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useGame, getGame } from '../../state/gameStore';
import type { DayPeriod, DiggerState, PlantState } from '../../state/gameTypes';
import { OUTLINE } from '../../data/characters';
import { BED_Y, PLANT_X, SANDPIT, SOIL_PATCH, SWING } from '../../data/spots';
import { InteractiveObject as Hot } from '../../components/InteractiveObject';
import { RoomDoor } from '../../components/RoomDoor';
import { Sparkle, Hearts, Projectile } from '../../components/Effects';
import { Ball, Dino, SeedBag, Tomato, WateringCan, Spade } from '../../components/props';
import { KidActor } from '../../characters/KidActor';
import { KidFigure } from '../../characters/Kid';
import { PupActor } from '../../characters/Pup';
import { HideMarkers } from '../../components/HideSeek';
import { AudioManager } from '../../engine/AudioManager';
import { tapBird, tapButterfly } from './interactions';
import { BirdFigure } from '../../characters/Bird';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const R = 'garden';

// ------------------------------------------------------------------ sky & background
const SKY: Record<DayPeriod, [string, string]> = {
  morning: ['#bfe7ff', '#eaf8ff'],
  afternoon: ['#8fd3ff', '#d8f1ff'],
  evening: ['#ff9f6e', '#ffe0b8'],
  night: ['#141c3d', '#34447a'],
};

const Sky = ({ period }: { period: DayPeriod }) => (
  <g>
    <defs>
      <linearGradient id="gd-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SKY[period][0]} />
        <stop offset="1" stopColor={SKY[period][1]} />
      </linearGradient>
    </defs>
    <rect width={1440} height={560} fill="url(#gd-sky)" />
    {period === 'night' ? (
      <g>
        {[[260, 80], [420, 150], [610, 60], [760, 130], [900, 70], [1010, 160], [560, 210], [330, 250]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 ? 2.5 : 3.5} fill="#fff8d0" className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
        <circle cx={820} cy={110} r={42} fill="#fff6d0" />
        <circle cx={838} cy={98} r={40} fill={SKY.night[0]} />
      </g>
    ) : (
      <g>
        <circle cx={period === 'evening' ? 900 : 800} cy={period === 'evening' ? 330 : 110} r={54} fill={period === 'evening' ? '#ff7a4a' : '#ffd34d'} opacity={0.95} />
        <g className="cloud-drift">
          <g fill="#fff" opacity={0.9}>
            <ellipse cx={420} cy={120} rx={70} ry={26} />
            <ellipse cx={470} cy={104} rx={46} ry={30} />
            <ellipse cx={380} cy={108} rx={36} ry={22} />
          </g>
        </g>
        <g className="cloud-drift slow">
          <g fill="#fff" opacity={0.8}>
            <ellipse cx={980} cy={200} rx={60} ry={20} />
            <ellipse cx={1020} cy={188} rx={38} ry={24} />
          </g>
        </g>
      </g>
    )}
    {/* distant hills */}
    <path d="M 0 470 Q 260 380 520 450 Q 760 390 1000 440 Q 1240 380 1440 430 L 1440 560 L 0 560 Z" fill={period === 'night' ? '#2c4a46' : '#a6d99a'} />
  </g>
);

const Fence = () => (
  <g>
    <rect x={190} y={428} width={1250} height={14} fill="#e9c48f" {...S} strokeWidth={2.5} />
    <rect x={190} y={486} width={1250} height={14} fill="#e9c48f" {...S} strokeWidth={2.5} />
    {Array.from({ length: 28 }, (_, i) => {
      const x = 200 + i * 46;
      return <path key={i} d={`M ${x} 530 L ${x} 410 L ${x + 15} 394 L ${x + 30} 410 L ${x + 30} 530 Z`} fill="#fff1d6" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />;
    })}
  </g>
);

const HouseWall = () => (
  <g>
    <rect x={0} y={120} width={205} height={540} fill="#f6d9b8" {...S} />
    {Array.from({ length: 11 }, (_, j) => (
      <path key={j} d={`M 0 ${150 + j * 46} L 205 ${150 + j * 46}`} stroke="#e8c39a" strokeWidth={3} />
    ))}
    <path d="M -10 128 L 215 128 L 215 108 L -10 108 Z" fill="#e2705c" {...S} />
    {/* outside tap */}
    <rect x={186} y={540} width={26} height={14} rx={4} fill="#9aa6b8" {...S} strokeWidth={2} />
    <circle cx={199} cy={534} r={7} fill="#e2483f" stroke={OUTLINE} strokeWidth={2} />
  </g>
);

const Tree = ({ shake }: { shake: boolean }) => (
  <g>
    <path d="M 1270 640 Q 1282 470 1262 300 L 1342 300 Q 1322 470 1340 640 Z" fill="#a8743f" {...S} />
    <path d="M 1290 600 Q 1296 520 1286 440" stroke="#8a5a2e" strokeWidth={4} fill="none" strokeLinecap="round" />
    {/* the swing branch */}
    <path d="M 1280 340 Q 1180 316 1040 330" stroke={OUTLINE} strokeWidth={24} strokeLinecap="round" fill="none" />
    <path d="M 1280 340 Q 1180 316 1040 330" stroke="#a8743f" strokeWidth={17} strokeLinecap="round" fill="none" />
    <g className={shake ? 'tree-shake' : undefined} style={{ transformOrigin: '1300px 330px' }}>
    <g fill="#5fae55" {...S}>
      <circle cx={1300} cy={190} r={130} />
      <circle cx={1170} cy={250} r={90} />
      <circle cx={1410} cy={250} r={100} />
      <circle cx={1240} cy={90} r={90} />
      <circle cx={1380} cy={100} r={90} />
    </g>
    <g fill="#79c46c">
      <circle cx={1270} cy={160} r={60} />
      <circle cx={1180} cy={230} r={40} />
      <circle cx={1380} cy={210} r={44} />
    </g>
    {/* a few mangoes */}
    {[[1210, 280], [1350, 290], [1300, 250]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={10} ry={13} fill="#ffb43f" stroke={OUTLINE} strokeWidth={2} />
    ))}
    </g>
  </g>
);

// ------------------------------------------------------------------ plants
const SIGN: Record<PlantState['kind'], JSX.Element> = {
  sunflower: (
    <g>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={0} cy={-7} rx={3.5} ry={6} fill="#ffd23f" transform={`rotate(${a})`} />
      ))}
      <circle r={4} fill="#7a4a22" />
    </g>
  ),
  tomato: <circle r={7} fill="#e8483f" stroke={OUTLINE} strokeWidth={1.5} />,
  flower: (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={0} cy={-5} r={4} fill="#ff8fc0" transform={`rotate(${a})`} />
      ))}
      <circle r={3} fill="#ffd23f" />
    </g>
  ),
};

const Leaf = ({ x, y, flip = false, s = 1 }: { x: number; y: number; flip?: boolean; s?: number }) => (
  <path
    d="M 0 0 Q 18 -16 34 -4 Q 18 8 0 0 Z"
    fill="#6fbf4a"
    stroke={OUTLINE}
    strokeWidth={2}
    transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}
  />
);

const Plant = memo(function Plant({ p, x }: { p: PlantState; x: number }) {
  const h = [0, 34, 100, p.kind === 'sunflower' ? 210 : p.kind === 'tomato' ? 130 : 110][p.stage];
  return (
    <g transform={`translate(${x} ${BED_Y})`}>
      {/* wet soil */}
      {p.wateredAt !== null && <ellipse cx={0} cy={0} rx={40} ry={8} fill="#5a3b22" opacity={0.55} />}
      {/* little seed-packet sign */}
      <g transform="translate(-34 -4)">
        <path d="M 0 0 L 0 -34" stroke="#c48a56" strokeWidth={4} strokeLinecap="round" />
        <rect x={-14} y={-56} width={28} height={24} rx={3} fill="#fffaf2" stroke={OUTLINE} strokeWidth={2} />
        <g transform="translate(0 -44)">{SIGN[p.kind]}</g>
      </g>
      <g key={p.stage} className="pop-in" style={{ transformOrigin: '0px 0px' }}>
        {p.stage === 0 && (
          <g>
            <ellipse cx={0} cy={-2} rx={16} ry={7} fill="#7a5232" {...S} strokeWidth={2} />
            <ellipse cx={2} cy={-6} rx={4} ry={3} fill="#c9a26a" />
          </g>
        )}
        {p.stage >= 1 && (
          <path d={`M 0 0 Q ${p.stage >= 2 ? 6 : 2} ${-h / 2} 0 ${-h}`} stroke={OUTLINE} strokeWidth={p.stage === 3 && p.kind === 'sunflower' ? 11 : 8} fill="none" strokeLinecap="round" />
        )}
        {p.stage >= 1 && (
          <path d={`M 0 0 Q ${p.stage >= 2 ? 6 : 2} ${-h / 2} 0 ${-h}`} stroke="#5aa83f" strokeWidth={p.stage === 3 && p.kind === 'sunflower' ? 7 : 4.5} fill="none" strokeLinecap="round" />
        )}
        {p.stage === 1 && (
          <g>
            <Leaf x={0} y={-h} s={0.6} />
            <Leaf x={0} y={-h} s={0.6} flip />
          </g>
        )}
        {p.stage >= 2 && (
          <g>
            <Leaf x={2} y={-h * 0.35} />
            <Leaf x={2} y={-h * 0.55} flip />
            {p.stage === 3 && <Leaf x={2} y={-h * 0.75} s={0.8} />}
          </g>
        )}
        {p.stage === 2 && (
          <g transform={`translate(0 ${-h})`}>
            <ellipse cx={0} cy={-8} rx={11} ry={14} fill={p.kind === 'flower' ? '#ff8fc0' : p.kind === 'tomato' ? '#9be07a' : '#9be07a'} {...S} strokeWidth={2} />
            <path d="M -10 0 Q 0 -10 10 0" fill="#6fbf4a" stroke={OUTLINE} strokeWidth={2} />
          </g>
        )}
        {p.stage === 3 && p.kind === 'sunflower' && (
          <g transform={`translate(0 ${-h})`}>
          <g className="sun-sway">
            {Array.from({ length: 14 }, (_, i) => (
              <ellipse key={i} cx={0} cy={-34} rx={10} ry={20} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} transform={`rotate(${i * (360 / 14)})`} />
            ))}
            <circle r={26} fill="#8a5a2e" {...S} />
            <circle cx={-9} cy={-6} r={3.5} fill={OUTLINE} />
            <circle cx={9} cy={-6} r={3.5} fill={OUTLINE} />
            <path d="M -9 6 Q 0 14 9 6" stroke={OUTLINE} strokeWidth={3} fill="none" strokeLinecap="round" />
          </g>
          </g>
        )}
        {p.stage === 3 && p.kind === 'tomato' && (
          <g>
            <g fill="#5aa83f" stroke={OUTLINE} strokeWidth={2}>
              <ellipse cx={-16} cy={-h + 20} rx={26} ry={20} />
              <ellipse cx={16} cy={-h + 30} rx={24} ry={20} />
              <ellipse cx={0} cy={-h + 6} rx={22} ry={18} />
            </g>
            <g transform={`translate(-18 ${-h + 40})`}><Tomato /></g>
            <g transform={`translate(20 ${-h + 46}) scale(0.9)`}><Tomato /></g>
            <g transform={`translate(2 ${-h + 22}) scale(0.85)`}><Tomato /></g>
          </g>
        )}
        {p.stage === 3 && p.kind === 'flower' && (
          <g>
            {[[-22, -h + 16], [0, -h], [22, -h + 22]].map(([fx, fy], i) => (
              <g key={i} transform={`translate(${fx} ${fy})`}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <circle key={a} cx={0} cy={-11} r={10} fill={i === 1 ? '#ff6fae' : '#ff9fd0'} stroke={OUTLINE} strokeWidth={2} transform={`rotate(${a})`} />
                ))}
                <circle r={7} fill="#ffd23f" stroke={OUTLINE} strokeWidth={2} />
              </g>
            ))}
            <path d={`M 0 ${-h * 0.6} L -22 ${-h + 16} M 0 ${-h * 0.6} L 22 ${-h + 22}`} stroke="#5aa83f" strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
});

// ------------------------------------------------------------------ excavator
const depth = (y: number) => 0.72 + ((y - (SANDPIT.cy - SANDPIT.ry)) / (SANDPIT.ry * 2)) * 0.28;

const ARM: Record<DiggerState['arm'], { boom: number; stick: number; bucket: number }> = {
  rest: { boom: -20, stick: 70, bucket: 40 },
  dig: { boom: 18, stick: 60, bucket: 10 },
  lift: { boom: -45, stick: 40, bucket: 70 },
  dump: { boom: -55, stick: 20, bucket: -60 },
};

const Excavator = ({ d }: { d: DiggerState }) => {
  const a = ARM[d.arm];
  const T = 'transform 420ms cubic-bezier(.3,1.2,.5,1)';
  return (
    <g>
      <ellipse cx={0} cy={4} rx={66} ry={9} fill="#000" opacity={0.15} />
      {/* crawler tracks */}
      <rect x={-62} y={-30} width={110} height={32} rx={16} fill="#3b3f46" {...S} />
      {[-44, -20, 4, 30].map((x) => (
        <circle key={x} cx={x} cy={-14} r={8} fill="#7c8594" stroke={OUTLINE} strokeWidth={2} />
      ))}
      {/* body + cab */}
      <rect x={-58} y={-62} width={94} height={34} rx={8} fill="#ffc021" {...S} />
      <rect x={-68} y={-56} width={14} height={24} rx={4} fill="#e8a21a" {...S} strokeWidth={2} />
      <path d="M -20 -62 L -20 -106 Q -20 -112 -12 -112 L 22 -112 Q 30 -112 30 -104 L 30 -62 Z" fill="#ffc021" {...S} />
      <rect x={-12} y={-104} width={34} height={30} rx={5} fill="#bfe3f2" stroke={OUTLINE} strokeWidth={2.5} />
      <path d="M -6 -100 L 4 -80" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      <rect x={-48} y={-78} width={10} height={18} rx={2} fill="#5a6070" stroke={OUTLINE} strokeWidth={2} />
      {/* arm: boom → stick → bucket */}
      <g style={{ transform: `translate(30px, -66px) rotate(${a.boom}deg)`, transition: T }}>
        <rect x={0} y={-10} width={78} height={20} rx={9} fill="#ffc021" {...S} />
        <g style={{ transform: `translate(72px, 0px) rotate(${a.stick}deg)`, transition: T }}>
          <rect x={0} y={-7} width={56} height={14} rx={6} fill="#e8a21a" {...S} />
          <g style={{ transform: `translate(52px, 0px) rotate(${a.bucket}deg)`, transition: T }}>
            <path d="M 0 -6 L 10 22 L 30 24 Q 34 6 22 -6 Z" fill="#7c8594" {...S} />
            {d.load && <path d="M 4 -6 Q 14 -18 24 -6 Z" fill="#e9c47a" stroke={OUTLINE} strokeWidth={2} />}
          </g>
        </g>
      </g>
    </g>
  );
};

/** The child draws a road in the sand with a finger; the digger then drives along it. */
const TrackPad = () => {
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const drawing = useRef(false);
  const toScene = (e: RPointerEvent<SVGElement>) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    // keep the road inside the sandpit
    const dx = (p.x - SANDPIT.cx) / (SANDPIT.rx - 34);
    const dy = (p.y - SANDPIT.cy) / (SANDPIT.ry - 14);
    const k = Math.hypot(dx, dy);
    return k > 1 ? { x: SANDPIT.cx + (p.x - SANDPIT.cx) / k, y: SANDPIT.cy + (p.y - SANDPIT.cy) / k } : { x: p.x, y: p.y };
  };
  const finish = (e: RPointerEvent<SVGElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    const end = toScene(e);
    const last = pts[pts.length - 1];
    if (end && last && Math.hypot(end.x - last.x, end.y - last.y) > 6) pts.push(end);
    const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
    if (len < 80) {
      setPts([]);
      return;
    }
    AudioManager.play('pop');
    getGame().setFx('garden:trackPts', JSON.stringify(pts.map((p) => [Math.round(p.x), Math.round(p.y)])));
  };
  return (
    <g>
      <ellipse cx={SANDPIT.cx} cy={SANDPIT.cy} rx={SANDPIT.rx + 6} ry={SANDPIT.ry + 6} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="14 10" className="track-glow" />
      {pts.length > 1 && (
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#b8894a" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      )}
      {pts.length === 0 && (
        <g className="finger-hint" pointerEvents="none">
          <circle cx={SANDPIT.cx - 120} cy={SANDPIT.cy} r={18} fill="#fff" opacity={0.85} stroke={OUTLINE} strokeWidth={3} />
        </g>
      )}
      <ellipse
        cx={SANDPIT.cx}
        cy={SANDPIT.cy}
        rx={SANDPIT.rx + 40}
        ry={SANDPIT.ry + 40}
        fill="transparent"
        style={{ touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId);
          const p = toScene(e);
          if (!p) return;
          drawing.current = true;
          AudioManager.play('scribble');
          setPts([p]);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = toScene(e);
          if (!p) return;
          setPts((cur) => {
            const last = cur[cur.length - 1];
            return last && Math.hypot(p.x - last.x, p.y - last.y) < 12 ? cur : [...cur, p];
          });
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
    </g>
  );
};

// ------------------------------------------------------------------ birds & butterflies
const Birds = () => {
  const birds = useGame((s) => s.garden.birds);
  return (
    <g>
      {birds.map((b) => (
        <g key={b.id} style={{ transform: `translate(${b.x}px, ${b.y}px)`, transition: `transform ${b.moveMs}ms ${b.mode === 'fly' ? 'ease-in-out' : 'ease-out'}` }}>
          <Hot id={'bird-' + b.id} label={b.kind} hit={{ x: -34, y: -54, w: 72, h: 60 }} origin="0px 0px" onTap={() => tapBird(b.id)}>
            <g style={{ transform: `scaleX(${b.facing})` }}>
              <BirdFigure kind={b.kind} mode={b.mode} />
            </g>
          </Hot>
        </g>
      ))}
    </g>
  );
};

const ButterflyShape = ({ color }: { color: string }) => (
  <g>
    <g className="bfly-wing">
      <path d="M 0 0 Q -22 -26 -26 -6 Q -24 6 0 0 Z" fill={color} stroke={OUTLINE} strokeWidth={2} />
      <path d="M 0 0 Q -18 14 -12 20 Q -2 16 0 0 Z" fill={color} stroke={OUTLINE} strokeWidth={2} />
    </g>
    <g className="bfly-wing r">
      <path d="M 0 0 Q 22 -26 26 -6 Q 24 6 0 0 Z" fill={color} stroke={OUTLINE} strokeWidth={2} />
      <path d="M 0 0 Q 18 14 12 20 Q 2 16 0 0 Z" fill={color} stroke={OUTLINE} strokeWidth={2} />
    </g>
    <ellipse rx={3} ry={11} fill={OUTLINE} />
    <path d="M -1 -10 Q -6 -20 -9 -20 M 1 -10 Q 6 -20 9 -20" stroke={OUTLINE} strokeWidth={1.5} fill="none" />
  </g>
);

const Butterflies = () => {
  const onKid = useGame((s) => s.fx[R + ':bflyOnKid'] as number | undefined);
  const kid = useGame((s) => (s.fx[R + ':bflyOnKid'] !== undefined ? s.kid : null));
  const list = [
    { color: '#ffb43f', cls: 'bfly-path-a', x: 640, y: 440 },
    { color: '#9b7bff', cls: 'bfly-path-b', x: 860, y: 470 },
  ];
  return (
    <g>
      {list.map((b, i) =>
        onKid === i ? null : (
          <g key={i} transform={`translate(${b.x} ${b.y})`}>
            <g className={b.cls}>
              <Hot id={'butterfly-' + i} label="Butterfly" hit={{ x: -40, y: -40, w: 80, h: 80 }} origin="0px 0px" onTap={() => tapButterfly(i)}>
                <ButterflyShape color={b.color} />
              </Hot>
            </g>
          </g>
        ),
      )}
      {onKid !== undefined && kid && (
        <g transform={`translate(${kid.x + kid.facing * 26} ${kid.y - 236})`} pointerEvents="none">
          <g className="pop-in">
            <g transform="scale(0.8)"><ButterflyShape color={list[onKid].color} /></g>
          </g>
        </g>
      )}
    </g>
  );
};

const Fireflies = () => (
  <g pointerEvents="none">
    {[[300, 520], [480, 460], [620, 560], [760, 430], [900, 540], [1060, 470], [1180, 560], [1380, 520], [420, 600], [980, 380]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`}>
        <g className="firefly" style={{ animationDelay: `${i * 0.6}s`, animationDuration: `${5 + (i % 3)}s` }}>
          <circle r={10} fill="#fff6a0" opacity={0.25} />
          <circle r={4} fill="#fffbd0" />
        </g>
      </g>
    ))}
  </g>
);

// ------------------------------------------------------------------ dig patch & treasures
const Treasure = ({ kind }: { kind: string }) => {
  switch (kind) {
    case 'bone':
      return (
        <g transform="rotate(-20)">
          <rect x={-22} y={-5} width={44} height={10} rx={5} fill="#fffaf0" {...S} strokeWidth={2.5} />
          {[-22, 22].map((x) => (
            <g key={x}>
              <circle cx={x} cy={-6} r={7} fill="#fffaf0" {...S} strokeWidth={2.5} />
              <circle cx={x} cy={6} r={7} fill="#fffaf0" {...S} strokeWidth={2.5} />
            </g>
          ))}
        </g>
      );
    case 'key':
      return (
        <g>
          <circle cx={-14} cy={0} r={11} fill="none" stroke="#e2a72e" strokeWidth={6} />
          <path d="M -3 0 L 24 0 M 16 0 L 16 9 M 22 0 L 22 7" stroke="#e2a72e" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case 'coin':
      return (
        <g>
          <circle r={16} fill="#ffd23f" {...S} />
          <circle r={10} fill="none" stroke="#e2a72e" strokeWidth={3} />
          <text y={6} textAnchor="middle" fontSize={16} fontWeight={700} fill="#b07a1a">★</text>
        </g>
      );
    case 'worm':
      return <path d="M -24 4 Q -16 -10 -6 2 Q 4 14 14 0 Q 20 -8 26 -2" fill="none" stroke="#ff9fb0" strokeWidth={9} strokeLinecap="round" className="worm-wiggle" />;
    case 'dino':
      return <g transform="scale(1.1)"><Dino /></g>;
    case 'ball':
      return <Ball r={15} />;
    default:
      return (
        <g>
          <path d="M 0 14 L -18 -6 Q 0 -22 18 -6 Z" fill="#ffd0b8" {...S} strokeWidth={2.5} />
          <path d="M 0 14 L -8 -12 M 0 14 L 0 -16 M 0 14 L 8 -12" stroke="#e2a088" strokeWidth={2} />
        </g>
      );
  }
};

const SoilPatch = ({ hole, dirt, treasure }: { hole: number; dirt: boolean; treasure?: string }) => (
  <g>
    <ellipse cx={SOIL_PATCH.x} cy={SOIL_PATCH.y} rx={92} ry={30} fill="#8a5a32" {...S} />
    {[[-50, -6], [-20, 10], [30, -10], [56, 6], [4, -14]].map(([dx, dy], i) => (
      <ellipse key={i} cx={SOIL_PATCH.x + dx} cy={SOIL_PATCH.y + dy} rx={10} ry={5} fill="#a8743f" />
    ))}
    {hole > 0 && <ellipse cx={SOIL_PATCH.x} cy={SOIL_PATCH.y - 2} rx={18 + hole * 12} ry={6 + hole * 4} fill="#3e2716" stroke={OUTLINE} strokeWidth={2} />}
    {hole > 0 && <path d={`M ${SOIL_PATCH.x + 40 + hole * 10} ${SOIL_PATCH.y - 4} q 14 -18 28 0 Z`} fill="#7a4a26" stroke={OUTLINE} strokeWidth={2} />}
    {dirt && (
      <g pointerEvents="none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={SOIL_PATCH.x} cy={SOIL_PATCH.y - 10} r={6} fill="#7a4a26" className="dirt-fly" style={{ animationDelay: `${i * 90}ms`, ['--dx' as string]: `${(i % 2 ? -1 : 1) * (30 + i * 12)}px` }} />
        ))}
      </g>
    )}
    {treasure && (
      <g transform={`translate(${SOIL_PATCH.x} ${SOIL_PATCH.y - 60})`} pointerEvents="none">
        <g className="treasure-pop">
          <circle r={34} fill="#fff6c0" opacity={0.6} />
          <Treasure kind={treasure} />
        </g>
      </g>
    )}
  </g>
);

const Sprinkler = ({ on, period }: { on: boolean; period: DayPeriod }) => (
  <g>
    <path d="M 199 556 Q 230 640 300 620 Q 340 610 352 640" fill="none" stroke={OUTLINE} strokeWidth={9} strokeLinecap="round" />
    <path d="M 199 556 Q 230 640 300 620 Q 340 610 352 640" fill="none" stroke="#5fbf8f" strokeWidth={5} strokeLinecap="round" />
    <rect x={340} y={630} width={26} height={16} rx={5} fill="#9aa6b8" {...S} strokeWidth={2.5} />
    <circle cx={353} cy={626} r={8} fill="#ffcf3f" {...S} strokeWidth={2.5} />
    {on && (
      <g pointerEvents="none">
        {period !== 'night' && (
          <path d="M 250 600 Q 353 440 456 600" fill="none" stroke="url(#gd-rainbow)" strokeWidth={14} opacity={0.5} className="fade-in" />
        )}
        <g className="spray-swing" style={{ transformOrigin: '353px 626px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <circle key={i} cx={353} cy={622} r={5} fill="#8fd6ff" className="spray-drop" style={{ animationDelay: `${i * 110}ms`, ['--dx' as string]: `${(i - 3.5) * 26}px` }} />
          ))}
        </g>
      </g>
    )}
  </g>
);

const Swing = ({ mode }: { mode: number }) => {
  const name = useGame((s) => s.settings.kidName);
  const outfit = useGame((s) => s.outfit);
  const girl = useGame((s) => s.settings.kidGender === 'girl');
  const balloon = useGame((s) => s.balloon);
  const expr = useGame((s) => s.kid.expr);
  void name;
  return (
    <g className={mode === 2 ? 'swing-high' : mode === 1 ? 'swing-go' : 'swing-idle'} style={{ transformOrigin: `${SWING.x}px ${SWING.top}px` }}>
      <path d={`M ${SWING.x - 34} ${SWING.top} L ${SWING.x - 34} ${SWING.seat}`} stroke="#8a6a4a" strokeWidth={5} />
      <path d={`M ${SWING.x + 34} ${SWING.top} L ${SWING.x + 34} ${SWING.seat}`} stroke="#8a6a4a" strokeWidth={5} />
      <rect x={SWING.x - 46} y={SWING.seat - 4} width={92} height={14} rx={5} fill="#e2705c" {...S} />
      {mode > 0 && (
        <g transform={`translate(${SWING.x + 4} ${SWING.seat + 52})`}>
          <KidFigure pose="sit" expr={expr} outfit={outfit} girl={girl} balloon={balloon} />
        </g>
      )}
    </g>
  );
};

/** Foreground covers the kid can hide behind. */
const BigBush = () => (
  <g>
    <g fill="#4f9d47" stroke={OUTLINE} strokeWidth={3}>
      <circle cx={1350} cy={760} r={62} />
      <circle cx={1410} cy={740} r={58} />
      <circle cx={1300} cy={790} r={46} />
      <circle cx={1400} cy={800} r={48} />
    </g>
    {[[1330, 730], [1392, 712], [1420, 770], [1350, 790]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={7} fill={i % 2 ? '#ff9fd0' : '#fff'} stroke={OUTLINE} strokeWidth={1.5} />
    ))}
  </g>
);

const Barrow = () => (
  <g>
    <path d="M 120 752 L 312 752 L 282 806 L 150 806 Z" fill="#e2483f" {...S} />
    <path d="M 120 752 L 312 752" stroke={OUTLINE} strokeWidth={6} strokeLinecap="round" />
    <path d="M 134 760 Q 220 730 300 760" fill="#a8743f" stroke={OUTLINE} strokeWidth={2} />
    <circle cx={160} cy={806} r={4} fill={OUTLINE} />
  </g>
);

// ------------------------------------------------------------------ scene
export const GardenScene = memo(function GardenScene() {
  const period = useGame((s) => s.dayPeriod);
  const g = useGame((s) => s.garden);
  const fx = useGame((s) => s.fx);
  const drawMode = !!fx[R + ':draw'];
  const marks = fx[R + ':marks'] as string | undefined;
  const markPts = marks ? (JSON.parse(marks) as [number, number][]) : null;
  const heapAt = fx[R + ':heapAt'] as string | undefined;
  const heap = heapAt ? (JSON.parse(heapAt) as [number, number]) : null;
  const night = period === 'night';
  const canHeld = !!fx[R + ':canHeld'];
  const seedsOut = fx[R + ':seeds'] as string | undefined;
  const seedPts = seedsOut ? (JSON.parse(seedsOut) as [number, number][]) : [];
  const swing = (fx[R + ':swing'] as number | undefined) ?? 0;

  return (
    <svg className="scene-svg" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gd-rainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff6f61" />
          <stop offset="0.25" stopColor="#ffd23f" />
          <stop offset="0.5" stopColor="#6fe08a" />
          <stop offset="0.75" stopColor="#5fb0e8" />
          <stop offset="1" stopColor="#9b7bff" />
        </linearGradient>
        <linearGradient id="gd-lawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? '#3f6b44' : '#94d488'} />
          <stop offset="1" stopColor={night ? '#2d5434' : '#79c46c'} />
        </linearGradient>
      </defs>
      <Sky period={period} />
      <Fence />
      {/* lawn with mowing stripes */}
      <rect x={0} y={520} width={1440} height={290} fill="url(#gd-lawn)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={i * 220} y={520} width={110} height={290} fill="#fff" opacity={0.06} />
      ))}
      <HouseWall />
      <Hot id="door" label="Back to the kitchen" hit={{ x: 44, y: 232, w: 142, h: 210 }}>
        <RoomDoor
          x={40}
          y={230}
          w={150}
          h={410}
          hinge="left"
          open={!!fx[R + ':doorOpen']}
          color="#7fb5a5"
          peekLight="#fff1c9"
          sign={
            <g transform="translate(115 300)">
              <rect x={-30} y={-26} width={60} height={46} rx={8} fill="#fff6d8" {...S} strokeWidth={2.5} />
              <path d="M -14 10 L 14 10 L 10 -10 L -10 -10 Z" fill="#7fc8e8" stroke={OUTLINE} strokeWidth={2} />
              <circle cx={0} cy={-16} r={6} fill="#ffb3d1" stroke={OUTLINE} strokeWidth={2} />
            </g>
          }
        />
      </Hot>

      <Tree shake={!!fx[R + ':treeShake']} />
      <Hot id="tree" label="Mango tree" hit={{ x: 1150, y: 60, w: 290, h: 240 }}>
        <rect x={1150} y={60} width={290} height={240} fill="transparent" />
      </Hot>
      <Hot id="swing" label="Swing" hit={{ x: SWING.x - 60, y: SWING.top + 120, w: 120, h: SWING.seat - SWING.top - 90 }}>
        <Swing mode={swing} />
      </Hot>

      {/* flower bed */}
      <path d="M 540 590 L 880 590 L 892 618 L 528 618 Z" fill="#7a5232" {...S} />
      {PLANT_X.map((x, i) => (
        <Hot key={i} id={'plant-' + i} label={g.plants[i].kind} hit={{ x: x - 50, y: BED_Y - 230, w: 100, h: 240 }}>
          <Plant p={g.plants[i]} x={x} />
        </Hot>
      ))}
      {fx[R + ':growAt'] !== undefined && <Hearts x={PLANT_X[fx[R + ':growAt'] as number]} y={BED_Y - 160} />}
      <Hot id="can" label="Watering can" hit={{ x: 448, y: 580, w: 100, h: 80 }}>
        {!canHeld && (
          <g transform="translate(492 650) scale(1.1)">
            <WateringCan />
          </g>
        )}
      </Hot>

      {/* seed bag on the tree stump */}
      <Hot id="seeds" label="Bird seeds" hit={{ x: 1185, y: 620, w: 80, h: 90 }}>
        <g>
          <ellipse cx={1225} cy={694} rx={40} ry={12} fill="#a8743f" {...S} />
          <rect x={1185} y={668} width={80} height={26} fill="#a8743f" stroke={OUTLINE} strokeWidth={3} />
          <ellipse cx={1225} cy={668} rx={40} ry={12} fill="#d9a66a" {...S} />
          <ellipse cx={1225} cy={668} rx={26} ry={7} fill="none" stroke="#a8743f" strokeWidth={2} />
          {!fx[R + ':seedsHeld'] && (
            <g transform="translate(1225 666) scale(1.2)">
              <SeedBag />
            </g>
          )}
        </g>
      </Hot>
      {seedPts.map(([x, y], i) => (
        <g key={i} pointerEvents="none">
          <circle cx={x} cy={y} r={3} fill="#9b6a2f" />
          <circle cx={x + 8} cy={y + 3} r={2.5} fill="#c9a26a" />
          <circle cx={x - 7} cy={y + 4} r={2.5} fill="#9b6a2f" />
        </g>
      ))}

      <Hot id="sprinkler" label="Sprinkler" hit={{ x: 310, y: 590, w: 90, h: 70 }}>
        <Sprinkler on={!!fx[R + ':spray']} period={period} />
      </Hot>

      {/* sandpit */}
      <Hot id="sandpit" label="Sandpit and digger" hit={{ x: SANDPIT.cx - SANDPIT.rx, y: SANDPIT.cy - SANDPIT.ry - 40, w: SANDPIT.rx * 2, h: SANDPIT.ry * 2 + 40 }}>
        <g>
          <ellipse cx={SANDPIT.cx} cy={SANDPIT.cy + 6} rx={SANDPIT.rx + 14} ry={SANDPIT.ry + 14} fill="#c48a56" {...S} />
          <ellipse cx={SANDPIT.cx} cy={SANDPIT.cy} rx={SANDPIT.rx} ry={SANDPIT.ry} fill="#f3d79b" stroke={OUTLINE} strokeWidth={2.5} />
          {[[-140, -20], [60, 24], [150, -14], [-40, 34]].map(([dx, dy], i) => (
            <path key={i} d={`M ${SANDPIT.cx + dx} ${SANDPIT.cy + dy} q 10 -6 20 0`} stroke="#d9b874" strokeWidth={3} fill="none" />
          ))}
          {markPts && (
            <polyline points={markPts.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#c9a25e" strokeWidth={22} strokeDasharray="5 7" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
          )}
          {heap && g.heap > 0 && (
            <g transform={`translate(${heap[0]} ${heap[1]})`}>
              <path d={`M ${-20 - g.heap * 10} 6 Q 0 ${-14 - g.heap * 10} ${20 + g.heap * 10} 6 Z`} fill="#e9c47a" stroke={OUTLINE} strokeWidth={2.5} />
            </g>
          )}
          {/* a little toy spade stuck in the sand */}
          <g transform={`translate(${SANDPIT.cx - 200} ${SANDPIT.cy + 10}) rotate(-160)`}>
            <Spade />
          </g>
        </g>
      </Hot>
      <g
        style={{
          transform: `translate(${g.digger.x}px, ${g.digger.y}px) scale(${depth(g.digger.y)})`,
          transition: `transform ${g.digger.moveMs}ms linear`,
        }}
      >
        <Hot id="digger" label="Toy excavator" hit={{ x: -70, y: -120, w: 170, h: 124 }} origin="0px 0px">
          <g style={{ transform: `scaleX(${g.digger.facing})`, transition: 'transform 200ms' }}>
            <Excavator d={g.digger} />
          </g>
        </Hot>
      </g>

      <Hot id="soil" label="Soft soil for digging" hit={{ x: SOIL_PATCH.x - 92, y: SOIL_PATCH.y - 40, w: 184, h: 70 }}>
        <SoilPatch hole={g.hole} dirt={!!fx[R + ':dirt']} treasure={fx[R + ':treasure'] as string | undefined} />
      </Hot>

      {/* butterflies flutter around the flowers, birds come for the seeds */}
      {!night && <Butterflies />}
      <Birds />

      <KidActor room={R} layer="back" />
      <PupActor room={R} />
      <KidActor room={R} layer="front" />
      {fx[R + ':hearts'] && <Hearts x={useGame.getState().kid.x} y={useGame.getState().kid.y - 260} />}
      {fx[R + ':pupHearts'] && <Hearts x={useGame.getState().pup.x} y={useGame.getState().pup.y - 110} />}
      {drawMode && <TrackPad />}

      {/* foreground covers */}
      <Hot id="bush" label="Big bush" hit={{ x: 1290, y: 690, w: 150, h: 120 }}>
        <BigBush />
      </Hot>
      <Hot id="barrow" label="Wheelbarrow" hit={{ x: 120, y: 730, w: 190, h: 80 }}>
        <Barrow />
      </Hot>
      {fx['hs:cover'] === 'gbush' && <g pointerEvents="none"><BigBush /></g>}
      {fx['hs:cover'] === 'barrow' && <g pointerEvents="none"><Barrow /></g>}

      {night && <rect width={1440} height={810} fill="#0b1030" opacity={0.32} pointerEvents="none" />}
      {period === 'evening' && <rect width={1440} height={810} fill="#ff8a4a" opacity={0.08} pointerEvents="none" />}
      {night && <Fireflies />}
      <HideMarkers room={R} />
      <Projectile />
      <Sparkle />
    </svg>
  );
});

export default GardenScene;
