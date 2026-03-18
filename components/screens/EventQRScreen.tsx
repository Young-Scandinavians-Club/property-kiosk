import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ChevronLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
} from 'react-native-heroicons/outline';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiConfig } from '@/api';
import type { RootStackParamList } from '@/components/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventQR'>;

const HERO_HEIGHT = 380;

function formatEventDate(startDate: string | null): string {
  if (!startDate) return '';
  const date = new Date(startDate);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventTime(startTime: string | null): string {
  if (!startTime) return '';
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

function buildEventUrl(referenceId: string | null): string {
  const id = referenceId ?? '';
  try {
    return `${getApiConfig().baseUrl.replace(/\/$/, '')}/events/${id}`;
  } catch {
    return `https://ysc.org/events/${id}`;
  }
}

export function EventQRScreen() {
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const insets = useSafeAreaInsets();
  const { event } = route.params;

  const eventUrl = buildEventUrl(event.reference_id);
  const dateLabel = formatEventDate(event.start_date);
  const timeLabel = formatEventTime(event.start_time);
  const rawPath = event.cover_image?.optimized_path ?? event.cover_image?.thumbnail_path;
  const coverUrl = rawPath ? buildCoverUrl(rawPath) : null;

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero image */}
        <View style={styles.hero}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.heroFallback]} />
          )}
          {/* Bottom fade */}
          <View style={styles.heroGradient} />
        </View>

        {/* Back button floating over image */}
        <Pressable
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          style={[styles.backButton, { top: insets.top + 12 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeftIcon color="#1b1b52" size={20} />
        </Pressable>

        {/* Content */}
        <Animated.View entering={FadeInUp.duration(380).springify()} style={styles.content}>
          {event.selling_fast ? (
            <View style={styles.sellingFastBadge}>
              <Text style={styles.sellingFastText}>Selling fast</Text>
            </View>
          ) : null}

          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <CalendarDaysIcon color="#71717a" size={15} />
              <Text style={styles.metaText}>
                {dateLabel} · {timeLabel}
              </Text>
            </View>
            {event.location_name ? (
              <View style={styles.metaRow}>
                <MapPinIcon color="#71717a" size={15} />
                <Text style={styles.metaText}>{event.location_name}</Text>
              </View>
            ) : null}
            {event.pricing_info ? (
              <View style={styles.metaRow}>
                <TicketIcon color="#2563eb" size={15} />
                <Text style={styles.priceText}>{event.pricing_info.display_text}</Text>
              </View>
            ) : null}
          </View>

          {event.description ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.description}>{event.description}</Text>
            </>
          ) : null}

          <View style={styles.divider} />

          {/* QR section */}
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.qrSection}>
            <View style={styles.qrCard}>
              <QRCode value={eventUrl} size={200} backgroundColor="white" color="#0f172a" />
            </View>
            <Text style={styles.qrLabel}>Scan to view details &amp; buy tickets</Text>
            <Text style={styles.qrUrl}>{eventUrl}</Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  hero: { height: HERO_HEIGHT },
  heroFallback: { backgroundColor: '#1e293b' },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  sellingFastBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  sellingFastText: { fontSize: 11, fontWeight: '700', color: '#92400e' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 32,
  },
  metaList: { marginTop: 14, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: '#71717a' },
  priceText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  qrSection: { alignItems: 'center' },
  qrCard: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrLabel: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  qrUrl: {
    marginTop: 6,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
