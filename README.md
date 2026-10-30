# 🎯 Focus Mode

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Chrome extension (**Manifest V3**) that blocks distracting sites during study or
work sessions. Start a timer and any site on your blocklist shows a full-screen
reminder to get back to work — with a motivational quote and the remaining time.

> 📸 *Add a screenshot of the popup and the block screen here.*

## ✨ Features

- **Focus timer** from 1 to 600 minutes, with a live countdown in the popup.
- **Full-screen block page** with a random motivational quote and the remaining
  time.
- **Two blocking modes** (see below).
- **Subdomain matching** — `youtube.com` also blocks `m.youtube.com` and
  `www.youtube.com`.
- Settings persist across sessions via `chrome.storage.local`.
- Session auto-expires when the timer runs out.

## 🔧 Install (unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the extension folder (`chrome-focus-mode`).
5. The extension appears in the list — pin its icon to the toolbar.

## ▶ Usage

- Click the Focus Mode icon.
- Enter a number of minutes (1–600) and click **Start focus**.
- While the timer is active, distracting sites show a red "Get back to work!"
  screen.
- **Stop** ends the session early.

## 🚦 Blocking modes

- **Block everything** — blocks all sites except the ones in your allowlist. Great
  for a full digital detox.
- **List only** — blocks only the listed sites and their subdomains. Great for
  removing specific distracting services.

The site list is edited in the popup (one per line, or comma-separated). Domains are
entered without a protocol, e.g. `youtube.com`.

Blocking kicks in as early as possible (`document_start`), so the "Get back to
work!" screen appears before the distracting page renders. Pages without a
hostname (`file://`, `about:blank`) are not blocked.

## 🏗 Project structure

```
chrome-focus-mode/
├── manifest.json          # extension configuration
├── popup.html / popup.js  # timer UI and site-list settings
├── content.js / style.css # page blocking
├── icons/                 # extension icons (16 / 48 / 128)
└── scripts/gen-icons.js   # icon generator
```

## 🛠 Development

Regenerate the icons with:

```bash
node scripts/gen-icons.js icons
```

## 📜 License

MIT — see [LICENSE](LICENSE).
