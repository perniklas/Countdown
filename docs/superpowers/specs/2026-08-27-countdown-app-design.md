# Countdown App Design

## Summary

Build a single-page React and TypeScript countdown application on the existing Firebase project. The experience centers one saved countdown at a time, with a compact library for upcoming and historical countdowns. Google authentication keeps each user's data private and synchronized through Firestore.

The defining product feature is its presentation: one polished everyday theme and three deliberately dramatic themes. Each countdown remembers its selected theme and theme-specific settings. When the selected countdown reaches zero, it freezes at zero and launches confetti once. Expired countdowns move to history only the next time the application loads.

## Goals

- Make the selected countdown the visual focus of the page.
- Support creating, editing, selecting, deleting, and saving multiple countdowns.
- Authenticate with Google and synchronize private countdowns through Firestore.
- Provide four meaningfully different themes, not simple palette swaps.
- Provide an interactive gradient mood slider in the normal theme.
- Celebrate the selected countdown reaching zero with confetti.
- Behave well on desktop and mobile and respect accessibility preferences.

## Non-goals

- Public countdown sharing or collaboration.
- Recurring countdowns, notifications, alarms, or audio.
- Offline write queues beyond Firebase's normal client behavior.
- A separate backend service.
- Deployment as part of this implementation; the existing Firebase Hosting target remains ready for `dist`.

## User Experience

### Signed-out state

The signed-out route is a focused branded welcome with a single Google sign-in action. It previews the visual personality of the product without exposing countdown data.

### Main countdown

After authentication, the selected countdown fills the main surface. It shows the event title, localized target date and time, and four large time units: days, hours, minutes, and seconds. The countdown uses the browser's local timezone for input and display while storing an absolute UTC timestamp in Firestore.

On initial load, the app selects the nearest upcoming countdown. Creating a countdown selects it immediately. If no active countdown exists, the hero becomes a purposeful empty state with a create action.

### Library and history

A compact drawer or sheet contains two views:

- Upcoming: active countdowns ordered by target time.
- History: archived countdowns ordered by target time, newest first.

The library supports selecting, editing, and deleting an item without turning the primary screen into a dashboard grid. On mobile it behaves as a bottom sheet; on wider screens it may use a side panel.

### Countdown editor

The editor is a modal with title, local date, local time, and theme selection. A valid target time is required and the title is limited to 80 characters. Theme-specific controls appear only when relevant; Aurora includes its gradient mood slider. Editing a countdown preserves its identity and creation timestamp.

### Reaching zero and reload behavior

The timer calculation clamps all units to zero rather than becoming negative. When the currently selected countdown crosses from a positive remaining duration to zero during the session:

1. the hero freezes at `00` for every unit;
2. confetti launches once for that countdown in that browser session; and
3. the Firestore record remains active while the page stays open.

At application startup, after the first user snapshot arrives, every active countdown whose target is at or before the current time is moved to history in a batched Firestore update. This migration runs once per application mount. It does not run on every timer tick or later snapshot, which preserves the required stay-at-zero-until-reload behavior.

Switching to a countdown that already reached zero during the current session shows zero without repeatedly launching confetti.

## Theme System

Every countdown stores a theme identifier and theme settings. A theme controls CSS variables, typography, component treatments, decorative layers, and motion. The content structure and accessible semantics remain consistent across themes.

### Aurora

The everyday theme uses soft glass surfaces, crisp typography, generous spacing, and an animated gradient field. A 0–100 Mood slider interpolates hue, saturation, gradient stops, and subtly the gradient angle across sunrise, ocean, and violet moods. The slider updates the preview immediately and is stored with the countdown.

### Event Horizon

A deep-space theme with near-black depth, sparse stars, orbital rings, a restrained luminous accent, and monumental condensed timer typography. Decorative rings move slowly around the countdown without obstructing interaction.

### Hyperdrive

A high-energy cyan and magenta theme with segmented digits, a perspective grid, glow, chromatic accents, and subtle scanlines. Motion remains lightweight CSS animation and avoids reducing text contrast.

### Paper Riot

A playful editorial-maximalist theme with bold color blocking, irregular paper-like CSS shapes, oversized type, sticker treatments, thick outlines, and offset shadows. It replaces glass effects with tactile flat surfaces.

All theme animation is disabled or greatly reduced under `prefers-reduced-motion`. No theme relies on decorative imagery for meaning.

## Architecture

Use Vite, React, and TypeScript as a client-only single-page app. Styling uses ordinary CSS organized around theme classes and variables. Firebase's modular browser SDK supplies Google Authentication and Firestore. Confetti uses the lightweight `canvas-confetti` package through a small celebration adapter.

The code is divided into focused boundaries:

- Authentication shell: observes Firebase auth state and owns sign-in/sign-out actions.
- Countdown repository: converts Firestore documents, subscribes to user data, and exposes create/update/delete/archive operations.
- Countdown clock: pure time-difference calculation plus a hook that schedules UI updates.
- Expiry migration: runs once against the initial authenticated snapshot and batches archival writes.
- Hero countdown: renders the selected record and triggers the one-time celebration transition.
- Library/history: sorts and presents saved records and owns selection controls.
- Editor: validates form values and maps local date/time into a timestamp.
- Theme system: maps persisted theme settings to root classes and CSS custom properties.

Firebase implementation details remain behind the repository interface so UI tests do not require a live Firebase project.

## Data Model

Countdown records live at:

`users/{uid}/countdowns/{countdownId}`

Each document contains:

- `title`: string, 1–80 trimmed characters.
- `targetAt`: Firestore Timestamp.
- `status`: `active` or `history`.
- `theme`: `aurora`, `event-horizon`, `hyperdrive`, or `paper-riot`.
- `themeSettings`: an object containing `gradientMood` from 0 to 100; ignored by themes that do not use it.
- `createdAt`: server timestamp.
- `updatedAt`: server timestamp.

The user id is represented by the document path and is not duplicated as trusted record data. The client subscribes to the small user-owned collection, then partitions and sorts records locally. This avoids unnecessary composite indexes for the initial product.

## Security

Firestore rules allow access to a countdown only when the authenticated user id matches the `{uid}` path segment. Creates and updates validate the required field set, allowed status and theme values, title length, timestamp type, numeric gradient range, and immutable `createdAt` after creation. No authenticated user can read or write another user's records.

Firebase browser configuration is read from `VITE_FIREBASE_*` environment variables. A committed `.env.example` documents the required non-secret public configuration, while `.env` remains ignored.

## State and Synchronization

The Firebase auth observer determines whether the signed-out or authenticated application is rendered. Once authenticated, a Firestore listener supplies the user's countdown collection. Local component state holds the selected id, editor state, open panels, and the per-session set of celebrated countdown ids.

Writes use clear pending states. Firestore snapshots remain the source of truth after a write completes. The selected countdown continues ticking from its last received timestamp if a subscription error occurs.

## Error Handling

- Authentication cancellation returns to the welcome state without an alarming error.
- Authentication and data failures show concise, actionable inline messages or toasts.
- Failed create, edit, delete, or archive actions leave the UI usable and offer retry where practical.
- Invalid or incomplete Firestore documents are skipped and reported to the console instead of crashing the whole application.
- The editor prevents invalid dates and empty titles before attempting a write.
- Confetti is decorative; failure to load or execute it never affects the countdown.

## Accessibility and Responsive Behavior

- All controls have visible labels or accessible names and usable focus styles.
- Dialog and drawer focus is managed and keyboard accessible.
- Timer updates do not use an aggressive live region that announces every second.
- Text and controls maintain sufficient contrast in every theme.
- Touch targets are at least 44 pixels where practical.
- The layout adapts from a side library on desktop to a sheet on mobile.
- Reduced-motion preferences remove nonessential animation and confetti.

## Testing and Verification

Implementation follows test-driven development for behavior-bearing code. Automated tests cover:

- duration calculation, clamping, and unit breakdown;
- crossing zero and celebrating once;
- startup-only expiry migration;
- active/history partitioning and ordering;
- local date/time conversion and editor validation;
- theme setting normalization and CSS variable mapping;
- authentication and repository-driven UI states with Firebase mocked.

Final verification includes the full test suite, TypeScript checking, linting, and a production build. The generated build must continue to target the existing Firebase Hosting `dist` directory.
