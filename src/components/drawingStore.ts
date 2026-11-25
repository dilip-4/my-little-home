// The kid's drawings live in localStorage (newest first, a few kept) – they stay on the wall.
const KEY = 'my-little-home:drawings';
const MAX = 4;

export function loadDrawings(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string' && x.startsWith('data:image/')) : [];
  } catch {
    return [];
  }
}

export function saveDrawing(dataUrl: string): boolean {
  try {
    const list = [dataUrl, ...loadDrawings()].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    // storage full: keep only the newest one
    try {
      localStorage.setItem(KEY, JSON.stringify([dataUrl]));
      return true;
    } catch {
      return false;
    }
  }
}

export const hasDrawing = () => loadDrawings().length > 0;
export const latestDrawing = () => loadDrawings()[0] ?? null;
