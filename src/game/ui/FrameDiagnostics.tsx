import { StyleSheet, Text, View } from 'react-native';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';

/** Only rendered at ?profile=1 on web, never in the normal game or native build. */
export function FrameDiagnostics({ simulation }: { simulation: DrivingSimulation }) {
  if (!simulation.profiling) return null;
  return <View style={styles.panel}>
    <Text style={styles.text}>{simulation.profileReport ? 'Medición lista' : 'Midiendo fotogramas'}</Text>
    <Text selectable style={styles.text}>{JSON.stringify(simulation.profileReport)}</Text>
  </View>;
}
const styles = StyleSheet.create({
  panel: { pointerEvents: 'none', position: 'absolute', bottom: 0, left: 0, right: 0, padding: 6, backgroundColor: '#071725E6' },
  text: { fontSize: 10, color: '#FFFFFF' },
});
