import { StyleSheet, Text, View } from 'react-native';
import { Seal } from './LevelTicket';
import { journeyPalette as c, type TicketState } from './theme';

export function TimelineSegment({ first, last, state, current }: { first: boolean; last: boolean; state: TicketState; current: boolean }) {
  return <View style={s.column} accessible={false} importantForAccessibility="no-hide-descendants">
    <View style={[s.line, { top: first ? '50%' : 0, bottom: last ? '50%' : -10, borderColor: state === 'completed' ? '#398C70' : '#9CA99E' }]}/>
    <View style={[s.dot, { backgroundColor: state === 'locked' ? '#839399' : c.green, borderColor: current ? c.gold : '#FFF9E8' }, current && s.current]}>
      {state === 'locked' ? <View style={s.lock}><Seal locked size={25}/></View> : <Text style={s.mark}>{state === 'completed' ? '✓' : '›'}</Text>}
    </View>
  </View>;
}
const s = StyleSheet.create({
  column: { width: 38, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', borderLeftWidth: 2, borderStyle: 'dashed' },
  dot: { width: 28, height: 28, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px #544B3820' },
  current: { width: 32, height: 32, borderWidth: 3 },
  mark: { color: '#FFF9E8', fontSize: 20, fontWeight: '900', lineHeight: 22 },
  lock: { alignItems: 'center', justifyContent: 'center' },
});
