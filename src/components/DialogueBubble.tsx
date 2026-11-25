import { memo } from 'react';
import { useGame } from '../state/gameStore';
import type { CharacterId } from '../state/gameTypes';
import { DialogueManager } from '../engine/DialogueManager';
import { BUBBLE_ANCHORS } from '../data/spots';

const COLORS: Record<CharacterId, string> = { papa: '#3c7fae', mummy: '#e2705c', kid: '#e9a51f', pup: '#b5793f' };

/** HTML speech bubbles positioned in logical scene coordinates (inside the scaled stage). */
export const DialogueLayer = memo(function DialogueLayer() {
  const room = useGame((s) => s.currentRoom);
  const dialogues = useGame((s) => s.dialogues);
  const kid = useGame((s) => s.kid);
  const pup = useGame((s) => s.pup);

  const items: { who: CharacterId; x: number; y: number }[] = [];
  if (room === 'papa-room' && dialogues.papa) items.push({ who: 'papa', ...BUBBLE_ANCHORS.papa });
  if (room === 'mummy-room' && dialogues.mummy) items.push({ who: 'mummy', ...BUBBLE_ANCHORS.mummy });
  if (kid.room === room && dialogues.kid) {
    const lying = kid.pose === 'sleep' || kid.pose === 'lie';
    const crouch = kid.pose === 'crouch' || kid.pose === 'peek';
    items.push({ who: 'kid', x: lying ? kid.x - 150 : kid.x, y: lying ? kid.y - 70 : kid.y - (crouch ? 190 : 240) });
  }
  if (pup.room === room && dialogues.pup) items.push({ who: 'pup', x: pup.x + 20, y: pup.y - 120 });

  return (
    <div className="dialogue-layer">
      {items.map(({ who, x, y }) => {
        const d = dialogues[who]!;
        const cx = Math.min(1440 - 170, Math.max(170, x));
        const tailShift = Math.max(-120, Math.min(120, x - cx));
        return (
          <div
            key={who}
            className={`bubble bubble-${who}`}
            style={{ left: cx, top: y, ['--accent' as string]: COLORS[who], ['--tail' as string]: `${tailShift}px` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              DialogueManager.dismiss(who);
            }}
          >
            <span key={d.id} className="bubble-text">{d.text}</span>
          </div>
        );
      })}
    </div>
  );
});
