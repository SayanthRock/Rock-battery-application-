/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Moon, 
  Sun, 
  Monitor, 
  RefreshCw, 
  Zap, 
  Activity, 
  Bell, 
  Info, 
  Check, 
  Github,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  Sliders,
  Sparkles,
  Database,
  Volume2,
  VolumeX,
  Radio,
  Vibrate,
  VibrateOff,
  ExternalLink,
  Copy,
  GitBranch,
  UploadCloud,
  ZapOff,
  Leaf
} from 'lucide-react';
import { AppPreferences, ThemeMode } from '../../types';
import { BackgroundMonitor, BackgroundMonitorStatus } from '../../services/backgroundMonitor';
import { triggerHaptic } from '../../services/haptics';

interface SettingsModalProps {
  preferences: AppPreferences;
  onUpdatePreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  isDark: boolean;
  effectiveReducedMotion?: boolean;
  onClose: () => void;
  onTogglePreviewCritical?: () => void;
  isPreviewCritical?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  preferences,
  onUpdatePreference,
  isDark,
  effectiveReducedMotion,
  onClose,
  onTogglePreviewCritical,
  isPreviewCritical = false,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<string>(() => {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [bgStatus, setBgStatus] = useState<BackgroundMonitorStatus>(() => BackgroundMonitor.getStatus());
  const [testSent, setTestSent] = useState<string | null>(null);
  const [copiedGitCmd, setCopiedGitCmd] = useState<boolean>(false);

  useEffect(() => {
    const unsub = BackgroundMonitor.subscribeStatus((status) => {
      setBgStatus(status);
    });
    return unsub;
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationStatus(perm);
        if (perm === 'granted') {
          onUpdatePreference('lowBatteryNotification', true);
          onUpdatePreference('fullBatteryNotification', true);
          onUpdatePreference('intelligentCharging', true);
        }
      } catch {
        // Ignored
      }
    }
  };

  const handleTestNotification = async (type: 'low' | 'full' | 'intelligent' = 'low') => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await requestNotificationPermission();
    }

    try {
      BackgroundMonitor.testAlert(type);
      setTestSent(type);
      setTimeout(() => setTestSent(null), 2500);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-app-settings"
        className={`w-full max-w-lg rounded-[28px] p-6 max-h-[90vh] overflow-y-auto transition-all ${
          isDark
            ? 'bg-[#161b22] border border-[#30363d] text-neutral-100 shadow-2xl'
            : 'bg-white border border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-700/20 dark:border-neutral-700/60 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-neutral-800 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">App Settings</h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Sayanth Rock / GitHub Rock design controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 text-sm">
          {/* Theme Option */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 block mb-2">
              Appearance & Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'system' as ThemeMode, label: 'Follow System', icon: <Monitor className="w-4 h-4" /> },
                { mode: 'dark' as ThemeMode, label: 'Dark Charcoal', icon: <Moon className="w-4 h-4" /> },
                { mode: 'light' as ThemeMode, label: 'Pure Light', icon: <Sun className="w-4 h-4" /> },
              ].map((t) => (
                <button
                  key={t.mode}
                  id={`theme-select-${t.mode}`}
                  onClick={() => {
                    onUpdatePreference('theme', t.mode);
                    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                  }}
                  className={`p-3 rounded-[18px] border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-medium ${
                    preferences.theme === t.mode
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-semibold'
                      : isDark
                      ? 'bg-[#0d1117] border-[#30363d] text-neutral-400 hover:text-white'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Low Power Mode Toggle */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 block mb-2">
              Power Management
            </label>
            <div 
              id="card-low-power-mode"
              className={`p-4 rounded-[22px] border transition-all ${
                preferences.lowPowerMode
                  ? isDark
                    ? 'bg-[#181308]/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-amber-50/90 border-amber-300 shadow-md shadow-amber-500/5'
                  : isDark
                  ? 'bg-[#0d1117] border-[#30363d]'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div 
                    className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-colors ${
                      preferences.lowPowerMode
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isDark ? 'bg-[#161b22] text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    <ZapOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold block">Low Power Mode</span>
                      {preferences.lowPowerMode && (
                        <span 
                          id="pill-low-power-saving"
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] block ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Throttles refresh interval to 60s and visually alters the Status Banner
                    </span>
                  </div>
                </div>

                <button
                  id="toggle-low-power-mode"
                  type="button"
                  onClick={() => {
                    const nextVal = !preferences.lowPowerMode;
                    onUpdatePreference('lowPowerMode', nextVal);
                    if (nextVal) {
                      // Automatically reduce refresh interval if it was 15s or 30s
                      if (preferences.refreshInterval === 15 || preferences.refreshInterval === 30) {
                        onUpdatePreference('refreshInterval', 60);
                      }
                    }
                    triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ml-3 ${
                    preferences.lowPowerMode ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                  aria-label="Toggle Low Power Mode"
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      preferences.lowPowerMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {preferences.lowPowerMode && (
                <div className="mt-3 pt-2.5 border-t border-amber-500/20 text-[11px] font-mono text-amber-400 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Energy-saving profile engaged: StatusBanner updated & polling rate throttled.</span>
                </div>
              )}
            </div>
          </div>

          {/* Battery Refresh Behavior */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 block">
                Battery Refresh Behavior
              </label>
              {preferences.lowPowerMode && (
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  <ZapOff className="w-2.5 h-2.5" />
                  Throttled to 60s (Low Power Mode)
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: 'events' as const, label: 'OS Events', sub: 'Zero overhead' },
                { val: 15 as const, label: 'Every 15s', sub: 'High cadence' },
                { val: 30 as const, label: 'Every 30s', sub: 'Balanced' },
                { val: 60 as const, label: 'Every 60s', sub: 'Power saver' },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  id={`refresh-opt-${opt.val}`}
                  onClick={() => {
                    onUpdatePreference('refreshInterval', opt.val);
                    triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                  }}
                  className={`p-2.5 rounded-[16px] border flex flex-col items-center justify-center gap-0.5 text-center transition-all ${
                    preferences.refreshInterval === opt.val
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                      : isDark
                      ? 'bg-[#0d1117] border-[#30363d] text-neutral-400'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                  }`}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] opacity-70 font-mono">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Animation & Reduced Motion */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 block mb-2">
              Motion & Liquid Experience
            </label>
            
            {/* Charging Flow Toggle */}
            <div 
              className={`p-3.5 rounded-[20px] border flex items-center justify-between mb-3 ${
                isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold block">Charging Flow Animation</span>
                  <span className="text-[11px] text-neutral-400 block">
                    Visibly animate liquid energy through the battery ring
                  </span>
                </div>
              </div>
              <button
                id="toggle-charging-animation"
                onClick={() => {
                  const nextVal = !preferences.chargingAnimation;
                  onUpdatePreference('chargingAnimation', nextVal);
                  triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  preferences.chargingAnimation ? 'bg-emerald-600' : 'bg-neutral-700'
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.chargingAnimation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion Setting */}
            <div 
              className={`p-3.5 rounded-[20px] border flex items-center justify-between ${
                isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-semibold block">Reduced-Motion Support</span>
                  <span className="text-[11px] text-neutral-400 block">
                    Honors accessibility guidelines and eliminates flashing
                  </span>
                </div>
              </div>
              <select
                id="select-reduced-motion"
                value={preferences.reducedMotion}
                onChange={(e) => {
                  const val = e.target.value as AppPreferences['reducedMotion'];
                  onUpdatePreference('reducedMotion', val);
                  triggerHaptic('selection', { 
                    effectiveReducedMotion: val === 'reduce', 
                    hapticEnabled: preferences.hapticFeedback 
                  });
                }}
                className={`text-xs px-2.5 py-1.5 rounded-[12px] font-mono border focus:outline-none ${
                  isDark 
                    ? 'bg-[#161b22] border-[#30363d] text-neutral-200' 
                    : 'bg-white border-neutral-300 text-neutral-800'
                }`}
              >
                <option value="system">Follow System</option>
                <option value="reduce">Force Reduced</option>
                <option value="no-preference">Full Motion</option>
              </select>
            </div>

            {/* Tactile Haptic Feedback Setting */}
            <div 
              className={`p-3.5 rounded-[20px] border flex items-center justify-between mt-3 ${
                isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className={`w-7 h-7 rounded-[10px] flex items-center justify-center ${
                    preferences.hapticFeedback && !effectiveReducedMotion
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : isDark ? 'bg-[#161b22] text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {preferences.hapticFeedback && !effectiveReducedMotion ? (
                    <Vibrate className="w-4 h-4" />
                  ) : (
                    <VibrateOff className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold block">Tactile Haptic Feedback</span>
                    {effectiveReducedMotion && (
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        Suppressed by Reduced Motion
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400 block">
                    Subtle physical vibration for refreshes, modals, and interface toggles
                  </span>
                </div>
              </div>

              <button
                id="toggle-haptic-feedback"
                onClick={() => {
                  const next = !preferences.hapticFeedback;
                  onUpdatePreference('hapticFeedback', next);
                  if (next) {
                    triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: true });
                  }
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  preferences.hapticFeedback && !effectiveReducedMotion ? 'bg-amber-600' : 'bg-neutral-700'
                }`}
                aria-label="Toggle tactile haptic feedback"
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.hapticFeedback && !effectiveReducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notification Alerts & Custom Thresholds Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                Notification Alerts & Thresholds
              </label>
              {notificationStatus === 'granted' ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  Permission Granted
                </span>
              ) : (
                <button
                  id="btn-request-notifications"
                  onClick={requestNotificationPermission}
                  className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 underline underline-offset-2 transition-colors"
                >
                  Enable OS Alerts
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Intelligent Charging (80% Health Limit) Card */}
              <div 
                className={`p-4 rounded-[22px] border transition-all ${
                  preferences.intelligentCharging
                    ? isDark
                      ? 'bg-[#0d1520] border-sky-500/40 shadow-lg shadow-sky-500/5'
                      : 'bg-sky-50/80 border-sky-300 shadow-md shadow-sky-500/5'
                    : isDark
                    ? 'bg-[#0d1117] border-[#30363d]'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className={`w-7 h-7 rounded-[10px] flex items-center justify-center transition-colors ${
                        preferences.intelligentCharging
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : isDark ? 'bg-[#161b22] text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-tight block">
                          Intelligent Charging
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
                          80% Health Limit
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        Alert when battery reaches 80% to preserve cell longevity
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                        preferences.intelligentCharging
                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/25'
                          : 'bg-neutral-800/40 text-neutral-500 border-white/5'
                      }`}
                    >
                      80%
                    </span>

                    <button
                      id="toggle-intelligent-charging"
                      onClick={() => {
                        const nextVal = !preferences.intelligentCharging;
                        onUpdatePreference('intelligentCharging', nextVal);
                        triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                      }}
                      className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                        preferences.intelligentCharging ? 'bg-sky-500' : 'bg-neutral-700'
                      }`}
                      aria-label="Toggle intelligent 80% charging alert"
                    >
                      <div 
                        className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                          preferences.intelligentCharging ? 'translate-x-4.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Electrochemical Explanation & Health Saver Spec */}
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-start gap-2 text-[11px] text-neutral-400 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <p>
                      Charging lithium-ion cells past 80% induces elevated electrochemical strain on the cathode and accelerates capacity degradation. Unplugging at 80% prolongs pack lifespan up to <strong className="text-neutral-200">2.5× to 3×</strong>.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        Optimal Lifespan: 20% - 80%
                      </span>
                    </div>

                    <button
                      id="btn-test-intelligent-alert"
                      type="button"
                      onClick={() => {
                        triggerHaptic('alert', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                        handleTestNotification('intelligent');
                      }}
                      className="px-2.5 py-1 rounded-[8px] text-[10px] font-mono font-semibold flex items-center gap-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all active:scale-95"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{testSent === 'intelligent' ? 'Alert Sent!' : 'Test 80% Alert'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Low Battery Custom Threshold Card */}
              <div 
                className={`p-4 rounded-[22px] border transition-all ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-7 h-7 rounded-[10px] flex items-center justify-center ${
                        preferences.lowBatteryNotification
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : isDark ? 'bg-[#161b22] text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold tracking-tight block">
                        Low Battery Alert
                      </span>
                      <span className="text-[11px] text-neutral-400 block">
                        Warn when discharging past safety threshold
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                        preferences.lowBatteryNotification
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-neutral-800/40 text-neutral-500 border-white/5'
                      }`}
                    >
                      {preferences.lowBatteryThreshold || 20}%
                    </span>

                    <button
                      id="toggle-low-battery-alert"
                      onClick={() => {
                        const nextVal = !preferences.lowBatteryNotification;
                        onUpdatePreference('lowBatteryNotification', nextVal);
                        triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                      }}
                      className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                        preferences.lowBatteryNotification ? 'bg-rose-600' : 'bg-neutral-700'
                      }`}
                      aria-label="Toggle low battery alert"
                    >
                      <div 
                        className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                          preferences.lowBatteryNotification ? 'translate-x-4.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Slider and Presets */}
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Threshold Trigger:</span>
                    <span className="text-neutral-200 font-semibold">{preferences.lowBatteryThreshold || 20}% Battery Level</span>
                  </div>

                  <input
                    type="range"
                    id="slider-low-battery-threshold"
                    min="5"
                    max="40"
                    step="1"
                    disabled={!preferences.lowBatteryNotification}
                    value={preferences.lowBatteryThreshold || 20}
                    onChange={(e) => {
                      onUpdatePreference('lowBatteryThreshold', Number(e.target.value));
                      triggerHaptic('slider', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                    }}
                    className="w-full accent-rose-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  />

                  {/* Preset Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono mr-1">Presets:</span>
                    {[10, 15, 20, 25, 30].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={!preferences.lowBatteryNotification}
                        onClick={() => {
                          onUpdatePreference('lowBatteryThreshold', preset);
                          triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                        }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                          (preferences.lowBatteryThreshold || 20) === preset
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                            : isDark
                            ? 'bg-[#161b22] text-neutral-400 border-[#30363d] hover:text-white'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:text-black'
                        } disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        {preset}%{preset === 20 ? ' (Standard)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fully Charged / Target Charge Custom Threshold Card */}
              <div 
                className={`p-4 rounded-[22px] border transition-all ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-7 h-7 rounded-[10px] flex items-center justify-center ${
                        preferences.fullBatteryNotification
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isDark ? 'bg-[#161b22] text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold tracking-tight block">
                        Fully Charged / Target Saturation
                      </span>
                      <span className="text-[11px] text-neutral-400 block">
                        Alert when target charge point is reached
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                        preferences.fullBatteryNotification
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-neutral-800/40 text-neutral-500 border-white/5'
                      }`}
                    >
                      {preferences.fullBatteryThreshold || 100}%
                    </span>

                    <button
                      id="toggle-full-battery-alert"
                      onClick={() => {
                        const nextVal = !preferences.fullBatteryNotification;
                        onUpdatePreference('fullBatteryNotification', nextVal);
                        triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                      }}
                      className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                        preferences.fullBatteryNotification ? 'bg-emerald-600' : 'bg-neutral-700'
                      }`}
                      aria-label="Toggle full battery alert"
                    >
                      <div 
                        className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                          preferences.fullBatteryNotification ? 'translate-x-4.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Slider and Presets */}
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Target Saturation Limit:</span>
                    <span className="text-neutral-200 font-semibold">{preferences.fullBatteryThreshold || 100}% Capacity</span>
                  </div>

                  <input
                    type="range"
                    id="slider-full-battery-threshold"
                    min="70"
                    max="100"
                    step="1"
                    disabled={!preferences.fullBatteryNotification}
                    value={preferences.fullBatteryThreshold || 100}
                    onChange={(e) => {
                      onUpdatePreference('fullBatteryThreshold', Number(e.target.value));
                      triggerHaptic('slider', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                    }}
                    className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  />

                  {/* Preset Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono mr-1">Presets:</span>
                    {[
                      { val: 80, label: '80% (Health Saver)' },
                      { val: 85, label: '85%' },
                      { val: 90, label: '90%' },
                      { val: 100, label: '100% (Full)' },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        disabled={!preferences.fullBatteryNotification}
                        onClick={() => {
                          onUpdatePreference('fullBatteryThreshold', preset.val);
                          triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                        }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                          (preferences.fullBatteryThreshold || 100) === preset.val
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                            : isDark
                            ? 'bg-[#161b22] text-neutral-400 border-[#30363d] hover:text-white'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:text-black'
                        } disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Background Hardware Monitoring & Sound Card */}
              <div 
                className={`p-4 rounded-[22px] border transition-all ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-7 h-7 rounded-[10px] flex items-center justify-center ${
                        preferences.backgroundMonitoring
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : isDark ? 'bg-[#161b22] text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-tight">
                          Background Monitoring
                        </span>
                        {preferences.backgroundMonitoring && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Heartbeat
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 block">
                        Maintains active battery checks even when tab is backgrounded
                      </span>
                    </div>
                  </div>

                  <button
                    id="toggle-background-monitoring"
                    onClick={() => {
                      const nextVal = !preferences.backgroundMonitoring;
                      onUpdatePreference('backgroundMonitoring', nextVal);
                      triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                    }}
                    className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                      preferences.backgroundMonitoring ? 'bg-sky-600' : 'bg-neutral-700'
                    }`}
                    aria-label="Toggle background monitoring"
                  >
                    <div 
                      className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                        preferences.backgroundMonitoring ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Chime Alert Option */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-6 h-6 rounded-[8px] flex items-center justify-center ${
                        preferences.soundAlert
                          ? 'bg-purple-500/15 text-purple-400'
                          : isDark ? 'bg-[#161b22] text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {preferences.soundAlert ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">Acoustic Alert Chime</span>
                      <span className="text-[11px] text-neutral-400 block">
                        Play soothing synthesized tone when thresholds are reached
                      </span>
                    </div>
                  </div>

                  <button
                    id="toggle-sound-alert"
                    onClick={() => {
                      const nextVal = !preferences.soundAlert;
                      onUpdatePreference('soundAlert', nextVal);
                      triggerHaptic('toggle', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                    }}
                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                      preferences.soundAlert ? 'bg-purple-600' : 'bg-neutral-700'
                    }`}
                    aria-label="Toggle sound alert"
                  >
                    <div 
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        preferences.soundAlert ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* DataStore Persistence & Test Alert Triggers */}
              <div 
                className={`p-3.5 rounded-[20px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono">DataStore Persisted</span>
                      <span className="text-[10px] font-mono text-emerald-400 px-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                        Local + Broadcast
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block">
                      Custom thresholds stored locally and synced across windows
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    id="btn-test-intelligent-alert-footer"
                    type="button"
                    onClick={() => {
                      triggerHaptic('alert', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                      handleTestNotification('intelligent');
                    }}
                    className="px-2.5 py-1 rounded-[10px] text-[11px] font-semibold flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] border border-sky-500/30 text-sky-300 transition-all active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>{testSent === 'intelligent' ? 'Fired!' : 'Test 80% Alert'}</span>
                  </button>

                  <button
                    id="btn-test-low-alert"
                    type="button"
                    onClick={() => {
                      triggerHaptic('alert', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                      handleTestNotification('low');
                    }}
                    className="px-2.5 py-1 rounded-[10px] text-[11px] font-semibold flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] border border-rose-500/30 text-rose-300 transition-all active:scale-95"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{testSent === 'low' ? 'Fired!' : `Test Low (${preferences.lowBatteryThreshold || 20}%)`}</span>
                  </button>

                  <button
                    id="btn-test-full-alert"
                    type="button"
                    onClick={() => {
                      triggerHaptic('alert', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                      handleTestNotification('full');
                    }}
                    className="px-2.5 py-1 rounded-[10px] text-[11px] font-semibold flex items-center gap-1 bg-[#21262d] hover:bg-[#30363d] border border-emerald-500/30 text-emerald-300 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{testSent === 'full' ? 'Fired!' : `Test Target (${preferences.fullBatteryThreshold || 100}%)`}</span>
                  </button>

                  {onTogglePreviewCritical && (
                    <button
                      id="btn-toggle-quick-glance-preview"
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                        onTogglePreviewCritical();
                        onClose();
                      }}
                      className={`px-2.5 py-1 rounded-[10px] text-[11px] font-semibold flex items-center gap-1 border transition-all active:scale-95 ${
                        isPreviewCritical
                          ? 'bg-rose-500/30 border-rose-500/60 text-rose-200'
                          : 'bg-[#21262d] hover:bg-[#30363d] border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>{isPreviewCritical ? 'Exit <20% Glance' : 'Preview <20% Glance'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Rock Battery */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 block mb-2">
              About Rock Battery
            </label>
            <div 
              className={`p-4 rounded-[22px] border space-y-2 text-xs leading-relaxed ${
                isDark ? 'bg-[#0d1117] border-[#30363d] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <a
                  id="settings-github-repo-link"
                  href="https://github.com/sayanth/rock-battery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors group"
                  title="Open GitHub Repository"
                >
                  <Github className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Sayanth Rock / GitHub</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
                </a>
                <span className="font-mono text-xs text-emerald-400">v1.3.0 (Rock Engine v2.4)</span>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Built with the Liquid GitHub Luxury design language: charcoal layered surfaces, 24dp rounded corners, thin semantic borders, and zero-compromise hardware privacy.
              </p>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Real Hardware Telemetry: W3C Battery Status API</span>
                <span className="font-semibold text-emerald-400">Zero Tracking</span>
              </div>
            </div>
          </div>

          {/* GitHub Repository Sync & Upload Guide */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                <span>GitHub Repository Upload & Sync</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                5 Commits Ready
              </span>
            </div>

            <div 
              className={`p-4 rounded-[22px] border space-y-3 text-xs leading-relaxed ${
                isDark ? 'bg-[#0d1117] border-[#30363d] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[12px] bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-neutral-200">How to Push Changes to GitHub</p>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Target repo: <span className="font-mono text-sky-400">sayanth/rock-battery</span> (branch: <span className="font-mono text-emerald-400">main</span>). All bug fixes and features are committed cleanly.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Method 1: AI Studio Export UI */}
                <div className={`p-3 rounded-[16px] border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'}`}>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-1">
                    Method 1: AI Studio One-Click
                  </span>
                  <p className="text-[11px] text-neutral-300 leading-snug">
                    Open the top right AI Studio menu (three dots / gear) and select <strong className="text-white">Export to GitHub</strong> to push all commits with zero terminal setup.
                  </p>
                </div>

                {/* Method 2: Git CLI */}
                <div className={`p-3 rounded-[16px] border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-neutral-200'}`}>
                  <span className="text-[10px] font-mono text-sky-400 uppercase font-bold block mb-1">
                    Method 2: Personal Access Token
                  </span>
                  <p className="text-[11px] text-neutral-300 leading-snug">
                    Authenticate via token to push directly from any terminal or workflow:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('git push https://<GITHUB_TOKEN>@github.com/sayanth/rock-battery.git main');
                      setCopiedGitCmd(true);
                      triggerHaptic('selection', { effectiveReducedMotion, hapticEnabled: preferences.hapticFeedback });
                      setTimeout(() => setCopiedGitCmd(false), 2500);
                    }}
                    className={`mt-2 w-full py-1.5 px-2.5 rounded-[10px] font-mono text-[10px] font-bold flex items-center justify-between transition-all ${
                      copiedGitCmd
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#0d1117] hover:bg-[#21262d] text-neutral-300 border border-[#30363d]'
                    }`}
                  >
                    <span className="truncate">git push origin main</span>
                    {copiedGitCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[16px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};
