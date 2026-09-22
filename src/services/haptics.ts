/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataStore } from './dataStore';

export type HapticType = 
  | 'refresh' 
  | 'modal-open' 
  | 'modal-close' 
  | 'toggle' 
  | 'selection' 
  | 'slider' 
  | 'alert';

interface HapticOptions {
  /** Explicitly supply effectiveReducedMotion from usePreferences() */
  effectiveReducedMotion?: boolean;
  /** Explicitly supply hapticFeedback enable state */
  hapticEnabled?: boolean;
}

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  // Crisp mechanical tactile pulse for pulling/refreshing telemetry
  refresh: [10, 30, 8],
  // Soft, smooth tactile pop for opening modal dialogs
  'modal-open': 16,
  // Crisp soft tick for closing modal dialogs
  'modal-close': 10,
  // Micro-tick for switches and toggles
  toggle: 8,
  // Subtle micro-pulse for preset chips and tabs
  selection: 6,
  // Ultra-light micro-tick for slider adjustments
  slider: 4,
  // Dual-frequency tactile confirmation for threshold alerts
  alert: [15, 40, 15],
};

/**
 * Dispatches subtle haptic vibration to the device if supported,
 * strictly honoring user reduced-motion and accessibility settings.
 */
export function triggerHaptic(type: HapticType = 'selection', options?: HapticOptions): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Accessibility Check: Honor OS system-level prefers-reduced-motion
  const systemPrefersReduced = 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Accessibility Check: Honor App-level reduced-motion preference
  const prefs = DataStore.getPreferences();
  const isReducedMotion = 
    options?.effectiveReducedMotion ?? 
    (prefs.reducedMotion === 'reduce' || (prefs.reducedMotion === 'system' && systemPrefersReduced));

  if (isReducedMotion) {
    // Strictly suppress haptic vibrations when reduced motion is requested
    return false;
  }

  // 3. User Preference Check: Honor explicit Haptic Feedback toggle
  const isHapticEnabled = options?.hapticEnabled ?? prefs.hapticFeedback;
  if (!isHapticEnabled) {
    return false;
  }

  // 4. Hardware Support Check: Vibration API
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    const pattern = HAPTIC_PATTERNS[type] ?? 8;
    return navigator.vibrate(pattern);
  } catch {
    // Handled gracefully in sandboxed iframe or unsupported actuator environments
    return false;
  }
}
