import { useEffect, useState } from 'react';
import { AudioManager } from '../engine/AudioManager';

type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };

const doc = document as FsDoc;
const root = () => document.documentElement as FsEl;

const isFull = () => Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
const canFull = () => Boolean(root().requestFullscreen || root().webkitRequestFullscreen);
/** Already running as an installed app (home-screen icon) – it's full screen by itself. */
const isInstalled = () =>
  window.matchMedia?.('(display-mode: fullscreen), (display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function toggleFullscreen() {
  if (isFull()) {
    if (doc.exitFullscreen) void doc.exitFullscreen().catch(() => {});
    else doc.webkitExitFullscreen?.();
    return;
  }
  const el = root();
  if (el.requestFullscreen) {
    void el
      .requestFullscreen({ navigationUI: 'hide' })
      .then(() => {
        // Keep phones sideways while in full screen (Android; ignored elsewhere).
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        o?.lock?.('landscape').catch(() => {});
      })
      .catch(() => {});
  } else el.webkitRequestFullscreen?.();
}

/** Video-player style expand / shrink button. iPhone Safari can't go full screen, so it shows a tip instead. */
export function FullscreenButton() {
  const [full, setFull] = useState(isFull);
  const [tip, setTip] = useState(false);
  const supported = canFull();

  useEffect(() => {
    const sync = () => setFull(isFull());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    // "F" toggles full screen, like on video sites (Esc exits natively).
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!tip) return;
    const t = setTimeout(() => setTip(false), 4500);
    return () => clearTimeout(t);
  }, [tip]);

  if (isInstalled()) return null;

  return (
    <div className="fs-wrap">
      <button
        className="hud-btn fs"
        aria-label={full ? 'Exit full screen' : 'Full screen'}
        title={full ? 'Exit full screen (F)' : 'Full screen (F)'}
        onPointerDown={(e) => {
          e.stopPropagation();
          AudioManager.unlock();
          AudioManager.play('tap');
          if (supported) toggleFullscreen();
          else setTip((v) => !v);
        }}
      >
        <svg viewBox="0 0 64 64" aria-hidden>
          <g fill="none" stroke="#5a3b2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            {full ? (
              <>
                <path d="M 24 10 L 24 24 L 10 24" />
                <path d="M 40 10 L 40 24 L 54 24" />
                <path d="M 24 54 L 24 40 L 10 40" />
                <path d="M 40 54 L 40 40 L 54 40" />
              </>
            ) : (
              <>
                <path d="M 10 24 L 10 10 L 24 10" />
                <path d="M 54 24 L 54 10 L 40 10" />
                <path d="M 10 40 L 10 54 L 24 54" />
                <path d="M 54 40 L 54 54 L 40 54" />
              </>
            )}
          </g>
        </svg>
      </button>
      {tip && (
        <div className="fs-tip" role="status" onPointerDown={(e) => e.stopPropagation()}>
          For full screen on iPhone, tap <b>Share</b> then <b>Add to Home Screen</b>, and open the game from there.
        </div>
      )}
    </div>
  );
}
