import { StyleSheet, View } from 'react-native';
import { palette } from '../config/visual';
import type { SceneLayout } from '../geometry/perspective';
import { GameIcon } from './GameIcon';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { portalProjection } from '../geometry/entities';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';

function Choice({ layout, simulation, lane, label }: { layout: SceneLayout; simulation: DrivingSimulation; lane: number; label: string }) {
  const { game, view } = simulation;
  const geometry = useDerivedValue(() => portalProjection(layout, game.value, lane), [layout, game, lane]);
  const position = useAnimatedStyle(() => {
    const p = geometry.value;
    return { transform: [{ translateX: p.foot.x - 64 }, { translateY: p.y }], opacity: p.opacity };
  });
  const labelSize = useAnimatedStyle(() => ({ transform: [{ translateY: (geometry.value.labelHeight - 48) / 2 },
    { scaleX: geometry.value.width / 128 }, { scaleY: geometry.value.labelHeight / 48 }] }));
  const textSize = useAnimatedStyle(() => ({ transform: [{ translateY: (geometry.value.labelHeight - 48) / 2 },
    { scale: Math.min(24, Math.max(14, geometry.value.width * .235)) / 24 }] }));
  const direction = useAnimatedStyle(() => ({ transform: [{ translateY: geometry.value.labelHeight + 6 }] }));
  const answered = view.phase === 'feedback';
  const correct = answered && lane === view.question?.correctLane;
  const wrong = answered && !correct && lane === view.selectedLane;
  const color = correct ? '#3FD09E' : wrong ? '#F16878' : palette.cyan;
  return <Animated.View accessible accessibilityLabel={`Carril ${lane + 2}: ${label}${correct ? ', correcta' : wrong ? ', incorrecta' : ''}`}
    style={[styles.portal, position]}>
    <Animated.View style={[styles.label, labelSize, { borderColor: color, backgroundColor: correct ? '#DDFFF0' : wrong ? '#FFE6EA' : palette.portal }]} />
    <Animated.View style={[styles.copy, textSize]}>
      <Animated.Text maxFontSizeMultiplier={1} numberOfLines={1} style={styles.text}>{label}</Animated.Text>
    </Animated.View>
    <Animated.View style={[styles.direction, direction]}><GameIcon name={correct ? 'check' : wrong ? 'cross' : 'chevron'} size={25} color={correct || wrong ? color : palette.portal} /></Animated.View>
  </Animated.View>;
}

export function AnswerPortals({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const { view } = simulation;
  if (!view.question || (view.phase !== 'question' && view.phase !== 'feedback')) return null;
  return <View style={styles.overlay}>
    {view.question.options.map((label, index) => <Choice key={index} label={label} lane={index - 1} layout={layout} simulation={simulation} />)}
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
  portal: { position: 'absolute', left: 0, top: 0, width: 128, height: 80 },
  label: { position: 'absolute', width: 128, height: 48, backgroundColor: palette.portal, borderRadius: 12, borderWidth: 2, borderColor: palette.cyan, boxShadow: '0px 3px 16px rgba(70, 208, 229, 0.26)' },
  copy: { position: 'absolute', width: 128, height: 48, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, color: palette.ink },
  direction: { position: 'absolute', left: 51.5, top: 0 },
});
