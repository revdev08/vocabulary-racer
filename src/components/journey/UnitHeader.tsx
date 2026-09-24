import { StyleSheet, Text, View } from 'react-native';
import type { JourneyUnit } from '../../game/data/journey';
import { TravelStamp } from './LevelTicket';
import { journeyPalette as c } from './theme';

export function UnitHeader({ unit, completed }: { unit: JourneyUnit; completed: number }) {
  return <View style={s.root}>
    <View style={s.stamp}><TravelStamp/></View>
    <Text style={s.eyebrow}>UNIDAD {String(unit.number).padStart(2, '0')} · {unit.number === 1 ? 'ARRANQUE' : 'EN RUTA'}</Text>
    <Text accessibilityRole="header" style={s.title}>{unit.title}</Text>
    <View style={s.progress}>
      <View style={s.segments}>{unit.data.map((level, index) => <View key={level.id} style={[s.segment, index < completed && s.filled]}/>)}</View>
      <Text style={s.count}><Text style={s.strong}>{completed}</Text>/{unit.data.length} completados</Text>
    </View>
  </View>;
}
const s = StyleSheet.create({
  root: { paddingHorizontal: 25, paddingTop: 21, paddingBottom: 20, alignItems: 'center' },
  stamp: { position: 'absolute', right: -12, top: 6, opacity: 0.65, pointerEvents: 'none' },
  eyebrow: { color: '#466252', fontWeight: '800', fontSize: 12, letterSpacing: 1.5 },
  title: { color: c.ink, fontSize: 28, fontWeight: '900', letterSpacing: -1, marginTop: 5, textAlign: 'center' },
  progress: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 12 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { width: 17, height: 6, borderRadius: 3, backgroundColor: '#CBBFA3' },
  filled: { backgroundColor: c.green },
  count: { color: '#4C6254', fontSize: 14 },
  strong: { color: c.green, fontWeight: '800' },
});
