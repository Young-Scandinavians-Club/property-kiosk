import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';
import type { SWRConfiguration } from 'swr';

export const defaultFetcher = async (resource: RequestInfo | URL, init?: RequestInit) => {
  const res = await fetch(resource, init);
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    (err as any).status = res.status;
    throw err;
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
};

export const swrConfig: SWRConfiguration = {
  fetcher: defaultFetcher as any,
  shouldRetryOnError: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  provider: () => new Map(),
  initFocus(callback) {
    let currentState: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasBackground = currentState === 'inactive' || currentState === 'background';
      const isActive = nextState === 'active';
      if (wasBackground && isActive) callback();
      currentState = nextState;
    });
    return () => sub.remove();
  },
  initReconnect(callback) {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) callback();
    });
    return () => unsub();
  },
};
