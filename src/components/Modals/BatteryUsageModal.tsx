/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Smartphone, Clock, ShieldCheck, Zap, Info } from 'lucide-react';
import { BatteryHardwareMetrics } from '../../types';

interface BatteryUsageModalProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  onClose: () => void;
}

export const BatteryUsageModal: React.FC<BatteryUsageModalProps> = ({
  metrics,
  isDark,
  onClose,
}) => {
  const { screenOnSeconds, level, charging } = metrics;

  const formatScreenOn = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-battery-usage"
        className={`w-full max-w-lg rounded-[28px] p-6 max-h-[90vh] overflow-y-auto transition-all ${
          isDark
            ? 'bg-[#161b22] border border-[#30363d] text-neutral-100 shadow-2xl'
            : 'bg-white border border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-700/20 dark:border-neutral-700/60 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Battery Usage & Session</h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Active display telemetry and OS attribution policy
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
          {/* Active Session Card */}
          <div 
            className={`rounded-[22px] p-4 ${
              isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold uppercase text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Session Screen-On Foreground Time
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Live
              </span>
            </div>
            <p className="text-3xl font-extrabold font-mono tracking-tight text-purple-400">
              {formatScreenOn(screenOnSeconds)}
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Calculated precisely using the Document Visibility lifecycle. Pauses instantly when backgrounded or locked.
            </p>
          </div>

          {/* Current battery capacity profile */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className={`rounded-[18px] p-3.5 ${
                isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <span className="text-[11px] font-mono text-neutral-400">Current Level</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{level}%</p>
              <span className="text-[10px] text-neutral-400">Hardware verified</span>
            </div>
            <div 
              className={`rounded-[18px] p-3.5 ${
                isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <span className="text-[11px] font-mono text-neutral-400">Power Circuit</span>
              <p className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                {charging ? 'Charging' : 'Discharging'}
              </p>
              <span className="text-[10px] text-neutral-400">Circuit handshake</span>
            </div>
          </div>

          {/* Android System Usage Permission Notice */}
          <div 
            className={`rounded-[20px] p-4 text-xs leading-relaxed space-y-2 ${
              isDark ? 'bg-[#0d1117] border border-[#30363d] text-neutral-300' : 'bg-neutral-50 border border-neutral-200 text-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Android Per-App Energy Attribution Notice</span>
            </div>
            <p>
              In modern Android (API 28+), per-application battery drainage attribution requires the platform permission <code className="px-1 py-0.5 rounded bg-black/30 font-mono text-[11px]">android.permission.BATTERY_STATS</code>.
            </p>
            <p>
              Because this permission is exclusively granted to pre-installed system apps or ADB debugging bridges, Rock Battery does not fabricate mock app consumption statistics.
            </p>
          </div>

          {/* Battery Health Longevity Advice */}
          <div 
            className={`rounded-[20px] p-4 text-xs leading-relaxed space-y-2 ${
              isDark ? 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-200/90' : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Rock Energy Efficiency Best Practices</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 opacity-90">
              <li>Keep charge between 20% and 80% to maximize lithium-ion cycle lifespan.</li>
              <li>Avoid high-temperature wireless charging while operating high-CPU tasks.</li>
              <li>Enable Android Adaptive Battery in System Settings for background task throttling.</li>
            </ul>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            id="close-usage-modal-btn"
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
