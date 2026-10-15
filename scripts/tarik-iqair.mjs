/* Pantau Udara Hexindo - penarik data sensor IQAir
   Dijalankan oleh GitHub Actions (.github/workflows/tarik-iqair.yml), bukan oleh peramban.
   Kunci API dibaca dari secret IQAIR_KEY sehingga tidak pernah tampil di situs.

   Paket gratis IQAir (Community): 5 panggilan/menit, 500/hari, 10.000/bulan, data TINGKAT KOTA.
   Hemat panggilan:
   - Tiap titik lokasi dipetakan sekali ke "kota terdekat" IQAir (nearest_city), diperiksa ulang tiap 7 hari.
   - Pada tarikan biasa, satu kota cukup satu panggilan (city) walaupun dipakai beberapa lokasi.
   Hasil: iqair.json di akar repositori, dibaca aplikasi. */
import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.IQAIR_KEY || "";
const API = process.env.IQAIR_API || "https://api.airvisual.com/v2";   // dapat diganti untuk uji
const OUT = "iqair.json";
const JEDA_MS = +(process.env.IQAIR_JEDA_MS || 13000);   // 5 panggilan per menit
const CEK_ULANG_HARI = 7;       // pemetaan lokasi -> kota diperiksa ulang tiap 7 hari
const SIMPAN_HARI = 95;         // riwayat yang disimpan
const TZ = { WIB: "Asia/Jakarta", WITA: "Asia/Makassar", WIT: "Asia/Jayapura" };

const tidur = ms => new Promise(r => setTimeout(r, ms));
const jarakKm = (a, b, c, d) => {
  const R = 6371, rad = x => (x * Math.PI) / 180;
  const h = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
};
function waktuSetempat(iso, tz) {
  const o = {};
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(iso)).forEach(p => (o[p.type] = p.value));
  return { tanggal: `${o.year}-${o.month}-${o.day}`, jam: +o.hour % 24 };
}

let panggilan = 0, terakhir = 0;
async function iqair(jalur, q) {
  const tunggu = terakhir + JEDA_MS - Date.now();
  if (terakhir && tunggu > 0) await tidur(tunggu);
  for (let coba = 0; coba < 2; coba++) {
    terakhir = Date.now(); panggilan++;
    const url = `${API}/${jalur}?${new URLSearchParams({ ...q, key: KEY })}`;
    let j = null;
    try { j = await (await fetch(url)).json(); } catch (e) { j = { status: "fail", data: { message: "jaringan: " + e.message } }; }
    if (j && j.status === "success") return j.data;
    const pesan = (j && j.data && (j.data.message || j.data)) || "tanpa pesan";
    if (pesan === "call_limit_reached" || pesan === "too_many_requests") { await tidur(65000); continue; }
    throw Object.assign(new Error(String(pesan)), { fatal: /api_key|incorrect|permission|payment/.test(String(pesan)) });
  }
  throw new Error("call_limit_reached");
}

const lokasi = JSON.parse(await readFile("locations.json", "utf8")).lokasi || [];
let db = { data: {}, titik: {} };
try { db = { ...db, ...JSON.parse(await readFile(OUT, "utf8")) }; } catch (e) { /* berkas belum ada */ }
db.data ||= {}; db.titik ||= {};

const titik = new Map();
for (const l of lokasi) {
  const key = l.lat + "," + l.lon;           // sama dengan kunci titik pada aplikasi
  if (!titik.has(key)) titik.set(key, { key, lat: l.lat, lon: l.lon, tz: TZ[l.zona] || TZ.WIB, ids: [] });
  titik.get(key).ids.push(l.id);
}

if (!KEY) {
  db.galat = "Secret IQAIR_KEY belum diisi di Settings > Secrets and variables > Actions.";
  db.diperiksa = new Date().toISOString();
  await writeFile(OUT, JSON.stringify(db));
  console.log(db.galat);
  process.exit(0);
}

const bacaanKota = new Map();   // "kota|provinsi" -> data IQAir pada tarikan ini
const kunciKota = d => d.city + "|" + d.state;
function catatKota(d) {
  const [lon, lat] = (d.location && d.location.coordinates) || [];
  bacaanKota.set(kunciKota(d), { d, lat, lon });
}
let galat = [], fatal = null;
const sekarang = Date.now();

// 1. Pemetaan lokasi -> kota terdekat (baru, berubah, atau sudah 7 hari)
for (const p of titik.values()) {
  const m = db.titik[p.key];
  const perlu = !m || !m.dicek || (sekarang - Date.parse(m.dicek)) / 864e5 >= CEK_ULANG_HARI;
  if (!perlu || fatal) continue;
  try {
    const d = await iqair("nearest_city", { lat: p.lat, lon: p.lon });
    catatKota(d);
    const b = bacaanKota.get(kunciKota(d));
    db.titik[p.key] = {
      kota: d.city, provinsi: d.state, negara: d.country,
      lat: b.lat ?? null, lon: b.lon ?? null,
      jarakKm: b.lat != null ? jarakKm(p.lat, p.lon, b.lat, b.lon) : null,
      lokasi: p.ids, dicek: new Date().toISOString(),
    };
  } catch (e) { galat.push(`${p.key}: ${e.message}`); if (e.fatal) fatal = e.message; }
}

// 2. Satu panggilan per kota yang belum terbaca pada tarikan ini
for (const p of titik.values()) {
  const m = db.titik[p.key];
  if (!m || fatal) continue;
  const k = m.kota + "|" + m.provinsi;
  if (bacaanKota.has(k)) continue;
  try { catatKota(await iqair("city", { city: m.kota, state: m.provinsi, country: m.negara || "Indonesia" })); }
  catch (e) {
    galat.push(`${m.kota}: ${e.message}`); if (e.fatal) fatal = e.message;
    if (e.message === "city_not_found") delete db.titik[p.key].dicek;   // petakan ulang pada tarikan berikutnya
  }
}

// 3. Simpan bacaan per titik menurut tanggal dan jam setempat: [jam, US AQI, polutan utama, waktu UTC]
for (const p of titik.values()) {
  const m = db.titik[p.key]; if (!m) continue;
  const b = bacaanKota.get(m.kota + "|" + m.provinsi); if (!b) continue;
  const pol = b.d.current && b.d.current.pollution; if (!pol || pol.aqius == null) continue;
  const { tanggal, jam } = waktuSetempat(pol.ts, p.tz);
  const hari = (db.data[tanggal] ||= {});
  const arr = (hari[p.key] ||= []).filter(r => r[0] !== jam);
  arr.push([jam, pol.aqius, pol.mainus || "", pol.ts]);
  hari[p.key] = arr.sort((x, y) => x[0] - y[0]);
}

// 4. Pangkas riwayat lama
const batas = new Date(sekarang - SIMPAN_HARI * 864e5).toISOString().slice(0, 10);
for (const t of Object.keys(db.data)) if (t < batas) delete db.data[t];

db.sumber = "IQAir AirVisual API (paket Community, tingkat kota). Angka asli US AQI; aplikasi mengubahnya ke ISPU setara.";
db.diperiksa = new Date().toISOString();
if (bacaanKota.size) db.diperbarui = db.diperiksa;
db.galat = fatal ? `Kunci IQAir bermasalah: ${fatal}` : galat.length ? galat.slice(0, 10).join("; ") : "";
db.panggilan = panggilan;
await writeFile(OUT, JSON.stringify(db));
console.log(`Selesai: ${panggilan} panggilan, ${bacaanKota.size} kota terbaca, ${galat.length} galat.`);
if (galat.length) console.log(galat.join("\n"));
if (fatal) process.exit(1);
