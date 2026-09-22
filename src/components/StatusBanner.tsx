/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Battery, Zap, CheckCircle2, History } from 'lucide-react';
import { BatteryHardwareMetrics } from '../types';

interface StatusBannerProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  onTogglePreviewCritical?: () => void;
  isPreviewCritical?: boolean;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ 
  metrics, 
  isDark,
  onTogglePreviewCritical,
  isPreviewCritical = false,
}) => {
  const { charging, status, lastUpdated, level } = metrics;
  const isCritical = level <= 20 || isPreviewCritical;

  const formattedTime = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="w-full px-4 mb-4">
      <div 
        id="rock-status-banner"
        className={`w-full rounded-[24px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          isDark
            ? 'bg-[#161b22]/60 backdrop-blur-md border border-[#30363d]/60 text-neutral-200'
            : 'bg-white/70 backdrop-blur-md border border-neutral-200/80 text-neutral-800 shadow-sm'
        }`}
      >
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-[16px] flex items-center justify-center shrink-0 ${
              charging
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : isCritical
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
            }`}
          >
            {charging ? (
              <Zap className="w-5 h-5 fill-current animate-pulse" />
            ) : status === 'full' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Battery className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight">
                {charging 
                  ? 'Connected to Power Source' 
                  : isCritical
                  ? isPreviewCritical ? 'Simulated Critical (< 20%) Active' : 'Critical Battery State (< 20%)'
                  : status === 'full' 
                  ? 'Battery Fully Charged' 
                  : 'Running on Internal Battery'}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {charging
                ? 'Energy flow active into battery cells'
                : isCritical
                ? 'Critical threshold reached — Quick Glance tips active'
                : 'System drawing nominal operating power'}
            </p>
          </div>
        </div>

        {/* Right actions: Timestamp + Preview Test Trigger */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {onTogglePreviewCritical && (
            <button
              onClick={onTogglePreviewCritical}
              title="Toggle preview of Critical (<20%) Quick Glance card"
              className={`text-[11px] font-mono px-2.5 py-1 rounded-[10px] transition-colors border ${
                isPreviewCritical
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold'
                  : isDark
                  ? 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700/60'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black border-neutral-200'
              }`}
            >
              {isPreviewCritical ? 'Exit <20% Preview' : 'Test <20% Glance'}
            </button>
          )}

          <div className={`flex items-center gap-1.5 text-xs font-mono shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            <History className="w-3.5 h-3.5 text-neutral-400" />
            <span>Synced: {formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
