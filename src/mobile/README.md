# CampusFolio Frontend (Flutter Client)

Aplikasi klien frontend untuk **CampusFolio** dibangun menggunakan framework **Flutter (Dart)** dengan strategi **Flutter Web-First** untuk pengujian dan demo instan sebelum kompilasi ke Android APK.

---

## 🎨 Strategi Pengembangan: *Flutter Web-First*
1. **Fase 1 (Web App Demo):**
   - Aplikasi dijalankan langsung di browser Google Chrome (`flutter run -d chrome`).
   - Digunakan untuk pengujian oleh 5 responden mahasiswa serta demonstrasi kepada dosen tanpa perlu instalasi file `.apk`.
2. **Fase 2 (Mobile Release):**
   - Kode yang sama persis dikompilasi menjadi paket aplikasi Android (`flutter build apk`).

---

## 🚀 Panduan Menjalankan Frontend

### 1. Inisialisasi Proyek Flutter (Jika baru pertama kali):
```bash
cd src/mobile
flutter create . --org com.campusfolio.team3 --platforms=web,android
```

### 2. Menjalankan di Mode Web (Rekomendasi untuk Sprint 1):
```bash
flutter run -d chrome --web-port=3000
```

### 3. Menjalankan di Mode Mobile Emulator / Device Fisik:
```bash
flutter run
```

### 4. Build APK Android untuk Rilis/Demo Mobile:
```bash
flutter build apk --release
```

---

## 📦 Rekomendasi Package Penting
Tambahkan ke `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.4.1                 # HTTP client dengan interceptor JWT
  flutter_bloc: ^8.1.4        # State Management
  flutter_secure_storage: ^9.0.0 # Penyimpanan aman token login
  google_fonts: ^6.1.0        # Tipografi UI
  cached_network_image: ^3.3.1 # Render gambar portofolio/avatar
```

---

## 🖼️ Referensi Desain UI
Desain antarmuka merujuk pada wireframe dan mockup yang disiapkan oleh Hakim (Hipster) pada file:
[`ui/Model UI.webp`](../../ui/Model%20UI.webp)
