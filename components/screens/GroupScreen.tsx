import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CalendarIcon, ListBulletIcon } from 'react-native-heroicons/outline';
import { CheckCircleIcon } from 'react-native-heroicons/solid';

import { getApiConfig, getSelectedProperty } from '@/api';
import type { Booking, BookingRoom } from '@/api';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { VehicleIcon } from '@/components/VehicleIcon';
import { useBookingsCalendar } from '@/lib/useBookingsCalendar';
import { usePropertyInfo } from '@/lib/usePropertyInfo';
import { getVehicleColorHex } from '@/lib/vehicleColors';

const MIN_ROW_HEIGHT = 62;
const ROW_LABEL_WIDTH = 105;
const MIN_DAY_WIDTH = 52;
const HEADER_HEIGHT = 40;

/** Today's date in PST (America/Los_Angeles) as YYYY-MM-DD. */
function getTodayPst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })}\n${d.getMonth() + 1}/${d.getDate()}`;
}

function formatShortDateRange(checkin: string, checkout: string): string {
  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  return `${d1.getMonth() + 1}/${d1.getDate()}–${d2.getMonth() + 1}/${d2.getDate()}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  const endD = new Date(end);
  while (d <= endD) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function getBookingRow(booking: Booking, rooms: readonly BookingRoom[]): number {
  if (!booking.rooms?.length || booking.booking_mode === 'buyout') {
    return 0;
  }
  const roomId = booking.rooms[0]?.id;
  if (!roomId) return 0;
  const idx = rooms.findIndex((r) => r.id === roomId);
  return idx >= 0 ? idx + 1 : 0;
}

function getBookingColumns(
  booking: Booking,
  startDate: Date,
  totalDays: number
): { colStart: number; colEnd: number } {
  const checkin = new Date(booking.checkin_date);
  const checkout = new Date(booking.checkout_date);
  const dayIndex = (d: Date) => Math.floor((d.getTime() - startDate.getTime()) / 86400000);

  const checkinIdx = Math.max(0, Math.min(dayIndex(checkin), totalDays - 1));
  const checkoutIdx = Math.max(0, Math.min(dayIndex(checkout), totalDays - 1));

  const colStart = checkinIdx * 2 + 2;
  const colEnd = Math.min(checkoutIdx * 2 + 2, totalDays * 2 + 1);

  return { colStart, colEnd };
}

function getMemberDisplayName(booking: Booking): string {
  const m = booking.member;
  if (!m) return 'Unknown';
  if (m.first_name && m.last_name) {
    return `${m.first_name} ${m.last_name}`;
  }
  return m.email ?? 'Unknown';
}

function getInitials(booking: Booking): string {
  const m = booking.member;
  if (!m?.first_name || !m?.last_name) return '?';
  return `${m.first_name[0]}${m.last_name[0]}`.toUpperCase();
}

/**
 * Fix avatar URLs that reference localhost - on Android emulator and physical devices,
 * localhost is unreachable. Replace with the API base host (e.g. 10.0.2.2 for Android emulator).
 */
function fixAvatarUrlForDevice(url: string | undefined): string | undefined {
  if (!url || !url.includes('localhost')) return url;
  try {
    const { baseUrl } = getApiConfig();
    const match = baseUrl.match(/^(https?:\/\/)([^/:]+)(:\d+)?/);
    const host = match?.[2];
    if (host && host !== 'localhost') {
      return url.replace(/localhost/g, host);
    }
  } catch {
    // Config not ready; use Platform fallback for Android emulator
    if (Platform.OS === 'android') {
      return url.replace(/localhost/g, '10.0.2.2');
    }
  }
  return url;
}

/** Avatar: profile image when avatar_url exists, else initials. */
function MemberAvatar({
  booking,
  size,
  isBuyout = false,
  variant = 'solid',
}: {
  booking: Booking;
  size: number;
  isBuyout?: boolean;
  /** 'solid' = filled bg + white text (calendar); 'soft' = tinted bg + brand text (list) */
  variant?: 'solid' | 'soft';
}) {
  const [imageError, setImageError] = useState(false);
  const rawUrl = booking.member?.avatar_url;
  const avatarUrl = fixAvatarUrlForDevice(rawUrl);
  const showImage = avatarUrl && !imageError;
  const initials = getInitials(booking);

  const handleImageError = useCallback(() => {
    if (__DEV__ && avatarUrl) {
      console.warn('[MemberAvatar] Image failed to load:', avatarUrl);
    }
    setImageError(true);
  }, [avatarUrl]);

  if (showImage) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        }}>
        <Image
          source={{ uri: avatarUrl }}
          onError={handleImageError}
          resizeMode="cover"
          style={{
            width: size,
            height: size,
          }}
          accessibilityLabel={`${getMemberDisplayName(booking)} profile`}
        />
      </View>
    );
  }

  const isSoft = variant === 'soft';
  return (
    <View
      className={`items-center justify-center rounded-full ${
        isSoft ? 'border border-brand/20 bg-brand/10' : isBuyout ? 'bg-green-600' : 'bg-brand'
      }`}
      style={{ width: size, height: size }}>
      <Text
        className={`font-bold ${isSoft ? 'text-brand' : 'text-white'}`}
        style={{ fontSize: size * 0.4 }}>
        {initials}
      </Text>
    </View>
  );
}

/** Vehicles from check-in. API returns them nested in check_ins[].vehicles. */
function getBookingVehicles(
  booking: Booking
): readonly { id: string; type: string; color: string; make: string }[] {
  if (booking.vehicles && booking.vehicles.length > 0) {
    return booking.vehicles;
  }
  return booking.check_ins?.flatMap((ci) => ci.vehicles ?? []) ?? [];
}

function formatGuestCount(booking: Booking): string {
  const adults = booking.guests_count ?? 0;
  const children = booking.children_count ?? 0;
  if (children === 0) {
    return `${adults} adult${adults !== 1 ? 's' : ''}`;
  }
  return `${adults} adult${adults !== 1 ? 's' : ''}, ${children} child${children !== 1 ? 'ren' : ''}`;
}

/** Approximate space taken by KioskScreen header and padding. */
const SCREEN_INSET = { horizontal: 40, top: 145 };

type TabId = 'calendar' | 'list';

const TAB_BAR_HEIGHT = 48;

// -----------------------------------------------------------------------------
// Calendar View
// -----------------------------------------------------------------------------

function CalendarView({
  bookings,
  rooms,
  dates,
  startDateObj,
  totalDays,
  screenWidth,
  screenHeight: _screenHeight,
  topInsetExtra: _topInsetExtra = 0,
}: {
  bookings: Booking[];
  rooms: readonly BookingRoom[];
  dates: string[];
  startDateObj: Date;
  totalDays: number;
  screenWidth: number;
  screenHeight: number;
  topInsetExtra?: number;
}) {
  const rows = useMemo(
    () => [
      { id: 'buyout', label: 'Full Buyout', isBuyout: true },
      ...rooms.map((r) => ({ id: r.id, label: r.name, isBuyout: false })),
    ],
    [rooms]
  );

  const contentWidth = screenWidth - SCREEN_INSET.horizontal;
  const dayWidth = Math.max(MIN_DAY_WIDTH, (contentWidth - ROW_LABEL_WIDTH) / totalDays);
  const gridWidth = totalDays * dayWidth;
  const rowHeight = MIN_ROW_HEIGHT;
  const halfDayWidth = dayWidth / 2;
  const todayPst = getTodayPst();

  const tableWidth = Math.max(ROW_LABEL_WIDTH + gridWidth, contentWidth);

  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ minWidth: contentWidth }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={Platform.OS === 'android'}
          contentContainerStyle={{ minWidth: tableWidth }}>
          <View style={{ width: tableWidth }}>
            {/* Header row */}
            <View
              style={{
                flexDirection: 'row',
                height: HEADER_HEIGHT,
                borderBottomWidth: 1,
                borderBottomColor: '#e2e8f0',
              }}>
              <View
                style={{
                  width: ROW_LABEL_WIDTH,
                  justifyContent: 'center',
                  paddingHorizontal: 10,
                  backgroundColor: '#f8fafc',
                  borderRightWidth: 1,
                  borderRightColor: '#e2e8f0',
                }}>
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Room
                </Text>
              </View>
              {dates.map((date) => {
                const isToday = date === todayPst;
                return (
                  <View
                    key={date}
                    style={{
                      width: dayWidth,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderLeftWidth: 1,
                      borderLeftColor: '#f1f5f9',
                      backgroundColor: isToday ? '#fef3c7' : '#ffffff',
                    }}>
                    <Text
                      className={`text-center text-xs font-semibold ${isToday ? 'text-amber-700' : 'text-slate-500'}`}
                      numberOfLines={2}>
                      {formatShort(date)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Data rows */}
            {rows.map((row, rowIdx) => (
              <View
                key={row.id}
                style={{
                  height: rowHeight,
                  flexDirection: 'row',
                  borderBottomWidth: 1,
                  borderBottomColor: '#f1f5f9',
                }}>
                {/* Room label */}
                <View
                  style={{
                    width: ROW_LABEL_WIDTH,
                    height: rowHeight,
                    justifyContent: 'center',
                    paddingHorizontal: 10,
                    backgroundColor: '#f8fafc',
                    borderRightWidth: 1,
                    borderRightColor: '#e2e8f0',
                  }}>
                  <Text className="text-sm font-bold text-slate-700" numberOfLines={2}>
                    {row.label}
                  </Text>
                </View>

                {/* Grid cells + booking blocks */}
                <View
                  style={{
                    width: gridWidth,
                    height: rowHeight,
                    flexDirection: 'row',
                    position: 'relative',
                  }}>
                  {dates.map((date) => {
                    const isToday = date === todayPst;
                    return (
                      <View
                        key={date}
                        style={{
                          width: dayWidth,
                          borderLeftWidth: 1,
                          borderLeftColor: '#f8fafc',
                          backgroundColor: isToday ? '#fefce8' : '#ffffff',
                        }}
                      />
                    );
                  })}

                  {/* Render Booking Blocks */}
                  {bookings
                    .filter((b) => getBookingRow(b, rooms) === rowIdx)
                    .map((booking) => {
                      const { colStart, colEnd } = getBookingColumns(
                        booking,
                        startDateObj,
                        totalDays
                      );
                      const span = colEnd - colStart;
                      const left = (colStart - 1) * halfDayWidth;
                      const width = span * halfDayWidth;
                      const isBuyout = row.isBuyout;

                      return (
                        <View
                          key={booking.id}
                          style={{
                            position: 'absolute',
                            left,
                            top: 4,
                            width: Math.max(width - 4, 20),
                            height: rowHeight - 8,
                            backgroundColor: isBuyout ? '#dcfce7' : '#e0f2fe',
                            borderColor: isBuyout ? '#bbf7d0' : '#bae6fd',
                            borderWidth: 1,
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            justifyContent: 'center',
                          }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MemberAvatar booking={booking} size={20} isBuyout={isBuyout} />
                            <Text
                              className={`flex-1 text-xs font-bold ${isBuyout ? 'text-green-900' : 'text-slate-900'}`}
                              numberOfLines={1}>
                              {getMemberDisplayName(booking)}
                            </Text>
                            {booking.checked_in && (
                              <CheckCircleIcon color={isBuyout ? '#16a34a' : '#0284c7'} size={14} />
                            )}
                          </View>
                          {width > 100 && (
                            <Text
                              className={`mt-1 text-[10px] font-medium ${isBuyout ? 'text-green-800' : 'text-slate-600'}`}
                              numberOfLines={1}>
                              {formatGuestCount(booking)} ·{' '}
                              {formatShortDateRange(booking.checkin_date, booking.checkout_date)}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

// -----------------------------------------------------------------------------
// List View
// -----------------------------------------------------------------------------

function BookingListCard({ booking }: { booking: Booking }) {
  return (
    <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header: Avatar & Name */}
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 flex-row items-center gap-3">
          <MemberAvatar booking={booking} size={48} variant="soft" />
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900">
              {getMemberDisplayName(booking)}
            </Text>
            <Text className="mt-0.5 text-sm font-medium text-slate-500">
              {formatDate(booking.checkin_date)} – {formatDate(booking.checkout_date)}
            </Text>
          </View>
        </View>
        {booking.checked_in && (
          <View className="flex-row items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5">
            <CheckCircleIcon color="#16a34a" size={16} />
            <Text className="text-xs font-bold text-green-700">Checked In</Text>
          </View>
        )}
      </View>

      {/* Details Section */}
      <View className="mt-4 gap-3 border-t border-slate-100 pt-4">
        <View className="flex-row justify-between">
          <Text className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Stay Details
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-base text-slate-700">
            <Text className="font-semibold text-slate-900">Guests:</Text>{' '}
            {formatGuestCount(booking)}
          </Text>
          {booking.rooms?.length > 0 && (
            <Text className="text-base text-slate-700">
              <Text className="font-semibold text-slate-900">Rooms:</Text>{' '}
              {booking.rooms.map((r) => r.name).join(', ')}
            </Text>
          )}
        </View>

        {/* Vehicles */}
        {getBookingVehicles(booking).length > 0 && (
          <View className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Registered Vehicles
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {getBookingVehicles(booking).map((v) => (
                <View
                  key={v.id}
                  className="flex-row items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <VehicleIcon type={v.type} size={20} color={getVehicleColorHex(v.color)} />
                  <Text className="text-sm font-semibold text-slate-700">
                    {v.color || v.type}
                    {v.make ? ` · ${v.make}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function BookingListView({ bookings }: { bookings: Booking[] }) {
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const d1 = new Date(a.checkin_date).getTime();
      const d2 = new Date(b.checkin_date).getTime();
      if (d1 !== d2) return d1 - d2;
      return a.reference_id.localeCompare(b.reference_id);
    });
  }, [bookings]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>
      {sortedBookings.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <CalendarIcon color="#94a3b8" size={32} />
          </View>
          <Text className="text-lg font-medium text-slate-500">
            No reservations in this period.
          </Text>
        </View>
      ) : (
        sortedBookings.map((booking) => <BookingListCard key={booking.id} booking={booking} />)
      )}
    </ScrollView>
  );
}

// -----------------------------------------------------------------------------
// Main Screen
// -----------------------------------------------------------------------------

export function GroupScreen() {
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [selectedTabId, setSelectedTabId] = useState<TabId>('calendar');
  const property = getSelectedProperty();
  const {
    data: info,
    error: infoError,
    isLoading: infoLoading,
    mutate: mutateInfo,
  } = usePropertyInfo(property);

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 3);
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }, []);

  const {
    data: calendar,
    error: calendarError,
    isLoading: calendarLoading,
    mutate: mutateCalendar,
  } = useBookingsCalendar(property, startDate, endDate);

  const rooms = useMemo(() => info?.rooms ?? [], [info?.rooms]);
  const dates = useMemo(
    () => (calendar ? generateDateRange(calendar.start_date, calendar.end_date) : []),
    [calendar]
  );
  const totalDays = dates.length;

  const allBookings = useMemo(() => {
    if (!calendar) return [];
    const map = new Map<string, Booking>();
    Object.values(calendar.data)
      .flat()
      .forEach((b) => map.set(b.id, b));
    return Array.from(map.values());
  }, [calendar]);

  const startDateObj = useMemo(
    () => (calendar ? new Date(calendar.start_date) : new Date()),
    [calendar]
  );

  // Debug: verify API returns avatar_url (check console in __DEV__)
  useEffect(() => {
    if (__DEV__ && allBookings.length > 0) {
      const withAvatar = allBookings.filter((b) => b.member?.avatar_url);
      if (withAvatar.length > 0) {
        console.log(
          '[GroupScreen] Bookings with avatar_url:',
          withAvatar.length,
          'of',
          allBookings.length
        );
      } else {
        console.log('[GroupScreen] No avatar_url in any booking - API may not return it yet');
      }
    }
  }, [allBookings]);

  const isLoading = infoLoading || calendarLoading;
  const error = infoError || calendarError;

  const retry = useCallback(() => {
    mutateInfo();
    mutateCalendar();
  }, [mutateInfo, mutateCalendar]);

  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
      } else {
        retry();
      }
    }, [retry])
  );

  if (isLoading) {
    return (
      <KioskScreen title="Who I'm staying with" navigation={navigation}>
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      </KioskScreen>
    );
  }

  if (error || !info || !calendar) {
    return (
      <KioskScreen title="Who I'm staying with" navigation={navigation}>
        <View className="flex-1 items-center justify-center gap-6 bg-slate-50 px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Text className="text-2xl">⚠️</Text>
          </View>
          <Text className="text-center text-lg text-slate-600">
            {error instanceof Error ? error.message : 'Failed to load calendar data.'}
          </Text>
          <Pressable
            onPress={retry}
            className="rounded-xl bg-brand px-8 py-4 shadow-sm active:opacity-90">
            <Text className="text-lg font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      </KioskScreen>
    );
  }

  return (
    <KioskScreen title="Who I'm staying with" navigation={navigation}>
      <View className="flex-1 bg-slate-50 p-4">
        {/* iOS-Style Segmented Control */}
        <View className="shadow-inner mb-4 flex-row self-center rounded-lg bg-slate-200/60 p-1">
          <Pressable
            onPress={() => setSelectedTabId('calendar')}
            className={`flex-row items-center gap-2 rounded-md px-6 py-2.5 ${
              selectedTabId === 'calendar' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}>
            <CalendarIcon size={18} color={selectedTabId === 'calendar' ? '#0f172a' : '#64748b'} />
            <Text
              className={`text-sm font-bold ${
                selectedTabId === 'calendar' ? 'text-slate-900' : 'text-slate-500'
              }`}>
              Calendar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTabId('list')}
            className={`flex-row items-center gap-2 rounded-md px-6 py-2.5 ${
              selectedTabId === 'list' ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}>
            <ListBulletIcon size={18} color={selectedTabId === 'list' ? '#0f172a' : '#64748b'} />
            <Text
              className={`text-sm font-bold ${
                selectedTabId === 'list' ? 'text-slate-900' : 'text-slate-500'
              }`}>
              List
            </Text>
          </Pressable>
        </View>

        {/* Content - full width below tabs */}
        <View className="min-h-0 flex-1">
          {selectedTabId === 'calendar' ? (
            <View className="flex-1">
              <CalendarView
                bookings={allBookings}
                rooms={rooms}
                dates={dates}
                startDateObj={startDateObj}
                totalDays={totalDays}
                screenWidth={screenWidth}
                screenHeight={screenHeight}
                topInsetExtra={TAB_BAR_HEIGHT + 44}
              />
            </View>
          ) : (
            <View className="w-full max-w-4xl flex-1 self-center">
              <BookingListView bookings={allBookings} />
            </View>
          )}
        </View>
      </View>
    </KioskScreen>
  );
}
