import { answerEvent } from '../gameplay/answerEvent';
import { usePronunciation } from '../audio/usePronunciation';
import { loadCityRun, saveCityRun } from '../gameplay/progress';
import type { Answer } from '../engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { advanceClock, changeLane, type Lane } from './simulation';
import { advancePlayerTurn } from './playerTurn';
import { advanceGame, createRun, gameView } from '../gameplay/engine';
import type { GameView } from '../gameplay/types';
import { frameReport, newFrameProfile, type FrameProfile, type FrameReport } from './frameProfile';

export function useDrivingSimulation(levelId = 'essentials', review = false) {
  const audio = usePronunciation();
  const { speak, stop: stopAudio } = audio;
  const profiling = useMemo(() => Platform.OS === 'web' && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('profile') === '1', []);
  const [initial] = useState(() => createRun(profiling ? 2026 : Math.floor(Math.random() * 2147483646) + 1));
  const profile = useSharedValue<FrameProfile | null>(profiling ? newFrameProfile() : null);
  const [profileReport, setProfileReport] = useState<FrameReport | null>(null);
  const receiveProfile = useCallback((sample: FrameProfile) => setProfileReport(frameReport(sample)), []);
  const game = useSharedValue(initial);
  const distance = useSharedValue(0);
  const lateral = useSharedValue(0);
  const playerTurn = useSharedValue(0);
  const target = useSharedValue<Lane>(0);
  const lastTimestamp = useSharedValue<number | null>(null);
  const running = useSharedValue(false);
  const holding = useSharedValue(false);
  const holdSeconds = useSharedValue(0);
  const reducedMotion = useSharedValue(true);
  const [paused, setPaused] = useState(false);
  const [targetLane, setTargetLane] = useState<Lane>(0);
  const [view, setView] = useState(() => gameView(initial));
  const pausedRef = useRef(false);
  const readyRef = useRef(false);
  const hydratedRef = useRef(false);
  const restartingRef = useRef(false);
  const answersRef = useRef<Answer[]>([]);
  const [initialStorageId] = useState(() => `city-${Date.now()}-${Math.random()}`);
  const storageIdRef = useRef(initialStorageId);
  const saveRef = useRef<Promise<void>>(Promise.resolve());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const overRef = useRef(false);
  const runIdRef = useRef(1);
  const revisionRef = useRef(initial.revision);
  const frameRef = useRef<{ setActive: (active: boolean) => void } | null>(null);
  const activeRef = useRef(AppState.currentState === 'active' || AppState.currentState === null);
  const targetRef = useRef<Lane>(0);

  useEffect(() => {
    let mounted = true;
    const update = (value: boolean) => { if (mounted) reducedMotion.set(value); };
    void AccessibilityInfo.isReduceMotionEnabled().then(update);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => { mounted = false; subscription?.remove(); };
  }, [reducedMotion]);

  const receiveEvent = useCallback((snapshot: GameView) => {
    // A delayed UI-thread event from the previous run cannot undo a restart.
    if (snapshot.runId !== runIdRef.current || snapshot.revision < revisionRef.current) return;
    revisionRef.current = snapshot.revision;
    overRef.current = snapshot.phase === 'gameOver';
    if (overRef.current) frameRef.current?.setActive(false);
    const answer = answerEvent(snapshot, answersRef.current.length);
    if (answer) {
      if (activeRef.current && !pausedRef.current) speak(answer.translation);
      answersRef.current.push({ wordId: answer.wordId, result: answer.result, selected: answer.selected, elapsedMs: answer.elapsedMs });
    }
    if (overRef.current) {
      setSaveStatus('saving');
      saveRef.current = saveCityRun(storageIdRef.current, snapshot, [...answersRef.current]);
      void saveRef.current.then(() => setSaveStatus('saved')).catch(() => setSaveStatus('error'));
    }
    setView(snapshot);
  }, [speak]);

  const onFrame = useCallback(({ timestamp }: { timestamp: number }) => {
    'worklet';
    const interval = lastTimestamp.value === null ? 0 : timestamp - lastTimestamp.value;
    const clock = advanceClock(lastTimestamp.value, timestamp, running.value && game.value.phase !== 'gameOver');
    lastTimestamp.set(clock.timestamp);
    const captureInterval = profiling && running.value && interval > 0 && profile.value !== null && !profile.value.complete;
    if (clock.seconds === 0 && !captureInterval) return;
    const previous = game.value;
    const engineStart = profiling ? performance.now() : 0;
    holdSeconds.set(holding.value && previous.phase === 'question' ? holdSeconds.value + clock.seconds : 0);
    const next = advanceGame(previous, clock.seconds, target.value, holdSeconds.value >= .15);
    if (next.phase !== previous.phase) { holding.set(false); holdSeconds.set(0); }
    if (captureInterval && profile.value) {
      const engineMs = performance.now() - engineStart;
      profile.modify(sample => {
        'worklet';
        if (!sample) return sample;
        if (sample.warmupMs < 1000) sample.warmupMs += interval;
        else {
          sample.intervals[sample.count] = interval;
          sample.engine[sample.count++] = engineMs;
          sample.elapsedMs += interval;
          if (sample.elapsedMs >= 4000 || sample.count >= 512) sample.complete = true;
        }
        return sample;
      });
      if (profile.value.complete) scheduleOnRN(receiveProfile, profile.value);
    }
    if (clock.seconds === 0) return;
    game.set(next);
    distance.set(next.distance);
    lateral.set(next.lateral);
    playerTurn.set(advancePlayerTurn(playerTurn.value, previous.lateral, next.lateral,
      next.elapsed - previous.elapsed, reducedMotion.value));
    if (next.revision !== previous.revision) scheduleOnRN(receiveEvent, gameView(next));
    if (next.phase === 'gameOver') { running.set(false); lastTimestamp.set(null); }
  }, [game, distance, lateral, playerTurn, reducedMotion, target, lastTimestamp, running, holding, holdSeconds, receiveEvent, profiling, profile, receiveProfile]);
  const frame = useFrameCallback(onFrame, false);
  useEffect(() => { frameRef.current = frame; return () => { frame.setActive(false); }; }, [frame]);

  const updateRunning = useCallback(() => {
    lastTimestamp.set(null);
    holding.set(false); holdSeconds.set(0);
    const enabled = activeRef.current && readyRef.current && hydratedRef.current && !pausedRef.current && !overRef.current;
    running.set(enabled);
    frameRef.current?.setActive(enabled);
  }, [lastTimestamp, running, holding, holdSeconds]);

  useEffect(() => {
    // Fast Refresh reruns effects while preserving refs and the UI-thread run.
    // Rehydrating here would reset React to run 1 while event guards still expect a later run.
    if (hydratedRef.current) return;
    let active = true;
    loadCityRun(initial.seed, runIdRef.current, initial, levelId, review).then(fresh => {
      if (!active) return;
      runIdRef.current = fresh.runId;
      game.set(fresh); overRef.current = fresh.phase === 'gameOver'; revisionRef.current = fresh.revision; setView(gameView(fresh));
    }).catch(() => {}).finally(() => {
      if (active) { hydratedRef.current = true; updateRunning(); }
    });
    return () => { active = false; };
  }, [initial, game, updateRunning, levelId, review]);

  const setReady = useCallback((ready: boolean) => {
    if (readyRef.current === ready) return;
    readyRef.current = ready;
    updateRunning();
  }, [updateRunning]);

  useEffect(() => {
    const onActive = (active: boolean) => {
      activeRef.current = active;
      if (!active) stopAudio();
      updateRunning();
    };
    const subscription = AppState.addEventListener('change', state => onActive(state === 'active'));
    // Android's notification drawer can blur without changing AppState.
    const blur = Platform.OS === 'android' ? AppState.addEventListener('blur', () => onActive(false)) : undefined;
    const focus = Platform.OS === 'android' ? AppState.addEventListener('focus', () => onActive(AppState.currentState === 'active')) : undefined;
    const onVisibility = () => onActive(document.visibilityState === 'visible' && document.hasFocus());
    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('blur', onVisibility);
      window.addEventListener('focus', onVisibility);
      onVisibility();
    } else updateRunning();
    return () => {
      subscription.remove();
      blur?.remove();
      focus?.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('blur', onVisibility);
        window.removeEventListener('focus', onVisibility);
      }
      running.set(false);
      lastTimestamp.set(null);
      frameRef.current?.setActive(false);
    };
  }, [lastTimestamp, running, updateRunning, stopAudio]);

  const setHolding = useCallback((pressed: boolean) => {
    holding.set(pressed && activeRef.current && !pausedRef.current && !overRef.current);
    holdSeconds.set(0);
  }, [holding, holdSeconds]);

  const steer = useCallback((direction: -1 | 1) => {
    if (pausedRef.current || !activeRef.current || !readyRef.current || !hydratedRef.current || overRef.current) return;
    const next = changeLane(targetRef.current, direction);
    targetRef.current = next;
    target.set(next);
    // React updates only for input/accessibility, never for animation frames.
    setTargetLane(next);
  }, [target]);

  const togglePause = useCallback(() => {
    if (overRef.current) return;
    pausedRef.current = !pausedRef.current;
    if (pausedRef.current) stopAudio();
    updateRunning();
    setPaused(pausedRef.current);
  }, [updateRunning, stopAudio]);

  // Explicit resume keeps rapid taps or a modal dismissal from reopening pause.
  const resume = useCallback(() => {
    if (!pausedRef.current || overRef.current) return;
    pausedRef.current = false;
    updateRunning();
    setPaused(false);
  }, [updateRunning]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); steer(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    // RN Web's Modal consumes Escape on keyup. Opening on keydown would let
    // that same keyup immediately close it. The modal owns Escape while paused.
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.repeat && !pausedRef.current) togglePause();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [steer, togglePause]);

  const restart = useCallback(async () => {
    if (restartingRef.current) return;
    restartingRef.current = true;
    stopAudio();
    await saveRef.current.catch(() => {});
    runIdRef.current += 1;
    const seed = Math.floor(Math.random() * 2147483646) + 1;
    const fresh = await loadCityRun(seed, runIdRef.current, undefined, levelId, review).catch(() => createRun(seed, runIdRef.current));
    answersRef.current = []; storageIdRef.current = `city-${Date.now()}-${Math.random()}`;
    setSaveStatus('idle'); restartingRef.current = false;
    game.set(fresh);
    distance.set(0); lateral.set(0); target.set(0); playerTurn.set(0);
    targetRef.current = 0; pausedRef.current = false; overRef.current = fresh.phase === 'gameOver';
    revisionRef.current = fresh.revision;
    setPaused(false); setTargetLane(0); setView(gameView(fresh));
    updateRunning();
  }, [game, distance, lateral, target, playerTurn, updateRunning, levelId, review, stopAudio]);

  // Counters and input events must not reconcile the Skia scene graph.
  const world = useMemo(() => ({ distance, lateral, playerTurn, game, reducedMotion, setReady }),
    [distance, lateral, playerTurn, game, reducedMotion, setReady]);
  return { distance, lateral, game, view, paused, targetLane, steer, togglePause, resume, restart, setReady, reducedMotion,
    world, profiling, profileReport, saveStatus, audio, setHolding, holdSeconds };
}

export type DrivingSimulation = ReturnType<typeof useDrivingSimulation>;
export type WorldSimulation = DrivingSimulation['world'];
