/* WHY — service worker: offline cache + best-effort background reminders */

importScripts("quotes.js");

const CACHE = "whyapp-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./quotes.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// cache-first, refresh in background
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});

// ---------- background reminders (periodic sync, Chrome/Android) ----------

function idbGet(key) {
  return new Promise((resolve) => {
    const req = indexedDB.open("whyapp-db", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      const db = req.result;
      const get = db.transaction("kv").objectStore("kv").get(key);
      get.onsuccess = () => { resolve(get.result); db.close(); };
      get.onerror = () => { resolve(null); db.close(); };
    };
  });
}

function idbSet(key, val) {
  return new Promise((resolve) => {
    const req = indexedDB.open("whyapp-db", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onerror = () => resolve();
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(val, key);
      tx.oncomplete = () => { resolve(); db.close(); };
    };
  });
}

async function fireDueReminders() {
  const state = await idbGet("reminders");
  if (!state || !state.times || !state.times.length) return;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  state.lastFired = state.lastFired || {};

  let fired = false;
  for (const t of state.times) {
    if (t <= nowHM && state.lastFired[t] !== today) {
      state.lastFired[t] = today;
      fired = true;
      const own = state.whys || [];
      const useOwn = own.length && Math.random() < 0.6;
      const body = useOwn
        ? own[Math.floor(Math.random() * own.length)]
        : QUOTES[Math.floor(Math.random() * QUOTES.length)].t;
      await self.registration.showNotification("Remember your why 🔥", {
        body,
        icon: "icons/icon-192.png",
        badge: "icons/icon-192.png",
        vibrate: [200, 100, 200]
      });
    }
  }
  if (fired) await idbSet("reminders", state);
}

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "whyapp-reminders") e.waitUntil(fireDueReminders());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      return clients.openWindow("./");
    })
  );
});
