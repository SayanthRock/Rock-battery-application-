/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ZapOff, 
  Moon, 
  Copy, 
  Check, 
  CheckCircle2, 
  Monitor, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  Laptop,
  Flame,
  ArrowRight
} from 'lucide-react';
import { BatteryHardwareMetrics } from '../types';
import { getSystemPowerSavingTips, SystemPowerTip } from '../services/systemPowerTips';
import { triggerHaptic } from '../services/haptics';

interface QuickGlanceCriticalCardProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  onEnableDarkTheme?: () => void;
  onOpenDetails?: () => void;
  effectiveReducedMotion: boolean;
  hapticEnabled: boolean;
  /** Allow force-testing the card even if current physical battery is >20% */
  forcePreview?: boolean;
  onDismissPreview?: () => void;
}

export const QuickGlanceCriticalCard: React.FC<QuickGlanceCriticalCardProps> = ({
  metrics,
  isDark,
  onEnableDarkTheme,
  onOpenDetails,
  effectiveReducedMotion,
  hapticEnabled,
  forcePreview = false,
  onDismissPreview,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [appliedTips, setAppliedTips] = useState<Record<string, boolean>>({});
  const [copiedTipId, setCopiedTipId] = useState<string | null>(null);

  // Battery is considered critical if level < 20% and not currently charging, or if previewed
  const isCritical = (metrics.level < 20 && !metrics.charging) || forcePreview;

  // Fetch real-time system profile and recommendations
  const { profile, tips } = useMemo(() => {
    return getSystemPowerSavingTips(metrics.level, isDark);
  }, [metrics.level, isDark]);

  if (!isCritical) {
    return null;
  }

  // Count applied tips
  const appliedCount = Object.values(appliedTips).filter(Boolean).length;

  const handleToggleTip = (tipId: string) => {
    triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled });
    setAppliedTips((prev) => ({
      ...prev,
      [tipId]: !prev[tipId],
    }));
  };

  const handleCopyShortcut = async (tipId: string, shortcut: string) => {
    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shortcut);
      }
      setCopiedTipId(tipId);
      setTimeout(() => setCopiedTipId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleToggleDark = () => {
    triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled });
    if (onEnableDarkTheme) {
      onEnableDarkTheme();
    }
  };

  // Remaining time estimate
  const estimatedTimeDisplay = useMemo(() => {
    if (metrics.dischargingTime && metrics.dischargingTime < Infinity && metrics.dischargingTime > 0) {
      const mins = Math.round(metrics.dischargingTime / 60);
      if (mins < 60) return `~${mins}m remaining`;
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `~${hrs}h ${remMins}m remaining`;
    }
    // Approximation for <20% (average ~18-35 mins depending on discharge rate)
    const approxMins = Math.max(8, Math.round(metrics.level * 1.8));
    return `~${approxMins}m remaining`;
  }, [metrics.dischargingTime, metrics.level]);

  // Collapsed minimal pill state
  if (isCollapsed) {
    return (
      <div className="w-full px-4 mb-4">
        <div
          id="quick-glance-collapsed-card"
          className={`w-full rounded-[20px] px-4 py-3 flex items-center justify-between transition-all ${
            isDark
              ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
              : 'bg-rose-50 border border-rose-200 text-rose-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Quick Glance: Critical ({metrics.level}%)
            </span>
            <span className="text-xs opacity-80 hidden sm:inline">• {estimatedTimeDisplay}</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('modal-open', { effectiveReducedMotion, hapticEnabled });
              setIsCollapsed(false);
            }}
            className={`text-xs font-medium px-2.5 py-1 rounded-[10px] flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200'
                : 'bg-rose-200/80 hover:bg-rose-200 text-rose-900'
            }`}
          >
            <span>Show Tips ({tips.length - appliedCount} pending)</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <section 
      id="quick-glance-critical-card"
      aria-label="Quick Glance Battery Critical Warnings"
      className="w-full px-4 mb-4"
    >
      <div
        className={`w-full rounded-[24px] p-4.5 sm:p-5 transition-all duration-300 relative overflow-hidden ${
          isDark
            ? 'bg-[#181216]/90 backdrop-blur-xl border border-rose-500/40 shadow-[0_8px_32px_rgba(244,63,94,0.12)] text-neutral-100'
            : 'bg-rose-50/90 backdrop-blur-xl border border-rose-200 shadow-sm text-neutral-900'
        }`}
      >
        {/* Subtle accent backdrop glow */}
        <div 
          className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true"
        />

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div 
              className={`w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0 ${
                isDark 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                  : 'bg-rose-100 text-rose-600 border border-rose-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Critical State
                </span>
                <span className="text-xs font-mono font-medium text-rose-400">
                  {metrics.level}%
                </span>
              </div>
              <h3 className="text-sm font-semibold tracking-tight mt-0.5">
                Quick Glance: Power Conservation
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {forcePreview && onDismissPreview && (
              <button
                onClick={onDismissPreview}
                title="Exit Preview Mode"
                className={`text-[11px] px-2 py-1 rounded-[10px] font-mono transition-colors ${
                  isDark ? 'bg-neutral-800/80 text-neutral-400 hover:text-white' : 'bg-neutral-200 text-neutral-600 hover:text-black'
                }`}
              >
                Exit Preview
              </button>
            )}
            <button
              onClick={() => {
                triggerHaptic('modal-close', { effectiveReducedMotion, hapticEnabled });
                setIsCollapsed(true);
              }}
              title="Collapse Summary"
              className={`p-1.5 rounded-[10px] transition-colors ${
                isDark
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Runtime & Host System Bar */}
        <div 
          className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[16px] mb-3.5 text-xs font-mono ${
            isDark ? 'bg-[#0f141c]/60 border border-[#30363d]/50' : 'bg-white/80 border border-neutral-200/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <Laptop className="w-3.5 h-3.5 text-rose-400" />
            <span>Host: <strong className="font-semibold text-rose-400">{profile.platform}</strong></span>
            <span className="text-neutral-500">•</span>
            <span>Est: <strong>{estimatedTimeDisplay}</strong></span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className={appliedCount === tips.length ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
              {appliedCount}/{tips.length} applied
            </span>
          </div>
        </div>

        {/* Actionable Tips List fetched from system */}
        <div className="space-y-2 mb-3.5">
          {tips.map((tip: SystemPowerTip) => {
            const isApplied = !!appliedTips[tip.id];

            return (
              <div
                key={tip.id}
                className={`p-3 rounded-[18px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isApplied
                    ? isDark
                      ? 'bg-emerald-950/20 border border-emerald-500/25 opacity-75'
                      : 'bg-emerald-50/60 border border-emerald-200 opacity-80'
                    : isDark
                    ? 'bg-[#1e171e]/70 border border-[#3f2a36] hover:border-rose-500/30'
                    : 'bg-white border border-rose-100 hover:border-rose-300 shadow-sm'
                }`}
              >
                {/* Left: Checkbox + Icon + Title/Description */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleTip(tip.id)}
                    title={isApplied ? 'Mark as incomplete' : 'Mark as completed'}
                    className={`mt-0.5 w-5 h-5 rounded-[8px] flex items-center justify-center shrink-0 border transition-all ${
                      isApplied
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isDark
                        ? 'border-neutral-600 bg-neutral-800/80 hover:border-rose-400'
                        : 'border-neutral-300 bg-white hover:border-rose-400'
                    }`}
                  >
                    {isApplied && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-xs font-semibold tracking-tight ${isApplied ? 'line-through opacity-70' : ''}`}>
                        {tip.title}
                      </span>
                      <span 
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-[6px] font-bold ${
                          tip.impact === 'Critical'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : tip.impact === 'High'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}
                      >
                        {tip.impact}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {tip.description}
                    </p>
                  </div>
                </div>

                {/* Right: Quick Action Button if available */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {tip.actionType === 'copy-shortcut' && tip.shortcut && (
                    <button
                      onClick={() => handleCopyShortcut(tip.id, tip.shortcut!)}
                      className={`text-xs font-mono px-2.5 py-1.5 rounded-[12px] flex items-center gap-1.5 transition-all border ${
                        copiedTipId === tip.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isDark
                          ? 'bg-[#221c24] hover:bg-[#2b232e] text-neutral-300 border-[#3d2e3b]'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {copiedTipId === tip.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{tip.actionLabel || 'Copy'}</span>
                        </>
                      )}
                    </button>
                  )}

                  {tip.actionType === 'toggle-dark' && onEnableDarkTheme && (
                    <button
                      onClick={handleToggleDark}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-[12px] flex items-center gap-1.5 bg-neutral-900 text-white hover:bg-black transition-colors shadow-sm"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>{tip.actionLabel || 'Enable Dark Mode'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & Audit Specs Link */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-rose-500/10">
          <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>
            Plug in charger or USB-PD adapter to stop depletion.
          </span>
          {onOpenDetails && (
            <button
              onClick={() => {
                triggerHaptic('modal-open', { effectiveReducedMotion, hapticEnabled });
                onOpenDetails();
              }}
              className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Audit Specs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
