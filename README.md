# Amy Trading Academy

Website materi trading HTML langsung untuk GitHub Pages.

## Isi
- 158 halaman materi utama
- 15 bagian materi
- 4 halaman glosarium
- Tema light clean
- Tiap materi punya halaman sendiri
- Prompt gambar ada di tiap materi
- Sistem login kode akses

## Kode test awal
Kode test lokal: `AMY-TEST-2026`

Hapus kode ini setelah deploy dengan mengedit `data/access-codes.json`, lalu buat kode baru dari GitHub Actions.

## Cara generate kode dari GitHub
1. Upload semua file ke repository GitHub.
2. Buka tab **Actions**.
3. Jalankan workflow **Generate Access Codes**.
4. Isi jumlah kode dan prefix.
5. Setelah workflow selesai, buka artifact **generated-access-codes** untuk melihat kode asli.
6. File `data/access-codes.json` hanya menyimpan hash kode, lalu otomatis di-commit ke repo.

## Catatan keamanan
GitHub Pages adalah static hosting. Sistem kode ini menyeleksi akses normal dan tidak menaruh kode asli di halaman. Namun untuk proteksi 100% terhadap orang teknis yang membaca source/repo publik, perlu backend/private hosting atau enkripsi konten.

## Deploy GitHub Pages
Workflow `Deploy GitHub Pages` sudah disiapkan. Bisa dipakai lewat GitHub Actions atau Pages settings.
