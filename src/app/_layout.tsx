import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function Layout() {
  return <SafeAreaProvider><StatusBar style="dark" /><View style={s.outer}><View style={s.app}><Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#fff8e9' } }} /></View></View></SafeAreaProvider>;
}
const s = StyleSheet.create({ outer: { flex: 1, backgroundColor: '#102c3c', alignItems: 'center' }, app: { flex: 1, width: '100%', maxWidth: 520, overflow: 'hidden' } });
