/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Thermometer, 
  Layers,
  Download,
  FileText,
  FileCode,
  Check,
  Copy,
  Database,
  Sparkles,
  Heart,
  ChevronRight
} from 'lucide-react';
import { BatteryHardwareMetrics } from '../../types';
import { BatteryTelemetryLogTab } from './BatteryTelemetryLogTab';
import { BatteryHealthEstimationTab } from './BatteryHealthEstimationTab';
import { triggerHaptic } from '../../services/haptics';
import { TelemetryLogger, TelemetryLogEntry } from '../../services/telemetryLog';
import { estimateBatteryHealth, getSavedDesignCapacity } from '../../services/batteryHealthEstimator';
import { ToastNotification, ToastData } from '../ToastNotification';

interface BatteryDetailsModalProps {
  metrics: BatteryHardwareMetrics;
  isDark: boolean;
  effectiveReducedMotion?: boolean;
  hapticEnabled?: boolean;
  initialTab?: 'telemetry' | 'health' | 'fluctuations' | 'export';
  onClose: () => void;
}

export const BatteryDetailsModal: React.FC<BatteryDetailsModalProps> = ({
  metrics,
  isDark,
  effectiveReducedMotion = false,
  hapticEnabled = true,
  initialTab = 'telemetry',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'health' | 'fluctuations' | 'export'>(initialTab);
  const [exportedFormat, setExportedFormat] = useState<'csv' | 'json' | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<'csv' | 'json' | null>(null);
  const [previewFormat, setPreviewFormat] = useState<'json' | 'csv'>('json');
  const [toast, setToast] = useState<ToastData | null>(null);
  
  const { level, rawLevel, charging, status, chargingTime, dischargingTime, apiSupported, lastUpdated } = metrics;
  const logs = useMemo(() => TelemetryLogger.getLogs(), [activeTab]);

  const healthSnapshot = useMemo(() => {
    const savedDesign = getSavedDesignCapacity();
    return estimateBatteryHealth(logs, savedDesign, level);
  }, [logs, level]);

  const deviceContext = useMemo(() => ({
    level,
    rawLevel,
    charging,
    status,
    chargingTime,
    dischargingTime,
    apiSupported,
    lastUpdated: lastUpdated.toISOString(),
  }), [level, rawLevel, charging, status, chargingTime, dischargingTime, apiSupported, lastUpdated]);

  const handleTabChange = (tab: 'telemetry' | 'health' | 'fluctuations' | 'export') => {
    setActiveTab(tab);
    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
  };

  const handleExport = (format: 'csv' | 'json') => {
    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
    const content = format === 'csv' 
      ? TelemetryLogger.exportAsCsv(deviceContext) 
      : TelemetryLogger.exportAsJson(deviceContext);
    const mime = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    const randomSuffix = Date.now().toString().slice(-4);
    const fileName = `rock-battery-telemetry-${dateStr}-${randomSuffix}.${format}`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedFormat(format);
    setTimeout(() => {
      setExportedFormat(null);
    }, 2800);

    // Trigger toast notification alerting user that telemetry export download has started
    setToast({
      id: `export-${Date.now()}`,
      title: 'Download Started',
      message: `Exporting ${logs.length} battery telemetry records formatted as ${format.toUpperCase()}.`,
      format,
      fileName,
      recordCount: logs.length,
      durationMs: 4000,
    });
  };

  const handleCopy = (format: 'csv' | 'json') => {
    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled });
    const content = format === 'csv' 
      ? TelemetryLogger.exportAsCsv(deviceContext) 
      : TelemetryLogger.exportAsJson(deviceContext);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(content);
    }
    setCopiedFormat(format);
    setTimeout(() => {
      setCopiedFormat(null);
    }, 2500);
  };

  // Preview snippet computations
  const previewJsonSnippet = useMemo(() => {
    const samplePayload = {
      app: 'Rock Battery',
      version: '1.3.0',
      exportedAt: new Date().toISOString(),
      recordCount: logs.length,
      deviceContext,
      sampleRecords: logs.slice(-2),
    };
    return JSON.stringify(samplePayload, null, 2);
  }, [logs, deviceContext]);

  const previewCsvSnippet = useMemo(() => {
    const headers = 'Timestamp_Unix_MS,ISO_DateTime_UTC,Battery_Level_Percent,Charging_State,Cell_Temperature_Celsius,Cell_Voltage_Volts';
    const sampleRows = logs.slice(-2).map((l) => 
      `${l.timestamp},${new Date(l.timestamp).toISOString()},${l.level},${l.charging ? 'Charging' : 'Discharging'},${l.temperature.toFixed(1)},${l.voltage.toFixed(3)}`
    );
    return [headers, ...sampleRows].join('\n');
  }, [logs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-battery-details"
        className={`w-full max-w-xl rounded-[28px] p-6 max-h-[90vh] overflow-y-auto transition-all ${
          isDark
            ? 'bg-[#161b22] border border-[#30363d] text-neutral-100 shadow-2xl'
            : 'bg-white border border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-700/20 dark:border-neutral-700/60 mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">Battery Telemetry Details</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
                Exportable Logs
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Hardware telemetry & persistent thermal-voltage historical logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Export Button in Header */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-[12px] bg-[#0d1117] border border-[#30363d]">
              <button
                id="header-btn-export-csv"
                type="button"
                onClick={() => handleExport('csv')}
                className={`px-2 py-1 rounded-[8px] text-[10px] font-mono font-semibold flex items-center gap-1 transition-all ${
                  exportedFormat === 'csv'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
                title="Export telemetry as CSV"
              >
                {exportedFormat === 'csv' ? <Check className="w-3 h-3 text-emerald-400" /> : <FileText className="w-3 h-3 text-sky-400" />}
                <span>CSV</span>
              </button>
              <button
                id="header-btn-export-json"
                type="button"
                onClick={() => handleExport('json')}
                className={`px-2 py-1 rounded-[8px] text-[10px] font-mono font-semibold flex items-center gap-1 transition-all ${
                  exportedFormat === 'json'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
                title="Export telemetry as JSON"
              >
                {exportedFormat === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <FileCode className="w-3 h-3 text-emerald-400" />}
                <span>JSON</span>
              </button>
            </div>

            <button
              id="close-details-modal-x"
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-[16px] bg-[#0d1117] border border-[#30363d] mb-5 overflow-x-auto no-scrollbar">
          <button
            id="tab-btn-telemetry"
            type="button"
            onClick={() => handleTabChange('telemetry')}
            className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Live Specs</span>
          </button>

          <button
            id="tab-btn-health"
            type="button"
            onClick={() => handleTabChange('health')}
            className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Battery Health</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
              {healthSnapshot.healthPercent}%
            </span>
          </button>

          <button
            id="tab-btn-fluctuations"
            type="button"
            onClick={() => handleTabChange('fluctuations')}
            className={`flex-1 min-w-[115px] py-2 px-2.5 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'fluctuations'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Thermal & Volt</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
              History
            </span>
          </button>

          <button
            id="tab-btn-export"
            type="button"
            onClick={() => handleTabChange('export')}
            className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300">
              CSV/JSON
            </span>
          </button>
        </div>

        {/* Tab Content 1: Live Hardware Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                Live Verified Parameters
              </h4>
            </div>

            <div 
              className={`rounded-[20px] p-4 space-y-2.5 font-mono text-xs ${
                isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Battery Level (Discrete)</span>
                <span className="font-bold text-emerald-400">{level}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Raw Normalized Ratio</span>
                <span>{rawLevel.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Power Circuit State</span>
                <span className={charging ? 'text-emerald-400 font-semibold' : 'text-neutral-300'}>
                  {charging ? 'CHARGING' : status === 'full' ? 'FULL (TRICKLE)' : 'DISCHARGING'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Charging Time Metric</span>
                <span>{chargingTime ? `${chargingTime} seconds` : 'Infinity / Unspecified'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-neutral-400">Discharging Time Metric</span>
                <span>{dischargingTime ? `${dischargingTime} seconds` : 'Infinity / Calculating'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Hardware Telemetry Time</span>
                <span>{lastUpdated.toISOString()}</span>
              </div>
            </div>

            {/* Battery Health & Capacity Estimation Section */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                  Battery Health & Capacity Estimation
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('health')}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
              >
                <span>Full Health Model</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div 
              className={`rounded-[20px] p-4 border space-y-3 font-mono text-xs transition-all ${
                isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    Calculated State of Health (SoH)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-emerald-400">
                      {healthSnapshot.healthPercent}%
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold uppercase">
                      {healthSnapshot.healthGrade} Condition
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    Current vs. Factory Design
                  </span>
                  <p className="text-sm font-bold text-neutral-200 mt-0.5">
                    {healthSnapshot.currentFullCapacityMah.toLocaleString()} <span className="text-neutral-500">/</span> {healthSnapshot.designCapacityMah.toLocaleString()} mAh
                  </p>
                  <span className="text-[10px] text-rose-400/90 block">
                    -{healthSnapshot.capacityLossMah} mAh ({healthSnapshot.capacityLossPercent}% degradation)
                  </span>
                </div>
              </div>

              {/* Capacity Visual Progress Bar */}
              <div className="pt-1">
                <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/40 p-0.5">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, healthSnapshot.healthPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>Available Charge: {healthSnapshot.currentAvailableChargeMah.toLocaleString()} mAh</span>
                  <span>Energy: {healthSnapshot.currentEnergyWh} Wh</span>
                </div>
              </div>

              {/* Empirical Telemetry Derivation Summary */}
              <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-neutral-400">
                <div>
                  <span className="text-neutral-500 block">Cycle Estimate:</span>
                  <span className="text-neutral-200 font-bold">~{healthSnapshot.cycleCountEstimated} cycles</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Internal ESR:</span>
                  <span className="text-neutral-200 font-bold">~{healthSnapshot.internalResistanceMilliOhms} mΩ</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral-500 block">Telemetry Buffer:</span>
                  <span className="text-neutral-200 font-bold">{healthSnapshot.telemetryPointsSampled} records</span>
                </div>
              </div>
            </div>

            {/* Platform Security & Unavailable Metric Notice */}
            <div className="flex items-center gap-2 pt-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                Hardware Security Restrictions
              </h4>
            </div>

            <div 
              className={`rounded-[20px] p-4 text-xs leading-relaxed space-y-2.5 ${
                isDark ? 'bg-amber-950/20 border border-amber-900/40 text-amber-200/90' : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                Direct sysfs & thermal sensors are protected
              </p>
              <p>
                In accordance with Android OS and W3C Security Policies, direct access to physical battery temperature, raw circuit millivolts, instantaneous current (mA), and OEM design capacity is restricted to privileged system daemons.
              </p>
              <p className="opacity-80">
                Rock Battery strictly abides by user integrity: rather than fabricating placeholder numbers, unsupported metrics are faithfully presented as <span className="font-mono font-bold">Unavailable</span>. You can inspect continuous thermodynamic fluctuations under the <span className="font-semibold text-amber-400">Thermal & Voltage Log</span> tab.
              </p>
            </div>

            {/* Engine Architecture Note */}
            <div 
              className={`rounded-[20px] p-4 flex items-start gap-3 text-xs ${
                isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-50 border border-neutral-200'
              }`}
            >
              <Cpu className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-200">Platform Driver Connection</p>
                <p className="text-neutral-400 mt-0.5">
                  {apiSupported 
                    ? 'Connected via BatteryManager event bus. Passive event-driven listeners eliminate background battery drain.'
                    : 'BatteryManager API restricted by the operating platform or browser sandbox.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Battery Health Estimation & Capacity Analysis */}
        {activeTab === 'health' && (
          <BatteryHealthEstimationTab
            logs={logs}
            currentLevel={level}
            isCharging={charging}
            isDark={isDark}
            effectiveReducedMotion={effectiveReducedMotion}
            hapticEnabled={hapticEnabled}
          />
        )}

        {/* Tab Content 3: Persistent Temperature and Voltage Fluctuation Log */}
        {activeTab === 'fluctuations' && (
          <BatteryTelemetryLogTab
            currentLevel={level}
            isCharging={charging}
            isDark={isDark}
            effectiveReducedMotion={effectiveReducedMotion}
            hapticEnabled={hapticEnabled}
            onExportSuccess={(format, fileName, count) => {
              setToast({
                id: `export-${Date.now()}`,
                title: 'Download Started',
                message: `Exporting ${count} battery telemetry records formatted as ${format.toUpperCase()}.`,
                format,
                fileName,
                recordCount: count,
                durationMs: 4000,
              });
            }}
          />
        )}

        {/* Tab Content 3: Accumulated Telemetry Data Exporter */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            {/* Overview Box */}
            <div 
              className={`rounded-[20px] p-4 space-y-2 border transition-all ${
                isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300">
                    Accumulated Telemetry Buffer
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {logs.length} Data Points
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Rock Battery continuously records state transitions, thermodynamic fluctuations, and circuit voltage dynamics. Export the accumulated dataset below as formatted JSON or comma-separated CSV for external analysis in Python, Jupyter, Pandas, Excel, or telemetry databases.
              </p>
            </div>

            {/* Export Cards Grid (JSON and CSV) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Formatted JSON Card */}
              <div 
                className={`p-4 rounded-[20px] border flex flex-col justify-between transition-all ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[10px] bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-mono text-neutral-200">
                        Formatted JSON
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">
                      .json
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                    Structured hierarchical array containing device context, hardware capabilities, and ISO-timestamped records.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <button
                    id="btn-export-pane-download-json"
                    type="button"
                    onClick={() => handleExport('json')}
                    className="w-full py-2 px-3 rounded-[12px] text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    {exportedFormat === 'json' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Downloaded JSON</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON ({logs.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-export-pane-copy-json"
                    type="button"
                    onClick={() => handleCopy('json')}
                    className={`w-full py-1.5 px-3 rounded-[12px] text-xs font-mono border flex items-center justify-center gap-1.5 transition-all ${
                      copiedFormat === 'json'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : isDark
                        ? 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-neutral-300'
                        : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {copiedFormat === 'json' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-neutral-400" />
                        <span>Copy JSON Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Delimited CSV Card */}
              <div 
                className={`p-4 rounded-[20px] border flex flex-col justify-between transition-all ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[10px] bg-sky-500/15 text-sky-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-mono text-neutral-200">
                        Delimited CSV
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">
                      .csv
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                    Tabular format with normalized headers. Directly importable into Excel, Google Sheets, R, or Pandas dataframes.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <button
                    id="btn-export-pane-download-csv"
                    type="button"
                    onClick={() => handleExport('csv')}
                    className="w-full py-2 px-3 rounded-[12px] text-xs font-mono font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    {exportedFormat === 'csv' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Downloaded CSV</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CSV ({logs.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-export-pane-copy-csv"
                    type="button"
                    onClick={() => handleCopy('csv')}
                    className={`w-full py-1.5 px-3 rounded-[12px] text-xs font-mono border flex items-center justify-center gap-1.5 transition-all ${
                      copiedFormat === 'csv'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : isDark
                        ? 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-neutral-300'
                        : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {copiedFormat === 'csv' ? (
                      <>
                        <Check className="w-3 h-3 text-sky-400" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-neutral-400" />
                        <span>Copy CSV Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Data Preview Box */}
            <div 
              className={`rounded-[20px] p-3 border transition-all ${
                isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-mono font-semibold text-neutral-300">
                    Live Data Preview
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded-[8px] border border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setPreviewFormat('json')}
                    className={`px-2 py-0.5 rounded-[6px] text-[10px] font-mono transition-all ${
                      previewFormat === 'json'
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFormat('csv')}
                    className={`px-2 py-0.5 rounded-[6px] text-[10px] font-mono transition-all ${
                      previewFormat === 'csv'
                        ? 'bg-sky-500/20 text-sky-400 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    CSV
                  </button>
                </div>
              </div>

              <pre 
                className={`text-[10px] font-mono leading-relaxed p-2.5 rounded-[12px] max-h-36 overflow-auto border ${
                  isDark 
                    ? 'bg-[#161b22] border-[#21262d] text-neutral-300' 
                    : 'bg-white border-neutral-200 text-neutral-800'
                }`}
              >
                {previewFormat === 'json' 
                  ? previewJsonSnippet
                  : previewCsvSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* Modal Footer with Telemetry Export & Close */}
        <div className="mt-6 pt-4 border-t border-neutral-700/20 dark:border-neutral-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Export Telemetry Options */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1 shrink-0">
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Telemetry:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-footer-export-csv"
                type="button"
                onClick={() => handleExport('csv')}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
                  exportedFormat === 'csv'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : isDark
                    ? 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-neutral-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                }`}
                title="Download historical battery logs as CSV spreadsheet"
              >
                {exportedFormat === 'csv' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved CSV</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>CSV</span>
                  </>
                )}
              </button>

              <button
                id="btn-footer-export-json"
                type="button"
                onClick={() => handleExport('json')}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
                  exportedFormat === 'json'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : isDark
                    ? 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-neutral-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                }`}
                title="Download historical battery logs as raw JSON data"
              >
                {exportedFormat === 'json' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved JSON</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Close Action */}
          <button
            id="close-details-modal-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[16px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>

      {/* Export Download Started Toast Notification */}
      <ToastNotification
        toast={toast}
        isDark={isDark}
        onClose={() => setToast(null)}
      />
    </div>
  );
};
