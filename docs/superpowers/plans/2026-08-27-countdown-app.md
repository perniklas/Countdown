# Countdown App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished React and TypeScript countdown app with Google sign-in, private Firestore persistence, four distinctive themes, a gradient mood slider, and reload-only history migration.

**Architecture:** A Vite client app keeps pure countdown, editor, sorting, and theme behavior separate from Firebase adapters. An authenticated app shell subscribes to `users/{uid}/countdowns`, runs one expiry migration from the initial snapshot, and renders one selected countdown plus a compact library. CSS theme classes alter layout treatment, typography, decoration, and motion while shared semantic components preserve accessibility.

**Tech Stack:** React, TypeScript, Vite, Firebase modular SDK, canvas-confetti, Lucide React, Vitest, Testing Library, ESLint, and plain CSS.

**Spec:** `docs/superpowers/specs/2026-08-27-countdown-app-design.md`

## Global Constraints

- Google is the only sign-in provider.
- Countdown records live at `users/{uid}/countdowns/{countdownId}` and are private to that user.
- The center of the experience is one selected countdown; saved items live in a compact library with Upcoming and History views.
- A selected countdown that reaches zero stays active and visible at zero for the rest of the current page session.
- Expired active countdowns move to history only during the next application mount.
- Themes are exactly `aurora`, `event-horizon`, `hyperdrive`, and `paper-riot`.
- Aurora provides a persisted 0–100 gradient mood slider.
- Motion and confetti respect `prefers-reduced-motion`.
- Firebase Hosting continues to publish the Vite `dist` directory.
- Deployment is outside this implementation.

## File Structure

- `package.json`: project scripts and runtime/development dependencies.
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`: Vite, TypeScript, test, and lint configuration.
- `.env.example`: documented Firebase browser configuration keys.
- `src/main.tsx`: React entry point.
- `src/App.tsx`: authentication state and top-level route states.
- `src/app/CountdownApp.tsx`: authenticated selection, editor, library, save, and delete orchestration.
- `src/app/CountdownApp.test.tsx`: end-to-end component behavior against an in-memory repository.
- `src/domain/countdown.ts`: countdown types, time math, partitioning, and ordering.
- `src/domain/countdown.test.ts`: pure countdown behavior tests.
- `src/domain/editor.ts`: form conversion and validation.
- `src/domain/editor.test.ts`: local date/time and validation tests.
- `src/domain/theme.ts`: theme metadata, mood normalization, and Aurora CSS variables.
- `src/domain/theme.test.ts`: theme behavior tests.
- `src/services/countdownRepository.ts`: repository interface shared by UI and Firebase.
- `src/services/firebaseCountdownRepository.ts`: Firestore subscription and mutations.
- `src/services/firebaseCountdownRepository.test.ts`: Firestore document conversion tests.
- `src/firebase.ts`: validated Firebase initialization and Google auth functions.
- `src/hooks/useCountdownClock.ts`: ticking clock and zero-crossing notification.
- `src/hooks/useCountdownClock.test.tsx`: fake-timer transition tests.
- `src/hooks/useCountdowns.ts`: initial snapshot migration and live repository state.
- `src/hooks/useCountdowns.test.tsx`: startup-only archive behavior tests.
- `src/components/AuthScreen.tsx`: Google sign-in welcome.
- `src/components/ConfigurationScreen.tsx`: clear missing-Firebase-configuration guidance.
- `src/components/HeroCountdown.tsx`: centered event and time-unit display.
- `src/components/CountdownLibrary.tsx`: Upcoming/History drawer or sheet.
- `src/components/CountdownEditor.tsx`: create/edit dialog and theme controls.
- `src/components/ThemeBackdrop.tsx`: theme-specific decorative layers.
- `src/components/EmptyState.tsx`: authenticated no-countdown state.
- `src/components/Toast.tsx`: concise operation feedback.
- `src/celebrate.ts`: reduced-motion-aware canvas-confetti adapter.
- `src/styles.css`: responsive layout and all four visual systems.
- `firestore.rules`: strict owner-path and field validation.
- `README.md`: local setup, Firebase environment, test, build, and Hosting notes.

---

### Task 1: Scaffold the App and Countdown Domain

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/domain/countdown.ts`
- Create: `src/domain/countdown.test.ts`

**Interfaces:**
- Produces: `ThemeId`, `CountdownStatus`, `Countdown`, `CountdownInput`, `TimeParts`, `getTimeParts(targetAt, now)`, and `partitionCountdowns(items)`.

- [ ] **Step 1: Create the Vite project configuration and install dependencies**

Define scripts `dev`, `build`, `test`, `test:run`, `lint`, and `typecheck`. Install React, Firebase, canvas-confetti, and Lucide React as runtime dependencies; install Vite, the React plugin, TypeScript, ESLint, types, Vitest, jsdom, and Testing Library as development dependencies. Configure Vitest for jsdom and a `src/test/setup.ts` setup file.

- [ ] **Step 2: Write failing domain tests**

```ts
it('breaks a positive duration into countdown units', () => {
  expect(getTimeParts(100_000_000, 0)).toEqual({
    totalMs: 100_000_000,
    days: 1,
    hours: 3,
    minutes: 46,
    seconds: 40,
    isComplete: false,
  })
})

it('clamps elapsed countdowns to zero', () => {
  expect(getTimeParts(1_000, 1_001)).toMatchObject({
    totalMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: true,
  })
})

it('orders active soonest first and history newest first', () => {
  const result = partitionCountdowns(fixtures)
  expect(result.active.map((item) => item.id)).toEqual(['soon', 'later'])
  expect(result.history.map((item) => item.id)).toEqual(['recent', 'old'])
})
```

- [ ] **Step 3: Run the domain test to verify it fails**

Run: `npm run test:run -- src/domain/countdown.test.ts`

Expected: failure because `src/domain/countdown.ts` and its exports do not exist.

- [ ] **Step 4: Implement the domain types and pure functions**

```ts
export type ThemeId = 'aurora' | 'event-horizon' | 'hyperdrive' | 'paper-riot'
export type CountdownStatus = 'active' | 'history'

export interface Countdown {
  id: string
  title: string
  targetAt: number
  status: CountdownStatus
  theme: ThemeId
  themeSettings: { gradientMood: number }
  createdAt: number
  updatedAt: number
}

export type CountdownInput = Pick<Countdown, 'title' | 'targetAt' | 'theme' | 'themeSettings'>

export function getTimeParts(targetAt: number, now = Date.now()): TimeParts {
  const totalMs = Math.max(0, targetAt - now)
  const totalSeconds = Math.floor(totalMs / 1000)
  return {
    totalMs,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    isComplete: totalMs === 0,
  }
}
```

Implement `partitionCountdowns` with immutable filtered copies and numeric target sorting.

- [ ] **Step 5: Run the domain tests**

Run: `npm run test:run -- src/domain/countdown.test.ts`

Expected: all countdown domain tests pass.

- [ ] **Step 6: Commit the scaffold and domain**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js index.html src/vite-env.d.ts src/test/setup.ts src/domain
git commit -m "feat: scaffold countdown app domain"
```

### Task 2: Add Editor and Theme Domain Behavior

**Files:**
- Create: `src/domain/editor.ts`
- Create: `src/domain/editor.test.ts`
- Create: `src/domain/theme.ts`
- Create: `src/domain/theme.test.ts`

**Interfaces:**
- Consumes: `CountdownInput` and `ThemeId` from `src/domain/countdown.ts`.
- Produces: `CountdownDraft`, `draftToInput(draft, now)`, `countdownToDraft(countdown)`, `THEMES`, `normalizeGradientMood(value)`, and `getAuroraVariables(mood)`.

- [ ] **Step 1: Write failing editor tests**

```ts
it('converts local date and time into an absolute timestamp', () => {
  const result = draftToInput({
    title: 'Launch', date: '2030-04-12', time: '18:30',
    theme: 'aurora', gradientMood: 42,
  }, new Date('2030-04-11T10:00:00').getTime())
  expect(result.ok).toBe(true)
  if (result.ok) expect(result.value.targetAt).toBe(new Date(2030, 3, 12, 18, 30).getTime())
})

it.each([
  [{ title: '', date: '2030-04-12', time: '18:30' }, 'Give your countdown a name.'],
  [{ title: 'Launch', date: '', time: '18:30' }, 'Choose a date and time.'],
])('rejects invalid drafts', (partial, message) => {
  const result = draftToInput({ theme: 'aurora', gradientMood: 50, ...partial } as CountdownDraft, Date.now())
  expect(result).toEqual({ ok: false, message })
})
```

- [ ] **Step 2: Write failing theme tests**

```ts
it('clamps gradient mood to the saved range', () => {
  expect(normalizeGradientMood(-4)).toBe(0)
  expect(normalizeGradientMood(120)).toBe(100)
})

it('returns stable Aurora CSS variables', () => {
  expect(getAuroraVariables(50)).toEqual(expect.objectContaining({
    '--aurora-hue-a': expect.stringMatching(/deg$/),
    '--aurora-angle': expect.stringMatching(/deg$/),
  }))
})
```

- [ ] **Step 3: Run the editor and theme tests to verify they fail**

Run: `npm run test:run -- src/domain/editor.test.ts src/domain/theme.test.ts`

Expected: failures because the domain modules do not exist.

- [ ] **Step 4: Implement editor validation and conversion**

Return a discriminated union `{ ok: true, value: CountdownInput } | { ok: false, message: string }`. Trim titles, reject titles over 80 characters, reject invalid or non-future local date/time values, normalize the mood, and always emit an active-ready `CountdownInput`.

- [ ] **Step 5: Implement theme metadata and Aurora interpolation values**

```ts
export const THEMES = [
  { id: 'aurora', name: 'Aurora', description: 'Soft, calm, luminous' },
  { id: 'event-horizon', name: 'Event Horizon', description: 'Dark, orbital, infinite' },
  { id: 'hyperdrive', name: 'Hyperdrive', description: 'Neon, electric, fast' },
  { id: 'paper-riot', name: 'Paper Riot', description: 'Bold, tactile, playful' },
] as const

export function normalizeGradientMood(value: number): number {
  return Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 50)))
}
```

Use deterministic hue and angle formulas so React can set the returned custom properties on the theme root.

- [ ] **Step 6: Run the editor and theme tests**

Run: `npm run test:run -- src/domain/editor.test.ts src/domain/theme.test.ts`

Expected: all editor and theme tests pass.

- [ ] **Step 7: Commit the form and theme domain**

```bash
git add src/domain/editor.ts src/domain/editor.test.ts src/domain/theme.ts src/domain/theme.test.ts
git commit -m "feat: add countdown editor and theme rules"
```

### Task 3: Build the Firebase Boundary and Security Rules

**Files:**
- Create: `.env.example`
- Create: `src/firebase.ts`
- Create: `src/services/countdownRepository.ts`
- Create: `src/services/firebaseCountdownRepository.ts`
- Create: `src/services/firebaseCountdownRepository.test.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Consumes: `Countdown`, `CountdownInput`, `ThemeId`, and `CountdownStatus`.
- Produces: `firebaseClientState`, `signInWithGoogle(auth)`, `signOutUser(auth)`, `CountdownRepository`, `createFirebaseCountdownRepository(db)`, `countdownFromDocument(id, data)`, and `serializeCountdown(input)`.

- [ ] **Step 1: Write failing Firestore conversion tests**

```ts
it('maps a valid Firestore document into the domain model', () => {
  const result = countdownFromDocument('abc', {
    title: 'Launch', targetAt: timestamp(2_000), status: 'active', theme: 'aurora',
    themeSettings: { gradientMood: 72 }, createdAt: timestamp(1_000), updatedAt: timestamp(1_500),
  })
  expect(result).toMatchObject({ id: 'abc', targetAt: 2_000, themeSettings: { gradientMood: 72 } })
})

it('returns null for malformed remote records', () => {
  expect(countdownFromDocument('bad', { title: '', targetAt: null })).toBeNull()
})
```

The local `timestamp(ms)` fixture exposes a `toMillis(): number` method so the conversion remains unit-testable without Firestore.

- [ ] **Step 2: Run the conversion test to verify it fails**

Run: `npm run test:run -- src/services/firebaseCountdownRepository.test.ts`

Expected: failure because the repository modules do not exist.

- [ ] **Step 3: Define the repository interface**

```ts
export interface CountdownRepository {
  subscribe(
    uid: string,
    onData: (items: Countdown[]) => void,
    onError: (error: Error) => void,
  ): () => void
  create(uid: string, input: CountdownInput): Promise<string>
  update(uid: string, id: string, input: CountdownInput): Promise<void>
  remove(uid: string, id: string): Promise<void>
  archiveExpired(uid: string, ids: string[]): Promise<void>
}
```

- [ ] **Step 4: Implement validated Firebase startup and Google auth**

Read `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`. Export a discriminated `firebaseClientState`: `{ ready: false, missing: string[] }` when keys are absent, or `{ ready: true, auth, db }` after initialization. Never call `initializeApp` when configuration is incomplete. Use `GoogleAuthProvider` and `signInWithPopup` for the ready state.

- [ ] **Step 5: Implement the Firestore repository**

Return the repository from `createFirebaseCountdownRepository(db)`. Subscribe to `collection(db, 'users', uid, 'countdowns')`. Skip invalid conversion results with `console.warn`. Create records with `status: 'active'` and server timestamps. Updates set the supplied fields, `status: 'active'`, and `updatedAt`. Archive ids in one `writeBatch` by setting `status: 'history'` and `updatedAt: serverTimestamp()`. Resolve immediately when the archive list is empty.

- [ ] **Step 6: Replace Firestore rules with owner-scoped validation**

```text
match /users/{userId}/countdowns/{countdownId} {
  allow read, delete: if request.auth != null && request.auth.uid == userId;
  allow create, update: if request.auth != null
    && request.auth.uid == userId
    && validCountdown(request.resource.data);
}
```

`validCountdown` requires only the seven data-model fields, a trimmed 1–80 character title, Timestamp dates, allowed status/theme strings, a theme settings map containing only numeric `gradientMood`, and a value from 0 through 100. Updates also require `createdAt` to equal the existing value.

- [ ] **Step 7: Run the repository tests**

Run: `npm run test:run -- src/services/firebaseCountdownRepository.test.ts`

Expected: all conversion tests pass.

- [ ] **Step 8: Commit the Firebase boundary**

```bash
git add .env.example src/firebase.ts src/services firestore.rules
git commit -m "feat: add private Firebase countdown storage"
```

### Task 4: Implement the Clock and Startup-Only Expiry Migration

**Files:**
- Create: `src/hooks/useCountdownClock.ts`
- Create: `src/hooks/useCountdownClock.test.tsx`
- Create: `src/hooks/useCountdowns.ts`
- Create: `src/hooks/useCountdowns.test.tsx`

**Interfaces:**
- Consumes: `getTimeParts`, `Countdown`, and `CountdownRepository`.
- Produces: `useCountdownClock(targetAt, onReachZero)` and `useCountdowns(uid, repository)` returning `{ items, loading, error, create, update, remove }`.

- [ ] **Step 1: Write failing clock transition tests**

```tsx
it('ticks to zero and calls onReachZero only once', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
  const reached = vi.fn()
  const { result } = renderHook(() => useCountdownClock(Date.now() + 1_000, reached))
  act(() => vi.advanceTimersByTime(2_500))
  expect(result.current.isComplete).toBe(true)
  expect(reached).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Write failing startup migration tests**

Use a fake repository whose `subscribe` captures `onData` and whose `archiveExpired` is a spy. Emit an initial list containing one elapsed active item and one future item, then emit another newly elapsed item.

```tsx
expect(repository.archiveExpired).toHaveBeenCalledTimes(1)
expect(repository.archiveExpired).toHaveBeenCalledWith('user-1', ['elapsed-on-load'])
```

- [ ] **Step 3: Run hook tests to verify they fail**

Run: `npm run test:run -- src/hooks/useCountdownClock.test.tsx src/hooks/useCountdowns.test.tsx`

Expected: failures because the hooks do not exist.

- [ ] **Step 4: Implement the clock hook**

Initialize from `Date.now()`, update on a 250 ms interval for responsive second boundaries, and keep a ref recording whether the hook has observed a positive duration. Reset the transition refs whenever `targetAt` changes. Call `onReachZero` only for the positive-to-complete transition. Clear the interval on unmount.

- [ ] **Step 5: Implement the countdown subscription hook**

Subscribe whenever a uid exists. On the first data callback only, compute active items whose `targetAt <= Date.now()`, call `archiveExpired` once with their ids, and expose the live list. Never repeat the migration for later snapshots in that mount. Wrap mutations to expose useful errors to the caller without swallowing repository failures.

- [ ] **Step 6: Run hook tests**

Run: `npm run test:run -- src/hooks/useCountdownClock.test.tsx src/hooks/useCountdowns.test.tsx`

Expected: all clock and migration tests pass.

- [ ] **Step 7: Commit timer lifecycle behavior**

```bash
git add src/hooks
git commit -m "feat: add countdown clock and reload expiry migration"
```

### Task 5: Build Authentication, Hero, Library, and Editor UI

**Files:**
- Create: `src/test/fakeCountdownRepository.ts`
- Create: `src/components/AuthScreen.tsx`
- Create: `src/components/ConfigurationScreen.tsx`
- Create: `src/components/HeroCountdown.tsx`
- Create: `src/components/CountdownLibrary.tsx`
- Create: `src/components/CountdownEditor.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/Toast.tsx`
- Create: `src/app/CountdownApp.tsx`
- Create: `src/app/CountdownApp.test.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

**Interfaces:**
- Consumes: `firebaseClientState`, Firebase auth functions, `CountdownRepository`, domain functions, and countdown hooks.
- Produces: the functional signed-out and authenticated application experience.

- [ ] **Step 1: Write failing authenticated app tests**

```tsx
it('centers the nearest upcoming countdown and opens the saved library', async () => {
  render(<CountdownApp uid="user-1" repository={repositoryWith([later, sooner])} />)
  expect(await screen.findByRole('heading', { name: sooner.title })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /saved countdowns/i }))
  expect(screen.getByText(later.title)).toBeInTheDocument()
})

it('creates a countdown and selects it', async () => {
  render(<CountdownApp uid="user-1" repository={repositoryWith([])} />)
  await user.click(screen.getByRole('button', { name: /create countdown/i }))
  await user.type(screen.getByLabelText(/countdown name/i), 'Holiday')
  // Fill a deterministic future date and time, submit, and emit the new repository snapshot.
  expect(await screen.findByRole('heading', { name: 'Holiday' })).toBeInTheDocument()
})
```

Add tests for editing, deleting with confirmation, switching Upcoming/History, opening and closing the dialog with Escape, and displaying a failed-write message.

- [ ] **Step 2: Run the authenticated app test to verify it fails**

Run: `npm run test:run -- src/app/CountdownApp.test.tsx`

Expected: failure because the application components do not exist.

- [ ] **Step 3: Implement the fake repository and UI components**

Keep each component controlled by props. The editor uses a native `<dialog>` where supported and renders labeled name/date/time inputs, four theme choice buttons, and the Aurora mood range input. The library uses tabs with counts, compact item rows, and accessible edit/delete actions. Hero time units render fixed-width values with descriptive unit labels.

- [ ] **Step 4: Implement authenticated app orchestration**

Choose the selected id in this order: a still-existing explicit selection, the newly created id, the nearest active countdown, then no selection. Keep history selectable by explicit action. Track editor mode and operation state locally. Confirm destructive deletion. Render a retryable toast for repository failures.

- [ ] **Step 5: Implement the auth and configuration shell**

Render `ConfigurationScreen` with the exact missing variable names when `firebaseClientState.ready` is false. For a ready client, use `onAuthStateChanged` to render a quiet loading state, `AuthScreen`, or `CountdownApp`. Show the user's display name/photo when present and a sign-out button. Treat popup cancellation as a normal return; show other sign-in errors inline.

- [ ] **Step 6: Run the app tests**

Run: `npm run test:run -- src/app/CountdownApp.test.tsx`

Expected: all authenticated app behavior tests pass.

- [ ] **Step 7: Commit the working application UI**

```bash
git add src/App.tsx src/main.tsx src/app src/components src/test/fakeCountdownRepository.ts
git commit -m "feat: add countdown authentication and library UI"
```

### Task 6: Add Celebration and Four Complete Visual Themes

**Files:**
- Create: `src/celebrate.ts`
- Create: `src/components/ThemeBackdrop.tsx`
- Modify: `src/components/HeroCountdown.tsx`
- Modify: `src/components/CountdownEditor.tsx`
- Modify: `src/app/CountdownApp.tsx`
- Create: `src/styles.css`
- Modify: `src/main.tsx`
- Modify: `src/app/CountdownApp.test.tsx`

**Interfaces:**
- Consumes: `ThemeId`, `getAuroraVariables`, and `useCountdownClock`.
- Produces: `celebrate()` and the complete responsive theme presentation.

- [ ] **Step 1: Write a failing celebration integration test**

Mock `celebrate` and use fake timers with a selected countdown one second in the future.

```tsx
act(() => vi.advanceTimersByTime(2_000))
expect(screen.getAllByText('00')).toHaveLength(4)
expect(celebrate).toHaveBeenCalledTimes(1)
expect(repository.archiveExpired).not.toHaveBeenCalledWith('user-1', [selected.id])
```

Advance another ten seconds and assert the celebration count remains one.

- [ ] **Step 2: Run the integration test to verify it fails**

Run: `npm run test:run -- src/app/CountdownApp.test.tsx`

Expected: the new celebration expectation fails because the adapter and integration do not exist.

- [ ] **Step 3: Implement reduced-motion-aware confetti**

`celebrate()` returns without work when `matchMedia('(prefers-reduced-motion: reduce)').matches`. Otherwise launch two short side bursts and one centered burst through `canvas-confetti`. Catch any synchronous error so celebration cannot interrupt the clock.

- [ ] **Step 4: Integrate zero crossing once per selected countdown**

Keep a `Set<string>` in `CountdownApp`. The hero's `onReachZero` callback adds the id and calls `celebrate` only when the id was absent. Selection of an already-complete record does not fire because the clock hook has not observed a positive duration.

- [ ] **Step 5: Implement the shared layout and Aurora theme**

Create a full-viewport theme root, compact top bar, centered hero, responsive drawer, polished dialog, visible focus states, and 44 px controls. Aurora uses the inline custom properties from `getAuroraVariables`, layered radial/linear gradients, lightly blurred decorative orbs, glass surfaces, and a styled Mood range control.

- [ ] **Step 6: Implement Event Horizon**

Use near-black layered radial gradients, a pure-CSS star field, slow orbital rings behind the timer, uppercase condensed system typography, thin luminous rules, and restrained gold-white accents. Ensure interactive layers remain above decorations and rings have `pointer-events: none`.

- [ ] **Step 7: Implement Hyperdrive**

Use a deep indigo base, cyan/magenta glow, segmented-feeling monospace digits, perspective grid, subtle scanline overlay, clipped angular panels, and quick low-amplitude accent animation. Keep body copy on solid-enough surfaces for contrast.

- [ ] **Step 8: Implement Paper Riot**

Use warm paper color, cobalt/yellow/coral blocks, heavy black outlines, offset shadows, rotated CSS paper scraps, sticker-shaped controls, and oversized editorial timer type. Avoid translucent glass in this theme.

- [ ] **Step 9: Add responsive and reduced-motion rules**

At narrow widths, change the library to a fixed bottom sheet, scale timer units with `clamp`, allow a two-by-two unit grid, keep the editor within the viewport, and preserve safe-area padding. Under reduced motion, stop background, orbital, grid, and decorative animation.

- [ ] **Step 10: Run the full component test**

Run: `npm run test:run -- src/app/CountdownApp.test.tsx`

Expected: the countdown freezes at zero, celebrates once, and all UI tests pass.

- [ ] **Step 11: Commit the finished visual experience**

```bash
git add src/celebrate.ts src/components src/app/CountdownApp.tsx src/app/CountdownApp.test.tsx src/styles.css src/main.tsx
git commit -m "feat: add four countdown themes and celebration"
```

### Task 7: Documentation, Configuration Recovery, and Final Verification

**Files:**
- Create: `README.md`
- Modify: `.gitignore`
- Optionally create locally ignored: `.env`

**Interfaces:**
- Consumes: the completed app and Firebase project id `countdown-57acd`.
- Produces: a locally runnable, tested, linted, production-buildable project.

- [ ] **Step 1: Recover the Firebase web configuration when available**

Use the authenticated Firebase CLI to list WEB apps for `countdown-57acd` and read the existing app SDK configuration. Write the values to the ignored `.env`. If no WEB app or authenticated CLI session is available, leave `.env` absent and keep the app's explicit configuration screen; `.env.example` remains the precise setup contract.

- [ ] **Step 2: Write setup and usage documentation**

Document Node installation, `npm install`, copying `.env.example` to `.env`, the six Firebase keys, enabling Google sign-in, `npm run dev`, `npm run test:run`, `npm run lint`, `npm run typecheck`, `npm run build`, and the existing Firebase Hosting `dist` target. Explain the reload-only history behavior in one short product note.

- [ ] **Step 3: Run the complete test suite**

Run: `npm run test:run`

Expected: every Vitest test passes with zero failures.

- [ ] **Step 4: Run static verification**

Run: `npm run typecheck`

Expected: TypeScript exits successfully with no diagnostics.

Run: `npm run lint`

Expected: ESLint exits successfully with no errors.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: Vite produces `dist/index.html` and compiled assets with exit code 0.

- [ ] **Step 6: Verify requirements against the design**

Confirm from tests and source that Google sign-in is the only provider, Firestore paths are owner-scoped, the hero selects one countdown, all four theme ids render distinct root classes, Aurora exposes its mood slider, zero crossing celebrates once, migration runs only for the first snapshot, motion reduction is supported, and Firebase Hosting still points to `dist`.

- [ ] **Step 7: Commit documentation and final adjustments**

```bash
git add README.md .gitignore package.json package-lock.json
git commit -m "docs: add countdown app setup and verification"
```
