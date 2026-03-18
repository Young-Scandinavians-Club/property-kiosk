import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import type { RootStackParamList } from './types';

import { IdleTimeoutProvider } from '@/components/IdleTimeoutProvider';
import { CheckInScreen } from '@/components/screens/CheckInScreen';
import { EventQRScreen } from '@/components/screens/EventQRScreen';
import { GroupScreen } from '@/components/screens/GroupScreen';
import { LandingScreen } from '@/components/screens/LandingScreen';
import { RulesInfoScreen } from '@/components/screens/RulesInfoScreen';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  return (
    // IdleTimeoutProvider wraps NavigationContainer (not the other way around).
    // This ensures navigationRef.reset() is called from outside the container
    // tree, which is the intended usage and prevents navigation context errors.
    <IdleTimeoutProvider navigationRef={navigationRef}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() =>
          console.log(
            '[NAV] NavigationContainer ready — initial route:',
            navigationRef.current?.getCurrentRoute()?.name
          )
        }
        onStateChange={() =>
          console.log(
            '[NAV] state changed — current route:',
            navigationRef.current?.getCurrentRoute()?.name
          )
        }>
        <Stack.Navigator
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 150,
          }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="CheckIn" component={CheckInScreen} />
          <Stack.Screen name="RulesInfo" component={RulesInfoScreen} />
          <Stack.Screen name="Group" component={GroupScreen} />
          <Stack.Screen name="EventQR" component={EventQRScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </IdleTimeoutProvider>
  );
}
