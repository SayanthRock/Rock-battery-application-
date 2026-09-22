# Rock Battery 🔋

A native-grade, private battery telemetry and health companion built with React, TypeScript, and Tailwind CSS. Designed around the Sayanth Rock design language, offering hardware-accurate real-time battery monitoring, continuous 24-hour activity tracking, and intelligent power conservation tips.

![Rock Battery Preview](https://raw.githubusercontent.com/sayanth/rock-battery/main/preview.png)

## ✨ Key Features

- **Dynamic Rock Flow Progress Ring**: Visualizes active energy flow with fluid multi-layer SVG gradients and charging currents.
- **Hardware Telemetry**:
  - Live Battery Level (%) & Charging State
  - Operating Voltage & Cell Potential Curves
  - Electrochemical Cell Temperature Tracking
  - Real-time Health State & Internal Resistance Modeling
- **Thermal & Voltage Fluctuation Log**: Secondary analytics tab with real-time delta logs, sparkline waveforms, and CSV/JSON export.
- **Quick Glance Critical Card**: Automatically triggers below 20% to surface actionable OS-specific power conservation tips (macOS, Windows, Linux, Android, iOS).
- **24-Hour Activity Waveform**: Responsive interactive D3 time-series chart showing 24-hour state of charge, charge cycles, and duration estimates.
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
git clone https://github.com/your-username/rock-battery.git
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
