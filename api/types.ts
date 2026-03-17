// =============================================================================
// Shared / primitives
// =============================================================================

/** Supported property slugs for mobile API. */
export type PropertySlug = 'tahoe' | 'clear_lake';

/** ISO 8601 date string (YYYY-MM-DD) as used in API query params and responses. */
export type IsoDateString = string;

/** Booking identifier: reference_id (e.g. "BK-ABC123") or numeric id. */
export type BookingIdInput = string | number;

// =============================================================================
// Error responses (400, 401, 404, 422)
// =============================================================================

/** Validation errors object (422); keys are field names. */
export interface ApiValidationErrors {
  [field: string]: string[] | string | undefined;
}

/** API error payload (400, 401, 404, 422). */
export interface ApiErrorBody {
  /** Human-readable error message. */
  error: string;
  /** Present when error is "validation failed" (422). */
  errors?: ApiValidationErrors;
}

// =============================================================================
// Booking (shared across bookings, lookup, calendar)
// =============================================================================

export interface BookingMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  /** Full URL to profile picture (Gravatar or country default). Load directly in Image. */
  avatar_url?: string;
}

export interface BookingRoom {
  id: string;
  name: string;
}

export interface BookingGuest {
  id: string;
  first_name: string;
  last_name: string;
  is_primary: boolean;
}

/** Single check-in record nested in a booking. */
export interface CheckInRecord {
  id: string;
  checked_in_at: string;
  /** Vehicles from this check-in (API nests vehicles here, not at booking level). */
  vehicles?: readonly CheckInVehicle[];
}

export interface Booking {
  id: string;
  reference_id: string;
  property: PropertySlug;
  status: string;
  checkin_date: IsoDateString;
  checkout_date: IsoDateString;
  guests_count: number;
  children_count: number;
  checked_in: boolean;
  booking_mode: string;
  member: BookingMember;
  rooms: BookingRoom[];
  guests: BookingGuest[];
  check_ins: CheckInRecord[];
  /** Vehicles from check-in; present when booking has been checked in. */
  vehicles?: readonly CheckInVehicle[];
}

// =============================================================================
// GET /bookings/lookup — request & response
// =============================================================================

export interface BookingsLookupParams {
  /** Required. Last name to search. */
  last_name: string;
  /** Optional; defaults to "tahoe". */
  property?: PropertySlug;
}

export interface BookingsResponse {
  data: readonly Booking[];
}

// =============================================================================
// GET /bookings — request & response
// =============================================================================

export interface BookingsListParams {
  property: PropertySlug;
  /** Optional ISO date (YYYY-MM-DD). */
  start_date?: IsoDateString;
  /** Optional ISO date (YYYY-MM-DD). */
  end_date?: IsoDateString;
}

// =============================================================================
// GET /bookings/calendar — request & response
// =============================================================================

export interface BookingsCalendarParams {
  property: PropertySlug;
  /** Optional; defaults to today. */
  start_date?: IsoDateString;
  /** Optional; defaults to today + 30 days. */
  end_date?: IsoDateString;
}

export interface BookingsCalendarResponse {
  /** Map of date (YYYY-MM-DD) to bookings on that date. */
  data: Readonly<Record<string, readonly Booking[]>>;
  start_date: IsoDateString;
  end_date: IsoDateString;
}

// =============================================================================
// GET /properties/:property/info — response
// =============================================================================

export interface PropertyInfoSection {
  title: string;
  content: string;
}

export interface PropertyInfoTab {
  id: string;
  title: string;
  sections: readonly PropertyInfoSection[];
}

export interface PropertyInfo {
  property: PropertySlug;
  name: string;
  content_format: 'markdown';
  check_in_time: string;
  check_out_time: string;
  check_in_instructions: string | null;
  check_out_instructions: string | null;
  notices: string | null;
  wifi_network: string | null;
  wifi_password: string | null;
  door_code: string | null;
  tabs: readonly PropertyInfoTab[];
  /** Rooms for calendar row labels; may be absent for properties without rooms. */
  rooms?: readonly { id: string; name: string }[];
  additional_settings: Readonly<Record<string, unknown>>;
}

export interface PropertyInfoResponse {
  data: PropertyInfo;
}

// =============================================================================
// POST /check-in — request & response
// =============================================================================

export interface CheckInVehicleInput {
  type?: string;
  color?: string;
  make?: string;
}

/** Request body for POST /api/v1/mobile/check-in. */
export interface CheckInRequest {
  property: PropertySlug;
  /** Non-empty list of booking reference_ids or numeric ids. */
  booking_ids: BookingIdInput[];
  /** Must be true to complete check-in. */
  rules_agreed: true;
  vehicles?: CheckInVehicleInput[];
}

export interface CheckInVehicle {
  id: string;
  type: string;
  color: string;
  make: string;
}

export interface CheckInResult {
  id: string;
  checked_in_at: string;
  rules_agreed: boolean;
  booking_ids: string[];
  vehicles: readonly CheckInVehicle[];
}

export interface CheckInResponse {
  data: CheckInResult;
}
