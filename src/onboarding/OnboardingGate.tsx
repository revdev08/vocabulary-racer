import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileScreen } from '../profile/ProfileScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { journeyAssets, journeyPalette as c } from '../components/journey/theme';
import { useSubscription } from '../subscriptions/SubscriptionProvider';

const KEY = 'dashword:onboarding:v1';
const pages = [
  { label: 'ELIGE TU CAMINO', title: 'Una palabra.\nUna decisión.\nUn nuevo comienzo.', copy: 'Conduce hacia la traducción correcta. Esquiva obstáculos y convierte cada carrera en vocabulario nuevo.' },
  { label: 'QUE NO SE TE OLVIDE', title: 'Tus errores tienen\nsegunda vuelta.', copy: 'Las palabras que te cuestan vuelven durante la carrera y en futuros repasos. Escucha la respuesta correcta, incluso cuando fallas.' },
  { label: 'TU PASE A DASHWORD', title: 'El próximo nivel\nempieza contigo.', copy: 'Todos los niveles disponibles, pronunciación y repasos en una sola suscripción. Tu progreso marca el camino.' },
];

export function OnboardingGate({ children }: { children: ReactNode }) {
  const sub = useSubscription();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState<string>();
  const [dismissed, setDismissed] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const lock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(KEY).then(value => {
      if (!live) return;
      setCompleted(value === 'complete');
      if (value === 'complete') setStep(2);
    }).catch(() => { /* A missing introduction flag never grants paid access. */ })
      .finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);
  const busy = saving || sub.busy;
  const finish = async () => {
    if (lock.current || busy) return;
    lock.current = true; setSaving(true); setStorageError(undefined);
    try {
      await AsyncStorage.setItem(KEY, 'complete');
      setCompleted(true);
      setDismissed(!(await sub.requestAccess()));
    } catch {
      setStorageError('No pudimos guardar este paso. Vuelve a intentarlo.');
    } finally { lock.current = false; setSaving(false); }
  };
  if (!ready || sub.loading) return <View style={s.loading}><ActivityIndicator color={c.green} accessibilityLabel="Preparando Dashword" /></View>;
  if (sub.active || (sub.developmentPreview && completed)) return children;
  const page = pages[step];
  return <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    <Image source={journeyAssets.background} style={s.background} accessible={false} />
    <View style={s.header}><Text style={s.brand}>Dash<Text style={{ color: c.green }}>word</Text></Text><Text style={s.count}>{step + 1} / 3</Text></View>
    <ScrollView ref={scroll} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>{page.label}</Text>
      <Text accessibilityRole="header" style={s.title}>{page.title}</Text>
      <Text style={s.copy}>{page.copy}</Text>
      {step === 0 ? <View style={s.demo}>
        <Text style={s.demoLabel}>PRUEBA UNA ELECCIÓN · ESPAÑOL → INGLÉS</Text>
        <Text style={s.prompt}>Hola</Text>
        <View style={s.choices}>{['Hello', 'Goodbye'].map(word => <Pressable key={word} accessibilityRole="button" accessibilityState={{ selected: choice === word }} onPress={() => setChoice(word)} style={[s.choice, choice === word && { backgroundColor: word === 'Hello' ? c.green : '#754D3E' }]}><Text style={[s.choiceText, choice === word && { color: 'white' }]}>{word}</Text></Pressable>)}</View>
        <Image source={journeyAssets.redCar} resizeMode="contain" style={s.car} accessible={false} />
        <Text accessibilityLiveRegion="polite" style={s.feedback}>{choice ? choice === 'Hello' ? '¡Correcto! Así empieza tu próxima carrera.' : 'Hola se dice Hello. Cada error te enseña algo.' : 'Toca el carril con la traducción correcta.'}</Text>
      </View> : step === 1 ? <View style={s.ticket}>
        <Text style={s.ticketLabel}>TU RUTA DE APRENDIZAJE</Text>
        {['Elige y escucha', 'Vuelve a intentarlo', 'Repasa en futuras sesiones'].map((text, i) => <View key={text} style={s.route}><Text style={s.marker}>{i + 1}</Text><Text style={s.routeText}>{text}</Text></View>)}
        <Text style={s.note}>No necesitas acertar siempre para avanzar.</Text>
      </View> : <View style={s.ticket}>
        <View style={s.passHeader}><Text style={s.ticketLabel}>BOLETO DE ACCESO COMPLETO</Text><Text style={s.plus}>PLUS</Text></View>
        <Image source={journeyAssets.redCar} resizeMode="contain" style={s.passCar} accessible={false} />
        <Text style={s.passTitle}>Más palabras para tu mundo.</Text>
        <Text style={s.copy}>Niveles por temas · Repasos de tus errores · Pronunciación</Text>
        <Text style={s.note}>Empieza con inglés desde el español.</Text>
      </View>}
      {(storageError || sub.error) && <Text accessibilityRole="alert" style={s.error}>{storageError || sub.error}</Text>}
      {dismissed && <Text accessibilityLiveRegion="polite" style={s.note}>Para entrar, activa una suscripción o restaura una compra existente.</Text>}
    </ScrollView>
    <View style={s.footer}>
      <View style={s.dots} accessibilityLabel={`Paso ${step + 1} de 3`}>{pages.map((_, i) => <View key={i} style={[s.dot, i === step && s.dotActive]} />)}</View>
      <Pressable accessibilityRole="button" disabled={busy} style={[s.cta, busy && { opacity: .6 }]} onPress={() => {
        if (step < 2) { setStep(step + 1); scroll.current?.scrollTo({ y: 0, animated: false }); }
        else void finish();
      }}><Text style={s.ctaText}>{busy ? 'Preparando tu acceso…' : step === 2 ? 'Ver planes y comenzar' : step === 0 ? 'Continuar mi viaje' : 'Quiero seguir aprendiendo'}</Text></Pressable>
      {step === 2 && <Text style={s.disclosure}>Consulta el precio y la prueba disponible en el siguiente paso. La suscripción se renueva hasta que la canceles.</Text>}
      <View style={s.links}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => setProfileVisible(true)} style={s.link}><Text style={s.linkText}>Perfil y privacidad</Text></Pressable>
        {step > 0 && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setStep(step - 1); scroll.current?.scrollTo({ y: 0, animated: false }); }} style={s.link}><Text style={s.linkText}>Atrás</Text></Pressable>}
        {!sub.developmentPreview && <Pressable accessibilityRole="button" disabled={busy} onPress={() => void sub.restore()} style={s.link}><Text style={s.linkText}>Ya tengo acceso · Restaurar</Text></Pressable>}
      </View>
    </View>
    <Modal visible={profileVisible} animationType="none" onRequestClose={() => setProfileVisible(false)}><ProfileScreen onClose={() => setProfileVisible(false)} /></Modal>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream }, loading: { flex: 1, justifyContent: 'center', backgroundColor: c.cream },
  background: { position: 'absolute', width: '100%', height: '100%', opacity: .22 },
  header: { paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 25, fontWeight: '900', color: c.ink, letterSpacing: -1 }, count: { color: c.muted, fontSize: 14, fontWeight: '700' },
  content: { padding: 24, paddingTop: 14, gap: 18, flexGrow: 1 }, eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 2, color: c.green },
  title: { color: c.ink, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.3 }, copy: { fontSize: 16, lineHeight: 24, color: '#40575B' },
  demo: { backgroundColor: c.ink, borderRadius: 24, padding: 18, gap: 12 }, demoLabel: { color: '#D9E3D7', fontSize: 10, fontWeight: '700', textAlign: 'center' }, prompt: { color: c.cream, fontSize: 29, fontWeight: '800', textAlign: 'center' },
  choices: { flexDirection: 'row', gap: 12 }, choice: { flex: 1, borderWidth: 2, borderColor: '#80CDB4', backgroundColor: '#F7EED6', borderRadius: 12, minHeight: 55, padding: 8, justifyContent: 'center', alignItems: 'center' }, choiceText: { color: c.ink, fontSize: 19, fontWeight: '800' },
  car: { width: '100%', height: 88 }, feedback: { color: '#FFF0C3', fontSize: 13, lineHeight: 19, textAlign: 'center', minHeight: 38 },
  ticket: { backgroundColor: '#FFF8E5', borderWidth: 2, borderColor: c.green, borderRadius: 20, padding: 20, gap: 18 }, ticketLabel: { color: c.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, flexShrink: 1 },
  route: { flexDirection: 'row', gap: 12, alignItems: 'center' }, marker: { color: c.ink, backgroundColor: c.gold, width: 32, height: 32, borderRadius: 16, textAlign: 'center', lineHeight: 32, fontWeight: '900' }, routeText: { color: c.ink, fontSize: 17, fontWeight: '700', flex: 1 },
  note: { color: '#536558', fontSize: 13, lineHeight: 20 }, passHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' }, plus: { backgroundColor: c.gold, color: c.ink, padding: 6, fontWeight: '900', fontSize: 12 }, passCar: { width: '100%', height: 115 }, passTitle: { fontSize: 24, fontWeight: '900', color: c.ink },
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: '#FFFAEC', borderTopWidth: 1, borderColor: '#E5DCC7' }, dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 14 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C8CFBD' }, dotActive: { width: 25, backgroundColor: c.green },
  cta: { minHeight: 56, borderRadius: 18, backgroundColor: c.green, padding: 15, alignItems: 'center', justifyContent: 'center' }, ctaText: { color: 'white', fontWeight: '800', fontSize: 17, textAlign: 'center' }, disclosure: { color: '#61706F', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }, link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 }, linkText: { color: c.green, fontSize: 13, fontWeight: '700' }, error: { color: '#92432C', fontSize: 14, lineHeight: 21 },
});
