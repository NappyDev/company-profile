# Panduan Dashboard Napdev

Klien dapat mengganti foto/video dan mengelola kartu lewat dashboard. Hasil simpan masuk ke folder proyek di komputer. Website online diperbarui setelah perubahan dikirim ke GitHub.

## 1. Persiapan satu kali

1. Pasang **Node.js LTS** dari <https://nodejs.org> dan **Git** dari <https://git-scm.com>.
2. Gunakan salinan repository website yang sudah terhubung ke GitHub dan akun yang memiliki akses push. Minta pengembang menyiapkan ini pertama kali.
3. Pastikan GitHub Pages dan domain website sudah diatur oleh pengembang.

Tidak perlu menjalankan `npm install`; dashboard menggunakan fitur bawaan Node.js. Node.js versi 18 atau lebih baru diperlukan.

## 2. Buka dashboard

Klik dua kali **BUKA-DASHBOARD.bat** di folder proyek. Browser akan membuka dashboard otomatis. Jika browser tidak terbuka, salin alamat ini:

```text
http://127.0.0.1:4310/dashboard
```

Biarkan jendela terminal dashboard terbuka selama mengedit. Untuk menghentikannya, tekan `Ctrl+C` di jendela tersebut.

Alternatif melalui terminal yang dibuka di folder proyek:

```bash
npm run dashboard
```

Lalu buka alamat dashboard di atas. Cara ini juga dapat digunakan di macOS/Linux; file `.bat` ditujukan untuk Windows.

## 3. Edit konten

| Menu | Yang dapat diubah |
|---|---|
| Foto & video | Video beranda, foto header About, logo About, foto komunitas Contact |
| Carousel | Gambar, nama, deskripsi, urutan proyek beranda |
| Kartu beranda | Gambar, nama, link, urutan kartu proyek pilihan |
| Katalog game | Gambar, nama, link, kategori, harga/status, developer, genre, urutan game |
| Anggota tim | Foto, nama, bio/peran, urutan anggota |
| File unggahan | Melihat file dan menghapus unggahan dashboard yang tidak dipakai |
| Kirim ke GitHub | Menyalin perintah untuk menerbitkan perubahan |

### Mengganti gambar atau video

1. Buka menu yang sesuai.
2. Klik pemilih file di bawah gambar/video, lalu pilih file dari komputer.
3. Tunggu pesan unggahan selesai.
4. Klik **Simpan perubahan**.
5. Klik **Lihat website**, lalu muat ulang halaman pratinjau jika sudah terbuka.

Dashboard menyalin file ke folder proyek dan membuat nama unik otomatis. Gambar masuk ke `img/`, video ke `videos/`. File asli di komputer Anda tetap ada.

Gambar yang diterima: JPG, JPEG, PNG, GIF, WebP, dan AVIF. Video: MP4 atau WebM. Maksimum unggahan adalah **90 MB per file**; gunakan media yang sudah dikompres agar website cepat dibuka. Video MP4 dengan codec H.264 cocok untuk pemakaian umum.

Anda juga dapat menempel URL gambar/video pada isian yang tersedia. Gunakan URL yang langsung mengarah ke file media, bukan halaman pratinjau penyedia penyimpanan. Nama/path media lokal tidak perlu diketik jika memakai pemilih file.

### Menambah, mengedit, atau menghapus kartu

1. Buka menu kartu yang sesuai.
2. Klik **Tambah kartu** atau **Tambah anggota**.
3. Isi nama, pilih gambar, dan lengkapi isian lainnya.
4. Untuk mengubah urutan, klik **↑** atau **↓**.
5. Untuk menghapus, klik **Hapus kartu** dan konfirmasi.
6. Klik **Simpan perubahan**.

Kategori katalog yang tersedia: `action`, `adventure`, dan `casual`. Kategori menentukan filter di halaman katalog. Kartu beranda dan katalog game dikelola terpisah; jika game ingin muncul di keduanya, tambahkan ke kedua menu.

Carousel memiliki 16 posisi yang mengulang daftar proyek. Menambah proyek membuat variasi konten pada putaran carousel. Semua daftar boleh dikosongkan jika ingin menyembunyikan kartu di bagian tersebut.

### Menghapus file media

Menghapus kartu tidak otomatis menghapus file gambarnya, karena file bisa dipakai oleh konten lain.

1. Ganti/hapus konten yang memakai file tersebut.
2. Klik **Simpan perubahan**.
3. Buka **File unggahan**.
4. Klik **Hapus file** untuk unggahan yang sudah tidak dipakai dan konfirmasi.

Dashboard hanya dapat menghapus file yang dibuat lewat fitur unggahan dashboard. File asli proyek ditandai **File asli** agar tidak terhapus saat merapikan unggahan.

## 4. Kirim ke website online

Setelah menyimpan dan memeriksa pratinjau, buka **terminal baru di folder proyek**. Di VS Code, gunakan **Terminal → New Terminal**. Salin seluruh blok berikut, tempel, lalu tekan Enter:

```bash
git add .
git commit -m "Update konten website"
git push
```

Perintah yang sama tersedia melalui tombol **Salin perintah Git** di dashboard.

Tunggu proses GitHub Pages selesai, lalu muat ulang domain website. Jika diminta login GitHub, gunakan akun yang memiliki akses repository. Jika Git melaporkan `nothing to commit`, tidak ada perubahan baru yang perlu dibuat menjadi commit.

Jika beberapa orang mengedit repository yang sama, lakukan `git pull` sebelum mulai mengedit. Jika push ditolak, simpan pekerjaan Anda dan minta pengembang membantu menyatukan perubahan; jangan gunakan force push.

## 5. Jika ada masalah

| Masalah | Langkah yang dilakukan |
|---|---|
| File .bat meminta Node.js | Pasang Node.js, lalu buka kembali file .bat |
| Dashboard mungkin sudah terbuka / port digunakan | Cek terminal yang sudah berjalan dan buka alamat dashboard; bila aplikasi lain memakai port 4310, tutup aplikasi itu terlebih dahulu |
| Simpan gagal | Baca pesan di bawah dashboard; lengkapi nama/gambar setiap kartu dan gunakan link https://... |
| Perubahan belum terlihat di pratinjau | Klik Simpan perubahan, lalu muat ulang tab website |
| Perubahan belum terlihat online | Pastikan commit/push berhasil dan proses GitHub Pages selesai |
| Foto tidak muncul | Pilih ulang file melalui dashboard; bila memakai URL, pastikan URL file masih dapat diakses |
| Tombol hapus file belum tersedia | File masih dipakai, belum disimpan, atau merupakan file asli proyek |

## Catatan untuk pengembang

- `content.json` adalah sumber konten media dan kartu. Edit manual HTML untuk bagian tersebut akan ditimpa tampilan dari data JSON saat halaman dimuat.
- `js/site-content.js` membaca data untuk halaman publik. Path dihitung relatif terhadap lokasi website sehingga mendukung domain khusus dan hosting dalam subfolder repository.
- `dashboard/server.mjs` melayani dashboard dan pratinjau pada `127.0.0.1:4310`, serta menyimpan konten dan unggahan ke folder proyek. Server tidak berjalan di GitHub Pages.
- `dashboard/index.html` menyediakan formulir. Membuka dashboard di domain publik tidak memberi akses mengedit repository; API penyimpanan hanya ada pada server lokal.
- Dashboard tidak menjalankan commit/push. Klien menerbitkan perubahan melalui terminal setelah meninjau hasilnya.
- Gunakan folder proyek ini sebagai root repository GitHub Pages. Jika menerbitkan dengan GitHub Actions, pastikan artefak mencakup `content.json`, `js/`, dan folder media. Domain dikelola melalui pengaturan Pages dan file `CNAME` bila digunakan.
