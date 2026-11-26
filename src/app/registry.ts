import { InteractionManager } from '../engine/InteractionManager';
import { papaRoomInteractions } from '../scenes/PapaRoom/interactions';
import { mummyRoomInteractions } from '../scenes/MummyRoom/interactions';
import { kitchenInteractions } from '../scenes/Kitchen/interactions';
import { gardenInteractions, gardenTick } from '../scenes/Garden/interactions';
import { giggleDefs, tailFoundDefs } from '../scenes/hideSeek';
import { eligibleMoments, pickMoment } from '../scenes/moments';
import { IdleDirector } from '../engine/IdleDirector';
import { getGame } from '../state/gameStore';
import { pupTick, wirePupReactions } from '../scenes/pup';

let lastMoment: string | null = null;

/** Registers every room's interaction definitions with the central manager (idempotent). */
let done = false;
export function registerInteractions() {
  if (done) return;
  done = true;
  // hide-and-seek reactions come first: while hiding, they win over everything else
  InteractionManager.register(giggleDefs);
  InteractionManager.register(tailFoundDefs);
  InteractionManager.register(papaRoomInteractions);
  InteractionManager.register(mummyRoomInteractions);
  InteractionManager.register(kitchenInteractions);
  InteractionManager.register(gardenInteractions);
  IdleDirector.addTicker(pupTick);
  IdleDirector.addTicker(gardenTick);
  wirePupReactions();
  IdleDirector.setMomentPicker(() => {
    const m = pickMoment(eligibleMoments(getGame(), (id) => InteractionManager.cooldowns.isCooling(id)), lastMoment);
    if (m) lastMoment = m.def.id;
    return m?.def ?? null;
  });
}
