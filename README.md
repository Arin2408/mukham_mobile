# Mukham mobile app

React Native (Expo) app for Mukham employees: sign in with password and a
live face check, check in and out at the office, see attendance and tasks.
Admin features follow in version 1.1.

It talks to the FastAPI backend (`../mukham_fastAPI`, `/api/v1`). API
conventions (error codes, sessions, versioning) are in that repo's README.

## Status

Phase 3 (check-in and check-out). Done: sign-in for both roles (Phase 2),
the employee Home screen, and check-in with GPS and the live face check,
plus check-out. Admin screens are placeholders until Phases 5–7.

## Run it

You need Node 20 and the backend running on this laptop
(`python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002`
in `mukham_fastAPI/fastapi_backend`).

```bash
npm install
npx expo start
```

Then, from the dev server:

| Where | How |
| --- | --- |
| Android phone | Install **Expo Go** from the Play Store. Connect the phone to the same Wi-Fi as the laptop and scan the QR code in Expo Go. |
| Laptop browser (design review) | Press `w`. Opens at http://localhost:8081 |
| Android emulator | Press `a` (Android Studio emulator must exist) |

The app finds the backend by itself: it uses the laptop's address from the
dev server, on port 8002. If the phone shows "Can't reach the server",
check both are on the same Wi-Fi and that macOS's firewall allows Python.

### Development build (needed for the employee face check)

Expo Go can't run AWS Face Liveness, so the employee sign-in needs the
app's own **development build**: the Mukham app with Expo's launcher built
in. Admin screens also work in Expo Go and the browser.

**Build it** (once, and again only when a native library is added or
`app.json` changes). Needs the Android SDK and Java 17+:

```bash
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

**Install it on your phone**, either way:

- USB: turn on USB debugging on the phone, connect it, then
  `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
- File: copy `app-debug.apk` to the phone and open it (allow installing
  from this source when Android asks).

**Every day:** run `npx expo start`, open the **Mukham** app (not Expo
Go) on the phone, and scan the QR code, or pick the server from the
launcher's list. Phone and laptop must be on the same Wi-Fi. Code
changes then appear on the phone straight away, as with Expo Go.

On an Android emulator the app reaches the laptop's backend at
`10.0.2.2:8002` by itself.

**If the build fails downloading tools:** Java on this Mac can't reach
some download hosts (GitHub's release files, and Google's SDK packages
during a build). Download the file with curl and check its checksum:
Gradle zips go in `~/.gradle/wrapper/dists/gradle-<version>-bin/<hash>/`;
SDK packages (NDK, build-tools, platforms) are unzipped into
`~/Library/Android/sdk/<type>/<version>`. Building with
`JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"` also helps.

## Checks

```bash
npx tsc --noEmit   # types
npx expo lint      # lint
npx jest           # unit tests
```

The same three run on GitHub for every push and pull request
(`.github/workflows/ci.yml`).

## Layout

| Path | What it holds |
| --- | --- |
| `src/app/` | Screens. `(auth)/` is sign-in and sign-up; `(tabs)/` is the employee's tabs; `(admin)/` is the admin's tabs |
| `src/api/` | Server connection: base URL, tokens in secure storage, renewal, errors |
| `src/components/` | Shared pieces: screen frame, buttons, text fields, error banner, server status |
| `src/store/` | Who is signed in (session) and the employee sign-in in progress |
| `src/features/face/` | The AWS live face check (needs the development build) |
| `plugins/` | Config plugins that adjust the generated Android project |
| `src/hooks/` | Server data hooks (app config, server status) |
| `src/i18n/` | All on-screen text (`en.json`); add `hi.json` for Hindi |
| `src/theme/` | Colours, fonts and spacing, matching the web app's dark theme |

## Decisions (Phase 0)

| Decision | Choice |
| --- | --- |
| Toolkit | Expo, with development builds (native code allowed) |
| Built by | In-house team |
| Live-person check | At sign-in and at every check-in |
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
