# Mukham mobile app

React Native (Expo) app for Mukham employees: sign in with password and a
live face check, check in and out at the office, see attendance and tasks.
Admin features follow in version 1.1.

It talks to the FastAPI backend (`../mukham_fastAPI`, `/api/v1`). API
conventions (error codes, sessions, versioning) are in that repo's README.

## Status

Phase 0 (setup). The Expo project is created in Phase 1.

## Decisions (Phase 0)

| Decision | Choice |
| --- | --- |
| Toolkit | Expo, with development builds (native code allowed) |
| Live-person check | At sign-in and at every check-in |
| Offline check-in | Not allowed in version 1 |
| Languages | English at launch; all text in language files so Hindi can follow |
| Oldest phones | Android 10 and iOS 16 or newer |

## Sibling repositories

| Folder | What it is |
| --- | --- |
| `mukham_fastAPI` | Backend API (FastAPI, PostgreSQL, Alembic) |
| `mukham_frontend` | Web app (Next.js) |
| `mukham_mobile` | This app |
