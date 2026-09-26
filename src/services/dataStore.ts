/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppPreferences } from '../types';

export const PREFS_STORAGE_KEY = 'rock_battery_preferences_v1';
export const PREFS_CHANNEL_NAME = 'rock_battery_datastore_sync';

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'dark', // Liquid GitHub dark-first default
  refreshInterval: 'events',
  chargingAnimation: true,
  reducedMotion: 'system',
  lowBatteryNotification: false,
  lowBatteryThreshold: 20,
  fullBatteryNotification: false,
  fullBatteryThreshold: 100,
  intelligentCharging: true, // 80% battery health protection alert default
  backgroundMonitoring: true,
  soundAlert: true,
  hapticFeedback: true,
  lowPowerMode: false,
};

type Subscriber = (prefs: AppPreferences) => void;

class DataStoreService {
  private cache: AppPreferences | null = null;
  private subscribers: Set<Subscriber> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initBroadcast();
    this.initStorageListener();
  }

  private sanitize(input: unknown): AppPreferences {
    if (!input || typeof input !== 'object') {
      return { ...DEFAULT_PREFERENCES };
    }
    const data = input as Partial<AppPreferences>;
    return {
      theme: data.theme === 'light' || data.theme === 'dark' || data.theme === 'system' ? data.theme : DEFAULT_PREFERENCES.theme,
      refreshInterval: data.refreshInterval === 'events' || data.refreshInterval === 15 || data.refreshInterval === 30 || data.refreshInterval === 60 ? data.refreshInterval : DEFAULT_PREFERENCES.refreshInterval,
      chargingAnimation: typeof data.chargingAnimation === 'boolean' ? data.chargingAnimation : DEFAULT_PREFERENCES.chargingAnimation,
      reducedMotion: data.reducedMotion === 'reduce' || data.reducedMotion === 'no-preference' || data.reducedMotion === 'system' ? data.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
      lowBatteryNotification: typeof data.lowBatteryNotification === 'boolean' ? data.lowBatteryNotification : DEFAULT_PREFERENCES.lowBatteryNotification,
      lowBatteryThreshold: typeof data.lowBatteryThreshold === 'number' && !isNaN(data.lowBatteryThreshold)
        ? Math.max(5, Math.min(50, data.lowBatteryThreshold))
        : DEFAULT_PREFERENCES.lowBatteryThreshold,
      fullBatteryNotification: typeof data.fullBatteryNotification === 'boolean' ? data.fullBatteryNotification : DEFAULT_PREFERENCES.fullBatteryNotification,
      fullBatteryThreshold: typeof data.fullBatteryThreshold === 'number' && !isNaN(data.fullBatteryThreshold)
        ? Math.max(70, Math.min(100, data.fullBatteryThreshold))
        : DEFAULT_PREFERENCES.fullBatteryThreshold,
      intelligentCharging: typeof data.intelligentCharging === 'boolean' ? data.intelligentCharging : DEFAULT_PREFERENCES.intelligentCharging,
      backgroundMonitoring: typeof data.backgroundMonitoring === 'boolean' ? data.backgroundMonitoring : DEFAULT_PREFERENCES.backgroundMonitoring,
      soundAlert: typeof data.soundAlert === 'boolean' ? data.soundAlert : DEFAULT_PREFERENCES.soundAlert,
      hapticFeedback: typeof data.hapticFeedback === 'boolean' ? data.hapticFeedback : DEFAULT_PREFERENCES.hapticFeedback,
      lowPowerMode: typeof data.lowPowerMode === 'boolean' ? data.lowPowerMode : DEFAULT_PREFERENCES.lowPowerMode,
    };
  }

  private initBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(PREFS_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && typeof event.data === 'object') {
            this.cache = this.sanitize(event.data);
            this.notifySubscribers();
          }
        };
      } catch {
        // Channel unavailable, ignore
      }
    }
  }

  private initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === PREFS_STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            this.cache = this.sanitize(parsed);
            this.notifySubscribers();
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  public getPreferences(): AppPreferences {
    if (this.cache) {
      return { ...this.cache };
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(PREFS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.cache = this.sanitize(parsed);
          return { ...this.cache };
        }
      } catch {
        // Fallback to default
      }
    }

    this.cache = { ...DEFAULT_PREFERENCES };
    return { ...this.cache };
  }

  public savePreferences(prefs: AppPreferences): void {
    const validated = this.sanitize(prefs);
    this.cache = validated;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(validated));
      } catch {
        // Quota or sandbox error handled gracefully
      }
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(validated);
      } catch {
        // Ignore message error
      }
    }

    this.notifySubscribers();
  }

  public updatePreference<K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ): AppPreferences {
    const current = this.getPreferences();
    const updated = {
      ...current,
      [key]: value,
    };
    this.savePreferences(updated);
    return updated;
  }

  public subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  private notifySubscribers() {
    const current = this.getPreferences();
    this.subscribers.forEach((fn) => {
      try {
        fn(current);
      } catch (err) {
        console.error('DataStore subscriber error:', err);
      }
    });
  }
}

export const DataStore = new DataStoreService();

/**
 * Web Audio Synthesized Notification Chimes
 * High-fidelity, soothing acoustic tones for battery alert triggers
 */
export function playBatteryAlertChime(type: 'low' | 'full' | 'intelligent' | 'test' = 'test'): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'intelligent') {
      // Elegant crystal health preservation triad (E5 -> G#5 -> B5)
      const healthNotes = [659.25, 830.61, 987.77]; // E5, G#5, B5
      healthNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } else if (type === 'low') {
      // Subtle, pleasant dual-bell acoustic chime (C5 gentle chime softly resolving to A4)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // First bell note: C5 (523.25 Hz)
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      // Second pleasant resolving note: A4 (440.0 Hz) slightly staggered
      const note2Start = now + 0.12;
      osc2.frequency.setValueAtTime(440.0, note2Start);
      gain2.gain.setValueAtTime(0.0001, note2Start);
      gain2.gain.exponentialRampToValueAtTime(0.10, note2Start + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, note2Start + 0.42);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);

      osc2.start(note2Start);
      osc2.stop(note2Start + 0.45);
    } else if (type === 'full') {
      // Upbeat jade crystal ascending harmonic arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } else {
      // Test chime: smooth dual chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    }
  } catch {
    // AudioContext blocked or unsupported, fail silently
  }
}
