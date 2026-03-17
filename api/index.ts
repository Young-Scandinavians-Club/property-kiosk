import { getApiConfig, getSelectedProperty } from './config';
import {
  bookingsLookup as _bookingsLookup,
  bookingsList as _bookingsList,
  bookingsCalendar as _bookingsCalendar,
  propertyInfo as _propertyInfo,
  checkIn as _checkIn,
} from './endpoints';
import type {
  BookingsCalendarParams,
  BookingsListParams,
  BookingsLookupParams,
  CheckInRequest,
  PropertySlug,
} from './types';

export { request, ApiClientError } from './client';
export type { ApiClientConfig, RequestOptions } from './client';
export {
  API_BASE_URLS,
  DEFAULT_PROPERTY,
  getApiConfig,
  getBaseUrlForEnvironment,
  getSelectedProperty,
  isApiConfigured,
  setApiConfig,
  setSelectedProperty,
} from './config';
export type { ApiEnvironment, SetApiConfigInput } from './config';
export { bookingsLookup, bookingsList, bookingsCalendar, propertyInfo, checkIn } from './endpoints';

/** Params for api.bookingsList / api.bookingsCalendar; property defaults to getSelectedProperty(). */
export type BookingsListParamsOptional = Omit<BookingsListParams, 'property'> & {
  property?: PropertySlug;
};
export type BookingsCalendarParamsOptional = Omit<BookingsCalendarParams, 'property'> & {
  property?: PropertySlug;
};
/** Body for api.checkIn; property defaults to getSelectedProperty(). */
export type CheckInRequestOptional = Omit<CheckInRequest, 'property'> & { property?: PropertySlug };

/** Default API instance. Injects getSelectedProperty() when property is omitted so all endpoints use the configured property. */
export const api = {
  bookingsLookup: (params: BookingsLookupParams) =>
    _bookingsLookup(getApiConfig(), {
      ...params,
      property: params.property ?? getSelectedProperty(),
    }),
  bookingsList: (params: BookingsListParamsOptional) =>
    _bookingsList(getApiConfig(), {
      ...params,
      property: params.property ?? getSelectedProperty(),
    }),
  bookingsCalendar: (params: BookingsCalendarParamsOptional) =>
    _bookingsCalendar(getApiConfig(), {
      ...params,
      property: params.property ?? getSelectedProperty(),
    }),
  propertyInfo: (property?: PropertySlug) =>
    _propertyInfo(getApiConfig(), property ?? getSelectedProperty()),
  checkIn: (body: CheckInRequestOptional) =>
    _checkIn(getApiConfig(), {
      ...body,
      property: body.property ?? getSelectedProperty(),
    }),
};

export type {
  ApiErrorBody,
  ApiValidationErrors,
  Booking,
  BookingGuest,
  BookingIdInput,
  BookingMember,
  BookingRoom,
  BookingsCalendarParams,
  BookingsCalendarResponse,
  BookingsListParams,
  BookingsLookupParams,
  BookingsResponse,
  CheckInRecord,
  CheckInRequest,
  CheckInResponse,
  CheckInResult,
  CheckInVehicle,
  CheckInVehicleInput,
  IsoDateString,
  PropertyInfo,
  PropertyInfoResponse,
  PropertyInfoSection,
  PropertyInfoTab,
  PropertySlug,
} from './types';
