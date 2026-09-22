/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TelemetryLogger, TelemetryLogEntry } from './telemetryLog';
import { BatteryHardwareMetrics } from '../types';

export interface ChargeTimeEstimate {
  isCharging: boolean;
  currentLevel: number;
  timeToFullMinutes: number | null; // null if already at 100%
  timeTo80Minutes: number | null;   // null if already >= 80%
  estimatedFullTime: string | null;  // e.g. "10:45 AM"
  estimated80Time: string | null;    // e.g. "10:15 AM"
  ratePercentPerMin: number;         // e.g. 0.95%/min
  rateMinutesPerPercent: number;     // e.g. 1.05 min/%
  sampleCount: number;
  source: 'hardware_api' | 'telemetry_history' | 'adaptive_model';
  stage: 'constant_current' | 'constant_voltage' | 'complete' | 'discharging';
  percentRemaining: number;
}

/**
 * Calculates empirical charging rate and estimates remaining time to 100%
 * using live hardware metrics, Battery Status API chargingTime, and historical telemetry logs.
 */
export function estimateTimeToFull(metrics: BatteryHardwareMetrics): ChargeTimeEstimate {
  const { charging, level, chargingTime } = metrics;
  const currentLevel = Math.max(0, Math.min(100, Math.round(level)));
  const percentRemaining = Math.max(0, 100 - currentLevel);

  // If already at 100%
  if (currentLevel >= 100) {
    return {
      isCharging: charging,
      currentLevel,
      timeToFullMinutes: 0,
      timeTo80Minutes: 0,
      estimatedFullTime: 'Fully Charged',
      estimated80Time: 'Reached',
      ratePercentPerMin: 0,
      rateMinutesPerPercent: 0,
      sampleCount: 0,
      source: 'adaptive_model',
      stage: 'complete',
      percentRemaining: 0,
    };
  }

  // Check historical logs to deduce empirical charge velocity
  const logs: TelemetryLogEntry[] = TelemetryLogger.getLogs();
  const chargingHistory = logs.filter((l) => l.charging);

  let empiricalMinutesPerPercent = 1.15; // default ~0.87% per min in CC
  let historicalSamplesUsed = 0;

  if (chargingHistory.length >= 2) {
    // Sort chronologically ascending
    const sorted = [...chargingHistory].sort((a, b) => a.timestamp - b.timestamp);
    let totalDLevel = 0;
    let totalDMinutes = 0;

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const deltaMinutes = (curr.timestamp - prev.timestamp) / 60000;
      const deltaLevel = curr.level - prev.level;

      // Realistic charge window: between 1 minute and 90 minutes, level increasing
      if (deltaMinutes >= 0.5 && deltaMinutes <= 90 && deltaLevel > 0 && deltaLevel <= 80) {
        const rate = deltaLevel / deltaMinutes;
        // Plausible rate: 0.1% to 3.0% per minute
        if (rate >= 0.1 && rate <= 3.0) {
          totalDLevel += deltaLevel;
          totalDMinutes += deltaMinutes;
          historicalSamplesUsed++;
        }
      }
    }

    if (totalDMinutes > 0 && totalDLevel > 0) {
      empiricalMinutesPerPercent = totalDMinutes / totalDLevel;
    }
  }

  // Electro-chemical lithium-ion curve adjustments:
  // Stage 1: Constant Current (CC) up to 80% (fastest velocity)
  // Stage 2: Constant Voltage (CV) 80% to 100% (tapers down current to prevent cell stress, approx 1.65x slower)
  const ccMinutesPerPercent = Math.max(0.5, empiricalMinutesPerPercent);
  const cvMinutesPerPercent = ccMinutesPerPercent * 1.65;

  let timeTo80Mins: number | null = null;
  let timeToFullMins: number | null = null;
  let source: ChargeTimeEstimate['source'] = historicalSamplesUsed > 0 ? 'telemetry_history' : 'adaptive_model';

  // 1. If native hardware Battery API provides valid finite chargingTime
  if (charging && typeof chargingTime === 'number' && isFinite(chargingTime) && chargingTime > 60 && chargingTime < 86400) {
    source = 'hardware_api';
    timeToFullMins = Math.round(chargingTime / 60);

    // Dwell down proportional time to 80%
    if (currentLevel < 80) {
      const remainingCC = 80 - currentLevel;
      const remainingCV = 20;
      const totalWeighted = remainingCC + remainingCV * 1.65;
      const ccFraction = remainingCC / totalWeighted;
      timeTo80Mins = Math.max(1, Math.round(timeToFullMins * ccFraction));
    } else {
      timeTo80Mins = 0;
    }
  } else {
    // 2. Computed based on dynamic electro-chemical profile + telemetry history
    if (currentLevel < 80) {
      const ccRemaining = 80 - currentLevel;
      const cvRemaining = 20;
      timeTo80Mins = Math.round(ccRemaining * ccMinutesPerPercent);
      const cvMins = Math.round(cvRemaining * cvMinutesPerPercent);
      timeToFullMins = Math.max(2, timeTo80Mins + cvMins);
    } else {
      timeTo80Mins = 0;
      const cvRemaining = 100 - currentLevel;
      timeToFullMins = Math.max(1, Math.round(cvRemaining * cvMinutesPerPercent));
    }
  }

  const now = Date.now();
  const fullTimestamp = timeToFullMins ? now + timeToFullMins * 60000 : null;
  const eightyTimestamp = timeTo80Mins && timeTo80Mins > 0 ? now + timeTo80Mins * 60000 : null;

  const formatClockTime = (ts: number | null): string | null => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  const ratePerMin = Math.round((1 / ((currentLevel >= 80 ? cvMinutesPerPercent : ccMinutesPerPercent) || 1.15)) * 100) / 100;
  const currentMinutesPerPercent = Math.round((currentLevel >= 80 ? cvMinutesPerPercent : ccMinutesPerPercent) * 10) / 10;

  const stage: ChargeTimeEstimate['stage'] = !charging
    ? 'discharging'
    : currentLevel >= 100
    ? 'complete'
    : currentLevel >= 80
    ? 'constant_voltage'
    : 'constant_current';

  return {
    isCharging: charging,
    currentLevel,
    timeToFullMinutes: timeToFullMins,
    timeTo80Minutes: currentLevel >= 80 ? null : timeTo80Mins,
    estimatedFullTime: formatClockTime(fullTimestamp),
    estimated80Time: formatClockTime(eightyTimestamp),
    ratePercentPerMin: ratePerMin,
    rateMinutesPerPercent: currentMinutesPerPercent,
    sampleCount: historicalSamplesUsed,
    source,
    stage,
    percentRemaining,
  };
}

/**
 * Human-readable duration formatter (e.g. "45 min" or "1 hr 15 min")
 */
export function formatDurationHoursMins(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '--';
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;

  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hrs} hr`;
  }
  return `${hrs} hr ${remainingMins} min`;
}
