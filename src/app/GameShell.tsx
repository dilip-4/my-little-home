import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGame, getGame } from '../state/gameStore';
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
import { Intro } from './Intro';

registerInteractions();

const loadMummyRoom = () => import('../scenes/MummyRoom/MummyRoomScene');
const MummyRoomScene = lazy(loadMummyRoom);

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
  const fan = useGame((s) => (s.currentRoom === 'papa-room' ? s.papaRoom.fanSpeed : s.mummyRoom.fanSpeed));
  const scale = useStageScale();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [portraitDismissed, setPortraitDismissed] = useState(false);
  const [doorHint, setDoorHint] = useState(true);

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
      go: (r: 'papa-room' | 'mummy-room') => RoomManager.go(r),
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
  useEffect(() => AudioManager.setFan(fan), [fan]);

  useEffect(() => {
    if (!introDone) return;
    setHint(true);
    const t = setTimeout(() => setHint(false), 6000);
    const p = setTimeout(() => void loadMummyRoom(), 800); // preload second room in the background
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
              <MummyRoomScene />
            </Suspense>
          )}
        </div>
        <DialogueLayer />
        {doorHint && introDone && <div className={`door-hint ${room}`} aria-hidden />}

        <div className="hud">
          <div className="logo-pill" aria-label="My Little Home">
            <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden>
              <path d="M8 30 L32 8 L56 30 L50 30 L50 56 L14 56 L14 30 Z" fill="#f5c343" stroke="#5a3b2a" strokeWidth="4" strokeLinejoin="round" />
              <rect x="26" y="38" width="12" height="18" rx="2" fill="#e2705c" stroke="#5a3b2a" strokeWidth="3" />
              <path d="M32 30 C26 24 20 30 32 36 C44 30 38 24 32 30 Z" fill="#ff6f91" />
            </svg>
            <span>My Little Home</span>
          </div>
          <SoundControl />
        </div>
        {hint && <div className="tap-hint">Tap anything to see what happens!</div>}
        <div className={`transition-veil ${transition ?? ''}`} />
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
