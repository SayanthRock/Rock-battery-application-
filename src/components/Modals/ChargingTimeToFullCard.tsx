/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  Clock, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  History, 
  Sparkles,
  PlugZap,
  Gauge
} from 'lucide-react';
import { BatteryHardwareMetrics } from '../../types';
import { estimateTimeToFull, formatDurationHoursMins } from '../../services/chargeTimeEstimator';

interface ChargingTimeToFullCardProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
}

export const ChargingTimeToFullCard: React.FC<ChargingTimeToFullCardProps> = ({
  metrics,
  isDark,
}) => {
  const estimate = useMemo(() => estimateTimeToFull(metrics), [metrics]);

  const {
    isCharging,
    currentLevel,
    timeToFullMinutes,
    timeTo80Minutes,
    estimatedFullTime,
    estimated80Time,
    ratePercentPerMin,
    rateMinutesPerPercent,
    source,
    stage,
    sampleCount,
  } = estimate;

  return (
    <div 
      id="card-charging-time-to-full"
      className={`rounded-[22px] p-4.5 border transition-all ${
        isDark 
          ? 'bg-[#0d1117] border-[#30363d] text-neutral-100 shadow-md' 
          : 'bg-neutral-50 border-neutral-200 text-neutral-900 shadow-sm'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0 ${
            isCharging 
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
              : 'bg-neutral-500/15 text-neutral-400 border border-neutral-500/20'
          }`}>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
              Estimated Time to 100%
            </h4>
            <span className="text-[10px] text-neutral-400 font-mono">
              {source === 'hardware_api' 
                ? 'Direct Hardware API' 
                : source === 'telemetry_history' 
                ? `Historical Telemetry (${sampleCount} cycles)` 
                : 'Adaptive Electrochemical Model'}
            </span>
          </div>
        </div>

        {/* Stage pill */}
        <div className="shrink-0">
          {stage === 'complete' ? (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              100% FULL
            </span>
          ) : isCharging ? (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              stage === 'constant_voltage'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              <Zap className="w-3 h-3 fill-current" />
              {stage === 'constant_voltage' ? 'CV SATURATION' : 'FAST CHARGING'}
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-700/60 text-neutral-300 border border-neutral-600/40">
              UNPLUGGED
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Hero */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1 pb-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span 
              id="val-charging-time-remaining"
              className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-400"
            >
              {stage === 'complete' 
                ? 'Fully Charged' 
                : isCharging 
                ? formatDurationHoursMins(timeToFullMinutes)
                : `~${formatDurationHoursMins(timeToFullMinutes)}`}
            </span>
            {isCharging && stage !== 'complete' && (
              <span className="text-xs text-neutral-400 font-mono">
                remaining
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-400 mt-1">
            {stage === 'complete' ? (
              'Battery at maximum capacity. Trickle maintenance active.'
            ) : isCharging && estimatedFullTime ? (
              <>
                Estimated 100% full capacity at{' '}
                <strong className="text-neutral-200 font-mono font-semibold">
                  {estimatedFullTime}
                </strong>
              </>
            ) : (
              'Connect charger to engage active charging circuit.'
            )}
          </p>
        </div>

        {/* Completion ETA Pill */}
        {isCharging && estimatedFullTime && stage !== 'complete' && (
          <div 
            id="badge-time-to-full-eta"
            className={`px-3 py-1.5 rounded-[14px] border self-start sm:self-center shrink-0 text-right ${
              isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-200 shadow-xs'
            }`}
          >
            <div className="text-[10px] font-mono text-neutral-400 uppercase">Target ETA</div>
            <div className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1 justify-end">
              <Sparkles className="w-3 h-3 text-sky-400" />
              {estimatedFullTime}
            </div>
          </div>
        )}
      </div>

      {/* Multi-stage Progress Visualizer */}
      <div className="py-2">
        <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
          <span>0%</span>
          <span className="text-amber-400 font-semibold">80% Health Limit</span>
          <span>100% Full</span>
        </div>

        <div className="relative h-2.5 w-full bg-neutral-800/80 rounded-full overflow-hidden border border-neutral-700/40">
          {/* 80% Divider Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-20"
            style={{ left: '80%' }}
            title="80% Constant Voltage Transition Threshold"
          />

          {/* Active Fill Bar */}
          <div 
            id="bar-charging-time-progress"
            className={`h-full transition-all duration-500 rounded-full ${
              currentLevel >= 80 
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(3, currentLevel))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-1.5">
          <span className="text-emerald-400 font-bold">
            Current: {currentLevel}%
          </span>
          <span>
            {Math.max(0, 100 - currentLevel)}% to 100% target
          </span>
        </div>
      </div>

      {/* Secondary Milestones & Velocity Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-700/20 dark:border-neutral-700/60 text-xs">
        {/* Milestone 1: 80% Intelligent Limit */}
        <div 
          className={`p-2.5 rounded-[16px] border flex items-center gap-2.5 ${
            currentLevel >= 80
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
              80% Health Limit
            </div>
            <div className="text-xs font-mono font-semibold truncate">
              {currentLevel >= 80 ? (
                'Reached (Preservation active)'
              ) : isCharging && timeTo80Minutes ? (
                `~${formatDurationHoursMins(timeTo80Minutes)} (${estimated80Time || ''})`
              ) : (
                `~${formatDurationHoursMins(timeTo80Minutes)}`
              )}
            </div>
          </div>
        </div>

        {/* Milestone 2: Velocity & Chemistry Rate */}
        <div 
          className={`p-2.5 rounded-[16px] border flex items-center gap-2.5 ${
            isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
              Charge Velocity
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-400 truncate">
              +{ratePercentPerMin}% / min
              <span className="text-[10px] text-neutral-400 font-normal ml-1">
                (~{rateMinutesPerPercent}m per 1%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
