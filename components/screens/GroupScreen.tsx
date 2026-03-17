import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CheckCircleIcon } from 'react-native-heroicons/solid';

import { getSelectedProperty } from '@/api';
import type { Booking, BookingRoom } from '@/api';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { VehicleIcon } from '@/components/VehicleIcon';
import { useBookingsCalendar } from '@/lib/useBookingsCalendar';
import { usePropertyInfo } from '@/lib/usePropertyInfo';
import { getVehicleColorHex } from '@/lib/vehicleColors';

const MIN_ROW_HEIGHT = 52;
const ROW_LABEL_WIDTH = 120;
const MIN_DAY_WIDTH = 56;
const HEADER_HEIGHT = 44;

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
const SCREEN_INSET = { horizontal: 48, top: 140 };

type TabId = 'calendar' | 'list';

// -----------------------------------------------------------------------------
// Calendar View
// -----------------------------------------------------------------------------

const TAB_BAR_HEIGHT = 52;

function CalendarView({
  bookings,
  rooms,
  dates,
  startDateObj,
  totalDays,
  screenWidth,
  screenHeight,
  topInsetExtra = 0,
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
  const contentHeight = screenHeight - SCREEN_INSET.top - topInsetExtra;
  const dayWidth = Math.max(MIN_DAY_WIDTH, (contentWidth - ROW_LABEL_WIDTH) / totalDays);
  const gridWidth = totalDays * dayWidth;
  const rowHeight = Math.max(
    MIN_ROW_HEIGHT,
    (contentHeight - HEADER_HEIGHT) / Math.max(1, rows.length)
  );
  const halfDayWidth = dayWidth / 2;
  const todayPst = getTodayPst();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        minWidth: contentWidth,
        minHeight: contentHeight,
      }}>
      <View
        style={{
          flexDirection: 'row',
          width: Math.max(ROW_LABEL_WIDTH + gridWidth, contentWidth),
          minHeight: contentHeight,
        }}>
        <View style={{ width: ROW_LABEL_WIDTH, flexShrink: 0 }}>
          <View
            style={{
              height: 44,
              justifyContent: 'center',
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
            }}>
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Room
            </Text>
          </View>
          {rows.map((row) => (
            <View
              key={row.id}
              style={{
                height: rowHeight,
                justifyContent: 'center',
                paddingHorizontal: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
              }}>
              <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                {row.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ width: gridWidth, flexShrink: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              height: HEADER_HEIGHT,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
            }}>
            {dates.map((date) => {
              const isToday = date === todayPst;
              return (
                <View
                  key={date}
                  style={{
                    width: dayWidth,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                    borderLeftWidth: 1,
                    borderLeftColor: '#e5e7eb',
                    backgroundColor: isToday ? '#fef3c7' : undefined,
                  }}>
                  <Text
                    className={`text-center text-xs font-medium ${isToday ? 'text-amber-800' : 'text-gray-700'}`}
                    numberOfLines={2}>
                    {formatShort(date)}
                  </Text>
                </View>
              );
            })}
          </View>

          {rows.map((row, rowIdx) => (
            <View
              key={row.id}
              style={{
                height: rowHeight,
                flexDirection: 'row',
                position: 'relative',
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
              }}>
              {dates.map((date) => {
                const isToday = date === todayPst;
                return (
                  <View
                    key={date}
                    style={{
                      width: dayWidth,
                      borderLeftWidth: 1,
                      borderLeftColor: '#e5e7eb',
                      backgroundColor: isToday ? '#fef3c7' : undefined,
                    }}
                  />
                );
              })}
              {bookings
                .filter((b) => getBookingRow(b, rooms) === rowIdx)
                .map((booking) => {
                  const { colStart, colEnd } = getBookingColumns(booking, startDateObj, totalDays);
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
                        backgroundColor: isBuyout ? '#dcfce7' : '#dbeafe',
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        justifyContent: 'center',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text
                          className="flex-1 text-xs font-medium text-gray-900"
                          numberOfLines={1}>
                          {getMemberDisplayName(booking)}
                        </Text>
                        {booking.checked_in && <CheckCircleIcon color="#22c55e" size={14} />}
                      </View>
                      <Text className="mt-0.5 text-[10px] text-gray-600" numberOfLines={1}>
                        {formatGuestCount(booking)} ·{' '}
                        {formatShortDateRange(booking.checkin_date, booking.checkout_date)}
                      </Text>
                    </View>
                  );
                })}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// -----------------------------------------------------------------------------
// List View
// -----------------------------------------------------------------------------

function BookingListCard({ booking }: { booking: Booking }) {
  return (
    <View className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {getMemberDisplayName(booking)}
          </Text>
          <Text className="mt-0.5 text-sm text-gray-600">
            {formatDate(booking.checkin_date)} – {formatDate(booking.checkout_date)}
          </Text>
          <Text className="mt-0.5 text-sm text-gray-500">
            {formatGuestCount(booking)}
            {booking.rooms?.length ? ` · ${booking.rooms.map((r) => r.name).join(', ')}` : ''}
          </Text>
        </View>
        {booking.checked_in && <CheckCircleIcon color="#22c55e" size={18} />}
      </View>

      {(booking.member?.email || (booking.guests && booking.guests.length > 0)) && (
        <View className="mt-2 border-t border-gray-100 pt-2">
          {booking.member?.email && (
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {booking.member.email}
            </Text>
          )}
          {booking.guests && booking.guests.length > 0 && (
            <Text className="mt-0.5 text-xs text-gray-600">
              Guests: {booking.guests.map((g) => `${g.first_name} ${g.last_name}`).join(', ')}
            </Text>
          )}
        </View>
      )}

      {getBookingVehicles(booking).length > 0 && (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {getBookingVehicles(booking).map((v) => (
            <View
              key={v.id}
              className="flex-row items-center gap-2 rounded-md bg-gray-50 px-2 py-1.5">
              <VehicleIcon type={v.type} size={20} color={getVehicleColorHex(v.color)} />
              <Text className="text-xs text-gray-700">
                {v.color || v.type}
                {v.make ? ` · ${v.make}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
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
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={true}>
      {sortedBookings.length === 0 ? (
        <Text className="py-8 text-center text-gray-500">No reservations in this period.</Text>
      ) : (
        sortedBookings.map((booking) => <BookingListCard key={booking.id} booking={booking} />)
      )}
    </ScrollView>
  );
}

// -----------------------------------------------------------------------------
// Main Screen
// -----------------------------------------------------------------------------

const TABS: { id: TabId; label: string }[] = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'list', label: 'List' },
];

export function GroupScreen() {
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

  // Debug: log when checked-in bookings lack vehicle data (API nests vehicles in check_ins[].vehicles)
  useEffect(() => {
    if (__DEV__ && allBookings.length > 0) {
      const checkedInWithoutVehicles = allBookings.filter(
        (b) => b.checked_in && getBookingVehicles(b).length === 0
      );
      if (checkedInWithoutVehicles.length > 0) {
        console.warn(
          '[GroupScreen] Checked-in bookings without vehicles:',
          checkedInWithoutVehicles.map((b) => ({
            id: b.id,
            reference_id: b.reference_id,
            check_ins: b.check_ins,
          }))
        );
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
      <KioskScreen title="Who I'm staying with">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1b1b52" />
        </View>
      </KioskScreen>
    );
  }

  if (error || !info) {
    return (
      <KioskScreen title="Who I'm staying with">
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-gray-600">
            {error instanceof Error ? error.message : 'Failed to load calendar.'}
          </Text>
          <Pressable onPress={retry} className="rounded-xl bg-brand px-6 py-3 active:opacity-90">
            <Text className="font-medium text-white">Try again</Text>
          </Pressable>
        </View>
      </KioskScreen>
    );
  }

  if (!calendar) {
    return (
      <KioskScreen title="Who I'm staying with">
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-gray-600">No calendar data.</Text>
        </View>
      </KioskScreen>
    );
  }

  return (
    <KioskScreen title="Who I'm staying with">
      <View className="flex-1">
        {/* Tab bar - top, horizontal */}
        <View className="mb-3 flex-row gap-2">
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setSelectedTabId(tab.id)}
              className={`flex-1 rounded-lg px-4 py-3 ${
                selectedTabId === tab.id ? 'bg-brand' : 'bg-gray-100'
              }`}>
              <Text
                className={`text-center text-sm font-medium ${
                  selectedTabId === tab.id ? 'text-white' : 'text-gray-700'
                }`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content - full width below tabs */}
        <View className="min-h-0 flex-1">
          {selectedTabId === 'calendar' && (
            <CalendarView
              bookings={allBookings}
              rooms={rooms}
              dates={dates}
              startDateObj={startDateObj}
              totalDays={totalDays}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
              topInsetExtra={TAB_BAR_HEIGHT}
            />
          )}
          {selectedTabId === 'list' && <BookingListView bookings={allBookings} />}
        </View>
      </View>
    </KioskScreen>
  );
}
