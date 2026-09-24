import { Text, View } from 'react-native';
import type { JourneyUnit } from '../../game/data/journey';
import { green, ink } from './LevelTicket';
export function UnitHeader({ unit, completed }: { unit: JourneyUnit; completed: number }) {
  return <View style={{ paddingHorizontal: 25, paddingTop: 25, paddingBottom: 17 }}><Text style={{ color: green, fontWeight: '800', fontSize: 10, letterSpacing: 2 }}>UNIDAD {unit.number} · ESPAÑOL → INGLÉS</Text><Text accessibilityRole="header" style={{ color: ink, fontSize: 27, fontWeight: '900', marginTop: 5 }}>{unit.title}</Text><Text style={{ color: '#5D6B6D', fontSize: 12, marginTop: 5 }}>{completed} / {unit.data.length} niveles completados</Text></View>;
}
