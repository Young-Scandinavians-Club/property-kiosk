import type { NavigationContainerRef } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '@/components/navigation/types';

const IDLE_TIMEOUT_MS = 45_000;
const COUNTDOWN_START_MS = 10_000;
const TICK_MS = 250;

// ─── Debug helpers ────────────────────────────────────────────────────────────
const T = () => new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
const log = (tag: string, msg: string, extra?: object) =>
  console.log(`[IT ${T()}] ${tag}: ${msg}`, extra ?? '');

type Props = {
  children: ReactNode;
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
};

export function IdleTimeoutProvider({ children, navigationRef }: Props) {
  log('RENDER', 'component rendering', {
    countdownSecondsInitial: 'see useState below',
    navRefReady: !!navigationRef.current,
  });

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const countdownSecondsRef = useRef<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const lastTickLogRef = useRef(0); // throttle per-tick spam

  const updateCountdown = useCallback((value: number | null) => {
    if (countdownSecondsRef.current !== value) {
      log('COUNTDOWN', `${countdownSecondsRef.current} → ${value}`);
      countdownSecondsRef.current = value;
      setCountdownSeconds(value);
    }
  }, []);

  const resetTimer = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    log('TOUCH', `activity detected — resetting timer (was ${elapsed}ms idle)`);
    lastActivityRef.current = Date.now();
    updateCountdown(null);
  }, [updateCountdown]);

  const goToHome = useCallback(() => {
    const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
    log('GO_HOME', 'attempting navigation reset', {
      currentRoute,
      navRefReady: !!navigationRef.current,
    });
    try {
      if (currentRoute === 'Landing') {
        log('GO_HOME', 'already on Landing — skipping');
        return;
      }
      navigationRef.current?.reset({ index: 0, routes: [{ name: 'Landing' }] });
      log('GO_HOME', 'reset dispatched');
    } catch (err) {
      log('GO_HOME', 'navigation error', { err: String(err) });
      console.warn('[IdleTimeout] Navigation error', err);
    }
    resetTimer();
  }, [navigationRef, resetTimer]);

  // ─── Clear stale fast-refresh state before first paint ───────────────────
  useLayoutEffect(() => {
    log('LAYOUT_EFFECT', 'clearing stale state before first paint', {
      staleCountdown: countdownSecondsRef.current,
    });
    lastActivityRef.current = Date.now();
    updateCountdown(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Main idle tick loop ───────────────────────────────────────────────────
  useEffect(() => {
    log('EFFECT', 'mounting — starting interval', { TICK_MS, IDLE_TIMEOUT_MS, COUNTDOWN_START_MS });

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const navReady = !!navigationRef.current;
      const currentRoute = navReady
        ? (navigationRef.current!.getCurrentRoute()?.name ?? null)
        : null;

      // Throttle the noisy per-tick log to once per second
      if (now - lastTickLogRef.current >= 1000) {
        log(
          'TICK',
          `route=${currentRoute ?? 'null'} navReady=${navReady} elapsed=${elapsed}ms countdown=${countdownSecondsRef.current}`
        );
        lastTickLogRef.current = now;
      }

      if (!navReady) {
        log('TICK_SAFE', 'navRef null — holding activity clock fresh');
        lastActivityRef.current = now;
        updateCountdown(null);
        return;
      }

      if (!currentRoute || currentRoute === 'Landing') {
        lastActivityRef.current = now;
        updateCountdown(null);
        return;
      }

      if (elapsed >= IDLE_TIMEOUT_MS) {
        log('IDLE', `timeout reached (${elapsed}ms) — going home`);
        goToHome();
        return;
      }

      const remaining = IDLE_TIMEOUT_MS - elapsed;
      if (remaining <= COUNTDOWN_START_MS) {
        const sec = Math.ceil(remaining / 1000);
        if (countdownSecondsRef.current !== sec) {
          log('COUNTDOWN', `showing ${sec}s (remaining=${remaining}ms)`);
        }
        updateCountdown(sec);
      } else {
        updateCountdown(null);
      }
    };

    const id = setInterval(tick, TICK_MS);

    return () => {
      log('EFFECT', 'unmounting — clearing interval');
      clearInterval(id);
    };
  }, [goToHome, navigationRef, updateCountdown]);

  log('RENDER', `modal visible=${countdownSeconds !== null} countdownSeconds=${countdownSeconds}`);

  return (
    <View
      className="flex-1"
      onStartShouldSetResponderCapture={() => {
        log('TOUCH', 'touch detected in capture phase — resetting timer');
        resetTimer();
        return false;
      }}>
      {children}
      {countdownSeconds !== null && (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onShow={() => log('MODAL', 'onShow fired — modal is now visible')}
          onDismiss={() => log('MODAL', 'onDismiss fired — modal dismissed')}>
          <View
            style={StyleSheet.absoluteFill}
            className="items-end justify-end pb-8 pr-8"
            pointerEvents="box-none"
            accessibilityLabel="Tap to stay on this screen">
            <View
              style={styles.timerCard}
              onStartShouldSetResponder={() => {
                log('MODAL_TOUCH', 'onStartShouldSetResponder → returning true');
                return true;
              }}
              onResponderGrant={() =>
                log('MODAL_TOUCH', 'onResponderGrant — view claimed the touch')
              }
              onResponderRelease={() => {
                log('MODAL_TOUCH', 'onResponderRelease — calling resetTimer');
                resetTimer();
              }}>
              <Text className="text-center text-xl font-semibold text-zinc-900">
                Returning to home
              </Text>
              <Text className="mt-2 text-center text-8xl font-bold text-brand">
                {countdownSeconds}s
              </Text>
              <Text className="mt-2 text-center text-base text-zinc-500">Tap to stay</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 36,
    minWidth: 200,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
