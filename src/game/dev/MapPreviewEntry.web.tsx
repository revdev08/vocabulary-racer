import { Redirect } from 'expo-router';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
const getPreview = () => import('./MapPreview');
export default function MapPreviewEntry() {
  return __DEV__ ? <WithSkiaWeb getComponent={getPreview} opts={{ locateFile: (file: string) => `/${file}` }} /> : <Redirect href="/" />;
}
