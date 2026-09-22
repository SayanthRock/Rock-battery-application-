/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemPowerTip {
  id: string;
  title: string;
  description: string;
  category: 'os' | 'display' | 'hardware' | 'network' | 'browser';
  impact: 'High' | 'Medium' | 'Critical';
  osSpecific?: string;
  actionType?: 'toggle-dark' | 'copy-shortcut' | 'manual';
  actionLabel?: string;
  shortcut?: string;
}

export interface SystemEnvironmentProfile {
  platform: 'macOS' | 'Windows' | 'Linux' | 'Android' | 'iOS' | 'ChromeOS' | 'Unknown';
  isDarkModePreferred: boolean;
  isReducedMotionPreferred: boolean;
  saveDataEnabled: boolean;
  hardwareConcurrency?: number;
  deviceMemoryGb?: number;
}

/**
 * Detects the host platform and system environment
 */
export function detectSystemEnvironment(): SystemEnvironmentProfile {
  if (typeof window === 'undefined') {
    return {
      platform: 'Unknown',
      isDarkModePreferred: false,
      isReducedMotionPreferred: false,
      saveDataEnabled: false,
    };
  }

  const ua = navigator.userAgent || '';
  const platformStr = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || '';

  let platform: SystemEnvironmentProfile['platform'] = 'Unknown';
  if (/Mac|iPhone|iPad|iPod/i.test(platformStr) || /Macintosh|Mac OS X/i.test(ua)) {
    if (/iPhone|iPad|iPod/i.test(ua)) {
      platform = 'iOS';
    } else {
      platform = 'macOS';
    }
  } else if (/Win/i.test(platformStr) || /Windows/i.test(ua)) {
    platform = 'Windows';
  } else if (/Android/i.test(ua)) {
    platform = 'Android';
  } else if (/CrOS/i.test(ua)) {
    platform = 'ChromeOS';
  } else if (/Linux/i.test(platformStr) || /Linux/i.test(ua)) {
    platform = 'Linux';
  }

  const isDarkModePreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isReducedMotionPreferred = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const nav = navigator as unknown as {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };

  const saveDataEnabled = !!nav.connection?.saveData;
  const hardwareConcurrency = nav.hardwareConcurrency;
  const deviceMemoryGb = nav.deviceMemory;

  return {
    platform,
    isDarkModePreferred,
    isReducedMotionPreferred,
    saveDataEnabled,
    hardwareConcurrency,
    deviceMemoryGb,
  };
}

/**
 * Fetches tailored actionable power-saving tips based on real system parameters
 */
export function getSystemPowerSavingTips(
  batteryLevel: number,
  isCurrentlyDarkTheme: boolean
): { profile: SystemEnvironmentProfile; tips: SystemPowerTip[] } {
  const profile = detectSystemEnvironment();
  const tips: SystemPowerTip[] = [];

  // 1. Platform / OS Native Battery Saver Shortcut
  switch (profile.platform) {
    case 'macOS':
      tips.push({
        id: 'os-low-power',
        title: 'Activate macOS Low Power Mode',
        description: 'Apple Silicon / Intel Low Power Mode caps CPU clock frequencies and dims internal Liquid Retina panels.',
        category: 'os',
        impact: 'Critical',
        osSpecific: 'macOS',
        actionType: 'copy-shortcut',
        actionLabel: 'Copy Terminal Command',
        shortcut: 'sudo pmset -a lowpowermode 1',
      });
      break;

    case 'Windows':
      tips.push({
        id: 'os-low-power',
        title: 'Engage Windows Battery Saver (Win + A)',
        description: 'Throttles telemetry background services, limits push notifications, and caps display refresh rate to 60Hz.',
        category: 'os',
        impact: 'Critical',
        osSpecific: 'Windows',
        actionType: 'copy-shortcut',
        actionLabel: 'Copy Shortcut (Win+A)',
        shortcut: 'Win + A',
      });
      break;

    case 'Linux':
      tips.push({
        id: 'os-low-power',
        title: 'Switch to power-saver governor',
        description: 'Reduces CPU governor energy performance preference (EPP) to maximum power-save.',
        category: 'os',
        impact: 'Critical',
        osSpecific: 'Linux',
        actionType: 'copy-shortcut',
        actionLabel: 'Copy powerprofilesctl',
        shortcut: 'powerprofilesctl set power-saver',
      });
      break;

    case 'Android':
      tips.push({
        id: 'os-low-power',
        title: 'Enable Android Extreme Battery Saver',
        description: 'Pauses background sync, halts non-essential apps, and enables dark theme system-wide.',
        category: 'os',
        impact: 'Critical',
        osSpecific: 'Android',
        actionType: 'manual',
        actionLabel: 'Swipe down to Quick Settings',
      });
      break;

    case 'iOS':
      tips.push({
        id: 'os-low-power',
        title: 'Turn on iOS Low Power Mode',
        description: 'Reduces display brightness, minimizes system animations, and disables iCloud automatic sync.',
        category: 'os',
        impact: 'Critical',
        osSpecific: 'iOS',
        actionType: 'manual',
        actionLabel: 'Control Center → Battery icon',
      });
      break;

    default:
      tips.push({
        id: 'os-low-power',
        title: 'Enable System Energy Saver',
        description: 'Trigger your operating system energy-saver profile to throttle non-essential processes.',
        category: 'os',
        impact: 'Critical',
        actionType: 'manual',
      });
  }

  // 2. Display & OLED Dark Theme Check
  if (!isCurrentlyDarkTheme) {
    tips.push({
      id: 'display-dark-mode',
      title: 'Switch Display to Dark Theme',
      description: 'On OLED/Mini-LED screens, black pixels switch off entirely, reducing display power by up to 40%.',
      category: 'display',
      impact: 'High',
      actionType: 'toggle-dark',
      actionLabel: 'Enable Dark Theme',
    });
  } else {
    tips.push({
      id: 'display-brightness',
      title: 'Reduce Display Luminance to 35%',
      description: 'Backlight LEDs account for up to 60% of total active power dissipation during battery use.',
      category: 'display',
      impact: 'High',
      actionType: 'manual',
      actionLabel: 'Dim screen brightness',
    });
  }

  // 3. Hardware Peripherals & Bus Power
  tips.push({
    id: 'hardware-peripherals',
    title: 'Unplug USB-C Bus-Powered Accessories',
    description: 'External drives, secondary dongles, and connected phones siphon high milliamps from the host bus.',
    category: 'hardware',
    impact: 'High',
    actionType: 'manual',
    actionLabel: 'Disconnect unneeded cables',
  });

  // 4. Background Tab Throttling & Browser
  tips.push({
    id: 'browser-tab-throttling',
    title: 'Hibernate Inactive Browser Tabs',
    description: 'Chrome & Edge "Memory / Energy Saver" limits frame rates for background tabs and releases GPU memory.',
    category: 'browser',
    impact: 'Medium',
    actionType: 'copy-shortcut',
    actionLabel: 'Copy chrome://settings/performance',
    shortcut: 'chrome://settings/performance',
  });

  return { profile, tips };
}
