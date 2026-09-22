/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Zap, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { BatteryHardwareMetrics } from '../../types';
import { ChargingTimeToFullCard } from './ChargingTimeToFullCard';

interface ChargingInfoModalProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  onClose: () => void;
}

export const ChargingInfoModal: React.FC<ChargingInfoModalProps> = ({
  metrics,
  isDark,
  onClose,
}) => {
  const { charging, level, chargingTime } = metrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-charging-info"
        className={`w-full max-w-lg rounded-[28px] p-6 max-h-[90vh] overflow-y-auto transition-all ${
          isDark
            ? 'bg-[#161b22] border border-[#30363d] text-neutral-100 shadow-2xl'
            : 'bg-white border border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-700/20 dark:border-neutral-700/60 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Charging Architecture</h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Rock Flow animation tiers & power telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Active Status */}
          <div 
            className={`rounded-[22px] p-4 ${
              isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-neutral-400">Current Power Circuit</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                charging ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-700 text-neutral-300'
              }`}>
                {charging ? 'CHARGING ACTIVE' : 'DISCHARGING'}
              </span>
            </div>
            <p className="text-xl font-bold font-mono mt-2">
              {charging ? 'Energy Flowing into Cells' : 'Nominal Battery Output'}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {charging && chargingTime 
                ? `Estimated ${Math.round(chargingTime / 60)} minutes to full charge capacity.`
                : charging 
                ? 'Device negotiating maximum charge rate with power adapter.'
                : 'Device drawing from internal chemical reserve.'}
            </p>
          </div>

          {/* Real-Time & Historical Time to 100% Full Estimation Element */}
          <ChargingTimeToFullCard
            metrics={metrics}
            isDark={isDark}
          />

          {/* Rock Flow 4-Tier Animation Specs */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                Rock Flow Dynamic Tiers
              </h4>
            </div>

            <div className="space-y-2">
              <div 
                className={`p-3 rounded-[18px] border flex items-center justify-between ${
                  level <= 20 
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold' 
                    : isDark ? 'bg-[#0d1117] border-[#30363d] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <div>
                  <span className="text-xs font-mono font-bold">0% – 20%: Critical State</span>
                  <p className="text-[11px] opacity-80">Amber-crimson neon warning pulse to prevent deep cell depletion.</p>
                </div>
                {level <= 20 && <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />}
              </div>

              <div 
                className={`p-3 rounded-[18px] border flex items-center justify-between ${
                  level > 20 && level <= 50 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold' 
                    : isDark ? 'bg-[#0d1117] border-[#30363d] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <div>
                  <span className="text-xs font-mono font-bold">21% – 50%: Normal Progress</span>
                  <p className="text-[11px] opacity-80">Balanced amber/emerald transition with constant current charging.</p>
                </div>
                {level > 20 && level <= 50 && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </div>

              <div 
                className={`p-3 rounded-[18px] border flex items-center justify-between ${
                  level > 50 && level <= 80 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold' 
                    : isDark ? 'bg-[#0d1117] border-[#30363d] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <div>
                  <span className="text-xs font-mono font-bold">51% – 80%: Healthy Progress</span>
                  <p className="text-[11px] opacity-80">Signature GitHub jade flow representing the optimal lithium-ion balance.</p>
                </div>
                {level > 50 && level <= 80 && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>

              <div 
                className={`p-3 rounded-[18px] border flex items-center justify-between ${
                  level > 80 
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-semibold' 
                    : isDark ? 'bg-[#0d1117] border-[#30363d] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <div>
                  <span className="text-xs font-mono font-bold">81% – 100%: Full / Near-Full</span>
                  <p className="text-[11px] opacity-80">Steady luxury cyan-emerald luminescence during constant voltage trickle.</p>
                </div>
                {level > 80 && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
              </div>
            </div>
          </div>

          {/* Charging Physics & Intelligent 80% Health Note */}
          <div 
            className={`rounded-[20px] p-4 text-xs leading-relaxed space-y-1.5 ${
              isDark ? 'bg-[#0d1117] border border-[#30363d] text-neutral-300' : 'bg-neutral-50 border border-neutral-200 text-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Two-Stage Lithium Chemistry & 80% Health Limit</span>
            </div>
            <p>
              Lithium cells charge via Constant Current (CC) up to ~80% with minimal stress. Beyond 80%, cells transition into high-voltage Constant Voltage (CV) saturation, causing accelerated degradation. Rock Battery's <strong>Intelligent Charging</strong> alerts you at 80% to maximize pack longevity.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            id="close-charging-modal-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[16px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
