import { useNavigation } from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';

type KioskScreenProps = PropsWithChildren<{
  title: string;
}>;

export function KioskScreen({ title, children }: KioskScreenProps) {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <View className="flex-row items-center">
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeftIcon color="#1b1b52" />
        </Pressable>

        <Text className="ml-4 text-2xl font-bold text-brand">{title}</Text>
      </View>

      <View className="mt-8 flex-1">{children}</View>
    </View>
  );
}
