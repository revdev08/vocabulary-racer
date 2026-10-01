import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { journeyAssets, journeyPalette as c } from '../components/journey/theme';
import { readProgress, type Progress } from '../game/storage';
import { levels } from '../game/data/vocabulary';
import { useSubscription } from '../subscriptions/SubscriptionProvider';
import { legalLinks } from './legal';

export function ProfileScreen({ onClose }: { onClose: () => void }) {
  const sub = useSubscription();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<Progress>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let live = true;
    readProgress().then(value => { if (live) setProgress(value); }).catch(() => { if (live) setError('No pudimos cargar tu progreso.'); });
    return () => { live = false; };
  }, []);
  const open = async (url: string) => {
    setError(undefined);
    try { await Linking.openURL(url); }
    catch { setError('No pudimos abrir el enlace. Comprueba tu conexión y vuelve a intentarlo.'); }
  };
  const action = (title: string, description: string, onPress: () => void, disabled = false) => <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.row, (pressed || disabled) && { opacity: .55 }]}><View style={s.rowBody}><Text style={s.rowTitle}>{title}</Text><Text style={s.detail}>{description}</Text></View><Text style={s.arrow}>›</Text></Pressable>;
  return <View style={[s.root, { paddingTop: insets.top }]}>
    <Image source={journeyAssets.background} accessible={false} style={s.background}/>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onClose} style={s.back}><Text style={s.backText}>‹ Volver</Text></Pressable><Text style={s.brand}>Dashword</Text></View>
    <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={s.eyebrow}>TU COMPAÑERO DE VIAJE</Text><Text accessibilityRole="header" style={s.title}>Mi perfil</Text>
      <Text style={s.copy}>Tu progreso, tu acceso y tus preferencias de compra.</Text>
      <View style={s.card}><Text style={s.section}>Tu recorrido</Text><Text style={s.copy}>Aprendiendo inglés desde el español</Text>
        {progress ? <View style={s.stats}><View><Text style={s.number}>{levels.filter(level => progress.levels[level.id]?.completed).length}</Text><Text style={s.detail}>Niveles completados</Text></View><View><Text style={s.number}>{progress.best}</Text><Text style={s.detail}>Mejor puntuación</Text></View></View> : <ActivityIndicator color={c.green}/>}
        <Text style={s.detail}>Tu progreso se guarda en este dispositivo. Restaurar compras recupera el acceso adquirido, no el progreso de otro dispositivo.</Text>
      </View>
      <View style={s.card}><Text style={s.section}>Dashword Plus</Text><Text style={s.status}>{sub.loading ? 'Consultando acceso…' : sub.developmentPreview ? 'Vista previa de desarrollo' : sub.active ? 'Acceso activo' : 'Sin suscripción activa'}</Text>
        <Text style={s.copy}>Acceso a todos los niveles disponibles, pronunciación y repasos mientras tu suscripción esté activa.</Text>
        {sub.developmentPreview ? <Text style={s.detail}>Las compras se gestionan desde la app instalada en iOS o Android.</Text> : <>
          {!sub.active && action('Ver planes', 'Consulta el precio y las ofertas disponibles.', () => void sub.requestAccess(), sub.busy || sub.loading)}
          {action('Gestionar suscripción', 'Consulta la renovación o cancela desde la tienda.', () => void sub.manage(), sub.busy || sub.loading)}
          {action('Restaurar compras', 'Recupera tu acceso con la misma cuenta de la tienda.', () => void sub.restore(), sub.busy || sub.loading)}
        </>}
        {sub.busy && <ActivityIndicator color={c.green} accessibilityLabel="Consultando la tienda"/>}
        <Text style={s.detail}>La suscripción se renueva automáticamente hasta que la canceles. Eliminar la app no cancela la suscripción.</Text>
      </View>
      <View style={s.card}><Text style={s.section}>Ayuda y condiciones</Text>
        {action('Soporte', 'Obtén ayuda con Dashword.', () => void open(legalLinks.support))}
        {action('Política de privacidad', legalLinks.privacy ? 'Cómo se tratan tus datos.' : 'Enlace pendiente de configuración.', () => void open(legalLinks.privacy), !legalLinks.privacy)}
        {action('Términos de uso', legalLinks.terms ? 'Condiciones de uso de Dashword.' : 'Enlace pendiente de configuración.', () => void open(legalLinks.terms), !legalLinks.terms)}
        {Platform.OS === 'ios' && action('Ayuda con suscripciones de Apple', 'Información sobre cómo cancelar tu suscripción.', () => void open('https://support.apple.com/118428'))}
      </View>
      {(error || sub.error) && <Text accessibilityRole="alert" style={s.error}>{error || sub.error}</Text>}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.cream }, background: { position: 'absolute', width: '100%', height: '100%', opacity: .2 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { minHeight: 48, justifyContent: 'center', paddingRight: 16 }, backText: { color: c.green, fontSize: 16, fontWeight: '700' }, brand: { color: c.ink, fontWeight: '900', fontSize: 19 },
  content: { padding: 24, gap: 18 }, eyebrow: { color: c.green, letterSpacing: 1.5, fontSize: 11, fontWeight: '800' }, title: { color: c.ink, fontSize: 36, fontWeight: '900' }, copy: { color: '#40575B', fontSize: 15, lineHeight: 23 },
  card: { backgroundColor: '#FFF9E9', borderColor: '#D6CCB6', borderWidth: 1, borderRadius: 20, padding: 18, gap: 14 }, section: { color: c.ink, fontSize: 20, fontWeight: '800' }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 }, number: { color: c.green, fontSize: 30, fontWeight: '900' }, detail: { color: '#586963', fontSize: 13, lineHeight: 20 }, status: { color: c.green, fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', borderTopWidth: 1, borderColor: '#E5DCC7', paddingVertical: 13, minHeight: 55 }, rowBody: { flex: 1, gap: 5 }, rowTitle: { color: c.ink, fontSize: 16, fontWeight: '700' }, arrow: { color: c.green, fontSize: 26 }, error: { color: '#92432C', lineHeight: 22 },
});
