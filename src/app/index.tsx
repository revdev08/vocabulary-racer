import { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scene } from '../components/Scene';
import { Button, Chip, palette, styles } from '../components/ui';
import { Progress, readProgress } from '../game/storage';
import { WORDS } from '../game/engine';
export default function Home() {
  const [help, setHelp] = useState(false);
  const [vocab, setVocab] = useState(false);
  const [progress, setProgress] = useState<Progress>();
  const [storageError, setStorageError] = useState(false);
  const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => { let active = true; readProgress().then(p => { if (active) { setProgress(p); setStorageError(false); } }).catch(() => { if (active) setStorageError(true); }); return () => { active = false; }; }, []));
  return <View style={s.page}>
    <View style={s.hero}><Scene paused /><View style={[s.top, { paddingTop: insets.top + 18 }]}><Chip>ESPAÑOL → INGLÉS</Chip><Text style={s.edition}>PRIMERA RUTA</Text></View>
      <View style={s.brand}><Text style={s.wordmark}>vocab<Text style={{ color: palette.orange }}>.</Text>{'\n'}racer</Text><Text style={s.tagline}>Un nuevo camino. Diez nuevas palabras.</Text></View>
      <View style={s.routeTag}><Chip>↗  COSTA SOLEADA</Chip></View>
    </View>
    <ScrollView style={s.sheet} contentContainerStyle={{ padding: 25, gap: 16, paddingBottom: Math.max(20, insets.bottom) }}>
      <View style={s.heading}><View><Text style={styles.eyebrow}>TU PRIMERA CARRERA</Text><Text style={[styles.title, { marginTop: 5 }]}>Aprende en el camino.</Text></View></View>
      <View style={s.stats}><Text style={s.stat}>10 palabras</Text><Text style={s.dot}>•</Text><Text style={s.stat}>3 vidas</Text><Text style={s.dot}>•</Text><Text style={s.stat}>~90 segundos</Text></View>
      <Button onPress={() => router.push('/race')}>Comenzar carrera  →</Button>
      <View style={s.links}><Text accessibilityRole="button" onPress={() => setHelp(true)} style={s.link}>Cómo jugar</Text><Text accessibilityRole="button" onPress={() => setVocab(true)} style={s.link}>Ver las palabras</Text></View>
      <View style={s.record}><Text style={styles.body}>Tu mejor recorrido</Text><Text style={s.recordNumber}>{progress?.best ?? 0} <Text style={s.stat}>pts</Text></Text></View>
      {storageError && <Text style={s.notice}>No se pudo leer el progreso local. Puedes jugar; el guardado podría no estar disponible.</Text>}
    </ScrollView>
    <Modal transparent visible={help || vocab} animationType="fade" onRequestClose={() => { setHelp(false); setVocab(false); }}><View style={s.backdrop}><View style={s.modal}>
      <Text style={styles.eyebrow}>{vocab ? 'ESPAÑOL → INGLÉS' : 'AL VOLANTE'}</Text><Text style={styles.title}>{vocab ? 'Tu equipaje de palabras' : 'Elige tu camino'}</Text>
      <ScrollView style={{ maxHeight: 350 }} contentContainerStyle={{ gap: 15 }}>
        {vocab ? WORDS.map(w => <View key={w.id} style={s.word}><Text style={s.stat}>{w.es}</Text><Text style={s.translation}>{w.en}{progress?.practice.includes(w.id) ? ' · practicar' : ''}</Text></View>) : <>
          <Text style={styles.body}>Desliza hacia los lados o usa las flechas para cambiar de carril. En computador también puedes usar ← y →.</Text>
          <Text style={styles.body}>Lee la palabra en español. Un obstáculo bloquea un carril; elige la traducción correcta en uno de los otros dos.</Text>
          <Text style={styles.body}>Verde y ✓: acierto. Rojo y ✕: pierdes una vida, pero sigues avanzando. Chocar también cuesta una vida.</Text>
          <Text style={styles.body}>Tienes tiempo para cambiar dos carriles. Completa diez encuentros; puedes pausar cuando quieras.</Text>
        </>}
      </ScrollView><Button onPress={() => { setHelp(false); setVocab(false); }}>Entendido</Button>
    </View></View></Modal>
  </View>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.cream }, hero: { flex: 1, minHeight: 290, overflow: 'hidden' }, top: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, alignItems: 'center' }, edition: { fontSize: 9, letterSpacing: 1.5, fontWeight: '900', color: palette.ink },
  brand: { paddingHorizontal: 26, marginTop: 18 }, wordmark: { color: palette.ink, fontSize: 64, lineHeight: 57, fontWeight: '900', letterSpacing: -4 }, tagline: { fontSize: 12, color: palette.ink, marginTop: 12, fontWeight: '600' },
  routeTag: { position: 'absolute', bottom: 18, left: 22 }, sheet: { flexGrow: 0, maxHeight: '53%', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -9, backgroundColor: palette.cream }, heading: { flexDirection: 'row', justifyContent: 'space-between' },
  stats: { flexDirection: 'row', gap: 10, alignItems: 'center' }, stat: { color: palette.ink, fontSize: 13, fontWeight: '700' }, dot: { color: '#a8b6af' }, links: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 2 }, link: { color: palette.teal, fontWeight: '700', padding: 8, fontSize: 13 },
  record: { borderTopWidth: 1, borderColor: '#dedfce', paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, recordNumber: { fontSize: 21, color: palette.ink, fontWeight: '900' }, notice: { fontSize: 12, color: '#9c463c' },
  backdrop: { flex: 1, backgroundColor: '#0b263bcc', alignItems: 'center', justifyContent: 'center', padding: 22 }, modal: { backgroundColor: palette.cream, borderRadius: 28, padding: 25, gap: 20, width: '100%', maxWidth: 430, maxHeight: '90%' }, word: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }, translation: { fontSize: 14, color: palette.teal, fontWeight: '600' },
});
