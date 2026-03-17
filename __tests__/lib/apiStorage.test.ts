/**
 * @jest-environment node
 */

import {
  clearStoredApiConfig,
  loadStoredApiConfig,
  saveStoredApiConfig,
  updateStoredProperty,
} from '@/lib/apiStorage';

const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  getItemAsync: (...args: unknown[]) => mockGetItemAsync(...args),
  setItemAsync: (...args: unknown[]) => mockSetItemAsync(...args),
  deleteItemAsync: (...args: unknown[]) => mockDeleteItemAsync(...args),
}));

const mockSetSelectedProperty = jest.fn();
jest.mock('@/api/config', () => ({
  ...jest.requireActual('@/api/config'),
  setSelectedProperty: (property: string) => mockSetSelectedProperty(property),
}));

describe('lib/apiStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItemAsync.mockResolvedValue(null);
    mockSetItemAsync.mockResolvedValue(undefined);
    mockDeleteItemAsync.mockResolvedValue(undefined);
  });

  describe('loadStoredApiConfig', () => {
    it('returns null when apiKey is missing', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('local')
        .mockResolvedValueOnce('tahoe');
      expect(await loadStoredApiConfig()).toBeNull();
    });

    it('returns null when environment is missing', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce('my-key')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('tahoe');
      expect(await loadStoredApiConfig()).toBeNull();
    });

    it('returns null when environment is invalid', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce('my-key')
        .mockResolvedValueOnce('invalid-env')
        .mockResolvedValueOnce('tahoe');
      expect(await loadStoredApiConfig()).toBeNull();
    });

    it('returns config when all values valid', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce('secret-key')
        .mockResolvedValueOnce('sandbox')
        .mockResolvedValueOnce('clear_lake');
      const result = await loadStoredApiConfig();
      expect(result).toEqual({
        apiKey: 'secret-key',
        environment: 'sandbox',
        property: 'clear_lake',
      });
    });

    it('defaults property to tahoe when property is null', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce('key')
        .mockResolvedValueOnce('local')
        .mockResolvedValueOnce(null);
      const result = await loadStoredApiConfig();
      expect(result).toEqual({
        apiKey: 'key',
        environment: 'local',
        property: 'tahoe',
      });
    });

    it('defaults property to tahoe when property is invalid', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce('key')
        .mockResolvedValueOnce('prod')
        .mockResolvedValueOnce('invalid');
      const result = await loadStoredApiConfig();
      expect(result).toEqual({
        apiKey: 'key',
        environment: 'prod',
        property: 'tahoe',
      });
    });

    it('returns null when getItemAsync throws', async () => {
      mockGetItemAsync.mockRejectedValue(new Error('Storage unavailable'));
      expect(await loadStoredApiConfig()).toBeNull();
    });
  });

  describe('saveStoredApiConfig', () => {
    it('calls setItemAsync for apiKey, environment, and property', async () => {
      await saveStoredApiConfig({
        apiKey: 'k',
        environment: 'local',
        property: 'tahoe',
      });
      expect(mockSetItemAsync).toHaveBeenCalledTimes(3);
      expect(mockSetItemAsync).toHaveBeenCalledWith('kiosk_api_key', 'k');
      expect(mockSetItemAsync).toHaveBeenCalledWith('kiosk_api_environment', 'local');
      expect(mockSetItemAsync).toHaveBeenCalledWith('kiosk_property', 'tahoe');
    });

    it('saves clear_lake property', async () => {
      await saveStoredApiConfig({
        apiKey: 'k',
        environment: 'sandbox',
        property: 'clear_lake',
      });
      expect(mockSetItemAsync).toHaveBeenCalledWith('kiosk_property', 'clear_lake');
    });

    it('does not throw when setItemAsync throws', async () => {
      mockSetItemAsync.mockRejectedValue(new Error('Storage full'));
      await expect(
        saveStoredApiConfig({
          apiKey: 'k',
          environment: 'local',
          property: 'tahoe',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('clearStoredApiConfig', () => {
    it('calls deleteItemAsync for all three keys', async () => {
      await clearStoredApiConfig();
      expect(mockDeleteItemAsync).toHaveBeenCalledTimes(3);
      expect(mockDeleteItemAsync).toHaveBeenCalledWith('kiosk_api_key');
      expect(mockDeleteItemAsync).toHaveBeenCalledWith('kiosk_api_environment');
      expect(mockDeleteItemAsync).toHaveBeenCalledWith('kiosk_property');
    });

    it('does not throw when deleteItemAsync throws', async () => {
      mockDeleteItemAsync.mockRejectedValue(new Error('Storage error'));
      await expect(clearStoredApiConfig()).resolves.not.toThrow();
    });
  });

  describe('updateStoredProperty', () => {
    it('calls setSelectedProperty with the new property', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce('key')
        .mockResolvedValueOnce('local')
        .mockResolvedValueOnce('tahoe');
      await updateStoredProperty('clear_lake');
      expect(mockSetSelectedProperty).toHaveBeenCalledWith('clear_lake');
    });

    it('calls saveStoredApiConfig with merged config when stored config exists', async () => {
      mockGetItemAsync
        .mockResolvedValueOnce('key')
        .mockResolvedValueOnce('local')
        .mockResolvedValueOnce('tahoe');
      await updateStoredProperty('clear_lake');
      expect(mockSetItemAsync).toHaveBeenCalledWith('kiosk_property', 'clear_lake');
      expect(mockSetItemAsync).toHaveBeenCalledWith('kiosk_api_key', 'key');
      expect(mockSetItemAsync).toHaveBeenCalledWith('kiosk_api_environment', 'local');
    });

    it('does not call saveStoredApiConfig when loadStoredApiConfig returns null', async () => {
      mockGetItemAsync.mockResolvedValue(null);
      await updateStoredProperty('clear_lake');
      expect(mockSetSelectedProperty).toHaveBeenCalledWith('clear_lake');
      expect(mockSetItemAsync).not.toHaveBeenCalled();
    });
  });
});
