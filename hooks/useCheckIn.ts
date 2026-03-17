import { useCallback, useState } from 'react';

import { api } from '@/api';
import type { Booking, CheckInVehicleInput } from '@/api';

export type Step = 'search' | 'results' | 'confirm' | 'vehicles' | 'success';

export interface VehicleForm {
  type: string;
  color: string;
  make: string;
}

const emptyVehicle: VehicleForm = { type: '', color: '', make: '' };

export function useCheckIn() {
  const [step, setStep] = useState<Step>('search');
  const [lastName, setLastName] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [vehicles, setVehicles] = useState<VehicleForm[]>([{ ...emptyVehicle }]);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = lastName.trim();
    if (!trimmed) {
      setSearchError('Please enter your last name.');
      return;
    }
    setSearchError(null);
    setIsSearching(true);
    try {
      const res = await api.bookingsLookup({ last_name: trimmed });
      const eligible = res.data.filter((b) => !b.checked_in);
      setBookings(eligible);
      if (eligible.length === 0) {
        setSearchError('No reservations found for that name.');
      } else {
        setStep('results');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [lastName]);

  const handleSelectBooking = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setStep('confirm');
  }, []);

  const handleConfirmDetails = useCallback(() => {
    setStep('vehicles');
    setSubmitError(null);
  }, []);

  const handleAddVehicle = useCallback(() => {
    setVehicles((v) => [...v, { ...emptyVehicle }]);
  }, []);

  const handleVehicleChange = useCallback(
    (index: number, field: keyof VehicleForm, value: string) => {
      setVehicles((v) => {
        const next = [...v];
        const current = next[index]!;
        next[index] = {
          ...current,
          [field]: value,
        };
        return next;
      });
    },
    []
  );

  const handleRemoveVehicle = useCallback(
    (index: number) => {
      if (vehicles.length <= 1) return;
      setVehicles((v) => v.filter((_, i) => i !== index));
    },
    [vehicles.length]
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedBooking || !rulesAgreed) {
      setSubmitError('Please agree to the property rules to continue.');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const vehicleInputs: CheckInVehicleInput[] = vehicles
        .map((v) => {
          const type = v.type.trim();
          const color = v.color.trim();
          const make = v.make.trim();
          if (!type && !color && !make) return null;
          const obj: CheckInVehicleInput = {};
          if (type) obj.type = type;
          if (color) obj.color = color;
          if (make) obj.make = make;
          return obj;
        })
        .filter((v): v is CheckInVehicleInput => v !== null);

      await api.checkIn({
        booking_ids: [selectedBooking.reference_id],
        rules_agreed: true,
        ...(vehicleInputs.length > 0 && { vehicles: vehicleInputs }),
      });
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Check-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedBooking, rulesAgreed, vehicles]);

  const handleStartOver = useCallback(() => {
    setStep('search');
    setLastName('');
    setSearchError(null);
    setBookings([]);
    setSelectedBooking(null);
    setVehicles([{ ...emptyVehicle }]);
    setRulesAgreed(false);
    setSubmitError(null);
  }, []);

  return {
    state: {
      step,
      lastName,
      searchError,
      isSearching,
      bookings,
      selectedBooking,
      vehicles,
      rulesAgreed,
      submitError,
      isSubmitting,
    },
    actions: {
      setStep,
      setLastName,
      setSearchError,
      setRulesAgreed,
      handleSearch,
      handleSelectBooking,
      handleConfirmDetails,
      handleAddVehicle,
      handleVehicleChange,
      handleRemoveVehicle,
      handleSubmit,
      handleStartOver,
    },
  };
}
