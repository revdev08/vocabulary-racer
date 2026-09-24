import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { developmentJourney, journeyUnits, levelState, readJourneyPage, type JourneyLevel, type JourneyUnit } from '../../game/data/journey';
import { levels, vocabulary } from '../../game/data/vocabulary';
import { dueWordIndices, unlockedLevelIndex, type LevelRecords } from '../../game/gameplay/curriculum';
import { readProgress, type Progress } from '../../game/storage';
import { LevelRow } from './LevelRow';
import { UnitHeader } from './UnitHeader';
import { SelectedLevelPanel } from './SelectedLevelPanel';
import { RoadIcon } from './LevelTicket';
import { journeyAssets, journeyPalette as c } from './theme';

const EMPTY_RECORDS: LevelRecords = {};

export default function JourneyScreen() {
  const { journeyStress } = useLocalSearchParams<{ journeyStress?: string }>();
  const stress = __DEV__ && journeyStress === '1';
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<Progress>();
  const [error, setError] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>();
  const [unitCount, setUnitCount] = useState(2);
  const [startUnit, setStartUnit] = useState(0);
  const [modal, setModal] = useState<'help' | 'words'>('help');
  const [modalVisible, setModalVisible] = useState(false);
  const [now, setNow] = useState(Date.now);
  const list = useRef<SectionList<JourneyLevel, JourneyUnit>>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ sectionIndex: number; itemIndex: number; animated: boolean; viewOffset: number } | null>(null);
  const failures = useRef(0);
  const records = progress?.levels ?? EMPTY_RECORDS;
  const currentLevelId = levels[unlockedLevelIndex(records)].id;
  const catalog = useMemo(() => stress ? developmentJourney() : journeyUnits, [stress]);
  const page = useMemo(() => readJourneyPage(startUnit, unitCount), [startUnit, unitCount]);
  const units = useMemo(() => stress ? catalog.slice(startUnit, startUnit + unitCount) : page.units, [stress, catalog, startUnit, unitCount, page]);
  const entries = useMemo(() => catalog.flatMap(unit => unit.data), [catalog]);
  const hasMore = startUnit + unitCount < catalog.length;
  const selected = entries.find(level => level.id === selectedLevelId) ?? entries.find(level => level.id === currentLevelId) ?? entries[0];
  const source = levels.find(level => level.id === selected.sourceId)!;
  const state = levelState(selected.sourceId, records);
  const due = useMemo(() => dueWordIndices(progress?.reviews ?? {}, now), [progress, now]);
  const completedCount = levels.filter(level => records[level.id]?.completed).length;
  const extraData = useMemo(() => ({ records, selectedId: selected.id, currentLevelId }), [records, selected.id, currentLevelId]);
  const jump = useCallback((sectionIndex: number, itemIndex = 0) => {
    failures.current = 0;
    pending.current = { sectionIndex, itemIndex, animated: false, viewOffset: 115 };
    list.current?.scrollToLocation(pending.current);
  }, []);
  const cancelJump = useCallback(() => {
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
  }, []);
  // Re-anchor large jumps near their destination. Variable-height tickets do not
  // need a guessed getItemLayout or hundreds of measurements of earlier units.
  const goToUnit = useCallback((unit: number, item = 0) => {
    cancelJump();
    const start = Math.max(0, unit - 1);
    setStartUnit(start); setUnitCount(2);
    timer.current = setTimeout(() => jump(unit - start, item), 250);
  }, [cancelJump, jump]);
  useFocusEffect(useCallback(() => {
    let active = true;
    readProgress().then(value => {
      if (!active) return;
      setProgress(value); setError(false); setNow(Date.now());
      const current = levels[unlockedLevelIndex(value.levels)].id;
      const unit = journeyUnits.findIndex(item => item.data.some(level => level.id === current));
      setSelectedLevelId(current);
      if (unit > 0 && !stress) goToUnit(unit);
    }).catch(() => { if (active) setError(true); });
    const clock = setInterval(() => setNow(Date.now()), 60_000);
    return () => { active = false; clearInterval(clock); cancelJump(); };
  }, [goToUnit, cancelJump, stress]));
  useEffect(() => cancelJump, [cancelJump]);

  const returnToCurrent = () => {
    if (stress) {
      setSelectedLevelId(entries.find(level => level.sourceId === currentLevelId)?.id);
      goToUnit(0); return;
    }
    const sectionIndex = catalog.findIndex(unit => unit.data.some(level => level.id === currentLevelId));
    if (sectionIndex >= 0) {
      setSelectedLevelId(currentLevelId);
      goToUnit(sectionIndex, catalog[sectionIndex].data.findIndex(level => level.id === currentLevelId));
    }
  };
  const loadMore = useCallback(() => {
    if (hasMore) setUnitCount(count => Math.min(count + 1, catalog.length - startUnit));
  }, [hasMore, catalog.length, startUnit]);
  // Keep the content mounted through the fade-out instead of switching it to the guide.
  const openModal = (content: 'help' | 'words') => { setModal(content); setModalVisible(true); };

  return <View style={s.root}>
    <Image source={journeyAssets.background} resizeMode="cover" accessible={false} style={s.background}/>
    <View style={[s.top, { paddingTop: insets.top + 10 }]}>
      <View style={s.brandRow}>
        <Text style={s.brand}>vocab.<Text style={{ color: c.green }}>racer</Text></Text>
        <View style={s.record}><Text style={s.recordLabel}>Récord</Text><Text style={s.recordNumber}>{progress?.best ?? 0}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Guía de viaje" onPress={() => openModal('help')} style={s.help}><Text style={s.helpText}>?</Text></Pressable>
      </View>
      <View style={s.routeBar}>
        <View style={s.routeLabel}><RoadIcon size={20} color={c.green}/><Text style={s.routeText}>{completedCount} niveles completados</Text></View>
        <JourneyAction title="Mi nivel ↓" onPress={returnToCurrent}/>
      </View>
      {!!due.length && !stress && <JourneyAction title={`Repasar ${due.length} palabras pendientes →`} onPress={() => router.push({ pathname: '/race', params: { mode: 'review', level: currentLevelId } })}/>}
      {error && <Text accessibilityRole="alert" style={s.error}>No pudimos cargar el progreso. Abre de nuevo esta pantalla para reintentar.</Text>}
      {!progress && !error && <ActivityIndicator accessibilityLabel="Cargando tu viaje" color={c.green}/>}
      {stress && <View><Text style={s.error}>DESARROLLO · 1.000 niveles · no guarda progreso</Text><JourneyAction title="Probar salto al nivel 981" onPress={() => goToUnit(49)}/></View>}
    </View>
    <SectionList
      key={startUnit} testID="journey-list" showsVerticalScrollIndicator={false} ref={list} sections={units}
      keyExtractor={item => item.id} extraData={extraData} stickySectionHeadersEnabled={false}
      removeClippedSubviews={false} initialNumToRender={6} maxToRenderPerBatch={8} windowSize={7}
      contentContainerStyle={s.listContent}
      ListHeaderComponent={startUnit > 0 ? <JourneyAction title="Ver unidades anteriores ↑" onPress={() => { cancelJump(); setStartUnit(start => Math.max(0, start - 2)); setUnitCount(2); }}/> : null}
      renderSectionHeader={({ section }) => <UnitHeader unit={section} completed={section.data.filter(level => records[level.sourceId]?.completed).length}/>}
      renderItem={({ item, index, section }) => <LevelRow level={item} state={levelState(item.sourceId, records)} stars={records[item.sourceId]?.bestStars ?? (records[item.sourceId]?.completed ? 1 : 0)} selected={selected.id === item.id} current={item.id === currentLevelId} first={index === 0} last={index === section.data.length - 1} onPress={() => setSelectedLevelId(item.id)}/>}
      onEndReached={loadMore} onEndReachedThreshold={0.5} onScrollBeginDrag={cancelJump}
      onScrollToIndexFailed={info => {
        if (!pending.current || failures.current++ >= 12) { cancelJump(); return; }
        list.current?.getScrollResponder()?.scrollTo({ y: info.averageItemLength * info.index, animated: false });
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { if (pending.current) list.current?.scrollToLocation(pending.current); }, 180);
      }}
      ListFooterComponent={<View style={s.footer}>
        {hasMore
          ? <JourneyAction title="Ver siguiente unidad →" onPress={loadMore}/>
          : <><View style={s.footerRule}/><RoadIcon size={26} color="#86958B"/><Text style={s.footerTitle}>El viaje continúa</Text><Text style={s.footerCopy}>Más destinos llegarán a tu ruta.{ '\n' }Mientras tanto, mejora tus estrellas.</Text></>}
      </View>}/>
    <SelectedLevelPanel level={selected} state={state} target={source.indices.length} bottom={insets.bottom} disabled={!progress || error || stress}
      requirement={`Completa «${levels[Math.max(0, levels.indexOf(source) - 1)].title}»`}
      onWords={() => openModal('words')}
      onPlay={() => router.push({ pathname: '/race', params: { level: selected.sourceId } })}/>
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
      <View style={[s.scrim, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={s.modal}>
          <Text accessibilityRole="header" style={s.modalTitle}>{modal === 'words' ? source.title : 'Guía de viaje'}</Text>
          <ScrollView>
            {modal === 'words' ? source.indices.map((index, i) => <View key={vocabulary[index].id} style={s.wordRow}><Text style={s.wordNumber}>{String(i + 1).padStart(2, '0')}</Text><Text style={s.spanish}>{vocabulary[index].spanish}</Text><Text style={s.english}>{vocabulary[index].correct}</Text></View>)
              : <Text style={s.helpCopy}>Elige la traducción y esquiva los obstáculos. Cada carrera empieza con 3 vidas.{ '\n\n' }Para aprobar, termina la carrera con al menos 8 de las 10 preguntas base correctas al primer intento. Obtienes 1 estrella con 8, 2 con 9 y 3 con 10.{ '\n\n' }Los errores vuelven después de otras preguntas, con hasta 3 repasos extra. Los pendientes reaparecen en futuras sesiones. Repetir conserva tus mejores resultados.</Text>}
          </ScrollView>
          <JourneyAction title="Cerrar" onPress={() => setModalVisible(false)}/>
        </View>
      </View>
    </Modal>
  </View>;
}

function JourneyAction({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.action, pressed && { opacity: 0.6 }]}><Text style={s.actionText}>{title}</Text></Pressable>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.paper },
  background: { position: 'absolute', width: '100%', height: '100%', opacity: 0.42, pointerEvents: 'none' },
  top: { paddingHorizontal: 20, backgroundColor: '#FFFAEBB8', borderBottomWidth: 1, borderBottomColor: '#C9BA9638' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brand: { flex: 1, fontSize: 24, letterSpacing: -1, color: c.ink, fontWeight: '900' },
  record: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recordLabel: { fontSize: 12, fontWeight: '700', color: '#536657' },
  recordNumber: { fontSize: 16, fontWeight: '900', color: c.ink },
  help: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  helpText: { width: 26, height: 26, borderRadius: 14, borderWidth: 1.5, borderColor: '#9AA78F', color: '#507561', textAlign: 'center', lineHeight: 24, fontSize: 16, fontWeight: '800' },
  routeBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeText: { fontSize: 13, fontWeight: '600', color: '#456452' },
  action: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 7, justifyContent: 'center' },
  actionText: { color: c.green, fontSize: 14, fontWeight: '800' },
  error: { color: '#92432C', fontSize: 12, paddingVertical: 4 },
  listContent: { paddingBottom: 5 },
  footer: { alignItems: 'center', paddingVertical: 25, gap: 7, paddingHorizontal: 25 },
  footerRule: { height: 27, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: '#ACB6A5', marginBottom: 4 },
  footerTitle: { fontSize: 16, color: '#526E5E', fontWeight: '800' },
  footerCopy: { fontSize: 14, lineHeight: 22, color: '#5A705E', textAlign: 'center' },
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#142E43AA', paddingHorizontal: 20 },
  modal: { backgroundColor: '#FFF8E7', borderRadius: 20, padding: 22, width: '100%', maxWidth: 460, maxHeight: '90%', boxShadow: '0 12px 40px #102B3C40' },
  modalTitle: { color: c.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.7, marginBottom: 16 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#E9DFC7' },
  wordNumber: { color: '#60725D', fontSize: 13, fontWeight: '800', width: 24 },
  spanish: { flex: 1, color: c.ink, fontSize: 15, fontWeight: '600' },
  english: { flex: 1, color: c.green, fontSize: 15, textAlign: 'right' },
  helpCopy: { color: c.ink, fontSize: 16, lineHeight: 25 },
});
