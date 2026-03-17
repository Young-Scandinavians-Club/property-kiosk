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
}));

jest.mock('@/components/VehicleIcon', () => ({ VehicleIcon: () => null }));

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

  it('renders the Check in title', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));
    expect(await screen.findByText('Check in')).toBeTruthy();
  });

  it('renders the search step with last name input and search button', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));

    expect(await screen.findByPlaceholderText('Last name')).toBeTruthy();
    expect(await screen.findByText('Search')).toBeTruthy();
    expect(
      screen.getByText('Enter the last name on your booking to find your reservation.')
    ).toBeTruthy();
  });

  it('renders the back button with correct accessibility', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));
    expect(await screen.findByLabelText('Go back')).toBeTruthy();
  });

  it('navigates back when back button is pressed', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));
    expect(await screen.findByPlaceholderText('Last name')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.getByLabelText('Young Scandinavians Club logo')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Last name')).toBeNull();
  });

  it('shows error when searching with empty last name', async () => {
    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));
    fireEvent.press(await screen.findByText('Search'));

    expect(await screen.findByText('Please enter your last name.')).toBeTruthy();
    expect(mockBookingsLookup).not.toHaveBeenCalled();
  });

  it('shows results when search finds matching bookings', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));
    fireEvent.changeText(screen.getByPlaceholderText('Last name'), 'Smith');
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(mockBookingsLookup).toHaveBeenCalledWith({ last_name: 'Smith' });
    });

    expect(await screen.findByText('Jane Smith')).toBeTruthy();
    expect(screen.getByText(/BK-ABC123/)).toBeTruthy();
    expect(screen.getByText('Select your reservation:')).toBeTruthy();
  });

  it('shows error when no reservations found', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [] });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));
    fireEvent.changeText(screen.getByPlaceholderText('Last name'), 'Nobody');
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(mockBookingsLookup).toHaveBeenCalledWith({ last_name: 'Nobody' });
    });

    expect(await screen.findByText('No reservations found for that name.')).toBeTruthy();
  });

  it('allows selecting a booking and completing the flow', async () => {
    mockBookingsLookup.mockResolvedValue({ data: [mockBooking] });
    mockCheckIn.mockResolvedValue({ data: { id: 'ci1', checked_in_at: new Date().toISOString() } });

    renderCheckIn();
    fireEvent.press(screen.getByText('Check in'));
    fireEvent.changeText(screen.getByPlaceholderText('Last name'), 'Smith');
    fireEvent.press(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Jane Smith'));

    await waitFor(() => {
      expect(screen.getByText('Confirm your booking details:')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Add vehicle information (optional):')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('I agree to the property rules and check-in instructions.'));

    fireEvent.press(screen.getByText('Complete check-in'));

    await waitFor(() => {
      expect(mockCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          booking_ids: ['BK-ABC123'],
          rules_agreed: true,
        })
      );
    });

    expect(await screen.findByText('Check-in complete!')).toBeTruthy();
    expect(screen.getByText('Check in another guest')).toBeTruthy();
  });
});
