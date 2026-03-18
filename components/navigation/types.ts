import { useNavigation as useNav } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { Event } from '@/api';

export type RootStackParamList = {
  Landing: undefined;
  CheckIn: undefined;
  RulesInfo: undefined;
  Group: undefined;
  EventQR: { event: Event };
};

/** Typed navigation hook for the root stack. */
export function useNavigation() {
  return useNav<NativeStackNavigationProp<RootStackParamList>>();
}
