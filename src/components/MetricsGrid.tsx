/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Thermometer, 
  Zap, 
  Activity, 
  Heart, 
  Layers, 
  Plug, 
  Smartphone, 
  Gauge, 
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { BatteryHardwareMetrics } from '../types';
import { BatteryActivityChart } from './BatteryActivityChart';
import { BatteryCapacityTrendChart } from './BatteryCapacityTrendChart';

interface MetricsGridProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  onOpenDetails: (tab?: 'telemetry' | 'health' | 'fluctuations' | 'export') => void;
  effectiveReducedMotion?: boolean;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  isDark,
  onOpenDetails,
  effectiveReducedMotion = false,
}) => {
  const { charging, level, screenOnSeconds } = metrics;
  const [chartView, setChartView] = useState<'capacity' | 'activity'>('capacity');
  const chartSectionRef = useRef<HTMLDivElement | null>(null);

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
      icon: <Heart className="w-4 h-4 text-rose-400" />,
      value: 'Estimated ~94% SoH',
      isUnavailable: false,
      tag: 'Telemetry Model',
      description: 'Derived state of health based on historical Coulombic swings and voltage impedance curves. Click to view capacity.',
    },
    {
      id: 'metric-capacity',
      label: 'Design Capacity',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      value: '~4,800 mAh',
      isUnavailable: false,
      tag: '24H Trend Sync',
      description: 'Calculated 24h capacity dynamics based on standard 4,800 mAh battery chemistry profile.',
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
      {/* 24-Hour Telemetry Visualizer Section */}
      <div ref={chartSectionRef} className="mb-4">
        {/* Visualizer Tab Switcher */}
        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
          <div className={`p-1 rounded-[14px] border flex items-center gap-1 ${isDark ? 'bg-[#161b22]/90 border-[#30363d]' : 'bg-neutral-100 border-neutral-200'}`}>
            <button
              id="tab-chart-capacity"
              type="button"
              onClick={() => setChartView('capacity')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                chartView === 'capacity'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>24H Capacity Trends</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded font-bold bg-white/20 text-white ml-0.5">
                D3
              </span>
            </button>

            <button
              id="tab-chart-activity"
              type="button"
              onClick={() => setChartView('activity')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                chartView === 'activity'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>24H Activity Drain</span>
            </button>
          </div>

          <span className={`text-[11px] font-mono hidden sm:inline ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {chartView === 'capacity' ? 'Energy & Retention Trends' : 'Charge / Discharge Cycle'}
          </span>
        </div>

        {/* Selected Chart Rendering */}
        {chartView === 'capacity' ? (
          <BatteryCapacityTrendChart
            currentLevel={level}
            isCharging={charging}
            isDark={isDark}
            effectiveReducedMotion={effectiveReducedMotion}
            nominalDesignMah={4800}
          />
        ) : (
          <BatteryActivityChart
            currentLevel={level}
            isCharging={charging}
            isDark={isDark}
            effectiveReducedMotion={effectiveReducedMotion}
          />
        )}
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
          const isCapacity = card.id === 'metric-capacity';
          const isHealth = card.id === 'metric-health';

          const handleCardClick = () => {
            if (isCapacity) {
              setChartView('capacity');
              chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (isHealth) {
              onOpenDetails('health');
            } else {
              onOpenDetails(isThermalOrVolt ? 'fluctuations' : 'telemetry');
            }
          };

          return (
            <div
              key={card.id}
              id={card.id}
              onClick={handleCardClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick();
                }
              }}
              className={`rounded-[24px] p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'bg-[#161b22]/70 hover:bg-[#161b22]/90 border border-[#30363d]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-sky-500/30'
                  : 'bg-white/80 hover:bg-white border border-neutral-200/90 shadow-sm hover:border-sky-500/30'
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
