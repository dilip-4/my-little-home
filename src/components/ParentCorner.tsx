import { useMemo, useState } from 'react';
import { useGame, getGame, stopSaving } from '../state/gameStore';
import type { KidGender } from '../state/gameTypes';
import { AudioManager } from '../engine/AudioManager';
import { STICKERS } from './StickerBook';

const STORAGE_KEYS = ['my-little-home:v1', 'my-little-home:drawings'];

/** A sum that young children can't easily answer – keeps settings away from little fingers. */
function useGateSum() {
  return useMemo(() => {
    const a = 12 + Math.floor(Math.random() * 18);
    const b = 13 + Math.floor(Math.random() * 17);
    return { a, b, answer: a + b };
  }, []);
}

function Gate({ onPass }: { onPass: () => void }) {
  const { a, b, answer } = useGateSum();
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  const press = (d: string) => {
    AudioManager.play('tap');
    setWrong(false);
    const next = (typed + d).slice(0, 3);
    setTyped(next);
    if (next.length >= String(answer).length) {
      if (Number(next) === answer) onPass();
      else {
        setWrong(true);
        setTimeout(() => setTyped(''), 500);
      }
    }
  };
  return (
    <div className="parent-gate">
      <h2>For grown-ups</h2>
      <p>
        What is <b>{a} + {b}</b>?
      </p>
      <div className={`gate-answer ${wrong ? 'wrong' : ''}`}>{typed || ' '}</div>
      <div className="gate-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
          <button key={d} className="gate-key" onPointerDown={() => press(d)}>
            {d}
          </button>
        ))}
        <button className="gate-key small" onPointerDown={() => setTyped((t) => t.slice(0, -1))} aria-label="Delete">
          ⌫
        </button>
      </div>
    </div>
  );
}

/** Grown-ups corner: name, boy/girl, sound, install help, privacy, start over. */
export function ParentCorner() {
  const [open, setOpen] = useState(false);
  const settings = useGame((s) => s.settings);
  const found = useGame((s) => s.discoveredEasterEggs);
  const [name, setName] = useState(settings.kidName ?? '');
  const [confirmReset, setConfirmReset] = useState(false);
  const close = () => getGame().clearFx('ui:parent');
  const cleanName = name.replace(/[^\p{L}\p{N} '-]/gu, '').trim();
  const stickerCount = STICKERS.filter((s) => found.includes(s.id)).length;

  const startOver = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    stopSaving();
    try {
      STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
    location.reload();
  };

  const fullScreen = () => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  };

  return (
    <div className="draw-overlay" onPointerDown={(e) => e.stopPropagation()}>
      <div className="parent-panel">
        {!open ? (
          <Gate onPass={() => setOpen(true)} />
        ) : (
          <div className="parent-content">
            <h2>Grown-ups corner</h2>

            <section>
              <h3>Child</h3>
              <div className="pc-row">
                <input
                  className="pc-input"
                  value={name}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Child's name"
                />
                {(['boy', 'girl'] as KidGender[]).map((g) => (
                  <button key={g} className={`pc-chip ${settings.kidGender === g ? 'on' : ''}`} onPointerDown={() => getGame().setKidGender(g)}>
                    {g === 'boy' ? 'Boy' : 'Girl'}
                  </button>
                ))}
                <button
                  className="pill-btn small"
                  disabled={!cleanName || cleanName === settings.kidName}
                  onPointerDown={() => cleanName && getGame().setKidName(cleanName)}
                >
                  Save name
                </button>
              </div>
            </section>

            <section>
              <h3>Sound</h3>
              <div className="pc-row">
                <button className={`pc-chip ${settings.soundEnabled ? 'on' : ''}`} onPointerDown={() => getGame().toggleSound()}>
                  {settings.soundEnabled ? 'Sound on' : 'Sound off'}
                </button>
                <label className="pc-volume">
                  Volume
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round((settings.volume ?? 1) * 100)}
                    onChange={(e) => getGame().setVolume(Number(e.target.value) / 100)}
                  />
                </label>
              </div>
            </section>

            <section>
              <h3>Play like an app</h3>
              <p className="pc-note">
                For full screen and offline play, add the game to the home screen. iPhone / iPad: tap <b>Share</b>, then{' '}
                <b>Add to Home Screen</b>. Android: open the browser menu and tap <b>Install app</b> or <b>Add to Home screen</b>.
              </p>
              <button className="pc-chip" onPointerDown={fullScreen}>
                Full screen now
              </button>
            </section>

            <section>
              <h3>Privacy</h3>
              <p className="pc-note">
                Nothing is collected or sent anywhere. The name, stickers and drawings stay only on this device. No ads, accounts or
                tracking.{' '}
                <a href="/privacy.html" target="_blank" rel="noopener">
                  Read the privacy note
                </a>
              </p>
            </section>

            <section>
              <h3>Progress</h3>
              <div className="pc-row">
                <span className="pc-note">
                  Stickers found: <b>{stickerCount}</b> of {STICKERS.length}
                </span>
                <button className={`pill-btn small danger ${confirmReset ? 'armed' : ''}`} onPointerDown={startOver}>
                  {confirmReset ? 'Tap again to erase everything' : 'Start over'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
      <div className="draw-actions">
        <button className="pill-btn go-btn" onPointerDown={close}>
          Back to play
        </button>
      </div>
    </div>
  );
}
