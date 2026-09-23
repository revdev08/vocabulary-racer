import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';
import type { SceneLayout } from '../geometry/perspective';
import { answerCardLayout, answerCueMotion, createAnswerCue } from '../gameplay/answerFeedback';
import { gameplay } from '../config/gameplay';
import { decorativeSvgProps } from './decorativeSvgProps';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function AnswerFeedback({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const { game, view, reducedMotion } = simulation;
  const cue = useMemo(() => createAnswerCue(view), [view]);
  const motion = useDerivedValue(() => answerCueMotion(game.value, cue, reducedMotion.value));
  const card = useAnimatedStyle(() => ({ opacity: motion.value.opacity,
    transform: [{ translateY: motion.value.translateY }, { scale: motion.value.scale }] }));
  const symbol = useAnimatedStyle(() => ({ transform: [{ translateX: motion.value.shake }] }));
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: 80 * (1 - motion.value.symbol) }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: 164 * (1 - motion.value.ring) }));
  if (view.phase !== 'feedback' || !view.question || !view.feedback) return null;
  const correct = view.feedback.kind === 'correct';
  const { word, correct: translation, options } = view.question;
  const selected = options[(view.selectedLane ?? 0) + 1];
  const color = correct ? '#157E62' : '#BF3955';
  const light = correct ? '#E8FFF4' : '#FFF0F2';
  const title = correct ? '¡Correcto!' : 'Incorrecto';
  const announcement = correct ? `Correcto. ${word} significa ${translation}. Más ${gameplay.pointsPerCorrect} puntos. Racha ${view.streak}.`
    : `Incorrecto. Elegiste ${selected}. ${word} significa ${translation}. Menos una vida.`;
  return <Animated.View accessible accessibilityRole="alert" accessibilityLiveRegion="polite"
    accessibilityLabel={announcement} style={[styles.card, answerCardLayout(layout), { borderColor: correct ? '#8CDEC0' : '#F4B2BF' }, card]}>
    <View style={styles.header}>
      <Animated.View style={[styles.symbol, { backgroundColor: light }, symbol]}>
        <Svg width={58} height={58} viewBox="0 0 58 58" {...decorativeSvgProps}>
          <Circle cx={29} cy={29} r={21} fill={color} />
          <AnimatedCircle cx={29} cy={29} r={26} stroke={color} opacity={.6} strokeWidth={2}
            fill="none" strokeDasharray="164 164" animatedProps={ringProps} transform="rotate(-90 29 29)" />
          <AnimatedPath d={correct ? 'M17 29 25 37 41 20' : 'M21 21 37 37 M37 21 21 37'} fill="none"
            stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="80 80" animatedProps={pathProps} />
        </Svg>
      </Animated.View>
      <View style={styles.heading}>
        <Text maxFontSizeMultiplier={1.1} style={[styles.title, { color }]}>{title}</Text>
        {correct ? <Text maxFontSizeMultiplier={1.1} style={styles.detail}>+{gameplay.pointsPerCorrect} puntos · Racha {view.streak}</Text>
          : <Text maxFontSizeMultiplier={1.1} style={styles.detail}>Elegiste <Text style={styles.missed}>{selected}</Text> · −1 vida</Text>}
      </View>
    </View>
    <View style={[styles.translation, { backgroundColor: correct ? '#E8F9F2' : '#F0F6FA' }]}>
      {!correct && <Text maxFontSizeMultiplier={1.1} style={styles.caption}>TRADUCCIÓN CORRECTA</Text>}
      <Text adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.1} style={styles.pair}>
        <Text style={styles.spanish}>{word}</Text><Text style={styles.arrow}> → </Text>{translation}
      </Text>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  card: { pointerEvents: 'none', position: 'absolute', padding: 14, borderRadius: 25, borderWidth: 1.5, backgroundColor: '#FAFEFF',
    justifyContent: 'space-between', boxShadow: '0px 9px 24px rgba(10, 32, 48, 0.22)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  symbol: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, gap: 3 },
  title: { fontSize: 25, fontWeight: '900', letterSpacing: -.5 },
  detail: { fontSize: 12, fontWeight: '700', color: '#526A7B' },
  missed: { color: '#AA314A', textDecorationLine: 'line-through' },
  translation: { minHeight: 51, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
  caption: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#526A7B', marginBottom: 2 },
  pair: { fontSize: 26, fontWeight: '900', color: '#123D46' },
  spanish: { fontWeight: '600', color: '#496778' },
  arrow: { color: '#8BA6B3', fontWeight: '500' },
});
