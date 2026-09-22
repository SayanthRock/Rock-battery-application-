# Changelog

All notable changes to **Rock Battery** are documented in this file.

## [v1.3.0] - 2026-09-22

### ⚡ Added
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
