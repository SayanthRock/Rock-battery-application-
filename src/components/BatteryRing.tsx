/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Zap, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Box } from 'lucide-react';
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

  // 3D Spatial Interactive State
  const [is3DMode, setIs3DMode] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Smooth springs for 3D physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 180, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const shineX = useTransform(smoothX, [-0.5, 0.5], ['20%', '80%']);
  const shineY = useTransform(smoothY, [-0.5, 0.5], ['20%', '80%']);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (effectiveReducedMotion || !is3DMode || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [effectiveReducedMotion, is3DMode, mouseX, mouseY]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

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
      return 'Fully Charged';
    }
    return 'Calibrating battery telemetry...';
  };

  // Tier visuals
  const getTierVisuals = () => {
    switch (tier) {
      case 'critical':
        return {
          strokeGradientId: 'rockFlowCritical',
          strokeColor: '#ff7b72',
          glowColor: 'rgba(248, 81, 73, 0.45)',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          badgeText: 'CRITICAL (0–20%)',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
        };
      case 'normal':
        return {
          strokeGradientId: 'rockFlowNormal',
          strokeColor: '#e3b341',
          glowColor: 'rgba(227, 179, 65, 0.35)',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          badgeText: 'MODERATE (21–50%)',
          icon: <Clock className="w-4 h-4 text-amber-400" />,
        };
      case 'healthy':
        return {
          strokeGradientId: 'rockFlowHealthy',
          strokeColor: '#56d364',
          glowColor: 'rgba(86, 211, 100, 0.35)',
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
    <div className="w-full flex flex-col items-center justify-center pt-2 pb-6 px-4 [perspective:1200px]">
      {/* Central 3D Display Card */}
      <motion.div
        ref={cardRef}
        id="rock-battery-display-card"
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: is3DMode && !effectiveReducedMotion ? rotateX : 0,
          rotateY: is3DMode && !effectiveReducedMotion ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered && is3DMode ? 1.02 : 1,
        }}
        transition={{
          duration: 0.25,
          ease: 'easeOut',
        }}
        className={`group relative w-full max-w-[340px] aspect-square rounded-[32px] flex flex-col items-center justify-center p-6 cursor-pointer select-none transition-shadow duration-500 ${
          isDark
            ? 'bg-gradient-to-b from-[#1c2128]/95 via-[#161b22]/90 to-[#0d1117]/95 backdrop-blur-2xl border border-[#30363d]/90 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_15px_30px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)]'
            : 'bg-gradient-to-b from-white/95 via-neutral-50/90 to-neutral-100/95 backdrop-blur-2xl border border-neutral-300/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),0_10px_20px_-5px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)]'
        }`}
      >
        {/* 3D Specular Light Sheen Layer */}
        {is3DMode && !effectiveReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-[32px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden"
            style={{
              transform: 'translateZ(1px)',
            }}
          >
            <motion.div
              className="absolute w-[240px] h-[240px] rounded-full blur-2xl pointer-events-none"
              style={{
                left: shineX,
                top: shineY,
                transform: 'translate(-50%, -50%)',
                background: isDark
                  ? 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
              }}
            />
          </motion.div>
        )}

        {/* 3D Beveled Rim Accent */}
        <div 
          className="absolute inset-[1px] rounded-[31px] pointer-events-none border border-white/10 dark:border-white/5"
          style={{ transform: 'translateZ(4px)' }}
        />

        {/* 3D Mode Toggle Badge */}
        <button 
          type="button"
          className="absolute top-4 right-4 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wide transition-all duration-200 border cursor-pointer"
          style={{ 
            transform: 'translateZ(28px)',
            backgroundColor: is3DMode 
              ? (isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.12)')
              : (isDark ? 'rgba(48, 54, 61, 0.6)' : 'rgba(229, 231, 235, 0.8)'),
            borderColor: is3DMode 
              ? (isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.3)')
              : (isDark ? 'rgba(48, 54, 61, 0.8)' : 'rgba(209, 213, 219, 0.8)'),
            color: is3DMode 
              ? (isDark ? '#38bdf8' : '#0284c7')
              : (isDark ? '#8b949e' : '#6b7280'),
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIs3DMode(!is3DMode);
          }}
          title="Toggle 3D Spatial Depth Mode"
        >
          <Box className={`w-3 h-3 ${is3DMode ? 'animate-pulse text-sky-400' : ''}`} />
          <span>{is3DMode ? '3D ACTIVE' : '3D OFF'}</span>
        </button>

        {/* Subtle Ambient Glow behind the ring */}
        <div 
          className="absolute inset-8 rounded-full pointer-events-none blur-3xl opacity-50 transition-colors duration-700"
          style={{ 
            background: visuals.glowColor,
            transform: 'translateZ(12px)',
          }}
        />

        {/* 3D Sunken Dial Recessed Bezel Chamber */}
        <div 
          className={`absolute w-[244px] h-[244px] rounded-full pointer-events-none transition-all duration-300 ${
            isDark 
              ? 'bg-[#0d1117]/80 shadow-[inset_0_4px_16px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(48,54,61,0.7)]' 
              : 'bg-neutral-100/70 shadow-[inset_0_3px_12px_rgba(0,0,0,0.12),inset_0_0_0_1px_rgba(229,231,235,0.9)]'
          }`}
          style={{ transform: 'translateZ(10px)' }}
        />

        {/* SVG Circular Progress Ring in 3D Layer */}
        <div 
          className="relative w-[240px] h-[240px] flex items-center justify-center"
          style={{ 
            transform: 'translateZ(26px)',
            filter: isDark 
              ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.65))' 
              : 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))',
          }}
        >
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

            {/* Inactive Track with 3D Depth */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              className={`${isDark ? 'stroke-[#21262d]/90' : 'stroke-neutral-200/90'} fill-none`}
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

          {/* Central Battery Readout Elevated in 3D */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
            style={{ 
              transform: 'translateZ(46px)',
              filter: isDark 
                ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.7))' 
                : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            }}
          >
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 mb-1">
              {charging ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                  <Zap className="w-3 h-3 fill-current animate-bounce" />
                  <span>CHARGING</span>
                </div>
              ) : (
                <div 
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${visuals.badgeBg}`}
                >
                  {visuals.icon}
                  <span>{status === 'full' ? 'FULL' : 'DISCHARGING'}</span>
                </div>
              )}
            </div>

            {/* Large 3D Holographic Percentage */}
            <div className="flex items-baseline justify-center">
              <span 
                className={`text-5xl sm:text-6xl font-extrabold tracking-tight font-mono ${
                  isDark 
                    ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-100 to-neutral-400 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]' 
                    : 'text-neutral-900 drop-shadow-sm'
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

        {/* Tier Indicator Pill in 3D Depth Layer */}
        <div 
          className="mt-3 flex items-center justify-center gap-1.5"
          style={{ transform: 'translateZ(30px)' }}
        >
          <span className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md border shadow-sm ${visuals.badgeBg}`}>
            Rock Flow: {visuals.badgeText}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
