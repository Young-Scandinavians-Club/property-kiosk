import useSWR from 'swr';

import { api } from '@/api';
import type { BookingsCalendarResponse, IsoDateString, PropertySlug } from '@/api';

export function useBookingsCalendar(
  property: PropertySlug,
  startDate: IsoDateString,
  endDate: IsoDateString
) {
  const { data, error, isLoading, mutate } = useSWR(
    ['bookingsCalendar', property, startDate, endDate],
    () => api.bookingsCalendar({ property, start_date: startDate, end_date: endDate })
  );

  return {
    data: data as BookingsCalendarResponse | undefined,
    error,
    isLoading,
    mutate,
  };
}
