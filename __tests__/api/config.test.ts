/**
 * @jest-environment node
 */

import {
  API_BASE_URLS,
  DEFAULT_PROPERTY,
  getApiConfig,
  getBaseUrlForEnvironment,
  getSelectedProperty,
  isApiConfigured,
  resetConfigForTesting,
  setApiConfig,
  setSelectedProperty,
} from '@/api/config';

const platform = { OS: 'ios' as 'ios' | 'android' };
jest.mock('react-native', () => ({ Platform: platform }));

describe('api/config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetConfigForTesting();
    process.env = { ...originalEnv };
    platform.OS = 'ios';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('DEFAULT_PROPERTY', () => {
    it('is tahoe', () => {
      expect(DEFAULT_PROPERTY).toBe('tahoe');
    });
  });

  describe('API_BASE_URLS', () => {
    it('has local, sandbox, and prod with correct URLs', () => {
      expect(API_BASE_URLS.local).toBe('http://localhost:4000');
      expect(API_BASE_URLS.sandbox).toBe('https://ysc-sandbox.fly.dev');
      expect(API_BASE_URLS.prod).toBe('https://ysc.org');
    });
  });

  describe('getBaseUrlForEnvironment', () => {
    it('returns localhost:4000 for local on iOS', () => {
      platform.OS = 'ios';
      expect(getBaseUrlForEnvironment('local')).toBe('http://localhost:4000');
    });

    it('returns 10.0.2.2:4000 for local on Android', () => {
      platform.OS = 'android';
      expect(getBaseUrlForEnvironment('local')).toBe('http://10.0.2.2:4000');
    });

    it('returns sandbox URL for sandbox', () => {
      expect(getBaseUrlForEnvironment('sandbox')).toBe('https://ysc-sandbox.fly.dev');
    });

    it('returns prod URL for prod', () => {
      expect(getBaseUrlForEnvironment('prod')).toBe('https://ysc.org');
    });
  });

  describe('setApiConfig / getApiConfig', () => {
    it('sets and returns config when using environment + apiKey', () => {
      setApiConfig({ environment: 'sandbox', apiKey: 'my-key' });
      const config = getApiConfig();
      expect(config.baseUrl).toBe('https://ysc-sandbox.fly.dev');
      expect(config.apiKey).toBe('my-key');
    });

    it('sets and returns config when using explicit baseUrl + apiKey', () => {
      setApiConfig({
        baseUrl: 'https://custom.example.com',
        apiKey: 'custom-key',
      });
      const config = getApiConfig();
      expect(config.baseUrl).toBe('https://custom.example.com');
      expect(config.apiKey).toBe('custom-key');
    });

    it('resolves local base URL for iOS when using environment', () => {
      platform.OS = 'ios';
      setApiConfig({ environment: 'local', apiKey: 'k' });
      expect(getApiConfig().baseUrl).toBe('http://localhost:4000');
    });

    it('resolves local base URL for Android when using environment', () => {
      platform.OS = 'android';
      setApiConfig({ environment: 'local', apiKey: 'k' });
      expect(getApiConfig().baseUrl).toBe('http://10.0.2.2:4000');
    });

    it('throws when no config set and no env API key', () => {
      delete process.env.EXPO_PUBLIC_KIOSK_API_KEY;
      delete process.env.KIOSK_API_KEY;
      expect(() => getApiConfig()).toThrow('API key not configured. Call setApiConfig');
    });

    it('returns config from env when no currentConfig but env has key', () => {
      delete process.env.EXPO_PUBLIC_KIOSK_API_KEY;
      process.env.KIOSK_API_KEY = 'env-key';
      const config = getApiConfig();
      expect(config.apiKey).toBe('env-key');
      expect(config.baseUrl).toBe('http://localhost:4000');
    });

    it('prefers EXPO_PUBLIC_KIOSK_API_KEY over KIOSK_API_KEY', () => {
      process.env.EXPO_PUBLIC_KIOSK_API_KEY = 'public-key';
      process.env.KIOSK_API_KEY = 'private-key';
      expect(getApiConfig().apiKey).toBe('public-key');
    });

    it('uses EXPO_PUBLIC_API_ENVIRONMENT when set', () => {
      process.env.EXPO_PUBLIC_KIOSK_API_KEY = 'k';
      process.env.EXPO_PUBLIC_API_ENVIRONMENT = 'prod';
      expect(getApiConfig().baseUrl).toBe('https://ysc.org');
    });

    it('uses EXPO_PUBLIC_API_BASE_URL when set', () => {
      process.env.EXPO_PUBLIC_KIOSK_API_KEY = 'k';
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://custom.org';
      expect(getApiConfig().baseUrl).toBe('https://custom.org');
    });
  });

  describe('isApiConfigured', () => {
    it('returns true when setApiConfig was called', () => {
      setApiConfig({ environment: 'local', apiKey: 'k' });
      expect(isApiConfigured()).toBe(true);
    });

    it('returns false when no config and no env key', () => {
      delete process.env.EXPO_PUBLIC_KIOSK_API_KEY;
      delete process.env.KIOSK_API_KEY;
      expect(isApiConfigured()).toBe(false);
    });

    it('returns true when env has API key', () => {
      process.env.EXPO_PUBLIC_KIOSK_API_KEY = 'k';
      expect(isApiConfigured()).toBe(true);
    });
  });

  describe('getSelectedProperty / setSelectedProperty', () => {
    it('returns DEFAULT_PROPERTY (tahoe) initially', () => {
      expect(getSelectedProperty()).toBe('tahoe');
    });

    it('returns set value after setSelectedProperty', () => {
      setSelectedProperty('clear_lake');
      expect(getSelectedProperty()).toBe('clear_lake');
    });

    it('returns tahoe after setSelectedProperty tahoe', () => {
      setSelectedProperty('clear_lake');
      setSelectedProperty('tahoe');
      expect(getSelectedProperty()).toBe('tahoe');
    });

    it('is reset to DEFAULT_PROPERTY by resetConfigForTesting', () => {
      setSelectedProperty('clear_lake');
      resetConfigForTesting();
      expect(getSelectedProperty()).toBe('tahoe');
    });
  });

  describe('resetConfigForTesting', () => {
    it('clears currentConfig so getApiConfig throws without env key', () => {
      setApiConfig({ environment: 'local', apiKey: 'k' });
      delete process.env.EXPO_PUBLIC_KIOSK_API_KEY;
      delete process.env.KIOSK_API_KEY;
      resetConfigForTesting();
      expect(() => getApiConfig()).toThrow('API key not configured');
    });
  });
});
