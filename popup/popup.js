const $ = (id) => document.getElementById(id);

function refresh(data) {
  const s = data.settings;
  $("enabled").checked = !!s.enabled;
  $("idle").value = s.idleMinutes ?? 15;
  $("pinned").checked = !!s.neverSuspendPinned;
  $("audio").checked = !!s.neverSuspendAudio;
  $("active").checked = !!s.neverSuspendActive;
  $("whitelist").value = (s.whitelist || []).join("\n");
  $("napping").textContent = String(data.discarded ?? 0);
  $("open").textContent = String(data.total ?? 0);
  $("lifetime").textContent = String(s.stats?.suspended ?? 0);
}

function load() {
  chrome.runtime.sendMessage({ type: "tabnap:get" }, (r) => {
    if (r) refresh(r);
  });
}

function save(patch) {
  chrome.runtime.sendMessage({ type: "tabnap:set", patch }, () => load());
}

$("enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));
$("idle").addEventListener("change", (e) =>
  save({ idleMinutes: Math.max(1, Number(e.target.value) || 15) })
);
$("pinned").addEventListener("change", (e) => save({ neverSuspendPinned: e.target.checked }));
$("audio").addEventListener("change", (e) => save({ neverSuspendAudio: e.target.checked }));
$("active").addEventListener("change", (e) => save({ neverSuspendActive: e.target.checked }));
$("whitelist").addEventListener("change", (e) => {
  const list = e.target.value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  save({ whitelist: list });
});

$("suspend-now").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "tabnap:suspend-now" }, () => load());
});
$("wake-all").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "tabnap:wake-all" }, () => load());
});

load();
setInterval(load, 2000);
