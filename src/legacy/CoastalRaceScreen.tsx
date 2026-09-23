import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, BackHandler, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GameIcon } from '../components/GameIcon';
import { Scene } from '../components/Scene';
import { Button, palette, styles } from '../components/ui';
import { APPROACH_MS, createRace, move, tick, TOTAL, WORDS } from '../game/engine';
import { readProgress, saveRace } from '../game/storage';

export default function RaceScreen() {
  const [race, setRace] = useState(() => createRace());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    readProgress().then(p => { if (active) setRace(createRace(Math.random, p.reviews)); }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const [paused, setPaused] = useState(false);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saving');
  const finished = race.phase === 'finished';
  const insets = useSafeAreaInsets();
  const steer = useCallback((direction: -1 | 1) => { if (ready && !paused) setRace(r => move(r, direction)); }, [paused, ready]);
  const pan = useMemo(() => PanResponder.create({ onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy), onPanResponderRelease: (_, g) => { if (Math.abs(g.dx) > 20) steer(g.dx > 0 ? 1 : -1); } }), [steer]);
  useEffect(() => {
    if (!ready || paused || race.phase === 'finished') return;
    let last = performance.now();
    const timer = setInterval(() => { const now = performance.now(); const dt = Math.max(0, now - last); last = now; setRace(r => tick(r, dt)); }, 50);
    return () => clearInterval(timer);
  }, [paused, ready, race.phase]);
  useEffect(() => {
    const pause = () => { if (!finished) setPaused(true); };
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') pause(); });
    const back = BackHandler.addEventListener('hardwareBackPress', () => { if (finished) return false; pause(); return true; });
    if (Platform.OS === 'web') {
      const key = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); steer(e.key === 'ArrowLeft' ? -1 : 1); } if (e.key === 'Escape') pause(); };
      const visibility = () => { if (document.hidden) pause(); };
      window.addEventListener('keydown', key); document.addEventListener('visibilitychange', visibility);
      return () => { listener.remove(); back.remove(); window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility); };
    }
    return () => { listener.remove(); back.remove(); };
  }, [steer, finished]);
  useEffect(() => {
    if (race.phase !== 'feedback' || Platform.OS === 'web') return;
    Haptics.notificationAsync(race.answers.at(-1)?.result === 'correct' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [race.phase, race.answers]);
  useEffect(() => {
    if (race.phase !== 'finished') return;
    let active = true;
    saveRace(race).then(() => { if (active) setSaveState('saved'); }).catch(() => { if (active) setSaveState('error'); });
    return () => { active = false; };
  }, [race]);
  const result = race.answers.at(-1)?.result;
  const correct = race.answers.filter(a => a.result === 'correct').length;
  const restart = async () => {
    if (!ready) return;
    setReady(false);
    try { await saveRace(race); const p = await readProgress(); setRace(createRace(Math.random, p.reviews)); }
    catch { setRace(createRace()); }
    finally { setSaveState('saving'); setPaused(false); setReady(true); }
  };
  if (race.phase === 'finished') return <View style={s.finish}><Scene paused /><ScrollView contentContainerStyle={[s.resultsContent, { paddingTop: insets.top + 38, paddingBottom: insets.bottom + 24 }]}>
    <View style={s.resultCard}><Text style={styles.eyebrow}>COSTA SOLEADA · RESULTADOS</Text><GameIcon name={race.lives ? 'flag' : 'retry'} size={40} /><Text style={styles.title}>{race.lives ? '¡Llegaste a la meta!' : 'Un intento más cerca'}</Text>
      <Text style={styles.body}>{race.lives ? 'Diez decisiones, incluyendo tus repasos.' : 'Cada error te muestra qué practicar. Vuelve a la carretera cuando quieras.'}</Text>
      <Text style={s.bigScore}>{race.score}<Text style={{ fontSize: 18 }}> pts</Text></Text><Text style={styles.body}>{correct} aciertos de {race.answers.length} encuentros · {race.lives} vidas</Text>
      <View style={s.divider} /><Text style={styles.eyebrow}>TU RECORRIDO</Text>
      {race.answers.map((a, i) => { const word = WORDS.find(w => w.id === a.wordId)!; return <View key={i} style={s.resultRow}><Text style={{ color: a.result === 'correct' ? '#087d65' : '#b85437', fontWeight: '800' }}>{a.result === 'correct' ? '✓' : '↻'}  {word.es}</Text><Text style={s.translation}>{word.en}{a.result === 'collision' ? ' · choque' : ''}</Text></View>; })}
      <Text style={s.saveText}>{saveState === 'saved' ? 'Récord y próximos repasos guardados en este dispositivo.' : saveState === 'saving' ? 'Guardando recorrido…' : 'No se pudo guardar el recorrido en este dispositivo.'}</Text>
      {saveState === 'error' && <Button secondary onPress={() => { setSaveState('saving'); saveRace(race).then(() => setSaveState('saved')).catch(() => setSaveState('error')); }}>Reintentar guardado</Button>}
      <Button onPress={restart}>Volver a correr  →</Button><Button secondary onPress={() => router.replace('/')}>Volver al inicio</Button>
    </View></ScrollView></View>;
  return <View style={s.game}>
    <Scene race={race} paused={paused || !ready} />
    <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
    <View pointerEvents="box-none" style={[s.hud, { paddingTop: insets.top + 15 }]}>
      <View style={s.hudRow}><View accessibilityLabel={`${race.lives} vidas`} style={s.lifePanel}><Text style={s.lifeLabel}>VIDAS</Text><View style={s.lifeBars}>{[0, 1, 2].map(i => <View key={i} style={[s.lifeBar, { backgroundColor: i < race.lives ? '#73e0c1' : '#385164' }]} />)}</View></View><View style={s.scorePill}><Text style={s.score}>{race.score}</Text><Text style={s.scoreLabel}>PUNTOS</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Pausar carrera" onPress={() => setPaused(true)} style={s.pause}><GameIcon name="pause" /></Pressable></View>
      <View style={s.progressTrack}><View style={[s.progressFill, { width: `${race.answers.length / TOTAL * 100}%` }]} /></View>
      <View style={s.progressLabels}><Text style={s.smallLabel}>COSTA SOLEADA</Text><Text style={s.smallLabel}>{Math.min(TOTAL, race.answers.length + (race.phase === 'approach' ? 1 : 0))} / {TOTAL}</Text></View>
      <View style={s.prompt}><Text style={styles.eyebrow}>¿CÓMO SE DICE EN INGLÉS?</Text><Text style={s.promptWord}>{race.encounter.word.es}</Text><Text style={s.promptHint}>{(race.phase === 'approach' ? race.answers : race.answers.slice(0, -1)).some(a => a.wordId === race.encounter.word.id) ? 'REPASO · Recuerda la traducción' : 'Elige el carril con la traducción'}</Text><View style={s.timerTrack}><View style={[s.timerFill, { width: `${race.phase === 'approach' ? (1 - race.elapsed / APPROACH_MS) * 100 : 0}%` }]} /></View></View>
    </View>
    {race.phase === 'feedback' && <View pointerEvents="none" accessibilityLiveRegion="polite" style={[s.feedback, { backgroundColor: result === 'correct' ? '#e4ffeaeF' : '#fff0e6f5' }]}><Text style={[s.feedbackTitle, { color: result === 'correct' ? '#08745a' : '#ac472e' }]}>{result === 'correct' ? '¡Buen camino!' : result === 'collision' ? '¡Cuidado! −1 vida' : 'Otra ruta. −1 vida'}</Text><Text style={s.feedbackDetail}>{race.encounter.word.es} = {race.encounter.word.en}</Text></View>}
    <View pointerEvents="none" style={s.combo}><View style={s.comboTrack}><View style={[s.comboFill, { width: `${Math.min(100, race.combo / 5 * 100)}%` }]} /></View><Text style={s.comboText}>{race.combo > 1 ? `${race.combo} ACIERTOS SEGUIDOS` : 'LEE · ELIGE · AVANZA'}</Text></View>
    <View style={[s.controls, { bottom: Math.max(17, insets.bottom + 8) }]}><Pressable accessibilityRole="button" accessibilityLabel="Mover a la izquierda" disabled={race.lane === 0} onPress={() => steer(-1)} style={({ pressed }) => [s.arrowButton, { opacity: race.lane === 0 ? .35 : pressed ? .65 : 1 }]}><GameIcon name="left" size={28} /></Pressable><Text style={s.controlHint}>Desliza para{ '\n'}cambiar de carril</Text><Pressable accessibilityRole="button" accessibilityLabel="Mover a la derecha" disabled={race.lane === 2} onPress={() => steer(1)} style={({ pressed }) => [s.arrowButton, { opacity: race.lane === 2 ? .35 : pressed ? .65 : 1 }]}><GameIcon name="right" size={28} /></Pressable></View>
    <Modal transparent visible={paused} animationType="fade" onRequestClose={() => setPaused(false)}><View style={s.backdrop}><View style={s.pauseCard}><Text style={styles.eyebrow}>UN RESPIRO</Text><Text style={styles.title}>La carretera espera.</Text><Text style={styles.body}>Tu carrera está en pausa. Continúa cuando estés listo.</Text><Button onPress={() => setPaused(false)}>Continuar carrera</Button><Button secondary onPress={() => router.replace('/')}>Salir al inicio</Button><Text style={s.saveText}>Al salir se descarta esta carrera en curso.</Text></View></View></Modal>
  </View>;
}
const s = StyleSheet.create({
  lifePanel: { backgroundColor: '#163747ed', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 5 }, lifeLabel: { color: '#b8d4df', fontSize: 8, letterSpacing: 1.5, fontWeight: '800' }, lifeBars: { flexDirection: 'row', gap: 4 }, lifeBar: { width: 19, height: 7, borderRadius: 2 }, comboTrack: { height: 8, width: '100%', borderRadius: 5, backgroundColor: '#173b4ed9', borderWidth: 1, borderColor: '#8bc5d3', overflow: 'hidden' }, comboFill: { height: '100%', backgroundColor: '#69d9be' },
  game: { flex: 1, backgroundColor: '#72cde1' }, hud: { paddingHorizontal: 22 }, hudRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, hearts: { flexDirection: 'row', backgroundColor: '#fff8e9dd', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }, heart: { fontSize: 25, marginHorizontal: 2 }, scorePill: { alignItems: 'center' }, score: { color: palette.ink, fontSize: 29, fontWeight: '900' }, scoreLabel: { fontSize: 8, color: palette.ink, letterSpacing: 2, fontWeight: '800' }, pause: { width: 44, height: 44, backgroundColor: '#fff8e9e8', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, pauseIcon: { color: palette.ink, fontSize: 24, fontWeight: '900' },
  progressTrack: { height: 5, backgroundColor: '#ffffff80', borderRadius: 8, overflow: 'hidden', marginTop: 18 }, progressFill: { height: '100%', backgroundColor: palette.teal }, progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }, smallLabel: { fontSize: 9, letterSpacing: 1.3, fontWeight: '800', color: palette.ink },
  prompt: { marginTop: 10, backgroundColor: '#fff8e9f5', borderRadius: 23, paddingTop: 10, alignItems: 'center', overflow: 'hidden', boxShadow: '0 6px 20px #163b4a18' }, promptWord: { color: palette.ink, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 2 }, promptHint: { color: palette.muted, fontSize: 11, marginTop: 4, marginBottom: 8 }, timerTrack: { height: 3, backgroundColor: '#e7e6d8', width: '100%' }, timerFill: { height: '100%', backgroundColor: palette.orange },
  choices: { position: 'absolute', top: '49%', left: 8, right: 8, flexDirection: 'row' }, choiceColumn: { flex: 1, alignItems: 'center' }, choice: { backgroundColor: palette.cream, borderRadius: 13, minWidth: '88%', paddingHorizontal: 7, paddingTop: 13, paddingBottom: 5, alignItems: 'center', boxShadow: '0 5px 0 #1a344244' }, choiceText: { color: palette.ink, fontWeight: '900', fontSize: 19, textAlign: 'center' }, choiceArrow: { color: palette.teal, fontSize: 20 }, blocked: { padding: 10 }, blockedText: { color: '#fff8e9', fontWeight: '900', fontSize: 10, textAlign: 'center', letterSpacing: 2 },
  feedback: { position: 'absolute', top: '47%', alignSelf: 'center', padding: 18, borderRadius: 20, alignItems: 'center', maxWidth: '94%' }, feedbackTitle: { fontWeight: '900', fontSize: 22 }, feedbackDetail: { color: palette.ink, marginTop: 6, fontSize: 17, fontWeight: '700' }, combo: { position: 'absolute', bottom: '14%', alignSelf: 'center', width: '78%', alignItems: 'center', gap: 7 }, comboText: { color: '#fff6df', fontSize: 9, fontWeight: '800', letterSpacing: 2.3 },
  controls: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, arrowButton: { width: 67, height: 54, backgroundColor: '#fff8e9f0', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, arrow: { color: palette.ink, fontSize: 30, fontWeight: '900' }, controlHint: { color: '#e8efeb', fontSize: 10, lineHeight: 16, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: '#102c3ccd', alignItems: 'center', justifyContent: 'center', padding: 24 }, pauseCard: { backgroundColor: palette.cream, padding: 28, borderRadius: 28, gap: 17, maxWidth: 420, width: '100%' }, finish: { flex: 1 }, resultsContent: { paddingHorizontal: 22, flexGrow: 1, justifyContent: 'center' }, resultCard: { padding: 25, backgroundColor: '#fff8e9f8', borderRadius: 28, gap: 13 }, bigScore: { fontSize: 56, fontWeight: '900', letterSpacing: -2, color: palette.teal }, divider: { height: 1, backgroundColor: '#dbe0d4', marginVertical: 3 }, resultRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, translation: { color: palette.teal, fontSize: 13, fontWeight: '600' }, saveText: { color: palette.muted, fontSize: 11, lineHeight: 16 },
});


