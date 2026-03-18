import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { RootStackParamList } from '@/components/navigation/types';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { LandingScreen } from '@/components/screens/LandingScreen';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  getSelectedProperty: () => 'tahoe' as const,
}));

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

function renderKioskScreen(title: string) {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="CheckIn">{() => <KioskScreen title={title} />}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('KioskScreen', () => {
  it('renders the title', async () => {
    renderKioskScreen('Check in');
    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByText('Check in')).toBeTruthy();
  });

  it('renders the back button with accessibility label', async () => {
    renderKioskScreen('My Screen');
    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByLabelText('Go back')).toBeTruthy();
  });

  it('navigates back when back button is pressed', async () => {
    renderKioskScreen('Check in');
    fireEvent.press(screen.getByText('Check in to cabin'));
    await screen.findByLabelText('Go back');

    fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.getByLabelText('Young Scandinavians Club logo')).toBeTruthy();
  });

  it('renders children content', async () => {
    const ChildContent = () => <Text>Custom child content</Text>;

    render(
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="CheckIn">
            {() => (
              <KioskScreen title="Check in">
                <ChildContent />
              </KioskScreen>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );

    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByText('Custom child content')).toBeTruthy();
  });
});
