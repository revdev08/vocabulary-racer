import { router } from 'expo-router';
import { ProfileScreen } from '../profile/ProfileScreen';
export default function Profile() {
  return <ProfileScreen onClose={() => router.canGoBack() ? router.back() : router.replace('/')} />;
}
