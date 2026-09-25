import { useEffect, useId, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { levels, vocabulary, type VocabularyEntry } from '../data/vocabulary';
import { earnedStars, passedLevel } from '../gameplay/curriculum';
import type { GameView } from '../gameplay/types';
import { GameIcon } from './GameIcon';
import { HudCoin } from './HudArtwork';
import { decorativeSvgProps } from './decorativeSvgProps';

export type RunMistake = { wordId: string; recovered: boolean };
type Props = { game: GameView; onRestart: () => void; saveStatus?: string; onSpeak: (word: string) => void;
  mistakes: RunMistake[]; previousBest: number | null };

const colors = { ink: '#142D49', muted: '#52677A', paper: '#FFFCF4', line: '#E4E8E4', green: '#087D55', greenDark: '#045C42', gold: '#FFCC56' };
const tones = {
  success: { band: '#087D55', edge: '#045C42', glow: '#A8F3D5' },
  fail: { band: '#B8394F', edge: '#8A2338', glow: '#FFC2CC' },
  neutral: { band: '#1C4368', edge: '#102D4B', glow: '#9FD2F2' },
};
const starPath = 'M32 6 39.6 23.5 58.6 25.4 44.4 38 48.5 56.7 32 47 15.5 56.7 19.6 38 5.4 25.4 24.4 23.5Z';
let wordsById: Map<string, VocabularyEntry> | null = null;
const findWord = (id: string) => (wordsById ??= new Map(vocabulary.map(word => [word.id, word]))).get(id);

function Star({ size, earned, delay, lift = 0 }: { size: number; earned: boolean; delay: number; lift?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduced = useReducedMotion();
  const pop = useSharedValue(earned && !reduced ? 0 : 1);
  useEffect(() => {
    if (earned && !reduced) pop.set(withDelay(delay, withSpring(1, { damping: 9, stiffness: 170, mass: .8 })));
  }, [earned, reduced, delay, pop]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 3),
    transform: [{ translateY: -lift }, { scale: pop.value }, { rotate: `${(1 - pop.value) * -40}deg` }] }));
  return <Animated.View style={style}>
    <Svg width={size} height={size} viewBox="0 0 64 64" {...decorativeSvgProps}>
      <Defs>
        <LinearGradient id={`${id}gold`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF3A0" /><Stop offset="0.45" stopColor="#FFCB3D" /><Stop offset="1" stopColor="#EE9916" />
        </LinearGradient>
      </Defs>
      <Path d={starPath} transform="translate(0 3)" fill="#061A2C" opacity={0.3} />
      <Path d={starPath} fill={earned ? `url(#${id}gold)` : 'rgba(255,255,255,0.16)'} stroke={earned ? '#FFF1AF' : 'rgba(255,255,255,0.5)'}
        strokeWidth={2.5} strokeLinejoin="round" />
      {earned && <Path d="M22 27.5 30.5 26.5" stroke="#FFFDE6" strokeWidth={3} strokeLinecap="round" opacity={0.85} />}
    </Svg>
  </Animated.View>;
}

function useCountUp(target: number, reduced: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return reduced ? target : value;
}

function RecordBadge() {
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { if (!reduced) pop.set(withDelay(900, withSpring(1, { damping: 8, stiffness: 180 }))); }, [pop, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 2), transform: [{ scale: .6 + .4 * pop.value }, { rotate: '-3deg' }] }));
  return <Animated.View style={[styles.record, style]}><Text style={styles.recordText}>¡NUEVO RÉCORD!</Text></Animated.View>;
}

function Stat({ icon, value, label, tint }: { icon: ReactNode; value: number; label: string; tint: string }) {
  return <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.stat}>
    <View style={[styles.statIcon, { backgroundColor: tint }]}>{icon}</View>
    <View style={styles.statCopy}>
      <Text style={styles.statValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.statLabel}>{label}</Text>
    </View>
  </View>;
}

function Results({ game, onRestart, saveStatus, onSpeak, mistakes, previousBest }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const enter = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { if (!reduced) enter.set(withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })); }, [enter, reduced]);
  const cardStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateY: (1 - enter.value) * 40 }, { scale: .96 + .04 * enter.value }] }));
  const score = useCountUp(game.score, reduced);

  const review = game.mode === 'review';
  const emptyReview = review && game.wordTarget === 0;
  const passed = passedLevel(game);
  const stars = earnedStars(game);
  const levelIndex = levels.findIndex(level => level.id === game.levelId);
  const level = levels[levelIndex];
  const nextLevel = levels[levelIndex + 1];
  const goal = Math.ceil(game.wordTarget * .8);
  const tone = !game.completed ? tones.fail : passed || review ? tones.success : tones.neutral;
  const title = emptyReview ? 'Repasos al día' : !game.completed ? 'Sin vidas' : review ? 'Repaso completado' : passed ? '¡Nivel superado!' : 'Recorrido completado';
  const message = emptyReview ? 'No tienes palabras pendientes. Puedes continuar con tus niveles.'
    : !game.completed ? 'Los errores se guardan. Repásalos antes de volver a intentar.'
      : review || passed ? 'Tu aprendizaje continúa en los próximos repasos.'
        : `Necesitas ${goal} aciertos al primer intento para superar el nivel.`;
  const newRecord = !review && previousBest !== null && game.score > 0 && game.score > previousBest;
  const progress = review ? game.vocabularyCursor : game.firstCorrect;
  const words = mistakes.map(item => ({ ...item, entry: findWord(item.wordId) })).filter(item => item.entry);
  const saved = saveStatus === 'saved';

  return <View style={styles.overlay} accessibilityViewIsModal>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(24, insets.top + 16), paddingBottom: Math.max(24, insets.bottom + 16) }]}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={[styles.band, { backgroundColor: tone.band, borderBottomColor: tone.edge }]}>
          <View style={styles.bandShine} />
          <Text style={[styles.eyebrow, { color: tone.glow }]}>{review ? 'REPASO' : `NIVEL ${String(levelIndex + 1).padStart(2, '0')}`}</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {!review && !!level && <Text numberOfLines={1} style={styles.levelTitle}>{level.title}</Text>}
          {!review && <View accessible accessibilityLabel={`${stars} de 3 estrellas`} style={styles.stars}>
            <Star size={52} earned={stars >= 1} delay={380} />
            <Star size={66} earned={stars >= 2} delay={600} lift={10} />
            <Star size={52} earned={stars >= 3} delay={820} />
          </View>}
        </View>

        <View style={styles.body}>
          {!emptyReview && <View style={styles.goal}>
            <View style={styles.goalHeading}>
              <Text style={styles.goalLabel}>{review ? 'Palabras repasadas' : 'Aciertos al primer intento'}</Text>
              <Text style={styles.goalValue}>{progress}/{game.wordTarget}{review ? '' : <Text style={styles.goalTarget}>  ·  Meta {goal}</Text>}</Text>
            </View>
            <View style={styles.pips}>
              {Array.from({ length: game.wordTarget }, (_, i) => <View key={i}
                style={[styles.pip, i < progress && { backgroundColor: passed || review ? colors.green : '#E2A93B' },
                  !review && i === goal - 1 && styles.goalPip]} />)}
            </View>
          </View>}

          <View style={styles.scoreBlock} accessible accessibilityLabel={`${game.score} puntos${newRecord ? ', nuevo récord' : ''}`}>
            <Text style={styles.scoreLabel}>PUNTOS</Text>
            <Text style={styles.score}>{score}</Text>
            {newRecord && <RecordBadge />}
          </View>

          <View style={styles.stats}>
            <Stat icon={<GameIcon name="check" size={20} color="#FFFFFF" />} value={game.correct} label="Aciertos" tint="#1F9B6E" />
            <Stat icon={<GameIcon name="cross" size={18} color="#FFFFFF" />} value={game.errors} label="Errores" tint="#C9465E" />
            <Stat icon={<GameIcon name="crash" size={20} color="#FFFFFF" />} value={game.crashes} label="Choques" tint="#E27A2F" />
            <Stat icon={<HudCoin size={34} />} value={game.coinsCollected} label="Monedas" tint="transparent" />
          </View>

          {words.length > 0 && <View style={styles.mistakes}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Palabras para repasar</Text>
            {words.map(({ wordId, recovered, entry }) => <View key={wordId} style={styles.word}>
              <View style={styles.wordCopy}>
                <Text style={styles.spanish}>{entry!.spanish}</Text>
                <Text style={styles.english}>{entry!.correct}</Text>
              </View>
              {recovered && <View style={styles.recovered}><GameIcon name="check" size={13} color={colors.greenDark} /><Text style={styles.recoveredText}>Repasada</Text></View>}
              <Pressable accessibilityRole="button" accessibilityLabel={`Escuchar ${entry!.correct}`} onPress={() => onSpeak(entry!.correct)}
                hitSlop={6} style={({ pressed }) => [styles.listen, pressed && { opacity: .6 }]}>
                <GameIcon name="audio" size={22} color="#337DAF" />
              </Pressable>
            </View>)}
          </View>}

          <Text style={styles.message}>{message}</Text>

          {passed && nextLevel && <Pressable accessibilityRole="button" accessibilityState={{ disabled: !saved }} disabled={!saved}
            onPress={() => router.replace({ pathname: '/race', params: { level: nextLevel.id } })}
            style={({ pressed }) => [styles.primary, !saved && { opacity: .5 }, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryText}>Siguiente nivel</Text>
            <GameIcon name="play" size={20} />
          </Pressable>}
          {!emptyReview && <Pressable accessibilityRole="button" accessibilityLabel="Reiniciar partida" onPress={onRestart}
            style={({ pressed }) => passed && nextLevel ? [styles.secondary, pressed && { opacity: .7 }] : [styles.primary, pressed && styles.primaryPressed]}>
            <Text style={passed && nextLevel ? styles.secondaryText : styles.primaryText}>{game.completed ? 'Volver a jugar' : 'Intentar de nuevo'}</Text>
          </Pressable>}
          <Pressable accessibilityRole="button" disabled={saveStatus === 'saving'} onPress={() => router.replace('/')} style={({ pressed }) => [styles.home, pressed && { opacity: .6 }]}>
            <Text style={styles.homeText}>Volver al inicio</Text>
          </Pressable>
          <Text style={[styles.save, saveStatus === 'error' && { color: '#AB3045' }]}>
            {saveStatus === 'saved' ? 'Progreso guardado' : saveStatus === 'error' ? 'No se pudo guardar el progreso local' : saveStatus === 'saving' ? 'Guardando…' : ' '}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  </View>;
}

export function GameOver(props: Props) {
  if (props.game.phase !== 'gameOver') return null;
  // Keyed by run so every result replays its entrance, stars and score count.
  return <Results key={props.game.runId} {...props} />;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 24, 42, 0.8)', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 30, overflow: 'hidden', backgroundColor: colors.paper,
    borderWidth: 1, borderColor: '#FFFFFF', boxShadow: '0 18px 50px rgba(0, 9, 24, 0.4)' },
  band: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 5 },
  bandShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(255,255,255,0.08)' },
  eyebrow: { fontSize: 13, fontWeight: '800', letterSpacing: 1.6 },
  title: { marginTop: 4, fontSize: 31, lineHeight: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8, textAlign: 'center' },
  levelTitle: { marginTop: 2, fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  stars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginTop: 14, height: 62 },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12 },
  goal: { gap: 8 },
  goalHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  goalLabel: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: colors.muted },
  goalValue: { fontSize: 18, fontWeight: '900', color: colors.ink, fontVariant: ['tabular-nums'] },
  goalTarget: { fontSize: 13, fontWeight: '700', color: colors.muted },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#E1E6E3' },
  goalPip: { borderWidth: 2, borderColor: colors.gold },
  scoreBlock: { alignItems: 'center', marginTop: 16 },
  scoreLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, color: colors.muted },
  score: { fontSize: 52, lineHeight: 58, fontWeight: '900', color: colors.ink, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  record: { marginTop: 2, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.gold, borderBottomWidth: 3, borderBottomColor: '#D39A22' },
  recordText: { fontSize: 13, fontWeight: '900', letterSpacing: .8, color: '#5A3A00' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  stat: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statCopy: { flex: 1, minWidth: 0 },
  statValue: { fontSize: 20, lineHeight: 23, fontWeight: '900', color: colors.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
  mistakes: { marginTop: 16, padding: 12, gap: 8, borderRadius: 18, backgroundColor: '#FFF2F3', borderWidth: 1, borderColor: '#F6D3D9' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#8E2539' },
  word: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3DCE0' },
  wordCopy: { flex: 1, minWidth: 0 },
  spanish: { fontSize: 14, fontWeight: '600', color: colors.muted },
  english: { fontSize: 18, fontWeight: '900', color: colors.ink },
  recovered: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 8, backgroundColor: '#DDF6EA' },
  recoveredText: { fontSize: 11, fontWeight: '800', color: colors.greenDark },
  listen: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F3FB' },
  message: { marginTop: 16, marginBottom: 14, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  primary: { minHeight: 60, borderRadius: 20, backgroundColor: colors.green, borderBottomWidth: 5, borderBottomColor: colors.greenDark,
    flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginBottom: 10 },
  primaryPressed: { backgroundColor: colors.greenDark, transform: [{ translateY: 2 }] },
  primaryText: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  secondary: { minHeight: 52, borderRadius: 18, borderWidth: 2, borderColor: '#C9D6D1', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  secondaryText: { fontSize: 17, fontWeight: '800', color: colors.ink },
  home: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  homeText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  save: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
