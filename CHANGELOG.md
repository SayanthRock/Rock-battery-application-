# Changelog

All notable changes to **Rock Battery** are documented in this file.

## [v1.4.0] - 2026-09-26

### 🚀 GitHub & System Upgrades
- **Complete GitHub Repository Alignment**: Cleaned build artifacts, resolved deprecation warnings across toolchains, and ensured git remote configuration (`https://github.com/sayanth/rock-battery.git`) is fully synchronized on the `main` branch.
- **Enhanced GitHub Hub (`GitHubModal`)**:
  - Direct repository status query with real-time feedback.
  - Universal PAT push command supporting initial `origin` setup, remote re-targeting, and clean main branch push.
  - One-click copy for local clone and push commands with tactile haptic feedback.
- **Vite Configuration Streamlining**: Upgraded path resolution in `vite.config.ts` to `import.meta.dirname` to eliminate upstream Vite deprecation notices.
- **Production Verification**: Zero TypeScript errors (`tsc --noEmit`), passing build bundle (`vite build`), and clean git tree.

## [v1.3.0] - 2026-09-22

### ⚡ Added
- **Telemetry Export Engine (JSON & CSV)**: Implemented full historical battery telemetry log export in `BatteryDetailsModal`. Allows users to export multi-point thermal, circuit voltage, delta fluctuation, and charge-cycle data into clean comma-delimited CSV spreadsheets or formatted JSON structures for external analytics and battery diagnostics.
- **Export Toolbar in BatteryDetailsModal**: Dual access points in modal footer and header toolbar with tactile feedback, download feedback badges, and automated ISO timestamp filenames.
- **24-Hour Battery Capacity Trends (D3 Visualizer)**: New specialized D3 visualization component rendering continuous 24-hour battery capacity trajectories with dual viewing modes (`%` capacity and estimated `mAh` energy), rolling 3-point moving average trendlines, optimal health preservation bands (20%–80%), and touch/pointer scrubbing crosshair with rate-of-change telemetry.
- **MetricsGrid Telemetry Integration**: Integrated a visual tab selector in `MetricsGrid` switching between 24-Hour Capacity Trends and 24-Hour Activity Drain, with direct interactive navigation from the Design Capacity card.
- **Intelligent Charging (80% Health Limit)**: Real-time and background monitor alerting when battery reaches 80% state of charge to mitigate electrochemical degradation on lithium-ion cathode cells and preserve long-term battery lifespan.
- **Toggleable Settings Option**: Dedicated configuration card in Settings with health telemetry rationale, instant test dispatch, and cross-tab DataStore synchronization.
- **Acoustic Health Preservation Chime**: Custom Web Audio synthesized tri-tone chord (E5 → G#5 → B5) for the 80% Intelligent Charging notification.
- **Smart Status Banner Indicator**: Live "80% Preserved" status badge and charging guidance when connected to power.

---

## [v1.2.0] - 2026-09-22

### ⚡ Added
- **Quick Glance Critical Battery Card**: Automatically triggers below 20% battery state to surface platform-specific power-saving commands (macOS `sudo pmset`, Windows `Win+A`, Linux `powerprofilesctl`) and display luminance guidelines.
- **Critical Mode Simulator**: Interactive testing button in the status banner and Settings modal to preview critical-state recommendations on demand.
- **Dynamic System Environment Detection**: Automated host OS profiling, display dark mode check, and reduced motion accessibility compliance.

### 🐛 Fixed
- **SVGPoint Coordinate Crash**: Resolved `Uncaught TypeError: Failed to set the 'x' property on 'SVGPoint'` during touch interactions on the 24-hour activity chart by adding safe touch event normalization and client rect boundaries.
- **Sparkline Waveform Boundary Checks**: Guarded against non-finite values and single-point logs in telemetry sparkline polylines.

### 🎨 Improved
- **Visual Polish**: Fluid multi-layer gradients on the Rock Flow ring, responsive pill controls, and tactile Web Audio haptic feedback.
- **PWA & Offline Reliability**: Standalone manifest configuration and desktop/mobile installation experience.

---

## [v1.1.0] - Earlier Release
- Interactive D3 24-hour activity time-series chart.
- Electrochemical cell voltage and temperature telemetry logs.
- Notification triggers for full charge target and critical thresholds.

---

## [v1.0.0] - Initial Release
- Core Rock Flow circular battery progress indicator.
- Real-time battery status monitoring via W3C Battery Status API.
- Sayanth Rock theme engine with Dark, Light, and System modes.
