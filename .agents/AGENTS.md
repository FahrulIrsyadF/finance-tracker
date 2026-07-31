# Finance Tracker - Panduan & Aturan AI Agent

File ini berisi panduan untuk AI agent dalam membantu pengembangan project Finance Tracker.
**Aturan ini WAJIB diikuti oleh setiap agent yang berinteraksi dengan project ini.**

## 1. Kode yang Rapi, Bersih, dan Efisien
- Jangan pernah generate "AI slop" (kode boilerplate yang berlebihan dan tidak berguna).
- Gunakan DRY (Don't Repeat Yourself) principle. Buat utilitas fungsi jika kode sering diulang.
- Selalu pertimbangkan aspek performa (Core Web Vitals). Minimalkan ukuran bundle dan optimalkan rendering.
- Pastikan penggunaan Server Component vs Client Component yang tepat di Next.js (App Router). Hanya gunakan Client Components ( `'use client'` ) jika benar-benar butuh interaktivitas / hooks.

## 2. Keselarasan Tampilan & UI (Mobile First)
- UI/UX project ini didesain untuk **mobile-first** karena sebagian besar pengguna akan mencatat pengeluaran lewat HP.
- Pastikan ukuran touch target (tombol, input) cukup besar.
- Gunakan `shadcn/ui` dan `Tailwind CSS`. Hindari penulisan custom CSS atau inline styles kecuali untuk kondisi dinamis yang sangat spesifik.
- Konsisten menggunakan design tokens / class warna dari Tailwind. Jangan pakai warna hex sembarangan; gunakan palette warna yang sudah ditentukan.
- Berikan UI state yang jelas: loading states, skeleton screens, toast notifikasi sukses/error.

## 3. Gaya Komunikasi
- Bersikap pragmatis, jujur, dan efisien (No fluff).
- Jika solusi atau pendekatan dari User berpotensi buruk (secara performa atau security), segera tegur dan tawarkan alternatif yang lebih baik beserta alasan teknisnya.

## 4. Keamanan & Konfidensialitas
- Project ini merupakan personal use. Meski begitu, proteksi (auth) minimalis (password-based) perlu diamankan secara wajar menggunakan JWT.
- Jangan sampai log atau error dari aplikasi mengekspos isi database atau API Key secara mentah ke client side.

## 5. Alur Kerja (Development Flow)
- Baca selalu file `docs/PLAN_AND_PROGRESS.md` untuk mengetahui konteks posisi saat ini.
- Sebelum mengubah logika krusial, tanyakan ke user jika ada spesifikasi yang abu-abu.
- Pastikan menjalankan linter dan format kode sebelum menganggap suatu task selesai.
