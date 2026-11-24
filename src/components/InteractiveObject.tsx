import { memo, useRef, type ReactNode } from 'react';
import { useGame } from '../state/gameStore';
import { InteractionManager } from '../engine/InteractionManager';
import { AudioManager } from '../engine/AudioManager';

interface Props {
  id: string;
  label: string;
  /** Hit area (min 44x44 logical px, larger is better for small hands) */
  hit: { x: number; y: number; w: number; h: number; rx?: number };
  children?: ReactNode;
  /** Optional transform-origin for the bounce (defaults to hit-area bottom centre) */
  origin?: string;
  className?: string;
  onTap?: () => void;
}

/**
 * Every interactive object in a room is wrapped in this component. It provides pointer + touch
 * input (no hover required), a subtle hover glow, a bounce on interaction and double-tap protection.
 */
export const InteractiveObject = memo(function InteractiveObject({ id, label, hit, children, origin, className, onTap }: Props) {
  const bump = useGame((s) => s.fx['bump:' + id]);
  const lastTap = useRef(0);
  const w = Math.max(44, hit.w);
  const h = Math.max(44, hit.h);
  const x = hit.x - (w - hit.w) / 2;
  const y = hit.y - (h - hit.h) / 2;

  const activate = () => {
    const now = performance.now();
    if (now - lastTap.current < 220) return; // accidental double activation guard
    lastTap.current = now;
    AudioManager.unlock();
    if (onTap) onTap();
    else InteractionManager.trigger(id);
  };

  return (
    <g
      className={`hot ${bump ? 'bumping' : ''} ${className ?? ''}`}
      data-id={id}
      role="button"
      aria-label={label}
      tabIndex={0}
      style={{ transformOrigin: origin ?? `${hit.x + hit.w / 2}px ${hit.y + hit.h}px` }}
      onPointerDown={(e) => {
        if (!e.isPrimary || e.button > 0) return;
        e.stopPropagation();
        activate();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
    >
      {children}
      <rect className="hit" x={x} y={y} width={w} height={h} rx={hit.rx ?? 12} fill="transparent" />
    </g>
  );
});
