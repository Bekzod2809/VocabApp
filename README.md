# VocabApp

So'z yodlash uchun offline ishlaydigan flashcards ilovasi: so'zlar guruhlarga bo'lingan, telefonda saqlanadi va server bilan sinxronlanadi.

- **backend/** — ASP.NET Core (.NET 10) + PostgreSQL
- **frontend/** — React + Vite (PWA, Capacitor orqali `.apk`) — *tez orada*

## Backend'ni ishga tushirish

1. `backend/VocabApp.Api/appsettings.Development.example.json` faylidan nusxa olib, `appsettings.Development.json` deb nomlang.
2. Unda PostgreSQL parolini va `Jwt:SecurityKey` (kamida 32 belgi) ni yozing.
3. Ishga tushiring (baza va jadvallar avtomatik yaratiladi):

```bash
cd backend/VocabApp.Api
dotnet run
```

Swagger: http://localhost:5080/swagger

## API

| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/auth/setup-status` | Foydalanuvchi yaratilganmi |
| POST | `/api/auth/setup` | Yagona foydalanuvchini bir marta yaratish |
| POST | `/api/auth/login` | JWT token olish |
| POST | `/api/sync` | O'zgarishlarni yuborish va serverdagi yangilarini olish (token kerak) |
| GET | `/health` | Baza holati |
