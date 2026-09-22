/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldAlert, Cpu, CheckCircle2, AlertCircle, Thermometer, Layers } from 'lucide-react';
import { BatteryHardwareMetrics } from '../../types';
import { BatteryTelemetryLogTab } from './BatteryTelemetryLogTab';
import { triggerHaptic } from '../../services/haptics';

interface BatteryDetailsModalProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  effectiveReducedMotion?: boolean;
  hapticEnabled?: boolean;
  initialTab?: 'telemetry' | 'fluctuations';
  onClose: () => void;
}

export const BatteryDetailsModal: React.FC<BatteryDetailsModalProps> = ({
  metrics,
  isDark,
  effectiveReducedMotion = false,
  hapticEnabled = true,
  initialTab = 'telemetry',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'fluctuations'>(initialTab);
  const { level, rawLevel, charging, status, chargingTime, dischargingTime, apiSupported, lastUpdated } = metrics;

  const handleTabChange = (tab: 'telemetry' | 'fluctuations') => {
    setActiveTab(tab);
    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-battery-details"
        className={`w-full max-w-xl rounded-[28px] p-6 max-h-[90vh] overflow-y-auto transition-all ${
          isDark
            ? 'bg-[#161b22] border border-[#30363d] text-neutral-100 shadow-2xl'
            : 'bg-white border border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-700/20 dark:border-neutral-700/60 mb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Battery Telemetry Details</h3>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Hardware telemetry & persistent thermal-voltage historical logs
            </p>
          </div>
          <button
            id="close-details-modal-x"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-[16px] bg-[#0d1117] border border-[#30363d] mb-5">
          <button
            id="tab-btn-telemetry"
            type="button"
            onClick={() => handleTabChange('telemetry')}
            className={`flex-1 py-2 px-3 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'telemetry'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Live Parameters</span>
          </button>

          <button
            id="tab-btn-fluctuations"
            type="button"
            onClick={() => handleTabChange('fluctuations')}
            className={`flex-1 py-2 px-3 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'fluctuations'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Thermal & Voltage Log</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
              History
            </span>
          </button>
        </div>

        {/* Tab Content 1: Live Hardware Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                Live Verified Parameters
              </h4>
            </div>

            <div 
              className={`rounded-[20px] p-4 space-y-2.5 font-mono text-xs ${
                isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Battery Level (Discrete)</span>
                <span className="font-bold text-emerald-400">{level}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Raw Normalized Ratio</span>
                <span>{rawLevel.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Power Circuit State</span>
                <span className={charging ? 'text-emerald-400 font-semibold' : 'text-neutral-300'}>
                  {charging ? 'CHARGING' : status === 'full' ? 'FULL (TRICKLE)' : 'DISCHARGING'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Charging Time Metric</span>
                <span>{chargingTime ? `${chargingTime} seconds` : 'Infinity / Unspecified'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Discharging Time Metric</span>
                <span>{dischargingTime ? `${dischargingTime} seconds` : 'Infinity / Calculating'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Hardware Telemetry Time</span>
                <span>{lastUpdated.toISOString()}</span>
              </div>
            </div>

            {/* Platform Security & Unavailable Metric Notice */}
            <div className="flex items-center gap-2 pt-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                Hardware Security Restrictions
              </h4>
            </div>

            <div 
              className={`rounded-[20px] p-4 text-xs leading-relaxed space-y-2.5 ${
                isDark ? 'bg-amber-950/20 border border-amber-900/40 text-amber-200/90' : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                Direct sysfs & thermal sensors are protected
              </p>
              <p>
                In accordance with Android OS and W3C Security Policies, direct access to physical battery temperature, raw circuit millivolts, instantaneous current (mA), and OEM design capacity is restricted to privileged system daemons.
              </p>
              <p className="opacity-80">
                Rock Battery strictly abides by user integrity: rather than fabricating placeholder numbers, unsupported metrics are faithfully presented as <span className="font-mono font-bold">Unavailable</span>. You can inspect continuous thermodynamic fluctuations under the <span className="font-semibold text-amber-400">Thermal & Voltage Log</span> tab.
              </p>
            </div>

            {/* Engine Architecture Note */}
            <div 
              className={`rounded-[20px] p-4 flex items-start gap-3 text-xs ${
                isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <Cpu className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-200">Platform Driver Connection</p>
                <p className="text-neutral-400 mt-0.5">
                  {apiSupported 
                    ? 'Connected via BatteryManager event bus. Passive event-driven listeners eliminate background battery drain.'
                    : 'BatteryManager API restricted by the operating platform or browser sandbox.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Persistent Temperature and Voltage Fluctuation Log */}
        {activeTab === 'fluctuations' && (
          <BatteryTelemetryLogTab
            currentLevel={level}
            isCharging={charging}
            isDark={isDark}
            effectiveReducedMotion={effectiveReducedMotion}
            hapticEnabled={hapticEnabled}
          />
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            id="close-details-modal-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[16px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
