import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGame, getGame } from '../state/gameStore';
import type { RoomId } from '../state/gameTypes';
import { registerInteractions } from './registry';
import { startClock } from '../engine/clock';
import { familyMoments } from '../scenes/moments';
import { FamilyMemory } from '../engine/FamilyMemory';
import { IdleDirector } from '../engine/IdleDirector';
import { AudioManager } from '../engine/AudioManager';
import { InteractionManager } from '../engine/InteractionManager';
import { EventBus } from '../engine/EventManager';
import { RoomManager } from '../engine/RoomManager';
import { getPapaTapState } from '../scenes/PapaRoom/interactions';
import { PapaRoomScene } from '../scenes/PapaRoom/PapaRoomScene';
import { DialogueLayer } from '../components/DialogueBubble';
import { SoundControl } from '../components/SoundControl';
import { FullscreenButton } from '../components/FullscreenButton';
import { Intro } from './Intro';
import { DrawingBoard } from '../components/DrawingBoard';
import { StickerBook } from '../components/StickerBook';
import { ParentCorner } from '../components/ParentCorner';
import { welcomeDef } from '../scenes/extras';
import { startFindBiscuit, startHideAndSeek } from '../scenes/hideSeek';

registerInteractions();

const loadMummyRoom = () => import('../scenes/MummyRoom/MummyRoomScene');
const MummyRoomScene = lazy(loadMummyRoom);
const loadKitchen = () => import('../scenes/Kitchen/KitchenScene');
const KitchenScene = lazy(loadKitchen);
const loadGarden = () => import('../scenes/Garden/GardenScene');
const GardenScene = lazy(loadGarden);

const ROOMS: { id: RoomId; label: string; icon: JSX.Element }[] = [
  {
    id: 'papa-room',
    label: "Papa's office",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden>
        <rect x="10" y="14" width="44" height="30" rx="4" fill="#2c3340" stroke="#5a3b2a" strokeWidth="4" />
        <rect x="15" y="19" width="34" height="20" fill="#bfe3f2" />
        <path d="M 6 50 L 58 50 L 54 44 L 10 44 Z" fill="#b7bec8" stroke="#5a3b2a" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'mummy-room',
    label: "Mummy's room",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden>
        <rect x="6" y="30" width="52" height="16" rx="4" fill="#ffb3c1" stroke="#5a3b2a" strokeWidth="4" />
        <rect x="8" y="20" width="20" height="12" rx="5" fill="#fff" stroke="#5a3b2a" strokeWidth="4" />
        <path d="M 8 46 L 8 54 M 56 46 L 56 54 M 6 18 L 6 54" stroke="#5a3b2a" strokeWidth="5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden>
        <path d="M 14 30 L 50 30 L 46 54 L 18 54 Z" fill="#7fc8e8" stroke="#5a3b2a" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 10 32 Q 8 12 26 14 Q 32 4 40 14 Q 58 12 54 32 Z" fill="#ffb3d1" stroke="#5a3b2a" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="32" cy="10" r="5" fill="#e2483f" stroke="#5a3b2a" strokeWidth="3" />
      </svg>
    ),
  },
  {
    id: 'garden',
    label: 'Garden',
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden>
        <path d="M 32 58 L 32 30" stroke="#5a3b2a" strokeWidth="7" strokeLinecap="round" />
        <path d="M 32 58 L 32 30" stroke="#5aa83f" strokeWidth="3" strokeLinecap="round" />
        <path d="M 32 44 Q 18 30 10 40 Q 20 50 32 44 Z" fill="#6fbf4a" stroke="#5a3b2a" strokeWidth="3" />
        <g stroke="#5a3b2a" strokeWidth="3">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="32" cy="10" rx="6" ry="9" fill="#ffd23f" transform={`rotate(${a} 32 20)`} />
          ))}
        </g>
        <circle cx="32" cy="20" r="7" fill="#8a5a2e" stroke="#5a3b2a" strokeWidth="3" />
      </svg>
    ),
  },
];

function useStageScale() {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(vw / 1440, vh / 810));
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, []);
  return scale;
}

export function GameShell() {
  const room = useGame((s) => s.currentRoom);
  const introDone = useGame((s) => s.introDone);
  const soundOn = useGame((s) => s.settings.soundEnabled);
  const transition = useGame((s) => s.fx.transition) as string | undefined;
  const fan = useGame((s) => (s.currentRoom === 'papa-room' ? s.papaRoom.fanSpeed : s.currentRoom === 'mummy-room' ? s.mummyRoom.fanSpeed : 0));
  const scale = useStageScale();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [portraitDismissed, setPortraitDismissed] = useState(false);
  const [doorHint, setDoorHint] = useState(true);
  const drawingOpen = useGame((s) => !!s.fx['ui:drawing']);
  const stickersOpen = useGame((s) => !!s.fx['ui:stickers']);
  const parentOpen = useGame((s) => !!s.fx['ui:parent']);
  const newStickers = useGame((s) => s.discoveredEasterEggs.length);
  const returning = useRef(!!getGame().settings.kidName);

  // engine lifecycle
  useEffect(() => {
    const stopClock = startClock();
    IdleDirector.start();
    const onVis = () => {
      const hidden = document.hidden;
      rootRef.current?.classList.toggle('paused', hidden);
      if (hidden) AudioManager.suspend();
      else AudioManager.resume();
    };
    document.addEventListener('visibilitychange', onVis);
    const unlock = () => AudioManager.unlock();
    window.addEventListener('pointerdown', unlock, { capture: true });
    const offDoor = EventBus.on((e) => e.type === 'DOOR_OPENED' && setDoorHint(false));
    // debugging / QA hook (no tracking – stays in the page)
    (window as unknown as Record<string, unknown>).__mlh = {
      state: () => getGame(),
      tap: (id: string) => InteractionManager.trigger(id),
      running: () => InteractionManager.runningIds(),
      events: () => EventBus.recent(),
      papaTap: () => getPapaTapState(),
      go: (r: RoomId) => RoomManager.go(r),
      defs: () => InteractionManager.definitions().map((d) => `${d.room}:${d.target}:${d.id}`),
      moment: (id: string) => {
        const m = familyMoments.find((x) => x.def.id === id);
        return m ? InteractionManager.start(m.def) : false;
      },
      momentSoon: () => IdleDirector.momentSoon(),
      memory: (id: string) => FamilyMemory.count(id),
    };
    return () => {
      stopClock();
      IdleDirector.stop();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerdown', unlock, { capture: true });
      offDoor();
    };
  }, []);

  useEffect(() => AudioManager.setEnabled(soundOn), [soundOn]);
  const volume = useGame((s) => s.settings.volume ?? 1);
  useEffect(() => AudioManager.setVolume(volume), [volume]);
  useEffect(() => AudioManager.setFan(fan), [fan]);

  // "Welcome back, <name>!" (or a first hello) right after the title card
  useEffect(() => {
    if (!introDone) return;
    const t = setTimeout(() => InteractionManager.start(welcomeDef(returning.current)), 600);
    return () => clearTimeout(t);
  }, [introDone]);

  useEffect(() => {
    if (!introDone) return;
    setHint(true);
    const t = setTimeout(() => setHint(false), 6000);
    const p = setTimeout(() => {
      void loadMummyRoom(); // preload the other rooms in the background
      void loadKitchen();
      void loadGarden();
    }, 800);
    return () => {
      clearTimeout(t);
      clearTimeout(p);
    };
  }, [introDone]);

  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth * 1.05 && window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="game-root" ref={rootRef}>
      <div className="stage" style={{ width: 1440, height: 810, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className={`room-layer ${room}`} key={room}>
          {room === 'papa-room' ? (
            <PapaRoomScene />
          ) : (
            <Suspense fallback={<div className="room-loading" />}>
              {room === 'mummy-room' ? <MummyRoomScene /> : room === 'kitchen' ? <KitchenScene /> : <GardenScene />}
            </Suspense>
          )}
        </div>
        <DialogueLayer />
        {doorHint && introDone && <div className={`door-hint ${room}`} aria-hidden />}

        <div className="hud">
          <button
            className="logo-pill"
            aria-label="My Little Home – grown-ups corner"
            onPointerDown={(e) => {
              e.stopPropagation();
              AudioManager.unlock();
              getGame().setFx('ui:parent', true);
            }}
          >
            <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden>
              <path d="M8 30 L32 8 L56 30 L50 30 L50 56 L14 56 L14 30 Z" fill="#f5c343" stroke="#5a3b2a" strokeWidth="4" strokeLinejoin="round" />
              <rect x="26" y="38" width="12" height="18" rx="2" fill="#e2705c" stroke="#5a3b2a" strokeWidth="3" />
              <path d="M32 30 C26 24 20 30 32 36 C44 30 38 24 32 30 Z" fill="#ff6f91" />
            </svg>
            <span>My Little Home</span>
            <svg className="gear" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.6 2.3-1.9-.3a7 7 0 0 0-.7-1.7l1.1-1.6-1.9-1.9-1.6 1.1a7 7 0 0 0-1.7-.7l-.3-1.9h-2.7l-.3 1.9a7 7 0 0 0-1.7.7L7.3 5.3 5.4 7.2l1.1 1.6a7 7 0 0 0-.7 1.7l-1.9.3v2.7l1.9.3c.2.6.4 1.2.7 1.7l-1.1 1.6 1.9 1.9 1.6-1.1c.5.3 1.1.5 1.7.7l.3 1.9h2.7l.3-1.9c.6-.2 1.2-.4 1.7-.7l1.6 1.1 1.9-1.9-1.1-1.6c.3-.5.5-1.1.7-1.7l1.9-.3Z" fill="#c9b8a6" />
            </svg>
          </button>
          <nav className="room-picker" aria-label="Rooms">
            {ROOMS.map((r) => (
              <button
                key={r.id}
                className={`room-btn ${room === r.id ? 'on' : ''}`}
                aria-label={r.label}
                aria-current={room === r.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  AudioManager.unlock();
                  if (room !== r.id) RoomManager.go(r.id);
                }}
              >
                {r.icon}
              </button>
            ))}
          </nav>
          <div className="hud-right">
            <button
              className="hud-btn seek"
              aria-label="Play hide and seek"
              onPointerDown={(e) => {
                e.stopPropagation();
                AudioManager.unlock();
                AudioManager.play('giggle');
                startHideAndSeek();
              }}
            >
              <svg viewBox="0 0 64 64" aria-hidden>
                <path d="M 6 46 Q 6 14 32 14 Q 58 14 58 46 Z" fill="#9fc7e8" stroke="#5a3b2a" strokeWidth="4" strokeLinejoin="round" />
                <ellipse cx="24" cy="34" rx="6" ry="8" fill="#fff" stroke="#5a3b2a" strokeWidth="3" />
                <ellipse cx="40" cy="34" rx="6" ry="8" fill="#fff" stroke="#5a3b2a" strokeWidth="3" />
                <circle cx="26" cy="36" r="3.5" fill="#5a3b2a" />
                <circle cx="42" cy="36" r="3.5" fill="#5a3b2a" />
                <path d="M 4 46 L 60 46" stroke="#5a3b2a" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="hud-btn paw"
              aria-label="Find Biscuit"
              onPointerDown={(e) => {
                e.stopPropagation();
                AudioManager.unlock();
                AudioManager.play('yip');
                startFindBiscuit();
              }}
            >
              <svg viewBox="0 0 64 64" aria-hidden>
                <g fill="#b5793f" stroke="#5a3b2a" strokeWidth="3">
                  <ellipse cx="32" cy="42" rx="14" ry="12" />
                  <circle cx="16" cy="26" r="6.5" />
                  <circle cx="26" cy="17" r="6.5" />
                  <circle cx="38" cy="17" r="6.5" />
                  <circle cx="48" cy="26" r="6.5" />
                </g>
              </svg>
            </button>
            <button
              className="hud-btn book"
              aria-label={`Sticker book, ${newStickers} stickers`}
              onPointerDown={(e) => {
                e.stopPropagation();
                AudioManager.unlock();
                AudioManager.play('pageFlip');
                getGame().setFx('ui:stickers', true);
              }}
            >
              <svg viewBox="0 0 64 64" aria-hidden>
                <path d="M 8 14 Q 20 8 32 14 Q 44 8 56 14 L 56 54 Q 44 48 32 54 Q 20 48 8 54 Z" fill="#fffaf2" stroke="#5a3b2a" strokeWidth="4" strokeLinejoin="round" />
                <path d="M 32 14 L 32 54" stroke="#5a3b2a" strokeWidth="3" />
                <path d="M 20 24 l 2.5 5 l 5.5 .6 l -4 3.8 l 1 5.4 l -5 -2.6 l -5 2.6 l 1 -5.4 l -4 -3.8 l 5.5 -.6 Z" fill="#ffd23f" stroke="#5a3b2a" strokeWidth="2" strokeLinejoin="round" />
                <path d="M 44 40 C 36 34 38 26 44 30 C 50 26 52 34 44 40 Z" fill="#ff6f91" stroke="#5a3b2a" strokeWidth="2" />
              </svg>
            </button>
            <SoundControl />
            <FullscreenButton />
          </div>
        </div>
        {hint && <div className="tap-hint">Tap anything to see what happens!</div>}
        <div className={`transition-veil ${transition ?? ''}`} />
        {drawingOpen && <DrawingBoard />}
        {stickersOpen && <StickerBook />}
        {parentOpen && <ParentCorner />}
        {!introDone && <Intro />}
      </div>
      {portrait && !portraitDismissed && (
        <div className="rotate-prompt">
          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden className="rotate-phone">
            <rect x="35" y="15" width="50" height="90" rx="10" fill="#fff" stroke="#5a3b2a" strokeWidth="5" />
            <circle cx="60" cy="92" r="5" fill="#5a3b2a" />
          </svg>
          <p>Turn your device sideways to see the whole house!</p>
          <button className="pill-btn" onPointerDown={() => setPortraitDismissed(true)}>
            Play anyway
          </button>
        </div>
      )}
    </div>
  );
}
