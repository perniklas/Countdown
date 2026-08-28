# Moment

Moment is a focused countdown app built with React, TypeScript, and Firebase. Sign in with Google, save private countdowns across devices, and give each event its own atmosphere.

## Features

- One cinematic countdown at the center of the experience.
- Private Google-authenticated Firestore storage.
- Upcoming and historical countdown library.
- Aurora, Event Horizon, Hyperdrive, and Paper Riot themes.
- Persisted Aurora background mood slider.
- Reduced-motion-aware confetti when the selected timer reaches zero.
- Responsive drawer, editor, and timer layout.

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and add the Firebase web app values:

   ```text
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=countdown-57acd.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=countdown-57acd
   VITE_FIREBASE_STORAGE_BUCKET=countdown-57acd.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

3. In Firebase Authentication, enable Google as a sign-in provider and add the local or hosted domain to Authorized domains.

4. Publish the included owner-scoped Firestore rules before using the app against the live project:

   ```sh
   firebase deploy --only firestore:rules
   ```

5. Start the app:

   ```sh
   npm run dev
   ```

This workspace already has a locally ignored `.env` populated from the existing `countdown-57acd` Firebase web app. The committed example remains safe to share.

## Commands

```sh
npm run test:run
npm run typecheck
npm run lint
npm run build
```

The production build is written to `dist`, matching the existing Firebase Hosting configuration. To publish the web app after building:

```sh
firebase deploy --only hosting
```

## Countdown lifecycle

When the selected countdown reaches zero, it stays visible at `00` and celebrates once for the current page session. Expired active countdowns move to History only on the next app load, as designed.

## Data model

Countdowns live at `users/{uid}/countdowns/{countdownId}`. Firestore rules require the authenticated user id to match the path and validate every stored field.
