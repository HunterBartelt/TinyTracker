# 🍼 TinyTrack

**TinyTrack** is a high-performance, privacy-focused baby tracking application designed for exhausted parents. It features a "one-handed" UI/UX optimized for mobile use, ensuring you can log data while holding a baby.

Live at: [tinytrack.farmfresh.rocks](https://tinytrack.farmfresh.rocks)

## ✨ Features

- **📱 One-Handed Design**: Large touch targets and bottom-aligned navigation for effortless use.
- **🔐 Local-First & Private**: All baby data is stored directly on your device via `localStorage`. No cloud accounts, no tracking.
- **📶 PWA Ready**: Fully functional offline. Install it to your home screen for a native app experience.
- **🤖 AI PDF Import**: Migrating from another app? Export your data as a PDF and TinyTrack will use Gemini AI to parse and import the history automatically.
- **🤝 Zero-Cloud Sync**: Sync data with a partner using high-density QR codes—no servers or accounts required.
- **📊 Detailed Analytics**: Visualize milk intake, diaper trends, and growth curves with clean, interactive charts.

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Bundling**: esbuild via GitHub Actions
- **Charts**: Recharts
- **AI**: Google Gemini API (via `@google/genai`)
- **Scanning**: html5-qrcode

## 🚀 Deployment & API Setup

This repository is configured to deploy automatically to GitHub Pages using GitHub Actions.

### Setting up the Gemini API Key

To enable the PDF Import feature, you must provide a Gemini API Key:

1. Obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. In this GitHub Repository, go to **Settings** > **Secrets and variables** > **Actions**.
3. Create a **New repository secret** named `API_KEY`.
4. Paste your key and save.
5. The next time you push to `main`, the deployment workflow will inject this key into the production build.

## 📄 License

MIT License - feel free to use and adapt for your own family!
