# Proxi Priority Fix Plan & Launch Schedule

Date: 21 August 2026
Companion to: [AUDIT_REPORT.md](AUDIT_REPORT.md)

## Working Agreement

- **One branch per day, one PR per day.** Nothing is merged without personal review.
- **Never push to `main`.** All work lands on a feature branch and opens a PR against `main`.
- Commit messages and PR bodies carry **no tool attribution** of any kind.
- Each PR must leave the app in a buildable state — a reviewer should be able to check
  out the branch and run it.

| Day | Branch | PR title |
|---|---|---|
| 1 | `day1/map-migration-and-p0-fixes` | Migrate to react-native-maps and fix critical geofencing defects |
| 2 | `day2/screen-consolidation-and-compliance` | Consolidate screens, fix routing, add account deletion |
| 3 | `day3/release-prep` | Release configuration, compliance metadata, production build |

## Priority Ladder

Work is ordered by *what blocks the store*, then *what breaks the product*, then polish.
If time runs short, cut from the bottom.

| Priority | Meaning | Items |
|---|---|---|
| **P0** | Store rejection or core feature failure | §3.1, §3.2, §3.3, §4.1, §4.2, §4.3, §4.4, §4.6 |
| **P1** | Reviewer-visible or materially degrades UX | §3.4, §3.5, §3.6, §3.7, §4.5, §4.7, §6.1, §7 |
| **P2** | Quality, consistency, performance | §3.8, §8.x, §9.x |

Section numbers refer to [AUDIT_REPORT.md](AUDIT_REPORT.md).

## Sequencing Rationale

EAS native builds take roughly 20–40 minutes and both the outgoing and incoming map
libraries are native modules, so a fresh development client is required either way.
Day 1 therefore front-loads **all native and configuration churn**, kicks a build, and
uses the build window for pure-JavaScript fixes that need no native rebuild.

---

## Day 1 — Native migration and critical defects

Branch: `day1/map-migration-and-p0-fixes`

### 1.1 Map migration (do first, then build)

- Remove `@rnmapbox/maps`; add `react-native-maps`.
- Rewrite `components/maps/ReminderMap.tsx`. **The prop interface stays identical**
  (`center`, `radius`, `onLocationSelect`, `height`), so neither caller changes:

  | Mapbox | react-native-maps |
  |---|---|
  | `<PointAnnotation>` | `<Marker>` |
  | `<ShapeSource>` + `<CircleLayer>` | `<Circle radius={meters}>` |
  | `<UserLocation visible animated />` | `showsUserLocation` |
  | `<Camera centerCoordinate zoomLevel>` | `region` with computed deltas |
  | `e.geometry.coordinates` | `e.nativeEvent.coordinate` |

- Delete `metresToPixels` and `radiusToZoom` — `<Circle>` takes meters natively, which
  makes the radius overlay geographically correct (audit §5.3).
- No `provider` prop on iOS → Apple Maps, no key required. `PROVIDER_GOOGLE` on Android.
- Remove `Mapbox.setAccessToken` from `app/_layout.tsx:101` and `ReminderMap.tsx:12`.

### 1.2 Geocoding provider

New `lib/location/geocoding.ts`:

```ts
export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface GeocodingProvider {
  search(query: string): Promise<PlaceResult[]>;
  reverse(coords: Coordinates): Promise<PlaceResult | null>;
}

export const geocoder: GeocodingProvider = nativeGeocoder; // ← Google Places swaps in here
```

Backed by `expo-location`'s `geocodeAsync` / `reverseGeocodeAsync`. This absorbs all
three raw Mapbox `fetch` calls in `app/location-picker.tsx` (lines 997, 1016, 1047).

Google Places Autocomplete is a deliberate fast-follow: it needs Google Cloud billing,
which is kept off the launch critical path. The interface above means adopting it later
touches one file.

### 1.3 Configuration

- `app.json`: add `android.package`; dedupe `UIBackgroundModes` to `["location", "fetch"]`;
  remove `UNAuthorizationOptionCriticalAlert`; fix the notification icon path or add the
  missing asset.
- `lib/notifications/notifications.ts:44`: remove `allowCriticalAlerts: true`.
- `app.config.ts`: delete the `MAPBOX_DOWNLOADS_TOKEN` plugin manipulation; add the
  `react-native-maps` plugin; fix the `ExpoConfig.name` type error.
- `.env`: drop `EXPO_PUBLIC_MAPBOX_TOKEN`; add the Android Google Maps key.
- Exclude `lib/simulation/` from `tsconfig.json` (clears 7 of 8 type errors).

**Kick the EAS development build here.** Everything below is JavaScript-only.

### 1.4 P0 geofencing fixes (during the build window)

**Notification spam (audit §3.1)** — `lib/location/geofencing.ts`
Track currently-occupied geofences in AsyncStorage. Notify only on the outside→inside
transition. Use hysteresis: enter at `radius`, exit at `radius × 1.15`, so boundary
jitter cannot re-fire.

**Token storage mismatch (audit §3.2)** — `lib/location/geofencing.ts:81`
Extract a shared `getAuthToken()` reading from SecureStore, used by both the API client
and the background task. Route the background activity POST through the same base-URL
resolution as `lib/api/client.ts` instead of raw `process.env`.

**`once` completion sync (audit §3.3)** — `lib/location/geofencing.ts:71`
On trigger, persist completion to the server, not just the local `Set`. Refresh reminder
state when the app next foregrounds so the "Completed" badge and auto-disable behave as
the UI already promises.

**iOS notification categories (audit §3.4)** — `lib/notifications/notifications.ts:75`
Move `categoryIdentifier` out of the Android-only spread so iOS renders Done and Snooze.

**Done action (audit §3.5)** — `app/_layout.tsx:46`
Replace the `console.log` with a real state mutation.

**Delete dead code** — `lib/config.ts`, and the `cachedReminders` effect at
`app/add-reminder.tsx:556`.

### Day 1 acceptance
- App builds and runs on a physical device.
- Map renders (Apple Maps on iOS, Google Maps on Android); radius circle visually matches
  the configured metres.
- Walking into a geofence fires **exactly one** notification; remaining inside fires none.
- A `triggered` entry appears in the Activity tab.

---

## Day 2 — Product consolidation and compliance features

Branch: `day2/screen-consolidation-and-compliance`

### 2.1 Merge Explorer into Home (audit §7)

- Delete `app/(tab)/explorer.tsx`.
- Port the detail modal and delete action into `app/(tab)/home.tsx` (long-press or swipe).
- Port the stats row (total / active / disabled).
- Remove the tab-bar margin hack in `app/(tab)/_layout.tsx` (`marginRight: 30`,
  `marginLeft: 30`) that existed only to dodge the floating action button.
- Result: Home / Activity / Settings + FAB, with zero "Coming soon" dead ends.

### 2.2 Routing fixes (audit §6.1)

- Delete `components/welcomeScreen.tsx` and `app/(auth)/index.tsx` — unreachable.
- Remove the broken `'/(auth)/index'` navigation branches at `app/(auth)/login.tsx:9`
  and `app/(auth)/signup.tsx:11`.
- Narrow both `onNavigate` prop types accordingly.

### 2.3 Account deletion (audit §4.1) — **blocked on backend**

> **Action required outside this repo:** add `DELETE /api/auth/me` to the Railway API.
> The client cannot ship without it, and Apple will reject the app without it.

Client work, written against that contract:
- `authApi.deleteAccount()` in `lib/api/auth.api.ts`.
- Settings row with a confirmation dialog that names the consequence explicitly.
- On success: clear SecureStore, clear AsyncStorage, stop geofencing, redirect to login.

### 2.4 Session expiry (audit §3.6)

Give `lib/api/client.ts` a callback that `authContext` registers on mount, so a 401
clears auth state and routes to login rather than leaving the user stranded.

### 2.5 Location handoff (audit §3.7)

Replace `router.back()` + `router.setParams()` with a `locationDraftContext` alongside
the existing contexts. Removes the race **and** the dropped `selectedIcon` that causes
every reminder to save as 📍.

### 2.6 UI consistency (audit §8)

- Unify the accent colour. Pick one value, put it in `tailwind.config.js`, replace all
  19 `#00D4AA` / 9 `#00d4d4` / 5 `#6366f1` hardcodes with the token.
- Convert `app/location-picker.tsx` from `StyleSheet` + hand-rolled palettes to NativeWind.
- Remove `fontFamily: 'Courier'` from `location-picker.tsx:143` and `add-reminder.tsx:193`,
  or load a real font via `expo-font`.
- Make the Settings notification toggle functional, or remove it.
- Give the Settings profile row an action, or remove its chevron.
- Remove the hardcoded 2-second splash delay at `app/_layout.tsx:107`.

### 2.7 Performance (audit §9)

- Hoist location to one shared source; stop each card calling `getCurrentPositionAsync`.
- Fix the doubled foreground permission request in `lib/location/permissions.ts:38`.
- Move permission requests from startup to contextual prompts (audit §4.7) — this
  strengthens the Guideline 5.1.5 justification and improves grant rates.

### Day 2 acceptance
- Three tabs, no "Coming soon" alerts anywhere, no inert controls.
- Account deletion works end to end.
- A reminder created from the picker keeps its chosen icon.
- One accent colour throughout, in both light and dark themes.

---

## Day 3 — Release preparation and enrollment

Branch: `day3/release-prep`

### 3.1 Compliance package (audit §4.6)

- Publish the privacy policy at a public URL. Must disclose precise background location
  collection, what is stored server-side, and the retention period.
- App Store privacy labels: Location (Precise, Background), Contact Info (email),
  Identifiers (user ID).
- Play Data Safety form, matching the above exactly — mismatches trigger rejection.
- Store listing copy, keywords, category, support URL.
- Screenshots for all required device sizes.

### 3.2 Physical-device QA

Background geofencing must be verified in all three states, on real hardware:
- App foregrounded
- App backgrounded
- App terminated
- Device rebooted (validates `startOnBoot`)

Also verify: notification Done and Snooze on **both** platforms, `once` reminder
completes and stays completed, permission denial paths degrade gracefully.

### 3.3 Production build

- `eas build --profile production` for both platforms.
- **Restrict the Android Google Maps key** in Google Cloud Console to the app's package
  name and SHA-1 signing certificate before the key ships in a public binary (audit §10).

### 3.4 Store enrollment

Scheduled here at the project owner's direction.

- Apple Developer Program — **enroll as an individual**, $99/yr. Organization enrollment
  requires a D-U-N-S number and adds 1–2 weeks.
- Google Play Console — $25 one-time, plus identity verification.

### Day 3 acceptance
- Production builds succeed for both platforms.
- Compliance package complete.
- Device QA passed.
- Both enrollments submitted.

---

## After Day 3

Enrollment is asynchronous and cannot be compressed, so submission necessarily follows
the completion of engineering work:

| Milestone | Depends on | Expected |
|---|---|---|
| Apple account active | 24–48h after applying | Day 4–5 |
| iOS submitted for review | Active Apple account | Day 4–5 |
| iOS in review | Apple queue, longer for background-location apps | Day 5–7 |
| Play account verified | Google identity verification | Day 4–6 |
| Play closed test starts | Verified account + uploaded build | Day 5–6 |
| **Play production access** | **12 testers × 14 continuous days** | **~Day 20** |

Recruit the 12 Play testers **now**. That requirement is wall-clock time, not work, and
it is the single longest lead item in the entire project. The 14 days do not start until
the closed test is live with testers opted in.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Backend `DELETE /api/auth/me` not delivered | Blocks iOS submission entirely | Escalate day 1; it is the only external dependency |
| Apple enrollment identity verification delayed | Pushes submission past day 5 | Enroll as individual; have ID ready |
| react-native-maps + New Architecture issues | Blocks day 1 | `newArchEnabled: true` is set; verify on the first build, fall back to Expo's interop layer if needed |
| Native geocoder autocomplete quality disappoints | Weakens core flow | `GeocodingProvider` interface makes Google Places a one-file swap |
| Rejection under Guideline 5.1.5 (background location) | Days lost per round trip | Contextual permission prompts, precise purpose strings, demo video in review notes |
| Physical-device geofence QA fails late | Day 3 overrun | Test geofencing on hardware from day 1, not day 3 |

## Explicitly Out of Scope for Launch

Deferred deliberately. Each is a fast-follow, not a gap:

- Google Places Autocomplete (interface is ready for it)
- Reminder edit, duplicate, share, archive
- Overnight timeframe windows (audit §9.3)
- Activity feed filtering and `toggled` event noise reduction (audit §9.4)
- Renaming the `(tab)` route group to `(tabs)` (audit §6.2)
- Deleting or restoring the archived `lib/simulation/` directory
