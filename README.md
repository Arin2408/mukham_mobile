# Mukham mobile app

React Native (Expo) app for Mukham, a workforce and attendance system.
Employees sign in with a password and a live face check, check in at the
office (GPS plus a live face check every time), check out with a live face
check, and see their attendance, tasks and ID card. While they are checked
in, the app notes when they leave the office area and come back. Admins see
the dashboard and every employee's attendance (with time spent outside the
office), manage employees, the org chart, tasks and the organisation setup,
and can check someone in or out by hand.

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
| 6 | Admin: employees, org chart, tasks | Done |
| 7 | Admin: organisation setup (departments, shifts, office map) | Done |
| 8 | Notifications | Done |
| 9 | Beta (preview APK) and store release | Beta testing |
| — | Face check at check-out; office-area tracking while checked in | Done |
| — | One phone per employee | Built, on hold (backend `PHONE_LOCK_ENABLED`) |

iPhone builds follow once the Apple developer account exists.

## Install the app on a phone

For employees and admins, no laptop needed (Android 10 or newer):

1. Open the install link from the latest build on the phone. Find it at
   expo.dev › `arin24s-team` › `mukham` › Builds (the newest `preview`
   build), or in the output of the build command below.
2. Tap **Install** / download the APK, then open it.
3. If Android asks, allow **Install unknown apps** for the browser, go
   back, and tap **Install**.
4. Open **Mukham**. Employees sign in with their mobile number, the
   password from their admin, and a face check; admins with their mobile
   number and password.
5. Allow **camera** (face check), **location** (check-in) and
   **notifications**. After the first check-in, set location to
   **Allow all the time** when asked, for office-area tracking.

To update, install the new APK over the old one: no need to uninstall,
and you stay signed in.

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

### Test build (APK)

To share the app without a laptop, build an installable APK on Expo's
servers (EAS). It talks to the live backend on Render:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Open the link EAS prints on the phone and install. Every phone needs the
new APK after app code changes; backend and website changes reach the app
without one.

## Office-area tracking

After check-in the app watches the office area with Android geofencing
(`src/features/presence/`) and tells the backend each time the phone
leaves or comes back; leaving also shows a "You left the office area"
notification. It needs location set to "Allow all the time", which the
check-in success screen asks for. Moves made while there is no signal are
queued on the phone and sent later. Android doesn't wake an app that was
swiped away, so each time the app opens it also compares the phone's last
known position with the office. Tracking stops at check-out and sign-out.

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
| `src/features/` | One folder per area: the AWS live face check, location, office-area tracking (`presence/`), notifications, people, setup, tasks, dashboard and more |
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
| Live-person check | At sign-in, every check-in and every check-out |
| Fake-GPS apps | Check-in is refused |
| Leaving the office | Recorded while checked in and shown to the admin; the employee gets a notification |
| One phone per employee | Built but switched off for now |
| Offline check-in | Not allowed in version 1 |
| Languages | English at launch; all text in language files so Hindi can follow |
| Oldest phones | Android 10 and iOS 16 or newer |
| Platforms | Android first; iPhone once the Apple account exists |

## Hosting

| What | Where |
| --- | --- |
| App builds | Expo EAS (account `arin24s-team`, package `com.mukham.app`), shared as an APK; not on the Play Store yet |
| Backend it talks to | https://mukham-fastapi.onrender.com/api/v1 (set in `eas.json`, `preview` profile) |
| ID card QR links | https://mukham1-frontend.vercel.app |
| Push notifications | Expo Push |

## Sibling repositories

| Folder | What it is |
| --- | --- |
| `mukham_fastAPI` | Backend API (FastAPI, PostgreSQL, Alembic) |
| `mukham_frontend` | Web app (Next.js) |
| `mukham_mobile` | This app |
