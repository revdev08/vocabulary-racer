import { levels } from '../data/vocabulary';
import { passedLevel } from '../gameplay/curriculum';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GameView } from '../gameplay/types';
import { palette } from '../config/visual';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GameOver({ game, onRestart, saveStatus, onReplay, lastWord }: { game: GameView; onRestart: () => void; saveStatus?: string; onReplay?: () => void; lastWord?: string }) {
  const insets = useSafeAreaInsets();
  if (game.phase !== 'gameOver') return null;
  const emptyReview = game.mode === 'review' && game.wordTarget === 0;
  const passed = passedLevel(game);
  const nextLevel = levels[levels.findIndex(level => level.id === game.levelId) + 1];
  return <View style={styles.overlay} accessibilityViewIsModal>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(24, insets.top + 16), paddingBottom: Math.max(24, insets.bottom + 16) }]}>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{emptyReview ? 'Repasos al día' : game.completed ? game.mode === 'review' ? 'Repaso completado' : passed ? '¡Nivel superado!' : 'Recorrido completado' : 'Sin vidas'}</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>{game.mode === 'review' ? `${game.vocabularyCursor}/${game.wordTarget} palabras repasadas` : `${game.firstCorrect}/${game.wordTarget} aciertos al primer intento · Meta: ${Math.ceil(game.wordTarget * .8)}`}</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>{emptyReview ? 'No tienes palabras pendientes. Puedes continuar con tus niveles.' : game.completed ? 'Tu aprendizaje continúa en los próximos repasos.' : 'Los errores se guardan. Repásalos antes de volver a intentar.'}</Text>
        <Text style={styles.score}>{game.score}</Text>
        <Text style={styles.subtitle}>Puntos</Text>
        <View style={styles.stats}>
          {[['Monedas recogidas', game.coinsCollected], ['Aciertos', game.correct], ['Errores de vocabulario', game.errors], ['Choques', game.crashes]].map(([label, value]) =>
            <View key={label} style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}
        </View>
        {game.feedback?.kind === 'wrong' && <Text style={styles.correction}>{game.feedback.message}</Text>}
        {!!lastWord && <Pressable accessibilityRole="button" onPress={onReplay} style={{ padding: 12 }}><Text style={styles.subtitle}>Escuchar: {lastWord}</Text></Pressable>}
        {passed && nextLevel && <Pressable accessibilityRole="button" disabled={saveStatus !== 'saved'}
          onPress={() => router.replace({ pathname: '/race', params: { level: nextLevel.id } })}
          style={[styles.button, { marginBottom: 10, opacity: saveStatus === 'saved' ? 1 : .4 }]}><Text style={styles.buttonText}>Siguiente nivel →</Text></Pressable>}
        {!emptyReview && <Pressable accessibilityRole="button" accessibilityLabel="Reiniciar partida" onPress={onRestart}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}><Text style={styles.buttonText}>Volver a jugar</Text></Pressable>}
        <Text style={styles.subtitle}>{saveStatus === 'saved' ? 'Nivel, récord y repasos guardados' : saveStatus === 'error' ? 'No se pudo guardar el progreso local' : saveStatus === 'saving' ? 'Guardando recorrido…' : ''}</Text>
        <Pressable accessibilityRole="button" disabled={saveStatus === 'saving'} onPress={() => router.replace('/')} style={{ padding: 16 }}><Text style={styles.subtitle}>Volver al inicio</Text></Pressable>
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12,31,50,0.88)', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 44, paddingHorizontal: 20 },
  card: { backgroundColor: '#F5FAFE', borderRadius: 26, padding: 23, borderColor: '#FFFFFF', borderWidth: 1.5 },
  title: { fontSize: 24, color: palette.ink, fontWeight: '800', textAlign: 'center' },
  score: { fontSize: 50, color: palette.ink, fontWeight: '800', textAlign: 'center', marginTop: 13 },
  subtitle: { textAlign: 'center', color: '#577184', fontWeight: '600' },
  stats: { gap: 13, marginVertical: 25 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  label: { color: '#436078', fontSize: 15, flexShrink: 1 },
  value: { color: palette.ink, fontSize: 19, fontWeight: '800' },
  correction: { color: '#AB3045', fontWeight: '700', textAlign: 'center', marginBottom: 18 },
  button: { backgroundColor: palette.navy, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 12 },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 17 },
});
