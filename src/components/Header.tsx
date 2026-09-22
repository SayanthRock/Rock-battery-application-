/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Moon, Sun, Monitor, ShieldCheck, BatteryCharging, Github } from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  isDark: boolean;
  themeMode: ThemeMode;
  onThemeCycle: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isApiSupported: boolean;
  charging: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  themeMode,
  onThemeCycle,
  onRefresh,
  isRefreshing,
  isApiSupported,
  charging,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full flex items-center justify-between py-3 px-2 sm:px-4">
      {/* Brand & Engine status */}
      <div className="flex items-center gap-2.5">
        <div 
          className={`w-9 h-9 rounded-[14px] flex items-center justify-center transition-all ${
            isDark 
              ? 'bg-[#161b22] border border-[#30363d]/80 text-emerald-400 shadow-[0_0_15px_rgba(46,160,67,0.15)]' 
              : 'bg-white border border-neutral-200 text-emerald-600 shadow-sm'
          }`}
        >
          <BatteryCharging className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
              Rock Battery
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              v1.3.0
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              isApiSupported ? (charging ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500') : 'bg-amber-400'
            }`} />
            <span className="font-mono text-[10px] tracking-wide">
              {isApiSupported ? (charging ? 'POWER CONNECTED' : 'BATTERY ACTIVE') : 'LIMITED API'}
            </span>
          </div>
        </div>
      </div>

      {/* Clock and quick controls */}
      <div className="flex items-center gap-2">
        <div 
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-[12px] font-mono text-xs ${
            isDark ? 'bg-[#161b22]/80 border border-[#30363d]/60 text-neutral-300' : 'bg-neutral-100 border border-neutral-200 text-neutral-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{time || '--:--'}</span>
        </div>

        {/* GitHub repository link */}
        <a
          id="header-github-link"
          href="https://github.com/sayanth/rock-battery"
          target="_blank"
          rel="noopener noreferrer"
          title="View on GitHub (Sayanth Rock Battery)"
          aria-label="View on GitHub repository"
          className={`w-9 h-9 rounded-[14px] flex items-center justify-center transition-all active:scale-95 ${
            isDark 
              ? 'bg-[#161b22] hover:bg-[#21262d] border border-[#30363d]/80 text-neutral-300 hover:text-emerald-400' 
              : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-emerald-600 shadow-sm'
          }`}
        >
          <Github className="w-4 h-4" />
        </a>

        {/* Theme quick toggle */}
        <button
          id="theme-quick-toggle"
          onClick={onThemeCycle}
          title={`Theme: ${themeMode}`}
          aria-label={`Current theme: ${themeMode}. Click to switch theme.`}
          className={`w-9 h-9 rounded-[14px] flex items-center justify-center transition-all active:scale-95 ${
            isDark 
              ? 'bg-[#161b22] hover:bg-[#21262d] border border-[#30363d]/80 text-neutral-300 hover:text-white' 
              : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-950 shadow-sm'
          }`}
        >
          {themeMode === 'system' ? (
            <Monitor className="w-4 h-4" />
          ) : themeMode === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        {/* Refresh action */}
        <button
          id="battery-refresh-action"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Battery State"
          aria-label="Refresh battery information"
          className={`w-9 h-9 rounded-[14px] flex items-center justify-center transition-all active:scale-95 ${
            isDark 
              ? 'bg-[#161b22] hover:bg-[#21262d] border border-[#30363d]/80 text-neutral-300 hover:text-white' 
              : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-950 shadow-sm'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
