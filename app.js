/* WHY — personal discipline & motivation app
   All data stays on this device (localStorage). */

// ---------- data layer ----------

const STORE_KEY = "whyapp_v1";

const defaultData = () => ({
  whys: [],          // {id, text, cat, createdAt}
  urges: [],         // {id, ts, trigger, outcome: 'resisted'|'gavein'}
  checkins: {},      // 'YYYY-MM-DD' -> true|false
  settings: { name: "", reminders: ["08:00", "21:00"] },
  lastFired: {}      // 'HH:MM' -> 'YYYY-MM-DD'
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultData();
    return Object.assign(defaultData(), JSON.parse(raw));
  } catch {
    return defaultData();
  }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  idbSet("reminders", {
    times: data.settings.reminders,
    lastFired: data.lastFired,
    whys: data.whys.map((w) => w.text)
  });
}

// Tiny IndexedDB mirror so the service worker can read reminder times
// (service workers can't access localStorage).
function idbSet(key, val) {
  const req = indexedDB.open("whyapp-db", 1);
  req.onupgradeneeded = () => req.result.createObjectStore("kv");
  req.onsuccess = () => {
    const db = req.result;
    db.transaction("kv", "readwrite").objectStore("kv").put(val, key);
    db.close();
  };
}

// ---------- helpers ----------

const $ = (id) => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), 2400);
}

function pickMotivation() {
  // mix: user's own whys weighted over built-in quotes
  const useOwn = data.whys.length > 0 && (Math.random() < 0.6 || QUOTES.length === 0);
  if (useOwn) {
    const w = data.whys[Math.floor(Math.random() * data.whys.length)];
    return { text: w.text, source: w.cat ? `your why — ${w.cat}` : "your own words" };
  }
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  return { text: q.t, source: q.s };
}

// ---------- view switching ----------

const views = ["home", "whys", "progress", "settings"];

function showView(name) {
  views.forEach((v) => ($("view-" + v).hidden = v !== name));
  document.querySelectorAll(".tab[data-view]").forEach((t) =>
    t.classList.toggle("active", t.dataset.view === name)
  );
  if (name === "home") renderHome();
  if (name === "whys") renderWhys();
  if (name === "progress") renderProgress();
  if (name === "settings") renderSettings();
}

document.querySelectorAll(".tab[data-view]").forEach((t) =>
  t.addEventListener("click", () => showView(t.dataset.view))
);

// ---------- home ----------

function currentStreak() {
  let streak = 0;
  const d = new Date();
  // today counts if answered yes; if unanswered, streak continues from yesterday
  if (data.checkins[dateKey(d)] === undefined) d.setDate(d.getDate() - 1);
  while (data.checkins[dateKey(d)] === true) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function bestStreak() {
  const days = Object.keys(data.checkins).filter((k) => data.checkins[k] === true).sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    const cur = new Date(k + "T12:00:00");
    run = prev !== null && cur - prev === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

function renderHome() {
  const name = data.settings.name.trim();
  const h = new Date().getHours();
  const part = h < 6 ? "It's late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  $("greeting").textContent = name ? `${part}, ${name}.` : `${part}.`;
  $("today-date").textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long"
  });

  $("streak-num").textContent = currentStreak();

  rotateWhyCard();

  const answered = data.checkins[dateKey()];
  $("checkin-card").hidden = answered !== undefined;
  $("checkin-done").hidden = answered === undefined;
  if (answered !== undefined) {
    $("checkin-done-text").textContent = answered
      ? "Checked in: disciplined today. 🔥 Keep the chain going."
      : "Logged. Tomorrow is a fresh start — one bad day doesn't erase your progress.";
  }
}

function rotateWhyCard() {
  const m = pickMotivation();
  $("why-card-text").textContent = m.text;
  $("why-card-source").textContent = "— " + m.source;
}

$("btn-next-why").addEventListener("click", rotateWhyCard);

$("btn-checkin-yes").addEventListener("click", () => {
  data.checkins[dateKey()] = true;
  save();
  renderHome();
  toast("Streak +1 🔥");
});
$("btn-checkin-no").addEventListener("click", () => {
  data.checkins[dateKey()] = false;
  save();
  renderHome();
});
$("btn-checkin-undo").addEventListener("click", () => {
  delete data.checkins[dateKey()];
  save();
  renderHome();
});

// ---------- whys ----------

let editingWhyId = null;
let selectedCat = null;

function renderWhys() {
  const list = $("whys-list");
  list.innerHTML = "";
  $("whys-empty").hidden = data.whys.length > 0;
  for (const w of data.whys) {
    const btn = document.createElement("button");
    btn.className = "why-item";
    if (w.cat) {
      const cat = document.createElement("span");
      cat.className = "why-item-cat";
      cat.textContent = w.cat;
      btn.appendChild(cat);
    }
    const p = document.createElement("div");
    p.textContent = w.text;
    btn.appendChild(p);
    btn.addEventListener("click", () => openWhyModal(w.id));
    list.appendChild(btn);
  }
}

function openWhyModal(id = null) {
  editingWhyId = id;
  const w = id ? data.whys.find((x) => x.id === id) : null;
  $("why-modal-title").textContent = w ? "Edit why" : "New why";
  $("input-why-text").value = w ? w.text : "";
  selectedCat = w ? w.cat : null;
  document.querySelectorAll("#why-category-chips .chip").forEach((c) =>
    c.classList.toggle("selected", c.dataset.cat === selectedCat)
  );
  $("btn-why-delete").hidden = !w;
  $("why-modal").hidden = false;
  $("input-why-text").focus();
}

document.querySelectorAll("#why-category-chips .chip").forEach((c) =>
  c.addEventListener("click", () => {
    selectedCat = selectedCat === c.dataset.cat ? null : c.dataset.cat;
    document.querySelectorAll("#why-category-chips .chip").forEach((x) =>
      x.classList.toggle("selected", x.dataset.cat === selectedCat)
    );
  })
);

$("btn-add-why").addEventListener("click", () => openWhyModal());
$("btn-why-cancel").addEventListener("click", () => ($("why-modal").hidden = true));
$("why-modal").addEventListener("click", (e) => {
  if (e.target === $("why-modal")) $("why-modal").hidden = true;
});

$("btn-why-save").addEventListener("click", () => {
  const text = $("input-why-text").value.trim();
  if (!text) { toast("Write something first"); return; }
  if (editingWhyId) {
    const w = data.whys.find((x) => x.id === editingWhyId);
    w.text = text;
    w.cat = selectedCat;
  } else {
    data.whys.unshift({ id: uid(), text, cat: selectedCat, createdAt: Date.now() });
  }
  save();
  $("why-modal").hidden = true;
  renderWhys();
  toast("Saved ❤️");
});

$("btn-why-delete").addEventListener("click", () => {
  data.whys = data.whys.filter((x) => x.id !== editingWhyId);
  save();
  $("why-modal").hidden = true;
  renderWhys();
});

// ---------- SOS flow ----------

let sosWhys = [];
let sosIndex = 0;
let breatheInterval = null;
let breatheLabelTimeout = null;
let sosTrigger = null;

$("btn-sos").addEventListener("click", openSos);

function openSos() {
  // gather up to 3 things to show: own whys first, quotes as filler
  const own = [...data.whys].sort(() => Math.random() - 0.5).slice(0, 3)
    .map((w) => w.text);
  const filler = [...QUOTES].sort(() => Math.random() - 0.5)
    .slice(0, 3 - own.length).map((q) => q.t);
  sosWhys = own.concat(filler);
  sosIndex = 0;
  sosTrigger = null;

  showSosStep("whys");
  renderSosWhy();
  $("sos-overlay").hidden = false;
}

function showSosStep(step) {
  ["whys", "breathe", "log", "done"].forEach(
    (s) => ($("sos-step-" + s).hidden = s !== step)
  );
  if (step === "breathe") startBreathing();
  else stopBreathing();
}

function renderSosWhy() {
  $("sos-why-text").textContent = sosWhys[sosIndex];
  const dots = $("sos-dots");
  dots.innerHTML = "";
  sosWhys.forEach((_, i) => {
    const d = document.createElement("span");
    if (i <= sosIndex) d.classList.add("on");
    dots.appendChild(d);
  });
  $("btn-sos-next-why").textContent =
    sosIndex < sosWhys.length - 1 ? "Next" : "OK. Now breathe";
}

$("btn-sos-next-why").addEventListener("click", () => {
  if (sosIndex < sosWhys.length - 1) {
    sosIndex++;
    renderSosWhy();
  } else {
    showSosStep("breathe");
  }
});

function startBreathing() {
  let remaining = 60;
  $("breathe-timer").textContent = remaining;
  // restart the CSS animation from zero so labels stay in sync
  const circle = $("breathe-circle");
  circle.style.animation = "none";
  void circle.offsetWidth;
  circle.style.animation = "";

  const labels = [
    { text: "Breathe in…", at: 0 },
    { text: "Hold…", at: 3600 },
    { text: "Breathe out…", at: 4400 }
  ];
  function cycleLabels() {
    labels.forEach((l) => {
      const t = setTimeout(() => ($("breathe-label").textContent = l.text), l.at);
      breatheLabelTimeouts.push(t);
    });
    breatheLabelTimeout = setTimeout(cycleLabels, 8000);
  }
  window.breatheLabelTimeouts = [];
  cycleLabels();

  breatheInterval = setInterval(() => {
    remaining--;
    $("breathe-timer").textContent = remaining;
    if (remaining <= 0) {
      stopBreathing();
      showSosStep("log");
    }
  }, 1000);
}

function stopBreathing() {
  clearInterval(breatheInterval);
  clearTimeout(breatheLabelTimeout);
  (window.breatheLabelTimeouts || []).forEach(clearTimeout);
}

$("btn-skip-breathe").addEventListener("click", () => showSosStep("log"));

document.querySelectorAll("#trigger-chips .chip").forEach((c) =>
  c.addEventListener("click", () => {
    sosTrigger = c.dataset.trigger;
    document.querySelectorAll("#trigger-chips .chip").forEach((x) =>
      x.classList.toggle("selected", x === c)
    );
    $("input-trigger-custom").hidden = sosTrigger !== "Other";
    if (sosTrigger === "Other") $("input-trigger-custom").focus();
  })
);

function logUrge(outcome) {
  let trigger = sosTrigger || "Unspecified";
  if (trigger === "Other") {
    trigger = $("input-trigger-custom").value.trim() || "Other";
  }
  data.urges.unshift({ id: uid(), ts: Date.now(), trigger, outcome });
  save();

  $("sos-done-emoji").textContent = outcome === "resisted" ? "💪" : "🌱";
  $("sos-done-text").textContent =
    outcome === "resisted"
      ? "That's a win. That's literally what discipline is — this exact moment, and you just did it."
      : "You logged it instead of hiding it. That's how patterns break. Next wave, you'll be readier.";
  showSosStep("done");
}

$("btn-urge-resisted").addEventListener("click", () => logUrge("resisted"));
$("btn-urge-gavein").addEventListener("click", () => logUrge("gavein"));

function closeSos() {
  stopBreathing();
  $("sos-overlay").hidden = true;
  $("input-trigger-custom").value = "";
  $("input-trigger-custom").hidden = true;
  document.querySelectorAll("#trigger-chips .chip").forEach((x) => x.classList.remove("selected"));
  showView("home");
}
$("btn-sos-close").addEventListener("click", closeSos);
$("btn-sos-finish").addEventListener("click", closeSos);

// ---------- progress ----------

let heatmapMonth = new Date(); // any date within the shown month

function renderProgress() {
  $("stat-streak").textContent = currentStreak();
  $("stat-best").textContent = bestStreak();

  const total = data.urges.length;
  const resisted = data.urges.filter((u) => u.outcome === "resisted").length;
  $("stat-resisted").textContent = total ? `${resisted}/${total}` : "–";

  const counts = {};
  data.urges.forEach((u) => (counts[u.trigger] = (counts[u.trigger] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  $("stat-trigger").textContent = top ? top[0] : "–";
  $("stat-trigger").style.fontSize = top && top[0].length > 8 ? "1rem" : "";

  renderHeatmap();
  renderUrgeLog();
}

function renderHeatmap() {
  const y = heatmapMonth.getFullYear();
  const m = heatmapMonth.getMonth();
  $("heatmap-title").textContent = heatmapMonth.toLocaleDateString("en-GB", {
    month: "long", year: "numeric"
  });

  const hm = $("heatmap");
  hm.innerHTML = "";
  ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "hm-dow";
    el.textContent = d;
    hm.appendChild(el);
  });

  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first offset
  for (let i = 0; i < lead; i++) {
    const el = document.createElement("div");
    el.className = "hm-cell hm-empty";
    hm.appendChild(el);
  }

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayK = dateKey();
  for (let d = 1; d <= daysInMonth; d++) {
    const k = dateKey(new Date(y, m, d));
    const v = data.checkins[k];
    const el = document.createElement("div");
    el.className = "hm-cell";
    if (v === true) { el.classList.add("hm-good"); el.textContent = "✓"; el.title = `${k}: disciplined`; }
    else if (v === false) { el.classList.add("hm-bad"); el.textContent = "×"; el.title = `${k}: slipped`; }
    else { el.textContent = d; el.title = `${k}: no entry`; }
    if (k === todayK) el.classList.add("hm-today");
    hm.appendChild(el);
  }
}

$("btn-month-prev").addEventListener("click", () => {
  heatmapMonth = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() - 1, 1);
  renderHeatmap();
});
$("btn-month-next").addEventListener("click", () => {
  heatmapMonth = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 1);
  renderHeatmap();
});

function renderUrgeLog() {
  const log = $("urge-log");
  log.innerHTML = "";
  if (data.urges.length === 0) {
    log.innerHTML = '<p class="hint">No urges logged yet. The SOS button logs them.</p>';
    return;
  }
  for (const u of data.urges.slice(0, 10)) {
    const row = document.createElement("div");
    row.className = "urge-row";
    const left = document.createElement("div");
    const trig = document.createElement("div");
    trig.textContent = u.trigger;
    const when = document.createElement("div");
    when.className = "urge-when";
    when.textContent = new Date(u.ts).toLocaleString("en-GB", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
    left.append(trig, when);
    const out = document.createElement("div");
    out.className = "urge-outcome " + u.outcome;
    out.textContent = u.outcome === "resisted" ? "RESISTED" : "GAVE IN";
    row.append(left, out);
    log.appendChild(row);
  }
}

// ---------- settings ----------

function renderSettings() {
  $("input-name").value = data.settings.name;
  renderReminders();
  updateNotifStatus();
}

$("input-name").addEventListener("change", () => {
  data.settings.name = $("input-name").value;
  save();
});

function renderReminders() {
  const list = $("reminder-list");
  list.innerHTML = "";
  for (const t of [...data.settings.reminders].sort()) {
    const row = document.createElement("div");
    row.className = "reminder-row";
    const span = document.createElement("span");
    span.textContent = "⏰ " + t;
    const del = document.createElement("button");
    del.className = "icon-btn";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Remove " + t);
    del.addEventListener("click", () => {
      data.settings.reminders = data.settings.reminders.filter((x) => x !== t);
      save();
      renderReminders();
    });
    row.append(span, del);
    list.appendChild(row);
  }
  if (data.settings.reminders.length === 0) {
    list.innerHTML = '<p class="hint">No reminders set.</p>';
  }
}

$("btn-add-reminder").addEventListener("click", () => {
  const t = $("input-reminder-time").value;
  if (!t) return;
  if (!data.settings.reminders.includes(t)) {
    data.settings.reminders.push(t);
    save();
    renderReminders();
    scheduleForegroundReminders();
  }
});

function updateNotifStatus() {
  const el = $("notif-status");
  if (!("Notification" in window)) { el.textContent = "Notifications aren't supported in this browser."; return; }
  el.textContent =
    Notification.permission === "granted" ? "✓ Notifications are on."
    : Notification.permission === "denied" ? "Notifications are blocked — enable them in your browser's site settings."
    : "Notifications are off — tap the button above to enable.";
}

$("btn-notif-perm").addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  await Notification.requestPermission();
  updateNotifStatus();
  if (Notification.permission === "granted") {
    showNotification("WHY is ready 🔔", "You'll get your reminders here. You've got this.");
  }
});

// ---------- export / import ----------

$("btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `why-backup-${dateKey()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("btn-import").addEventListener("click", () => $("input-import").click());
$("input-import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported || !Array.isArray(imported.whys)) throw new Error("bad file");
    data = Object.assign(defaultData(), imported);
    save();
    renderSettings();
    toast("Data imported ✓");
  } catch {
    toast("That file doesn't look like a WHY backup");
  }
  e.target.value = "";
});

// ---------- reminders (foreground + best-effort background) ----------

async function showNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const reg = "serviceWorker" in navigator
    ? await navigator.serviceWorker.getRegistration()
    : null;
  const opts = { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", vibrate: [200, 100, 200] };
  if (reg) reg.showNotification(title, opts);
  else new Notification(title, opts);
}

function reminderBody() {
  const m = pickMotivation();
  return m.text;
}

function checkDueReminders() {
  const now = new Date();
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const today = dateKey();
  let fired = false;
  for (const t of data.settings.reminders) {
    if (t <= nowHM && data.lastFired[t] !== today) {
      data.lastFired[t] = today;
      fired = true;
      showNotification("Remember your why 🔥", reminderBody());
    }
  }
  if (fired) save();
}

let reminderTimeout = null;
function scheduleForegroundReminders() {
  clearTimeout(reminderTimeout);
  const now = new Date();
  const today = dateKey();
  let nextMs = Infinity;
  for (const t of data.settings.reminders) {
    if (data.lastFired[t] === today) continue;
    const [h, m] = t.split(":").map(Number);
    const when = new Date(now); when.setHours(h, m, 0, 0);
    const diff = when - now;
    if (diff > 0 && diff < nextMs) nextMs = diff;
  }
  if (nextMs !== Infinity) {
    reminderTimeout = setTimeout(() => {
      checkDueReminders();
      scheduleForegroundReminders();
    }, nextMs + 1000);
  }
}

// ---------- service worker & background sync ----------

async function initSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register("sw.js");
    // best-effort background reminders on Android (Chrome, installed PWA)
    if ("periodicSync" in reg) {
      try {
        await reg.periodicSync.register("whyapp-reminders", { minInterval: 60 * 60 * 1000 });
      } catch { /* not granted — foreground checks still work */ }
    }
  } catch (err) {
    console.warn("SW registration failed", err);
  }
}

// ---------- boot ----------

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    checkDueReminders();
    scheduleForegroundReminders();
    renderHome();
  }
});

save();          // ensures the IDB mirror exists for the SW
initSW();
showView("home");
checkDueReminders();
scheduleForegroundReminders();
