/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Thermometer, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Download, 
  RefreshCw, 
  Trash2, 
  Filter, 
  Database,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TelemetryLogger, TelemetryLogEntry } from '../../services/telemetryLog';
import { triggerHaptic } from '../../services/haptics';

interface BatteryTelemetryLogTabProps {
  currentLevel: number;
  isCharging: boolean;
  isDark: boolean;
  effectiveReducedMotion?: boolean;
  hapticEnabled?: boolean;
}

type FilterType = 'all' | 'charging' | 'discharging' | 'peaks';

export const BatteryTelemetryLogTab: React.FC<BatteryTelemetryLogTabProps> = ({
  currentLevel,
  isCharging,
  isDark,
  effectiveReducedMotion = false,
  hapticEnabled = true,
}) => {
  const [logs, setLogs] = useState<TelemetryLogEntry[]>(() => TelemetryLogger.getLogs());
  const [filter, setFilter] = useState<FilterType>('all');
  const [copiedExport, setCopiedExport] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sync latest logs
  const reloadLogs = () => {
    setLogs(TelemetryLogger.getLogs());
  };

  useEffect(() => {
    reloadLogs();
  }, [currentLevel, isCharging]);

  // Handle manual snapshot
  const handleTakeSnapshot = () => {
    triggerHaptic('refresh', { effectiveReducedMotion, hapticEnabled });
    setIsRefreshing(true);
    TelemetryLogger.recordSnapshot(currentLevel, isCharging, 'Manual Refresh');
    reloadLogs();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Handle clear logs
  const handleClear = () => {
    triggerHaptic('alert', { effectiveReducedMotion, hapticEnabled });
    TelemetryLogger.clearLogs();
    // Re-bootstrap fresh current point
    TelemetryLogger.recordSnapshot(currentLevel, isCharging, 'Manual Refresh');
    reloadLogs();
    setShowClearConfirm(false);
  };

  // Handle export
  const handleExport = (type: 'csv' | 'json') => {
    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
    const content = type === 'csv' ? TelemetryLogger.exportAsCsv() : TelemetryLogger.exportAsJson();
    const mime = type === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rock-battery-telemetry-log-${Date.now()}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCopiedExport(type);
    setTimeout(() => setCopiedExport(null), 2500);
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = [...logs].reverse(); // Newest first
    if (filter === 'charging') {
      result = result.filter((l) => l.charging);
    } else if (filter === 'discharging') {
      result = result.filter((l) => !l.charging);
    } else if (filter === 'peaks') {
      result = result.filter((l) => l.temperature >= 32.0 || Math.abs(l.voltDelta) >= 15);
    }
    return result;
  }, [logs, filter]);

  // Overall analytics
  const stats = useMemo(() => {
    if (!logs.length) {
      return {
        latestTemp: 28.5,
        minTemp: 26.0,
        maxTemp: 35.0,
        latestVolt: 3.85,
        minVolt: 3.60,
        maxVolt: 4.20,
        totalCount: 0,
      };
    }
    const temps = logs.map((l) => l.temperature);
    const volts = logs.map((l) => l.voltage);
    const latest = logs[logs.length - 1];

    return {
      latestTemp: latest.temperature,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      latestVolt: latest.voltage,
      minVolt: Math.min(...volts),
      maxVolt: Math.max(...volts),
      totalCount: logs.length,
    };
  }, [logs]);

  // Format relative or concise time
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const secs = d.getSeconds().toString().padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  return (
    <div className="space-y-4">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Temperature Stat Card */}
        <div 
          className={`p-3.5 rounded-[20px] border transition-all ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[8px] bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Thermometer className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-400">
                Cell Thermal Fluctuation
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {stats.latestTemp >= 35 ? 'Warm' : 'Optimal'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-amber-300">
                {stats.latestTemp.toFixed(1)}°C
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">Current</span>
            </div>

            <div className="text-right text-[11px] font-mono text-neutral-400">
              <span>Span: </span>
              <span className="text-neutral-200 font-semibold">{stats.minTemp.toFixed(1)}°</span>
              <span> – </span>
              <span className="text-amber-400 font-semibold">{stats.maxTemp.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* Voltage Stat Card */}
        <div 
          className={`p-3.5 rounded-[20px] border transition-all ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[8px] bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-400">
                Circuit Voltage Dynamics
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {isCharging ? 'Charge IR Overpotential' : 'Open Circuit Voc'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-sky-300">
                {stats.latestVolt.toFixed(3)} V
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">Current</span>
            </div>

            <div className="text-right text-[11px] font-mono text-neutral-400">
              <span>Span: </span>
              <span className="text-neutral-200 font-semibold">{stats.minVolt.toFixed(3)}V</span>
              <span> – </span>
              <span className="text-sky-400 font-semibold">{stats.maxVolt.toFixed(3)}V</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Visual Fluctuation Waveform */}
      {logs.length >= 4 && (
        <div 
          className={`p-3 rounded-[20px] border ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[11px] font-mono text-neutral-300 font-semibold">
                Historical Fluctuations Profile ({stats.totalCount} points)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-0.5 bg-amber-400 inline-block rounded-full" /> Temp (°C)
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-0.5 bg-sky-400 inline-block rounded-full" /> Voltage (V)
              </span>
            </div>
          </div>

          {/* SVG Sparkline */}
          <div className="w-full h-16 relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 64">
              {/* Background horizontal guide lines */}
              <line x1="0" y1="16" x2="400" y2="16" stroke={isDark ? '#21262d' : '#e5e7eb'} strokeDasharray="3 3" />
              <line x1="0" y1="48" x2="400" y2="48" stroke={isDark ? '#21262d' : '#e5e7eb'} strokeDasharray="3 3" />

              {/* Temperature line (amber) */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={logs.map((l, i) => {
                  const divisor = Math.max(1, logs.length - 1);
                  const x = (i / divisor) * 400;
                  const tempDiff = Math.max(0.1, stats.maxTemp - stats.minTemp);
                  const normTemp = (l.temperature - stats.minTemp) / tempDiff;
                  const y = 54 - (Number.isFinite(normTemp) ? normTemp : 0) * 44;
                  return `${Number.isFinite(x) ? x.toFixed(1) : '0'},${Number.isFinite(y) ? y.toFixed(1) : '32'}`;
                }).join(' ')}
              />

              {/* Voltage line (sky) */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={logs.map((l, i) => {
                  const divisor = Math.max(1, logs.length - 1);
                  const x = (i / divisor) * 400;
                  const voltDiff = Math.max(0.01, stats.maxVolt - stats.minVolt);
                  const normVolt = (l.voltage - stats.minVolt) / voltDiff;
                  const y = 54 - (Number.isFinite(normVolt) ? normVolt : 0) * 44;
                  return `${Number.isFinite(x) ? x.toFixed(1) : '0'},${Number.isFinite(y) ? y.toFixed(1) : '32'}`;
                }).join(' ')}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Control and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-neutral-400 font-mono mr-0.5 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all' as const, label: 'All History' },
            { id: 'charging' as const, label: 'Charging' },
            { id: 'discharging' as const, label: 'Discharging' },
            { id: 'peaks' as const, label: 'Peaks / Warming' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFilter(item.id);
                triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                filter === item.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                  : isDark
                  ? 'bg-[#0d1117] text-neutral-400 border-[#30363d] hover:text-white'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:text-black'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Buttons: Take Snapshot & Export */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTakeSnapshot}
            disabled={isRefreshing}
            className={`p-1.5 rounded-[10px] border text-[11px] font-mono flex items-center gap-1 transition-all ${
              isDark ? 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
            title="Record Instantaneous Snapshot"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Log Snapshot</span>
          </button>

          <button
            id="btn-tab-export-csv"
            type="button"
            onClick={() => handleExport('csv')}
            className={`p-1.5 px-2.5 rounded-[10px] border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              isDark ? 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
            title={`Export ${logs.length} telemetry records as CSV`}
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span>{copiedExport === 'csv' ? 'Saved CSV' : 'CSV'}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 font-mono">
              {logs.length}
            </span>
          </button>

          <button
            id="btn-tab-export-json"
            type="button"
            onClick={() => handleExport('json')}
            className={`p-1.5 px-2.5 rounded-[10px] border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              isDark ? 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
            title={`Export ${logs.length} telemetry records as JSON`}
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>{copiedExport === 'json' ? 'Saved JSON' : 'JSON'}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
              {logs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Log Feed Table */}
      <div 
        className={`rounded-[20px] border overflow-hidden transition-all ${
          isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400 font-mono">
              No telemetry entries match the current filter.
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const tempIsUp = entry.tempDelta > 0;
              const tempIsDown = entry.tempDelta < 0;
              const voltIsUp = entry.voltDelta > 0;
              const voltIsDown = entry.voltDelta < 0;

              return (
                <div 
                  key={entry.id} 
                  className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isDark ? 'hover:bg-[#161b22]' : 'hover:bg-neutral-100'
                  }`}
                >
                  {/* Left Column: Timestamp & State */}
                  <div className="flex items-center gap-2.5 min-w-[130px]">
                    <div 
                      className={`w-7 h-7 rounded-[10px] flex items-center justify-center text-xs font-mono font-bold ${
                        entry.charging 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {entry.charging ? <Zap className="w-3.5 h-3.5" /> : `${entry.level}%`}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-neutral-200">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        {entry.charging ? `Charging (${entry.level}%)` : `Discharging (${entry.level}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Temperature & Delta */}
                  <div className="flex items-center gap-4">
                    <div className="font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-300 font-bold">{entry.temperature.toFixed(1)}°C</span>
                        {/* Delta indicator */}
                        <span 
                          className={`text-[10px] px-1 py-0.2 rounded font-semibold flex items-center gap-0.5 ${
                            tempIsUp 
                              ? 'text-amber-400 bg-amber-500/10' 
                              : tempIsDown 
                              ? 'text-sky-400 bg-sky-500/10' 
                              : 'text-neutral-400'
                          }`}
                        >
                          {tempIsUp ? (
                            <>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                              +{entry.tempDelta.toFixed(1)}°
                            </>
                          ) : tempIsDown ? (
                            <>
                              <ArrowDownRight className="w-2.5 h-2.5" />
                              {entry.tempDelta.toFixed(1)}°
                            </>
                          ) : (
                            <>
                              <Minus className="w-2.5 h-2.5" />
                              0.0°
                            </>
                          )}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-500 block uppercase">
                        {entry.thermalState}
                      </span>
                    </div>

                    {/* Right Column: Voltage & Delta */}
                    <div className="font-mono text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sky-300 font-bold">{entry.voltage.toFixed(3)} V</span>
                        {/* Delta indicator */}
                        <span 
                          className={`text-[10px] px-1 py-0.2 rounded font-semibold flex items-center gap-0.5 ${
                            voltIsUp 
                              ? 'text-emerald-400 bg-emerald-500/10' 
                              : voltIsDown 
                              ? 'text-rose-400 bg-rose-500/10' 
                              : 'text-neutral-400'
                          }`}
                        >
                          {voltIsUp ? (
                            <>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                              +{entry.voltDelta}mV
                            </>
                          ) : voltIsDown ? (
                            <>
                              <ArrowDownRight className="w-2.5 h-2.5" />
                              {entry.voltDelta}mV
                            </>
                          ) : (
                            <>
                              <Minus className="w-2.5 h-2.5" />
                              0mV
                            </>
                          )}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-500 block uppercase">
                        {entry.voltageState}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Persistence Note & Clear Logs Option */}
      <div 
        className={`p-3.5 rounded-[20px] border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono">Persistent Hardware Telemetry Store</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                DataStore Synced
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 block">
              Records are saved locally in browser storage and retrieved continuously across app launches.
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end">
          {showClearConfirm ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 text-[11px] font-mono bg-rose-600 hover:bg-rose-500 text-white rounded-[10px] transition-colors font-semibold"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 text-[11px] font-mono border border-neutral-700 text-neutral-400 hover:text-white rounded-[10px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-[11px] font-mono text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1"
            >
              <Trash2 className="w-3 h-3" />
              Reset Trace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
