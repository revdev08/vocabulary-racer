import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { decorativeSvgProps } from './decorativeSvgProps';

/** Shown until every scene texture is decoded, so the HUD never floats over an empty sky. */
export function RaceLoading({ eyebrow, title, error }: { eyebrow?: string; title?: string; error?: boolean }) {
  return <View style={styles.root} accessibilityViewIsModal>
    <View style={styles.artwork}>
      <Svg width="100%" height="100%" viewBox="0 0 100 180" preserveAspectRatio="xMidYMax slice" {...decorativeSvgProps}>
        <Defs>
          <LinearGradient id="loadingSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0E2540" /><Stop offset="0.55" stopColor="#1C4368" /><Stop offset="1" stopColor="#2E5B80" />
          </LinearGradient>
          <LinearGradient id="loadingRoad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1B2E40" /><Stop offset="1" stopColor="#2C3E4F" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="180" fill="url(#loadingSky)" />
        <Path d="M46 92H54L100 180H0Z" fill="url(#loadingRoad)" />
        <Path d="M46 92 0 180M54 92l46 88" stroke="#F6F1DD" strokeWidth="0.8" opacity="0.55" />
        <Path d="M48.7 92 33.3 180M51.3 92l15.4 88" stroke="#F6F1DD" strokeWidth="0.9" strokeDasharray="5 6" opacity="0.5" />
      </Svg>
    </View>
    <View style={styles.copy}>
      {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      {!!title && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
      {error ? <>
        <Text accessibilityRole="alert" style={styles.error}>No se pudo cargar el escenario. Revisa tu conexión e inténtalo de nuevo.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={({ pressed }) => [styles.exit, pressed && { opacity: .75 }]}>
          <Text style={styles.exitText}>Volver al inicio</Text>
        </Pressable>
      </> : <View style={styles.status}>
        <ActivityIndicator color="#FFD470" accessibilityLabel="Cargando escenario" />
        <Text style={styles.statusText}>Preparando la carrera…</Text>
      </View>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: '#0E2540' },
  artwork: { ...StyleSheet.absoluteFill },
  copy: { position: 'absolute', left: 24, right: 24, top: '24%', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#FFD470', fontSize: 14, fontWeight: '800', letterSpacing: 1.6, textAlign: 'center' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingVertical: 9, paddingHorizontal: 16,
    borderRadius: 18, backgroundColor: 'rgba(8, 24, 42, 0.55)', borderWidth: 1, borderColor: '#FFFFFF22' },
  statusText: { color: '#D8E8F5', fontSize: 15, fontWeight: '700' },
  error: { color: '#FFE0E5', fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: 12 },
  exit: { marginTop: 10, minHeight: 48, paddingHorizontal: 22, borderRadius: 16, justifyContent: 'center', backgroundColor: '#087D55', borderBottomWidth: 4, borderBottomColor: '#045C42' },
  exitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
