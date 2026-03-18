import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  TicketIcon,
} from 'react-native-heroicons/outline';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiConfig, getSelectedProperty } from '@/api';
import type { Event } from '@/api';
import { useNavigation } from '@/components/navigation/types';
import { usePropertyInfo } from '@/lib/usePropertyInfo';
import { useUpcomingEvents } from '@/lib/useUpcomingEvents';

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

function formatEventDate(startDate: string): string {
  const date = new Date(startDate);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(startTime: string): string {
  const parts = startTime.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinute = minutes > 0 ? `:${String(minutes).padStart(2, '0')}` : '';
  return `${displayHour}${displayMinute} ${period}`;
}

function buildCoverUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  try {
    const base = getApiConfig().baseUrl.replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch {
    return path;
  }
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const dateLabel = formatEventDate(event.start_date);
  const timeLabel = formatEventTime(event.start_time);
  const rawPath = event.cover_image?.optimized_path ?? event.cover_image?.thumbnail_path;
  const coverUrl = rawPath ? buildCoverUrl(rawPath) : null;

  return (
    <Pressable
      onPress={onPress}
      style={styles.eventCard}
      className="overflow-hidden rounded-2xl shadow-md active:opacity-90">
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.eventCardFallback]} />
      )}

      <View style={[StyleSheet.absoluteFillObject, styles.eventCardScrim]} />
      <View style={styles.eventCardGradient} />

      <View style={styles.eventCardContent}>
        {event.selling_fast ? (
          <View style={styles.sellingFastBadge}>
            <Text style={styles.sellingFastText}>Selling fast</Text>
          </View>
        ) : null}

        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <CalendarDaysIcon color="rgba(255,255,255,0.8)" size={11} />
          <Text style={styles.metaText} numberOfLines={1}>
            {dateLabel} · {timeLabel}
          </Text>
        </View>

        {event.pricing_info ? (
          <View style={styles.metaRow}>
            <TicketIcon color="rgba(255,255,255,0.9)" size={11} />
            <Text style={styles.priceText}>{event.pricing_info.display_text}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function EventCardSkeleton() {
  return <View style={[styles.eventCard, styles.eventCardSkeleton]} className="rounded-2xl" />;
}

const CARD_SIZE = 240;

const styles = StyleSheet.create({
  eventCard: { width: CARD_SIZE, height: CARD_SIZE },
  eventCardFallback: { backgroundColor: '#1e293b' },
  eventCardScrim: { backgroundColor: 'rgba(0,0,0,0.08)' },
  eventCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CARD_SIZE * 0.32,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  eventCardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 3,
  },
  eventCardSkeleton: { backgroundColor: '#e4e4e7' },
  sellingFastBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fbbf24',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  sellingFastText: { fontSize: 9, fontWeight: '700', color: '#78350f' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: 'white', lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', flexShrink: 1 },
  priceText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },
  eventStrip: { marginHorizontal: -24 },
  eventStripContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
});

function UpcomingEventsSection({
  events,
  isLoading,
  error,
  onEventPress,
}: {
  events: readonly Event[] | undefined;
  isLoading: boolean;
  error: unknown;
  onEventPress: (event: Event) => void;
}) {
  if (!isLoading && !error && (!events || events.length === 0)) return null;

  return (
    <Animated.View entering={FadeIn.delay(300).duration(400)} className="mb-10 w-full">
      <Text className="mb-3 ml-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        Upcoming YSC Events
      </Text>
      {error ? (
        <View className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-500">Could not load events</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.eventStrip}
          contentContainerStyle={styles.eventStripContent}>
          {isLoading ? (
            <>
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </>
          ) : (
            (events ?? []).map((event) => (
              <EventCard key={event.id} event={event} onPress={() => onEventPress(event)} />
            ))
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
}

export function LandingScreen() {
  const navigation = useNavigation();
  const property = getSelectedProperty();
  const { data: info } = usePropertyInfo(property);
  const {
    data: upcomingEvents,
    isLoading: eventsLoading,
    error: eventsError,
  } = useUpcomingEvents();

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-12 pb-8"
        showsVerticalScrollIndicator={false}>
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
              {info?.name ?? 'YSC Property'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(100).duration(400)} className="mb-10 w-full">
          <PrimaryActionButton
            label="Check in to cabin"
            icon={<CheckCircleIcon color="white" size={24} />}
            onPress={() => navigation.navigate('CheckIn')}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).duration(400)} className="mb-10 w-full">
          <Text className="mb-3 ml-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            More options
          </Text>
          <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <MenuRow
              label="Who I'm staying with"
              icon={<ClipboardDocumentCheckIcon color="#71717a" size={20} />}
              onPress={() => navigation.navigate('Group')}
            />
            <MenuRow
              label="Rules & cabin info"
              icon={<InformationCircleIcon color="#71717a" size={20} />}
              onPress={() => navigation.navigate('RulesInfo')}
              isLast
            />
          </View>
        </Animated.View>

        <UpcomingEventsSection
          events={upcomingEvents}
          isLoading={eventsLoading}
          error={eventsError}
          onEventPress={(event) => navigation.navigate('EventQR', { event })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
