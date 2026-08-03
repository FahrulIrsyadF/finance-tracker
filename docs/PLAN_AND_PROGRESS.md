# Finance Tracker - Plan & Progress

## Deskripsi Singkat
Aplikasi pencatatan keuangan pribadi berbasis web (Next.js App Router) dengan desain mobile-first.
- **Database:** Turso (libSQL/SQLite)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** NextAuth Credentials (password-only, single user)
- **AI:** Google Gemini API (multi-entry text parsing, OCR struk)

## Fase Pengembangan

### ✅ Phase 1 — Foundation (SELESAI)
- [x] Inisialisasi Project Next.js (TypeScript, Tailwind, App Router)
- [x] Setup `.agents/AGENTS.md` dan `docs/PLAN_AND_PROGRESS.md`
- [x] Setup shadcn/ui (Button, Card, Input, Label, Select, Dialog, Table, Toast)
- [x] Setup Database Turso + Drizzle ORM schema
- [x] Seed 15 kategori default
- [x] Setup Authentication (NextAuth Credentials, password-only)
- [x] CRUD Wallet (tambah, edit, hapus, saldo awal)
- [x] CRUD Kategori (default + custom, tab income/expense)
- [x] Input Transaksi Manual (income, expense, transfer)
- [x] List Transaksi digroup by tanggal
- [x] Dashboard: ringkasan saldo, income/expense bulanan, transaksi terbaru
- [x] Bottom Navigation mobile-friendly
- [x] Auth guard via proxy.ts (Next.js 16)

### 🔧 Phase 1 Perbaikan (SELESAI)
- [x] Fix bug Select dropdown tampil ID bukan nama (shadcn/Radix rendering issue)
- [x] Fix delete transaksi (tombol tidak visible di mobile)
- [x] Tambah edit transaksi
- [x] Buat halaman tersendiri `/transactions/new` untuk shortcut widget HP
- [x] Implementasi Soft Delete / Arsip untuk Wallet (mencegah orphaned transactions)
- [x] Fix tampilan form transaksi untuk wallet yang terhapus (orphan fallback)

### ✅ Phase 2 — PDF E-Statement (SELESAI)
- [x] Upload & Parse PDF (BCA, Bank Jago, & Bank BRImo) via `pdf-parse` (v1.1.1)
- [x] Auto-detect bank dari konten PDF
- [x] Parser BCA: format mutasi rekening koran (TANGGAL | KETERANGAN | MUTASI DB/CR | SALDO)
- [x] Parser Jago: format pocket history (+ / - prefix + cumulative balance)
- [x] Parser BRI: format e-Statement BRImo (DD/MM/YY HH:MM:SS | Description | Debet | Kredit | Saldo)
- [x] Auto-kategorisasi heuristik: BIAYA ADM / ADMIN / FEE → Biaya Admin, BUNGA → Pendapatan Bunga
- [x] Deduplikasi transaksi (date + amount + type match vs existing DB)
- [x] UI review bulk: checkbox + edit nama + edit kategori per transaksi sebelum import
- [x] Saldo wallet terupdate otomatis setelah import
- [x] Fix: bypass pdf-parse index.js debug mode (import langsung dari `lib/pdf-parse.js`)
- [x] Tombol "Import PDF" di halaman Transaksi

### ✅ Phase 3 — AI Multi-Entry Input (SELESAI)
- [x] Integrasi Google Gemini API (model 3.5 Flash Lite, 3.1 Flash Lite, 2.5 Flash Lite)
- [x] Textarea → Parse → Preview cards → Confirm
- [x] Prompt engineering teks natural Bahasa Indonesia (rb, k, jt, tanggal relatif)
- [x] UI/UX Tracker kuota API (RPM & RPD) via localStorage
- [x] Error handling yang ramah pengguna

### Phase 4 — Excel Import/Export
- [ ] Export `.xlsx` dari filter transaksi
- [ ] Import `.xlsx` dengan mapping kolom
- [ ] Template download

### ✅ Phase 5 — Laporan & Dashboard Lanjutan (SELESAI)
- [x] Halaman `/insights` terpisah dengan navigasi bawah
- [x] Grafik arus kas bulanan/mingguan (Recharts BarChart)
- [x] Breakdown persentase kategori (Recharts DonutChart)
- [x] Filter waktu fleksibel (Mingguan, Bulanan, Tahunan)
- [x] Fitur Custom Start Date untuk siklus bulanan (misal gajian tgl 25)
- [x] UX: tombol navigasi dan tab di-disable saat loading, fade overlay konten, spinner indicator

### Phase 6 — OCR Struk
- [ ] Upload foto struk ke Gemini Vision API
- [ ] Review & edit sebelum simpan

### 🔧 Phase 7 — Polish & Deploy (IN PROGRESS)
- [x] Rebranding ke "Exspend" (nama, logo, metadata, login page)
- [x] DB Reset script (`npm run db:reset`) — wipe + re-seed kategori default
- [x] Fix semua TypeScript type errors (pre-existing bugs di wallets, insights, transaction form, charts)
- [x] Production build verified — 0 errors, 13 pages
- [ ] Deploy ke Vercel + set environment variables

## Catatan Teknis
- Gunakan `createdAt` vs `date`: `date` adalah tanggal user, `createdAt` adalah waktu record dibuat.
- Balance wallet diupdate otomatis saat createTransaction/deleteTransaction.
- Default kategori punya flag `isDefault: true` dan tidak bisa dihapus.
- Proxy.ts menggantikan middleware.ts (deprecated di Next.js 16).

### ✅ Phase 8 — Feature Additions (SELESAI)
- [x] Wallet detail dialog: klik card wallet buka dialog dengan list transaksi + filter waktu (bulan ini / 7 hari / bulan lalu / semua)
- [x] Edit saldo awal wallet via dialog detail (recalc currentBalance otomatis)
- [x] Dashboard wallet list → client component, clickable, buka WalletDetailDialog
- [x] Filter wallet di halaman Insight (dropdown wallet, update via URL param)
- [x] Tombol Transfer di halaman Wallet (buka TransactionForm pre-set type=transfer)
- [x] Halaman Transaksi: server-side filter bulan ini sebagai default (URL params month/year/walletId)
- [x] Halaman Transaksi: filter wallet dropdown
- [x] Halaman Transaksi: navigasi bulan (chevron prev/next)
- [x] Halaman Transaksi: pencarian transaksi (search across all data, tidak terpengaruh filter waktu)
- [x] Halaman Transaksi: tombol Import merged (AI + PDF) dengan pilihan dialog
    - [x] Halaman Transaksi: Floating Action Button (+) untuk tambah transaksi

### ✅ Phase 9 — Budgeting & Recurring Transactions (SELESAI)
- [x] Fitur Batas Anggaran (Budget) harian, mingguan, bulanan per kategori
- [x] Peringatan (toast alert) otomatis saat transaksi melebihi batas anggaran
- [x] Kalkulasi budget dinamis (stateless time-window) kebal terhadap cron fail/timezone bug
- [x] Fitur Transaksi Rutin (Recurring) harian, mingguan, bulanan
- [x] Eksekusi otomatis penjadwalan rutin dengan Catch-Up Logic via SSR rendering
- [x] UI/UX Bottom Navigation: Dropdown "Lainnya" untuk Kategori, Budgeting, & Rutin
