/**
 * Papa's special three-tap dialogue – a pure finite-state machine driven by timestamps.
 *   idle --tap--> stage1 --tap(<=5s)--> stage2 --tap(<=5s)--> stage3 (complete) --> idle
 * Any tap arriving after the 5 s window restarts at stage1. Expiry is computed from timestamps,
 * never from animation timers, so animation timing cannot affect the logic.
 */
export const PAPA_TAP_WINDOW_MS = 5000;

export type PapaTapStage = 0 | 1 | 2 | 3;

export interface PapaTapState {
  stage: PapaTapStage;
  lastTapAt: number;
}

export const initialPapaTap: PapaTapState = { stage: 0, lastTapAt: 0 };

/** Returns the effective stage at time `now` (expired sequences read as 0). */
export function currentStage(s: PapaTapState, now: number): PapaTapStage {
  if (s.stage === 0 || s.stage === 3) return 0;
  return now - s.lastTapAt <= PAPA_TAP_WINDOW_MS ? s.stage : 0;
}

export function tapPapa(s: PapaTapState, now: number): PapaTapState {
  const stage = currentStage(s, now);
  const next: PapaTapStage = stage === 1 ? 2 : stage === 2 ? 3 : 1;
  return { stage: next, lastTapAt: now };
}

/** After stage 3 has played out the machine returns to idle. */
export function resetPapaTap(): PapaTapState {
  return { ...initialPapaTap };
}
