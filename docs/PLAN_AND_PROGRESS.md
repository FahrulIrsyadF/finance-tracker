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

### Phase 2 — PDF E-Statement
- [ ] Upload & Parse PDF (BCA & Bank Jago)
- [ ] Auto-detect bank dari konten PDF
- [ ] Deduplikasi transaksi
- [ ] UI review bulk: checkbox per transaksi sebelum import
- [ ] Import log

### Phase 3 — AI Multi-Entry Input
- [ ] Integrasi Google Gemini API
- [ ] Textarea → Parse → Preview cards → Confirm
- [ ] Prompt engineering teks natural Bahasa Indonesia (rb, k, jt, tanggal relatif)

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

### Phase 6 — OCR Struk
- [ ] Upload foto struk ke Gemini Vision API
- [ ] Review & edit sebelum simpan

### Phase 7 — Polish & Deploy
- [ ] PWA (manifest + service worker, installable ke homescreen)
- [ ] Final UX review & testing
- [ ] Deploy ke Vercel + Turso production

## Catatan Teknis
- Gunakan `createdAt` vs `date`: `date` adalah tanggal user, `createdAt` adalah waktu record dibuat.
- Balance wallet diupdate otomatis saat createTransaction/deleteTransaction.
- Default kategori punya flag `isDefault: true` dan tidak bisa dihapus.
- Proxy.ts menggantikan middleware.ts (deprecated di Next.js 16).
