/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { RockFlowTier, BatteryStateStatus } from '../types';

interface BatteryRingProps {
  level: number; // 0 - 100
  charging: boolean;
  status: BatteryStateStatus;
  tier: RockFlowTier;
  chargingTime: number | null;
  dischargingTime: number | null;
  effectiveReducedMotion: boolean;
  chargingAnimationEnabled: boolean;
  isDark: boolean;
}

export const BatteryRing: React.FC<BatteryRingProps> = ({
  level,
  charging,
  status,
  tier,
  chargingTime,
  dischargingTime,
  effectiveReducedMotion,
  chargingAnimationEnabled,
  isDark,
}) => {
  // SVG Dimensions
  const size = 260;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedLevel = Math.min(Math.max(level, 0), 100);
  const strokeDashoffset = circumference - (clampedLevel / 100) * circumference;

  // Format remaining time
  const formatEstimatedTime = () => {
    if (charging && chargingTime) {
      const hours = Math.floor(chargingTime / 3600);
      const minutes = Math.floor((chargingTime % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m until full`;
      }
      return `${minutes}m until full`;
    }
    if (!charging && dischargingTime) {
      const hours = Math.floor(dischargingTime / 3600);
      const minutes = Math.floor((dischargingTime % 3600) / 60);
      if (hours > 0) {
        return `~${hours}h ${minutes}m remaining`;
      }
      return `~${minutes}m remaining`;
    }
    if (charging && level >= 100) {
      return 'Battery fully charged';
    }
    if (charging) {
      return 'Estimating charge time...';
    }
    return 'Discharge time calculating...';
  };

  // Tier-specific color styling (GitHub Rock Luxury)
  const getTierVisuals = () => {
    switch (tier) {
      case 'critical':
        return {
          strokeGradientId: 'rockFlowCritical',
          strokeColor: '#f85149',
          glowColor: 'rgba(248, 81, 73, 0.35)',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          badgeText: 'CRITICAL (0–20%)',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
        };
      case 'normal':
        return {
          strokeGradientId: 'rockFlowNormal',
          strokeColor: '#d29922',
          glowColor: 'rgba(210, 153, 34, 0.3)',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          badgeText: 'NORMAL (21–50%)',
          icon: <Clock className="w-4 h-4 text-amber-400" />,
        };
      case 'healthy':
        return {
          strokeGradientId: 'rockFlowHealthy',
          strokeColor: '#2ea043',
          glowColor: 'rgba(46, 160, 67, 0.35)',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          badgeText: 'HEALTHY (51–80%)',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        };
      case 'full':
      default:
        return {
          strokeGradientId: 'rockFlowFull',
          strokeColor: '#58a6ff',
          glowColor: 'rgba(88, 166, 255, 0.35)',
          badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          badgeText: 'OPTIMAL (81–100%)',
          icon: <CheckCircle2 className="w-4 h-4 text-sky-400" />,
        };
    }
  };

  const visuals = getTierVisuals();
  const shouldAnimateFlow = charging && chargingAnimationEnabled && !effectiveReducedMotion;

  return (
    <div className="w-full flex flex-col items-center justify-center pt-2 pb-6 px-4">
      {/* Central Glass Card */}
      <div 
        id="rock-battery-display-card"
        className={`relative w-full max-w-[340px] aspect-square rounded-[28px] flex flex-col items-center justify-center p-6 transition-all duration-300 ${
          isDark
            ? 'bg-[#161b22]/75 backdrop-blur-xl border border-[#30363d]/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)]'
            : 'bg-white/85 backdrop-blur-xl border border-neutral-200/90 shadow-lg shadow-neutral-200/50'
        }`}
      >
        {/* Subtle Ambient Glow behind the ring */}
        <div 
          className="absolute inset-8 rounded-full pointer-events-none blur-2xl opacity-40 transition-colors duration-700"
          style={{ background: visuals.glowColor }}
        />

        {/* SVG Circular Progress Ring */}
        <div className="relative w-[240px] h-[240px] flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
          >
            <defs>
              {/* Critical 0-20% */}
              <linearGradient id="rockFlowCritical" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7b72" />
                <stop offset="100%" stopColor="#f85149" />
              </linearGradient>

              {/* Normal 21-50% */}
              <linearGradient id="rockFlowNormal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e3b341" />
                <stop offset="100%" stopColor="#d29922" />
              </linearGradient>

              {/* Healthy 51-80% */}
              <linearGradient id="rockFlowHealthy" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#56d364" />
                <stop offset="100%" stopColor="#2ea043" />
              </linearGradient>

              {/* Full 81-100% */}
              <linearGradient id="rockFlowFull" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#79c0ff" />
                <stop offset="50%" stopColor="#58a6ff" />
                <stop offset="100%" stopColor="#39d353" />
              </linearGradient>

              {/* Flow Ripple Gradient for Active Charging */}
              <linearGradient id="rockFlowActiveStream" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#388bfd" />
                <stop offset="40%" stopColor="#56d364" />
                <stop offset="80%" stopColor="#39d353" />
                <stop offset="100%" stopColor="#7ee787" />
              </linearGradient>
            </defs>

            {/* Inactive Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              className={`${isDark ? 'stroke-[#21262d]' : 'stroke-neutral-100'} fill-none`}
            />

            {/* Active Rock Flow Battery Ring */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              fill="none"
              stroke={`url(#${charging ? 'rockFlowActiveStream' : visuals.strokeGradientId})`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ 
                strokeDashoffset: strokeDashoffset,
              }}
              transition={{
                duration: effectiveReducedMotion ? 0 : 1.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            />

            {/* Charging Flow Particles / Rotating Accent (Liquid GitHub Luxury) */}
            {shouldAnimateFlow && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.15} ${circumference * 0.85}`}
                className="stroke-white/40 fill-none"
                style={{
                  animation: 'spin 3s linear infinite',
                  transformOrigin: 'center',
                }}
              />
            )}
          </svg>

          {/* Central Battery Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 mb-1">
              {charging ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Zap className="w-3 h-3 fill-current animate-bounce" />
                  <span>CHARGING</span>
                </div>
              ) : (
                <div 
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${visuals.badgeBg}`}
                >
                  {visuals.icon}
                  <span>{status === 'full' ? 'FULL' : 'DISCHARGING'}</span>
                </div>
              )}
            </div>

            {/* Large Percentage */}
            <div className="flex items-baseline justify-center">
              <span 
                className={`text-5xl sm:text-6xl font-extrabold tracking-tight font-mono ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {clampedLevel}
              </span>
              <span className={`text-2xl font-bold ml-0.5 font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                %
              </span>
            </div>

            {/* Estimated time readout */}
            <div className="mt-2 text-center px-4">
              <p className={`text-[12px] font-medium leading-tight ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {formatEstimatedTime()}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Indicator Pill */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md border ${visuals.badgeBg}`}>
            Rock Flow: {visuals.badgeText}
          </span>
        </div>
      </div>
    </div>
  );
};
