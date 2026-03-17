import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SWRConfig } from 'swr';

import { setApiConfig, setSelectedProperty } from '@/api';
import { AppNavigator } from '@/components/navigation/AppNavigator';
import { ApiKeySetupScreen } from '@/components/screens/ApiKeySetupScreen';
import { loadStoredApiConfig } from '@/lib/apiStorage';
import { swrConfig } from '@/lib/swr';

import './global.css';

type ConfigStatus = 'loading' | 'needs_setup' | 'ready';

function AppContent() {
  const [status, setStatus] = useState<ConfigStatus>('loading');

  const loadConfig = useCallback(async () => {
    const stored = await loadStoredApiConfig();
    if (stored) {
      setApiConfig({ environment: stored.environment, apiKey: stored.apiKey });
      setSelectedProperty(stored.property);
      setStatus('ready');
    } else {
      setStatus('needs_setup');
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleConfigured = useCallback(() => setStatus('ready'), []);

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1b1b52" />
      </View>
    );
  }

  if (status === 'needs_setup') {
    return <ApiKeySetupScreen onConfigured={handleConfigured} />;
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SWRConfig value={swrConfig}>
          <AppContent />
        </SWRConfig>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
