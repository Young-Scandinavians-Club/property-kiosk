import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { RootStackParamList } from '@/components/navigation/types';
import { CheckInScreen } from '@/components/screens/CheckInScreen';
import { GroupScreen } from '@/components/screens/GroupScreen';
import { LandingScreen } from '@/components/screens/LandingScreen';
import { RulesInfoScreen } from '@/components/screens/RulesInfoScreen';

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

jest.mock('@/lib/useBookingsCalendar', () => ({
  useBookingsCalendar: () => ({
    data: {
      data: {},
      start_date: '2025-03-13',
      end_date: '2025-03-23',
    },
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  }),
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderLanding() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
        <Stack.Screen name="RulesInfo" component={RulesInfoScreen} />
        <Stack.Screen name="Group" component={GroupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LandingScreen', () => {
  it('renders the YSC logo with accessibility label', () => {
    renderLanding();
    expect(screen.getByLabelText('Young Scandinavians Club logo')).toBeTruthy();
  });

  it('renders all three action buttons', () => {
    renderLanding();
    expect(screen.getByText('Check in to cabin')).toBeTruthy();
    expect(screen.getByText('Rules & cabin info')).toBeTruthy();
    expect(screen.getByText(/Who I.m staying with/)).toBeTruthy();
  });

  it('navigates to Check in screen when Check in button is pressed', async () => {
    renderLanding();
    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByText('Check in')).toBeTruthy();
    expect(
      screen.getByText('Enter the last name on your booking to pull up your reservation.')
    ).toBeTruthy();
  });

  it('navigates to Rules & info screen when Rules & cabin info button is pressed', async () => {
    renderLanding();
    fireEvent.press(screen.getByText('Rules & cabin info'));
    expect(await screen.findByText('Rules & info')).toBeTruthy();
    expect(screen.getByText('Overview')).toBeTruthy();
  });

  it('navigates to Group screen when Group button is pressed', async () => {
    renderLanding();
    fireEvent.press(screen.getByText(/Who I.m staying with/));
    expect(await screen.findByText(/Who I.m staying with/)).toBeTruthy();
    expect(screen.getByText('Full Buyout')).toBeTruthy();
  });
});
