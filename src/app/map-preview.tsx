import { Redirect } from 'expo-router';
import MapPreview from '../game/dev/MapPreviewEntry';
export default function MapPreviewRoute() {
  return __DEV__ ? <MapPreview /> : <Redirect href="/" />;
}
