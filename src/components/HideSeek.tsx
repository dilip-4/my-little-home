import { memo } from 'react';
import { useGame, getGame } from '../state/gameStore';
import type { RoomId } from '../state/gameTypes';
import { OUTLINE } from '../data/characters';
import { AudioManager } from '../engine/AudioManager';
import { InteractiveObject } from './InteractiveObject';
import { spotsIn } from '../scenes/hideSeek';

/**
 * Glowing hide-and-seek spots. In "hide" mode the child taps where the kid should hide; in "seek"
 * mode they tap where they think Biscuit is hiding.
 */
export const HideMarkers = memo(function HideMarkers({ room }: { room: RoomId }) {
  const raw = useGame((s) => s.fx['hs:markers']) as string | undefined;
  if (!raw) return null;
  const { mode, room: r } = JSON.parse(raw) as { mode: 'hide' | 'seek'; room: RoomId };
  if (r !== room) return null;
  return (
    <g>
      {spotsIn(room).map((s, i) => (
        <InteractiveObject
          key={s.id}
          id={'hs-spot-' + s.id}
          label={mode === 'hide' ? `Hide ${s.place}` : `Look ${s.place}`}
          hit={{ x: s.marker.x - 48, y: s.marker.y - 48, w: 96, h: 96, rx: 48 }}
          origin={`${s.marker.x}px ${s.marker.y}px`}
          onTap={() => {
            AudioManager.play('pop');
            getGame().setFx('hs:pick', s.id);
          }}
        >
          <g transform={`translate(${s.marker.x} ${s.marker.y})`}>
            <g className="hs-marker" style={{ animationDelay: `${i * 160}ms` }}>
              <circle r={40} fill={mode === 'hide' ? 'rgba(255, 211, 77, 0.35)' : 'rgba(95, 212, 255, 0.3)'} stroke="#fff" strokeWidth={5} strokeDasharray="10 8" />
              <circle r={24} fill="#fffaf2" stroke={OUTLINE} strokeWidth={3} />
              {mode === 'hide' ? (
                <g>
                  <ellipse cx={-8} cy={0} rx={6} ry={8} fill="#fff" stroke={OUTLINE} strokeWidth={2} />
                  <ellipse cx={8} cy={0} rx={6} ry={8} fill="#fff" stroke={OUTLINE} strokeWidth={2} />
                  <circle cx={-6} cy={2} r={3} fill={OUTLINE} />
                  <circle cx={10} cy={2} r={3} fill={OUTLINE} />
                </g>
              ) : (
                <g>
                  <circle cx={-3} cy={-3} r={10} fill="#d9f0ff" stroke={OUTLINE} strokeWidth={3} />
                  <path d="M 4 4 L 13 13" stroke={OUTLINE} strokeWidth={5} strokeLinecap="round" />
                </g>
              )}
            </g>
          </g>
        </InteractiveObject>
      ))}
    </g>
  );
});

/** Front of the toy basket, redrawn over the kid when he hides behind it. */
export const BasketCover = () => (
  <g pointerEvents="none">
    <path d="M 330 712 L 434 712 L 424 786 L 340 786 Z" fill="#e9b96a" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
    {[728, 746, 764].map((y) => (
      <path key={y} d={`M 334 ${y} L 430 ${y}`} stroke="#c9913f" strokeWidth={3} />
    ))}
    {[352, 372, 392, 412].map((x) => (
      <path key={x} d={`M ${x} 714 L ${x - 1} 784`} stroke="#c9913f" strokeWidth={2} />
    ))}
    <rect x={326} y={704} width={112} height={12} rx={5} fill="#d9a552" stroke={OUTLINE} strokeWidth={3} />
  </g>
);
