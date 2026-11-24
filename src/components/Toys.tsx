import { memo, useEffect, useRef, useState } from 'react';
import { useGame, getGame } from '../state/gameStore';
import { OUTLINE } from '../data/characters';
import { AudioManager } from '../engine/AudioManager';
import { ToyCar } from './props';

const S = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const };
export const BLOCK = 26;
const BLOCK_COLORS = ['#f2545b', '#4fb0e8', '#ffd23f', '#6fe08a', '#9b7bff', '#f29e4c', '#ff7eb6', '#5bb0c9'];

/** Building-block tower: grows one block per tap, wobbles when tall, tumbles when it falls. */
export const BlockTower = memo(function BlockTower({ room, x, y }: { room: string; x: number; y: number }) {
  const height = (useGame((s) => s.fx[room + ':tower']) as number | undefined) ?? 0;
  const crash = useGame((s) => s.fx[room + ':towerCrash']) as string | undefined;
  const fallen = crash ? (JSON.parse(crash) as { h: number; id: number; dir: 1 | -1 }) : null;
  return (
    <g>
      {/* loose blocks waiting on the rug */}
      <rect x={x - 62} y={y - BLOCK + 3} width={BLOCK} height={BLOCK} rx={4} fill="#6fe08a" {...S} transform={`rotate(-8 ${x - 49} ${y - 10})`} />
      {fallen ? (
        <g key={fallen.id}>
          {Array.from({ length: fallen.h }, (_, i) => (
            <g key={i} transform={`translate(${x} ${y - (i + 1) * BLOCK})`}>
              <g
                className="block-tumble"
                style={{
                  ['--dx' as string]: `${fallen.dir * (18 + i * 15 + (i % 2) * 10)}px`,
                  ['--dy' as string]: `${(i + 1) * BLOCK - 4 - (i % 3) * 3}px`,
                  ['--rot' as string]: `${fallen.dir * (60 + i * 35)}deg`,
                  animationDelay: `${i * 30}ms`,
                }}
              >
                <rect x={-BLOCK / 2} y={0} width={BLOCK} height={BLOCK} rx={4} fill={BLOCK_COLORS[i % BLOCK_COLORS.length]} {...S} />
              </g>
            </g>
          ))}
        </g>
      ) : (
        <g className={height >= 5 ? 'tower-wobble' : undefined} style={{ transformOrigin: `${x}px ${y}px` }}>
          {height === 0 && <rect x={x - BLOCK / 2} y={y - BLOCK} width={BLOCK} height={BLOCK} rx={4} fill={BLOCK_COLORS[0]} {...S} />}
          {Array.from({ length: height }, (_, i) => (
            <g key={i} className={i === height - 1 ? 'block-drop' : undefined}>
              <rect x={x - BLOCK / 2 + ((i * 7) % 5) - 2} y={y - (i + 1) * BLOCK} width={BLOCK} height={BLOCK} rx={4} fill={BLOCK_COLORS[i % BLOCK_COLORS.length]} {...S} />
              <circle cx={x + ((i * 7) % 5) - 2} cy={y - (i + 0.5) * BLOCK} r={4} fill="#fff" opacity={0.45} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
});

/** Wind-up toy car that zooms along the floor (position + speed driven by fx). */
export const ToyCarRunner = memo(function ToyCarRunner({ room, homeX, y }: { room: string; homeX: number; y: number }) {
  const carX = (useGame((s) => s.fx[room + ':carX']) as number | undefined) ?? homeX;
  const ms = (useGame((s) => s.fx[room + ':carMs']) as number | undefined) ?? 0;
  const flip = useGame((s) => !!s.fx[room + ':carLeft']);
  const carY = (useGame((s) => s.fx[room + ':carY']) as number | undefined) ?? y;
  return (
    <g style={{ transform: `translate(${carX}px, ${carY}px)`, transition: `transform ${ms}ms cubic-bezier(.45,.05,.4,1)` }}>
      <ellipse cx={0} cy={13} rx={24} ry={4} fill="#000" opacity={0.15} />
      <g transform={flip ? 'scale(-1 1)' : undefined}>
        <g className={ms ? 'car-zoom' : undefined}>
          <ToyCar />
        </g>
      </g>
    </g>
  );
});

// ------------------------------------------------------------------ bubbles
export interface BubbleSpec {
  k: number;
  x: number;
  y: number;
  dx: number;
  rise: number;
  r: number;
  dur: number;
  delay: number;
  rainbow?: boolean;
}

/**
 * Floating soap bubbles. Each one can be tapped to pop; the rare rainbow bubble is a secret.
 * Reports how many are left through fx `${room}:bubbleLeft` so the interaction can react.
 */
export const Bubbles = memo(function Bubbles({ room }: { room: string }) {
  const raw = useGame((s) => s.fx[room + ':bubbles']) as string | undefined;
  const [gone, setGone] = useState<Record<number, 'pop' | 'away'>>({});
  const goneRef = useRef<Record<number, 'pop' | 'away'>>({});
  const [bursts, setBursts] = useState<{ k: number; x: number; y: number }[]>([]);
  const data = raw ? (JSON.parse(raw) as { id: number; items: BubbleSpec[] }) : null;

  useEffect(() => {
    goneRef.current = {};
    setGone({});
    setBursts([]);
  }, [data?.id]);

  if (!data) return null;
  const finish = (b: BubbleSpec, how: 'pop' | 'away') => {
    if (goneRef.current[b.k]) return;
    const next = { ...goneRef.current, [b.k]: how };
    goneRef.current = next;
    setGone(next);
    const store = getGame();
    store.setFx(room + ':bubbleLeft', data.items.filter((i) => !next[i.k]).length);
    store.setFx(room + ':bubblePops', Object.values(next).filter((v) => v === 'pop').length);
  };
  const pop = (b: BubbleSpec, el: SVGGElement) => {
    if (goneRef.current[b.k]) return;
    // find where the (animated) bubble is right now, in scene coordinates
    let at = { x: b.x, y: b.y };
    const svg = el.ownerSVGElement;
    const screen = svg?.getScreenCTM();
    if (screen) {
      const r = el.getBoundingClientRect();
      const p = new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(screen.inverse());
      at = { x: p.x, y: p.y };
    }
    AudioManager.play('bubblePop');
    if (b.rainbow) {
      const store = getGame();
      store.discoverEgg('rainbow-bubble');
      store.setFx(room + ':rainbowPopped', true);
      store.setFx('sparkle', JSON.stringify({ ...at, id: Date.now() }));
      AudioManager.play('sparkle');
    }
    setBursts((list) => [...list, { k: b.k, ...at }]);
    finish(b, 'pop');
  };
  const onPop = pop;
  const onAway = (b: BubbleSpec) => finish(b, 'away');

  return (
    <g>
      {data.items.map((b) =>
        gone[b.k] ? null : (
          <g key={data.id + ':' + b.k} transform={`translate(${b.x} ${b.y})`}>
            <g
              className="bubble-float"
              style={{ ['--dx' as string]: `${b.dx}px`, ['--rise' as string]: `${-b.rise}px`, animationDuration: `${b.dur}ms`, animationDelay: `${b.delay}ms` }}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget) onAway(b);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPop(b, e.currentTarget);
              }}
              role="button"
              aria-label={b.rainbow ? 'Rainbow bubble' : 'Bubble'}
            >
              <circle r={Math.max(24, b.r + 10)} fill="transparent" />
              <circle r={b.r} fill={b.rainbow ? 'url(#bubble-rainbow)' : 'rgba(190,235,255,0.28)'} stroke={b.rainbow ? '#ff9ad5' : '#8fd0f0'} strokeWidth={2.5} />
              <path d={`M ${-b.r * 0.55} ${-b.r * 0.2} A ${b.r * 0.6} ${b.r * 0.6} 0 0 1 ${-b.r * 0.15} ${-b.r * 0.6}`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.9} />
              <circle cx={b.r * 0.35} cy={b.r * 0.35} r={b.r * 0.12} fill="#fff" opacity={0.7} />
            </g>
          </g>
        ),
      )}
      {bursts.map((p) => (
        <g key={'burst' + data.id + p.k} transform={`translate(${p.x} ${p.y})`} pointerEvents="none">
          <g className="bubble-burst">
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              return <line key={i} x1={Math.cos(a) * 10} y1={Math.sin(a) * 10} x2={Math.cos(a) * 22} y2={Math.sin(a) * 22} stroke="#8fd0f0" strokeWidth={3} strokeLinecap="round" />;
            })}
          </g>
        </g>
      ))}
      <defs>
        <radialGradient id="bubble-rainbow" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="0.45" stopColor="#ffd6f0" stopOpacity="0.55" />
          <stop offset="0.7" stopColor="#c8f0ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff1a8" stopOpacity="0.7" />
        </radialGradient>
      </defs>
    </g>
  );
});
