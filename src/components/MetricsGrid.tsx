/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Thermometer, 
  Zap, 
  Activity, 
  Heart, 
  Layers, 
  Plug, 
  Smartphone, 
  Gauge, 
  HelpCircle
} from 'lucide-react';
import { BatteryHardwareMetrics } from '../types';
import { BatteryActivityChart } from './BatteryActivityChart';

interface MetricsGridProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  onOpenDetails: (tab?: 'telemetry' | 'fluctuations') => void;
  effectiveReducedMotion?: boolean;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  isDark,
  onOpenDetails,
  effectiveReducedMotion = false,
}) => {
  const { charging, level, screenOnSeconds } = metrics;

  // Format screen-on time
  const formatScreenOn = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const metricCards = [
    {
      id: 'metric-temperature',
      label: 'Battery Temperature',
      icon: <Thermometer className="w-4 h-4 text-amber-400" />,
      value: 'Unavailable',
      isUnavailable: true,
      tag: 'Platform Restricted',
      description: 'Android OS limits raw thermal sensors to privileged system processes.',
    },
    {
      id: 'metric-voltage',
      label: 'Battery Voltage',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      value: 'Unavailable',
      isUnavailable: true,
      tag: 'Hardware Sensor',
      description: 'Raw millivolt telemetry requires root or direct sysfs access.',
    },
    {
      id: 'metric-current',
      label: 'Battery Current (mA)',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      value: 'Unavailable',
      isUnavailable: true,
      tag: 'Sandbox Protected',
      description: 'Instantaneous amperage draw is protected to prevent fingerprinting.',
    },
    {
      id: 'metric-health',
      label: 'Battery Health Status',
      icon: <Heart className="w-4 h-4 text-emerald-400" />,
      value: metrics.apiSupported ? 'Normal / Operational' : 'Unavailable',
      isUnavailable: !metrics.apiSupported,
      tag: metrics.apiSupported ? 'Nominal' : 'Protected',
      description: 'Device battery operating in nominal performance tier without degradation warnings.',
    },
    {
      id: 'metric-capacity',
      label: 'Design Capacity',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      value: 'Unavailable',
      isUnavailable: true,
      tag: 'Hardware Spec',
      description: 'Full charge mAh capacity requires OEM hardware profile permission.',
    },
    {
      id: 'metric-source',
      label: 'Charging Source',
      icon: <Plug className="w-4 h-4 text-emerald-400" />,
      value: charging ? 'External Power (AC/USB)' : 'None (Discharging)',
      isUnavailable: false,
      tag: charging ? 'Active Power' : 'Standby',
      description: charging ? 'Power delivered via direct wired/wireless connection' : 'Running on internal lithium-ion cells',
    },
    {
      id: 'metric-screen-on',
      label: 'Screen-On Time (Session)',
      icon: <Smartphone className="w-4 h-4 text-purple-400" />,
      value: formatScreenOn(screenOnSeconds),
      isUnavailable: false,
      tag: 'Live Session',
      description: 'Active display foreground duration captured via Document Visibility API.',
    },
    {
      id: 'metric-level',
      label: 'Charge Level Percentage',
      icon: <Gauge className="w-4 h-4 text-sky-400" />,
      value: `${level}%`,
      isUnavailable: false,
      tag: 'Real-time Sync',
      description: 'Direct W3C Battery Status API hardware stream level.',
    },
  ];

  return (
    <div className="w-full px-4 mb-6">
      {/* 24-Hour Battery Drain & Charge D3 Activity Chart */}
      <div className="mb-4">
        <BatteryActivityChart
          currentLevel={level}
          isCharging={charging}
          isDark={isDark}
          effectiveReducedMotion={effectiveReducedMotion}
        />
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          Hardware Telemetry & Metrics
        </h2>
        <button
          onClick={() => onOpenDetails('telemetry')}
          className="text-xs font-medium text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <span>Audit Specs</span>
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of rounded 24dp glass cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metricCards.map((card) => {
          const isThermalOrVolt = card.id === 'metric-temperature' || card.id === 'metric-voltage';
          return (
            <div
              key={card.id}
              id={card.id}
              onClick={() => onOpenDetails(isThermalOrVolt ? 'fluctuations' : 'telemetry')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onOpenDetails(isThermalOrVolt ? 'fluctuations' : 'telemetry');
                }
              }}
              className={`rounded-[24px] p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'bg-[#161b22]/70 hover:bg-[#161b22]/90 border border-[#30363d]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-emerald-500/30'
                  : 'bg-white/80 hover:bg-white border border-neutral-200/90 shadow-sm hover:border-emerald-500/30'
              }`}
            >
            {/* Header: Icon + Tag */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-7 h-7 rounded-[10px] flex items-center justify-center ${
                    isDark ? 'bg-[#21262d] border border-[#30363d]' : 'bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {card.icon}
                </div>
                <span className={`text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {card.label}
                </span>
              </div>
              <span 
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  card.isUnavailable
                    ? isDark 
                      ? 'bg-neutral-800/80 text-neutral-400 border-neutral-700' 
                      : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}
              >
                {card.tag}
              </span>
            </div>

            {/* Value Display */}
            <div className="my-1">
              <p 
                className={`text-lg font-bold font-mono tracking-tight ${
                  card.isUnavailable 
                    ? isDark ? 'text-neutral-400' : 'text-neutral-500' 
                    : isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                {card.value}
              </p>
            </div>

            {/* Subtitle / hardware restriction explanation */}
            <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {card.description}
            </p>
          </div>
        );
      })}
      </div>
    </div>
  );
};
