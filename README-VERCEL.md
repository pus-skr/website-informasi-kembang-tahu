# Kembang Tahu Panambangan - Admin Vercel

Admin panel mempertahankan tampilan HTML/CSS/JS yang sudah ada, tetapi backend PHP diganti menjadi Vercel Serverless Functions.

## Arsitektur

Admin Panel -> /api/login -> signed HttpOnly cookie -> /api/save atau /api/upload -> GitHub Contents API -> commit -> Vercel deploy otomatis.

Data publik tetap berada di `data/*.json`. Credential admin tidak disimpan di repository.

## Environment Variables di Vercel

Tambahkan:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET` (minimal 32 karakter acak)
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH` (isi `main`)

`GITHUB_TOKEN` harus memiliki izin minimal untuk membaca dan menulis repository target (Contents: Read and write).

## Catatan upload

Foto galeri dikirim sebagai base64 JSON dan dibatasi maksimal 3 MB per gambar agar tetap aman terhadap batas request serverless. Format: JPG, JPEG, PNG, GIF, WEBP.

## Sebelum push

1. Pastikan `data/admin.json` sudah dihapus.
2. Pastikan tidak ada password asli di file JavaScript/JSON/HTML.
3. Jangan commit `.env.local` atau token GitHub.
4. Isi Environment Variables di Vercel.
5. Push project ke GitHub.
6. Deploy/redeploy di Vercel.
