/**
 * @jest-environment node
 */

import { api } from '@/api';
import type { PropertySlug } from '@/api/types';

const mockGetApiConfig = jest.fn(() => ({
  baseUrl: 'https://test.example.com',
  apiKey: 'test-key',
}));
const mockGetSelectedProperty = jest.fn<PropertySlug, []>(() => 'tahoe');

jest.mock('@/api/config', () => ({
  ...jest.requireActual('@/api/config'),
  getApiConfig: () => mockGetApiConfig(),
  getSelectedProperty: () => mockGetSelectedProperty(),
}));

const mockBookingsLookup = jest.fn().mockResolvedValue({ data: [] });
const mockBookingsList = jest.fn().mockResolvedValue({ data: [] });
const mockBookingsCalendar = jest
  .fn()
  .mockResolvedValue({ data: {}, start_date: '', end_date: '' });
const mockPropertyInfo = jest.fn().mockResolvedValue({ data: {} });
const mockCheckIn = jest.fn().mockResolvedValue({ data: {} });

jest.mock('@/api/endpoints', () => ({
  bookingsLookup: (...args: unknown[]) => mockBookingsLookup(...args),
  bookingsList: (...args: unknown[]) => mockBookingsList(...args),
  bookingsCalendar: (...args: unknown[]) => mockBookingsCalendar(...args),
  propertyInfo: (...args: unknown[]) => mockPropertyInfo(...args),
  checkIn: (...args: unknown[]) => mockCheckIn(...args),
}));

describe('api (default instance)', () => {
  const testConfig = { baseUrl: 'https://test.example.com', apiKey: 'test-key' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApiConfig.mockReturnValue(testConfig);
    mockGetSelectedProperty.mockReturnValue('tahoe');
  });

  describe('property injection', () => {
    it('bookingsLookup injects getSelectedProperty when property omitted', async () => {
      await api.bookingsLookup({ last_name: 'Smith' });
      expect(mockBookingsLookup).toHaveBeenCalledWith(testConfig, {
        last_name: 'Smith',
        property: 'tahoe',
      });
    });

    it('bookingsLookup uses explicit property when provided', async () => {
      await api.bookingsLookup({ last_name: 'Smith', property: 'clear_lake' });
      expect(mockBookingsLookup).toHaveBeenCalledWith(testConfig, {
        last_name: 'Smith',
        property: 'clear_lake',
      });
    });

    it('bookingsList injects getSelectedProperty when property omitted', async () => {
      await api.bookingsList({ start_date: '2026-01-01', end_date: '2026-01-31' });
      expect(mockBookingsList).toHaveBeenCalledWith(testConfig, {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        property: 'tahoe',
      });
    });

    it('bookingsCalendar injects getSelectedProperty when property omitted', async () => {
      await api.bookingsCalendar({ start_date: '2026-01-01' });
      expect(mockBookingsCalendar).toHaveBeenCalledWith(testConfig, {
        start_date: '2026-01-01',
        property: 'tahoe',
      });
    });

    it('propertyInfo uses getSelectedProperty when called with no arg', async () => {
      await api.propertyInfo();
      expect(mockPropertyInfo).toHaveBeenCalledWith(testConfig, 'tahoe');
    });

    it('propertyInfo uses explicit property when provided', async () => {
      await api.propertyInfo('clear_lake');
      expect(mockPropertyInfo).toHaveBeenCalledWith(testConfig, 'clear_lake');
    });

    it('checkIn injects getSelectedProperty when property omitted in body', async () => {
      await api.checkIn({
        booking_ids: ['BK-123'],
        rules_agreed: true,
      });
      expect(mockCheckIn).toHaveBeenCalledWith(testConfig, {
        booking_ids: ['BK-123'],
        rules_agreed: true,
        property: 'tahoe',
      });
    });

    it('checkIn uses explicit property when provided', async () => {
      await api.checkIn({
        property: 'clear_lake',
        booking_ids: ['BK-123'],
        rules_agreed: true,
      });
      expect(mockCheckIn).toHaveBeenCalledWith(testConfig, {
        property: 'clear_lake',
        booking_ids: ['BK-123'],
        rules_agreed: true,
      });
    });

    it('uses clear_lake when getSelectedProperty returns clear_lake', async () => {
      mockGetSelectedProperty.mockReturnValue('clear_lake');
      await api.bookingsList({});
      expect(mockBookingsList).toHaveBeenCalledWith(testConfig, {
        property: 'clear_lake',
      });
    });
  });
});
