import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { gameplay } from '../config/gameplay';
import { projectWorld, type SceneLayout } from '../geometry/perspective';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';

const formatMultiplier = (value: number) => `x${String(value).replace('.', ',')}`;

export function ActionReward({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const { view, game, reducedMotion } = simulation;
  const style = useAnimatedStyle(() => {
    const state = game.value;
    const foot = projectWorld(layout.camera, { lateral: state.selectedLane ?? state.lateral, distance: layout.playerDepth });
    const p = Math.min(1, state.phaseTime / gameplay.answerEffectSeconds);
    return { transform: [{ translateX: Math.max(6, Math.min(layout.width - 132, foot.x - 63)) },
      { translateY: layout.playerBaseY + 8 - (reducedMotion.value ? 0 : p * 8) },
      { scale: reducedMotion.value ? 1 : 1 + Math.sin(Math.min(1, p * 4) * Math.PI) * .10 }],
      opacity: state.phase === 'feedback' ? Math.min(1, (1 - p) * 4) : 0 };
  });
  const award = view.award;
  if (view.phase !== 'feedback' || view.feedback?.kind !== 'correct' || !award) return null;
  return <Animated.View style={[styles.badge, style]}>
    <Text style={styles.text}>+{award.points} pts</Text>
    {(award.multiplier > 1 || award.quick) && <View style={styles.tags}>
      {award.multiplier > 1 && <Text style={[styles.tag, styles.streak]}>Racha {formatMultiplier(award.multiplier)}</Text>}
      {award.quick && <Text style={[styles.tag, styles.quick]}>Rápida +{gameplay.quickAnswerBonus}</Text>}
    </View>}
  </Animated.View>;
}

/** Brief "+50 conducción limpia" when a traffic section ends without a crash. */
export function SectionBonusToast({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const { view, game, reducedMotion } = simulation;
  const at = view.sectionBonus?.at ?? -1;
  const style = useAnimatedStyle(() => {
    const t = (game.value.elapsed - at) / gameplay.bonusToastSeconds;
    const visible = at >= 0 && t >= 0 && t <= 1;
    return { opacity: visible ? Math.min(1, t * 8, (1 - t) * 4) : 0,
      transform: [{ translateY: reducedMotion.value || !visible ? 0 : -18 * t }] };
  });
  if (!view.sectionBonus || view.phase !== 'question') return null;
  return <Animated.View style={[styles.toastRow, { top: layout.playerBaseY - layout.player.height * .9 }, style]}>
    <View style={styles.toast}>
      <Text style={styles.toastPoints}>+{view.sectionBonus.points}</Text>
      <Text style={styles.toastLabel}>Conducción limpia</Text>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  badge: { pointerEvents: 'none', position: 'absolute', left: 0, top: 0, width: 126, alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6,
    backgroundColor: '#123D3EEB', borderRadius: 12, borderWidth: 1, borderColor: '#8AF9D2' },
  text: { color: '#E3FFF2', fontSize: 19, fontWeight: '900' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  tag: { fontSize: 11, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  streak: { color: '#5A2A00', backgroundColor: '#FFCF48' },
  quick: { color: '#0B3552', backgroundColor: '#9FE3FF' },
  toastRow: { pointerEvents: 'none', position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14,
    backgroundColor: 'rgba(16, 42, 68, 0.9)', borderWidth: 1.5, borderColor: '#8AF9D2' },
  toastPoints: { color: '#8AF9D2', fontSize: 18, fontWeight: '900' },
  toastLabel: { color: '#E3F0FC', fontSize: 14, fontWeight: '800' },
});
