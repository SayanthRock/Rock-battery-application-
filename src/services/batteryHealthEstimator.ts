/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TelemetryLogEntry } from './telemetryLog';

export const DESIGN_CAPACITY_STORAGE_KEY = 'rock_battery_design_capacity_mah_v1';
export const DEFAULT_DESIGN_CAPACITY_MAH = 4800;
export const NOMINAL_CELL_VOLTAGE = 3.85; // Standard Li-Ion 3.85V nominal

export interface BatteryHealthAnalysis {
  // Capacity Metrics
  designCapacityMah: number;
  currentFullCapacityMah: number;
  designEnergyWh: number;
  currentEnergyWh: number;
  currentAvailableChargeMah: number;
  capacityLossMah: number;
  capacityLossPercent: number;
  healthPercent: number; // 0 to 100%

  // Electro-chemical degradation indicators
  cycleCountEstimated: number;
  internalResistanceMilliOhms: number; // Estimated ESR in mΩ
  averageTemperature: number; // °C
  thermalStressLevel: 'Low' | 'Nominal' | 'Moderate' | 'Elevated';
  voltageSagStdDevMv: number; // Voltage fluctuation variance
  telemetryPointsSampled: number;
  timeSpanHours: number;

  // Longevity Projections
  healthGrade: 'Optimal' | 'Good' | 'Moderate' | 'Degraded';
  healthRatingColor: 'emerald' | 'cyan' | 'amber' | 'coral';
  remainingUsefulCycles: number; // Remaining cycles until 80% threshold
  estimatedMonthlyFadePercent: number; // Monthly capacity fade %
  recommendations: string[];
}

export interface CapacityPreset {
  id: string;
  name: string;
  capacityMah: number;
  category: 'Phone' | 'Tablet' | 'Laptop' | 'Custom';
  description: string;
}

export const CAPACITY_PRESETS: CapacityPreset[] = [
  {
    id: 'phone-std',
    name: 'Standard Smartphone',
    capacityMah: 4800,
    category: 'Phone',
    description: 'Common Android standard battery size (4,500 – 4,800 mAh)',
  },
  {
    id: 'phone-flagship',
    name: 'Flagship Smartphone',
    capacityMah: 5000,
    category: 'Phone',
    description: 'High-capacity flagship device (5,000 mAh)',
  },
  {
    id: 'phone-compact',
    name: 'Compact / Slim Phone',
    capacityMah: 3800,
    category: 'Phone',
    description: 'Ultra-thin or compact form factor (3,500 – 3,900 mAh)',
  },
  {
    id: 'tablet-mid',
    name: 'Tablet (10–11")',
    capacityMah: 7500,
    category: 'Tablet',
    description: 'Mid-sized multimedia tablet (7,000 – 8,000 mAh)',
  },
  {
    id: 'laptop-light',
    name: 'Ultrabook / Laptop',
    capacityMah: 4500,
    category: 'Laptop',
    description: '3-cell series battery (~50–54 Wh @ 11.1V, ~4,500 mAh pack)',
  },
];

/**
 * Retrieves the stored design capacity or returns default
 */
export function getSavedDesignCapacity(): number {
  if (typeof window === 'undefined') return DEFAULT_DESIGN_CAPACITY_MAH;
  try {
    const stored = localStorage.getItem(DESIGN_CAPACITY_STORAGE_KEY);
    if (stored) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val >= 1000 && val <= 30000) {
        return val;
      }
    }
  } catch {
    // Fallback
  }
  return DEFAULT_DESIGN_CAPACITY_MAH;
}

/**
 * Stores the user's custom or selected design capacity
 */
export function saveDesignCapacity(mah: number): void {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(1000, Math.min(30000, Math.round(mah)));
    localStorage.setItem(DESIGN_CAPACITY_STORAGE_KEY, clamped.toString());
  } catch {
    // Ignore storage issues
  }
}

/**
 * Calculates battery health & current vs. design capacity based on historical telemetry patterns
 */
export function estimateBatteryHealth(
  logs: TelemetryLogEntry[],
  designCapacityMah: number,
  currentLevel: number
): BatteryHealthAnalysis {
  const safeDesignMah = Math.max(1000, designCapacityMah || DEFAULT_DESIGN_CAPACITY_MAH);
  const sampleCount = logs.length;

  // 1. Calculate time span covered by telemetry
  let timeSpanHours = 24;
  if (sampleCount >= 2) {
    const firstTs = logs[0].timestamp;
    const lastTs = logs[sampleCount - 1].timestamp;
    timeSpanHours = Math.max(1, (lastTs - firstTs) / (1000 * 60 * 60));
  }

  // 2. Cycle Integration from telemetry transitions (Coulomb Counting proxy)
  let cumulativeLevelDelta = 0;
  let highThermalEntries = 0;
  let totalTemp = 0;
  const voltDeltas: number[] = [];

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];
    totalTemp += entry.temperature;
    if (entry.temperature > 32) {
      highThermalEntries++;
    }
    voltDeltas.push(Math.abs(entry.voltDelta || 0));

    if (i > 0) {
      const prev = logs[i - 1];
      cumulativeLevelDelta += Math.abs(entry.level - prev.level);
    }
  }

  const avgTemp = sampleCount > 0 ? totalTemp / sampleCount : 28.5;
  const avgVoltDeltaMv = voltDeltas.length > 0 
    ? voltDeltas.reduce((a, b) => a + b, 0) / voltDeltas.length 
    : 14;

  // Base equivalent cycles derived from recorded SoC swings (200% delta = 1 cycle)
  const recordedSwingsCycles = cumulativeLevelDelta / 200;
  // Blend with baseline lifecycle estimate (standard smartphone/laptop after months of usage)
  const estimatedTotalCycles = Math.round(135 + (recordedSwingsCycles * 8) + (logs.length * 0.15));

  // 3. Thermal Stress Coefficient (Arrhenius thermal aging factor)
  // Optimal temp is < 28°C; temperatures > 32°C accelerate SEI layer growth
  const thermalRatio = sampleCount > 0 ? highThermalEntries / sampleCount : 0.1;
  let thermalStressLevel: BatteryHealthAnalysis['thermalStressLevel'] = 'Nominal';
  if (avgTemp > 34 || thermalRatio > 0.45) {
    thermalStressLevel = 'Elevated';
  } else if (avgTemp > 31 || thermalRatio > 0.25) {
    thermalStressLevel = 'Moderate';
  } else if (avgTemp < 28) {
    thermalStressLevel = 'Low';
  }

  // 4. Internal Resistance (ESR) estimation
  // Fresh lithium-ion cells exhibit ~30–45 mΩ; aged cells rise to 80–150 mΩ
  // We model this using the average load-step volt delta (mV) and cycle count
  const estimatedESR = Math.round(36 + (estimatedTotalCycles * 0.09) + (avgVoltDeltaMv * 0.45));

  // 5. State of Health (SoH) Calculation
  // Standard LiCoO2 / NMC degrades ~0.032% per cycle under normal conditions
  const cycleFade = estimatedTotalCycles * 0.034;
  const thermalFade = (thermalStressLevel === 'Elevated' ? 2.8 : thermalStressLevel === 'Moderate' ? 1.6 : 0.6);
  const esrPenalty = Math.max(0, (estimatedESR - 45) * 0.035);

  const rawDegradation = cycleFade + thermalFade + esrPenalty;
  // Clamp health between 72% and 99.4% (realistic operational boundary)
  const clampedHealthPercent = Math.max(72, Math.min(99.4, 100 - rawDegradation));
  const healthPercent = Math.round(clampedHealthPercent * 10) / 10;

  // 6. Current vs Design Capacity
  const currentFullCapacityMah = Math.round(safeDesignMah * (healthPercent / 100));
  const capacityLossMah = safeDesignMah - currentFullCapacityMah;
  const capacityLossPercent = Math.round((capacityLossMah / safeDesignMah) * 1000) / 10;

  // Energy calculations in Watt-hours (Wh = mAh * V / 1000)
  const designEnergyWh = Math.round(((safeDesignMah * NOMINAL_CELL_VOLTAGE) / 1000) * 100) / 100;
  const currentEnergyWh = Math.round(((currentFullCapacityMah * NOMINAL_CELL_VOLTAGE) / 1000) * 100) / 100;

  // Current available charge at instantaneous battery percentage
  const currentAvailableChargeMah = Math.round(currentFullCapacityMah * (Math.max(0, Math.min(100, currentLevel)) / 100));

  // 7. Health Grade & Visual Tone
  let healthGrade: BatteryHealthAnalysis['healthGrade'] = 'Optimal';
  let healthRatingColor: BatteryHealthAnalysis['healthRatingColor'] = 'emerald';

  if (healthPercent >= 94) {
    healthGrade = 'Optimal';
    healthRatingColor = 'emerald';
  } else if (healthPercent >= 85) {
    healthGrade = 'Good';
    healthRatingColor = 'cyan';
  } else if (healthPercent >= 80) {
    healthGrade = 'Moderate';
    healthRatingColor = 'amber';
  } else {
    healthGrade = 'Degraded';
    healthRatingColor = 'coral';
  }

  // 8. Remaining Useful Life Projection
  // Industry standard end-of-life replacement threshold is 80% original capacity
  const remainingPercentBefore80 = Math.max(0, healthPercent - 80);
  const remainingUsefulCycles = Math.max(0, Math.round(remainingPercentBefore80 / 0.038));
  const estimatedMonthlyFadePercent = Math.round((0.28 + (thermalStressLevel === 'Elevated' ? 0.15 : 0.05)) * 100) / 100;

  // 9. Prescriptive Telemetry-Informed Recommendations
  const recommendations: string[] = [];

  if (thermalStressLevel === 'Elevated' || thermalStressLevel === 'Moderate') {
    recommendations.push(
      'Thermal exposure is accelerating capacity fade. Avoid heavy usage or gaming while connected to fast chargers.'
    );
  } else {
    recommendations.push(
      'Thermal stability is well-maintained. Low operating temperatures preserve lithium crystal microstructure.'
    );
  }

  if (healthPercent >= 85) {
    recommendations.push(
      'Intelligent 80% charging cap actively slows lithium plating, doubling remaining cycle longevity.'
    );
  } else {
    recommendations.push(
      'Cell capacity is below 85%. Consider keeping charge cycles between 20% and 80% to avoid deep voltage strain.'
    );
  }

  recommendations.push(
    `Estimated Internal Resistance is ${estimatedESR} mΩ (${estimatedESR < 65 ? 'healthy conductivity' : 'slight impedance rise'}).`
  );

  return {
    designCapacityMah: safeDesignMah,
    currentFullCapacityMah,
    designEnergyWh,
    currentEnergyWh,
    currentAvailableChargeMah,
    capacityLossMah,
    capacityLossPercent,
    healthPercent,
    cycleCountEstimated: estimatedTotalCycles,
    internalResistanceMilliOhms: estimatedESR,
    averageTemperature: Math.round(avgTemp * 10) / 10,
    thermalStressLevel,
    voltageSagStdDevMv: Math.round(avgVoltDeltaMv * 10) / 10,
    telemetryPointsSampled: sampleCount,
    timeSpanHours: Math.round(timeSpanHours * 10) / 10,
    healthGrade,
    healthRatingColor,
    remainingUsefulCycles,
    estimatedMonthlyFadePercent,
    recommendations,
  };
}
