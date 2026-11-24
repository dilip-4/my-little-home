/** Tiny typed pub/sub bus. Every interaction emits its unique event id (e.g. GUITAR_PLAYED). */
export interface GameEvent {
  type: string;
  [k: string]: unknown;
}
type Listener = (e: GameEvent) => void;

const listeners = new Set<Listener>();
const history: GameEvent[] = [];

export const EventBus = {
  emit(e: GameEvent) {
    history.push({ ...e, at: Date.now() });
    if (history.length > 50) history.shift();
    listeners.forEach((l) => l(e));
  },
  on(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Recent events – handy for debugging and tests (window.__mlh.events()). */
  recent() {
    return [...history];
  },
};
