import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { gameplay } from '../config/gameplay';
import { projectWorld, type SceneLayout } from '../geometry/perspective';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';

export function ActionReward({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const { view, game, reducedMotion } = simulation;
  const style = useAnimatedStyle(() => {
    const state = game.value;
    const foot = projectWorld(layout.camera, { lateral: state.selectedLane ?? state.lateral, distance: layout.playerDepth });
    const p = Math.min(1, state.phaseTime / gameplay.answerEffectSeconds);
    return { transform: [{ translateX: Math.max(6, Math.min(layout.width - 102, foot.x - 48)) },
      { translateY: layout.playerBaseY + 8 - (reducedMotion.value ? 0 : p * 8) },
      { scale: reducedMotion.value ? 1 : 1 + Math.sin(Math.min(1, p * 4) * Math.PI) * .10 }],
      opacity: state.phase === 'feedback' ? Math.min(1, (1 - p) * 4) : 0 };
  });
  if (view.phase !== 'feedback' || view.feedback?.kind !== 'correct') return null;
  return <Animated.View style={[styles.badge, style]}>
    <Text style={styles.text}>+{gameplay.pointsPerCorrect} pts</Text>
  </Animated.View>;
}
const styles = StyleSheet.create({
  badge: { pointerEvents: 'none', position: 'absolute', left: 0, top: 0, minWidth: 96, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6,
    backgroundColor: '#123D3EEB', borderRadius: 12, borderWidth: 1, borderColor: '#8AF9D2' },
  text: { color: '#E3FFF2', fontSize: 19, fontWeight: '900' },
});
