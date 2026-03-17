import * as SecureStore from 'expo-secure-store';

import {
  type ApiEnvironment,
  API_BASE_URLS,
  DEFAULT_PROPERTY,
  setSelectedProperty,
} from '@/api/config';
import type { PropertySlug } from '@/api/types';

const KEY_API_KEY = 'kiosk_api_key';
const KEY_ENVIRONMENT = 'kiosk_api_environment';
const KEY_PROPERTY = 'kiosk_property';

export interface StoredApiConfig {
  apiKey: string;
  environment: ApiEnvironment;
  property: PropertySlug;
}

/** Load API key, environment, and property from secure storage. Returns null if not set or on error (e.g. web). */
export async function loadStoredApiConfig(): Promise<StoredApiConfig | null> {
  try {
    const [apiKey, environment, property] = await Promise.all([
      SecureStore.getItemAsync(KEY_API_KEY),
      SecureStore.getItemAsync(KEY_ENVIRONMENT),
      SecureStore.getItemAsync(KEY_PROPERTY),
    ]);
    if (!apiKey || !environment) return null;
    if (!isValidEnvironment(environment)) return null;
    const prop = isValidProperty(property) ? property : DEFAULT_PROPERTY;
    return { apiKey, environment, property: prop };
  } catch {
    return null;
  }
}

/** Save API key, environment, and property to secure storage. */
export async function saveStoredApiConfig(config: StoredApiConfig): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(KEY_API_KEY, config.apiKey),
      SecureStore.setItemAsync(KEY_ENVIRONMENT, config.environment),
      SecureStore.setItemAsync(KEY_PROPERTY, config.property),
    ]);
  } catch {
    // e.g. SecureStore not available on web
  }
}

/** Remove stored API config from secure storage. */
export async function clearStoredApiConfig(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_API_KEY),
      SecureStore.deleteItemAsync(KEY_ENVIRONMENT),
      SecureStore.deleteItemAsync(KEY_PROPERTY),
    ]);
  } catch {
    // no-op
  }
}

/** Update stored property and in-memory selected property. Call when user changes property (e.g. in settings). */
export async function updateStoredProperty(property: PropertySlug): Promise<void> {
  setSelectedProperty(property);
  const stored = await loadStoredApiConfig();
  if (stored) await saveStoredApiConfig({ ...stored, property });
}

function isValidEnvironment(value: string): value is ApiEnvironment {
  return value in API_BASE_URLS;
}

function isValidProperty(value: string | null): value is PropertySlug {
  return value === 'tahoe' || value === 'clear_lake';
}
