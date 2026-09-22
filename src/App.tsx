/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBattery } from './hooks/useBattery';
import { usePreferences } from './hooks/useTheme';
import { Header } from './components/Header';
import { BatteryRing } from './components/BatteryRing';
import { StatusBanner } from './components/StatusBanner';
import { QuickGlanceCriticalCard } from './components/QuickGlanceCriticalCard';
import { MetricsGrid } from './components/MetricsGrid';
import { QuickActions } from './components/QuickActions';
import { UnavailableState } from './components/UnavailableState';
import { BatteryDetailsModal } from './components/Modals/BatteryDetailsModal';
import { BatteryUsageModal } from './components/Modals/BatteryUsageModal';
import { ChargingInfoModal } from './components/Modals/ChargingInfoModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ActiveModal, ThemeMode } from './types';
import { Wifi, Signal, BatteryMedium } from 'lucide-react';
import { triggerHaptic } from './services/haptics';

export default function App() {
  const {
    preferences,
    updatePreference,
    isDark,
    effectiveReducedMotion,
  } = usePreferences();

  const {
    metrics,
    isRefreshing,
    refresh,
    tier,
  } = useBattery(
    preferences.refreshInterval,
    preferences.lowBatteryNotification,
    preferences.fullBatteryNotification,
    preferences.lowBatteryThreshold,
    preferences.fullBatteryThreshold,
    preferences.intelligentCharging
  );

  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [detailsInitialTab, setDetailsInitialTab] = useState<'telemetry' | 'fluctuations' | 'export'>('telemetry');
  const [previewCriticalMode, setPreviewCriticalMode] = useState(false);

  // Haptic-enabled refresh action honoring accessibility
  const handleRefresh = () => {
    triggerHaptic('refresh', { 
      effectiveReducedMotion, 
      hapticEnabled: preferences.hapticFeedback 
    });
    refresh();
  };

  // Haptic-enabled modal opener honoring accessibility
  const handleOpenModal = (modal: ActiveModal, initialTab: 'telemetry' | 'fluctuations' | 'export' = 'telemetry') => {
    if (modal !== 'none') {
      triggerHaptic('modal-open', { 
        effectiveReducedMotion, 
        hapticEnabled: preferences.hapticFeedback 
      });
    } else {
      triggerHaptic('modal-close', { 
        effectiveReducedMotion, 
        hapticEnabled: preferences.hapticFeedback 
      });
    }
    setDetailsInitialTab(initialTab);
    setActiveModal(modal);
  };

  // Haptic-enabled modal close action
  const handleCloseModal = () => {
    triggerHaptic('modal-close', { 
      effectiveReducedMotion, 
      hapticEnabled: preferences.hapticFeedback 
    });
    setActiveModal('none');
  };

  // Theme cycle: system -> dark -> light -> system
  const handleThemeCycle = () => {
    triggerHaptic('selection', { 
      effectiveReducedMotion, 
      hapticEnabled: preferences.hapticFeedback 
    });
    const sequence: ThemeMode[] = ['system', 'dark', 'light'];
    const nextIndex = (sequence.indexOf(preferences.theme) + 1) % sequence.length;
    updatePreference('theme', sequence[nextIndex]);
  };

  return (
    <div 
      className={`min-h-screen w-full flex flex-col items-center justify-start transition-colors duration-300 ${
        isDark ? 'bg-[#0b0f14] text-neutral-100' : 'bg-[#f6f8fa] text-neutral-900'
      }`}
    >
      {/* Mobile-optimized viewport wrapper with Liquid GitHub Luxury frame on wider screens */}
      <div className="w-full max-w-xl mx-auto flex flex-col min-h-screen sm:min-h-0 sm:my-6 sm:rounded-[36px] sm:border sm:border-white/10 sm:shadow-2xl overflow-hidden transition-all relative">
        
        {/* Android Native Status Bar Aesthetic (on supported viewports) */}
        <div 
          className={`w-full px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-mono select-none ${
            isDark ? 'bg-[#121820]/90 text-neutral-400' : 'bg-neutral-100/90 text-neutral-600'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span>Rock OS</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              STABLE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">{metrics.level}%</span>
              <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Application Header */}
        <div className={isDark ? 'bg-[#121820]' : 'bg-neutral-50'}>
          <Header
            isDark={isDark}
            themeMode={preferences.theme}
            onThemeCycle={handleThemeCycle}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            isApiSupported={metrics.apiSupported}
            charging={metrics.charging}
          />
        </div>

        {/* Main Content Scrollable Area */}
        <main className={`flex-1 flex flex-col items-center justify-start pb-8 ${
          isDark ? 'bg-[#0e1319]' : 'bg-white'
        }`}>
          
          {/* If the battery API is supported, show the active Rock Flow display */}
          {metrics.apiSupported ? (
            <>
              {/* Battery Circular Progress with Rock Flow */}
              <BatteryRing
                level={metrics.level}
                charging={metrics.charging}
                status={metrics.status}
                tier={tier}
                chargingTime={metrics.chargingTime}
                dischargingTime={metrics.dischargingTime}
                effectiveReducedMotion={effectiveReducedMotion}
                chargingAnimationEnabled={preferences.chargingAnimation}
                isDark={isDark}
              />

              {/* Status Banner */}
              <StatusBanner 
                metrics={metrics} 
                isDark={isDark} 
                intelligentCharging={preferences.intelligentCharging}
                onTogglePreviewCritical={() => setPreviewCriticalMode(!previewCriticalMode)}
                isPreviewCritical={previewCriticalMode}
              />

              {/* Quick Glance Critical Battery Summary Card (below 20% or preview) */}
              <QuickGlanceCriticalCard
                metrics={metrics}
                isDark={isDark}
                onEnableDarkTheme={() => {
                  if (!isDark) handleThemeCycle();
                }}
                onOpenDetails={() => handleOpenModal('details', 'fluctuations')}
                effectiveReducedMotion={effectiveReducedMotion}
                hapticEnabled={preferences.hapticFeedback}
                forcePreview={previewCriticalMode}
                onDismissPreview={() => setPreviewCriticalMode(false)}
              />

              {/* Compact Quick Actions Bar */}
              <QuickActions
                onOpenModal={handleOpenModal}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                isDark={isDark}
              />

              {/* Metrics & Hardware Telemetry Grid */}
              <MetricsGrid
                metrics={metrics}
                isDark={isDark}
                onOpenDetails={(tab) => handleOpenModal('details', tab)}
                effectiveReducedMotion={effectiveReducedMotion}
              />
            </>
          ) : (
            /* Unavailable / Permission Restricted State */
            <div className="w-full">
              <UnavailableState
                errorMessage={metrics.errorMessage}
                isDark={isDark}
                onRetry={handleRefresh}
                isRefreshing={isRefreshing}
              />

              {/* Quick Glance Critical Battery Summary Card (below 20% or preview) */}
              <QuickGlanceCriticalCard
                metrics={metrics}
                isDark={isDark}
                onEnableDarkTheme={() => {
                  if (!isDark) handleThemeCycle();
                }}
                onOpenDetails={() => handleOpenModal('details', 'fluctuations')}
                effectiveReducedMotion={effectiveReducedMotion}
                hapticEnabled={preferences.hapticFeedback}
                forcePreview={previewCriticalMode}
                onDismissPreview={() => setPreviewCriticalMode(false)}
              />

              {/* Still provide Quick Actions to access settings and diagnostic info */}
              <QuickActions
                onOpenModal={handleOpenModal}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                isDark={isDark}
              />

              <MetricsGrid
                metrics={metrics}
                isDark={isDark}
                onOpenDetails={(tab) => handleOpenModal('details', tab)}
                effectiveReducedMotion={effectiveReducedMotion}
              />
            </div>
          )}

          {/* Footer note */}
          <footer className="w-full text-center px-4 pt-2 pb-4">
            <p className={`text-[11px] font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Sayanth Rock / GitHub Rock Design Language • Zero Telemetry
            </p>
          </footer>
        </main>
      </div>

      {/* Modals & Dialogs */}
      {activeModal === 'details' && (
        <BatteryDetailsModal
          metrics={metrics}
          isDark={isDark}
          effectiveReducedMotion={effectiveReducedMotion}
          hapticEnabled={preferences.hapticFeedback}
          initialTab={detailsInitialTab}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === 'usage' && (
        <BatteryUsageModal
          metrics={metrics}
          isDark={isDark}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === 'charging' && (
        <ChargingInfoModal
          metrics={metrics}
          isDark={isDark}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          preferences={preferences}
          onUpdatePreference={updatePreference}
          isDark={isDark}
          effectiveReducedMotion={effectiveReducedMotion}
          onClose={handleCloseModal}
          onTogglePreviewCritical={() => setPreviewCriticalMode(!previewCriticalMode)}
          isPreviewCritical={previewCriticalMode}
        />
      )}
    </div>
  );
}
