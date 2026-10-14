# Mukham mobile app

React Native (Expo) app for Mukham, a workforce and attendance system.
Employees sign in with a password and a live face check, check in at the
office (GPS plus a live face check every time), and see their attendance,
tasks and ID card. Admins see the dashboard and every employee's
attendance, and can check someone in or out by hand.

Version 1 brings every web app feature to the phone. It talks to the
FastAPI backend (`../mukham_fastAPI`, `/api/v1`); API conventions (error
codes, sessions, versioning) are in that repo's README.

## Status

| Phase | What | State |
| --- | --- | --- |
| 1 | Foundation: navigation, server connection, theme, update check | Done |
| 2 | Sign-in for employees (face check) and admins, registration, password reset | Done (Android) |
| 3 | Check-in and check-out with GPS and the live face check | Done (Android) |
| 4 | Employee history, tasks, profile and ID card | Done |
| 5 | Admin dashboard and attendance console | Done |
| 6 | Admin: employees, org chart, tasks | Next |
| 7 | Admin: organisation setup (departments, shifts, office map) | |
| 8 | Notifications | |
| 9 | Beta and store release | |

iPhone builds follow once the Apple developer account exists.

## Run it

You need Node 20 and the backend running on this laptop
(`python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002` in
`mukham_fastAPI/fastapi_backend`).

```bash
npm install
npx expo start
```

The app finds the backend by itself: it uses the laptop's address from the
dev server, on port 8002 (on an Android emulator, `10.0.2.2:8002`). Phone
and laptop must be on the same Wi-Fi. If the phone shows "Can't reach the
server", check the Wi-Fi and that macOS's firewall allows Python.

To point the app at another server, copy `.env.example` to `.env` and set
`EXPO_PUBLIC_API_URL` (and `EXPO_PUBLIC_WEB_URL`, which the ID card's QR
code links to).

### Development build

The app uses native code that Expo Go doesn't include (AWS Face Liveness),
so run it in its own **development build**: the Mukham app with Expo's
launcher built in.

**Build it** (once, and again only when a native library is added or
`app.json` changes). Needs the Android SDK and Java 17+:

```bash
npx expo prebuild --platform android   # creates android/ (not committed)
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

**Install it on your phone**, either way:

- USB: turn on USB debugging, connect the phone, then
  `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
- File: copy `app-debug.apk` to the phone and open it (allow installing
  from this source when Android asks).

**Every day:** run `npx expo start`, open the **Mukham** app on the phone,
and scan the QR code or pick the server from the launcher's list. Code
changes then appear on the phone straight away.

**If the build fails downloading tools:** Java on some Macs can't reach
some download hosts. Building with
`JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"` helps; otherwise
download the file with curl, check its checksum, and put Gradle zips in
`~/.gradle/wrapper/dists/gradle-<version>-bin/<hash>/` and SDK packages in
`~/Library/Android/sdk/<type>/<version>`.

## Checks

```bash
npx tsc --noEmit   # types
npx expo lint      # lint
npx jest           # tests
npm run check:compiler   # code the React Compiler could turn into a crash
```

The same checks run on GitHub for every push and pull request
(`.github/workflows/ci.yml`).

## Layout

| Path | What it holds |
| --- | --- |
| `src/app/` | Screens (Expo Router). `(auth)/` is sign-in, registration and the face step; `(employee)/` is the employee's tabs plus check-in, a task and the ID card; `(admin)/` is the admin's tabs plus one employee's attendance |
| `src/api/` | Server connection: base URL, tokens in secure storage, renewal, errors, and one file per area |
| `src/components/` | Shared pieces: screen and list frames, buttons, fields, charts, QR code, loading/empty/offline states |
| `src/features/` | The AWS live face check, location, and task pieces |
| `src/hooks/` | Server data hooks (app config, server status) |
| `src/store/` | Who is signed in, and the employee sign-in in progress |
| `src/lib/` | Formatting, dates, device ID, version checks |
| `src/i18n/` | All on-screen text (`en.json`); add `hi.json` for Hindi |
| `src/theme/` | Colours, fonts and spacing, matching the web app's dark theme |
| `plugins/` | Config plugins that adjust the generated Android project |

## Decisions

| Decision | Choice |
| --- | --- |
| Toolkit | Expo, with development builds (native code allowed) |
| Live-person check | At sign-in and at every check-in |
| Fake-GPS apps | Check-in is flagged for the admin, not refused |
| Offline check-in | Not allowed in version 1 |
| Languages | English at launch; all text in language files so Hindi can follow |
| Oldest phones | Android 10 and iOS 16 or newer |
| Platforms | Android first; iPhone once the Apple account exists |

## Sibling repositories

| Folder | What it is |
| --- | --- |
| `mukham_fastAPI` | Backend API (FastAPI, PostgreSQL, Alembic) |
| `mukham_frontend` | Web app (Next.js) |
| `mukham_mobile` | This app |
