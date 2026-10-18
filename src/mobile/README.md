# CampusFolio Mobile App (Expo / React Native)

Aplikasi klien mobile untuk **CampusFolio** dibangun menggunakan framework **Expo (React Native)** untuk pengalaman native smartphone dengan kemudahan pengujian instan via **Expo Go**.

---

## 🎨 Strategi Pengembangan: *Expo Go Instant Demo*
1. **Pengujian Tanpa Build APK:**
   - Dosen dan mahasiswa cukup menginstal aplikasi **Expo Go** dari Google Play Store atau Apple App Store.
   - Jalankan `npx expo start`, lalu scan QR code yang muncul di terminal untuk membuka aplikasi langsung di smartphone!
2. **Kompilasi Standalone APK (Tahap Rilis):**
   - Menggunakan EAS Build (`npx eas build -p android --profile preview`) jika dosen memerlukan file `.apk` mandiri.

---

## 🚀 Panduan Menjalankan Mobile App

### 1. Inisialisasi Proyek Expo (Pertama Kali):
```bash
cd src/mobile
npx create-expo-app@latest . --template blank-typescript
```

### 2. Menjalankan Server Pengembangan Expo:
```bash
npx expo start
```
- Tekan `a` untuk membuka Android Emulator.
- Atau scan QR code menggunakan kamera ponsel / aplikasi **Expo Go**.

---

## 📦 Rekomendasi Library Penting
```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
npx expo install axios @tanstack/react-query expo-secure-store lucide-react-native
```

---

## 🌐 Koneksi ke Backend FastAPI
Konfigurasikan URL API pada file `.env` atau config client:
```typescript
// Ganti dengan IP lokal laptop saat menguji dengan HP fisik di jaringan WiFi yang sama
export const API_BASE_URL = "http://192.168.1.xxx:8000/api/v1"; 
```
