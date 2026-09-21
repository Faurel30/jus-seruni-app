# Seruni Business Management App

Dokumen ini menjelaskan workflow aplikasi, struktur project, serta alur pengembangan yang sedang dibangun untuk kebutuhan usaha UMKM.

## 1. Tujuan aplikasi

Aplikasi ini dibuat untuk membantu mengelola usaha minuman dan makanan sederhana, seperti:
- mengelola menu
- mencatat penjualan
- mencatat pengeluaran
- melihat dashboard keuangan
- memantau stok barang
- memudahkan pemilik usaha melihat laporan dari HP lain

Tujuan utamanya adalah membuat sistem yang bisa dipakai untuk bisnis keluarga, dengan flow kerja yang sederhana tapi tetap terstruktur.

## 2. Masalah utama yang ingin diselesaikan

Aplikasi ini dibuat agar:
- kakak yang mengelola usaha bisa input data lebih cepat
- ibu / pemilik usaha bisa melihat proses usaha dari HP lain
- semua data tidak bergantung hanya pada satu perangkat
- sistem bisa berkembang ke versi siap APK dan backend

## 3. Workflow user saat ini

### A. Login
1. User masuk ke halaman login.
2. Username dan password dicek.
3. Jika benar, session auth dibuat.
4. User diarahkan ke dashboard utama.

### B. Halaman Dashboard
Dashboard menampilkan:
- omset hari ini
- total transaksi hari ini
- pengeluaran hari ini
- keuntungan
- grafik penjualan per periode
- produk terlaris
- transaksi terbaru

### C. Menu Management
User bisa:
- menambah menu baru
- mengedit menu
- menghapus menu
- melihat kategori menu
- mengatur stok

Menu memiliki data seperti:
- id
- nama
- kategori
- harga
- emoji
- stok

### D. Kasir / Penjualan
Pada halaman kasir, user bisa:
- memilih menu dari kategori tertentu
- menambahkan item ke keranjang
- mengubah qty item
- melihat total pesanan
- konfirmasi transaksi
- stok otomatis berkurang saat transaksi berhasil

### E. Pengeluaran
User dapat mencatat pengeluaran dengan data:
- keterangan
- nominal
- kategori
- tanggal

Data ini dipakai untuk menghitung pengeluaran harian dan bulanan.

## 4. Struktur project saat ini

```text
src/
  App.tsx
  auth.ts
  store.ts
  main.tsx
  index.css
  components/
    Navbar.tsx
  models/
    types.ts
  repositories/
    authRepository.ts
    menuRepository.ts
    saleRepository.ts
    expenseRepository.ts
  viewmodels/
    useAuthViewModel.ts
    useMenuViewModel.ts
    useDashboardViewModel.ts
  pages/
    Landing.tsx
    Dashboard.tsx
    Cashier.tsx
    MenuManagement.tsx
    Expenses.tsx
```

## 5. Penjelasan arsitektur MVVM

Project ini sudah mulai dianut pola MVVM agar lebih mudah dikembangkan.

### Model
Model berisi definisi data dan repository untuk penyimpanan data.
Contoh:
- `MenuItem`
- `Sale`
- `Expense`
- fungsi `getMenu()`, `saveMenu()`, `getSales()`, dll.

### ViewModel
ViewModel berisi logic yang berhubungan dengan state dan logika bisnis.
Contoh:
- login dan auth logic
- filter menu
- add/edit/delete menu
- data dashboard summary

### View
View berisi komponen UI dan tampilannya saja.
Contoh:
- halaman dashboard
- halaman menu
- halaman kasir
- halaman expenses

Tujuan utamanya adalah supaya ketika ada perubahan pada data atau logic, UI tidak perlu diubah terlalu banyak.

## 6. Workflow data

### Saat ini
Data masih tersimpan di localStorage, yaitu:
- menu
- sales
- expenses
- auth session

Ini cocok untuk prototype dan pengujian awal, tapi belum cukup untuk multi-device.

### Nanti (fase 2)
Data akan dipindahkan ke backend/database yang pusat, seperti:
- database PostgreSQL / MySQL
- API backend Node.js / Express
- login dengan token JWT

Flow nanti akan seperti ini:
1. aplikasi frontend mengirim request ke backend
2. backend memvalidasi data user
3. backend mengakses database
4. database mengembalikan data ke frontend
5. frontend menampilkan ke layar

## 7. Workflow bisnis yang diinginkan

### Akun dan role
Untuk saat ini, role tunggal cukup dulu:
- admin/operator = input data

Nantinya bisa dikembangkan:
- admin
- owner / viewer
- kasir

### Proses operasional
1. Menu dibuat dan diatur stok.
2. Kasir menerima pesanan.
3. Transaksi disimpan.
4. Stok berkurang sesuai qty.
5. Pengeluaran dicatat.
6. Dashboard menampilkan laporan harian dan bulanan.
7. Pemilik bisa memantau dari HP lain.

## 8. Fase pengembangan yang disarankan

### Fase 1: Operasional dasar
- stok menu
- kasir
- pengeluaran
- dashboard
- validasi data

### Fase 2: Data central dan multi-device
- backend
- database
- login aman
- akses dari HP lain
- owner monitoring

### Fase 3: APK packaging
- wrap app ke Android
- splash screen
- icon
- release APK

### Fase 4: Scale up
- backup data
- export laporan
- notifikasi
- laporan lebih detail
- role user

## 9. Keputusan teknis yang penting

### Kenapa MVVM?
Karena project ini akan terus berkembang. MVVM membantu:
- memudahkan update fitur
- menjaga struktur kode
- memisahkan logic bisnis dari UI
- memudahkan saat nanti mengganti localStorage dengan API/backend

### Kenapa backend diperlukan?
Karena kebutuhanmu adalah:
- data bisa dibuka dari HP lain
- pemilik bisa memantau tanpa harus ikut input
- semua data tidak hanya ada di satu perangkat

## 10. Kesimpulan

Project ini sudah punya fondasi yang kuat untuk dijadikan aplikasi UMKM. Yang perlu dilanjutkan adalah:
- struktur yang lebih rapi (MVVM)
- backend dan database
- login aman
- multi-device access
- dashboard monitoring untuk pemilik

Dengan begitu, aplikasi ini bisa berkembang menjadi sistem yang benar-benar membantu usaha keluarga.

## 11. Catatan pengembangan selanjutnya

Saat fase 2 dimulai, fokus utamanya adalah:
- memindahkan data lokal ke database
- membangun API untuk menu, sales, expenses, auth
- menyiapkan dashboard owner
- menyiapkan akses multi-HP

Semua ini akan dilakukan dengan pendekatan yang tetap menjaga struktur MVVM agar developer lebih mudah menjaga kode.
