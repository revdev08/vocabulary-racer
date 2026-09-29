import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSubscription } from './SubscriptionProvider';

// A granted race may finish even if access changes. The next race/retry rechecks it.
export function RaceAccessGate({ children }: { children: ReactNode }) {
  const { requestAccess, restore, busy, error } = useSubscription();
  const [granted, setGranted] = useState(false);
  const enter = useCallback(async () => { if (await requestAccess()) setGranted(true); }, [requestAccess]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => { void enter(); });
    return () => cancelAnimationFrame(frame);
  }, [enter]);
  if (granted) return children;
  return <View style={s.page}>
    <Text style={s.eyebrow}>DASHWORD PLUS</Text>
    <Text style={s.title}>Tu próximo destino te espera</Text>
    <Text style={s.copy}>Activa tu suscripción para jugar todos los niveles. Tu progreso se conserva.</Text>
    {busy && <ActivityIndicator color="#087D55" accessibilityLabel="Consultando suscripción" />}
    {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void enter()} style={[s.button, busy && { opacity: .5 }]}><Text style={s.buttonText}>Ver suscripción</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void restore()} style={s.link}><Text style={s.linkText}>Restaurar compras</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.replace('/')} style={s.link}><Text style={s.linkText}>Volver a los niveles</Text></Pressable>
  </View>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFAEC', padding: 28, justifyContent: 'center', gap: 16 },
  eyebrow: { color: '#087D55', fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: '900', color: '#142B40' },
  copy: { fontSize: 17, lineHeight: 25, color: '#52677A' },
  error: { color: '#92432C', lineHeight: 22 },
  button: { backgroundColor: '#087D55', padding: 17, borderRadius: 24, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  link: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  linkText: { color: '#087D55', fontWeight: '700', fontSize: 15 },
});
