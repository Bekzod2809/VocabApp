# VocabApp

So'z yodlash uchun offline ishlaydigan flashcards ilovasi. So'zlar guruhlarga bo'lingan (masalan, *Animals*), telefonning o'zida saqlanadi va "Sinx" tugmasi bosilganda server bilan bir xil holatga keltiriladi.

```
backend/    ASP.NET Core (.NET 10) + PostgreSQL — auth va sinx API
frontend/   React + Vite + Dexie (IndexedDB) — sayt (PWA) va Capacitor orqali Android ilova
app/        Tayyor APK (telefonga o'rnatish uchun)
```

## Qanday ishlaydi

- Hamma o'zgarish (guruh, so'z, yodlash natijasi) avval telefonga yoziladi — ilova internetsiz to'liq ishlaydi.
- **Sinx** tugmasi: telefondagi yangi o'zgarishlar serverga ketadi, serverdagi yangilari telefonga keladi.
- Har bir o'zgarish server versiya raqamini oladi; telefon faqat o'zida yo'q versiyalarni so'raydi.
- Bitta yozuv ikki joyda o'zgargan bo'lsa, **oxirgi o'zgartirilgani** saqlanadi.
- Yodlash: Leitner tizimi (1–5 quti). "Bilaman" — keyingi quti va kamroq chiqadi, "Bilmayman" — 1-qutiga qaytadi.

## Backend

1. `backend/VocabApp.Api/appsettings.Development.example.json` dan nusxa olib, `appsettings.Development.json` deb nomlang.
2. Unda PostgreSQL parolini va `Jwt:SecurityKey` (kamida 32 belgi) ni yozing.
3. Ishga tushiring (baza va jadvallar avtomatik yaratiladi):

```bash
cd backend/VocabApp.Api
dotnet run
```

Swagger: http://localhost:5080/swagger. Telefon Wi-Fi orqali ulanishi uchun: `dotnet run --launch-profile lan`.

| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/auth/setup-status` | Foydalanuvchi yaratilganmi |
| POST | `/api/auth/setup` | Yagona foydalanuvchini bir marta yaratish |
| POST | `/api/auth/login` | JWT token olish |
| POST | `/api/sync` | O'zgarishlarni yuborish va serverdagi yangilarini olish (token kerak) |
| GET | `/health` | Baza holati |

Sinx sinovi: `backend/scripts/sync-test.ps1` (faqat bo'sh test bazasida — ichidagi izohni o'qing).

## Server (Contabo, Docker)

API: **https://vocab.169-58-150-96.sslip.io** — nginx (HTTPS, certbot) → `127.0.0.1:5090` → Docker (`vocabapp` compose: api + postgres). Serverdagi boshqa loyihalarga tegmaydi: hammasi `/opt/vocabapp` da.

Yangi versiyani yuborish (laptopda, Git Bash):

```bash
bash deploy/push-to-server.sh
```

Birinchi o'rnatish tartibi, nginx va backup — `deploy/` papkasidagi fayllar boshidagi izohlarda. Baza har kuni 03:40 da `/opt/vocabapp/backups` ga zaxiralanadi (14 kun saqlanadi).

## Frontend (sayt)

```bash
cd frontend
npm install
npm run dev
```

http://localhost:5173 — telefondan ham shu Wi-Fi'da `http://<laptop-ip>:5173` orqali ochsa bo'ladi.

## Android APK

Kerak: Android SDK va JDK 21 (Android Studio bilan birga keladi).

```bash
cd frontend
npm run build:android
cd android
gradlew assembleDebug
```

Tayyor fayl: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`. APK'dagi standart server manzili `frontend/.env.android` da (ilovaning Sozlamalar bo'limida o'zgartirsa ham bo'ladi).
