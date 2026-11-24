import { useGame } from '../state/gameStore';
import { AudioManager } from '../engine/AudioManager';

export function SoundControl() {
  const on = useGame((s) => s.settings.soundEnabled);
  const toggle = useGame((s) => s.toggleSound);
  return (
    <button
      className="hud-btn sound-btn"
      aria-label={on ? 'Mute sound' : 'Turn sound on'}
      aria-pressed={!on}
      onPointerDown={(e) => {
        e.stopPropagation();
        AudioManager.unlock();
        toggle();
        if (!on) setTimeout(() => AudioManager.play('pop'), 60);
      }}
    >
      <svg viewBox="0 0 48 48" width="30" height="30" aria-hidden>
        <path d="M 8 18 L 16 18 L 26 9 L 26 39 L 16 30 L 8 30 Z" fill="#fff" stroke="#5a3b2a" strokeWidth="3" strokeLinejoin="round" />
        {on ? (
          <g fill="none" stroke="#5a3b2a" strokeWidth="3.5" strokeLinecap="round">
            <path d="M 31 18 Q 35 24 31 30" />
            <path d="M 36 13 Q 43 24 36 35" />
          </g>
        ) : (
          <g stroke="#e0533d" strokeWidth="4" strokeLinecap="round">
            <line x1="32" y1="18" x2="42" y2="30" />
            <line x1="42" y1="18" x2="32" y2="30" />
          </g>
        )}
      </svg>
    </button>
  );
}
