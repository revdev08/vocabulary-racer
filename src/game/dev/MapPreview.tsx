import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { createRun, advanceGame, gameView } from '../gameplay/engine';
import { routeTarget } from '../gameplay/patterns';
import { advanceClock, type Lane } from '../motion/simulation';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';
import { createSceneLayout } from '../geometry/perspective';
import { getMapTheme } from '../config/maps';
import { GameWorld } from '../world/GameWorld';
import { GameHud } from '../ui/GameHud';
import { WordCard } from '../ui/WordCard';
import { AnswerPortals } from '../ui/AnswerPortals';

/** Deterministic art-review fixtures only. No progress, storage, audio or gameplay changes. */
function fixture(pose: string) {
  let run = createRun(2026);
  for (let frame = 0; frame < 2400; frame++) {
    if (pose === 'traffic' ? run.elapsed >= 2.6 : run.phase === 'question' && run.phaseTime >= .8) break;
    run = advanceGame(run, 1 / 120, routeTarget(run.plan, run.plan.initialLateral, run.phaseTime));
  }
  return { ...run, lateral: pose === 'right' ? 1 : 0 };
}
const noop = () => {};

export default function MapPreview() {
  const params = useLocalSearchParams<{ pose?: string; map?: string; clean?: string }>();
  const pose = params.pose === 'question' || params.pose === 'right' ? params.pose : 'traffic';
  return <PreviewFrame key={`${params.map}-${pose}`} pose={pose} mapId={params.map ?? 'city'} clean={params.clean === '1'} />;
}

function PreviewFrame({ pose, clean, mapId }: { pose: string; clean: boolean; mapId: string }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [initial] = useState(() => fixture(pose));
  const game = useSharedValue(initial), distance = useSharedValue(initial.distance), lateral = useSharedValue(initial.lateral);
  const playerTurn = useSharedValue(0), reducedMotion = useSharedValue(true), holdSeconds = useSharedValue(0);
  const timestamp = useSharedValue<number | null>(null);
  const setReadyForPreview = useCallback((value: boolean) => setReady(value), []);
  useFrameCallback(({ timestamp: now }) => {
    'worklet';
    const clock = advanceClock(timestamp.value, now, live && ready);
    timestamp.value = clock.timestamp;
    if (!clock.seconds) return;
    const current = game.value;
    // Loop a real section for visual inspection; this driver never exists in a race.
    const next = current.phase !== 'traffic' ? initial : advanceGame(current, clock.seconds,
      routeTarget(current.plan, current.plan.initialLateral, current.phaseTime));
    game.value = next; distance.value = next.distance; lateral.value = next.lateral;
  });
  const world = useMemo(() => ({ game, distance, lateral, playerTurn, reducedMotion, setReady: setReadyForPreview }),
    [game, distance, lateral, playerTurn, reducedMotion, setReadyForPreview]);
  const simulation: DrivingSimulation = {
    world, game, distance, lateral, reducedMotion, holdSeconds, view: gameView(initial), paused: false,
    targetLane: initial.lateral as Lane, steer: noop, togglePause: () => setLive(value => !value), resume: noop,
    restart: async () => {}, setReady: setReadyForPreview, profiling: false, profileReport: null, saveStatus: 'idle',
    audio: { enabled: false, error: '', lastWord: '', speak: noop, stop: noop, toggle: noop, forget: noop },
    setHolding: noop, worldReady: ready, countdown: null, previousBest: 0, mistakes: [],
  };
  const layout = useMemo(() => createSceneLayout(size.width, size.height, { top: 0, bottom: 0, left: 0, right: 0 }), [size]);
  return <View testID={ready ? 'map-preview-ready' : 'map-preview-loading'} style={styles.root}
    onLayout={e => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
    {size.width > 0 && size.height > 0 && <>
      <GameWorld map={getMapTheme(mapId)} layout={layout} simulation={world} />
      {ready && <><GameHud layout={layout} simulation={simulation} /><WordCard layout={layout} simulation={simulation} />
        <AnswerPortals layout={layout} simulation={simulation} /></>}
    </>}
    {!clean && <View style={styles.controls}><Pressable style={styles.control} onPress={() => setLive(value => !value)} accessibilityRole="button">
      <Text style={styles.label}>{live ? 'Detener vista de prueba' : 'Animar tráfico de prueba'}</Text>
    </Pressable><Pressable style={[styles.control, styles.play]} accessibilityRole="button"
      onPress={() => router.push({ pathname: '/race', params: { map: getMapTheme(mapId).id } })}>
      <Text style={styles.playLabel}>Jugar este mapa</Text>
    </Pressable></View>}
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1, overflow: 'hidden' },
  controls: { position: 'absolute', bottom: 16, alignSelf: 'center', gap: 8 },
  control: { backgroundColor: '#142D49', padding: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  play: { backgroundColor: '#087E60' },
  playLabel: { color: 'white', fontSize: 18, fontWeight: '800' },
  label: { color: 'white', fontSize: 12 } });
