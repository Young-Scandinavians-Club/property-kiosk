import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from 'react-native-heroicons/solid';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { api } from '@/api';
import type { Booking, CheckInVehicleInput } from '@/api';
import type { RootStackParamList } from '@/components/navigation/types';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { VehicleIcon } from '@/components/VehicleIcon';

type Step = 'search' | 'results' | 'confirm' | 'vehicles' | 'success';

interface VehicleForm {
  type: string;
  color: string;
  make: string;
}

const emptyVehicle: VehicleForm = { type: '', color: '', make: '' };

const VEHICLE_TYPES: { value: string; label: string }[] = [
  { value: 'Sedan', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Hatchback', label: 'Hatchback' },
  { value: 'Pickup Truck', label: 'Pickup Truck' },
  { value: 'Van', label: 'Van' },
];

const VEHICLE_COLORS: { value: string; hex: string }[] = [
  { value: 'White', hex: '#ffffff' },
  { value: 'Gray', hex: '#6b7280' },
  { value: 'Black', hex: '#1f2937' },
  { value: 'Silver', hex: '#9ca3af' },
  { value: 'Blue', hex: '#3b82f6' },
  { value: 'Red', hex: '#ef4444' },
  { value: 'Green', hex: '#22c55e' },
  { value: 'Brown', hex: '#92400e' },
  { value: 'Beige', hex: '#d4b896' },
  { value: 'Gold', hex: '#f59e0b' },
  { value: 'Orange', hex: '#f97316' },
  { value: 'Yellow', hex: '#eab308' },
  { value: 'Purple', hex: '#a855f7' },
  { value: 'Pink', hex: '#ec4899' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CheckInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
          type: field === 'type' ? value : current.type,
          color: field === 'color' ? value : current.color,
          make: field === 'make' ? value : current.make,
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

  return (
    <KioskScreen title="Check in">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {step === 'search' && (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="mb-2 text-center text-base text-gray-600">
              Enter the last name on your booking to find your reservation.
            </Text>
            <View className="mt-4 w-full max-w-md">
              <TextInput
                value={lastName}
                onChangeText={(t) => {
                  setLastName(t);
                  setSearchError(null);
                }}
                placeholder="Last name"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSearching}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900"
                accessibilityLabel="Last name"
              />
              {searchError ? (
                <Text className="mt-2 text-sm text-red-600">{searchError}</Text>
              ) : null}
              <Pressable
                onPress={handleSearch}
                disabled={isSearching}
                className="mt-4 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-4 active:opacity-90 disabled:opacity-70">
                {isSearching ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MagnifyingGlassIcon color="white" size={22} />
                    <Text className="text-lg font-semibold text-white">Search</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {step === 'results' && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}>
            <Text className="mb-4 text-base text-gray-600">Select your reservation:</Text>
            <View className="gap-3">
              {bookings.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => handleSelectBooking(b)}
                  className="rounded-xl border border-gray-200 bg-white p-4 active:opacity-90">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-lg font-semibold text-gray-900">
                        {b.member.first_name} {b.member.last_name}
                      </Text>
                      <Text className="mt-1 text-sm text-gray-500">
                        {formatDate(b.checkin_date)} – {formatDate(b.checkout_date)}
                      </Text>
                      <Text className="mt-1 text-sm text-gray-600">
                        {b.rooms.map((r) => r.name).join(', ')} • Ref: {b.reference_id}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setStep('search')} className="mt-6 self-center">
              <Text className="text-base font-medium text-brand">Search again</Text>
            </Pressable>
          </ScrollView>
        )}

        {step === 'confirm' && selectedBooking && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}>
            <Text className="mb-4 text-base text-gray-600">Confirm your booking details:</Text>
            <View className="gap-4">
              <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Primary guest
                </Text>
                <Text className="mt-1 text-lg font-semibold text-gray-900">
                  {selectedBooking.member.first_name} {selectedBooking.member.last_name}
                </Text>
                {selectedBooking.member.email ? (
                  <Text className="mt-1 text-sm text-gray-600">{selectedBooking.member.email}</Text>
                ) : null}
              </View>

              {selectedBooking.guests.length > 0 && (
                <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    All guests ({selectedBooking.guests.length})
                  </Text>
                  <View className="mt-2 gap-1.5">
                    {selectedBooking.guests.map((g) => (
                      <Text key={g.id} className="text-base text-gray-900">
                        {g.first_name} {g.last_name}
                        {g.is_primary ? ' (primary)' : ''}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Party size
                </Text>
                <Text className="mt-1 text-base text-gray-900">
                  {selectedBooking.guests_count} adult
                  {selectedBooking.guests_count !== 1 ? 's' : ''}
                  {selectedBooking.children_count > 0
                    ? `, ${selectedBooking.children_count} child${selectedBooking.children_count !== 1 ? 'ren' : ''}`
                    : ''}
                </Text>
              </View>

              <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Dates
                </Text>
                <Text className="mt-1 text-base text-gray-900">
                  {formatDate(selectedBooking.checkin_date)} –{' '}
                  {formatDate(selectedBooking.checkout_date)}
                </Text>
              </View>

              <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Rooms ({selectedBooking.rooms.length})
                </Text>
                <View className="mt-2 gap-1.5">
                  {selectedBooking.rooms.map((r) => (
                    <Text key={r.id} className="text-base text-gray-900">
                      {r.name}
                    </Text>
                  ))}
                </View>
              </View>

              <View className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Reference
                </Text>
                <Text className="mt-1 font-mono text-base text-gray-900">
                  {selectedBooking.reference_id}
                </Text>
              </View>
            </View>
            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => setStep('results')}
                className="flex-1 items-center rounded-2xl border border-gray-300 bg-white py-4 active:opacity-90">
                <Text className="text-lg font-semibold text-gray-700">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDetails}
                className="flex-1 items-center rounded-2xl bg-brand py-4 active:opacity-90">
                <Text className="text-lg font-semibold text-white">Continue</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === 'vehicles' && selectedBooking && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}>
            <Text className="mb-4 text-base text-gray-600">
              Add vehicle information (optional):
            </Text>
            <View className="gap-4">
              {vehicles.map((v, i) => (
                <View key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-gray-700">Vehicle {i + 1}</Text>
                    {vehicles.length > 1 && (
                      <Pressable onPress={() => handleRemoveVehicle(i)} className="py-1">
                        <Text className="text-sm font-medium text-red-600">Remove</Text>
                      </Pressable>
                    )}
                  </View>
                  <View className="mt-3 gap-4">
                    <View>
                      <Text className="mb-2 text-xs font-medium text-gray-500">Type</Text>
                      <View className="flex-row flex-wrap gap-3">
                        {VEHICLE_TYPES.map(({ value, label }) => (
                          <Pressable
                            key={value}
                            onPress={() => handleVehicleChange(i, 'type', value)}
                            className={`flex-row items-center gap-3 rounded-xl border px-5 py-4 ${
                              v.type === value
                                ? 'border-brand bg-brand'
                                : 'border-gray-200 bg-white'
                            }`}>
                            <VehicleIcon
                              type={value as 'Sedan' | 'SUV' | 'Hatchback' | 'Pickup Truck' | 'Van'}
                              size={32}
                              color={v.type === value ? 'white' : '#6b7280'}
                            />
                            <Text
                              className={`text-base font-medium ${
                                v.type === value ? 'text-white' : 'text-gray-700'
                              }`}>
                              {label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text className="mb-2 text-xs font-medium text-gray-500">Color</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {VEHICLE_COLORS.map(({ value, hex }) => (
                          <Pressable
                            key={value}
                            onPress={() => handleVehicleChange(i, 'color', value)}
                            className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
                              v.color === value
                                ? 'border-2 border-brand'
                                : 'border-gray-200 bg-white'
                            }`}>
                            <View
                              style={{ backgroundColor: hex }}
                              className="h-5 w-5 rounded-full border border-gray-200"
                            />
                            <Text
                              className={`text-sm font-medium ${
                                v.color === value ? 'text-brand' : 'text-gray-700'
                              }`}>
                              {value}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text className="mb-1 text-xs text-gray-500">Make & model</Text>
                      <TextInput
                        value={v.make}
                        onChangeText={(t) => handleVehicleChange(i, 'make', t)}
                        placeholder="Make & model"
                        placeholderTextColor="#9ca3af"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base text-gray-900"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              onPress={handleAddVehicle}
              className="mt-2 flex-row items-center gap-2 self-start">
              <Text className="text-base font-medium text-brand">+ Add another vehicle</Text>
            </Pressable>

            <Pressable
              onPress={() => setRulesAgreed((a) => !a)}
              className="mt-6 flex-row items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <View
                className={`h-6 w-6 items-center justify-center rounded border-2 ${
                  rulesAgreed ? 'border-brand bg-brand' : 'border-gray-300'
                }`}>
                {rulesAgreed ? <CheckCircleSolidIcon color="white" size={16} /> : null}
              </View>
              <Text className="flex-1 text-base text-gray-700">
                I agree to the property rules and check-in instructions.
              </Text>
            </Pressable>

            {submitError ? <Text className="mt-3 text-sm text-red-600">{submitError}</Text> : null}

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => setStep('confirm')}
                disabled={isSubmitting}
                className="flex-1 items-center rounded-2xl border border-gray-300 bg-white py-4 active:opacity-90 disabled:opacity-70">
                <Text className="text-lg font-semibold text-gray-700">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!rulesAgreed || isSubmitting}
                className="flex-1 items-center rounded-2xl bg-brand py-4 active:opacity-90 disabled:opacity-70">
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-semibold text-white">Complete check-in</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        )}

        {step === 'success' && (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 items-center justify-center">
            <Animated.View entering={FadeInDown.duration(500).springify()} className="items-center">
              <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-100">
                <CheckCircleSolidIcon color="#22c55e" size={56} />
              </View>
              <Text className="text-2xl font-bold text-gray-900">Check-in complete!</Text>
              <Text className="mt-2 text-center text-base text-gray-600">
                Welcome! Your reservation has been confirmed.
              </Text>
            </Animated.View>
            <View className="mt-12 flex-row gap-4">
              <Pressable
                onPress={() => navigation.navigate('Landing')}
                className="rounded-2xl border border-gray-300 bg-white px-6 py-4 active:opacity-90">
                <Text className="text-lg font-semibold text-gray-700">Return home</Text>
              </Pressable>
              <Pressable
                onPress={handleStartOver}
                className="rounded-2xl bg-brand px-6 py-4 active:opacity-90">
                <Text className="text-lg font-semibold text-white">Check in another guest</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </KioskScreen>
  );
}
