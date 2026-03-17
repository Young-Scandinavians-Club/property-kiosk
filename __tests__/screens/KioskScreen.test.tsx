import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { RootStackParamList } from '@/components/navigation/types';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { LandingScreen } from '@/components/screens/LandingScreen';

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
    fireEvent.press(screen.getByText('Check in'));
    expect(await screen.findByText('Check in')).toBeTruthy();
  });

  it('renders the back button with accessibility label', async () => {
    renderKioskScreen('My Screen');
    fireEvent.press(screen.getByText('Check in'));
    expect(await screen.findByLabelText('Go back')).toBeTruthy();
  });

  it('navigates back when back button is pressed', async () => {
    renderKioskScreen('Check in');
    fireEvent.press(screen.getByText('Check in'));
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

    fireEvent.press(screen.getByText('Check in'));
    expect(await screen.findByText('Custom child content')).toBeTruthy();
  });
});
