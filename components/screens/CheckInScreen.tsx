import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChevronRightIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from 'react-native-heroicons/solid';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';

import type { RootStackParamList } from '@/components/navigation/types';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { VehicleIcon } from '@/components/VehicleIcon';
import { useCheckIn } from '@/hooks/useCheckIn';
import type { Step, VehicleForm } from '@/hooks/useCheckIn';

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

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string | ReactNode;
  isLast?: boolean;
}) {
  return (
    <>
      <View className="flex-row items-start justify-between px-5 py-4">
        <Text className="text-base font-medium text-zinc-500">{label}</Text>
        <View className="flex-1 items-end pl-4">
          {typeof value === 'string' ? (
            <Text className="text-right text-base font-semibold text-zinc-900">{value}</Text>
          ) : (
            value
          )}
        </View>
      </View>
      {!isLast && <View className="mx-5 h-[1px] bg-zinc-100" />}
    </>
  );
}

const CHECK_IN_STEPS: { id: Step; label: string }[] = [
  { id: 'search', label: 'Search' },
  { id: 'results', label: 'Select' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'success', label: 'Done' },
];

function CheckInBreadcrumb({ currentStep }: { currentStep: Step }) {
  const currentIndex = CHECK_IN_STEPS.findIndex((s) => s.id === currentStep);

  const stepElements = CHECK_IN_STEPS.map(({ id, label }, i) => {
    const isCompleted = i < currentIndex;
    const isCurrent = i === currentIndex;
    return (
      <View key={id} className="flex-row items-center">
        <View className="flex-row items-center gap-2">
          <View
            className={`h-8 w-8 items-center justify-center rounded-full ${
              isCompleted
                ? 'bg-brand'
                : isCurrent
                  ? 'border-2 border-brand bg-brand'
                  : 'border-2 border-zinc-200 bg-white'
            }`}>
            {isCompleted ? (
              <CheckCircleSolidIcon color="white" size={18} />
            ) : (
              <Text
                className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>
                {i + 1}
              </Text>
            )}
          </View>
          <Text
            className={`text-xs font-medium ${
              isCompleted ? 'text-zinc-500' : isCurrent ? 'text-brand' : 'text-zinc-400'
            }`}
            numberOfLines={1}>
            {label}
          </Text>
        </View>
        {i < CHECK_IN_STEPS.length - 1 && (
          <ChevronRightIcon
            color={i < currentIndex ? '#1b1b52' : '#d1d5db'}
            size={16}
            style={{ marginHorizontal: 4 }}
          />
        )}
      </View>
    );
  });

  return (
    <View className="mb-6 items-center justify-center">
      <View className="flex-row flex-wrap items-center justify-center gap-x-1 gap-y-2">
        {stepElements}
      </View>
    </View>
  );
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

interface VehicleFormCardProps {
  index: number;
  vehicle: VehicleForm;
  canRemove: boolean;
  onChange: (index: number, field: keyof VehicleForm, value: string) => void;
  onRemove: (index: number) => void;
}

function VehicleFormCard({ index, vehicle, canRemove, onChange, onRemove }: VehicleFormCardProps) {
  return (
    <View className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-center justify-between border-b border-zinc-100 pb-4">
        <Text className="text-base font-bold text-zinc-900">Vehicle {index + 1}</Text>
        {canRemove && (
          <Pressable onPress={() => onRemove(index)} hitSlop={10}>
            <Text className="text-sm font-bold text-red-500">Remove</Text>
          </Pressable>
        )}
      </View>

      <View className="flex-col">
        <View className="mb-6 overflow-hidden">
          <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {VEHICLE_TYPES.map(({ value, label }) => (
              <Pressable
                key={value}
                onPress={() => onChange(index, 'type', value)}
                className={`min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border-2 py-2 ${
                  vehicle.type === value ? 'border-brand bg-zinc-50' : 'border-zinc-100 bg-zinc-50'
                }`}>
                <VehicleIcon
                  type={value as 'Sedan' | 'SUV' | 'Hatchback' | 'Pickup Truck' | 'Van'}
                  size={24}
                  color={vehicle.type === value ? '#1b1b52' : '#94a3b8'}
                />
                <Text
                  className={`text-xs font-bold ${vehicle.type === value ? 'text-brand' : 'text-zinc-500'}`}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mb-6 overflow-hidden">
          <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Color
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {VEHICLE_COLORS.map(({ value, hex }) => {
              const isSelected = vehicle.color === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => onChange(index, 'color', value)}
                  style={[
                    styles.colorCircle,
                    isSelected ? styles.colorCircleSelected : styles.colorCircleUnselected,
                  ]}>
                  <View
                    style={{ backgroundColor: hex }}
                    className="h-8 w-8 rounded-full border border-zinc-200"
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Make & Model
          </Text>
          <TextInput
            value={vehicle.make}
            onChangeText={(t) => onChange(index, 'make', t)}
            placeholder="e.g. Subaru Outback"
            placeholderTextColor="#94a3b8"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-900"
          />
        </View>
      </View>
    </View>
  );
}

export function CheckInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, actions } = useCheckIn();

  return (
    <KioskScreen title="Check in">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <View className="pb-2 pt-3">
          <CheckInBreadcrumb currentStep={state.step} />
        </View>

        {state.step === 'search' && (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-1 items-center justify-center px-6 pb-32">
            <View className="mb-8 h-28 w-28 items-center justify-center rounded-full bg-brand/10">
              <MagnifyingGlassIcon color="#1b1b52" size={64} />
            </View>
            <Text className="mb-6 text-center text-lg text-zinc-600">
              Enter the last name on your booking to pull up your reservation.
            </Text>
            <View className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <TextInput
                value={state.lastName}
                onChangeText={(t) => {
                  actions.setLastName(t);
                  actions.setSearchError(null);
                }}
                placeholder="e.g. Smith"
                placeholderTextColor="#94a3b8"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!state.isSearching}
                onSubmitEditing={actions.handleSearch}
                returnKeyType="search"
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-4 text-lg text-zinc-900"
                accessibilityLabel="Last name"
              />
              {state.searchError ? (
                <Text className="mt-3 text-sm font-medium text-red-500">{state.searchError}</Text>
              ) : null}
              <Pressable
                onPress={actions.handleSearch}
                disabled={state.isSearching}
                className="mt-6 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brand py-4 active:opacity-90 disabled:opacity-70">
                {state.isSearching ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MagnifyingGlassIcon color="white" size={22} />
                    <Text className="text-lg font-bold text-white">Search Reservation</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}

        {state.step === 'results' && (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 24 }}
              showsVerticalScrollIndicator={false}>
              <Text className="mb-6 text-lg font-semibold text-zinc-800">Select your stay:</Text>
              <View className="gap-4">
                {state.bookings.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => actions.handleSelectBooking(b)}
                    className="flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm active:bg-zinc-50">
                    <View className="flex-1 pr-4">
                      <Text className="text-xl font-bold text-zinc-900">
                        {b.member.first_name} {b.member.last_name}
                      </Text>
                      <Text className="mt-1 text-base font-medium text-brand">
                        {formatDate(b.checkin_date)} – {formatDate(b.checkout_date)}
                      </Text>
                      <Text className="mt-2 text-sm text-zinc-500">
                        {b.rooms.map((r) => r.name).join(', ')}
                      </Text>
                    </View>
                    <ChevronRightIcon color="#cbd5e1" size={24} />
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => actions.setStep('search')}
                className="mt-8 self-center py-2">
                <Text className="text-base font-bold text-zinc-500">Try a different name</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        )}

        {state.step === 'confirm' && state.selectedBooking && (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 24 }}
              showsVerticalScrollIndicator={false}>
              <Text className="mb-6 text-lg font-semibold text-zinc-800">
                Does this look correct?
              </Text>

              <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <DetailRow
                  label="Primary Guest"
                  value={`${state.selectedBooking.member.first_name} ${state.selectedBooking.member.last_name}`}
                />
                <DetailRow
                  label="Dates"
                  value={`${formatDate(state.selectedBooking.checkin_date)} – ${formatDate(state.selectedBooking.checkout_date)}`}
                />
                <DetailRow
                  label="Party Size"
                  value={`${state.selectedBooking.guests_count} adult${state.selectedBooking.guests_count !== 1 ? 's' : ''}${state.selectedBooking.children_count > 0 ? `, ${state.selectedBooking.children_count} child${state.selectedBooking.children_count !== 1 ? 'ren' : ''}` : ''}`}
                />
                <DetailRow
                  label="Rooms"
                  value={state.selectedBooking.rooms.map((r) => r.name).join(', ')}
                />
                <DetailRow
                  label="Reference"
                  value={
                    <Text className="font-mono text-zinc-900">
                      {state.selectedBooking.reference_id}
                    </Text>
                  }
                  isLast
                />
              </View>
            </ScrollView>

            <View className="border-t border-zinc-200 bg-white p-6 shadow-sm">
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => actions.setStep('results')}
                  className="flex-1 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white py-4 active:bg-zinc-50">
                  <Text className="text-lg font-bold text-zinc-700">Back</Text>
                </Pressable>
                <Pressable
                  onPress={actions.handleConfirmDetails}
                  className="flex-[2] items-center justify-center rounded-xl bg-brand py-4 active:opacity-90">
                  <Text className="text-lg font-bold text-white">Looks Good, Continue</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {state.step === 'vehicles' && state.selectedBooking && (
          <Animated.View entering={FadeInRight.duration(300)} className="flex-1">
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}>
              <Text className="mb-2 text-lg font-semibold text-zinc-800">Vehicle Registration</Text>
              <Text className="mb-6 text-sm text-zinc-500">
                Registering your vehicles helps us manage parking capacity.
              </Text>

              {state.vehicles.map((v, i) => (
                <VehicleFormCard
                  key={i}
                  index={i}
                  vehicle={v}
                  canRemove={state.vehicles.length > 1}
                  onChange={actions.handleVehicleChange}
                  onRemove={actions.handleRemoveVehicle}
                />
              ))}

              <Pressable onPress={actions.handleAddVehicle} className="mt-2 self-center py-2">
                <Text className="text-base font-bold text-brand">+ Add another vehicle</Text>
              </Pressable>

              <Pressable
                onPress={() => actions.setRulesAgreed(!state.rulesAgreed)}
                className={`mt-8 flex-row items-center gap-4 rounded-2xl border-2 p-5 ${
                  state.rulesAgreed ? 'border-brand bg-zinc-50' : 'border-zinc-200 bg-white'
                }`}>
                <View
                  className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
                    state.rulesAgreed ? 'border-brand bg-brand' : 'border-zinc-300'
                  }`}>
                  {state.rulesAgreed ? <CheckCircleSolidIcon color="white" size={18} /> : null}
                </View>
                <Text className="flex-1 text-base font-medium text-zinc-700">
                  I agree to the property rules and acknowledge the checkout requirements.
                </Text>
              </Pressable>

              {state.submitError ? (
                <Text className="mt-4 text-center text-sm font-medium text-red-500">
                  {state.submitError}
                </Text>
              ) : null}
            </ScrollView>

            <View className="border-t border-zinc-200 bg-white p-6 shadow-sm">
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => actions.setStep('confirm')}
                  disabled={state.isSubmitting}
                  className="flex-1 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white py-4 active:bg-zinc-50 disabled:opacity-70">
                  <Text className="text-lg font-bold text-zinc-700">Back</Text>
                </Pressable>
                <Pressable
                  onPress={actions.handleSubmit}
                  disabled={!state.rulesAgreed || state.isSubmitting}
                  className="flex-[2] items-center justify-center rounded-xl bg-brand py-4 active:opacity-90 disabled:opacity-50">
                  {state.isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-lg font-bold text-white">Complete Check-In</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {state.step === 'success' && (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 items-center justify-center px-6">
            <Animated.View
              entering={FadeInDown.duration(500).springify()}
              className="w-full max-w-md items-center rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm">
              <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-100">
                <CheckCircleSolidIcon color="#16a34a" size={56} />
              </View>
              <Text className="text-center text-3xl font-extrabold text-zinc-900">
                {"You're all set!"}
              </Text>
              <Text className="mt-3 text-center text-lg text-zinc-500">
                {
                  "Enjoy your stay. Don't forget to review the property rules if this is your first time here."
                }
              </Text>

              <View className="mt-10 w-full gap-3">
                <Pressable
                  onPress={() => navigation.navigate('Landing')}
                  className="w-full items-center rounded-xl bg-brand px-6 py-4 active:opacity-90">
                  <Text className="text-lg font-bold text-white">Return to Home</Text>
                </Pressable>
                <Pressable
                  onPress={actions.handleStartOver}
                  className="w-full items-center rounded-xl border-2 border-zinc-200 bg-white px-6 py-4 active:bg-zinc-50">
                  <Text className="text-lg font-bold text-zinc-700">Check in another guest</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </KioskScreen>
  );
}

// Color picker circles use dynamic background set via inline style (hex from
// data), so they can't use className.  Border colour is conditional too.
const styles = StyleSheet.create({
  colorCircle: {
    height: 40,
    width: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 2,
  },
  colorCircleSelected: {
    borderColor: '#1b1b52',
  },
  colorCircleUnselected: {
    borderColor: 'transparent',
  },
});
