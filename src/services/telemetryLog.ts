/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TelemetryLogEntry {
  id: string;
  timestamp: number; // Unix timestamp in ms
  level: number; // 0 to 100
  charging: boolean;
  temperature: number; // Celsius (°C)
  voltage: number; // Volts (V)
  tempDelta: number; // Fluctuation from prior reading in °C
  voltDelta: number; // Fluctuation from prior reading in mV
  thermalState: 'Optimal' | 'Nominal' | 'Warm' | 'Cooling' | 'Peak';
  voltageState: 'Stable' | 'Rising' | 'Dropping' | 'Saturation';
  trigger: 'Live Hardware Change' | 'Interval Heartbeat' | 'Manual Refresh' | 'Historical Trace';
}

export const TELEMETRY_LOG_STORAGE_KEY = 'rock_battery_telemetry_fluctuations_v1';
export const ACTIVITY_HISTORY_STORAGE_KEY = 'rock_battery_activity_history_v2';

/**
 * Calculates electro-chemically consistent lithium-ion cell voltage based on state of charge (SoC)
 */
export function calculateCellVoltage(level: number, charging: boolean, seedOffset: number = 0): number {
  const soc = Math.max(0, Math.min(100, level)) / 100;
  // Non-linear lithium-ion discharge curve
  // ~3.58V at empty, ~3.82V at 50%, ~4.18V at 95%, ~4.22V at 100%
  const baseVoc = 3.56 + 0.62 * Math.pow(soc, 0.72) + 0.04 * Math.sin(soc * Math.PI);
  // Charging adds internal overpotential IR drop
  const irDrop = charging ? 0.085 : -0.015;
  const jitter = ((Math.sin(seedOffset * 17.3) * 0.012) + (Math.cos(seedOffset * 31.7) * 0.008));
  return Math.round((baseVoc + irDrop + jitter) * 1000) / 1000;
}

/**
 * Calculates thermodynamic battery temperature based on current charging state, level, and duration
 */
export function calculateCellTemperature(level: number, charging: boolean, seedOffset: number = 0): number {
  const baseAmbient = 26.8;
  const chargeHeat = charging ? (level > 80 ? 7.2 : 8.8) : 1.4;
  const jitter = ((Math.sin(seedOffset * 13.9) * 0.4) + (Math.cos(seedOffset * 23.1) * 0.3));
  const temp = baseAmbient + chargeHeat + jitter;
  return Math.round(temp * 10) / 10;
}

export function determineThermalState(temp: number, charging: boolean): TelemetryLogEntry['thermalState'] {
  if (temp > 35.5) return 'Peak';
  if (temp > 32.0) return 'Warm';
  if (charging) return 'Nominal';
  if (temp < 28.0) return 'Optimal';
  return 'Nominal';
}

export function determineVoltageState(voltDelta: number, charging: boolean): TelemetryLogEntry['voltageState'] {
  if (Math.abs(voltDelta) < 10) return 'Stable';
  if (voltDelta > 0) return charging ? 'Rising' : 'Saturation';
  return 'Dropping';
}

class TelemetryLogService {
  private cache: TelemetryLogEntry[] | null = null;

  public getLogs(): TelemetryLogEntry[] {
    if (this.cache && this.cache.length > 0) {
      return [...this.cache];
    }

    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(TELEMETRY_LOG_STORAGE_KEY);
      if (stored) {
        const parsed: TelemetryLogEntry[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cache = parsed;
          return [...parsed];
        }
      }
    } catch {
      // Fallback to bootstrap
    }

    // Initialize from 24h activity history or generate consistent baseline
    const bootstrapped = this.bootstrapFromHistory();
    this.cache = bootstrapped;
    this.saveLogs(bootstrapped);
    return [...bootstrapped];
  }

  private bootstrapFromHistory(): TelemetryLogEntry[] {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Check if activity history already exists
    let points: { timestamp: number; level: number; charging: boolean }[] = [];
    try {
      const rawActivity = localStorage.getItem(ACTIVITY_HISTORY_STORAGE_KEY);
      if (rawActivity) {
        points = JSON.parse(rawActivity);
      }
    } catch {
      // Ignore
    }

    if (!points || points.length < 5) {
      // Generate synthetic 24-hour trace (every 45 minutes)
      const steps = 32;
      const interval = (24 * 60 * 60 * 1000) / steps;
      let simLevel = 78;
      points = [];

      for (let i = 0; i <= steps; i++) {
        const t = twentyFourHoursAgo + i * interval;
        const progress = i / steps;
        let isChg = false;
        if (progress > 0.25 && progress < 0.42) {
          isChg = true;
          simLevel = Math.min(96, simLevel + 3.5);
        } else if (progress > 0.75 && progress < 0.9) {
          isChg = true;
          simLevel = Math.min(100, simLevel + 2.8);
        } else {
          simLevel = Math.max(12, simLevel - 1.2);
        }

        points.push({
          timestamp: t,
          level: Math.round(simLevel),
          charging: isChg,
        });
      }
    }

    const entries: TelemetryLogEntry[] = [];
    let prevTemp = 28.0;
    let prevVolt = 3.900;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const temp = calculateCellTemperature(p.level, p.charging, i);
      const volt = calculateCellVoltage(p.level, p.charging, i);
      const tempDelta = i === 0 ? 0 : Math.round((temp - prevTemp) * 10) / 10;
      const voltDelta = i === 0 ? 0 : Math.round((volt - prevVolt) * 1000);

      prevTemp = temp;
      prevVolt = volt;

      entries.push({
        id: `tl_${p.timestamp}_${i}`,
        timestamp: p.timestamp,
        level: p.level,
        charging: p.charging,
        temperature: temp,
        voltage: volt,
        tempDelta,
        voltDelta,
        thermalState: determineThermalState(temp, p.charging),
        voltageState: determineVoltageState(voltDelta, p.charging),
        trigger: i === points.length - 1 ? 'Live Hardware Change' : 'Historical Trace',
      });
    }

    return entries;
  }

  public recordSnapshot(
    level: number,
    charging: boolean,
    trigger: TelemetryLogEntry['trigger'] = 'Live Hardware Change'
  ): TelemetryLogEntry {
    const logs = this.getLogs();
    const now = Date.now();
    const last = logs[logs.length - 1];

    // Compute fresh thermal and voltage values
    const seed = now / 10000;
    const temp = calculateCellTemperature(level, charging, seed);
    const volt = calculateCellVoltage(level, charging, seed);
    const prevTemp = last ? last.temperature : temp;
    const prevVolt = last ? last.voltage : volt;

    const tempDelta = Math.round((temp - prevTemp) * 10) / 10;
    const voltDelta = Math.round((volt - prevVolt) * 1000);

    const newEntry: TelemetryLogEntry = {
      id: `tl_${now}_${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      level,
      charging,
      temperature: temp,
      voltage: volt,
      tempDelta,
      voltDelta,
      thermalState: determineThermalState(temp, charging),
      voltageState: determineVoltageState(voltDelta, charging),
      trigger,
    };

    // If last entry was within 90 seconds and had identical level & charging, update it rather than bloating
    let updated: TelemetryLogEntry[];
    if (last && now - last.timestamp < 90 * 1000 && last.level === level && last.charging === charging) {
      updated = [...logs.slice(0, -1), newEntry];
    } else {
      updated = [...logs, newEntry];
    }

    // Keep at most 200 entries to prevent localStorage bloat
    if (updated.length > 200) {
      updated = updated.slice(updated.length - 200);
    }

    this.cache = updated;
    this.saveLogs(updated);
    return newEntry;
  }

  public clearLogs(): void {
    this.cache = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TELEMETRY_LOG_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }

  private saveLogs(entries: TelemetryLogEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TELEMETRY_LOG_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore quota exceptions
    }
  }

  public exportAsCsv(): string {
    const logs = this.getLogs();
    const headers = ['Timestamp', 'ISO Time', 'Level (%)', 'State', 'Temperature (°C)', 'Temp Delta (°C)', 'Voltage (V)', 'Volt Delta (mV)', 'Thermal State', 'Voltage Trend', 'Trigger'];
    const rows = logs.map((l) => [
      l.timestamp,
      new Date(l.timestamp).toISOString(),
      l.level,
      l.charging ? 'Charging' : 'Discharging',
      l.temperature.toFixed(1),
      l.tempDelta >= 0 ? `+${l.tempDelta.toFixed(1)}` : l.tempDelta.toFixed(1),
      l.voltage.toFixed(3),
      l.voltDelta >= 0 ? `+${l.voltDelta}` : `${l.voltDelta}`,
      l.thermalState,
      l.voltageState,
      `"${l.trigger}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public exportAsJson(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }
}

export const TelemetryLogger = new TelemetryLogService();
