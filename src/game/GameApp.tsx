import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import GameScreen from './GameScreen';

export default function GameApp() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <StatusBar style="dark" />
    <GameScreen />
  </SafeAreaProvider>;
}
