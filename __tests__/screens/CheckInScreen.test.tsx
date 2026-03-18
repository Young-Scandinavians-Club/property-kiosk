import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { RootStackParamList } from '@/components/navigation/types';
import { CheckInScreen } from '@/components/screens/CheckInScreen';
import { LandingScreen } from '@/components/screens/LandingScreen';

const mockBookingsLookup = jest.fn();
const mockCheckIn = jest.fn();

jest.mock('@/api', () => ({
  api: {
    bookingsLookup: (...args: unknown[]) => mockBookingsLookup(...args),
    checkIn: (...args: unknown[]) => mockCheckIn(...args),
  },
  getSelectedProperty: () => 'tahoe' as const,
  isApiConfigured: () => false,
}));

jest.mock('@/components/VehicleIcon', () => ({ VehicleIcon: () => null }));

jest.mock('@/lib/usePropertyInfo', () => ({
  usePropertyInfo: () => ({
    data: {
      property: 'tahoe',
      name: 'Test Property',
      content_format: 'markdown',
      check_in_time: '3:00 PM',
      check_out_time: '11:00 AM',
      check_in_instructions: null,
      check_out_instructions: null,
      notices: null,
      wifi_network: null,
      wifi_password: null,
      door_code: null,
      tabs: [{ id: 'overview', title: 'Overview', sections: [] }],
      rooms: [{ id: 'room1', name: 'Room 1' }],
      additional_settings: {},
    },
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  }),
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderCheckIn() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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

describe('CheckInScreen', () => {
  beforeEach(() => {
    mockBookingsLookup.mockReset();
    mockCheckIn.mockReset();
  });

  it('renders the Check in title when navigated from landing', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByText('Check in')).toBeTruthy();
  });

  it('renders the search step with last name input and search button', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));

    expect(await screen.findByPlaceholderText('e.g. Smith')).toBeTruthy();
    expect(await screen.findByText('Search Reservation')).toBeTruthy();
    expect(
      screen.getByText('Enter the last name on your booking to pull up your reservation.')
    ).toBeTruthy();
  });

  it('renders the breadcrumb timeline with all steps', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));

    expect(await screen.findByText('Search')).toBeTruthy();
    expect(screen.getByText('Select')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(screen.getByText('Vehicles')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('renders the back button with correct accessibility', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByLabelText('Go back')).toBeTruthy();
  });

  it('navigates back when back button is pressed', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByPlaceholderText('e.g. Smith')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.getByLabelText('Young Scandinavians Club logo')).toBeTruthy();
    expect(screen.queryByPlaceholderText('e.g. Smith')).toBeNull();
  });

  it('shows error when searching with empty last name', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.press(await screen.findByText('Search Reservation'));

    expect(await screen.findByText('Please enter your last name.')).toBeTruthy();
    expect(mockBookingsLookup).not.toHaveBeenCalled();
  });

  it('shows results when search finds matching bookings', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Smith');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(mockBookingsLookup).toHaveBeenCalledWith(
        expect.objectContaining({ last_name: 'Smith' })
      );
    });

    expect(await screen.findByText('Jane Smith')).toBeTruthy();
    expect(screen.getByText('Select your stay:')).toBeTruthy();
  });

  it('shows error when no reservations found', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Nobody');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(mockBookingsLookup).toHaveBeenCalledWith(
        expect.objectContaining({ last_name: 'Nobody' })
      );
    });

    expect(await screen.findByText('No reservations found for that name.')).toBeTruthy();
  });

  it('allows going back to search from results', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Smith');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Try a different name'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Smith')).toBeTruthy();
      expect(screen.getByText('Search Reservation')).toBeTruthy();
    });
  });

  it('shows confirm step with booking details', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Smith');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Jane Smith'));

    await waitFor(() => {
      expect(screen.getByText('Does this look correct?')).toBeTruthy();
    });

    expect(screen.getByText('Primary Guest')).toBeTruthy();
    expect(screen.getByText('Jane Smith')).toBeTruthy();
    expect(screen.getByText('Looks Good, Continue')).toBeTruthy();
  });

  it('shows vehicles step after confirming', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Smith');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Jane Smith'));

    await waitFor(() => {
      expect(screen.getByText('Looks Good, Continue')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Looks Good, Continue'));

    await waitFor(() => {
      expect(screen.getByText('Vehicle Registration')).toBeTruthy();
    });

    expect(
      screen.getByText('Registering your vehicles helps us manage parking capacity.')
    ).toBeTruthy();
    expect(screen.getByText('+ Add another vehicle')).toBeTruthy();
    expect(
      screen.getByText('I agree to the property rules and acknowledge the checkout requirements.')
    ).toBeTruthy();
  });

  it('disables Complete Check-In until rules are agreed', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Smith');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Jane Smith'));
    fireEvent.press(screen.getByText('Looks Good, Continue'));

    await waitFor(() => {
      expect(screen.getByText('Complete Check-In')).toBeTruthy();
    });

    expect(mockCheckIn).not.toHaveBeenCalled();
  });

  it('allows selecting a booking and completing the full flow', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
    mockCheckIn.mockResolvedValue({
      data: { id: 'ci1', checked_in_at: new Date().toISOString() },
    });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Smith');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Jane Smith'));

    await waitFor(() => {
      expect(screen.getByText('Does this look correct?')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Looks Good, Continue'));

    await waitFor(() => {
      expect(screen.getByText('Vehicle Registration')).toBeTruthy();
    });

    fireEvent.press(
      screen.getByText('I agree to the property rules and acknowledge the checkout requirements.')
    );

    fireEvent.press(screen.getByText('Complete Check-In'));

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          booking_ids: ['BK-ABC123'],
          rules_agreed: true,
        })
      );
    });

    expect(await screen.findByText(/You're all set!/)).toBeTruthy();
    expect(screen.getByText('Return to Home')).toBeTruthy();
    expect(screen.getByText('Check in another guest')).toBeTruthy();
  });

  it('allows adding and removing vehicles', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in to cabin'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Smith'), 'Smith');
    fireEvent.press(screen.getByText('Search Reservation'));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Jane Smith'));
    fireEvent.press(screen.getByText('Looks Good, Continue'));

    await waitFor(() => {
      expect(screen.getByText('Vehicle 1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('+ Add another vehicle'));

    await waitFor(() => {
      expect(screen.getByText('Vehicle 2')).toBeTruthy();
    });

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.press(removeButtons[1]!);

    await waitFor(() => {
      expect(screen.queryByText('Vehicle 2')).toBeNull();
    });
  });
});
