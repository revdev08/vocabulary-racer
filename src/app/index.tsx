import { dueWordIndices, unlockedLevelIndex } from '../game/gameplay/curriculum';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, styles } from '../components/ui';
import { LevelRoadmap, learningStages, routeColors as colors, routeType } from '../components/learning/LevelRoadmap';
import { GameIcon } from '../game/ui/GameIcon';
import { Progress, readProgress } from '../game/storage';
import { levels, vocabulary } from '../game/data/vocabulary';
export default function Home() {
  const [compact, setCompact] = useState(false);
  const [help, setHelp] = useState(false);
  const [vocab, setVocab] = useState(false);
  const [progress, setProgress] = useState<Progress>();
  const [storageError, setStorageError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<string | null>(null);
  const unlocked = unlockedLevelIndex(progress?.levels ?? {});
  const levelIndex = Math.max(0, selected ? levels.findIndex(level => level.id === selected) : unlocked);
  const level = levels[levelIndex];
  const due = dueWordIndices(progress?.reviews ?? {}, now);
  const studied = Object.keys(progress?.reviews ?? {}).filter(id => vocabulary.some(word => word.id === id)).length;
  const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { let active = true; setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 60_000); readProgress().then(p => { if (active) { setProgress(p); setSelected(null); setStorageError(false); } }).catch(() => { if (active) setStorageError(true); }); return () => { active = false; clearInterval(timer); }; }, []));
  const stageIndex = learningStages.findIndex(stage => (stage.ids as readonly string[]).includes(level.id));
  const stage = learningStages[stageIndex];
  const completed = stage.ids.filter(id => progress?.levels[id]?.completed).length;
  const locked = levelIndex > unlocked;
  const done = !!progress?.levels[level.id]?.completed;
  return <View style={s.page} onLayout={({ nativeEvent }) => setCompact(nativeEvent.layout.height < 700)}>
    <View style={[s.top, { paddingTop: insets.top + 14 }]}>
      <Text style={s.brand}>vocab<Text style={{ color: colors.teal }}>.</Text><Text style={s.racer}>racer</Text></Text>
      <Pressable accessibilityRole="button" onPress={() => setHelp(true)} style={s.help}><Text style={s.helpText}>Cómo jugar</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={[s.intro, compact && { paddingTop: 8, paddingBottom: 4 }]}>
        <Text style={s.eyebrow}>ESPAÑOL → INGLÉS</Text>
        {!compact && <Text style={s.pageTitle}>Tu próxima parada.</Text>}
        <View style={s.progressRow}><Text style={s.muted}>{studied} de {vocabulary.length} palabras practicadas</Text><Text style={s.record}>{progress?.best ?? 0} pts</Text></View>
        {!!due.length && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/race', params: { mode: 'review', level: levels[unlocked].id } })} style={s.quickReview}>
          <Text style={s.quickReviewText}>{due.length} palabras para repasar</Text><Text style={s.quickReviewText}>Repasar →</Text>
        </Pressable>}
      </View>
      <View style={s.tabs} accessibilityRole="tablist">
        {learningStages.map((item, index) => <Pressable key={item.title} accessibilityRole="tab" accessibilityState={{ selected: stageIndex === index }}
          accessibilityLabel={`Etapa ${index + 1}: ${item.title}`} onPress={() => {
            const current = levels[unlocked].id;
            setSelected((item.ids as readonly string[]).includes(current) ? current : item.ids[0]);
          }} style={[s.tab, stageIndex === index && s.activeTab]}>
          <Text style={[s.tabNumber, stageIndex === index && { color: colors.teal }]}>0{index + 1}</Text>
          <Text style={[s.tabText, stageIndex === index && { color: colors.ink }]}>{item.short}</Text>
        </Pressable>)}
      </View>
      <View style={s.stageHeading}>
        <View style={{ flex: 1, gap: 5 }}><Text style={s.eyebrow}>ETAPA 0{stageIndex + 1} · {stage.difficulty.toUpperCase()}</Text>
          <Text style={[s.stageTitle, compact && { fontSize: 20 }]}>{stage.title}</Text>{!compact && <Text style={s.muted}>{stage.description}</Text>}</View>
        <View accessible accessibilityLabel={`${completed} de 4 niveles completados`} style={s.stageCount}><Text style={s.stageCountNumber}>{completed}<Text style={s.outOf}>/4</Text></Text><Text style={s.stageCountLabel}>NIVELES</Text></View>
      </View>
      {!compact && <View style={s.legend}><View style={[s.legendDot, { backgroundColor: colors.teal }]} /><Text style={s.legendText}>Completado</Text><View style={[s.legendDot, { backgroundColor: colors.ink }]} /><Text style={s.legendText}>Disponible</Text><View style={[s.legendDot, { backgroundColor: '#CAD8DF' }]} /><Text style={s.legendText}>Por descubrir</Text></View>}
      <LevelRoadmap stage={stageIndex} selected={level.id} unlocked={unlocked} records={progress?.levels ?? {}} onSelect={setSelected} />
      <View style={s.stageEnd}><GameIcon name="flag" size={20} color={colors.teal} /><Text style={s.stageEndText}>4 niveles · 40 palabras · Una etapa más cerca</Text></View>
      <Pressable accessibilityRole="button" disabled={!due.length} onPress={() => router.push({ pathname: '/race', params: { mode: 'review', level: levels[unlocked].id } })}
        style={({ pressed }) => [s.review, pressed && { opacity: .7 }]}>
        <View style={{ flex: 1, gap: 5 }}><Text style={s.reviewTitle}>{due.length ? 'Una vuelta de repaso' : 'Repasos al día'}</Text><Text style={s.muted}>{due.length ? `${due.length} palabras listas para volver a practicar` : 'Aquí aparecerán tus próximos repasos.'}</Text></View>
        <Text style={s.reviewArrow}>{due.length ? '→' : '—'}</Text>
      </Pressable>
      {storageError && <Text style={s.notice}>No se pudo leer tu progreso local. Vuelve a abrir el inicio para intentarlo de nuevo.</Text>}
    </ScrollView>
    <View style={[s.dock, { paddingBottom: Math.max(14, insets.bottom) }]}>
      <View style={s.dockHeading}><View style={{ flex: 1, gap: 3 }}><Text style={s.eyebrow}>NIVEL {String(levelIndex + 1).padStart(2, '0')} · {locked ? 'POR DESBLOQUEAR' : done ? 'COMPLETADO' : 'LISTO PARA SALIR'}</Text>
        <Text style={s.selectedTitle}>{level.title}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver palabras de ${level.title}`} onPress={() => setVocab(true)} style={s.wordsButton}><Text style={s.wordsText}>Palabras</Text></Pressable>
      </View>
      <Text style={s.dockNote}>{locked ? `Supera el nivel ${levelIndex} para abrir este tramo.` : '10 palabras · 3 vidas · Supera el nivel con 8 aciertos'}</Text>
      <Pressable accessibilityRole="button" disabled={locked} accessibilityState={{ disabled: locked }}
        onPress={() => router.push({ pathname: '/race', params: { level: level.id } })}
        style={({ pressed }) => [s.play, locked && s.lockedPlay, pressed && { opacity: .85 }]}>
        <Text style={[s.playText, locked && { color: '#718692' }]}>{locked ? 'Tramo bloqueado' : done ? 'Volver a recorrer' : `Jugar nivel ${levelIndex + 1}`}</Text>
        {!locked && <GameIcon name="play" size={18} color="#FFFFFF" />}
      </Pressable>
    </View>
    <Modal transparent visible={help || vocab} animationType="fade" onRequestClose={() => { setHelp(false); setVocab(false); }}><View style={s.backdrop}><View style={s.modal}>
      <Text style={styles.eyebrow}>{vocab ? 'ESPAÑOL → INGLÉS' : 'AL VOLANTE'}</Text><Text style={styles.title}>{vocab ? 'Palabras de este nivel' : 'Elige tu camino'}</Text>
      <ScrollView style={{ maxHeight: 350 }} contentContainerStyle={{ gap: 15 }}>
        {vocab ? level.indices.map(index => vocabulary[index]).map(w => <View key={w.id} style={s.word}><Text style={s.stat}>{w.spanish}</Text><Text style={s.translation}>{w.correct}{progress?.practice.includes(w.id) ? ' · practicar' : ''}</Text></View>) : <>
          <Text style={styles.body}>Desliza hacia los lados o usa las flechas para cambiar de carril. En computador también puedes usar ← y →.</Text>
          <Text style={styles.body}>Alterna tramos de tráfico con preguntas. Cuando aparece una palabra, la velocidad baja: atraviesa una de las tres traducciones.</Text>
          <Text style={styles.body}>Verde y ✓: acierto. Rojo y ✕: pierdes una vida, pero sigues avanzando. Chocar también cuesta una vida.</Text>
          <Text style={styles.body}>Recoge monedas y esquiva carros y barreras. La carrera termina al completar las 10 palabras y hasta 3 repasos, o al perder las tres vidas. Un error vuelve después de 3 preguntas diferentes si queda espacio; los errores del final se guardan para el siguiente repaso.</Text>
          <Text style={styles.body}>Los aciertos se repasan después de 1, 3, 7 y 14 días. Una palabra fallada vuelve a la fase de aprendizaje; recuperarla en la carrera programa un repaso en 10 minutos. Las monedas y los choques no cambian esta memoria.</Text>
          <Text style={styles.body}>Después de elegir, escucharás siempre la respuesta correcta en inglés. Puedes desactivar la voz o escuchar de nuevo desde la pausa.</Text>
        </>}
      </ScrollView><Button onPress={() => { setHelp(false); setVocab(false); }}>Entendido</Button>
    </View></View></Modal>
  </View>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  top: { paddingHorizontal: 22, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white },
  brand: { fontSize: 23, fontWeight: '900', letterSpacing: -1.2, color: colors.ink }, racer: { fontStyle: 'italic' },
  help: { paddingVertical: 10, paddingLeft: 12, minHeight: 44, justifyContent: 'center' }, helpText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  content: { paddingBottom: 24 }, intro: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, gap: 8, backgroundColor: colors.white },
  eyebrow: { fontFamily: routeType.utility, fontSize: 9, fontWeight: '600', letterSpacing: 1, color: colors.teal },
  pageTitle: { color: colors.ink, fontSize: 28, fontWeight: '900', letterSpacing: -1.3 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }, muted: { fontSize: 12, lineHeight: 18, color: colors.muted }, record: { fontSize: 12, fontWeight: '700', color: colors.ink, fontFamily: routeType.utility },
  quickReview: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#E8EEF0', marginTop: 4 },
  quickReviewText: { fontSize: 12, fontWeight: '600', color: colors.teal },
  tabs: { flexDirection: 'row', paddingHorizontal: 24, backgroundColor: colors.white, gap: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.teal }, tabNumber: { fontFamily: routeType.utility, color: '#92A6B0', fontSize: 11, fontWeight: '600' }, tabText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  stageHeading: { paddingHorizontal: 24, paddingTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageTitle: { fontSize: 24, letterSpacing: -.8, fontWeight: '800', color: colors.ink },
  stageCount: { alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#D4DFE3', paddingLeft: 14, gap: 4 },
  stageCountNumber: { fontSize: 23, color: colors.ink, fontFamily: routeType.utility, fontWeight: '700' }, outOf: { fontSize: 13, color: colors.muted }, stageCountLabel: { color: colors.muted, fontSize: 7, letterSpacing: 1 },
  legend: { paddingHorizontal: 24, paddingTop: 18, flexDirection: 'row', alignItems: 'center', gap: 5 }, legendDot: { width: 6, height: 6, borderRadius: 3 }, legendText: { fontSize: 9, color: colors.muted, marginRight: 7 },
  stageEnd: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingVertical: 14 }, stageEndText: { fontSize: 10, color: colors.muted },
  review: { marginHorizontal: 24, marginTop: 10, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D4DFE3', flexDirection: 'row', gap: 12, alignItems: 'center' },
  reviewTitle: { fontSize: 17, fontWeight: '800', color: colors.ink }, reviewArrow: { fontSize: 24, color: colors.teal },
  dock: { paddingHorizontal: 22, paddingTop: 14, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#D5E0E5', gap: 9 },
  dockHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, selectedTitle: { fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -.4 },
  wordsButton: { minHeight: 44, paddingLeft: 12, justifyContent: 'center' }, wordsText: { fontSize: 12, color: colors.teal, fontWeight: '700' }, dockNote: { fontSize: 11, color: colors.muted },
  play: { minHeight: 50, backgroundColor: colors.ink, borderRadius: 13, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playText: { color: colors.white, fontSize: 16, fontWeight: '700' }, lockedPlay: { backgroundColor: '#E7EDF0' },
  notice: { fontSize: 12, lineHeight: 18, color: '#9C463C', padding: 24 },
  backdrop: { flex: 1, backgroundColor: '#0b263bcc', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modal: { backgroundColor: colors.white, borderRadius: 24, padding: 24, gap: 18, width: '100%', maxWidth: 430, maxHeight: '90%' },
  word: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 12 },
  stat: { color: colors.ink, fontSize: 13, fontWeight: '700', flex: 1 }, translation: { fontSize: 14, color: colors.teal, fontWeight: '600', flex: 1, textAlign: 'right' },
});
