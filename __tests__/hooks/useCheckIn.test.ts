import { act, renderHook } from '@testing-library/react-native/pure';

import { useCheckIn } from '@/hooks/useCheckIn';

const mockBookingsLookup = jest.fn();
const mockCheckIn = jest.fn();

jest.mock('@/api', () => ({
  api: {
    bookingsLookup: (...args: unknown[]) => mockBookingsLookup(...args),
    checkIn: (...args: unknown[]) => mockCheckIn(...args),
  },
}));

const mockBooking = {
  id: '1',
  reference_id: 'BK-ABC123',
  property: 'tahoe' as const,
  status: 'confirmed',
  checkin_date: '2025-03-20',
  checkout_date: '2025-03-22',
  guests_count: 2,
  children_count: 0,
  checked_in: false,
  booking_mode: 'direct',
  member: {
    id: 'm1',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
  },
  rooms: [{ id: 'r1', name: 'Cabin A' }],
  guests: [
    {
      id: 'g1',
      first_name: 'Jane',
      last_name: 'Smith',
      is_primary: true,
    },
  ],
  check_ins: [],
};

describe('useCheckIn', () => {
  beforeEach(() => {
    mockBookingsLookup.mockReset();
    mockCheckIn.mockReset();
  });

  describe('initial state', () => {
    it('starts on search step with empty form', () => {
      const { result } = renderHook(() => useCheckIn());

      expect(result.current.state.step).toBe('search');
      expect(result.current.state.lastName).toBe('');
      expect(result.current.state.searchError).toBeNull();
      expect(result.current.state.isSearching).toBe(false);
      expect(result.current.state.bookings).toEqual([]);
      expect(result.current.state.selectedBooking).toBeNull();
      expect(result.current.state.vehicles).toHaveLength(1);
      expect(result.current.state.vehicles[0]).toEqual({
        type: '',
        color: '',
        make: '',
      });
      expect(result.current.state.rulesAgreed).toBe(false);
      expect(result.current.state.submitError).toBeNull();
      expect(result.current.state.isSubmitting).toBe(false);
    });
  });

  describe('handleSearch', () => {
    it('sets error when lastName is empty', async () => {
      const { result } = renderHook(() => useCheckIn());

      await act(async () => {
        result.current.actions.handleSearch();
      });

      expect(result.current.state.searchError).toBe('Please enter your last name.');
      expect(mockBookingsLookup).not.toHaveBeenCalled();
    });

    it('sets error when lastName is only whitespace', async () => {
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('   ');
      });

      await act(async () => {
        result.current.actions.handleSearch();
      });

      expect(result.current.state.searchError).toBe('Please enter your last name.');
      expect(mockBookingsLookup).not.toHaveBeenCalled();
    });

    it('calls API and transitions to results when bookings found', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });

      await act(async () => {
        result.current.actions.handleSearch();
      });

      expect(mockBookingsLookup).toHaveBeenCalledWith(
        expect.objectContaining({ last_name: 'Smith' })
      );
      expect(result.current.state.step).toBe('results');
      expect(result.current.state.bookings).toHaveLength(1);
      expect(result.current.state.bookings[0]?.member.last_name).toBe('Smith');
    });

    it('filters out already checked-in bookings', async () => {
      const checkedInBooking = { ...mockBooking, checked_in: true };
      mockBookingsLookup.mockResolvedValue({
        data: [mockBooking, checkedInBooking],
      });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });

      await act(async () => {
        result.current.actions.handleSearch();
      });

      expect(result.current.state.bookings).toHaveLength(1);
      expect(result.current.state.bookings[0]?.checked_in).toBe(false);
    });

    it('sets error when no eligible bookings found', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [] });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Nobody');
      });

      await act(async () => {
        result.current.actions.handleSearch();
      });

      expect(result.current.state.searchError).toBe('No reservations found for that name.');
      expect(result.current.state.step).toBe('search');
    });

    it('sets error on API failure', async () => {
      mockBookingsLookup.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });

      await act(async () => {
        result.current.actions.handleSearch();
      });

      expect(result.current.state.searchError).toBe('Network error');
    });
  });

  describe('handleSelectBooking', () => {
    it('transitions to confirm step with selected booking', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });

      act(() => {
        result.current.actions.handleSelectBooking(mockBooking);
      });

      expect(result.current.state.step).toBe('confirm');
      expect(result.current.state.selectedBooking).toEqual(mockBooking);
    });
  });

  describe('handleConfirmDetails', () => {
    it('transitions to vehicles step', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });
      act(() => {
        result.current.actions.handleSelectBooking(mockBooking);
      });

      act(() => {
        result.current.actions.handleConfirmDetails();
      });

      expect(result.current.state.step).toBe('vehicles');
      expect(result.current.state.submitError).toBeNull();
    });
  });

  describe('handleAddVehicle', () => {
    it('adds a new empty vehicle', () => {
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.handleAddVehicle();
      });

      expect(result.current.state.vehicles).toHaveLength(2);
      expect(result.current.state.vehicles[1]).toEqual({
        type: '',
        color: '',
        make: '',
      });
    });
  });

  describe('handleVehicleChange', () => {
    it('updates vehicle type', () => {
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.handleVehicleChange(0, 'type', 'Sedan');
      });

      expect(result.current.state.vehicles[0]?.type).toBe('Sedan');
    });

    it('updates vehicle color', () => {
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.handleVehicleChange(0, 'color', 'Blue');
      });

      expect(result.current.state.vehicles[0]?.color).toBe('Blue');
    });

    it('updates vehicle make', () => {
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.handleVehicleChange(0, 'make', 'Subaru Outback');
      });

      expect(result.current.state.vehicles[0]?.make).toBe('Subaru Outback');
    });
  });

  describe('handleRemoveVehicle', () => {
    it('does not remove when only one vehicle', () => {
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.handleRemoveVehicle(0);
      });

      expect(result.current.state.vehicles).toHaveLength(1);
    });

    it('removes vehicle when multiple exist', () => {
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.handleAddVehicle();
      });
      act(() => {
        result.current.actions.handleVehicleChange(0, 'type', 'Sedan');
      });
      act(() => {
        result.current.actions.handleRemoveVehicle(1);
      });

      expect(result.current.state.vehicles).toHaveLength(1);
      expect(result.current.state.vehicles[0]?.type).toBe('Sedan');
    });
  });

  describe('handleSubmit', () => {
    it('sets error when rules not agreed', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });
      act(() => {
        result.current.actions.handleSelectBooking(mockBooking);
      });
      act(() => {
        result.current.actions.handleConfirmDetails();
      });

      await act(async () => {
        result.current.actions.handleSubmit();
      });

      expect(result.current.state.submitError).toBe(
        'Please agree to the property rules to continue.'
      );
      expect(mockCheckIn).not.toHaveBeenCalled();
    });

    it('calls checkIn API and transitions to success', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      mockCheckIn.mockResolvedValue({
        data: { id: 'ci1', checked_in_at: new Date().toISOString() },
      });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });
      act(() => {
        result.current.actions.handleSelectBooking(mockBooking);
      });
      act(() => {
        result.current.actions.handleConfirmDetails();
      });
      act(() => {
        result.current.actions.setRulesAgreed(true);
      });

      await act(async () => {
        result.current.actions.handleSubmit();
      });

      expect(mockCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          booking_ids: ['BK-ABC123'],
          rules_agreed: true,
        })
      );
      expect(result.current.state.step).toBe('success');
    });

    it('includes vehicles when provided', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      mockCheckIn.mockResolvedValue({
        data: { id: 'ci1', checked_in_at: new Date().toISOString() },
      });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });
      act(() => {
        result.current.actions.handleSelectBooking(mockBooking);
      });
      act(() => {
        result.current.actions.handleConfirmDetails();
      });
      act(() => {
        result.current.actions.handleVehicleChange(0, 'type', 'Sedan');
      });
      act(() => {
        result.current.actions.handleVehicleChange(0, 'color', 'Blue');
      });
      act(() => {
        result.current.actions.setRulesAgreed(true);
      });

      await act(async () => {
        result.current.actions.handleSubmit();
      });

      expect(mockCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          booking_ids: ['BK-ABC123'],
          rules_agreed: true,
          vehicles: [{ type: 'Sedan', color: 'Blue' }],
        })
      );
    });

    it('sets error on checkIn API failure', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      mockCheckIn.mockRejectedValue(new Error('Server error'));
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });
      act(() => {
        result.current.actions.handleSelectBooking(mockBooking);
      });
      act(() => {
        result.current.actions.handleConfirmDetails();
      });
      act(() => {
        result.current.actions.setRulesAgreed(true);
      });

      await act(async () => {
        result.current.actions.handleSubmit();
      });

      expect(result.current.state.submitError).toBe('Server error');
      expect(result.current.state.step).toBe('vehicles');
    });
  });

  describe('handleStartOver', () => {
    it('resets all state to initial values', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });
      act(() => {
        result.current.actions.handleSelectBooking(mockBooking);
      });
      act(() => {
        result.current.actions.handleConfirmDetails();
      });
      act(() => {
        result.current.actions.handleAddVehicle();
      });

      act(() => {
        result.current.actions.handleStartOver();
      });

      expect(result.current.state.step).toBe('search');
      expect(result.current.state.lastName).toBe('');
      expect(result.current.state.searchError).toBeNull();
      expect(result.current.state.bookings).toEqual([]);
      expect(result.current.state.selectedBooking).toBeNull();
      expect(result.current.state.vehicles).toHaveLength(1);
      expect(result.current.state.rulesAgreed).toBe(false);
      expect(result.current.state.submitError).toBeNull();
    });
  });

  describe('setStep', () => {
    it('allows navigating back to search from results', async () => {
      mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
      const { result } = renderHook(() => useCheckIn());

      act(() => {
        result.current.actions.setLastName('Smith');
      });
      await act(async () => {
        result.current.actions.handleSearch();
      });

      act(() => {
        result.current.actions.setStep('search');
      });

      expect(result.current.state.step).toBe('search');
    });
  });
});
