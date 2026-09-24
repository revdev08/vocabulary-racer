import { driving } from '../config/driving';
import { gameplay, objectVisuals } from '../config/gameplay';
import { levels, vocabulary } from '../data/vocabulary';
import { clamp } from '../geometry/perspective';
import { advanceLateral, type Lane } from '../motion/simulation';
import type { GameView, Question, RunState, WorldObject } from './types';
import { random } from './random';
import { sweptContact } from './collision';
import { makeTrafficPlan, objectsForPlan, phaseSpeed, trafficPace } from './patterns';
import { makeCoins } from './coins';
import { feedbackDuration } from './answerFeedback';
export { sweptContact } from './collision';

export function makeQuestion(index: number, seed: number, previousLane: number) {
  'worklet';
  const entry = vocabulary[index % vocabulary.length];
  const options: [string, string, string] = [entry.correct, entry.distractors[0], entry.distractors[1]];
  for (let i = 2; i > 0; i--) {
    const r = random(seed); seed = r.seed;
    const j = Math.floor(r.value * (i + 1));
    const saved = options[i]; options[i] = options[j]; options[j] = saved;
  }
  let correctIndex = options.indexOf(entry.correct);
  if (correctIndex - 1 === previousLane) {
    const r = random(seed); seed = r.seed;
    const other = (correctIndex + 1 + Math.floor(r.value * 2)) % 3;
    const saved = options[correctIndex]; options[correctIndex] = options[other]; options[other] = saved;
    correctIndex = other;
  }
  const question: Question = { id: entry.id, word: entry.spanish, correct: entry.correct,
    options, correctLane: (correctIndex - 1) as Lane };
  return { seed, question };
}

function startTraffic(state: RunState): RunState {
  'worklet';
  const plan = makeTrafficPlan(state.seed, state.lateral, state.round, state.previousPattern, state.plan);
  const objects = objectsForPlan(plan, state.distance, state.nextObjectId);
  const rewards = makeCoins(plan, state.distance, state.nextObjectId + objects.length);
  return { ...state, phase: 'traffic', phaseTime: 0, objects, plan, seed: plan.seed,
    previousPattern: plan.pattern, encounterCursor: 0,
    round: state.round + 1, nextObjectId: state.nextObjectId + objects.length + rewards.coins.length,
    coins: rewards.coins, coinRoute: rewards.route, coinsSpawned: state.coinsSpawned + rewards.coins.length,
    question: null, selectedLane: null, answered: false, feedback: null, revision: state.revision + 1 };
}

export function createRun(seed = 1, runId = 1, levelId = 'essentials', reviewDeck?: number[]): RunState {
  'worklet';
  const level = levels.find(item => item.id === levelId) ?? levels[0];
  const run = startTraffic({ levelId: level.id, mode: reviewDeck ? 'review' : 'level', deck: reviewDeck ?? [...level.indices],
    completed: false, firstCorrect: 0, reviewCount: 0, currentIsReview: false, runId, revision: 0, seed: Math.max(1, Math.floor(seed) % 2147483647),
    phase: 'traffic', phaseTime: 0, elapsed: 0, distance: 0, lateral: 0,
    lives: gameplay.initialLives, score: 0, streak: 0, correct: 0, errors: 0, crashes: 0,
    objects: [], nextObjectId: 1, question: null, previousCorrectLane: 9, portalPosition: 0,
    selectedLane: null, answered: false, invulnerableUntil: 0, feedback: null,
    plan: { pattern: 'sweep', encounters: [], route: [], duration: 0, seed, initialLateral: 0, ...trafficPace(0) },
    round: 0, encounterCursor: 0, previousPattern: null,
    vocabularyCursor: 0, questionIndex: 0, reviews: [],
    metrics: { encounters: 0, obstacles: 0, avoided: 0, maxInactiveSeconds: 0, inactiveSeconds: 0 },
    coins: [], coinsCollected: 0, coinsSpawned: 0, coinRoute: [], effects: [], nextEffectId: 1, nitroUntil: 0, nitroCount: 0 });
  return run.deck.length ? run : { ...run, phase: 'gameOver', completed: true };
}

export function gameView(state: RunState): GameView {
  'worklet';
  const { runId, revision, phase, lives, score, streak, correct, errors, crashes, question, selectedLane, feedback,
    coinsCollected, coinsSpawned, metrics, nitroCount, nitroUntil, levelId, mode, completed, firstCorrect, reviewCount, currentIsReview, vocabularyCursor } = state;
  return { runId, revision, phase, lives, score, streak, correct, errors, crashes, question, selectedLane, feedback,
    coinsCollected, coinsSpawned, metrics, nitroCount, nitroUntil, levelId, mode, completed, firstCorrect, reviewCount, currentIsReview, vocabularyCursor, wordTarget: state.deck.length, paceLevel: state.plan.paceLevel };
}

function finishIfNeeded(state: RunState): RunState {
  'worklet';
  return state.lives <= 0 ? { ...state, lives: 0, phase: 'gameOver', revision: state.revision + 1 } : state;
}

function tick(state: RunState, seconds: number, target: Lane): RunState {
  'worklet';
  const cruiseSpeed = state.phase === 'feedback' ? trafficPace(state.round).cruiseSpeed : state.plan.cruiseSpeed;
  const speed = phaseSpeed(state.phase, state.phaseTime + seconds / 2, state.plan.duration, cruiseSpeed, feedbackDuration(state.feedback?.kind));
  let next = { ...state, elapsed: state.elapsed + seconds, phaseTime: state.phaseTime + seconds,
    distance: state.distance + speed * seconds, lateral: advanceLateral(state.lateral, target, seconds),
    effects: state.effects.filter(effect => state.elapsed - effect.at < effect.duration) };
  if (next.nitroUntil > 0 && next.elapsed >= next.nitroUntil) {
    next.nitroUntil = 0; next.revision++;
  }
  if (next.feedback && next.elapsed >= next.feedback.until && next.phase === 'traffic') {
    next = { ...next, feedback: null, revision: next.revision + 1 };
  }
  if (state.phase === 'traffic') {
    next.coins = [];
    for (const coin of state.coins) {
      const collected = sweptContact(state.lateral - coin.lane, next.lateral - coin.lane,
        state.distance - coin.position, next.distance - coin.position,
        gameplay.playerHalfWidth + gameplay.coinHalfWidth, gameplay.playerFront + gameplay.coinDepth, gameplay.playerRear + gameplay.coinDepth);
      if (collected) {
        next.coinsCollected++; next.revision++;
        next.effects = [...next.effects, { id: next.nextEffectId++, kind: 'coin' as const, lateral: coin.lane,
          at: next.elapsed, duration: gameplay.coinFlashSeconds }].slice(-gameplay.maxEffects);
      } else if (coin.position - next.distance > -gameplay.passedObjectDistance) next.coins.push(coin);
    }
    const objects: WorldObject[] = [];
    for (const object of state.objects) {
      let moved = { ...object, position: object.position + object.speed * seconds };
      const bounds = objectVisuals[object.kind];
      if (!object.contacted && sweptContact(state.lateral - object.lane, next.lateral - object.lane,
        state.distance - object.position, next.distance - moved.position,
        gameplay.playerHalfWidth + bounds.halfWidth, gameplay.playerFront + bounds.rear, gameplay.playerRear + bounds.front)) {
        moved = { ...moved, contacted: true };
        if (next.elapsed >= next.invulnerableUntil) {
          next = { ...next, lives: next.lives - 1, crashes: next.crashes + 1,
            invulnerableUntil: next.elapsed + gameplay.collisionProtectionSeconds,
            feedback: { kind: 'collision', until: next.elapsed + gameplay.collisionFeedbackSeconds, message: 'Choque · −1 vida' },
            revision: next.revision + 1 };
        }
      }
      if (moved.position - next.distance > -gameplay.passedObjectDistance) objects.push(moved);
    }
    let metrics = { ...next.metrics }, encounterCursor = next.encounterCursor;
    while (encounterCursor < state.plan.encounters.length) {
      const row = state.plan.encounters[encounterCursor];
      const contactLead = Math.max(...row.obstacles.map(o => (gameplay.playerFront + objectVisuals[o.kind].rear)
        / (state.plan.cruiseSpeed - (o.kind === 'traffic' ? gameplay.trafficCarSpeed : 0))));
      if (next.phaseTime < row.time - contactLead) break;
      metrics.encounters++; metrics.obstacles += row.obstacles.length;
      encounterCursor++;
    }
    for (const object of state.objects) {
      const moved = objects.find(o => o.id === object.id);
      const rearClearance = gameplay.playerRear + objectVisuals[object.kind].front;
      if (state.distance - object.position <= rearClearance && (!moved || next.distance - moved.position > rearClearance)
        && !object.contacted && !moved?.contacted) metrics.avoided++;
    }
    const active = objects.some(o => o.position > next.distance && o.position - next.distance < state.plan.cruiseSpeed * gameplay.doubleChangeLeadSeconds)
      || next.coins.some(c => c.position > next.distance && c.position - next.distance < state.plan.cruiseSpeed * gameplay.doubleChangeLeadSeconds);
    metrics.inactiveSeconds = active ? 0 : metrics.inactiveSeconds + seconds;
    metrics.maxInactiveSeconds = Math.max(metrics.maxInactiveSeconds, metrics.inactiveSeconds);
    next = finishIfNeeded({ ...next, objects, metrics, encounterCursor });
    if (next.phase !== 'gameOver' && next.phaseTime + 1e-9 >= state.plan.duration) {
      const questionNumber = next.correct + next.errors;
      const review = next.reviewCount < 3 ? next.reviews.find(item => item.due <= questionNumber && item.index !== next.questionIndex) : undefined;
      const questionIndex = review?.index ?? next.deck[next.vocabularyCursor];
      const generated = makeQuestion(questionIndex, next.seed, next.previousCorrectLane);
      next = { ...next, phase: 'question', phaseTime: 0, seed: generated.seed, question: generated.question,
        previousCorrectLane: generated.question.correctLane, objects: [], coins: [], answered: false, selectedLane: null,
        portalPosition: next.distance + gameplay.decisionSpeed * gameplay.decisionSeconds,
        questionIndex, currentIsReview: !!review, reviewCount: next.reviewCount + (review ? 1 : 0),
        vocabularyCursor: next.vocabularyCursor + (review ? 0 : 1),
        reviews: review ? next.reviews.filter(item => item !== review) : next.reviews,
        metrics: { ...next.metrics, inactiveSeconds: 0 },
        feedback: null, revision: next.revision + 1 };
    }
  } else if (state.phase === 'question' && state.question && !state.answered &&
    state.distance < state.portalPosition && next.distance + 1e-9 >= state.portalPosition) {
    const fraction = clamp((state.portalPosition - state.distance) / (next.distance - state.distance), 0, 1);
    const crossingLateral = state.lateral + (next.lateral - state.lateral) * fraction;
    const selectedLane = clamp(Math.round(crossingLateral), -1, 1) as Lane;
    const correct = selectedLane === state.question.correctLane;
    const nitro = correct && (state.streak + 1) % gameplay.nitroEveryCorrect === 0;
    const confirmationSeconds = feedbackDuration(correct ? 'correct' : 'wrong');
    next = { ...next, phase: 'feedback', phaseTime: 0, answered: true, selectedLane,
      firstCorrect: state.firstCorrect + (correct && !state.currentIsReview ? 1 : 0),
      correct: state.correct + (correct ? 1 : 0), errors: state.errors + (correct ? 0 : 1),
      lives: state.lives - (correct ? 0 : 1), score: state.score + (correct ? gameplay.pointsPerCorrect : 0),
      streak: correct ? state.streak + 1 : 0,
      nitroUntil: nitro ? next.elapsed + gameplay.nitroSeconds : state.nitroUntil,
      nitroCount: state.nitroCount + (nitro ? 1 : 0),
      effects: [...next.effects, { id: next.nextEffectId, kind: correct ? 'correct' as const : 'wrong' as const,
        lateral: crossingLateral, at: next.elapsed, duration: confirmationSeconds }].slice(-gameplay.maxEffects),
      nextEffectId: next.nextEffectId + 1,
      reviews: correct ? state.reviews : [{ index: state.questionIndex, due: state.correct + state.errors + 1 + gameplay.reviewDelayQuestions },
        ...state.reviews.filter(item => item.index !== state.questionIndex)],
      feedback: { kind: correct ? 'correct' : 'wrong', until: next.elapsed + confirmationSeconds,
        message: `${state.question.word} = ${state.question.correct}` },
      revision: next.revision + 1 };
  } else if (state.phase === 'feedback' && next.phaseTime >= feedbackDuration(state.feedback?.kind)) {
    // The last wrong answer must be explained before the summary covers the scene.
    const pending = next.reviewCount < 3 && next.reviews.some(item => item.due <= next.correct + next.errors && item.index !== next.questionIndex);
    next = next.lives <= 0 ? finishIfNeeded(next)
      : next.vocabularyCursor >= next.deck.length && !pending
        ? { ...next, completed: true, phase: 'gameOver', revision: next.revision + 1 }
        : startTraffic(next);
  }
  return next;
}

/** Fixed upper bound per integration step; clock discards background gaps first. */
export function advanceGame(state: RunState, seconds: number, target: Lane, fastQuestion = false): RunState {
  'worklet';
  if (state.phase === 'gameOver' || seconds <= 0 || !Number.isFinite(seconds)) return state;
  let next = state, remaining = Math.min(seconds, driving.maxFrameGapMs / 1000);
  while (remaining > 1e-9 && next.phase !== 'gameOver') {
    const step = Math.min(gameplay.maxStepSeconds, remaining);
    // Speed up only the question; feedback and traffic retain their normal duration.
    const multiplier = fastQuestion && next.phase === 'question' ? 8 : 1;
    const simulated = step * multiplier;
    let budget = simulated;
    while (budget > 1e-9) {
      const slice = Math.min(gameplay.maxStepSeconds, budget);
      const phase: RunState['phase'] = next.phase;
      next = tick(next, slice, target); budget -= slice;
      if (phase !== next.phase) break;
    }
    remaining -= step;
  }
  return next;
}
