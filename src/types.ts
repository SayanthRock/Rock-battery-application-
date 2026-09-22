/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeMode = 'system' | 'dark' | 'light';

export type BatteryStateStatus = 
  | 'loading' 
  | 'charging' 
  | 'discharging' 
  | 'full' 
  | 'unavailable' 
  | 'error';

export type RockFlowTier = 'critical' | 'normal' | 'healthy' | 'full';

export interface BatteryHardwareMetrics {
  level: number; // 0 to 100
  rawLevel: number; // 0 to 1
  charging: boolean;
  chargingTime: number | null; // in seconds, or null/Infinity
  dischargingTime: number | null; // in seconds, or null/Infinity
  status: BatteryStateStatus;
  
  // Hardware platform level metrics (real vs unavailable)
  temperature: number | null; // null represents Unavailable on web
  voltage: number | null; // null represents Unavailable on web
  current: number | null; // null represents Unavailable on web
  health: 'Good' | 'Fair' | 'Overheat' | 'Dead' | 'Over Voltage' | 'Unspecified' | null;
  capacity: number | null; // mAh or null
  chargingSource: 'AC' | 'USB' | 'Wireless' | 'Dock' | 'Detected' | 'None' | null;
  
  // Session usage
  screenOnSeconds: number;
  lastUpdated: Date;
  apiSupported: boolean;
  errorMessage?: string;
}

export interface AppPreferences {
  theme: ThemeMode;
  refreshInterval: 'events' | 15 | 30 | 60;
  chargingAnimation: boolean;
  reducedMotion: 'system' | 'reduce' | 'no-preference';
  lowBatteryNotification: boolean;
  lowBatteryThreshold: number; // e.g. 5% to 50%, default 20%
  fullBatteryNotification: boolean;
  fullBatteryThreshold: number; // e.g. 70% to 100%, default 100%
  intelligentCharging: boolean; // Alert when battery reaches 80% to preserve long-term battery health
  backgroundMonitoring: boolean; // active evaluation while tab is hidden/minimized
  soundAlert: boolean; // audible audio chime when alert fires
  hapticFeedback: boolean; // subtle tactile vibration on interactions
}

export type ActiveModal = 'none' | 'details' | 'usage' | 'charging' | 'settings';
