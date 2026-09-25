import { Redirect } from 'expo-router';
import MapPreview from './MapPreview';
export default function MapPreviewEntry() {
  return __DEV__ ? <MapPreview /> : <Redirect href="/" />;
}
