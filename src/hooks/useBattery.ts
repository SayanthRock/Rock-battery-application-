/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BatteryHardwareMetrics, BatteryStateStatus, RockFlowTier } from '../types';
import { TelemetryLogger } from '../services/telemetryLog';
import { playBatteryAlertChime } from '../services/dataStore';

interface WebBatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: WebBatteryManager, ev: Event) => void) | null;
  onchargingtimechange: ((this: WebBatteryManager, ev: Event) => void) | null;
  ondischargingtimechange: ((this: WebBatteryManager, ev: Event) => void) | null;
  onlevelchange: ((this: WebBatteryManager, ev: Event) => void) | null;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<WebBatteryManager>;
}

export function getRockFlowTier(level: number): RockFlowTier {
  if (level <= 20) return 'critical';
  if (level <= 50) return 'normal';
  if (level <= 80) return 'healthy';
  return 'full';
}

export function useBattery(
  refreshBehavior: 'events' | 15 | 30 | 60 = 'events',
  notifyOnLow = false,
  notifyOnFull = false,
  lowThreshold = 20,
  fullThreshold = 100,
  intelligentCharging = true,
  soundAlert = true
) {
  const [metrics, setMetrics] = useState<BatteryHardwareMetrics>({
    level: 100,
    rawLevel: 1,
    charging: false,
    chargingTime: null,
    dischargingTime: null,
    status: 'loading',
    temperature: null, // Hardware sensor unavailable in web sandbox
    voltage: null, // Hardware sensor unavailable in web sandbox
    current: null, // Hardware sensor unavailable in web sandbox
    health: null,
    capacity: null,
    chargingSource: null,
    screenOnSeconds: 0,
    lastUpdated: new Date(),
    apiSupported: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const batteryRef = useRef<WebBatteryManager | null>(null);
  const lastNotifiedLowRef = useRef<number | null>(null);
  const lastNotifiedFullRef = useRef<number | null>(null);
  const lastNotifiedIntelligentRef = useRef<number | null>(null);

  // Screen-on tracking using Document Visibility API
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (!timer && document.visibilityState === 'visible') {
        timer = setInterval(() => {
          setMetrics((prev) => ({
            ...prev,
            screenOnSeconds: prev.screenOnSeconds + 1,
          }));
        }, 1000);
      }
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    startTimer();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
      } else {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Update handler from BatteryManager
  const updateBatteryStats = useCallback((battery: WebBatteryManager) => {
    const rawLevel = battery.level;
    const level = Math.round(rawLevel * 100);
    const charging = battery.charging;
    const chargingTime = isFinite(battery.chargingTime) && battery.chargingTime > 0 ? battery.chargingTime : null;
    const dischargingTime = isFinite(battery.dischargingTime) && battery.dischargingTime > 0 ? battery.dischargingTime : null;

    let status: BatteryStateStatus = 'discharging';
    if (charging) {
      status = level >= 100 ? 'full' : 'charging';
    } else if (level >= 100) {
      status = 'full';
    }

    setMetrics((prev) => ({
      ...prev,
      level,
      rawLevel,
      charging,
      chargingTime,
      dischargingTime,
      status,
      // Source determination
      chargingSource: charging ? 'Detected' : 'None',
      lastUpdated: new Date(),
      apiSupported: true,
      errorMessage: undefined,
    }));

    // Record persistent telemetry snapshot for temperature and voltage tracking
    try {
      TelemetryLogger.recordSnapshot(level, charging, 'Live Hardware Change');
    } catch {
      // Ignore
    }

    // Reset low battery alert ref if user recharges or goes above threshold
    if (charging || level > lowThreshold) {
      lastNotifiedLowRef.current = null;
    }

    // Reset intelligent notification ref if discharged below 77% or stopped charging
    if (level < 77 || !charging) {
      lastNotifiedIntelligentRef.current = null;
    }

    // Reset full battery alert ref if discharged below threshold or unplugged
    if (!charging || level < fullThreshold) {
      lastNotifiedFullRef.current = null;
    }

    // Handle low battery alert: play subtle chime when dropping to or below user-defined threshold, respecting mute
    if (!charging && level <= lowThreshold && lastNotifiedLowRef.current !== level) {
      lastNotifiedLowRef.current = level;
      if (soundAlert) {
        playBatteryAlertChime('low');
      }
      if (notifyOnLow && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Rock Battery: Low Battery (${level}%)`, {
          body: `Battery level has dropped to or below your configured alert threshold of ${lowThreshold}%. Connect to power.`,
          icon: '/favicon.ico',
        });
      }
    }

    // Intelligent charging 80% alert
    if (intelligentCharging && level >= 80 && charging && lastNotifiedIntelligentRef.current !== 80) {
      lastNotifiedIntelligentRef.current = 80;
      if (soundAlert) {
        playBatteryAlertChime('intelligent');
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Rock Battery: Intelligent Charging Limit (80%) 🔋`, {
          body: `Battery reached 80%. Unplugging now significantly reduces electrochemical cell stress and prolongs long-term battery lifespan.`,
          icon: '/favicon.ico',
        });
      }
    }

    // Full / Target charge alert
    if (notifyOnFull && level >= fullThreshold && charging && lastNotifiedFullRef.current !== level) {
      lastNotifiedFullRef.current = level;
      if (soundAlert) {
        playBatteryAlertChime('full');
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Rock Battery: Target Charge Reached (${level}%)`, {
          body: `Battery has reached your configured charge threshold of ${fullThreshold}%. You may disconnect power.`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [notifyOnLow, notifyOnFull, lowThreshold, fullThreshold, intelligentCharging, soundAlert]);

  // Initialize and attach listeners
  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;

    if (!nav.getBattery) {
      setMetrics((prev) => ({
        ...prev,
        status: 'unavailable',
        apiSupported: false,
        errorMessage: 'The Web Battery Status API is not available on this platform or browser.',
      }));
      return;
    }

    let isMounted = true;

    nav.getBattery()
      .then((battery) => {
        if (!isMounted) return;
        batteryRef.current = battery;
        updateBatteryStats(battery);

        const onLevelChange = () => updateBatteryStats(battery);
        const onChargingChange = () => updateBatteryStats(battery);
        const onChargingTimeChange = () => updateBatteryStats(battery);
        const onDischargingTimeChange = () => updateBatteryStats(battery);

        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);
        battery.addEventListener('chargingtimechange', onChargingTimeChange);
        battery.addEventListener('dischargingtimechange', onDischargingTimeChange);

        return () => {
          battery.removeEventListener('levelchange', onLevelChange);
          battery.removeEventListener('chargingchange', onChargingChange);
          battery.removeEventListener('chargingtimechange', onChargingTimeChange);
          battery.removeEventListener('dischargingtimechange', onDischargingTimeChange);
        };
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Permission denied or Battery service unavailable';
        setMetrics((prev) => ({
          ...prev,
          status: 'unavailable',
          apiSupported: false,
          errorMessage: msg,
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [updateBatteryStats]);

  // Polling support if user chose interval refresh in preferences
  useEffect(() => {
    if (typeof refreshBehavior !== 'number' || !batteryRef.current) return;

    const intervalId = setInterval(() => {
      if (batteryRef.current) {
        updateBatteryStats(batteryRef.current);
      }
    }, refreshBehavior * 1000);

    return () => clearInterval(intervalId);
  }, [refreshBehavior, updateBatteryStats]);

  // Manual refresh trigger
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const nav = navigator as NavigatorWithBattery;

    if (nav.getBattery) {
      try {
        const battery = await nav.getBattery();
        batteryRef.current = battery;
        updateBatteryStats(battery);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Battery service refresh failed';
        setMetrics((prev) => ({
          ...prev,
          status: 'unavailable',
          apiSupported: false,
          errorMessage: msg,
        }));
      }
    } else {
      setMetrics((prev) => ({
        ...prev,
        lastUpdated: new Date(),
      }));
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  }, [updateBatteryStats]);

  return {
    metrics,
    isRefreshing,
    refresh,
    tier: getRockFlowTier(metrics.level),
  };
}
