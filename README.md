# Rock Battery 🔋

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Version: 1.4.0](https://img.shields.io/badge/Version-1.4.0-emerald.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](https://www.typescriptlang.org/)
[![Zero Telemetry Tracking](https://img.shields.io/badge/Privacy-100%25_Local-00e676.svg)](#privacy--device-access)

A native-grade, private battery telemetry and health companion built with React, TypeScript, and Tailwind CSS. Designed around the Sayanth Rock design language, offering hardware-accurate real-time battery monitoring, continuous 24-hour activity tracking, telemetry export (JSON/CSV), and intelligent power conservation tips.

## ✨ Key Features

- **Dynamic Rock Flow Progress Ring**: Visualizes active energy flow with fluid multi-layer SVG gradients and charging currents.
- **Intelligent Charging (80% Health Limit)**: Real-time and background monitor alerting when battery reaches 80% to protect lithium-ion cathode chemistry and increase pack lifespan up to 2.5× to 3×.
- **Hardware Telemetry & D3 Visualizations**:
  - Live Battery Level (%) & Charging State
  - Operating Voltage & Cell Potential Curves
  - Electrochemical Cell Temperature Tracking
  - D3 24-Hour Battery Capacity Trends and State of Charge Waveforms
- **Battery Health Estimation Engine (Current vs. Design Capacity)**:
  - Derives State of Health (SoH %) from historical Coulombic cycle accumulation and continuous telemetry.
  - Compares Full Charge Capacity (FCC in mAh & Wh) against OEM Factory Design Capacity.
  - Models Equivalent Series Resistance (ESR in mΩ) and thermal stress exposure factor.
  - Longevity projection estimating remaining useful cycles to the 80% capacity boundary.
  - Interactive hardware capacity presets (Phone, Flagship, Compact, Tablet, Laptop, and custom spec input).
- **Thermal & Voltage Fluctuation Log with Telemetry Exporter**:
  - Dual structured export to formatted JSON and delimited CSV for external analysis (Excel, Pandas, Jupyter).
  - Copy to clipboard and direct timestamped file downloads.
  - Instant Toast Notification alerting users when telemetry export downloads initiate, with countdown progress indicator.
- **Quick Glance Critical Card**: Automatically triggers below 20% to surface actionable OS-specific power conservation tips (macOS, Windows, Linux, Android, iOS).
- **Audio & Haptic Feedback**: Tactile Web Audio synthesis and vibration feedback tuned for low-latency tactile responses.
- **PWA & Offline Capable**: Works completely offline as a Progressive Web Application with install prompts for desktop and mobile.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sayanth/rock-battery.git
cd rock-battery

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🛠️ Build & Deploy

### Production Build
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 🔒 Privacy & Device Access
Rock Battery monitors battery statistics through the browser's standard W3C Battery Status API (`navigator.getBattery()`). All telemetry processing, activity logging, and fluctuation history are retained strictly within your local browser storage—no personal data is sent to external servers.

---

## 📄 License
Apache-2.0
