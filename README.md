# Pantau Udara Hexindo (v2)

Aplikasi web pemantauan kualitas udara harian untuk **58 lokasi operasional PT Hexindo Adiperkasa Tbk**
(kantor cabang, kantor perwakilan, proyek pertambangan, dan fasilitas lainnya di seluruh Indonesia).
Berjalan **luring** setelah sekali dibuka dan **menarik data terbaru secara daring** begitu ada koneksi.

Disusun QSHE Department. Angka dan saran di dalamnya adalah bahan rekomendasi QSHE; keputusan
penerapan di tiap lokasi berada pada manajemen.

## Yang baru di v2

- Daftar lokasi mengikuti daftar induk: Wilayah Barat, Wilayah Timur, Pertambangan dan Proyek, Fasilitas Lainnya.
- **Pilih tanggal**: 14, 30, 60, atau 90 hari ke belakang sampai 3 hari prakiraan.
- Pewarnaan mengikuti **level H1 sampai H4**.
- **Peta beranimasi**: asap bergerak mengikuti arah angin dominan, kepekatan mengikuti angka.
- **Tren nasional**: sebaran level per hari, rata-rata ISPU per wilayah, komposisi per wilayah, riwayat tiap lokasi.
- **Dua bahasa**: Indonesia (bawaan) dan English.
- Angka ISPU resmi kini diisi **per lokasi per tanggal**.

## Memperbarui repositori GitHub yang sudah ada

1. Buka repositori, pilih **Add file → Upload files**.
2. Unggah ketujuh berkas ini dan timpa yang lama:

   ```
   index.html
   locations.json
   ispu-resmi.json
   manifest.json
   icon.svg
   sw.js
   README.md
   ```

3. Pilih **Commit changes**. GitHub Pages memperbarui situs dalam satu sampai dua menit.
4. Di perangkat yang sudah pernah membuka versi lama: buka aplikasi saat daring, lalu muat ulang
   sekali lagi. Service worker versi baru (`pantau-udara-v2-1`) akan menggantikan simpanan lama.

Tidak ada proses build, dependensi, atau kunci API.

## Level tindakan

| Level | ISPU | Kategori ISPU | Warna |
|---|---|---|---|
| H1 Pantau | 0 sampai 100 | Baik, Sedang | Biru |
| H2 Batasi | 101 sampai 200 | Tidak Sehat | Kuning |
| H3 Kurangi | 201 sampai 300 | Sangat Tidak Sehat | Merah |
| H4 Lindungi | di atas 300 | Berbahaya | Hitam |

Batas level ada di `CFG.LEVELS` dan teks pengendalian ada di `T.id.ctl` / `T.en.ctl` pada `index.html`.
Sesuaikan di sana bila matriks level Hexindo berbeda.

## Cara kerja data

| Lapis | Sumber | Kedudukan |
|---|---|---|
| ISPU resmi | Stasiun KLH atau DLH, **diisi manual** per lokasi per tanggal | Berkekuatan regulasi, selalu didahulukan |
| ISPU setara | Model CAMS lewat Open-Meteo Air Quality API, PM2,5 dan PM10 per jam, **otomatis** | Peringatan dini dan lokasi tanpa stasiun |
| Hujan dan angin | Open-Meteo Forecast API, harian | Pelengkap; arah angin menggerakkan animasi |

Konsentrasi per jam dirata-ratakan per hari menurut waktu setempat (WIB, WITA, WIT), lalu diubah
menjadi ISPU setara dengan tabel batas PermenLHK No. 14 Tahun 2020. Hari berjalan dihitung dari
pukul 00.00 sampai jam terakhir dan ditandai sementara. US AQI setara dan kategori BMKG (PM2,5)
ditampilkan sebagai padanan.

### Batasan

- Angka model bukan hasil alat ukur di lokasi dan tidak berkekuatan regulasi. Resolusi model
  sekitar 40 km, sehingga lokasi berdekatan mendapat angka yang sama.
- Pada kebakaran lahan di dekat lokasi, model cenderung lebih rendah daripada angka stasiun.
  Bila ada stasiun ISPU, isi angka resminya.
- Angka resmi yang diisi manual tersimpan di perangkat pengisi sampai dibagikan lewat `ispu-resmi.json` (lihat di bawah).
- Di atas batas tabel, kemiringan pita terakhir dilanjutkan secara linier.

## Membagikan angka ISPU resmi ke semua perangkat

`ispu-resmi.json` di akar repositori dibaca semua perangkat. Alurnya:

1. PIC mengisi angka ISPU resmi di aplikasi (kolom **ISPU resmi** atau panel rincian lokasi).
2. Pilih **Unduh ispu-resmi.json** pada daftar lokasi. Berkas hasil unduhan sudah menggabungkan
   isi berkas bersama yang lama dengan isian di perangkat itu.
3. Unggah berkas tersebut ke repositori (timpa yang lama). Setelah satu sampai dua menit,
   angka itu tampil di semua perangkat dengan tanda **resmi, berkas bersama**.

Urutan prioritas angka: isian di perangkat, lalu berkas bersama, lalu model. Bila dua PIC mengisi
pada hari yang sama, unggah bergantian: PIC kedua memuat ulang aplikasi dulu sebelum mengunduh.

Berkas awal berisi tiga angka yang dikutip pada laporan QSHE sebelumnya (Palembang 22 Sep dan 4 Okt,
Pontianak 29 Sep). Periksa kembali terhadap ISPUnet sebelum dipakai sebagai rujukan.

## Mengubah daftar lokasi

Sunting `locations.json`. Contoh satu entri:

```json
{
  "id": "pontianak",
  "nama": "Pontianak",
  "tipe": "cabang",
  "wilayah": "barat",
  "provinsi": "Kalimantan Barat",
  "zona": "WIB",
  "lat": -0.135,
  "lon": 109.395,
  "alamat": "Jl. Adi Sucipto Km. 12, Arang Limbung, Kec. Sungai Raya, Kab. Kubu Raya 78391",
  "stasiunIspu": "Pontianak Tenggara (KLH)"
}
```

- `tipe`: `cabang`, `perwakilan`, `proyek`, `fasilitas`
- `wilayah`: `barat`, `timur`, `tambang`, `fasilitas`
- `zona`: `WIB`, `WITA`, `WIT`
- `id` harus unik dan tidak diubah setelah dipakai, karena menjadi kunci angka manual.
- Koordinat memakai **titik** desimal (aturan JSON). Koordinat saat ini adalah perkiraan dari alamat.
- Lokasi dengan koordinat sama (misalnya Balikpapan, Balikpapan Mining, Balikpapan Remanufacturing)
  memakai satu tarikan data.

## Unduhan CSV

Pemisah kolom titik koma dan desimal koma, sehingga langsung terbuka benar di Excel kantor.

## Sumber

Data model: Open-Meteo (CC BY 4.0) dan Copernicus Atmosphere Monitoring Service.
Garis pantai: Natural Earth (domain publik).
