import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../config/visual';
import type { SceneLayout } from '../geometry/perspective';
import { GameIcon } from './GameIcon';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { rewardVisuals } from '../config/gameplay';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';

export function WordCard({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const { view: game, game: state, reducedMotion, paused } = simulation;
  const transition = useAnimatedStyle(() => {
    const progress = state.value.phase === 'question' && !paused ? Math.min(1, state.value.phaseTime / rewardVisuals.wordEntrySeconds) : 1;
    return { opacity: reducedMotion.value ? 1 : progress, transform: [{ translateY: reducedMotion.value ? 0 : -6 * (1 - progress) }] };
  });
  if (game.phase === 'feedback' || game.phase === 'gameOver') return null;
  if (!game.question || game.phase === 'traffic') return <View
    style={[styles.indicator, { top: layout.prompt.y, alignSelf: 'center' }]}>
    <Text style={styles.indicatorText}>{game.mode === 'review' ? 'Repaso' : 'Nivel'} · {game.vocabularyCursor}/{game.wordTarget} palabras · {game.reviewCount}/3 repasos</Text>
  </View>;
  const word = game.question.word.split(' (')[0];
  const context = game.question.word.includes(' (') ? game.question.word.slice(word.length + 2, -1) : '';
  // The hold-to-accelerate hint is learned quickly; later cards keep only the progress.
  const hint = game.correct + game.errors < 2 ? ' · Mantén pulsado para acelerar' : '';
  const caption = `${game.currentIsReview ? 'Repaso' : `Palabra ${game.vocabularyCursor}/${game.wordTarget}`}${hint}`;
  const fontSize = Math.min(41, (layout.prompt.width - 87) / (Math.max(5, word.length) * 0.6));
  return (
    <Animated.View style={[styles.card, { left: layout.prompt.x, top: layout.prompt.y, width: layout.prompt.width, height: layout.prompt.height }, transition]}>
      <View style={styles.copy}>
        <Text numberOfLines={2} accessibilityLabel={`Palabra a traducir: ${word}`} maxFontSizeMultiplier={1.1} style={[styles.word, { fontSize }]}>{word}</Text>
        {!!context && <Text maxFontSizeMultiplier={1.05} style={styles.caption}>{context}</Text>}
        <Text maxFontSizeMultiplier={1.05} style={styles.caption}>{caption}</Text>
      </View>
      <View style={styles.divider} />
      <Pressable onPress={simulation.audio.toggle} accessibilityRole="button" accessibilityLabel={`Pronunciación ${simulation.audio.enabled ? 'activada' : 'desactivada'}. Cambiar`} accessibilityState={{ checked: simulation.audio.enabled }} style={styles.audio}>
        <GameIcon name="audio" size={29} color={simulation.audio.enabled ? "#337DAF" : "#9AA8AF"} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  indicator: { pointerEvents: 'none', position: 'absolute', backgroundColor: 'rgba(20,45,73,0.86)', borderRadius: 13, paddingVertical: 7, paddingHorizontal: 15, borderWidth: 1, borderColor: '#8DB1C280' },
  indicatorText: { color: '#EDF7FF', fontSize: 12, fontWeight: '700' },
  card: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: 'rgba(250,253,255,0.96)', borderColor: '#FFFFFF', borderWidth: 1.5, borderRadius: 25, boxShadow: '0px 8px 26px rgba(20, 57, 90, 0.14)' },
  copy: { flex: 1, alignItems: 'center' },
  caption: { color: '#48657B', fontSize: 11, textAlign: 'center', marginTop: 3 },
  word: { textAlign: 'center', fontSize: 41, fontWeight: '800', color: palette.ink, letterSpacing: -1.7 },
  divider: { height: 33, width: 1, backgroundColor: '#D6E5EF' },
  audio: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#E9F3FB', alignItems: 'center', justifyContent: 'center' },
});
