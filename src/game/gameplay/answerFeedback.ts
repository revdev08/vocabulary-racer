import { gameplay } from '../config/gameplay';
import { clamp, type SceneLayout } from '../geometry/perspective';
import type { GameView, RunState } from './types';

export type AnswerCue = { runId: number; kind: 'correct' | 'wrong'; until: number };

export function createAnswerCue(view: Pick<GameView, 'runId' | 'phase' | 'feedback'>): AnswerCue | null {
  const feedback = view.feedback;
  return view.phase === 'feedback' && feedback && feedback.kind !== 'collision'
    ? { runId: view.runId, kind: feedback.kind, until: feedback.until } : null;
}

export function feedbackDuration(kind?: string) {
  'worklet';
  return kind === 'wrong' ? gameplay.wrongFeedbackSeconds : gameplay.feedbackSeconds;
}

/** Simulation time freezes every part of the cue during pause/background. */
export function answerMotion(seconds: number, correct: boolean, reduced: boolean) {
  'worklet';
  const duration = feedbackDuration(correct ? 'correct' : 'wrong');
  const enter = clamp(seconds / .24, 0, 1);
  const ease = 1 - Math.pow(1 - enter, 3);
  const pop = 1 + 2.70158 * Math.pow(enter - 1, 3) + 1.70158 * Math.pow(enter - 1, 2);
  const shakeTime = clamp((seconds - .12) / .36, 0, 1);
  return {
    scale: reduced ? 1 : .94 + .06 * pop,
    translateY: reduced ? 0 : (1 - ease) * 12,
    shake: reduced || correct || shakeTime >= 1 ? 0 : Math.sin(shakeTime * Math.PI * 6) * 5 * (1 - shakeTime),
    symbol: reduced ? 1 : clamp((seconds - .05) / .24, 0, 1),
    ring: reduced ? 1 : clamp(seconds / .40, 0, 1),
    opacity: clamp((duration - seconds) / .15, 0, 1),
  };
}

/** React can still display the old card after the UI thread starts another phase.
 * Use that card's deadline on the monotonic simulation clock, never phaseTime,
 * which resets to zero at the next traffic block. Stale cards stay fully hidden.
 */
export function answerCueMotion(state: Pick<RunState, 'runId' | 'phase' | 'elapsed' | 'feedback'>,
  cue: AnswerCue | null, reduced: boolean) {
  'worklet';
  const correct = cue?.kind === 'correct';
  const duration = feedbackDuration(correct ? 'correct' : 'wrong');
  const active = cue !== null && state.runId === cue.runId && state.phase === 'feedback'
    && state.feedback?.kind === cue.kind && state.feedback.until === cue.until;
  const seconds = active ? Math.max(0, duration + state.elapsed - cue.until) : duration;
  return answerMotion(seconds, correct, reduced);
}

export function answerCardLayout(layout: SceneLayout) {
  const width = Math.min(380, layout.width - layout.hudLeft - layout.hudRight);
  return { left: (layout.width - width) / 2, top: layout.prompt.y, width, height: layout.compact ? 152 : 168 };
}
