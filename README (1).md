# Pantau Udara — Jaringan Hexindo

Aplikasi web pemantauan kualitas udara untuk seluruh lokasi operasional PT Hexindo Adiperkasa Tbk
di Sumatera dan Kalimantan. Berjalan **luring** setelah sekali dibuka, dan **menarik data terbaru
secara daring** begitu ada koneksi.

Disusun QSHE Department. Angka di dalamnya adalah bahan rekomendasi QSHE; keputusan penerapan
di tiap lokasi tetap pada manajemen.

---

## Cara memasang di GitHub Pages

1. Buat repositori baru, misalnya `hexindo-udara`.
2. Unggah seluruh berkas di folder ini ke akar repositori:

   ```
   index.html
   locations.json
   manifest.json
   icon.svg
   sw.js
   README.md
   ```

3. Buka **Settings → Pages**, pilih **Deploy from a branch**, cabang `main`, folder `/ (root)`, lalu simpan.
4. Tunggu satu hingga dua menit. Alamatnya akan berbentuk
   `https://<nama-akun>.github.io/hexindo-udara/`.

Tidak ada proses build, tidak ada dependensi, tidak ada kunci API yang perlu dibeli atau disimpan.

### Memasang di ponsel

Buka alamatnya di browser ponsel, lalu pilih **Tambahkan ke Layar Utama**. Aplikasi akan terpasang
seperti aplikasi biasa dan tetap terbuka saat tidak ada sinyal.

---

## Cara kerja data

| Lapisan | Sumber | Kedudukan |
|---|---|---|
| **Tier 1** | ISPU resmi dari stasiun KLH atau DLH provinsi, **dimasukkan manual** oleh PIC lokasi | Berkekuatan regulasi. Menimpa angka model dan ditandai hijau pada kartu. |
| **Tier 3** | Open-Meteo Air Quality API — PM2,5 dan PM10, **otomatis** | Model sebaran, bukan stasiun di lokasi. Untuk peringatan dini dan lokasi tanpa stasiun. |

Konsentrasi PM2,5 dan PM10 diubah menjadi **ISPU-setara** memakai tabel batas
**Peraturan Menteri Lingkungan Hidup dan Kehutanan No. 14 Tahun 2020**. Parameter kritis diambil
dari nilai tertinggi antara keduanya, sama seperti cara KLH menghitung. US AQI ditampilkan sebagai
padanan, bukan sebagai dasar keputusan.

### Batasan yang harus disampaikan ke pembaca laporan

- Angka Open-Meteo berasal dari **model**, bukan alat ukur di lokasi. Bukan pengganti ISPU resmi
  dan **tidak berkekuatan regulasi**.
- ISPU resmi memakai **rata-rata 24 jam**; angka di aplikasi ini **per jam**, sehingga lebih berfluktuasi.
- Untuk konsentrasi di atas batas tabel, kemiringan pita terakhir dilanjutkan secara linier.
  Hasilnya bisa meleset beberapa persen dari angka ISPUnet. Pada lokasi ekstrem, pakai angka resmi.

---

## Mengisi angka ISPU resmi

Setiap kartu punya kolom isian **ISPU resmi**. Isi dari aplikasi ISPUnet Kementerian Lingkungan
Hidup bila lokasi tersebut punya stasiun. Begitu diisi:

- angka itu menggantikan hasil model pada kartu, ringkasan, dan CSV;
- penanda sumber berubah menjadi **Tier 1 · ISPU resmi**;
- nilainya tersimpan di perangkat dan bertahan saat aplikasi ditutup.

Mengosongkan kolom akan mengembalikan kartu ke angka model.

---

## Menambah atau mengubah lokasi

Sunting `locations.json`. Setiap entri berbentuk:

```json
{
  "id": "pontianak",
  "nama": "Pontianak",
  "tipe": "Cabang",
  "pulau": "Kalimantan",
  "provinsi": "Kalimantan Barat",
  "lat": -0.0263,
  "lon": 109.3425,
  "stasiunIspu": "Pontianak Tenggara (KLH)"
}
```

`id` harus unik dan tidak diubah setelah dipakai, karena menjadi kunci penyimpanan angka manual.
Koordinat memakai **titik** sebagai pemisah desimal karena itu aturan format JSON — bukan koma.

---

## Fitur

- Kartu per lokasi dengan warna mengikuti skala ISPU resmi, grafik mini 24 jam, dan usulan level kerja H1–H4
- Ringkasan: jumlah lokasi Berbahaya, Sangat Tidak Sehat, nilai tertinggi, dan berapa lokasi sudah memakai angka Tier 1
- Saringan pulau, pencarian bebas, tiga pilihan pengurutan
- Unduh CSV memakai pemisah titik koma dan koma desimal, sesuai pengaturan Excel kantor
- Penanda daring atau luring, dan keterangan berapa jam lalu data terakhir ditarik

## Kredit sumber

Open-Meteo Air Quality API (CC-BY 4.0) · Kementerian Lingkungan Hidup (ISPUnet) ·
Peraturan Menteri Lingkungan Hidup dan Kehutanan No. 14 Tahun 2020.
