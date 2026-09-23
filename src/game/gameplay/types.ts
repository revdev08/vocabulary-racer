import type { Lane } from '../motion/simulation';

export type Phase = 'traffic' | 'question' | 'feedback' | 'gameOver';
export type ObjectKind = 'traffic' | 'barrier';
export type WorldObject = { id: number; kind: ObjectKind; lane: Lane; position: number; speed: number; contacted: boolean };
export type PatternId = 'sweep' | 'stagger' | 'coinDetour' | 'double';
export type Encounter = { time: number; obstacles: { kind: ObjectKind; lane: Lane }[] };
export type TrafficPlan = { pattern: PatternId; encounters: Encounter[]; route: Lane[]; duration: number; seed: number; initialLateral: number;
  cruiseSpeed: number; encounterGap: number; paceLevel: number };
export type ReviewWord = { index: number; due: number };
export type WorldCoin = { id: number; lane: Lane; position: number };
export type RewardEffect = { id: number; kind: 'coin' | 'correct' | 'wrong'; lateral: number; at: number; duration: number };
export type RunMetrics = { encounters: number; obstacles: number; avoided: number; maxInactiveSeconds: number; inactiveSeconds: number };
export type Question = { id: string; word: string; correct: string; options: [string, string, string]; correctLane: Lane };
export type Feedback = { kind: 'correct' | 'wrong' | 'collision'; until: number; message: string };
export type RunState = {
  levelId: string; mode: 'level' | 'review'; deck: number[];
  completed: boolean; firstCorrect: number; reviewCount: number; currentIsReview: boolean;
  runId: number; revision: number; seed: number;
  phase: Phase; phaseTime: number; elapsed: number; distance: number; lateral: number;
  lives: number; score: number; streak: number; correct: number; errors: number; crashes: number;
  objects: WorldObject[]; nextObjectId: number;
  question: Question | null; previousCorrectLane: number; portalPosition: number;
  selectedLane: Lane | null; answered: boolean;
  invulnerableUntil: number; feedback: Feedback | null;
  plan: TrafficPlan; round: number;
  encounterCursor: number; previousPattern: PatternId | null;
  vocabularyCursor: number; questionIndex: number; reviews: ReviewWord[];
  metrics: RunMetrics;
  coins: WorldCoin[]; coinsCollected: number; coinsSpawned: number; coinRoute: Lane[];
  effects: RewardEffect[]; nextEffectId: number;
  nitroUntil: number; nitroCount: number;
};
export type GameView = Pick<RunState, 'levelId' | 'mode' | 'completed' | 'firstCorrect' | 'reviewCount' | 'currentIsReview' | 'vocabularyCursor' | 'runId' | 'revision' | 'phase' | 'lives' | 'score' | 'streak' |
  'correct' | 'errors' | 'crashes' | 'question' | 'selectedLane' | 'feedback' | 'coinsCollected' | 'coinsSpawned' | 'metrics' | 'nitroCount' | 'nitroUntil'> & { paceLevel: number; wordTarget: number };
