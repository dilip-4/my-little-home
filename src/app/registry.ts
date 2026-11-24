import { InteractionManager } from '../engine/InteractionManager';
import { papaRoomInteractions } from '../scenes/PapaRoom/interactions';
import { mummyRoomInteractions } from '../scenes/MummyRoom/interactions';
import { eligibleMoments, pickMoment } from '../scenes/moments';
import { IdleDirector } from '../engine/IdleDirector';
import { getGame } from '../state/gameStore';

let lastMoment: string | null = null;

/** Registers every room's interaction definitions with the central manager (idempotent). */
let done = false;
export function registerInteractions() {
  if (done) return;
  done = true;
  InteractionManager.register(papaRoomInteractions);
  InteractionManager.register(mummyRoomInteractions);
  IdleDirector.setMomentPicker(() => {
    const m = pickMoment(eligibleMoments(getGame(), (id) => InteractionManager.cooldowns.isCooling(id)), lastMoment);
    if (m) lastMoment = m.def.id;
    return m?.def ?? null;
  });
}
