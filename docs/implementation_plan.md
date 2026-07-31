# FinanceTracker — Personal Finance Web App

> Status: **Keputusan final terkonfirmasi — siap eksekusi**

Aplikasi pencatatan keuangan pribadi berbasis web dengan fokus mobile-first, dibangun di atas Next.js + Tailwind + shadcn/ui, dengan database Cloudflare D1 (SQLite gratis) dan deploy di Vercel.

---

## Stack Keputusan Final

| Layer | Teknologi | Alasan |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Actions cocok untuk mutasi data tanpa boilerplate API |
| Styling | Tailwind CSS + shadcn/ui | Mobile-friendly, aksesibel, konsisten |
| Database | **Turso** (libSQL/SQLite) | Gratis, connect langsung ke Vercel tanpa overhead, 500MB free |
| ORM | Drizzle ORM | Type-safe, support Turso (libSQL driver), lightweight |
| Auth | NextAuth Credentials | Single-user, password-only, no signup flow |
| AI / OCR | Google Gemini API (gratis tier) | Untuk baca struk foto + multi-entry parsing |
| PDF Parse | pdf-parse + custom parser | Extract text dari e-statement BCA & Bank Jago |
| Excel | xlsx (SheetJS) | Import/export `.xlsx` |
| Deploy | Vercel (Frontend) + Cloudflare D1 (DB) | D1 diakses via Cloudflare Workers binding |

> **Database: Turso (final)**
> Turso adalah SQLite-compatible database yang bisa diakses langsung dari Vercel tanpa middleware apapun. Free tier: 500MB storage, 1 Miliar reads/bulan — lebih dari cukup untuk personal use seumur hidup.
> - Driver: `@libsql/client` + `drizzle-orm`
> - Region: Singapore (`sin`) agar latency rendah dari Indonesia
> - Backup: Turso support point-in-time recovery

**Auth: Password-only via NextAuth Credentials**
Single user hardcoded. User buka app → input password → masuk. Tidak ada signup, tidak ada username field. Session disimpan via JWT cookie, persist 30 hari.

---

## Fitur & Scope

### Core Features
1. **Dashboard** — summary saldo, grafik pengeluaran/pemasukan, recent transactions
2. **Multi-entry Auto-Input** — ketik bebas, AI parse jadi multiple transaksi terstruktur
3. **Baca Struk (OCR)** — upload foto struk → extract item & total → jadi transaksi
4. **Baca E-Statement PDF** — upload PDF rekening koran → parse jadi daftar transaksi
5. **Wallet/Sumber Dana** — multi-wallet (cash, BCA, OVO, dll) dengan input saldo awal
6. **Kategori** — default + custom kategori
7. **Laporan Keuangan** — bulanan, range tanggal, per kategori, per wallet
8. **Export/Import Excel** — download `.xlsx`, upload untuk bulk import
9. **Transfer Antar Wallet** — catat perpindahan dana antar wallet

### Out of Scope (untuk sekarang)
- Multi-user / sharing
- Recurring transactions (bisa ditambah nanti)
- Budgeting per kategori (bisa fase 2)

---

## Arsitektur Aplikasi

```
┌─────────────────────────────────────────────┐
│              Next.js App (Vercel)            │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │  App Router  │  │   Server Actions     │ │
│  │  (Pages/UI)  │  │   (DB mutations)     │ │
│  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────────────────────────────────┐│
│  │         Drizzle ORM (Client)             ││
│  └──────────────────────────────────────────┘│
└─────────────────┬───────────────────────────┘
                  │ libSQL protocol
         ┌────────▼────────┐
         │   Turso (DB)    │
         │  (SQLite-compat) │
         └─────────────────┘
         
External APIs:
- Google Gemini API → text parsing + OCR
- Vercel Blob / Cloudflare R2 → image storage (untuk struk)
```

---

## Database Schema

```sql
-- Wallets (sumber dana)
wallets: id, name, type(cash|bank|ewallet|credit), 
         initial_balance, current_balance, color, icon, created_at

-- Categories
categories: id, name, type(income|expense), color, icon, is_default

-- Transactions
transactions: id, wallet_id, category_id, type(income|expense|transfer),
              amount, note, date, created_at,
              transfer_to_wallet_id (nullable),
              source(manual|ai_text|ocr|pdf_import|excel_import)

-- Transaction Tags (many-to-many)
tags: id, name
transaction_tags: transaction_id, tag_id

-- Import Logs (tracking riwayat import)
import_logs: id, type(pdf|excel|ocr), filename, status, 
             created_at, transaction_count
```

---

## Phases of Development

### Phase 1 — Foundation (1-2 minggu)
- [ ] Setup project: `npx create-next-app`, Tailwind, shadcn/ui
- [ ] Setup Turso + Drizzle ORM, schema migration
- [ ] Auth sederhana (NextAuth dengan credentials, 1 user saja)
- [ ] CRUD Wallet (tambah, edit, hapus, set saldo awal)
- [ ] CRUD Kategori (default seeder + custom)
- [ ] Input transaksi manual (form biasa)
- [ ] List transaksi + filter dasar

### Phase 2 — PDF E-Statement (1-2 minggu)
- [ ] Upload PDF → parse teks dengan `pdf-parse`
- [ ] Parser BCA: format tabel dengan kolom Tanggal / Keterangan / Cabang / Jumlah / Saldo
- [ ] Parser Bank Jago: format berbeda — ada transaksi dengan emoji kategori, format amount pakai tanda kurung untuk debit
- [ ] Auto-detect bank dari header/footer PDF
- [ ] Deduplikasi transaksi yang sudah ada (match by date + amount)
- [ ] UI review bulk: checkbox per transaksi, bisa uncheck yang tidak mau diimport
- [ ] Import log: catat filename, tanggal import, jumlah transaksi

### Phase 3 — AI Multi-Entry Input (1 minggu)
- [ ] Integrasi Google Gemini API
- [ ] UI: textarea besar → tombol "Parse" → preview card tiap transaksi → confirm
- [ ] Prompt engineering untuk parse teks bebas Bahasa Indonesia
- [ ] Edge cases: tanggal relatif ("kemarin", "tadi"), mata uang (15rb, 15k, 15.000)

### Phase 4 — Excel Import/Export (3-5 hari)
- [ ] Export: generate `.xlsx` dari filter transaksi dengan SheetJS
- [ ] Import: upload `.xlsx` → mapping kolom → preview → save
- [ ] Template download untuk memudahkan import manual

### Phase 5 — Laporan & Dashboard (1 minggu)
- [ ] Dashboard: net balance, income vs expense, top categories
- [ ] Grafik dengan Recharts atau Chart.js
- [ ] Laporan bulanan dengan breakdown per kategori
- [ ] Filter by wallet, kategori, tanggal range

### Phase 6 — OCR Struk (1 minggu)
- [ ] Upload gambar → kirim ke Gemini Vision API
- [ ] Parse response: merchant, tanggal, item list, total
- [ ] UI review: user konfirmasi/edit sebelum save
- [ ] Storage foto struk (Vercel Blob, gratis 1GB)

### Phase 7 — Polish & Deploy (3-5 hari)
- [ ] Mobile UX review: bottom navigation, touch targets
- [ ] PWA setup (manifest + service worker) agar bisa "install" di HP
- [ ] Deploy ke Vercel, connect Turso production
- [ ] Environment variables, error handling, loading states

---

## Tantangan Teknis & Mitigasinya

### 1. OCR Struk Foto — MEDIUM-HIGH
**Tantangan**: Foto bisa buram, pencahayaan buruk, format tiap merchant berbeda.

**Mitigasi**:
- Gunakan **Gemini 1.5 Flash** (gratis tier cukup) yang sudah sangat baik untuk receipt OCR
- Prompt yang di-structure dengan output JSON schema yang ketat
- **Wajib ada review step** sebelum user confirm save — jangan auto-save
- Compres gambar di client sebelum upload (gunakan `browser-image-compression`)

```
Estimasi akurasi: ~85-90% untuk struk yang terbaca jelas
```

### 2. PDF E-Statement Parser — HIGH
**Tantangan**: BCA dan Bank Jago punya format PDF yang sama-sama berbeda.

**Analisis format per bank**:

| Aspek | BCA | Bank Jago |
|---|---|---|
| Tipe PDF | Selectable text | Selectable text |
| Format tanggal | `DD/MM/YY` | `DD MMM YYYY` |
| Format amount | `1.234.567,00` | `1.234.567` |
| Debit/kredit | Kolom terpisah atau tanda `-` | Tanda kurung `(...)` untuk debit |
| Struktur | Tabel per halaman | List per transaksi |
| Header penanda | `REKENING KORAN` | `Account Statement` |

**Mitigasi**:
- Keduanya pakai selectable text → tidak butuh OCR, langsung parse teks
- Buat `parsers/banks/bca.ts` dan `parsers/banks/jago.ts` terpisah
- Auto-detect bank dari konten PDF (cari keyword `BCA` atau `Bank Jago` / `Jago`)
- Normalisasi output ke format transaksi internal yang sama
- **Wajib review step**: tampilkan semua transaksi hasil parse dalam tabel, user centang mana yang mau diimport
- Simpan raw PDF text di import log untuk debugging jika ada yang salah parse

> **Warning**: Ini fitur yang paling makan waktu. Regex untuk tiap bank harus dites dengan PDF real. Expect 1.5-2x estimasi awal.

### 3. Multi-Entry AI Parsing — MEDIUM
**Tantangan**: Teks bahasa natural Indonesia sangat bervariasi ("beli es teh sama gorengan 8rb", "bayar listrik 250k", "gaji masuk 5jt")

**Mitigasi**:
- Gemini dengan few-shot examples yang kaya
- Tangani: satuan (rb, k, jt, ribu, juta), tanggal relatif, singkatan kategori
- Output selalu JSON array, parse server-side
- Preview sebelum save, user bisa edit tiap entry

**Contoh prompt flow**:
```
Input: "tadi pagi beli kopi 25rb sama nasi 18rb, malem bayar parkir 3rb"

Output:
[
  { date: "today", note: "kopi", amount: 25000, category: "Makanan & Minuman", type: "expense" },
  { date: "today", note: "nasi", amount: 18000, category: "Makanan & Minuman", type: "expense" },
  { date: "today", note: "parkir", amount: 3000, category: "Transportasi", type: "expense" }
]
```

### 4. Vercel ↔ Database Latency — LOW-MEDIUM
**Tantangan**: Turso hosted di region tertentu, Vercel juga punya region. Latency bisa tinggi.

**Mitigasi**:
- Pilih Turso region yang sama dengan Vercel deployment region (Singapore untuk Asia)
- Gunakan React Query / SWR untuk client-side caching
- Server Actions dengan proper revalidation agar tidak re-fetch berlebih

### 5. Mobile UX — MEDIUM
**Tantangan**: Input transaksi dari HP harus se-frictionless mungkin.

**Mitigasi**:
- Bottom navigation bar (thumb-friendly)
- FAB (Floating Action Button) untuk quick add
- Keyboard number pada input amount (inputMode="decimal")
- PWA installable agar terasa seperti native app
- Gesture swipe untuk delete/edit pada list

### 6. Gemini API Rate Limit — LOW
**Tantangan**: Free tier Gemini 1.5 Flash: 15 RPM, 1M tokens/day. Cukup untuk personal use.

**Mitigasi**:
- Personal use → tidak akan hit limit
- Tambahkan retry logic dengan exponential backoff sebagai safety net

---

## Struktur Folder Next.js

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   │   ├── page.tsx          # list + filter
│   │   │   ├── new/page.tsx      # manual input
│   │   │   ├── ai-input/page.tsx # multi-entry text
│   │   │   ├── ocr/page.tsx      # upload struk
│   │   │   └── pdf/page.tsx      # import e-statement
│   │   ├── wallets/
│   │   ├── categories/
│   │   ├── reports/
│   │   └── settings/
│   └── api/
│       └── ai/
│           ├── parse-text/route.ts
│           ├── parse-receipt/route.ts
│           └── parse-pdf/route.ts
├── components/
│   ├── ui/                       # shadcn components
│   ├── transaction/
│   ├── wallet/
│   ├── charts/
│   └── layout/
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   └── index.ts              # DB client
│   ├── ai/
│   │   ├── gemini.ts
│   │   ├── parse-text.ts
│   │   └── parse-receipt.ts
│   ├── parsers/
│   │   ├── pdf-parser.ts
│   │   ├── banks/bca.ts
│   │   └── banks/mandiri.ts
│   └── excel/
│       ├── export.ts
│       └── import.ts
└── actions/                      # Server Actions
    ├── transactions.ts
    ├── wallets.ts
    └── categories.ts
```

---

## Estimasi Biaya (Production)

| Service | Tier | Biaya |
|---|---|---|
| Vercel | Hobby (free) | $0 |
| Turso | Free (500MB, 1B reads) | $0 |
| Gemini API | Free (15 RPM) | $0 |
| Vercel Blob | Free (1GB) | $0 |
| **Total** | | **$0/bulan** |

> Personal use dengan frekuensi wajar → free tier semua cukup.

---

## Keputusan Final yang Terkonfirmasi

| Topik | Keputusan |
|---|---|
| Database | Turso (libSQL), region Singapore |
| Auth | NextAuth Credentials, password-only, single user |
| PDF Bank | BCA + Bank Jago |
| Mata uang | IDR only |
| PWA | Ya — installable ke homescreen HP |
| Host | Vercel (frontend) + Turso (database) |

---

## Dependency List (Perkiraan)

```bash
# Core
npx create-next-app@latest
npm install drizzle-orm @libsql/client
npm install drizzle-kit -D

# Auth
npm install next-auth

# AI
npm install @google/generative-ai

# PDF
npm install pdf-parse
npm install @types/pdf-parse -D

# Excel
npm install xlsx

# Image compression (client-side, sebelum upload struk)
npm install browser-image-compression

# UI
npx shadcn@latest init
# Charts
npm install recharts
```

> [!TIP]
> Semua dependency di atas tidak ada yang berbayar atau butuh credit card. Turso dan Gemini API sama-sama punya free tier yang lebih dari cukup untuk personal use.
