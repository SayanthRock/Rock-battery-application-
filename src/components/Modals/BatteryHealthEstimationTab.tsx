/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Layers, 
  Zap, 
  Activity, 
  Thermometer, 
  RotateCw, 
  ShieldCheck, 
  Sliders, 
  TrendingDown, 
  CheckCircle2, 
  Info, 
  Sparkles,
  ChevronRight,
  BatteryCharging,
  Gauge
} from 'lucide-react';
import { 
  BatteryHealthAnalysis, 
  CAPACITY_PRESETS, 
  estimateBatteryHealth, 
  getSavedDesignCapacity, 
  saveDesignCapacity 
} from '../../services/batteryHealthEstimator';
import { TelemetryLogEntry } from '../../services/telemetryLog';
import { triggerHaptic } from '../../services/haptics';

interface BatteryHealthEstimationTabProps {
  logs: TelemetryLogEntry[];
  currentLevel: number;
  isCharging: boolean;
  isDark: boolean;
  effectiveReducedMotion?: boolean;
  hapticEnabled?: boolean;
}

export const BatteryHealthEstimationTab: React.FC<BatteryHealthEstimationTabProps> = ({
  logs,
  currentLevel,
  isCharging,
  isDark,
  effectiveReducedMotion = false,
  hapticEnabled = true,
}) => {
  const [designCapacity, setDesignCapacity] = useState<number>(() => getSavedDesignCapacity());
  const [customInputVal, setCustomInputVal] = useState<string>(() => designCapacity.toString());
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);

  // Compute live analysis based on historical telemetry patterns
  const analysis: BatteryHealthAnalysis = useMemo(() => {
    return estimateBatteryHealth(logs, designCapacity, currentLevel);
  }, [logs, designCapacity, currentLevel]);

  const handleSelectPreset = (mah: number) => {
    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
    setDesignCapacity(mah);
    setCustomInputVal(mah.toString());
    saveDesignCapacity(mah);
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 2000);
  };

  const handleApplyCustomCapacity = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInputVal, 10);
    if (!isNaN(val) && val >= 1000 && val <= 30000) {
      triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
      setDesignCapacity(val);
      saveDesignCapacity(val);
      setShowCustomInput(false);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 2000);
    }
  };

  // Color styles based on health grade
  const colorMap = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/25',
      bar: 'bg-cyan-500',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      bar: 'bg-amber-500',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    coral: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/25',
      bar: 'bg-rose-500',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
  }[analysis.healthRatingColor];

  return (
    <div className="space-y-4">
      {/* 1. Hero Health Gauge & Capacity Contrast Banner */}
      <div 
        className={`rounded-[22px] p-4 sm:p-5 border transition-all ${
          isDark 
            ? 'bg-[#0d1117] border-[#30363d]' 
            : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${colorMap.bg} ${colorMap.text} border ${colorMap.border}`}>
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  State of Health (SoH)
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${colorMap.badge}`}>
                  {analysis.healthGrade} Grade
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-3xl font-mono font-extrabold tracking-tight ${colorMap.text}`}>
                  {analysis.healthPercent}%
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  retention of factory design
                </span>
              </div>
            </div>
          </div>

          <div className="sm:text-right font-mono text-xs">
            <span className="text-neutral-400 block text-[11px]">Calculated Capacity</span>
            <div className="text-sm font-bold text-neutral-200 flex items-center sm:justify-end gap-1.5 mt-0.5">
              <span>{analysis.currentFullCapacityMah.toLocaleString()}</span>
              <span className="text-neutral-500">/</span>
              <span className="text-neutral-400">{analysis.designCapacityMah.toLocaleString()} mAh</span>
            </div>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              Loss: -{analysis.capacityLossMah} mAh ({analysis.capacityLossPercent}%)
            </span>
          </div>
        </div>

        {/* Dual Capacity Visual Bar */}
        <div className="mt-4 pt-1">
          <div className="flex justify-between items-center text-[11px] font-mono mb-1.5 text-neutral-400">
            <span>Capacity Retention Visualizer</span>
            <span>{analysis.currentEnergyWh} Wh / {analysis.designEnergyWh} Wh</span>
          </div>

          {/* Progress track */}
          <div className="relative w-full h-4 rounded-full bg-neutral-800/80 overflow-hidden border border-neutral-700/50 p-0.5">
            {/* Current Full Capacity fill */}
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${colorMap.bar}`}
              style={{ width: `${Math.min(100, analysis.healthPercent)}%` }}
            />
            {/* Degradation zone background shows remaining gap to 100% */}
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mt-1.5">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${colorMap.bar}`} />
              <span>Current Full Charge ({analysis.currentFullCapacityMah} mAh)</span>
            </span>
            <span className="flex items-center gap-1 text-rose-400/90">
              <TrendingDown className="w-3 h-3" />
              <span>Degraded (-{analysis.capacityLossMah} mAh)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Four-Tile Detailed Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div 
          className={`p-3.5 rounded-[18px] border transition-all ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide block">
            Factory Design
          </span>
          <p className="text-base font-bold font-mono text-neutral-200 mt-1">
            {analysis.designCapacityMah.toLocaleString()} <span className="text-[11px] font-normal text-neutral-400">mAh</span>
          </p>
          <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
            {analysis.designEnergyWh} Wh (3.85V)
          </span>
        </div>

        <div 
          className={`p-3.5 rounded-[18px] border transition-all ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide block">
            Current Full Charge
          </span>
          <p className={`text-base font-bold font-mono mt-1 ${colorMap.text}`}>
            {analysis.currentFullCapacityMah.toLocaleString()} <span className="text-[11px] font-normal text-neutral-400">mAh</span>
          </p>
          <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
            {analysis.currentEnergyWh} Wh (FCC)
          </span>
        </div>

        <div 
          className={`p-3.5 rounded-[18px] border transition-all ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide block">
            Current Charge Now
          </span>
          <p className="text-base font-bold font-mono text-sky-400 mt-1">
            {analysis.currentAvailableChargeMah.toLocaleString()} <span className="text-[11px] font-normal text-neutral-400">mAh</span>
          </p>
          <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
            at {currentLevel}% SoC
          </span>
        </div>

        <div 
          className={`p-3.5 rounded-[18px] border transition-all ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide block">
            Capacity Lost
          </span>
          <p className="text-base font-bold font-mono text-rose-400 mt-1">
            -{analysis.capacityLossMah} <span className="text-[11px] font-normal text-neutral-400">mAh</span>
          </p>
          <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
            -{analysis.capacityLossPercent}% wear
          </span>
        </div>
      </div>

      {/* 3. Historical Telemetry Pattern Derivation Card */}
      <div 
        className={`rounded-[22px] p-4 border space-y-3 transition-all ${
          isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-200">
              Telemetry Derivation Model
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            {analysis.telemetryPointsSampled} Telemetry Records
          </span>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Because direct battery sysfs registries are restricted by browser sandboxes, Rock Battery derives health through continuous empirical telemetry: Coulombic swing integration, voltage-load delta curves, and thermal stress exposure over the last {analysis.timeSpanHours} hours.
        </p>

        {/* Telemetry Indicator Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className={`p-2.5 rounded-[14px] border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'}`}>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400 flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-sky-400" />
                Equivalent Cycles
              </span>
              <span className="font-bold text-neutral-200">~{analysis.cycleCountEstimated}</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Derived from partial charge/discharge swing integration.
            </p>
          </div>

          <div className={`p-2.5 rounded-[14px] border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'}`}>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                Internal Resistance (ESR)
              </span>
              <span className="font-bold text-neutral-200">~{analysis.internalResistanceMilliOhms} mΩ</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Estimated from active load-step voltage variance ({analysis.voltageSagStdDevMv} mV).
            </p>
          </div>

          <div className={`p-2.5 rounded-[14px] border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'}`}>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-400" />
                Thermal Stress
              </span>
              <span className={`font-bold ${analysis.thermalStressLevel === 'Elevated' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {analysis.thermalStressLevel}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Mean operating temp {analysis.averageTemperature}°C across recorded timeline.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Longevity Forecast & Projections */}
      <div 
        className={`rounded-[22px] p-4 border transition-all ${
          isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-200">
              Longevity & Cycle Forecast
            </h4>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            80% Retention Horizon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className={`p-3 rounded-[14px] border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'}`}>
            <span className="text-[11px] text-neutral-400 font-mono block">
              Remaining Useful Cycles
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-sky-400">
                ~{analysis.remainingUsefulCycles}
              </span>
              <span className="text-xs text-neutral-400">cycles to 80% mark</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Equivalent to ~{Math.round(analysis.remainingUsefulCycles / 0.85)} calendar days under standard 1 cycle/day routine.
            </p>
          </div>

          <div className={`p-3 rounded-[14px] border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'}`}>
            <span className="text-[11px] text-neutral-400 font-mono block">
              Projected Monthly Fade
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-emerald-400">
                ~{analysis.estimatedMonthlyFadePercent}%
              </span>
              <span className="text-xs text-neutral-400">capacity lost / month</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Preserved by Intelligent 80% charge cutoffs and low ambient heat.
            </p>
          </div>
        </div>

        {/* Actionable Health Recommendations */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
            Telemetry-Informed Care Recommendations
          </span>
          {analysis.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed text-neutral-300">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Design Capacity Specification Adjuster (User Profile Customizer) */}
      <div 
        className={`rounded-[22px] p-4 border transition-all ${
          isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-200">
              Device Battery Specification
            </h4>
          </div>
          {justUpdated && (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> Updated
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-400 mb-3">
          Select your device class or enter the manufacturer's nominal battery specification (from OEM spec sheet or battery packaging) to fine-tune capacity math:
        </p>

        {/* Preset Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {CAPACITY_PRESETS.map((preset) => {
            const isSelected = designCapacity === preset.capacityMah;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.capacityMah)}
                className={`p-2.5 rounded-[14px] text-left border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                    : isDark
                    ? 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-neutral-300'
                    : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">{preset.category}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
                </div>
                <p className="text-xs font-bold font-mono mt-0.5">{preset.capacityMah.toLocaleString()} mAh</p>
                <p className="text-[10px] text-neutral-400 truncate mt-0.5">{preset.name}</p>
              </button>
            );
          })}

          {/* Custom Button */}
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`p-2.5 rounded-[14px] text-left border transition-all active:scale-95 ${
              showCustomInput
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : isDark
                ? 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-neutral-300'
                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase">Custom</span>
              <Sliders className="w-3 h-3 text-sky-400" />
            </div>
            <p className="text-xs font-bold font-mono mt-0.5">Specify mAh</p>
            <p className="text-[10px] text-neutral-400 truncate mt-0.5">Manual Hardware Spec</p>
          </button>
        </div>

        {/* Custom Input Form (collapsible) */}
        {showCustomInput && (
          <form onSubmit={handleApplyCustomCapacity} className="mt-3 p-3 rounded-[14px] bg-[#161b22] border border-[#30363d] flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="custom-design-mah-input" className="text-[10px] font-mono text-neutral-400 block mb-1">
                Enter Exact Design Capacity (1,000 – 30,000 mAh):
              </label>
              <input
                id="custom-design-mah-input"
                type="number"
                min="1000"
                max="30000"
                step="50"
                value={customInputVal}
                onChange={(e) => setCustomInputVal(e.target.value)}
                placeholder="e.g. 4800"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-[10px] px-3 py-1.5 text-xs font-mono text-neutral-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-1.5 rounded-[10px] text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all active:scale-95"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
