import type { CharacterId } from '../state/gameTypes';
import { getGame } from '../state/gameStore';

/**
 * DialogueManager – one speech bubble per character, with priorities and a small queue.
 *  - A higher/equal priority line replaces the current one.
 *  - A lower priority line waits in the queue (idle chatter, priority 0, is simply dropped).
 *  - Every bubble disappears on its own; tapping a bubble dismisses it early.
 */
interface Pending {
  speaker: CharacterId;
  text: string;
  priority: number;
  ms: number;
}

let nextId = 1;
const timers = new Map<CharacterId, ReturnType<typeof setTimeout>>();
const queues = new Map<CharacterId, Pending[]>();

export function readingTime(text: string): number {
  return Math.min(5200, Math.max(1700, 700 + text.length * 52));
}

/** The player's name (falls back to a friendly word before one is typed). */
export const kidName = () => getGame().settings.kidName?.trim() || 'buddy';
/** Words that follow the boy/girl choice. */
const GENDER_WORDS: Record<'boy' | 'girl', Record<string, string>> = {
  boy: { he: 'he', He: 'He', him: 'him', his: 'his', boy: 'boy', mister: 'mister', Mister: 'Mister', king: 'king', King: 'King', handsome: 'handsome' },
  girl: { he: 'she', He: 'She', him: 'her', his: 'her', boy: 'girl', mister: 'missy', Mister: 'Missy', king: 'queen', King: 'Queen', handsome: 'pretty' },
};
export const withName = (text: string) => {
  const words = GENDER_WORDS[getGame().settings.kidGender ?? 'boy'];
  return text.replace(/\{name\}/g, kidName()).replace(/\{(he|He|him|his|boy|mister|Mister|king|King|handsome)\}/g, (_, w: string) => words[w]);
};

function show(p: Pending) {
  const id = nextId++;
  p = { ...p, text: withName(p.text) };
  const until = Date.now() + p.ms;
  getGame().showDialogue({ id, speaker: p.speaker, text: p.text, priority: p.priority, until });
  clearTimeout(timers.get(p.speaker));
  timers.set(
    p.speaker,
    setTimeout(() => {
      getGame().clearDialogue(p.speaker, id);
      next(p.speaker);
    }, p.ms),
  );
  return id;
}

function next(speaker: CharacterId) {
  const q = queues.get(speaker);
  if (!q || q.length === 0) return;
  const p = q.shift()!;
  show(p);
}

export const DialogueManager = {
  say(speaker: CharacterId, text: string, priority = 1, ms = readingTime(text)): number | null {
    const cur = getGame().dialogues[speaker];
    if (cur && cur.until > Date.now() && cur.priority > priority) {
      if (priority <= 0) return null;
      const q = queues.get(speaker) ?? [];
      if (q.length >= 2) q.shift();
      q.push({ speaker, text, priority, ms });
      queues.set(speaker, q);
      return null;
    }
    return show({ speaker, text, priority, ms });
  },
  dismiss(speaker: CharacterId) {
    clearTimeout(timers.get(speaker));
    getGame().clearDialogue(speaker);
    next(speaker);
  },
  clearAll() {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    queues.clear();
    (['papa', 'mummy', 'kid', 'pup'] as CharacterId[]).forEach((c) => getGame().clearDialogue(c));
  },
};
