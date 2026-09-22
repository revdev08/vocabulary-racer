import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReactNode } from 'react';
export const palette = { ink: '#173647', cream: '#fff8e9', orange: '#ff8545', muted: '#6c858c', teal: '#087d84' };
export function Button({ children, onPress, secondary = false, disabled = false }: { children: ReactNode; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, { opacity: disabled ? .35 : pressed ? .75 : 1, transform: [{ scale: pressed ? .98 : 1 }] }]}><Text style={[styles.buttonText, secondary && { color: palette.ink }]}>{children}</Text></Pressable>;
}
export function Chip({ children }: { children: ReactNode }) { return <View style={styles.chip}><Text style={styles.chipText}>{children}</Text></View>; }
export const styles = StyleSheet.create({
  button: { backgroundColor: palette.ink, minHeight: 56, paddingHorizontal: 22, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: '#e9efea' }, buttonText: { color: palette.cream, fontWeight: '800', fontSize: 17 },
  chip: { backgroundColor: '#fff8e9e8', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 100 }, chipText: { color: palette.ink, fontSize: 11, letterSpacing: 1.4, fontWeight: '800' },
  title: { fontSize: 34, fontWeight: '900', color: palette.ink, letterSpacing: -1.4 },
  body: { fontSize: 15, lineHeight: 23, color: palette.muted },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, fontWeight: '800', color: palette.teal },
});
