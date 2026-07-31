# Finance Tracker

Aplikasi pencatatan keuangan pribadi berbasis web dengan desain mobile-first. Dibangun menggunakan Next.js (App Router), Tailwind CSS, shadcn/ui, dan Turso (libSQL/SQLite).

## Fitur Utama
- 🔐 **Autentikasi Sederhana**: Menggunakan NextAuth dengan skema password-only.
- 💰 **Manajemen Wallet**: Lacak saldo dari berbagai sumber (Cash, Rekening Bank, E-Wallet). Dilengkapi fitur soft-delete.
- 🏷️ **Kategori Transaksi**: Kategori default bawaan dan kustomisasi sesuai kebutuhan.
- 💸 **Pencatatan Transaksi**: Pemasukan, Pengeluaran, dan Transfer antar wallet.
- 📊 **Insight & Laporan**: Dashboard grafik interaktif (Recharts) dengan filter waktu yang sangat fleksibel (Custom Start Date untuk bulanan).
- 📱 **Mobile-First UX**: Navigasi bawah ala aplikasi native, dialog konfirmasi yang rapi, dan performa tinggi berkat Server Components Next.js.

## Tech Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Database:** [Turso](https://turso.tech/) (Edge SQLite)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)

## Panduan Instalasi Lokal

1. Clone repository ini:
   ```bash
   git clone https://github.com/FahrulIrsyadF/finance-tracker.git
   cd finance-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   Buat file `.env.local` di root folder dan isi dengan:
   ```env
   TURSO_DATABASE_URL=libsql://[nama-db]-turso.turso.io
   TURSO_AUTH_TOKEN=your_turso_auth_token
   NEXTAUTH_SECRET=your_nextauth_secret_key
   NEXTAUTH_URL=http://localhost:3000
   APP_USER_PASSWORD=your_app_login_password
   ```

4. Sinkronisasi Skema Database:
   ```bash
   npm run db:push
   ```

5. Jalankan Development Server:
   ```bash
   npm run dev
   ```
   Aplikasi bisa diakses di `http://localhost:3000`.

## Dokumentasi & Progress
Untuk melihat detail roadmap, perkembangan fitur, dan keputusan teknis, silakan lihat file `docs/PLAN_AND_PROGRESS.md`.

---
*Dibuat dengan ❤️ untuk pencatatan keuangan yang lebih baik.*
