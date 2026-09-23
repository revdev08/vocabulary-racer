import { ActivityIndicator, View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
const getGame = () => import('./GameScreen');
export default function Race() {
  return <WithSkiaWeb getComponent={getGame} opts={{ locateFile: (file: string) => `/${file}` }}
    fallback={<View style={{ flex: 1, backgroundColor: '#80BCF8', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Cargando escenario" /></View>} />;
}
