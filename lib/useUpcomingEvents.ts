import useSWR from 'swr';

import { api, isApiConfigured } from '@/api';
import type { Event } from '@/api';

const MAX_UPCOMING = 5;

/** Normalise a date string to a local-midnight Date so date-only strings
 *  (e.g. "2026-04-01") are not accidentally shifted into the past by UTC offset. */
function toLocalDate(dateStr: string): Date {
  // If the string already carries a time+timezone component, use it as-is.
  if (dateStr.includes('T')) return new Date(dateStr);
  // "YYYY-MM-DD" → parse as local midnight to avoid UTC offset issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function useUpcomingEvents() {
  const { data, error, isLoading } = useSWR(
    isApiConfigured() ? 'upcomingEvents' : null,
    () => api.eventsList({ page: 1, page_size: 20 }).then((res) => res.data),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      onError: (err) => console.error('[useUpcomingEvents] fetch error:', err),
    }
  );

  const now = new Date();

  const upcoming = data
    ? [...data]
        .filter((e) => e.start_date != null && toLocalDate(e.start_date) >= now)
        .sort((a, b) => toLocalDate(a.start_date!).getTime() - toLocalDate(b.start_date!).getTime())
        .slice(0, MAX_UPCOMING)
    : undefined;

  return {
    data: upcoming as readonly Event[] | undefined,
    error,
    isLoading,
  };
}
