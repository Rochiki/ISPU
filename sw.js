/* Pantau Udara Hexindo - service worker (v2)
   Cangkang aplikasi disimpan agar tetap bisa dibuka saat luring.
   Data kualitas udara TIDAK disimpan di sini; tarikan terakhir disimpan halaman di localStorage,
   sehingga angka yang tampil saat luring selalu yang terakhir berhasil ditarik.
   Naikkan angka versi CACHE setiap kali berkas aplikasi diperbarui. */
const CACHE = "pantau-udara-v2-1";
const SHELL = ["./", "./index.html", "./locations.json", "./manifest.json", "./icon.svg", "./ispu-resmi.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // Panggilan API selalu lewat jaringan; kegagalan ditangani halaman, bukan disimpan.
  if (url.hostname.endsWith("open-meteo.com")) return;

  // Cangkang aplikasi: jaringan dulu agar pembaruan terbaca, lalu simpanan bila luring.
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const salinan = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, salinan)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
