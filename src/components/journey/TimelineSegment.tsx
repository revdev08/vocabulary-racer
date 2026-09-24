import { StyleSheet, Text, View } from 'react-native';
import { green, type TicketState } from './LevelTicket';
export function TimelineSegment({ first, last, state, current }: { first: boolean; last: boolean; state: TicketState; current: boolean }) {
  return <View style={s.column} accessible={false}><View style={[s.line, { top: first ? '50%' : 0, bottom: last ? '50%' : 0 }]}/><View style={[s.dot, { backgroundColor: state === 'locked' ? '#7D898B' : green, borderColor: current ? '#F6C951' : '#FFF9E8' }]}><Text style={s.mark}>{state === 'completed' ? '✓' : current ? '›' : '·'}</Text></View></View>;
}
const s = StyleSheet.create({ column: { width: 37, alignItems: 'center', justifyContent: 'center' }, line: { position: 'absolute', borderLeftWidth: 2, borderStyle: 'dashed', borderColor: '#8A9B91' }, dot: { width: 26, height: 26, borderRadius: 14, borderWidth: 3, alignItems: 'center', justifyContent: 'center' }, mark: { color: '#FFF9E8', fontSize: 17, fontWeight: '900', lineHeight: 19 } });
