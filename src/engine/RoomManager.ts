import type { RoomId } from '../state/gameTypes';
import { getGame } from '../state/gameStore';
import { InteractionManager } from './InteractionManager';
import { AudioManager } from './AudioManager';
import { DialogueManager } from './DialogueManager';
import { EventBus } from './EventManager';
import { ROOM_DOOR, ROOM_ENTRY } from '../data/spots';

/**
 * Moves the player between rooms through the connecting door.
 * Door opens → short iris transition → the other room appears with its door swinging shut.
 * Room state lives in the store, so nothing resets; only running animations are cancelled cleanly.
 */
let busy = false;
const timers: ReturnType<typeof setTimeout>[] = [];
const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

export const RoomManager = {
  go(to: RoomId) {
    const g = getGame();
    const from = g.currentRoom;
    if (busy || from === to) return;
    busy = true;
    InteractionManager.abortAll();
    DialogueManager.clearAll();
    g.setTransitioning(true);
    g.setFx(from + ':doorOpen', true);
    AudioManager.play('doorOpen');
    EventBus.emit({ type: 'DOOR_OPENED', from, to });

    later(380, () => getGame().setFx('transition', 'out'));
    later(760, () => {
      const s = getGame();
      s.clearFx(from + ':doorOpen');
      s.setRoom(to);
      // the kid walks with the player if he is awake
      if (s.kid.awake && s.kid.room === from) {
        const door = ROOM_DOOR[to];
        s.setKid({ room: to, x: door.x, y: door.y, moveMs: 0, layer: 'front', pose: 'walk', facing: door.facing as 1 | -1 });
      }
      s.setFx(to + ':doorOpen', true);
      s.setFx('transition', 'in');
      AudioManager.play('footsteps');
    });
    later(1000, () => {
      const s = getGame();
      if (s.kid.awake && s.kid.room === to) {
        const spot = ROOM_ENTRY[to];
        s.setKid({ x: spot.x, y: spot.y, moveMs: 650 });
      }
    });
    later(1500, () => {
      const s = getGame();
      s.clearFx(to + ':doorOpen');
      s.clearFx('transition');
      if (s.kid.room === to && s.kid.awake) s.setKid({ pose: 'stand', moveMs: 0 });
      AudioManager.play('doorClose');
      s.setTransitioning(false);
      busy = false;
      EventBus.emit({ type: 'ROOM_ENTERED', room: to });
    });
  },
  isBusy: () => busy,
  dispose() {
    timers.forEach(clearTimeout);
    busy = false;
  },
};
