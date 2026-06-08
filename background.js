/**
 * Tab Nap — auto-discard idle tabs (RAM saver).
 * Uses chrome.tabs.discard (native Chrome suspend).
 */

const DEFAULTS = {
  enabled: true,
  idleMinutes: 15,
  neverSuspendAudio: true,
  neverSuspendPinned: true,
  neverSuspendActive: true,
  whitelist: ["mail.google.com", "docs.google.com", "localhost"],
  stats: { suspended: 0, restored: 0 },
};

async function getSettings() {
  const r = await chrome.storage.local.get("tabnap");
  return { ...DEFAULTS, ...(r.tabnap || {}), stats: { ...DEFAULTS.stats, ...(r.tabnap?.stats || {}) } };
}

async function setSettings(partial) {
  const cur = await getSettings();
  const next = { ...cur, ...partial };
  if (partial.stats) next.stats = { ...cur.stats, ...partial.stats };
  if (partial.whitelist) next.whitelist = partial.whitelist;
  await chrome.storage.local.set({ tabnap: next });
  return next;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isWhitelisted(url, list) {
  const h = hostOf(url);
  if (!h) return true;
  return list.some((w) => {
    const n = w.replace(/^www\./, "").toLowerCase();
    return h === n || h.endsWith("." + n);
  });
}

async function maybeSuspend() {
  const s = await getSettings();
  if (!s.enabled) return;

  const idleMs = Math.max(1, s.idleMinutes) * 60 * 1000;
  const now = Date.now();
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (!tab.id || tab.discarded) continue;
    if (!tab.url || tab.url.startsWith("chrome") || tab.url.startsWith("chrome-extension") || tab.url.startsWith("about:")) continue;
    if (s.neverSuspendPinned && tab.pinned) continue;
    if (s.neverSuspendActive && tab.active) continue;
    if (s.neverSuspendAudio && tab.audible) continue;
    if (isWhitelisted(tab.url, s.whitelist || [])) continue;

    // lastAccessed is available on many Chrome versions
    const last = tab.lastAccessed || 0;
    if (last && now - last < idleMs) continue;
    // If lastAccessed missing, only suspend non-active after alarm cycles
    if (!last && tab.active) continue;

    try {
      await chrome.tabs.discard(tab.id);
      const stats = { ...(s.stats || {}), suspended: ((s.stats && s.stats.suspended) || 0) + 1 };
      await setSettings({ stats });
    } catch (_) {
      /* tab may be undiscardable */
    }
  }
  await updateBadge();
}

async function updateBadge() {
  const discarded = await chrome.tabs.query({ discarded: true });
  const n = discarded.length;
  await chrome.action.setBadgeText({ text: n ? String(n) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#0f766e" });
}

chrome.runtime.onInstalled.addListener(async () => {
  const r = await chrome.storage.local.get("tabnap");
  if (!r.tabnap) await chrome.storage.local.set({ tabnap: DEFAULTS });
  chrome.alarms.create("tabnap-tick", { periodInMinutes: 1 });
  await updateBadge();
});

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "tabnap-tick") maybeSuspend();
});

chrome.tabs.onActivated.addListener(async () => {
  await updateBadge();
});

chrome.tabs.onUpdated.addListener(async () => {
  await updateBadge();
});

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  if (msg?.type === "tabnap:get") {
    getSettings().then(async (settings) => {
      const discarded = await chrome.tabs.query({ discarded: true });
      const all = await chrome.tabs.query({});
      send({ settings, discarded: discarded.length, total: all.length });
    });
    return true;
  }
  if (msg?.type === "tabnap:set") {
    setSettings(msg.patch || {}).then((s) => send({ ok: true, settings: s }));
    return true;
  }
  if (msg?.type === "tabnap:suspend-now") {
    maybeSuspend().then(() => send({ ok: true }));
    return true;
  }
  if (msg?.type === "tabnap:wake-all") {
    chrome.tabs.query({ discarded: true }).then(async (tabs) => {
      for (const t of tabs) {
        if (t.id) {
          try {
            await chrome.tabs.reload(t.id);
            const s = await getSettings();
            await setSettings({
              stats: { ...s.stats, restored: (s.stats.restored || 0) + 1 },
            });
          } catch (_) {}
        }
      }
      await updateBadge();
      send({ ok: true });
    });
    return true;
  }
});
