# VocabApp

An offline-first flashcard app for learning vocabulary. Words are organized into groups (for example, *Animals*) and stored on your device. Press **Sync** to synchronize your data with the server.

**Website:** [vocab.bekzodxasanov.uz](https://vocab.bekzodxasanov.uz)

```
backend/    ASP.NET Core (.NET 10) + PostgreSQL — authentication and sync API
frontend/   React + Vite + Dexie (IndexedDB) — website (PWA) and Android app via Capacitor
app/        Ready-to-install APK
```

## How it works

- All changes (groups, words, and review results) are saved to your device first. The app works fully offline.
- Press **Sync** to upload new changes from your device and download changes from the server.
- Each server-side change receives a version number. The device requests only versions it does not already have.
- If the same record is changed in two places, the most recently updated version is kept.
- Reviews use the Leitner system (boxes 1–5). Choose **I know it** to move a word to the next box so it appears less often, or **I don't know it** to move it back to box 1.
- **Sign in / Sign up:** each user creates an account. Groups, words, and review results belong only to that account; the API does not allow access to another user's data.
- Your account stays on this device, so you do not need to enter your password again when reopening the website or app. Downloaded words remain available offline. After you sign out, an internet connection is required to sign in again.
- A separate local database is used for each server and account. Switching accounts keeps words and sync versions separate. Passwords are not stored on the device.
- During migration, words on the old server are assigned to the previous single account. Old local words are also transferred, on the first successful sign-in, only to the owner of the old token; the original database is preserved.

## Backend

1. Copy `backend/VocabApp.Api/appsettings.Development.example.json` and name the copy `appsettings.Development.json`.
2. Set the PostgreSQL password and `Jwt:SecurityKey` (at least 32 characters).
3. Start the API. The database and tables are created automatically:

```bash
cd backend/VocabApp.Api
dotnet run
```

Swagger UI: http://localhost:5080/swagger. To allow a phone on the same Wi-Fi network to connect, run `dotnet run --launch-profile lan`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/setup-status` | Check whether a user has been created |
| POST | `/api/auth/register` | Create a user (the username must be available) |
| POST | `/api/auth/setup` | Same as register; retained for older app versions |
| POST | `/api/auth/login` | Obtain a JWT token |
| POST | `/api/sync` | Upload changes and download newer server changes (token required) |
| GET | `/health` | Check database status |

To test synchronization, use `backend/scripts/sync-test.ps1` (only with an empty test database; read the comments in the script first).

To test account isolation and migration from the old database, run `dotnet run --project backend/VocabApp.IntegrationTests`. It creates a new, randomly named test database in your local PostgreSQL instance and deletes only that database when finished. The connection is read from `VOCABAPP_TEST_CONNECTION` or the local `appsettings.Development.json`. Frontend account and session tests: `cd frontend && npm test`.

Adding words to the server from a file also requires the account username: `bash deploy/add-words.sh "login" "Food" words/food.txt`.

## Server (Contabo, Docker)

The website is available at **[https://vocab.bekzodxasanov.uz](https://vocab.bekzodxasanov.uz)**. The API is served from the same domain under `/api/`. nginx handles HTTPS (Certbot), serves website files from `/opt/vocabapp/www`, and proxies `/api/` to `127.0.0.1:5090`, which routes to Docker (`vocabapp` Compose: API + PostgreSQL). Older APKs can also use `https://vocab.169-58-150-96.sslip.io` (API only). Other projects on the server are unaffected; this app's files are under `/opt/vocabapp`.

To deploy a new version from your laptop using Git Bash (backend and website; the website is built on the server):

```bash
bash deploy/push-to-server.sh
```

For first-time installation, nginx configuration, and backups, see the comments at the top of the files in `deploy/`. The database is backed up daily at 03:40 to `/opt/vocabapp/backups`; backups are kept for 14 days.

## Frontend (website)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. To access it from a phone on the same Wi-Fi network, use `http://<laptop-ip>:5173`.

## Android APK

Requirements: Android SDK and JDK 21 (included with Android Studio).

```bash
cd frontend
npm run build:android
cd android
gradlew assembleDebug
```

The APK is generated at `frontend/android/app/build/outputs/apk/debug/app-debug.apk`. The default server URL in the APK is configured in `frontend/.env.android`; you can also change it in the app's **Settings** section.
