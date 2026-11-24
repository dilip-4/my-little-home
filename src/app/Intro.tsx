import { useEffect } from 'react';
import { useGame } from '../state/gameStore';
import { AudioManager } from '../engine/AudioManager';
import { KidFigure } from '../characters/Kid';

/** Short title card, then straight into Papa's office (tap to skip). */
export function Intro() {
  const done = useGame((s) => s.setIntroDone);
  useEffect(() => {
    const t = setTimeout(done, 3400);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div
      className="intro"
      onPointerDown={() => {
        AudioManager.unlock();
        AudioManager.play('sparkle');
        done();
      }}
    >
      <svg viewBox="0 0 1440 810" className="intro-art" aria-hidden>
        <defs>
          <linearGradient id="intro-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffcf9e" />
            <stop offset="1" stopColor="#ffe9c9" />
          </linearGradient>
        </defs>
        <rect width="1440" height="810" fill="url(#intro-sky)" />
        <circle cx="1180" cy="170" r="70" fill="#ffd34d" opacity="0.9" />
        <path d="M 0 640 Q 360 560 720 620 Q 1080 680 1440 600 L 1440 810 L 0 810 Z" fill="#8cc97f" />
        <g className="intro-house">
          <rect x="560" y="360" width="320" height="260" rx="10" fill="#fff3e0" stroke="#5a3b2a" strokeWidth="6" />
          <path d="M 530 370 L 720 210 L 910 370 Z" fill="#e2705c" stroke="#5a3b2a" strokeWidth="6" strokeLinejoin="round" />
          <rect x="800" y="230" width="44" height="80" fill="#c9566a" stroke="#5a3b2a" strokeWidth="5" />
          <g className="smoke">
            <circle cx="822" cy="200" r="16" fill="#fff" opacity="0.8" />
            <circle cx="840" cy="168" r="20" fill="#fff" opacity="0.6" />
          </g>
          <rect x="590" y="400" width="96" height="90" rx="6" fill="#ffe9a8" stroke="#5a3b2a" strokeWidth="5" />
          <rect x="754" y="400" width="96" height="90" rx="6" fill="#ffe9a8" stroke="#5a3b2a" strokeWidth="5" />
          <rect x="690" y="500" width="60" height="120" rx="6" fill="#c98f5c" stroke="#5a3b2a" strokeWidth="5" />
          <circle cx="738" cy="565" r="6" fill="#f0c44c" />
          <path d="M 720 470 C 700 450 680 470 720 495 C 760 470 740 450 720 470 Z" fill="#ff6f91" stroke="#5a3b2a" strokeWidth="3" />
          <g transform="translate(638 500) scale(0.42)">
            <KidFigure pose="wave" expr="happy" />
          </g>
        </g>
      </svg>
      <div className="intro-title">
        <h1>My Little Home</h1>
        <p>A Little World. A Lot of Mischief.</p>
        <span className="intro-tap">tap to come in</span>
      </div>
    </div>
  );
}
