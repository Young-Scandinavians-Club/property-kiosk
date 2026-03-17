import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type Dimension = number | 'auto' | `${number}%`;

type SkeletonProps = {
  width?: Dimension;
  height?: Dimension;
  borderRadius?: number;
};

export function Skeleton({ width = '100%', height = 16, borderRadius = 6 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#e5e7eb',
        opacity,
      }}
    />
  );
}

export function SkeletonBlock({ lines = 4 }: { lines?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 && lines > 1 ? '75%' : '100%'} />
      ))}
    </View>
  );
}

export function RulesInfoSkeleton() {
  return (
    <View className="flex-1 flex-row" style={{ gap: 12 }}>
      {/* Nav skeleton - fixed width */}
      <View style={{ width: '20%', flexShrink: 0, flexGrow: 0 }} className="gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={36} borderRadius={8} />
        ))}
      </View>
      {/* Content skeleton - fills rest */}
      <View style={{ flex: 1, minWidth: 0 }} className="gap-4">
        <Skeleton height={28} width="60%" />
        <View className="mt-2 gap-3">
          <SkeletonBlock lines={6} />
        </View>
      </View>
    </View>
  );
}
