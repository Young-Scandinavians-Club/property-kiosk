import type { ApiClientConfig } from './client';
import { request } from './client';
import type {
  BookingsCalendarParams,
  BookingsCalendarResponse,
  BookingsListParams,
  BookingsLookupParams,
  BookingsResponse,
  CheckInRequest,
  CheckInResponse,
  EventsListParams,
  EventsResponse,
  PropertyInfoResponse,
  PropertySlug,
} from './types';

const MOBILE_BASE = '/api/v1/mobile';

function toSearchParams(params: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

async function getWithQuery<T>(
  config: ApiClientConfig,
  path: string,
  params: Record<string, string | undefined>
): Promise<T> {
  const searchParams = toSearchParams(params);
  const options = Object.keys(searchParams).length > 0 ? { searchParams } : {};
  return request<T>(config, path, options);
}

/**
 * GET /api/v1/mobile/bookings/lookup
 * Lookup bookings by last name.
 */
export async function bookingsLookup(
  config: ApiClientConfig,
  params: BookingsLookupParams
): Promise<BookingsResponse> {
  const { last_name, property = 'tahoe' } = params;
  return getWithQuery<BookingsResponse>(config, `${MOBILE_BASE}/bookings/lookup`, {
    last_name,
    property,
  });
}

/**
 * GET /api/v1/mobile/bookings
 * List bookings for a property, optional date range.
 */
export async function bookingsList(
  config: ApiClientConfig,
  params: BookingsListParams
): Promise<BookingsResponse> {
  return getWithQuery<BookingsResponse>(config, `${MOBILE_BASE}/bookings`, {
    property: params.property,
    start_date: params.start_date,
    end_date: params.end_date,
  });
}

/**
 * GET /api/v1/mobile/bookings/calendar
 * Calendar view: bookings grouped by date.
 */
export async function bookingsCalendar(
  config: ApiClientConfig,
  params: BookingsCalendarParams
): Promise<BookingsCalendarResponse> {
  return getWithQuery<BookingsCalendarResponse>(config, `${MOBILE_BASE}/bookings/calendar`, {
    property: params.property,
    start_date: params.start_date,
    end_date: params.end_date,
  });
}

/**
 * GET /api/v1/mobile/properties/:property/info
 * Property info (rules, instructions, wifi, door code, etc).
 */
export async function propertyInfo(
  config: ApiClientConfig,
  property: PropertySlug
): Promise<PropertyInfoResponse> {
  return request<PropertyInfoResponse>(config, `${MOBILE_BASE}/properties/${property}/info`);
}

/**
 * GET /api/v1/mobile/events
 * List published events.
 */
export async function eventsList(
  config: ApiClientConfig,
  params: EventsListParams = {}
): Promise<EventsResponse> {
  return getWithQuery<EventsResponse>(config, `${MOBILE_BASE}/events`, {
    page: params.page !== undefined ? String(params.page) : undefined,
    page_size: params.page_size !== undefined ? String(params.page_size) : undefined,
  });
}

/**
 * POST /api/v1/mobile/check-in
 * Tablet/kiosk check-in: creates a check-in for one or more bookings.
 */
export async function checkIn(
  config: ApiClientConfig,
  body: CheckInRequest
): Promise<CheckInResponse> {
  return request<CheckInResponse>(config, `${MOBILE_BASE}/check-in`, {
    method: 'POST',
    body,
  });
}
