import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { CustomerInfo } from 'react-native-purchases';
import { subscriptionConfig } from './config';

export const developmentPreview = __DEV__ && (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient);
const nativeStore = (Platform.OS === 'ios' || Platform.OS === 'android') && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
let initialization: Promise<typeof import('react-native-purchases').default> | null = null;

export async function purchases() {
  if (!nativeStore) throw new Error('Las compras están disponibles en la aplicación instalada desde la tienda.');
  const apiKey = Platform.OS === 'ios' ? subscriptionConfig.iosKey : subscriptionConfig.androidKey;
  if (!apiKey) throw new Error('Las suscripciones para Android todavía no están disponibles.');
  if (!initialization) {
    initialization = (async () => {
      const sdk = (await import('react-native-purchases')).default;
      if (!(await sdk.isConfigured())) sdk.configure({ apiKey });
      return sdk;
    })().catch(error => { initialization = null; throw error; });
  }
  return initialization;
}

export async function presentRemotePaywall() {
  const sdk = await purchases();
  const offerings = await sdk.getOfferings();
  const offering = offerings.all[subscriptionConfig.offering];
  if (!offering?.availablePackages.length) throw new Error('No se pudo cargar la suscripción. Intenta nuevamente en unos minutos.');
  const { default: ui, PAYWALL_RESULT } = await import('react-native-purchases-ui');
  const result = await ui.presentPaywall({ offering, displayCloseButton: true });
  if (result === PAYWALL_RESULT.ERROR) throw new Error('No se pudo completar la compra. Intenta nuevamente.');
}

export type { CustomerInfo };
