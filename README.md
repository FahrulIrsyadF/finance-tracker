# Finance Tracker

Aplikasi pencatatan keuangan pribadi berbasis web dengan desain mobile-first. Dibangun menggunakan Next.js (App Router), Tailwind CSS, shadcn/ui, dan Turso (libSQL/SQLite).

> **Single-User by Design** — Setiap orang yang menggunakan project ini memiliki database dan password login mereka sendiri. Tidak ada sistem multi-user.

## Fitur Utama

- 🔐 **Autentikasi Sederhana** — Password-only login menggunakan NextAuth.js + JWT
- 💰 **Manajemen Wallet** — Lacak saldo dari berbagai sumber (Cash, Rekening Bank, E-Wallet) dengan fitur soft-delete
- 🏷️ **Kategori Transaksi** — Kategori default bawaan dan kustomisasi sesuai kebutuhan
- 💸 **Pencatatan Transaksi** — Pemasukan, Pengeluaran, dan Transfer antar wallet
- 📊 **Insight & Laporan** — Dashboard grafik interaktif (Recharts) dengan filter waktu fleksibel
- 🤖 **AI Parsing** — Input transaksi dari teks bebas atau foto struk menggunakan Gemini AI
- 📱 **Mobile-First UX** — Navigasi bawah ala aplikasi native, performa tinggi berkat Server Components

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | [Turso](https://turso.tech/) (Edge SQLite) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Auth | [NextAuth.js](https://next-auth.js.org/) |
| AI | [Google Gemini](https://ai.google.dev/) |

---

## Panduan Setup (untuk clone project ini)

### Prasyarat

- Node.js 20+
- npm / pnpm
- Akun [Turso](https://turso.tech/) (gratis)
- (Opsional) Akun [Google AI Studio](https://aistudio.google.com/) untuk fitur AI

---

### Langkah 1 — Clone & Install

```bash
git clone https://github.com/FahrulIrsyadF/finance-tracker.git
cd finance-tracker
npm install
```

---

### Langkah 2 — Setup Database Turso

Project ini menggunakan Turso sebagai database. Setiap orang yang clone **wajib membuat database Turso sendiri**.

**Install Turso CLI:**
```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (via Scoop)
scoop install turso
```

**Login dan buat database:**
```bash
turso auth login
turso db create finance-tracker
```

**Ambil URL dan Auth Token:**
```bash
# Lihat URL database
turso db show finance-tracker

# Buat auth token
turso db tokens create finance-tracker
```

Simpan output `URL` dan `Token`-nya untuk langkah berikutnya.

---

### Langkah 3 — Konfigurasi Environment Variables

Buat file `.env.local` di root folder proyek:

```bash
cp .env.example .env.local
```

Kemudian isi nilainya:

```env
# =============================================
# DATABASE (Turso) — WAJIB
# =============================================
TURSO_DATABASE_URL="libsql://nama-db-username.turso.io"
TURSO_AUTH_TOKEN="eyJ..."

# =============================================
# AUTHENTICATION — WAJIB
# =============================================
# Password untuk login ke aplikasi (bebas, ini milikmu sendiri)
APP_USER_PASSWORD="password-rahasia-kamu"

# Secret untuk enkripsi JWT session
# Generate via: openssl rand -base64 32
# Atau: https://generate-secret.vercel.app/32
NEXTAUTH_SECRET="random-string-panjang-dan-aman"
NEXTAUTH_URL="http://localhost:3000"

# =============================================
# AI FEATURES (Google Gemini) — OPSIONAL
# =============================================
# Tanpa ini, fitur input via teks/foto tidak akan berfungsi
# Dapatkan gratis di: https://aistudio.google.com/apikey
GEMINI_API_KEY="AIza..."
```

> **Catatan `NEXTAUTH_URL`:** Saat deploy ke production, ganti nilainya ke URL domain kamu (contoh: `https://finance.domainku.com`).

---

### Langkah 4 — Inisialisasi Skema Database

Jalankan perintah ini **sekali** untuk membuat semua tabel di database Turso milikmu:

```bash
npm run db:push
```

---

### Langkah 5 — Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dan login menggunakan password yang kamu set di `APP_USER_PASSWORD`.

---

## Deployment ke Production

Untuk deploy ke [Vercel](https://vercel.com/) (rekomendasi):

1. Push repository ke GitHub
2. Import project di Vercel Dashboard
3. Tambahkan semua env var dari `.env.local` ke **Settings → Environment Variables**
4. Pastikan `NEXTAUTH_URL` diubah ke URL production kamu
5. Deploy

---

## Dokumentasi & Progress

Detail roadmap, perkembangan fitur, dan keputusan teknis tersedia di [`docs/PLAN_AND_PROGRESS.md`](./docs/PLAN_AND_PROGRESS.md).

---

*Dibuat dengan niat untuk pencatatan keuangan yang lebih baik.*
