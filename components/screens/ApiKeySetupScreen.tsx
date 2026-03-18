import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { setApiConfig, setSelectedProperty } from '@/api';
import type { ApiEnvironment, PropertySlug } from '@/api';
import { saveStoredApiConfig } from '@/lib/apiStorage';

const ENVIRONMENTS: { value: ApiEnvironment; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'prod', label: 'Production' },
];

const PROPERTIES: { value: PropertySlug; label: string }[] = [
  { value: 'tahoe', label: 'Tahoe' },
  { value: 'clear_lake', label: 'Clear Lake' },
];

type Props = {
  onConfigured: () => void;
};

export function ApiKeySetupScreen({ onConfigured }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [environment, setEnvironment] = useState<ApiEnvironment>('local');
  const [property, setProperty] = useState<PropertySlug>('tahoe');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const key = apiKey.trim();
    if (!key) {
      setError('Please enter an API key.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveStoredApiConfig({ apiKey: key, environment, property });
      setApiConfig({ environment, apiKey: key });
      setSelectedProperty(property);
      onConfigured();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [apiKey, environment, property, onConfigured]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Image
          source={require('@/assets/ysc_logo.png')}
          accessibilityLabel="YSC logo"
          resizeMode="contain"
          style={{ width: 160, height: 160 }}
        />
        <Text className="mt-6 text-center text-xl font-semibold text-zinc-900">Configure API</Text>
        <Text className="mt-2 text-center text-sm text-zinc-500">
          Enter the kiosk API key to connect to the booking system.
        </Text>

        <View className="mt-8 w-full max-w-md">
          <Text className="mb-2 text-sm font-medium text-zinc-700">API key</Text>
          <TextInput
            value={apiKey}
            onChangeText={(t) => {
              setApiKey(t);
              setError(null);
            }}
            placeholder="Enter API key"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900"
          />

          <Text className="mb-2 mt-4 text-sm font-medium text-zinc-700">Environment</Text>
          <View className="flex-row flex-wrap gap-2">
            {ENVIRONMENTS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setEnvironment(opt.value)}
                disabled={saving}
                className={`rounded-xl px-4 py-2.5 ${environment === opt.value ? 'bg-brand' : 'bg-zinc-200'}`}>
                <Text
                  className={`font-medium ${environment === opt.value ? 'text-white' : 'text-zinc-700'}`}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 mt-4 text-sm font-medium text-zinc-700">Property</Text>
          <View className="flex-row flex-wrap gap-2">
            {PROPERTIES.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setProperty(opt.value)}
                disabled={saving}
                className={`rounded-xl px-4 py-2.5 ${property === opt.value ? 'bg-brand' : 'bg-zinc-200'}`}>
                <Text
                  className={`font-medium ${property === opt.value ? 'text-white' : 'text-zinc-700'}`}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="mt-6 w-full items-center justify-center rounded-2xl bg-brand py-4 active:opacity-90 disabled:opacity-70">
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-semibold text-white">Save & continue</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
