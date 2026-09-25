// @refresh reset
// A development refresh must reset React and the UI-thread race together.
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, scene } from './config/visual';
import { createSceneLayout } from './geometry/perspective';
import { levels } from './data/vocabulary';
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
import { PauseMenu } from './ui/PauseMenu';
import { Countdown } from './ui/Countdown';
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
  const levelIndex = levels.findIndex(item => item.id === (level ?? simulation.view.levelId));
  const eyebrow = review ? 'REPASO' : levelIndex >= 0 ? `NIVEL ${String(levelIndex + 1).padStart(2, '0')}` : undefined;
  const title = review ? 'Palabras pendientes' : levels[levelIndex]?.title;
  const ready = simulation.worldReady;
  return <View style={styles.root}>
    <View testID="game-screen" style={styles.viewport} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 && <>
        <GameWorld layout={layout} simulation={simulation.world} eyebrow={eyebrow} title={title} />
        {ready && <>
          <DrivingControls layout={layout} simulation={simulation} />
          <GameHud layout={layout} simulation={simulation} />
          <WordCard layout={layout} simulation={simulation} />
          <AnswerPortals layout={layout} simulation={simulation} />
          <ActionReward layout={layout} simulation={simulation} />
          <AnswerFeedback layout={layout} simulation={simulation} />
          <RunFeedback layout={layout} game={simulation.view} paused={simulation.paused} />
          <Countdown layout={layout} value={simulation.paused ? null : simulation.countdown} />
          <GameOver game={simulation.view} onRestart={simulation.restart} saveStatus={simulation.saveStatus}
            onSpeak={word => simulation.audio.speak(word, true)} mistakes={simulation.mistakes} previousBest={simulation.previousBest} />
          <FrameDiagnostics simulation={simulation} />
        </>}
        <PauseMenu visible={simulation.paused && simulation.view.phase !== 'gameOver'}
          audioEnabled={simulation.audio.enabled} lastWord={simulation.audio.lastWord} audioError={simulation.audio.error}
          onResume={simulation.resume} onToggleAudio={simulation.audio.toggle}
          onReplay={() => simulation.audio.speak(simulation.audio.lastWord, true)}
          onExit={() => { simulation.audio.stop(); router.replace('/'); }} />
      </>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#102238', alignItems: 'center' },
  viewport: { width: '100%', maxWidth: scene.maxViewportWidth, flex: 1, overflow: 'hidden', backgroundColor: palette.sky },
});
