# Tab Nap — Chrome Web Store listing

## Single purpose
Automatically suspend idle browser tabs using Chrome’s native tab discard API to reduce memory use, with user controls for whitelist and wake.

## Short description
Auto-suspend idle tabs to free RAM using Chrome’s native discard. Whitelist sites, protect pinned/audio, wake all in one click.

## Detailed description

Tab Nap puts idle tabs to sleep so Chrome uses less memory.

**How it works**
• Uses Chrome’s official `tabs.discard` API (safe, supported — not a freeze hack)
• You set idle minutes (default 15)
• Tabs past that idle time may be suspended
• Click a sleeping tab anytime to restore it

**Stay in control**
• Whitelist hosts that should never nap (e.g. mail)
• Never suspends the active tab
• Protects pinned and audible tabs
• One-click “wake all”
• Badge shows how many tabs are napping

**Privacy**
• No account
• No Tab Nap servers
• Settings stored in chrome.storage.local only
• Policy: https://ayaanrustagi.github.io/tab-nap/privacy.html

Inspired by the spirit of The Great Suspender, rebuilt for modern Manifest V3 Chrome. Not affiliated with the original Great Suspender project.

## Category
Productivity

## Permission justifications

| Permission | Why |
|------------|-----|
| **tabs** | Read tab idle/last-access signals, discard idle tabs, reload/wake tabs, update badge count. |
| **storage** | Save idle minutes, whitelist, and counters. |
| **alarms** | Periodically check for idle tabs. |

No host_permissions. No scripting of page content. No network calls by the extension.

## Privacy policy URL
https://ayaanrustagi.github.io/tab-nap/privacy.html

## Homepage
https://ayaanrustagi.github.io/tab-nap/
