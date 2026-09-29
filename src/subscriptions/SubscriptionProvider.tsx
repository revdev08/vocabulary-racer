import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, AppState } from 'react-native';
import { createAccessRequest, hasPlus } from './access';
import { developmentPreview, presentRemotePaywall, purchases, type CustomerInfo } from './billing';

type SubscriptionState = {
  active: boolean; loading: boolean; busy: boolean; error: string | null; developmentPreview: boolean;
  requestAccess: () => Promise<boolean>; restore: () => Promise<void>; manage: () => Promise<void>;
};
const Context = createContext<SubscriptionState | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(!developmentPreview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const operation = useRef<Promise<unknown> | null>(null);
  const accessOperation = useRef<Promise<boolean> | null>(null);
  const update = useCallback((value: CustomerInfo) => { if (mounted.current) { setInfo(value); setError(null); } }, []);
  const read = useCallback(async () => {
    const value = await (await purchases()).getCustomerInfo();
    update(value);
    return value;
  }, [update]);
  const failure = useCallback((cause: unknown) => {
    const message = cause instanceof Error ? cause.message : 'No pudimos verificar la suscripción. Comprueba tu conexión y vuelve a intentarlo.';
    if (mounted.current) setError(message);
    return message;
  }, []);
  useEffect(() => {
    mounted.current = true;
    let disposed = false;
    let detach: (() => void) | undefined;
    if (!developmentPreview) {
      void purchases().then(sdk => {
        if (disposed) return;
        sdk.addCustomerInfoUpdateListener(update);
        detach = () => { sdk.removeCustomerInfoUpdateListener(update); };
        return read();
      }).catch(failure).finally(() => { if (!disposed) setLoading(false); });
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && !developmentPreview) void read().catch(failure);
    });
    return () => { disposed = true; mounted.current = false; detach?.(); subscription.remove(); };
  }, [read, update, failure]);
  const requestAccess = useCallback((): Promise<boolean> => {
    if (developmentPreview) return Promise.resolve(true);
    if (accessOperation.current) return accessOperation.current;
    if (operation.current) return Promise.resolve(false);
    setBusy(true); setError(null);
    const task = createAccessRequest({ read, present: presentRemotePaywall })()
      .catch(cause => { failure(cause); return false; })
      .finally(() => { accessOperation.current = null; operation.current = null; if (mounted.current) setBusy(false); });
    accessOperation.current = task; operation.current = task;
    return task;
  }, [read, failure]);
  const restore = useCallback(async () => {
    if (operation.current || developmentPreview) return;
    setBusy(true);
    const task = (async () => {
      const restored = await (await purchases()).restorePurchases();
      update(restored);
      Alert.alert('Restaurar compras', hasPlus(restored) ? 'Tu acceso a Dashword Plus está activo.' : 'No encontramos una suscripción activa con esta cuenta de la tienda.');
    })();
    operation.current = task;
    try { await task; } catch (cause) { Alert.alert('No se pudo restaurar', failure(cause)); }
    finally { operation.current = null; if (mounted.current) setBusy(false); }
  }, [update, failure]);
  const manage = useCallback(async () => {
    if (operation.current || developmentPreview) return;
    setBusy(true);
    const task = (async () => { await (await purchases()).showManageSubscriptions(); await read(); })();
    operation.current = task;
    try { await task; } catch (cause) { Alert.alert('Suscripción', failure(cause)); }
    finally { operation.current = null; if (mounted.current) setBusy(false); }
  }, [read, failure]);
  return <Context.Provider value={{ active: hasPlus(info), loading, busy, error, developmentPreview, requestAccess, restore, manage }}>{children}</Context.Provider>;
}

export function useSubscription() {
  const context = useContext(Context);
  if (!context) throw new Error('SubscriptionProvider is missing');
  return context;
}
