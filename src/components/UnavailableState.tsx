/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, RefreshCw, AlertCircle, Info, ExternalLink } from 'lucide-react';

interface UnavailableStateProps {
  errorMessage?: string;
  isDark: boolean;
  onRetry: () => void;
  isRefreshing: boolean;
}

export const UnavailableState: React.FC<UnavailableStateProps> = ({
  errorMessage,
  isDark,
  onRetry,
  isRefreshing,
}) => {
  return (
    <div className="w-full px-4 my-6">
      <div 
        id="rock-unavailable-state-card"
        className={`w-full rounded-[28px] p-6 transition-all ${
          isDark
            ? 'bg-[#161b22]/90 border border-amber-500/30 text-neutral-200 shadow-xl'
            : 'bg-white border border-amber-300 text-neutral-800 shadow-lg'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-[20px] bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
              System Limitation Detected
            </span>
            <h3 className="text-lg font-bold tracking-tight">
              Battery Information Unavailable
            </h3>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-neutral-400 mb-4">
          {errorMessage || 'The host runtime or web browser does not expose the W3C Battery Status API (navigator.getBattery).'}
        </p>

        {/* Diagnostic Breakdown */}
        <div 
          className={`rounded-[20px] p-4 text-xs space-y-2 mb-5 ${
            isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Platform Support Context</span>
          </div>
          <p className="text-neutral-400">
            Modern Android Chromium browsers (Chrome, Edge, Samsung Internet, Brave) fully support the Battery API. Firefox and Safari have disabled the API by default in their desktop builds to mitigate hardware fingerprinting.
          </p>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>Policy: Strict No Fake Data</span>
            <span className="text-emerald-400">Authentic Telemetry</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            id="retry-battery-connection-btn"
            onClick={onRetry}
            disabled={isRefreshing}
            className="flex-1 py-3 px-4 rounded-[18px] text-xs font-bold tracking-wide flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-98 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Polling Battery Daemon...' : 'Retry Connection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
