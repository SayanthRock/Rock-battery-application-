/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileText, 
  BarChart3, 
  Zap, 
  RotateCw, 
  Settings 
} from 'lucide-react';
import { ActiveModal } from '../types';

interface QuickActionsProps {
  onOpenModal: (modal: ActiveModal) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isDark: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenModal,
  onRefresh,
  isRefreshing,
  isDark,
}) => {
  const actions = [
    {
      id: 'quick-action-details',
      label: 'Details',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => onOpenModal('details'),
      badge: 'Specs',
    },
    {
      id: 'quick-action-usage',
      label: 'Usage',
      icon: <BarChart3 className="w-4 h-4" />,
      onClick: () => onOpenModal('usage'),
      badge: 'Stats',
    },
    {
      id: 'quick-action-charging',
      label: 'Charging',
      icon: <Zap className="w-4 h-4" />,
      onClick: () => onOpenModal('charging'),
      badge: 'Power',
    },
    {
      id: 'quick-action-refresh',
      label: 'Refresh',
      icon: <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />,
      onClick: onRefresh,
      badge: 'Sync',
    },
    {
      id: 'quick-action-settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => onOpenModal('settings'),
      badge: 'Config',
    },
  ];

  return (
    <div className="w-full px-4 mb-6">
      <div 
        id="rock-quick-actions-bar"
        className={`w-full rounded-[24px] p-2 flex items-center justify-around gap-1.5 transition-colors ${
          isDark
            ? 'bg-[#161b22]/80 backdrop-blur-md border border-[#30363d]/70'
            : 'bg-white/85 backdrop-blur-md border border-neutral-200/90 shadow-sm'
        }`}
      >
        {actions.map((act) => (
          <button
            key={act.id}
            id={act.id}
            onClick={act.onClick}
            title={act.label}
            aria-label={act.label}
            className={`flex-1 py-2.5 px-1.5 rounded-[18px] flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-95 ${
              isDark
                ? 'hover:bg-[#21262d] text-neutral-300 hover:text-white'
                : 'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950'
            }`}
          >
            <div 
              className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-colors ${
                isDark ? 'bg-[#21262d]/80 text-emerald-400' : 'bg-neutral-100 text-emerald-600'
              }`}
            >
              {act.icon}
            </div>
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              {act.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
