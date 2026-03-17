import type { NavigationContainerRef } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import type { RootStackParamList } from '@/components/navigation/types';

const IDLE_TIMEOUT_MS = 15_000;
const COUNTDOWN_START_MS = 10_000; // Show countdown when 10 seconds left
const TICK_MS = 100;

const LOG = (msg: string, ...args: unknown[]) => {
  console.log(`[IdleTimeout] ${msg}`, ...args);
};

type Props = {
  children: ReactNode;
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
};

export function IdleTimeoutProvider({ children, navigationRef }: Props) {
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownActiveRef = useRef(false);

  const resetTimer = useCallback(() => {
    LOG('Touch/input detected, resetting timer');
    lastActivityRef.current = Date.now();
    setCountdownSeconds(null);
    countdownActiveRef.current = false;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const goToHome = useCallback(() => {
    try {
      const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
      LOG('goToHome called', { currentRoute, navRefReady: !!navigationRef.current });
      if (currentRoute === 'Landing') {
        LOG('Already on Landing, skipping navigation');
        return;
      }
      LOG('Resetting navigation to Landing');
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (err) {
      LOG('Navigation error', err);
    }
    resetTimer();
  }, [navigationRef, resetTimer]);

  useEffect(() => {
    LOG('Idle timeout effect mounted, starting main timer');
    let lastLogTime = 0;
    let lastProgressLog = 0;

    const checkIdle = () => {
      if (!navigationRef.current) {
        if (Date.now() - lastLogTime > 5000) {
          LOG('Nav ref not ready yet');
          lastLogTime = Date.now();
        }
        return;
      }

      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      if (currentRoute === 'Landing') return;

      const elapsed = Date.now() - lastActivityRef.current;

      // Log progress every 5s when idle (helps verify timer is running)
      if (Date.now() - lastProgressLog > 5000 && elapsed > 0) {
        LOG('Idle progress', { elapsedMs: elapsed, currentRoute });
        lastProgressLog = Date.now();
      }

      if (elapsed >= IDLE_TIMEOUT_MS) {
        LOG('Idle timeout reached', { elapsedMs: elapsed });
        goToHome();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      const remaining = IDLE_TIMEOUT_MS - elapsed;
      if (remaining <= COUNTDOWN_START_MS && !countdownActiveRef.current) {
        countdownActiveRef.current = true;
        const seconds = Math.ceil(remaining / 1000);
        LOG('Countdown started', { remainingMs: remaining, seconds });
        setCountdownSeconds(seconds);
        countdownTimerRef.current = setInterval(() => {
          const now = Date.now();
          const rem = IDLE_TIMEOUT_MS - (now - lastActivityRef.current);
          if (rem <= 0) {
            LOG('Countdown finished, navigating to home');
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            goToHome();
            return;
          }
          const sec = Math.ceil(rem / 1000);
          setCountdownSeconds(sec);
        }, TICK_MS);
      }
    };

    timerRef.current = setInterval(checkIdle, TICK_MS);
    return () => {
      LOG('Idle timeout effect unmounting, clearing timers');
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [goToHome, navigationRef]);

  return (
    <Pressable className="flex-1" onPressIn={resetTimer}>
      {children}
      <Modal
        visible={countdownSeconds !== null}
        transparent
        animationType="fade"
        statusBarTranslucent>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={resetTimer}
          accessibilityLabel="Tap to stay on this screen">
          <View className="mx-8 max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <Text className="text-center text-lg font-semibold text-gray-900">
              Returning to home
            </Text>
            <Text className="mt-2 text-center text-2xl font-bold text-brand">
              {countdownSeconds}s
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-600">Tap anywhere to stay</Text>
          </View>
        </Pressable>
      </Modal>
    </Pressable>
  );
}
