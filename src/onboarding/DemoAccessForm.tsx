import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSubscription } from '../subscriptions/SubscriptionProvider';

export function DemoAccessForm() {
  const sub = useSubscription();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  if (!sub.demoAvailable) return null;
  return <View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }}
      disabled={sub.busy} onPress={() => setOpen(!open)} style={s.link}>
      <Text style={s.linkText}>{open ? 'Cerrar acceso con código' : 'Tengo un código de acceso'}</Text>
    </Pressable>
    {open && <View style={s.form}>
      <Text style={s.label}>Acceso de demostración</Text>
      <Text style={s.copy}>Introduce tu código autorizado. No necesitas comprar una suscripción.</Text>
      <TextInput accessibilityLabel="Código de acceso" value={code} onChangeText={setCode}
        editable={!sub.busy} autoCapitalize="none" autoCorrect={false} secureTextEntry
        maxLength={128} placeholder="Código de acceso" placeholderTextColor="#65746D"
        style={s.input} returnKeyType="done"
        onSubmitEditing={() => { if (code.trim() && !sub.busy) void sub.redeemDemo(code); }} />
      <Pressable accessibilityRole="button" disabled={sub.busy || !code.trim()}
        onPress={() => void sub.redeemDemo(code)}
        style={[s.button, (sub.busy || !code.trim()) && { opacity: .5 }]}>
        <Text style={s.buttonText}>{sub.busy ? 'Verificando…' : 'Activar acceso'}</Text>
      </Pressable>
    </View>}
  </View>;
}
const s = StyleSheet.create({
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#087D55', fontSize: 14, fontWeight: '700' },
  form: { padding: 16, gap: 12, borderRadius: 16, backgroundColor: '#FFF8E5', borderColor: '#087D55', borderWidth: 1 },
  label: { fontSize: 18, fontWeight: '800', color: '#142B40' },
  copy: { fontSize: 14, lineHeight: 21, color: '#40575B' },
  input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: '#65746D', borderRadius: 10, color: '#142B40', backgroundColor: '#FFFFFF' },
  button: { minHeight: 48, padding: 12, backgroundColor: '#087D55', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
