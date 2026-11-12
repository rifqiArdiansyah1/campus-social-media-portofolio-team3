# Arsip Migrasi SQL Manual (Legacy)

Berkas di dalam folder ini (`001_client_revisions.sql` dan `apply_migration_001.py`) diarsipkan untuk dokumentasi historis perkuliahan.

## Sistem Migrasi Resmi
Mulai dari Modul M01 (Fondasi Data & Infrastruktur), sistem migrasi database CampusFolio dikelola sepenuhnya menggunakan **Alembic** yang berlokasi di:
`src/backend/alembic/`

Seluruh revisi skema baru wajib dibuat melalui perintah Alembic:
```bash
python -m alembic revision -m "nama_migrasi"
python -m alembic upgrade head
```
