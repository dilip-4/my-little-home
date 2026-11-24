import { memo, useEffect, useRef } from 'react';
import { useGame } from '../state/gameStore';
import type { ProjectileFx } from '../engine/InteractionManager';
import { Ball, Book, Dino, Duck, Heart, Pillow, ToyCar } from './props';

/** Flies a thrown object along a smooth arc using the Web Animations API. */
export const Projectile = memo(function Projectile() {
  const raw = useGame((s) => s.fx.projectile) as string | undefined;
  const ref = useRef<SVGGElement>(null);
  const p: ProjectileFx | null = raw ? JSON.parse(raw) : null;

  useEffect(() => {
    if (!p || !ref.current) return;
    const frames: Keyframe[] = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = p.from.x + (p.to.x - p.from.x) * t;
      const y = p.from.y + (p.to.y - p.from.y) * t - p.arc * 4 * t * (1 - t);
      frames.push({ transform: `translate(${x}px, ${y}px) rotate(${p.spin ? t * 540 : 0}deg)` });
    }
    const anim = ref.current.animate(frames, { duration: p.dur, easing: 'linear', fill: 'forwards' });
    return () => anim.cancel();
  }, [raw]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null;
  const sprite =
    p.kind === 'ball' ? <Ball r={18} /> : p.kind === 'pillow' ? <g transform="scale(0.7)"><Pillow /></g> : p.kind === 'book' ? <Book color="#d9665b" /> : p.kind === 'duck' ? <Duck /> : p.kind === 'dino' ? <Dino /> : <ToyCar />;
  return (
    <g pointerEvents="none">
      <g ref={ref} style={{ transform: `translate(${p.from.x}px, ${p.from.y}px)` }}>
        {sprite}
      </g>
    </g>
  );
});

/** Golden sparkle burst (easter eggs & happy moments). */
export const Sparkle = memo(function Sparkle() {
  const raw = useGame((s) => s.fx.sparkle) as string | undefined;
  const clearFx = useGame((s) => s.clearFx);
  useEffect(() => {
    if (!raw) return;
    const t = setTimeout(() => clearFx('sparkle'), 1600);
    return () => clearTimeout(t);
  }, [raw, clearFx]);
  if (!raw) return null;
  const { x, y, id } = JSON.parse(raw) as { x: number; y: number; id: number };
  return (
    <g key={id} transform={`translate(${x} ${y})`} pointerEvents="none">
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <g key={i} className="spark" style={{ ['--dx' as string]: `${Math.cos(a) * 110}px`, ['--dy' as string]: `${Math.sin(a) * 90}px`, animationDelay: `${(i % 3) * 60}ms` }}>
            {i % 3 === 0 ? <Heart s={1.1} /> : <path d="M 0 -14 L 4 -4 L 14 0 L 4 4 L 0 14 L -4 4 L -14 0 L -4 -4 Z" fill={i % 2 ? '#ffd34d' : '#ffb3d1'} stroke="#c98a1c" strokeWidth={1.5} />}
          </g>
        );
      })}
    </g>
  );
});

/** Floating hearts above a spot. */
export const Hearts = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`} pointerEvents="none">
    {[-30, 0, 30].map((dx, i) => (
      <g key={i} transform={`translate(${dx} 0)`}>
        <g className="heart-float" style={{ animationDelay: `${i * 220}ms` }}>
          <Heart s={1.3} />
        </g>
      </g>
    ))}
  </g>
);

/** Gentle colourful party lights (no flashing – slow drifting colour pools). */
export const DiscoLights = memo(function DiscoLights() {
  const on = useGame((s) => !!s.fx.disco);
  if (!on) return null;
  const colors = ['#ff6f91', '#ffd34d', '#5fd4ff', '#9b7bff', '#6fe08a'];
  return (
    <g pointerEvents="none" style={{ mixBlendMode: 'screen' }}>
      {colors.map((c, i) => (
        <circle key={c} className="disco-spot" style={{ animationDelay: `${i * -0.8}s` }} cx={200 + i * 260} cy={420} r={150} fill={c} opacity={0.32} />
      ))}
      <g transform="translate(720 70)">
        <line x1={0} y1={-60} x2={0} y2={0} stroke="#5a3b2a" strokeWidth={3} />
        <circle r={28} fill="#d9dee6" stroke="#5a3b2a" strokeWidth={3} className="disco-ball" />
      </g>
    </g>
  );
});
