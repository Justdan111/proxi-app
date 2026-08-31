# Proxi — Working Requirements

Location-based reminder app. Expo / React Native / expo-router. The backend is a
**separate service** (`proxi-api-production.up.railway.app`) whose source is not in
this repo.

---

## REQUIREMENT: Session continuity

**Every session must start by reading state and end by recording it.** Sessions start
with no memory of previous ones; these files are the only continuity that exists.

### At the start of every session

Read these, in this order, before doing anything else:

1. **`SESSION_LOG.md`** — what the last session did and what comes next. Start here.
2. **`LAUNCH_PLAN.md`** — the day-by-day plan, priority ladder, and risk register.
3. **`AUDIT_REPORT.md`** — every known defect, numbered. Plan sections cite these
   numbers (`§3.9`, `§4.8`), so the two documents are read together.

Then confirm actual repo state rather than trusting the log — `git branch -a`,
`git log --oneline -5`, `gh pr list`.

### At the end of every session

Append an entry to `SESSION_LOG.md` using the template at the bottom of that file.
Record what was **completed**, what is **in progress**, what is **blocked**, and the
**single next action**. Do this even for short or inconclusive sessions — a session
that ended without finishing something is exactly the case where the next one needs
context.

Update `AUDIT_REPORT.md` when a defect is fixed or a new one is found. Update
`LAUNCH_PLAN.md` when scope or sequencing changes. These are living documents, not
a historical record.

---

## REQUIREMENT: Branch and PR workflow

- **Never push to `main`.** Never merge a PR.
- One branch and one PR per day of work, named for its scope
  (`day1/expo-57-upgrade`). Branch off `main` before touching any file.
- Every PR must leave the app in a buildable state.
- Dan reviews every PR personally. After opening one, **stop** — do not begin the
  next day's branch until he says so.

## REQUIREMENT: No AI attribution

No `Co-Authored-By: Claude`, `Claude-Session:`, `Generated with Claude Code`, or any
similar trailer in commit messages, PR bodies, or PR comments. Verify before pushing:

```bash
git log origin/main..HEAD --format='%B' | grep -iE "co-authored-by|generated with claude|claude-session|🤖"
```

Expect no output. Match on the trailer patterns, not the bare word "claude" — the
filename `CLAUDE.md` legitimately appears in commit messages and produces false positives.

---

## Commands

```bash
npx expo start              # dev server
npm run lint                # eslint
npx tsc --noEmit            # typecheck
npx expo-doctor             # dependency/version validation — run after any SDK change
eas build --profile production --platform all
```

**There is no test suite.** No test runner is configured and no test files exist.
Verification is typecheck + lint + physical-device QA. Do not claim behaviour is
verified without running it on a device — the core features (background geofencing,
notifications) cannot be exercised in a simulator.

## Architecture

| Layer | Path | Notes |
|---|---|---|
| Routes | `app/` | expo-router; `(auth)` and `(tab)` groups |
| State | `context/` | Context + hooks: auth, reminders, theme |
| Services | `lib/` | `api/`, `location/`, `notifications/` |
| UI | `components/` | Auth screens, map component |

Styling is **NativeWind** (Tailwind classes). `app/location-picker.tsx` uses
`StyleSheet` instead — that is a known inconsistency, not a pattern to copy.

## Gotchas

These cost real time to discover. Do not rediscover them.

- **`channelId` belongs on the notification *trigger*, not the content.** Setting it
  on content silently does nothing and the notification falls back to the default
  channel. This was a live P0 bug.
- **Android notification channels are immutable after creation.** Changing importance,
  sound, or vibration requires a **new channel ID**; existing installs keep the old
  settings forever.
- **The JWT lives in SecureStore, not AsyncStorage** (`proxi_jwt_token`). Reading it
  from AsyncStorage returns `null` — this was a live bug in the background task.
- **Background tasks cannot read React context.** They read reminders from AsyncStorage
  under `proxi_reminders_cache`, mirrored by `AppInitializer`.
- **Haptics require the app to be foregrounded.** They cannot fire from the background
  geofence task; the notification vibration pattern is the only tactile channel then.
- **`npx tsc --noEmit` errors under `lib/simulation/`** are pre-existing archived code,
  not regressions. `app.config.ts` has one known `ExpoConfig.name` error.
- **To run against the local API, set `EXPO_PUBLIC_USE_LOCAL_API=true` in `.env` and
  restart Metro with `npx expo start -c`.** `EXPO_PUBLIC_*` values are inlined at bundle
  time, so a plain reload keeps the old URL. The flag is checked *before*
  `EXPO_PUBLIC_API_URL` (which ships the production URL) and is ignored outside `__DEV__`,
  so a release build can never point at a laptop. The port is 8080 and the host comes from
  Metro's `hostUri`, which is what lets a physical device on the same LAN reach it.
- **`EXPO_PUBLIC_*` env vars are embedded in the built bundle.** Never put a secret
  behind that prefix. The Android Google Maps key must be restricted by package name
  and SHA-1 in Google Cloud Console.

## Decisions already settled

Do not relitigate these without new information — each was chosen against a named
alternative. Full reasoning in `AUDIT_REPORT.md` §5.

- Maps: `react-native-maps` (Apple Maps on iOS, Google Maps on Android). `expo-maps`
  rejected: alpha, requires iOS 18 minimum.
- Geocoding: expo-location native geocoder behind a `GeocodingProvider` interface;
  Google Places is a deliberate fast-follow.
- Expo SDK 57 (full upgrade, not an API-36 pin on SDK 54).
- Explorer tab merges into Home; three tabs at launch.
- Alarm notifications: maximum achievable without native code. Android full-screen
  intent and iOS AlarmKit are deferred. **A true full-screen alarm takeover is
  impossible on third-party iOS apps — never promise it.**

## Blockers outside this repo

Raise these early; none can be fixed by writing code here.

1. **The API is not deployed.** `proxi-api-production.up.railway.app` returns
   `Application not found` for every route — production cannot sign in. `DELETE
   /api/auth/me` itself is **no longer a blocker**: it exists and is verified end-to-end
   against a local instance (31 Aug 2026). Deploying the service is what remains.
2. **Neither store account is enrolled.** Apple: enroll as *individual* (organization
   needs a D-U-N-S number, +1–2 weeks).
3. **Google Play needs 12 testers × 14 continuous days** of closed testing before a new
   personal account gets production access. Pure wall-clock time.
4. **Play requires Android target API 36 for new apps from 31 August 2026.** This is
   why the Expo 57 upgrade is a blocker, not maintenance.
