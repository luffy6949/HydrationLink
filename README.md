# HydrationLink

A real-time hydration reminder system between two hardcoded users (Sender/"Prince"
and Receiver), triggered from an Android home-screen widget. See the original PRD
for full feature scope.

## Status of this build

| Layer | Status |
|---|---|
| Backend (Node/Express/Mongoose/Socket.io/FCM) | ✅ Complete, dependency-installed, type-checked clean in this conversation |
| React Native frontend (role claim, socket client, Notifee, Reanimated/Skia VFX, offline outbox) | ⏳ Next deliverable |
| Native Android (Kotlin + Jetpack Glance widget, Manifest) | ⏳ Next deliverable |

## A note on where this was built

This was generated inside Claude's hosted chat sandbox (a Linux container), **not**
on your local Windows machine -- there is no way for me to see or write to your
actual `D:` drive from this chat. So:

1. Download the zip and extract it to `D:\HydrationLink` yourself.
2. Everything below (`npm install`, running the server, etc.) you'll run locally
   on your own machine, where you do have Android Studio / the Android SDK / a
   `D:` drive / a real network connection to Firebase and MongoDB.

If you want an agent that *can* directly touch your local filesystem and run
the Android Gradle build itself end-to-end, that's what **Claude Code** (desktop
app) is for -- worth switching to once you're ready for the native Android phase,
since this chat's sandbox has no Android SDK, no emulator, and no network path to
Google's Maven repos or Firebase.

## Backend setup

```bash
cd D:\HydrationLink\backend
npm install
copy .env.example .env
```

### MongoDB setup (important!)

The widget-tap throttle (20-minute cooldown) is implemented with a MongoDB
**transaction**, which requires Mongo to run as a replica set -- even a single
local node. A plain standalone `mongod` will throw on `session.withTransaction()`.

One-time local setup:

```bash
mongod --replSet rs0 --dbpath "C:\data\db"
# in another terminal:
mongosh --eval "rs.initiate()"
```

Then make sure `MONGO_URI` in `.env` includes `?replicaSet=rs0` (already set in
`.env.example`). If you'd rather use MongoDB Atlas, any Atlas cluster is already
a replica set, so no extra setup is needed there -- just paste your Atlas
connection string into `MONGO_URI`.

### Firebase setup

1. Create a Firebase project (or use an existing one).
2. Project Settings -> Service Accounts -> Generate new private key -> save the
   JSON as `backend/firebase-service-account.json`.
3. Leave `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json` in `.env`
   (or paste the JSON inline into `FIREBASE_SERVICE_ACCOUNT_JSON` instead).
4. You'll also need this project's `google-services.json` later for the Android
   app itself (next deliverable).

Without Firebase configured, the server still runs fine -- it just logs a warning
and skips push sends (foreground/Socket.io delivery still works).

### Run it

```bash
npm run dev      # starts the server with ts-node-dev (auto-reload)
```

On startup it connects to Mongo and seeds exactly two users if they don't already
exist: Sender "Prince" and "Receiver", paired together.

## API reference

All authenticated routes expect `Authorization: Bearer <deviceToken>`, where
`deviceToken` is returned once from `/api/users/claim`.

| Method & Path | Role | Body / Headers | Purpose |
|---|---|---|---|
| `POST /api/users/claim` | none | `{ role: "SENDER" \| "RECEIVER" }` | First-launch role claim. Returns `deviceToken` -- store it in Keychain. Fails with 409 if that role is already claimed. |
| `GET /api/users/me` | any | — | Returns this device's user doc (role, throttle/snooze state). |
| `POST /api/users/me/fcm-token` | any | `{ fcmToken }` | Registers/refreshes this device's FCM token. |
| `POST /api/widget/tap` | SENDER | — | Called by the Glance widget. Enforces the 20-min throttle; on success, alerts the Receiver via socket (foreground) or FCM (background/killed). Returns `{ widgetState: "SENT" \| "THROTTLED", retryAt? }`. |
| `POST /api/actions/respond` | RECEIVER | Header `Idempotency-Key`, body `{ action: "DRANK" \| "SNOOZE" }` | "I Drank It!" / "Snooze (30m)" buttons. Logs the action, updates snooze state, and pings the Sender (socket VFX trigger + FCM data message so the widget can refresh even if the Sender's app is closed). |
| `GET /healthz` | none | — | Liveness check. |

Socket.io clients authenticate via `io(url, { auth: { deviceToken } })`. Events:
`newAlert` (Receiver gets a hydration ping), `drinkAcknowledged` / `snoozed`
(Sender gets the response, used to trigger the VFX pingback).

## Design decisions worth knowing about (filled gaps not fully spelled out in the PRD)

- **Snooze persistence**: snoozes are stored on the user doc and re-checked by a
  30-second poller (`src/jobs/snoozeChecker.ts`), not an in-memory timer -- so a
  pending snooze survives a server restart.
- **Widget state after the fact**: the Glance widget can't hold a live socket
  connection, so on top of the Socket.io VFX pingback to an open Sender app, the
  Receiver's response also always sends an FCM data message to the Sender's
  device specifically so the native widget's background receiver can refresh its
  own state (Idle/Sent/Snoozed/Acknowledged) even when the app is closed.
- **Idempotency**: enforced via an `Idempotency-Key` header + a TTL'd
  `IdempotencyRecord` collection that replays the original response on retry --
  this is what makes the Receiver's offline outbox safe to resend.

## Next steps

Reply in the chat and I'll continue with the React Native frontend (role
claiming UI, Socket.io client with reconnection, Notifee headless handlers,
Reanimated/Skia VFX, offline outbox) and then the native Android Kotlin +
Jetpack Glance widget + Manifest changes.
