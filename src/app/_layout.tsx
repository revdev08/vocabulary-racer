import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SubscriptionProvider } from '../subscriptions/SubscriptionProvider';
import { OnboardingGate } from '../onboarding/OnboardingGate';
export default function Layout() {
  return <SafeAreaProvider><SubscriptionProvider><StatusBar style="dark" /><View style={s.outer}><View style={s.app}>
    <OnboardingGate><Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#fff8e9' } }}>
      {/* Horizontal swipes belong to driving, including the iOS back-swipe edge. */}
      <Stack.Screen name="race" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
    </Stack></OnboardingGate>
  </View></View></SubscriptionProvider></SafeAreaProvider>;
}
const s = StyleSheet.create({ outer: { flex: 1, backgroundColor: '#102c3c', alignItems: 'center' }, app: { flex: 1, width: '100%', maxWidth: 540, overflow: 'hidden' } });
