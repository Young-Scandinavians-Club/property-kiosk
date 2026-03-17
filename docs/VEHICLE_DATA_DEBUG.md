# Vehicle Data — API Structure

## Summary

The backend API returns vehicles **nested inside `check_ins`**, not at the top level of the booking:

```json
{
  "check_ins": [
    {
      "id": "...",
      "checked_in_at": "...",
      "rules_agreed": true,
      "vehicles": [
        { "id": "...", "type": "Sedan", "color": "Blue", "make": "Toyota Camry" }
      ]
    }
  ]
}
```

## Frontend Fix (Applied)

The frontend now uses `getBookingVehicles(booking)` which:
1. Returns `booking.vehicles` if present (for future API compatibility)
2. Otherwise flattens vehicles from `booking.check_ins[].vehicles`

This allows vehicle icons to display in both the calendar and list views.

## Backend

The ysc.org backend (`BookingsController.calendar`) already preloads `check_ins: :check_in_vehicles` and `BookingsJSON` serializes vehicles inside each check_in. No backend changes needed.
