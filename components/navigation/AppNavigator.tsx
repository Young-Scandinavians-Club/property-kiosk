import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import type { RootStackParamList } from './types';

import { IdleTimeoutProvider } from '@/components/IdleTimeoutProvider';
import { CheckInScreen } from '@/components/screens/CheckInScreen';
import { GroupScreen } from '@/components/screens/GroupScreen';
import { LandingScreen } from '@/components/screens/LandingScreen';
import { RulesInfoScreen } from '@/components/screens/RulesInfoScreen';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  return (
    <IdleTimeoutProvider navigationRef={navigationRef}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="CheckIn" component={CheckInScreen} />
          <Stack.Screen name="RulesInfo" component={RulesInfoScreen} />
          <Stack.Screen name="Group" component={GroupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </IdleTimeoutProvider>
  );
}
