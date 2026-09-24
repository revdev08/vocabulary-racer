// @refresh reset
// A development refresh must reset React and the UI-thread race together.
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { PixelRatio, Pressable, Text, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, scene } from './config/visual';
import { createSceneLayout } from './geometry/perspective';
import { GameWorld } from './world/GameWorld';
import { GameHud } from './ui/GameHud';
import { WordCard } from './ui/WordCard';
import { AnswerPortals } from './ui/AnswerPortals';
import { useDrivingSimulation } from './motion/useDrivingSimulation';
import { DrivingControls } from './controls/DrivingControls';
import { RunFeedback } from './ui/RunFeedback';
import { GameOver } from './ui/GameOver';
import { ActionReward } from './ui/ActionReward';
import { FrameDiagnostics } from './ui/FrameDiagnostics';
import { AnswerFeedback } from './ui/AnswerFeedback';
export default function GameScreen() {
  const params = useLocalSearchParams<{ level?: string; mode?: string }>();
  return <RaceSession key={`${params.level ?? 'essentials'}:${params.mode ?? 'level'}`} level={params.level} review={params.mode === 'review'} />;
}
function RaceSession({ level, review }: { level?: string; review: boolean }) {
  const insets = useSafeAreaInsets();
  const simulation = useDrivingSimulation(level, review);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const layout = useMemo(() => createSceneLayout(size.width, size.height, insets, PixelRatio.get()), [size, insets]);
  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width, height } = nativeEvent.layout;
    setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
  };
  return <View style={styles.root}>
    <View testID="game-screen" style={styles.viewport} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 && <>
        <GameWorld layout={layout} simulation={simulation.world} />
        <DrivingControls layout={layout} simulation={simulation} />
        <GameHud layout={layout} simulation={simulation} />
        <WordCard layout={layout} simulation={simulation} />
        <AnswerPortals layout={layout} simulation={simulation} />
        <ActionReward layout={layout} simulation={simulation} />
        <AnswerFeedback layout={layout} simulation={simulation} />
        <RunFeedback layout={layout} game={simulation.view} paused={simulation.paused} />
        <GameOver game={simulation.view} onRestart={simulation.restart} saveStatus={simulation.saveStatus} lastWord={simulation.audio.lastWord} onReplay={() => simulation.audio.speak(simulation.audio.lastWord, true)} />
        <FrameDiagnostics simulation={simulation} />
        {simulation.paused && <View style={{ position: 'absolute', bottom: Math.max(24, insets.bottom + 12), left: 20, right: 20, gap: 8, backgroundColor: '#142D49', padding: 16, borderRadius: 14 }}>
          <Pressable accessibilityRole="button" onPress={simulation.audio.toggle} style={{ padding: 10 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Pronunciación: {simulation.audio.enabled ? 'activada' : 'desactivada'}</Text>
          </Pressable>
          {!!simulation.audio.lastWord && <Pressable accessibilityRole="button" onPress={() => simulation.audio.speak(simulation.audio.lastWord, true)} style={{ padding: 10 }}>
            <Text style={{ color: '#A5F2DA', textAlign: 'center' }}>Escuchar de nuevo: {simulation.audio.lastWord}</Text>
          </Pressable>}
          {!!simulation.audio.error && <Text style={{ color: '#FFD7A8' }}>{simulation.audio.error}</Text>}
          <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={{ padding: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Salir al inicio · descartar partida</Text>
          </Pressable>
        </View>}

      </>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#102238', alignItems: 'center' },
  viewport: { width: '100%', maxWidth: scene.maxViewportWidth, flex: 1, overflow: 'hidden', backgroundColor: palette.sky },
});
