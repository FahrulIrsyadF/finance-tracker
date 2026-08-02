# Panduan Database Lokal (Development)

Proyek ini mendukung penggunaan database SQLite lokal (`local.db`) untuk keperluan *development*, sehingga kamu bisa bereksperimen dengan bebas tanpa takut merusak data di database Turso (*production*).

## Konfigurasi

Semua konfigurasi database diatur di dalam file `.env.local`. Aplikasi dan Drizzle ORM dikonfigurasi untuk secara otomatis memprioritaskan database *development* jika _environment variable_ `TURSO_DATABASE_URL_DEV` tersedia.

Contoh isi `.env.local` yang disarankan:

```env
# URL untuk Database Lokal (Development)
TURSO_DATABASE_URL_DEV="file:local.db"

# URL untuk Database Produksi (Turso)
# URL ini tetap dibutuhkan jika kamu ingin meng-clone data dari Turso ke lokal.
TURSO_DATABASE_URL="libsql://namadatabase-kamu.turso.io"
TURSO_AUTH_TOKEN="token_kamu_di_sini"
```

## Alur Kerja (Workflow)

### 1. Inisialisasi Skema Database Lokal
Jika file `local.db` belum ada, atau jika ada perubahan pada skema database (`src/lib/db/schema.ts`), pastikan untuk menyingkronkan skema ke database lokal dengan menjalankan:

```bash
npm run db:push
```
*Perintah ini akan membuat file `local.db` di root direktori jika belum ada, lalu meng-apply skema database ke dalamnya.*

### 2. Meng-clone Data dari Production (Turso) ke Lokal
Untuk kemudahan *development*, kamu bisa menyalin data dari database *production* (Turso) ke dalam database lokal.
Pastikan `TURSO_DATABASE_URL` (Production) dan `TURSO_DATABASE_URL_DEV` (Lokal) sudah terisi di `.env.local`, lalu jalankan:

```bash
npm run db:clone
```
*Script ini akan memindahkan data Wallets, Categories, Transactions, dll dari Turso ke file `local.db`. Perintah ini aman dijalankan berulang kali (tidak akan menduplikasi data yang sama).*

### 3. Menjalankan Aplikasi
Setelah database lokal siap, cukup jalankan server seperti biasa:

```bash
npm run dev
```
Karena `TURSO_DATABASE_URL_DEV` sudah didefinisikan, aplikasi otomatis akan terhubung dan membaca/menulis data ke file `local.db`.

## Catatan Penting
- **Jangan men-commit file `local.db` ke GitHub / Git.** File ini biasanya sudah di-*ignore* secara otomatis.
- **Untuk Production (Vercel):** Pastikan di *dashboard deployment* Vercel kamu, *environment variables* diset dengan `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` (yang merujuk ke Turso). Jangan tambahkan akhiran `_DEV` di *dashboard* Vercel.
