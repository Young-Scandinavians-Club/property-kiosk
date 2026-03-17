import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  UserGroupIcon,
} from 'react-native-heroicons/outline';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSelectedProperty } from '@/api';
import type { RootStackParamList } from '@/components/navigation/types';
import { usePropertyInfo } from '@/lib/usePropertyInfo';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

type LandingRouteName = keyof Pick<RootStackParamList, 'CheckIn' | 'RulesInfo' | 'Group'>;

function PrimaryActionButton({
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
      className="w-full flex-row items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-5 shadow-sm active:opacity-90">
      <View className="h-6 w-6">{icon}</View>
      <Text className="text-lg font-bold text-white">{label}</Text>
    </Pressable>
  );
}

function MenuRow({
  label,
  icon,
  onPress,
  isLast = false,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between bg-white px-5 py-4 active:bg-zinc-50">
        <View className="flex-row items-center gap-4">
          <View className="rounded-lg bg-zinc-100 p-2">{icon}</View>
          <Text className="text-base font-semibold text-zinc-800">{label}</Text>
        </View>
        <ChevronRightIcon color="#94a3b8" size={20} />
      </Pressable>
      {!isLast && <View className="ml-[60px] h-[1px] bg-zinc-100" />}
    </>
  );
}

export function LandingScreen({ navigation }: Props) {
  const go = (to: LandingRouteName) => navigation.navigate(to);
  const property = getSelectedProperty();
  const { data: info } = usePropertyInfo(property);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
      <View className="flex-1 px-6 pt-12">
        {/* Header Section */}
        <Animated.View
          entering={FadeInDown.duration(450).springify()}
          className="mb-10 items-center">
          <Image
            source={require('@/assets/ysc_logo.png')}
            accessibilityLabel="Young Scandinavians Club logo"
            resizeMode="contain"
            style={{ width: 160, height: 160 }}
          />
          <View className="mt-6 items-center">
            <Text className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              Welcome to
            </Text>
            <Text className="mt-1 text-center text-3xl font-extrabold text-zinc-900">
              {info?.name || 'The YSC Cabin'}
            </Text>
          </View>
        </Animated.View>

        {/* Primary Action Section */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} className="mb-10 w-full">
          <PrimaryActionButton
            label="Check in to cabin"
            icon={<CheckCircleIcon color="white" />}
            onPress={() => go('CheckIn')}
          />
        </Animated.View>

        {/* Secondary Info Section */}
        <Animated.View entering={FadeIn.delay(200).duration(400)} className="w-full">
          <Text className="mb-3 ml-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Your Stay
          </Text>

          <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <MenuRow
              label="Rules & cabin info"
              icon={<InformationCircleIcon color="#1b1b52" size={24} />}
              onPress={() => go('RulesInfo')}
            />
            <MenuRow
              label="Who I'm staying with"
              icon={<UserGroupIcon color="#1b1b52" size={24} />}
              onPress={() => go('Group')}
              isLast
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
