/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataStore, playBatteryAlertChime } from './dataStore';
import { TelemetryLogger } from './telemetryLog';

interface WebBatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<WebBatteryManager>;
}

export interface BackgroundMonitorStatus {
  isSupported: boolean;
  isActive: boolean;
  lastChecked: Date | null;
  lastLevel: number | null;
  lastCharging: boolean | null;
  alertsDispatchedCount: number;
  currentPermission: NotificationPermission | 'unsupported';
}

class BackgroundBatteryMonitor {
  private batteryManager: WebBatteryManager | null = null;
  private heartbeatTimer: number | null = null;
  private lastAlertedLowLevel: number | null = null;
  private lastAlertedFullLevel: number | null = null;
  private lastAlertedIntelligentLevel: number | null = null;
  private statusListeners: Set<(status: BackgroundMonitorStatus) => void> = new Set();
  private alertsDispatched = 0;
  private lastCheckTime: Date | null = null;
  private isRunning = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithBattery) : null;
    if (nav?.getBattery) {
      try {
        const battery = await nav.getBattery();
        this.batteryManager = battery;
        this.bindBatteryEvents(battery);
        this.startHeartbeat();
        this.evaluateThresholds();
      } catch {
        // Battery manager failed to initialize
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        // When user switches tabs or returns, immediately evaluate state
        this.evaluateThresholds();
      });
    }

    // Subscribe to DataStore preferences updates to immediately evaluate new thresholds
    DataStore.subscribe(() => {
      this.evaluateThresholds();
      this.notifyStatus();
    });
  }

  private bindBatteryEvents(battery: WebBatteryManager) {
    const handler = () => {
      this.evaluateThresholds();
    };

    battery.addEventListener('levelchange', handler);
    battery.addEventListener('chargingchange', handler);
    battery.addEventListener('chargingtimechange', handler);
    battery.addEventListener('dischargingtimechange', handler);
  }

  private startHeartbeat() {
    if (typeof window === 'undefined') return;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.isRunning = true;
    // 15 second heartbeat to evaluate thresholds even during deep background periods
    this.heartbeatTimer = window.setInterval(() => {
      this.evaluateThresholds();
    }, 15000);
  }

  public evaluateThresholds() {
    if (!this.batteryManager) return;

    const prefs = DataStore.getPreferences();
    if (!prefs.backgroundMonitoring && typeof document !== 'undefined' && document.hidden) {
      // User disabled background monitoring while tab is hidden
      return;
    }

    const level = Math.round(this.batteryManager.level * 100);
    const charging = this.batteryManager.charging;
    this.lastCheckTime = new Date();

    // Log telemetry fluctuation snapshot
    try {
      TelemetryLogger.recordSnapshot(level, charging, 'Interval Heartbeat');
    } catch {
      // Ignore
    }

    const lowThreshold = prefs.lowBatteryThreshold || 20;
    const fullThreshold = prefs.fullBatteryThreshold || 100;

    // Reset low alert arming if battery charged back above threshold + 3% margin
    if (level > lowThreshold + 3 || charging) {
      this.lastAlertedLowLevel = null;
    }

    // Reset full alert arming if battery discharged below full threshold - 3% margin
    if (level < fullThreshold - 3 || !charging) {
      this.lastAlertedFullLevel = null;
    }

    // Reset intelligent charging alert if battery discharged below 77% or stopped charging
    if (level < 77 || !charging) {
      this.lastAlertedIntelligentLevel = null;
    }

    const hasNotificationPermission =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted';

    // 1. Low battery condition check
    if (prefs.lowBatteryNotification && !charging && level <= lowThreshold) {
      if (this.lastAlertedLowLevel !== level) {
        this.lastAlertedLowLevel = level;
        this.dispatchLowBatteryAlert(level, lowThreshold, hasNotificationPermission, prefs.soundAlert);
      }
    }

    // 2. Intelligent Charging 80% health limit condition check
    if (prefs.intelligentCharging && charging && level >= 80) {
      if (this.lastAlertedIntelligentLevel !== 80) {
        this.lastAlertedIntelligentLevel = 80;
        this.dispatchIntelligentChargingAlert(level, hasNotificationPermission, prefs.soundAlert);
      }
    }

    // 3. Full battery / target saturation condition check
    if (prefs.fullBatteryNotification && charging && level >= fullThreshold) {
      if (this.lastAlertedFullLevel !== level) {
        this.lastAlertedFullLevel = level;
        this.dispatchFullBatteryAlert(level, fullThreshold, hasNotificationPermission, prefs.soundAlert);
      }
    }

    this.notifyStatus();
  }

  private dispatchIntelligentChargingAlert(
    level: number,
    hasPermission: boolean,
    soundAlert: boolean
  ) {
    this.alertsDispatched++;

    if (soundAlert) {
      playBatteryAlertChime('intelligent');
    }

    if (hasPermission) {
      try {
        const notif = new Notification(`Intelligent Charging: 80% Health Limit Reached 🔋`, {
          body: `Battery reached ${level}%. Unplugging now significantly reduces electrochemical stress and extends long-term lithium-ion cell life.`,
          icon: '/favicon.ico',
          tag: 'rock-battery-intelligent-alert',
        });

        notif.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
            notif.close();
          }
        };
      } catch (e) {
        console.error('Failed to trigger intelligent charging notification:', e);
      }
    }
  }

  private dispatchLowBatteryAlert(
    level: number,
    threshold: number,
    hasPermission: boolean,
    soundAlert: boolean
  ) {
    this.alertsDispatched++;

    if (soundAlert) {
      playBatteryAlertChime('low');
    }

    if (hasPermission) {
      try {
        const notif = new Notification(`Low Battery Warning (${level}%)`, {
          body: `Battery level is at ${level}%, below your configured ${threshold}% threshold. Please plug in your charger.`,
          icon: '/favicon.ico',
          tag: 'rock-battery-low-alert',
          requireInteraction: true,
        });

        notif.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
            notif.close();
          }
        };
      } catch (e) {
        console.error('Failed to trigger background notification:', e);
      }
    }
  }

  private dispatchFullBatteryAlert(
    level: number,
    threshold: number,
    hasPermission: boolean,
    soundAlert: boolean
  ) {
    this.alertsDispatched++;

    if (soundAlert) {
      playBatteryAlertChime('full');
    }

    if (hasPermission) {
      try {
        const isTrue100 = threshold >= 100;
        const notif = new Notification(
          isTrue100 ? `Battery Fully Charged (${level}%)` : `Target Charge Limit Reached (${level}%)`,
          {
            body: isTrue100
              ? 'Your battery is fully charged (100%). You can unplug your device to protect cell life.'
              : `Battery reached your chosen ${threshold}% charge threshold. Unplug to maximize lithium-ion health.`,
            icon: '/favicon.ico',
            tag: 'rock-battery-full-alert',
          }
        );

        notif.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
            notif.close();
          }
        };
      } catch (e) {
        console.error('Failed to trigger background notification:', e);
      }
    }
  }

  public getStatus(): BackgroundMonitorStatus {
    const permission: NotificationPermission | 'unsupported' =
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'unsupported';

    return {
      isSupported: !!this.batteryManager,
      isActive: this.isRunning,
      lastChecked: this.lastCheckTime,
      lastLevel: this.batteryManager ? Math.round(this.batteryManager.level * 100) : null,
      lastCharging: this.batteryManager ? this.batteryManager.charging : null,
      alertsDispatchedCount: this.alertsDispatched,
      currentPermission: permission,
    };
  }

  public subscribeStatus(listener: (status: BackgroundMonitorStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus() {
    const status = this.getStatus();
    this.statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch {
        // Subscriber error handled
      }
    });
  }

  public testAlert(type: 'low' | 'full' | 'intelligent' = 'low') {
    const prefs = DataStore.getPreferences();
    const hasPermission =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted';

    if (prefs.soundAlert) {
      playBatteryAlertChime(type === 'low' ? 'low' : type === 'full' ? 'full' : 'intelligent');
    }

    if (hasPermission) {
      const isLow = type === 'low';
      const isIntelligent = type === 'intelligent';
      const notif = new Notification(
        isIntelligent
          ? 'Rock Battery: Intelligent Charging Test (80%) 🔋'
          : isLow
          ? 'Rock Battery: Low Alert Test'
          : 'Rock Battery: Target Charge Test',
        {
          body: isIntelligent
            ? 'Intelligent 80% health alert verified: Armed to alert when charging reaches 80% to protect lithium-ion cathode integrity.'
            : isLow
            ? `Background monitoring verified: Alert armed at ≤${prefs.lowBatteryThreshold}% (DataStore synced)`
            : `Background monitoring verified: Target charge armed at ≥${prefs.fullBatteryThreshold}% (DataStore synced)`,
          icon: '/favicon.ico',
          tag: isIntelligent ? 'rock-battery-intelligent-test' : undefined,
        }
      );
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
  }
}

export const BackgroundMonitor = new BackgroundBatteryMonitor();
