import { Platform } from 'react-native';

import type { ApiClientConfig } from './client';
import type { PropertySlug } from './types';

/** Default property when none is set (storage or in-memory). */
export const DEFAULT_PROPERTY: PropertySlug = 'tahoe';

/** Named API environments with fixed base URLs. */
export const API_BASE_URLS = {
  /** Local dev: localhost (iOS Simulator) or 10.0.2.2 (Android emulator) */
  local: 'http://localhost:4000',
  /** Sandbox: https://ysc-sandbox.fly.dev */
  sandbox: 'https://ysc-sandbox.fly.dev',
  /** Production: https://ysc.org */
  prod: 'https://ysc.org',
} as const;

export type ApiEnvironment = keyof typeof API_BASE_URLS;

/**
 * Resolved base URL for an environment. Use this instead of API_BASE_URLS when making requests:
 * on Android emulator, "local" resolves to 10.0.2.2:4000 (host machine); on iOS Simulator, localhost works.
 */
export function getBaseUrlForEnvironment(env: ApiEnvironment): string {
  if (env === 'local') {
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }
  return API_BASE_URLS[env];
}

function getBaseUrlFromEnv(): string {
  if (typeof process === 'undefined') return getBaseUrlForEnvironment('local');
  const env = process.env?.EXPO_PUBLIC_API_ENVIRONMENT as ApiEnvironment | undefined;
  if (env && env in API_BASE_URLS) return getBaseUrlForEnvironment(env);
  const url = process.env?.EXPO_PUBLIC_API_BASE_URL;
  if (url) return url;
  return getBaseUrlForEnvironment('local');
}

/**
 * Runtime API config. Set via setApiConfig() at app init.
 * Env: EXPO_PUBLIC_API_ENVIRONMENT (local|sandbox|prod), or EXPO_PUBLIC_API_BASE_URL; EXPO_PUBLIC_KIOSK_API_KEY (or KIOSK_API_KEY).
 */
let currentConfig: ApiClientConfig | null = null;

/** Selected property (Tahoe or Clear Lake) for all endpoints. Persisted with stored config. */
let selectedProperty: PropertySlug = DEFAULT_PROPERTY;

export function getSelectedProperty(): PropertySlug {
  return selectedProperty ?? DEFAULT_PROPERTY;
}

export function setSelectedProperty(property: PropertySlug): void {
  selectedProperty = property;
}

export type SetApiConfigInput = ApiClientConfig | { environment: ApiEnvironment; apiKey: string };

export function setApiConfig(config: SetApiConfigInput): void {
  if ('environment' in config) {
    currentConfig = {
      baseUrl: getBaseUrlForEnvironment(config.environment),
      apiKey: config.apiKey,
    };
  } else {
    currentConfig = config;
  }
}

export function getApiConfig(): ApiClientConfig {
  if (currentConfig) return currentConfig;
  const baseUrl = getBaseUrlFromEnv();
  const apiKey =
    (typeof process !== 'undefined' &&
      (process.env?.EXPO_PUBLIC_KIOSK_API_KEY || process.env?.KIOSK_API_KEY)) ||
    '';
  if (!apiKey) {
    throw new Error(
      'API key not configured. Call setApiConfig({ baseUrl, apiKey }) or set EXPO_PUBLIC_KIOSK_API_KEY (or KIOSK_API_KEY).'
    );
  }
  return { baseUrl, apiKey };
}

export function isApiConfigured(): boolean {
  if (currentConfig) return true;
  const apiKey =
    (typeof process !== 'undefined' &&
      (process.env?.EXPO_PUBLIC_KIOSK_API_KEY || process.env?.KIOSK_API_KEY)) ||
    '';
  return Boolean(apiKey);
}

/** Reset in-memory config state. For use in tests only. */
export function resetConfigForTesting(): void {
  currentConfig = null;
  selectedProperty = DEFAULT_PROPERTY;
}
