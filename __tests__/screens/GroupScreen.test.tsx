import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { RootStackParamList } from '@/components/navigation/types';
import { GroupScreen } from '@/components/screens/GroupScreen';
import { LandingScreen } from '@/components/screens/LandingScreen';
import { useBookingsCalendar } from '@/lib/useBookingsCalendar';
import { usePropertyInfo } from '@/lib/usePropertyInfo';

jest.mock('@/components/VehicleIcon', () => ({ VehicleIcon: () => null }));

jest.mock('@/lib/usePropertyInfo', () => ({
  usePropertyInfo: jest.fn(),
}));

jest.mock('@/lib/useBookingsCalendar', () => ({
  useBookingsCalendar: jest.fn(),
}));

const mockPropertyInfoWithRooms = {
  property: 'tahoe' as const,
  name: 'Lake Tahoe Cabin',
  content_format: 'markdown' as const,
  check_in_time: '3:00 PM',
  check_out_time: '11:00 AM',
  check_in_instructions: null,
  check_out_instructions: null,
  notices: null,
  wifi_network: null,
  wifi_password: null,
  door_code: null,
  tabs: [] as const,
  rooms: [
    { id: 'room1', name: 'Room 1' },
    { id: 'room2', name: 'Room 2' },
  ],
  additional_settings: {},
};

const mockCalendarResponse = {
  data: {
    '2025-03-15': [
      {
        id: 'booking1',
        reference_id: 'YSC-123',
        property: 'tahoe' as const,
        status: 'complete',
        checkin_date: '2025-03-15',
        checkout_date: '2025-03-18',
        guests_count: 4,
        children_count: 0,
        booking_mode: 'room',
        checked_in: true,
        member: {
          id: 'm1',
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        rooms: [{ id: 'room1', name: 'Room 1' }],
        guests: [],
        check_ins: [
          {
            id: 'ci1',
            checked_in_at: '2025-03-15T15:00:00Z',
            vehicles: [{ id: 'v1', type: 'Sedan', color: 'Blue', make: 'Toyota Camry' }],
          },
        ],
      },
    ],
  },
  start_date: '2025-03-13',
  end_date: '2025-03-23',
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderGroup() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Group" component={GroupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('GroupScreen', () => {
  beforeEach(() => {
    (usePropertyInfo as jest.Mock).mockReturnValue({
      data: mockPropertyInfoWithRooms,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    });
    (useBookingsCalendar as jest.Mock).mockReturnValue({
      data: mockCalendarResponse,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    });
  });

  it('renders the Group screen title', async () => {
    renderGroup();
    fireEvent.press(screen.getByText(/Who I.m staying with/));
    expect(await screen.findByText(/Who I.m staying with/)).toBeTruthy();
  });

  it('renders the calendar with Full Buyout and room rows', async () => {
    renderGroup();
    fireEvent.press(screen.getByText(/Who I.m staying with/));

    expect(await screen.findByText('Full Buyout')).toBeTruthy();
    expect(screen.getByText('Room 1')).toBeTruthy();
    expect(screen.getByText('Room 2')).toBeTruthy();
  });

  it('renders the Room column header', async () => {
    renderGroup();
    fireEvent.press(screen.getByText(/Who I.m staying with/));

    expect(await screen.findByText('Room')).toBeTruthy();
  });

  it('renders the back button with correct accessibility', async () => {
    renderGroup();
    fireEvent.press(screen.getByText(/Who I.m staying with/));
    expect(await screen.findByLabelText('Go back')).toBeTruthy();
  });

  it('navigates back when back button is pressed', async () => {
    renderGroup();
    fireEvent.press(screen.getByText(/Who I.m staying with/));
    await screen.findByText('Full Buyout');

    fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.getByLabelText('Young Scandinavians Club logo')).toBeTruthy();
    expect(screen.queryByText('Full Buyout')).toBeNull();
  });

  it('shows loading spinner when loading', () => {
    (usePropertyInfo as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      mutate: jest.fn(),
    });
    (useBookingsCalendar as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      mutate: jest.fn(),
    });

    render(
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Group" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Group" component={GroupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    expect(screen.getByText(/Who I.m staying with/)).toBeTruthy();
    expect(screen.queryByText('Full Buyout')).toBeNull();
  });

  it('switches to List tab and shows booking details', async () => {
    renderGroup();
    fireEvent.press(screen.getByText(/Who I.m staying with/));
    await screen.findByText('Full Buyout');

    fireEvent.press(screen.getByText('List'));
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText(/4 adults/)).toBeTruthy();
  });

  it('shows vehicle info when vehicles are in check_ins', async () => {
    renderGroup();
    fireEvent.press(screen.getByText(/Who I.m staying with/));
    await screen.findByText('Full Buyout');

    fireEvent.press(screen.getByText('List'));
    expect(screen.getByText(/Blue/)).toBeTruthy();
    expect(screen.getByText(/Toyota Camry/)).toBeTruthy();
  });

  it('shows error message when API fails', () => {
    (usePropertyInfo as jest.Mock).mockReturnValue({
      data: undefined,
      error: new Error('Network request failed'),
      isLoading: false,
      mutate: jest.fn(),
    });
    (useBookingsCalendar as jest.Mock).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    });

    render(
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Group" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Group" component={GroupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    expect(screen.getByText('Network request failed')).toBeTruthy();
  });
});
