// Public SDK keys are intended to ship in the app; never put secret API keys here.
export const subscriptionConfig = {
  iosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_gNqEKttYrzURJPNrrOSXVbLlNAH',
  androidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
  offering: 'default',
  entitlement: 'plus',
};
