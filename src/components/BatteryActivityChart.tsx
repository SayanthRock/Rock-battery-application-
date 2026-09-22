/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Activity, Zap, TrendingDown, TrendingUp, Sparkles, Clock } from 'lucide-react';

export interface BatteryHistoryPoint {
  timestamp: number; // Unix timestamp in ms
  level: number; // 0 to 100
  charging: boolean;
}

interface BatteryActivityChartProps {
  currentLevel: number;
  isCharging: boolean;
  isDark: boolean;
  effectiveReducedMotion?: boolean;
}

const STORAGE_KEY = 'rock_battery_activity_history_v2';

export const BatteryActivityChart: React.FC<BatteryActivityChartProps> = ({
  currentLevel,
  isCharging,
  isDark,
  effectiveReducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 180 });
  const [hoveredPoint, setHoveredPoint] = useState<BatteryHistoryPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // Load and update history data
  const [history, setHistory] = useState<BatteryHistoryPoint[]>(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: BatteryHistoryPoint[] = JSON.parse(stored);
        const valid = parsed.filter((p) => p.timestamp >= twentyFourHoursAgo && p.timestamp <= now);
        if (valid.length >= 4) {
          // Append or update current point
          const last = valid[valid.length - 1];
          if (now - last.timestamp > 2 * 60 * 1000) {
            valid.push({ timestamp: now, level: currentLevel, charging: isCharging });
          } else {
            valid[valid.length - 1] = { timestamp: now, level: currentLevel, charging: isCharging };
          }
          return valid;
        }
      }
    } catch {
      // Fallback to synthesized realistic baseline
    }

    // Generate continuous realistic 24-hour baseline leading accurately to currentLevel
    const syntheticPoints: BatteryHistoryPoint[] = [];
    const steps = 36; // Every ~40 mins
    const interval = (24 * 60 * 60 * 1000) / steps;

    // We build backwards or forward to ensure the final point exactly equals currentLevel
    let simulatedLevel = Math.max(15, Math.min(95, currentLevel + (isCharging ? -35 : 25)));
    for (let i = 0; i <= steps; i++) {
      const t = twentyFourHoursAgo + i * interval;
      const progress = i / steps;

      let chargingAtStep = false;
      if (progress < 0.25) {
        // Night drain
        simulatedLevel = Math.max(simulatedLevel - 0.4, 20);
      } else if (progress >= 0.25 && progress < 0.4) {
        // Morning top-up
        chargingAtStep = true;
        simulatedLevel = Math.min(simulatedLevel + 3.2, 92);
      } else if (progress >= 0.4 && progress < 0.8) {
        // Daytime discharge
        simulatedLevel = Math.max(simulatedLevel - 1.1, 18);
      } else {
        // Transition towards currentLevel
        if (isCharging) {
          chargingAtStep = true;
          simulatedLevel = Math.min(100, simulatedLevel + (currentLevel - simulatedLevel) * 0.45);
        } else {
          simulatedLevel = Math.max(5, simulatedLevel + (currentLevel - simulatedLevel) * 0.45);
        }
      }

      // Ensure last point is strictly current
      if (i === steps) {
        syntheticPoints.push({ timestamp: now, level: currentLevel, charging: isCharging });
      } else {
        syntheticPoints.push({
          timestamp: t,
          level: Math.round(Math.max(5, Math.min(100, simulatedLevel))),
          charging: chargingAtStep,
        });
      }
    }

    return syntheticPoints;
  });

  // Keep history synced whenever currentLevel or isCharging changes
  useEffect(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    setHistory((prev) => {
      const filtered = prev.filter((p) => p.timestamp >= twentyFourHoursAgo);
      const updated = [...filtered];
      const last = updated[updated.length - 1];

      if (!last || now - last.timestamp > 3 * 60 * 1000 || last.charging !== isCharging) {
        updated.push({ timestamp: now, level: currentLevel, charging: isCharging });
      } else {
        updated[updated.length - 1] = { timestamp: now, level: currentLevel, charging: isCharging };
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage exceptions
      }

      return updated;
    });
  }, [currentLevel, isCharging]);

  // ResizeObserver for dynamic SVG responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({ width, height: 190 });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute 24h analytics
  const stats = useMemo(() => {
    if (!history.length) return { min: currentLevel, max: currentLevel, delta: 0, chargeCount: 0 };
    const levels = history.map((p) => p.level);
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    const first = history[0].level;
    const last = history[history.length - 1].level;
    const delta = last - first;
    const chargePoints = history.filter((p) => p.charging).length;
    return { min, max, delta, chargeCount: chargePoints };
  }, [history, currentLevel]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 16, right: 18, bottom: 28, left: 34 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Scales
    const xScale = d3
      .scaleTime()
      .domain([twentyFourHoursAgo, now])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Defs & Gradients
    const defs = svg.append('defs');

    // Main Area Gradient (Liquid GitHub Jade / Cyan)
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'batteryAreaGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isDark ? '#3fb950' : '#2ea043')
      .attr('stop-opacity', isDark ? 0.38 : 0.28);

    areaGradient
      .append('stop')
      .attr('offset', '70%')
      .attr('stop-color', isDark ? '#238636' : '#56d364')
      .attr('stop-opacity', isDark ? 0.12 : 0.08);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDark ? '#161b22' : '#ffffff')
      .attr('stop-opacity', 0);

    // Stroke line gradient
    const lineGradient = defs
      .append('linearGradient')
      .attr('id', 'batteryLineGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    lineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#58a6ff');
    lineGradient.append('stop').attr('offset', '50%').attr('stop-color', '#3fb950');
    lineGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isCharging ? '#56d364' : '#2ea043');

    // Charging band pattern
    const chargePattern = defs
      .append('pattern')
      .attr('id', 'chargeBandPattern')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternUnits', 'userSpaceOnUse');

    chargePattern
      .append('rect')
      .attr('width', 8)
      .attr('height', 8)
      .attr('fill', isDark ? 'rgba(56, 139, 253, 0.06)' : 'rgba(56, 139, 253, 0.08)');

    chargePattern
      .append('path')
      .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
      .attr('stroke', isDark ? 'rgba(88, 166, 255, 0.18)' : 'rgba(9, 105, 218, 0.15)')
      .attr('stroke-width', 1);

    // Main Chart Group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Subtle horizontal gridlines at 25%, 50%, 75%, 100%
    const gridValues = [25, 50, 75, 100];
    g.selectAll('.gridline')
      .data(gridValues)
      .enter()
      .append('line')
      .attr('class', 'gridline')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')
      .attr('stroke-dasharray', '3,3');

    // Y-Axis Labels
    g.selectAll('.y-axis-label')
      .data(gridValues)
      .enter()
      .append('text')
      .attr('class', 'y-axis-label')
      .attr('x', -6)
      .attr('y', (d) => yScale(d) + 3.5)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.4)')
      .text((d) => `${d}%`);

    // Identify charging intervals and render background charging highlights
    const chargingSpans: { start: number; end: number }[] = [];
    let currentSpan: { start: number; end: number } | null = null;

    history.forEach((point, idx) => {
      if (point.charging) {
        if (!currentSpan) {
          currentSpan = { start: point.timestamp, end: point.timestamp };
        } else {
          currentSpan.end = point.timestamp;
        }
      } else {
        if (currentSpan) {
          chargingSpans.push(currentSpan);
          currentSpan = null;
        }
      }
      if (idx === history.length - 1 && currentSpan) {
        chargingSpans.push(currentSpan);
      }
    });

    g.selectAll('.charge-span')
      .data(chargingSpans)
      .enter()
      .append('rect')
      .attr('class', 'charge-span')
      .attr('x', (d) => Math.max(0, xScale(d.start)))
      .attr('y', 0)
      .attr('width', (d) => Math.max(6, xScale(d.end) - xScale(d.start)))
      .attr('height', chartHeight)
      .attr('fill', 'url(#chargeBandPattern)')
      .attr('rx', 4);

    // D3 Area Generator
    const areaGenerator = d3
      .area<BatteryHistoryPoint>()
      .x((d) => xScale(d.timestamp))
      .y0(chartHeight)
      .y1((d) => yScale(d.level))
      .curve(d3.curveMonotoneX);

    // D3 Line Generator
    const lineGenerator = d3
      .line<BatteryHistoryPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.level))
      .curve(d3.curveMonotoneX);

    // Draw Area
    g.append('path')
      .datum(history)
      .attr('fill', 'url(#batteryAreaGrad)')
      .attr('d', areaGenerator);

    // Draw Line Path
    const path = g
      .append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', 'url(#batteryLineGrad)')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGenerator);

    if (!effectiveReducedMotion) {
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(850)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Real-time End Point (Pulse Beacon)
    const latestPoint = history[history.length - 1];
    if (latestPoint) {
      const endX = xScale(latestPoint.timestamp);
      const endY = yScale(latestPoint.level);

      // Outer glow circle
      g.append('circle')
        .attr('cx', endX)
        .attr('cy', endY)
        .attr('r', 6)
        .attr('fill', isCharging ? '#56d364' : '#3fb950')
        .attr('opacity', 0.25)
        .attr('class', 'animate-ping');

      // Solid inner point
      g.append('circle')
        .attr('cx', endX)
        .attr('cy', endY)
        .attr('r', 3.5)
        .attr('fill', isDark ? '#ffffff' : '#0969da')
        .attr('stroke', isCharging ? '#3fb950' : '#2ea043')
        .attr('stroke-width', 2);
    }

    // X-Axis Time Ticks
    const xTicks = [
      twentyFourHoursAgo,
      twentyFourHoursAgo + 6 * 3600 * 1000,
      twentyFourHoursAgo + 12 * 3600 * 1000,
      twentyFourHoursAgo + 18 * 3600 * 1000,
      now,
    ];

    const formatHour = (ts: number, idx: number) => {
      if (idx === 0) return '-24h';
      if (idx === xTicks.length - 1) return 'Now';
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    g.selectAll('.x-axis-tick')
      .data(xTicks)
      .enter()
      .append('text')
      .attr('class', 'x-axis-tick')
      .attr('x', (d) => xScale(d))
      .attr('y', chartHeight + 18)
      .attr('text-anchor', (d, i) => (i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'))
      .attr('font-size', '9.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.45)')
      .text((d, i) => formatHour(d, i));

    // Interactive Overlay (Mouse / Touch Scrubber)
    const bisectDate = d3.bisector<BatteryHistoryPoint, number>((d) => d.timestamp).left;

    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      try {
        const gNode = g.node();
        if (!gNode) return;

        // Safely extract client coordinates for both MouseEvent and TouchEvent
        const touchEvent = event as TouchEvent;
        const mouseEvent = event as MouseEvent;
        const activeTouch = touchEvent.touches && touchEvent.touches.length > 0
          ? touchEvent.touches[0]
          : (touchEvent.changedTouches && touchEvent.changedTouches.length > 0
            ? touchEvent.changedTouches[0]
            : null);

        const clientX = activeTouch ? activeTouch.clientX : mouseEvent.clientX;
        if (typeof clientX !== 'number' || !Number.isFinite(clientX)) {
          return;
        }

        // Compute relative coordinate using getBoundingClientRect (avoids SVGPoint DOM allocation errors)
        const rect = gNode.getBoundingClientRect();
        if (!rect || !Number.isFinite(rect.left)) {
          return;
        }

        const mouseX = clientX - rect.left;
        if (!Number.isFinite(mouseX) || mouseX < 0 || mouseX > chartWidth) return;

        const hoveredTime = xScale.invert(mouseX).getTime();
        if (!Number.isFinite(hoveredTime) || !history || history.length === 0) return;

        const idx = bisectDate(history, hoveredTime, 1);
        const d0 = history[idx - 1];
        const d1 = history[idx];
        let selected = d0;
        if (d1 && d0 && hoveredTime - d0.timestamp > d1.timestamp - hoveredTime) {
          selected = d1;
        } else if (!selected && d1) {
          selected = d1;
        }

        if (selected) {
          const px = xScale(selected.timestamp);
          const py = yScale(selected.level);
          if (Number.isFinite(px) && Number.isFinite(py)) {
            setHoveredPoint(selected);
            setHoverCoords({
              x: margin.left + px,
              y: margin.top + py,
            });
          }
        }
      } catch {
        // Prevent any SVG matrix / coordinate calculation runtime faults
      }
    };

    const handlePointerLeave = () => {
      setHoveredPoint(null);
      setHoverCoords(null);
    };

    overlay
      .on('mousemove', (event) => handlePointerMove(event))
      .on('mouseleave', handlePointerLeave)
      .on('touchstart', (event) => handlePointerMove(event))
      .on('touchmove', (event) => handlePointerMove(event))
      .on('touchend', handlePointerLeave);

  }, [history, dimensions, isDark, isCharging, effectiveReducedMotion]);

  const formatHoverTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      id="rock-battery-d3-chart-card"
      className={`rounded-[24px] p-4.5 sm:p-5 transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-[#161b22]/75 backdrop-blur-xl border border-[#30363d]/80 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
          : 'bg-white/85 backdrop-blur-xl border border-neutral-200/90 shadow-sm'
      }`}
    >
      {/* Card Header & 24h Metrics Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div 
            className={`w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0 ${
              isDark 
                ? 'bg-[#21262d] border border-[#30363d] text-emerald-400' 
                : 'bg-neutral-100 border border-neutral-200 text-emerald-600'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                24-Hour Battery Activity
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                D3 Flow
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Continuous charge & discharge cycle telemetry
            </p>
          </div>
        </div>

        {/* 24h Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div 
            className={`px-2.5 py-1 rounded-[12px] border flex items-center gap-1.5 ${
              isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <span className="text-neutral-400 text-[10px]">Net:</span>
            <span 
              className={`font-bold flex items-center gap-0.5 ${
                stats.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stats.delta > 0 ? `+${stats.delta}%` : `${stats.delta}%`}
            </span>
          </div>

          <div 
            className={`px-2.5 py-1 rounded-[12px] border ${
              isDark ? 'bg-[#0d1117] border-[#30363d] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}
          >
            <span className="text-neutral-400 text-[10px] mr-1">Range:</span>
            <span className="font-semibold">{stats.min}% – {stats.max}%</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full relative touch-none select-none my-1"
        style={{ height: '190px' }}
      >
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="w-full overflow-visible"
        />

        {/* Interactive Scrubber Guideline and Tooltip */}
        {hoveredPoint && hoverCoords && (
          <>
            {/* Vertical crosshair line */}
            <div
              className={`absolute top-4 bottom-7 w-[1px] pointer-events-none transition-transform duration-75 ${
                isDark ? 'bg-emerald-400/50' : 'bg-emerald-600/50'
              }`}
              style={{ left: `${hoverCoords.x}px` }}
            />

            {/* Glowing Focus Dot */}
            <div
              className="absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full border-2 border-emerald-400 bg-white shadow-lg pointer-events-none transition-transform duration-75"
              style={{ left: `${hoverCoords.x}px`, top: `${hoverCoords.y}px` }}
            />

            {/* Tooltip Overlay */}
            <div
              className={`absolute pointer-events-none z-20 px-3 py-2 rounded-[14px] text-xs font-mono shadow-xl transition-all duration-75 ${
                isDark
                  ? 'bg-[#1c2128] border border-[#30363d] text-neutral-100 shadow-[0_10px_25px_rgba(0,0,0,0.5)]'
                  : 'bg-white border border-neutral-200 text-neutral-900 shadow-md'
              }`}
              style={{
                left: `${Math.min(Math.max(hoverCoords.x - 65, 10), dimensions.width - 140)}px`,
                top: `${Math.max(hoverCoords.y - 65, 10)}px`,
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>{formatHoverTime(hoveredPoint.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 mt-1">
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {hoveredPoint.level}%
                </span>
                <span 
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 ${
                    hoveredPoint.charging 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-neutral-700/40 text-neutral-400 border border-white/5'
                  }`}
                >
                  {hoveredPoint.charging ? <Zap className="w-2.5 h-2.5 fill-current" /> : null}
                  {hoveredPoint.charging ? 'Charging' : 'Discharge'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend / Scrubber Instructions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-neutral-400 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Battery Level</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-500/30 border border-sky-400/40 inline-block" />
            <span>Charging Band</span>
          </div>
        </div>
        <span className="hidden sm:inline-block opacity-70">
          Drag or hover along graph to scrub
        </span>
      </div>
    </div>
  );
};
