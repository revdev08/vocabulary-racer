import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { demoCodeMatches, demoIsValid, demoPolicy } from './demoPolicy';

const key = 'dashword.demo.local.v1';
export const demoAvailable = Platform.OS !== 'web';

export async function validateDemo(code?: string): Promise<boolean> {
  if (!demoAvailable) return false;
  if (!demoIsValid(demoPolicy.revision)) {
    await SecureStore.deleteItemAsync(key);
    if (code !== undefined) throw new Error('El código de demostración ha vencido.');
    return false;
  }
  if (code !== undefined) {
    if (!demoCodeMatches(code)) throw new Error('Código no válido. Compruébalo e inténtalo de nuevo.');
    await SecureStore.setItemAsync(key, demoPolicy.revision, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    return demoIsValid(demoPolicy.revision);
  }
  return demoIsValid(await SecureStore.getItemAsync(key));
}

export async function clearDemo() {
  if (demoAvailable) await SecureStore.deleteItemAsync(key);
}
