# Cosmic Player — Dokumentasi Kode

Pemutar **audio YouTube** bertema luar angkasa. Video YouTube tidak ditampilkan; hanya audionya yang diputar, dengan thumbnail sebagai cover dan visualizer animasi di atasnya. Latar belakang berupa kanvas animasi (bintang, bintang jatuh, dan dua galaksi berputar).

Aplikasi ini murni **HTML + CSS + JavaScript** (tanpa framework, tanpa build tool, tanpa dependensi npm).

---

## 1. Daftar Isi

1. [Struktur File](#2-struktur-file)
2. [Cara Menjalankan](#3-cara-menjalankan)
3. [Gambaran Alur Aplikasi](#4-gambaran-alur-aplikasi)
4. [index.html](#5-indexhtml)
5. [style.css](#6-stylecss)
6. [script.js](#7-scriptjs)
7. [Fitur & Shortcut Keyboard](#8-fitur--shortcut-keyboard)
8. [Cara Mengubah / Kustomisasi](#9-cara-mengubah--kustomisasi)
9. [Batasan & Catatan Penting](#10-batasan--catatan-penting)

---

## 2. Struktur File

```
cosmic-player/
├── index.html   → kerangka halaman (struktur elemen)
├── style.css    → seluruh tampilan, layout, dan animasi CSS
├── script.js    → seluruh logika (latar angkasa, visualizer, YouTube, kontrol)
└── DOCUMENTATION.md
```

Tidak ada file gambar. Thumbnail diambil langsung dari server YouTube berdasarkan Video ID.

---

## 3. Cara Menjalankan

Aplikasi **tidak bisa dibuka lewat `file://`** (klik dua kali file HTML) karena YouTube IFrame API memerlukan protokol `http://` atau `https://`. Kode sudah menampilkan pesan peringatan jika dibuka lewat `file://`.

Pilihan menjalankan:

| Cara | Keterangan |
|------|------------|
| **GitHub Pages** | Upload ke repository, aktifkan Pages (Settings → Pages). Otomatis HTTPS. |
| **XAMPP / Laragon** | Taruh folder di `htdocs`, buka `http://localhost/cosmic-player/`. |
| **VS Code Live Server** | Klik kanan `index.html` → *Open with Live Server*. |
| **Python** | Jalankan `python -m http.server 8000` di folder proyek, buka `http://localhost:8000`. |

Koneksi internet wajib (memuat YouTube IFrame API, video, dan thumbnail).

---

## 4. Gambaran Alur Aplikasi

```
Halaman dibuka
   │
   ├─► script.js dijalankan
   │      ├─ Inisialisasi canvas angkasa (bintang + galaksi) → loop requestAnimationFrame
   │      ├─ Membangun batang visualizer
   │      └─ Menunggu YouTube IFrame API siap
   │
Pengguna menempel link YouTube → klik LOAD / tekan Enter
   │
   ├─► loadTrack()
   │      ├─ extractVideoId()  → ambil 11 karakter Video ID
   │      ├─ Validasi (ID valid? bukan file://?)
   │      ├─ Hancurkan player lama (jika ada)
   │      ├─ Set thumbnail (maxresdefault → fallback hqdefault)
   │      └─ new YT.Player(...)  → player YouTube tersembunyi dibuat
   │
   ├─► onPlayerReady()   → tampilkan judul & durasi, aktifkan semua kontrol
   │
Pengguna menekan Play
   │
   ├─► togglePlay() → player.playVideo()
   │
   ├─► onPlayerStateChange(PLAYING)
   │      ├─ isPlaying = true, tambah class "playing"
   │      ├─ startProgress()   → timer 500ms update progress bar & waktu
   │      └─ startVisualizer() → animasi batang visualizer
   │
Lagu selesai
   └─► onPlayerStateChange(ENDED)
          ├─ Repeat ON  → seekTo(0) + playVideo() (mengulang)
          └─ Repeat OFF → status "Playback finished"
```

**Konsep kunci:** YouTube dipakai hanya sebagai *sumber suara*. IFrame player dibuat tetapi disembunyikan di luar layar (`left:-10000px`). Seluruh tampilan yang dilihat pengguna (cover, visualizer, tombol) adalah elemen buatan sendiri yang mengendalikan player tersembunyi tersebut lewat YouTube IFrame API.

---

## 5. index.html

### Susunan elemen

```
<body>
 ├─ <canvas id="spaceCanvas">          Latar angkasa (fixed, di belakang semua)
 ├─ <div class="nebula nebula-one/two"> Gumpalan cahaya blur dekoratif
 └─ <main class="app">
     ├─ <header class="header">
     │    ├─ .brand                     Logo + judul
     │    └─ .header-actions
     │         ├─ .status               Label "AUDIO MODE"
     │         └─ #fullscreenButton     Tombol layar penuh
     ├─ <section class="player-card">
     │    ├─ .search-area
     │    │    ├─ #youtubeLink          Input URL
     │    │    ├─ #loadButton           Tombol LOAD
     │    │    └─ #message              Area pesan error
     │    ├─ #audioCard                 Kartu pemutar
     │    │    ├─ .cover-wrap
     │    │    │    ├─ #coverImage      Thumbnail
     │    │    │    ├─ #coverPlaceholder Tampilan "NO TRACK"
     │    │    │    ├─ #visualizer      Wadah batang visualizer
     │    │    │    └─ .frame-corner ×4 Hiasan sudut
     │    │    └─ .track-section
     │    │         ├─ #trackTitle / #trackStatus
     │    │         ├─ #progressBar, #currentTime, #duration
     │    │         └─ .controls: #backButton, #pauseButton,
     │    │                       #forwardButton, #muteButton, #repeatButton
     │    └─ #youtubePlayerHost         Wadah player YouTube (tersembunyi)
     └─ <footer>
```

### Script yang dimuat

```html
<script src="https://www.youtube.com/iframe_api"></script>  <!-- YouTube IFrame API -->
<script src="script.js"></script>
```

Urutan penting: `iframe_api` dimuat lebih dulu agar objek `YT` tersedia.

### Daftar ID elemen yang dipakai JavaScript

| ID | Fungsi |
|----|--------|
| `spaceCanvas` | Kanvas latar angkasa |
| `youtubeLink` | Input link YouTube |
| `loadButton` | Memuat lagu dari link |
| `fullscreenButton` | Toggle layar penuh |
| `message` | Menampilkan pesan error/validasi |
| `audioCard` | Kartu utama; diberi class `playing` saat lagu berjalan |
| `coverImage` | Gambar thumbnail |
| `visualizer` | Wadah batang visualizer |
| `trackTitle`, `trackStatus` | Judul lagu dan status ("Now playing", "Paused", dll.) |
| `progressBar` | Slider posisi lagu (0–100) |
| `currentTime`, `duration` | Teks waktu berjalan dan total durasi |
| `pauseButton` | Tombol play/pause utama (bulat) |
| `backButton`, `forwardButton` | Mundur / maju 10 detik |
| `muteButton` | Mute / unmute |
| `repeatButton` | Toggle repeat |
| `youtubePlayerHost` | Tempat player YouTube tersembunyi dibuat |

---

## 6. style.css

### Variabel warna (`:root`)

| Variabel | Fungsi |
|----------|--------|
| `--cyan`, `--blue`, `--purple`, `--pink` | Warna aksen tema |
| `--white` | Warna teks utama |
| `--muted` | Warna teks sekunder |

### Layout satu layar (tanpa scroll)

- `body` dikunci `height: 100dvh; overflow: hidden`.
- `.app` berupa flex column dengan lebar maksimum **620px**, diposisikan di tengah vertikal.
- Ukuran thumbnail dihitung dari tinggi layar:

  ```css
  width: min(100%, max(220px, calc((100dvh - 430px) * 16 / 9)));
  aspect-ratio: 16 / 9;
  ```

  Angka `430px` adalah perkiraan tinggi semua elemen *selain* thumbnail (header, input, kontrol, footer). Jika Anda menambah elemen baru di luar thumbnail, **naikkan angka ini** agar halaman tetap muat tanpa scroll.

### Bagian-bagian penting

| Selector | Peran |
|----------|-------|
| `#spaceCanvas` | `position: fixed`, `z-index: -3` — di belakang segalanya |
| `.nebula` | Lingkaran besar ter-blur sebagai cahaya latar |
| `.player-card` | Kartu kaca (glassmorphism) dengan `backdrop-filter: blur` |
| `.cover-wrap` | Bingkai thumbnail 16:9; class `.loaded` dan `.playing` mengubah tampilannya |
| `#coverImage` | `object-fit: cover` — ini yang memotong pita hitam pada thumbnail `hqdefault` |
| `.visualizer` / `.bar` | Wadah dan batang visualizer (tinggi batang diatur lewat JavaScript) |
| `.controls button` | Gaya semua tombol kontrol; `.active` = tombol menyala (dipakai Repeat) |
| `.youtube-audio-host` | Menyembunyikan player YouTube di luar layar |
| `.playing-indicator i` | Ikon equalizer kecil; beranimasi (`@keyframes eq`) hanya saat `.playing` |

### Class status yang diatur JavaScript

| Class | Dipasang di | Arti |
|-------|-------------|------|
| `.loaded` | `.cover-wrap` | Thumbnail sudah dimuat (sembunyikan placeholder) |
| `.playing` | `.cover-wrap`, `#audioCard` | Lagu sedang diputar (visualizer terang, equalizer bergerak) |
| `.active` | `#repeatButton` | Repeat sedang aktif |
| `.is-fullscreen` | `<body>` | Mode layar penuh aktif (bisa dipakai untuk gaya tambahan) |

### Responsif

- `@media (max-width: 700px)` — padding dirapatkan, label `AUDIO MODE` dan footer disembunyikan.
- `@media (max-height: 640px)` — footer disembunyikan agar tetap muat.

---

## 7. script.js

File dibagi menjadi beberapa bagian bertanda komentar `/* ===== NAMA ===== */`.

### 7.1 Variabel global

| Variabel | Tipe | Fungsi |
|----------|------|--------|
| `player` | `YT.Player \| null` | Objek player YouTube aktif |
| `videoId` | `string \| null` | Video ID yang sedang dimuat |
| `isPlaying` | `boolean` | Apakah lagu sedang diputar |
| `repeatOn` | `boolean` | Status repeat |
| `visualizerFrame` | `number \| null` | ID `requestAnimationFrame` visualizer (`null` = tidak berjalan) |
| `progressTimer` | `number \| null` | ID `setInterval` untuk update progress |
| `bars` | `Element[]` | Daftar batang visualizer |
| `stars`, `shootingStars`, `galaxies` | `Array` | Data objek latar angkasa |
| `lastSpaceTime` | `number` | Timestamp frame sebelumnya (untuk menghitung `dt`) |

---

### 7.2 Bagian SPACE — latar angkasa

Semua digambar pada satu `<canvas>` lewat satu loop animasi `drawSpace`.

| Fungsi | Penjelasan |
|--------|------------|
| `resizeCanvas()` | Menyesuaikan ukuran canvas dengan jendela. Memakai *device pixel ratio* (maks. 2) agar tajam di layar retina, lalu `setTransform` agar koordinat tetap dalam piksel CSS. |
| `createStars()` | Membuat array bintang diam (posisi, radius, kecerahan, kecepatan kedip, fase). Jumlah = `min(260, lebarJendela / 5)`. |
| `shootingStar()` | Menambah satu bintang jatuh ke `shootingStars` (maks. 5 sekaligus). Menentukan posisi awal, panjang ekor, jarak tempuh (`speed`), umur (`maxLife`, ms) dan sudut. |
| `gauss()` | Angka acak berdistribusi mendekati normal (−1 s/d 1). Dipakai untuk menyebar bintang di lengan galaksi. |
| `makeGalaxy(opts)` | Membuat satu objek galaksi beserta ribuan partikelnya (lihat di bawah). |
| `createGalaxies()` | Membuat 2 galaksi (kiri-atas ungu, kanan-bawah cyan). Dipanggil saat awal dan setiap resize. |
| `drawGalaxies(dt)` | Menggambar dan memutar semua galaksi setiap frame. |
| `drawSpace(time)` | **Loop utama latar.** Urutan: hapus canvas → gambar galaksi → gambar bintang berkedip (+ bergerak turun pelan) → kadang munculkan bintang jatuh → gambar bintang jatuh → jadwalkan frame berikutnya. |

#### Cara kerja galaksi

Setiap partikel disimpan sebagai koordinat polar: **jarak dari pusat (`r`)** dan **sudut (`a`)**.

```js
const u = Math.pow(Math.random(), 1.6);   // lebih banyak partikel dekat pusat
const r = u * radius;
const a = arm * (2π / arms) + u * 4.2 + spread;  // 4.2 = tingkat "putaran" spiral
```

- `arms` = jumlah lengan spiral.
- `u * 4.2` membuat sudut bertambah seiring jarak → bentuk spiral.
- `spread` (dari `gauss()`) membuat lengan tampak berkabut, bukan garis tipis.

Saat digambar setiap frame:

1. `ctx.translate` ke pusat galaksi, `ctx.rotate(orient)` untuk kemiringan bidang, `ctx.scale(1, tilt)` untuk menipiskan secara vertikal (efek dilihat dari samping).
2. Gambar *halo* (radial gradient) sebagai inti yang bersinar.
3. Putar tiap partikel dengan menambah `g.rot` pada sudutnya (`cos`/`sin` dihitung sekali per galaksi per frame demi performa).
4. Mode `globalCompositeOperation = "lighter"` membuat cahaya saling menjumlah (efek bersinar).

`g.rot += g.speed * dt` — memakai `dt` (selisih waktu antar frame, dibatasi 48 ms) supaya kecepatan putar konsisten di layar 60Hz maupun 144Hz. Nilai `speed` negatif = berputar berlawanan arah.

#### Cara kerja bintang jatuh

```js
const p = s.life / s.maxLife;          // progres 0..1
x = s.x + cos(angle) * s.speed * p;    // posisi kepala
opacity = Math.sin(p * Math.PI);        // muncul → puncak → hilang
```

Ekor digambar sebagai garis dengan `createLinearGradient` dari transparan ke putih. Objek dihapus (`splice`) saat `life >= maxLife`.

---

### 7.3 Bagian VISUALIZER

> ⚠️ **Penting:** visualizer ini adalah **animasi simulasi**, bukan analisis frekuensi audio asli. YouTube IFrame API tidak memberi akses ke data audio, sehingga tinggi batang dihasilkan dari kombinasi gelombang sinus dan "denyut" palsu.

| Fungsi | Penjelasan |
|--------|------------|
| `buildVisualizer()` | Membuat elemen `.bar` (64 di desktop, 38 di layar < 600px) dan menyimpannya di `bars`. Dipanggil saat awal dan setiap resize. |
| `animateVisualizer(time)` | Loop animasi batang. Jika `isPlaying` = `false`, batang dikembalikan ke tinggi kecil dan loop berhenti (`visualizerFrame = null`). |

Rumus tinggi tiap batang:

```
envelope = semakin dekat ke tengah, semakin tinggi
wave1, wave2 = dua gelombang sinus berbeda frekuensi
beat = sin(...)^7  → lonjakan tajam periodik (kesan ketukan)
height = 5 + (wave1+1)*10*envelope + (wave2+1)*5 + beat*28   (maks. 82%)
```

Warna batang digeser sedikit dengan `hue-rotate` agar terlihat hidup.

---

### 7.4 Bagian YOUTUBE

| Fungsi | Penjelasan |
|--------|------------|
| `extractVideoId(value)` | Mengambil Video ID dari berbagai format link: `youtu.be/ID`, `youtube.com/watch?v=ID`, `/embed/ID`, `/shorts/ID`, `/live/ID`. Mengembalikan `null` jika gagal. Parameter tambahan seperti `&list=` diabaikan. |
| `formatTime(seconds)` | Mengubah detik menjadi teks `m:ss` (contoh: `125` → `2:05`). |
| `setMessage(text)` | Menampilkan pesan di bawah input (kosong = hapus pesan). |
| `setControls(enabled)` | Mengaktifkan/menonaktifkan semua tombol kontrol dan progress bar sekaligus. Jika menambah tombol baru, **masukkan ke daftar di fungsi ini**. |
| `loadTrack()` | Titik masuk saat LOAD ditekan. Validasi → reset state → set thumbnail → buat `YT.Player`. |
| `onPlayerReady(event)` | Player siap: isi judul (`getVideoData().title`), durasi, lalu aktifkan kontrol. |
| `onPlayerStateChange(event)` | Menangani perubahan status: `PLAYING`, `PAUSED`, `ENDED`, `BUFFERING`. Mengatur class, teks tombol, status, dan memulai/menghentikan timer progress dan visualizer. |
| `onPlayerError()` | Dipanggil jika YouTube menolak memutar (video diprivasi, dibatasi embed, dll.). |
| `togglePlay()` | Jika sedang main → `pauseVideo()`, jika tidak → `playVideo()`. |
| `startVisualizer()` | Menjalankan loop visualizer hanya jika belum berjalan (mencegah loop ganda). |
| `startProgress()` / `stopProgress()` | Memulai / menghentikan `setInterval` 500 ms yang memperbarui progress bar dan teks waktu. |

#### Thumbnail dengan fallback

```js
coverImage.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;   // kualitas tertinggi
// onerror atau gambar placeholder kecil (≤120px) → pakai hqdefault.jpg
```

Tidak semua video punya `maxresdefault`. Jika gagal, otomatis turun ke `hqdefault` (4:3 dengan pita hitam, yang kemudian terpotong oleh `object-fit: cover` pada kotak 16:9).

#### Player tersembunyi

```js
new YT.Player("youtubePlayer", {
    width: "200", height: "200", videoId,
    playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
    events: { onReady, onStateChange, onError }
});
```

Ukuran dibuat 200×200 (bukan 0) karena beberapa browser menolak/menunda pemutaran pada iframe yang terlalu kecil atau tidak terlihat.

---

### 7.5 Bagian KONTROL (event listener)

| Elemen | Aksi |
|--------|------|
| `#loadButton` / Enter di input | `loadTrack()` |
| `#pauseButton` | `togglePlay()` |
| `#backButton` | `seekTo(posisiSekarang − 10)` (minimum 0) |
| `#forwardButton` | `seekTo(posisiSekarang + 10)` |
| `#muteButton` | Toggle `mute()` / `unMute()` dan ganti ikon 🔊 / 🔇 |
| `#repeatButton` | `toggleRepeat()` |
| `#progressBar` (event `input`) | `seekTo(nilai/100 × durasi)` |

### Repeat

```js
function toggleRepeat() { repeatOn = !repeatOn; ... classList.toggle("active", repeatOn); }
```

Di `onPlayerStateChange`, saat status `ENDED` dan `repeatOn` bernilai `true`:

```js
player.seekTo(0, true);
player.playVideo();
return;   // lewati kode "Playback finished"
```

`repeatOn` disimpan di variabel global sehingga **tetap aktif** meski pengguna memuat lagu lain.

---

### 7.6 Bagian FULLSCREEN

| Fungsi | Penjelasan |
|--------|------------|
| `isFullscreen()` | Mengecek apakah mode layar penuh aktif (mendukung versi `webkit` untuk Safari). |
| `toggleFullscreen()` | Masuk/keluar layar penuh pada `document.documentElement`. |
| `updateFullscreenButton()` | Mengganti ikon (⛶ ↔ ✕), tooltip, dan menambah/menghapus class `is-fullscreen` di `<body>`. Dipanggil dari event `fullscreenchange`, sehingga ikon tetap benar walau pengguna keluar dengan **Esc**. |

> Browser hanya mengizinkan layar penuh setelah **aksi pengguna** (klik atau tombol). Karena itu fullscreen tidak bisa dipicu otomatis saat halaman dibuka.

---

### 7.7 Hook YouTube API

```js
window.onYouTubeIframeAPIReady = function () { /* kosong */ };
```

YouTube memanggil fungsi global ini saat API siap. Dibiarkan kosong karena player baru dibuat setelah pengguna menekan LOAD. Fungsi ini **harus tetap ada** supaya API tidak menimbulkan error.

---

## 8. Fitur & Shortcut Keyboard

| Fitur | Cara pakai |
|-------|-----------|
| Muat lagu | Tempel link → **LOAD** atau **Enter** |
| Play / Pause | Tombol bulat, atau **Spasi** |
| Mundur / Maju 10 detik | Tombol `↶ 10` / `10 ↷` |
| Pindah posisi | Geser progress bar |
| Mute | Tombol 🔊 |
| Repeat | Tombol 🔁, atau **R** |
| Layar penuh | Tombol ⛶ di header, atau **F**; keluar dengan ✕ / **F** / **Esc** |

Shortcut keyboard dinonaktifkan saat kursor berada di kolom input URL agar tidak mengganggu pengetikan.

---

## 9. Cara Mengubah / Kustomisasi

| Ingin mengubah | Lokasi |
|----------------|--------|
| Warna tema | `:root` di `style.css` |
| Lebar maksimum aplikasi | `.app { width: min(620px, ...) }` |
| Ukuran thumbnail | `.cover-wrap { width: ... calc((100dvh - 430px) ...) }` |
| Seberapa sering bintang jatuh muncul | `Math.random() < .014` di `drawSpace` (naikkan = lebih sering) |
| Kecepatan bintang jatuh | `maxLife` di `shootingStar()` (kecil = lebih cepat) |
| Jumlah bintang diam | `Math.min(260, ...)` di `createStars()` |
| Jumlah / posisi / warna galaksi | Array di `createGalaxies()` (`x`, `y`, `hue`, `arms`, `count`, `speed`) |
| Kecepatan putar galaksi | `speed` di `createGalaxies()` (negatif = berlawanan arah jarum jam) |
| Jumlah batang visualizer | `const count = ...` di `buildVisualizer()` |
| Tinggi maksimal visualizer | `Math.min(82, height)` di `animateVisualizer()` |
| Loncatan maju/mundur | Angka `10` di listener `backButton` & `forwardButton` |
| Interval update progress | `500` (ms) di `startProgress()` |

**Menambah tombol kontrol baru:**
1. Tambahkan `<button id="...">` di `.controls` pada `index.html`.
2. Ambil elemennya di bagian atas `script.js`.
3. Masukkan ke daftar di `setControls()`.
4. Tambahkan `addEventListener`.

---

## 10. Batasan & Catatan Penting

- **Visualizer bukan analisis audio asli** (lihat bagian 7.3). Untuk visualizer sungguhan diperlukan akses langsung ke aliran audio, yang tidak diberikan oleh YouTube IFrame API.
- **Video tertentu tidak bisa diputar** jika pemiliknya melarang embed. Aplikasi menampilkan pesan *"Video tidak dapat diputar"* lewat `onPlayerError()`.
- **Hanya video tunggal.** Parameter `&list=` pada link playlist diabaikan; yang diputar hanya video pada parameter `v=`.
- **Autoplay dibatasi browser.** Lagu harus dimulai dengan menekan tombol play.
- **Performa:** latar angkasa menggambar ±1.800 partikel galaksi per frame. Pada perangkat lemah, kurangi `count` di `createGalaxies()`.
- **Penggunaan:** pastikan penggunaan sesuai [Ketentuan Layanan YouTube](https://www.youtube.com/t/terms); aplikasi ini memakai player resmi YouTube dan tidak mengunduh audio.
