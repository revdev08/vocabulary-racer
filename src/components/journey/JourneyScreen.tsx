import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { developmentJourney, journeyUnits, levelState, readJourneyPage, type JourneyLevel, type JourneyUnit } from '../../game/data/journey';
import { levels, vocabulary } from '../../game/data/vocabulary';
import { dueWordIndices, unlockedLevelIndex } from '../../game/gameplay/curriculum';
import { readProgress, type Progress } from '../../game/storage';
import { LevelRow } from './LevelRow';
import { UnitHeader } from './UnitHeader';
import { SelectedLevelPanel } from './SelectedLevelPanel';
import { green, ink, paper } from './LevelTicket';

export default function JourneyScreen() {
  const { journeyStress } = useLocalSearchParams<{ journeyStress?: string }>();
  const stress = __DEV__ && journeyStress === '1';
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<Progress>();
  const [error, setError] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>();
  const [unitCount, setUnitCount] = useState(2);
  const [modal, setModal] = useState<'help' | 'words' | null>(null);
  const [now, setNow] = useState(Date.now);
  const list = useRef<SectionList<JourneyLevel, JourneyUnit>>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ sectionIndex: number; itemIndex: number; animated: boolean } | null>(null);
  const failures = useRef(0);
  const records = progress?.levels ?? {};
  const currentLevelId = levels[unlockedLevelIndex(records)].id;
  const units = useMemo(() => stress ? developmentJourney() : readJourneyPage(0, unitCount).units, [stress, unitCount]);
  const selected = units.flatMap(unit => unit.data).find(level => level.id === selectedLevelId) ?? units.flatMap(unit => unit.data).find(level => level.id === currentLevelId) ?? units[0].data[0];
  const source = levels.find(level => level.id === selected.sourceId)!;
  const state = levelState(selected.sourceId, records);
  const due = dueWordIndices(progress?.reviews ?? {}, now);
  const jump = useCallback((sectionIndex: number, itemIndex = 0) => {
    failures.current = 0; pending.current = { sectionIndex, itemIndex, animated: false };
    list.current?.scrollToLocation(pending.current);
  }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    readProgress().then(value => {
      if (!active) return;
      setProgress(value); setError(false); setNow(Date.now());
      const current = levels[unlockedLevelIndex(value.levels)].id;
      const unit = journeyUnits.findIndex(item => item.data.some(level => level.id === current));
      setUnitCount(count => Math.max(count, unit + 1));
      timer.current = setTimeout(() => jump(unit), 250);
    }).catch(() => { if (active) setError(true); });
    const clock = setInterval(() => setNow(Date.now()), 60_000);
    return () => { active = false; clearInterval(clock); if (timer.current) clearTimeout(timer.current); };
  }, [jump]));
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const returnToCurrent = () => {
    if (stress) { setSelectedLevelId(units[0].data.find(level => level.sourceId === currentLevelId)?.id); jump(0); return; }
    const sectionIndex = units.findIndex(unit => unit.data.some(level => level.id === currentLevelId));
    if (sectionIndex >= 0) { setSelectedLevelId(currentLevelId); jump(sectionIndex, units[sectionIndex].data.findIndex(level => level.id === currentLevelId)); }
  };

  return <View style={{ flex: 1, backgroundColor: paper }}>
    <Image source={require('../../../assets/background-home.jpg')} resizeMode="cover" accessible={false} style={{ position: 'absolute', width: '100%', height: '100%' }}/>
    <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}><Text style={{ fontSize: 24, color: ink, fontWeight: '900' }}>vocab<Text style={{ color: green }}>.racer</Text></Text><Text style={{ color: ink, fontSize: 12, fontWeight: '700' }}>RÉCORD {progress?.best ?? 0} pts</Text></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}><JourneyAction title="Volver a mi nivel" onPress={returnToCurrent}/><JourneyAction title="Guía de viaje" onPress={() => setModal('help')}/></View>
      {!!due.length && !stress && <JourneyAction title={`Repasar ${due.length} palabras pendientes →`} onPress={() => router.push({ pathname: '/race', params: { mode: 'review', level: currentLevelId } })}/>}
      {error && <Text accessibilityRole="alert" style={{ color: '#92432C' }}>No pudimos cargar el progreso. Abre de nuevo esta pantalla para reintentar.</Text>}
      {stress && <View><Text style={{ color: '#92432C' }}>DESARROLLO · 1.000 niveles · no guarda progreso</Text><JourneyAction title="Probar salto al nivel 981" onPress={() => jump(49)}/></View>}
    </View>
    <SectionList showsVerticalScrollIndicator={false} ref={list} sections={units} keyExtractor={item => item.id} extraData={{ records, selectedLevelId, currentLevelId }} stickySectionHeadersEnabled={false} removeClippedSubviews={false} initialNumToRender={8} maxToRenderPerBatch={stress ? 48 : 8} windowSize={7}
      renderSectionHeader={({ section }) => <UnitHeader unit={section} completed={section.data.filter(level => records[level.sourceId]?.completed).length}/>}
      renderItem={({ item, index, section }) => <LevelRow level={item} state={levelState(item.sourceId, records)} stars={records[item.sourceId]?.bestStars ?? (records[item.sourceId]?.completed ? 1 : 0)} selected={selected.id === item.id} current={item.id === currentLevelId} first={index === 0} last={index === section.data.length - 1} onPress={() => setSelectedLevelId(item.id)}/>}
      onScrollToIndexFailed={info => {
        if (!pending.current || failures.current++ >= (stress ? 160 : 12)) { pending.current = null; return; }
        list.current?.getScrollResponder()?.scrollTo({ y: info.averageItemLength * info.index, animated: false });
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { if (pending.current) list.current?.scrollToLocation(pending.current); }, 220);
      }}
      ListFooterComponent={<View style={{ padding: 18, alignItems: 'center' }}>{!stress && unitCount < journeyUnits.length ? <JourneyAction title="Continuar hacia nuevos horizontes →" onPress={() => setUnitCount(count => count + 1)}/> : <Text style={{ color: '#66726E', fontSize: 11 }}>FIN DEL RECORRIDO · SIGUE PRACTICANDO</Text>}</View>}/>
    <JourneyAction title="Consultar vocabulario de este nivel" onPress={() => setModal('words')}/>
    <SelectedLevelPanel level={selected} state={state} target={source.indices.length} bottom={insets.bottom} disabled={!progress || error || stress} requirement={`Completa «${levels[Math.max(0, levels.indexOf(source)-1)].title}»`} onPlay={() => router.push({ pathname: '/race', params: { level: selected.sourceId } })}/>
    <Modal visible={modal !== null} transparent animationType="none" onRequestClose={() => setModal(null)}><View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#142E4399', padding: 24 }}><View style={{ backgroundColor: '#FFF8E7', borderRadius: 18, padding: 24, maxHeight: '85%' }}><Text style={{ color: ink, fontSize: 24, fontWeight: '900', marginBottom: 15 }}>{modal === 'words' ? source.title : 'Guía de viaje'}</Text><ScrollView>{modal === 'words' ? source.indices.map(index => <Text key={vocabulary[index].id} style={{ color: ink, fontSize: 17, paddingVertical: 6 }}>{vocabulary[index].spanish} · {vocabulary[index].correct}</Text>) : <Text style={{ color: ink, fontSize: 16, lineHeight: 25 }}>Elige la traducción y esquiva los obstáculos. Cada carrera empieza con 3 vidas.{ '\n\n' }Para aprobar, termina la carrera con al menos 8 de las 10 preguntas base correctas al primer intento. Obtienes 1 estrella con 8, 2 con 9 y 3 con 10.{ '\n\n' }Los errores vuelven después de otras preguntas, con hasta 3 repasos extra. Los pendientes reaparecen en futuras sesiones. Repetir conserva tus mejores resultados.</Text>}</ScrollView><JourneyAction title="Cerrar" onPress={() => setModal(null)}/></View></View></Modal>
  </View>;
}

function JourneyAction({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 8 }}><Text style={{ color: green, fontSize: 12, fontWeight: '800' }}>{title}</Text></Pressable>;
}
