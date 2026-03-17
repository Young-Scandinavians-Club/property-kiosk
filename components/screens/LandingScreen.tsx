import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import {
  CheckCircleIcon,
  InformationCircleIcon,
  UserGroupIcon,
} from 'react-native-heroicons/outline';

import { getSelectedProperty } from '@/api';
import type { RootStackParamList } from '@/components/navigation/types';
import { usePropertyInfo } from '@/lib/usePropertyInfo';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

type LandingRouteName = keyof Pick<RootStackParamList, 'CheckIn' | 'RulesInfo' | 'Group'>;

function ActionButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full max-w-[520px] flex-row items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-5 active:opacity-90">
      <View className="h-6 w-6" style={{ transform: [{ translateY: -1 }] }}>
        {icon}
      </View>
      <Text className="text-lg font-semibold text-white">{label}</Text>
    </Pressable>
  );
}

export function LandingScreen({ navigation }: Props) {
  const go = (to: LandingRouteName) => navigation.navigate(to);
  const property = getSelectedProperty();
  const { data: info } = usePropertyInfo(property);

  return (
    <View className="flex-1 items-center justify-center bg-white px-10">
      <View className="items-center">
        <Image
          source={require('@/assets/ysc_logo.png')}
          accessibilityLabel="Young Scandinavians Club logo"
          resizeMode="contain"
          style={{ width: 240, height: 240 }}
        />
        {info?.name ? (
          <Text className="mt-2 text-2xl font-semibold text-gray-800">{info.name}</Text>
        ) : null}
      </View>

      <View className="mt-10 w-full items-center gap-4">
        <ActionButton
          label="Check in"
          icon={<CheckCircleIcon color="white" />}
          onPress={() => go('CheckIn')}
        />
        <ActionButton
          label="Rules & info"
          icon={<InformationCircleIcon color="white" />}
          onPress={() => go('RulesInfo')}
        />
        <ActionButton
          label="Who I’m staying with"
          icon={<UserGroupIcon color="white" />}
          onPress={() => go('Group')}
        />
      </View>
    </View>
  );
}
