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
| 1 | `day1/expo-57-upgrade` | Upgrade to Expo SDK 57 and migrate to react-native-maps |
| 2 | `day2/alarm-notifications-and-geofencing` | Fix geofencing defects and deliver alarm-style alerts |
| 3 | `day3/screen-consolidation-and-compliance` | Consolidate screens, fix routing, add account deletion |
| 4 | `day4/release-prep` | Release configuration, compliance metadata, production build |

## Scope Change Since First Draft

This plan was originally three days. Two decisions moved it to four:

1. **Full Expo SDK 54 → 57 upgrade.** Not cosmetic — SDK 54 targets Android API 35 and
   Play requires API 36 for new apps from 31 August 2026 (audit §4.8). It is now a
   release blocker. It is also a five-version React Native jump (0.81.5 → 0.86.2) that
   needs its own validation pass.
2. **Alarm-style notifications and haptics** added as scope.

Day 4 was already the realistic submission date because enrollment sits on day 3 and
Apple takes 24–48h to approve. The extra engineering day therefore costs nothing against
the submission date — it consumes slack that already existed.

**If four days is unacceptable,** cut in this order: §2.7 (haptics), §3.6 (UI
consistency), §3.7 (performance). Do not cut anything marked P0.

## Priority Ladder

| Priority | Meaning | Items |
|---|---|---|
| **P0** | Store rejection or core feature failure | §3.1, §3.2, §3.3, §3.9, §3.12, §4.1, §4.2, §4.3, §4.4, §4.6, §4.8 |
| **P1** | Reviewer-visible or materially degrades UX | §3.4, §3.5, §3.6, §3.7, §3.11, §4.5, §4.7, §4.9, §6.1, §7 |
| **P2** | Quality, consistency, performance | §3.8, §3.10, §8.x, §9.x |

Section numbers refer to [AUDIT_REPORT.md](AUDIT_REPORT.md).

## Sequencing Rationale

**The SDK upgrade must land before the map migration.** Validating `react-native-maps`
against RN 0.81 and then immediately jumping to RN 0.86 would mean doing the native
validation twice and debugging two variables at once. Upgrade first, confirm the existing
app still builds and runs, *then* swap the map.

Day 1 is therefore entirely native: upgrade, verify, migrate, build. Days 2 and 3 are
pure JavaScript and need no further native rebuilds.

---

## Day 1 — Expo SDK 57 upgrade and map migration

Branch: `day1/expo-57-upgrade`

### 1.1 Upgrade to SDK 57 (do this first, in isolation)

```bash
npx expo install expo@^57.0.0 --fix
npx expo-doctor
```

Target versions (from SDK 57's `bundledNativeModules.json`):

| Package | Current | SDK 57 |
|---|---|---|
| `react-native` | 0.81.5 | **0.86.2** |
| `react` / `react-dom` | 19.1.0 | 19.2.3 |
| `react-native-reanimated` | ~4.1.1 | 4.5.1 |
| `react-native-worklets` | 0.5.1 | 0.10.1 |
| `react-native-screens` | ~4.16.0 | ~4.26.0 |
| `react-native-gesture-handler` | ~2.28.0 | ~2.32.0 |
| `react-native-safe-area-context` | ^5.4.0 | ~5.7.0 |
| `react-native-svg` | 15.12.1 | 15.15.4 |
| all `expo-*` | various | `57.x` (unified versioning) |

Not Expo-managed, verify by hand:
- `nativewind` 4.2.1 → 4.2.6. Declares no React Native ceiling, but it hooks Babel and
  Metro, so it is the most likely source of a build-time failure. **Check this first if
  the build breaks.**
- `lucide-react-native` — **leave pinned at `^0.563.0`.** Latest is 1.33.0, a major bump,
  and the library is used on every screen. Not worth the risk this week.
- `@react-navigation/*`, `axios`, `lodash` — existing ranges already cover current.

**Verification gate — do not proceed to 1.2 until all of these pass:**
- `npx expo-doctor` reports no version mismatches
- `npx tsc --noEmit` shows no *new* errors
- A development build installs and launches on a physical device
- Reanimated entrance animations still run on Home, Activity, and Settings
- NativeWind classes still apply, in both light and dark themes

If the upgrade fails and cannot be resolved same-day, fall back to pinning
`targetSdkVersion`/`compileSdkVersion` to 36 via `expo-build-properties` on SDK 54. That
satisfies the Play requirement (audit §4.8) and unblocks everything else; the upgrade can
then be its own PR after launch.

### 1.2 Map migration

- Remove `@rnmapbox/maps`; add `react-native-maps` (1.29.0, peer `react-native >= 0.76.0`).
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

### 1.3 Geocoding provider

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

Backed by `expo-location`'s `geocodeAsync` / `reverseGeocodeAsync`. Absorbs all three raw
Mapbox `fetch` calls in `app/location-picker.tsx` (lines 997, 1016, 1047).

### 1.4 Configuration

- `app.json`: add `android.package`; dedupe `UIBackgroundModes` to `["location", "fetch"]`;
  remove `UNAuthorizationOptionCriticalAlert`; fix the notification icon path or add the
  missing asset; add `defaultChannel: 'proxi-alarm'` to the `expo-notifications` plugin.
- Add `SCHEDULE_EXACT_ALARM` to Android permissions (audit §3.11 — required for reliable
  snooze). Remove `USE_FULL_SCREEN_INTENT` (audit §4.9 — declared but unused, and a Play
  policy liability with no corresponding feature).
- `app.config.ts`: delete the `MAPBOX_DOWNLOADS_TOKEN` plugin manipulation; add the
  `react-native-maps` plugin; fix the `ExpoConfig.name` type error.
- `.env`: drop `EXPO_PUBLIC_MAPBOX_TOKEN`; add the Android Google Maps key.
- Exclude `lib/simulation/` from `tsconfig.json` (clears 7 of 8 type errors).
- **Confirm the built artifact targets API 36** — this is the whole point of §1.1.

### Day 1 acceptance
- `expo-doctor` clean; app builds and runs on a physical device on SDK 57.
- Built artifact confirmed targeting Android API 36.
- Map renders (Apple Maps on iOS, Google Maps on Android); radius circle visually matches
  the configured metres.
- All existing screens, animations, and NativeWind styling behave as before the upgrade.

---

## Day 2 — Geofencing correctness and alarm-style alerts

Branch: `day2/alarm-notifications-and-geofencing`

### 2.1 Notification spam (audit §3.1) — P0
`lib/location/geofencing.ts`

Track currently-occupied geofences in AsyncStorage. Notify only on the outside→inside
transition. Use hysteresis: enter at `radius`, exit at `radius × 1.15`, so boundary jitter
cannot re-fire.

### 2.2 Token storage mismatch (audit §3.2) — P0
`lib/location/geofencing.ts:81`

Extract a shared `getAuthToken()` reading from SecureStore, used by both the API client and
the background task. Route the background activity POST through the same base-URL
resolution as `lib/api/client.ts` instead of raw `process.env`.

### 2.3 `once` completion sync (audit §3.3) — P0
`lib/location/geofencing.ts:71`

Persist completion to the server, not just the local `Set`. Refresh reminder state when the
app next foregrounds so the "Completed" badge and auto-disable behave as the UI already
promises.

### 2.4 Make the alarm channel actually apply (audit §3.9) — P0

**This is the highest-value change in the entire plan and it is nearly a one-liner.** The
`proxi-alarm` channel is already correctly configured with MAX importance, `bypassDnd`,
the custom sound, and a vibration pattern — it has simply never been referenced.

- Pass `channelId: 'proxi-alarm'` on the **trigger** (not the content — this is the exact
  mistake in the current code) for every send: `sendReminderNotification` and
  `snoozeReminder`.
- Set `defaultChannel` in the `expo-notifications` plugin config as a safety net (§1.4).
- **Verify on a physical device that the channel is the one in use** — check Android's
  per-channel notification settings, not just that a notification appeared.

> **Channel immutability:** an Android channel's importance, sound, and vibration are
> frozen at creation. Anyone who already installed the app keeps the old settings. Because
> the sound is also changing (§2.6), create the channel under a **new ID** —
> `proxi-alarm-v2` — and delete the old one via `deleteNotificationChannelAsync`.

### 2.5 iOS interruption level (audit §3.12, §5.6) — P0

- `interruptionLevel: 'critical'` → `'timeSensitive'` (`notifications.ts:82`)
- Remove `allowCriticalAlerts: true` from the permission request (`notifications.ts:44`)

`timeSensitive` needs no Apple approval, breaks through Focus modes, and resolves the
Critical Alerts rejection risk (audit §4.4) at the same time.

### 2.6 Alarm sound (audit §5.8) — P1

Replace `assets/sounds/proxi-alert.wav` — currently a 3.36s stereo chime — with a **20–30s
alarm-style tone**. iOS caps custom notification sounds at 30 seconds. Export mono to
roughly halve the file size at no perceptible cost for an alert tone.

Keep the file registered in the `expo-notifications` plugin `sounds` array, and remember
the sound is what forces the new channel ID in §2.4.

### 2.7 Haptics (audit §9.6) — P2

`expo-haptics` is already a dependency with zero imports, so this costs no bundle size.

| Interaction | Feedback |
|---|---|
| Toggle a reminder on/off | `impactAsync(Light)` |
| Save a reminder successfully | `notificationAsync(Success)` |
| Save fails / validation error | `notificationAsync(Error)` |
| Delete a reminder | `impactAsync(Medium)` |
| Confirm location in the picker | `selectionAsync()` |
| Geofence triggers while app is open | `notificationAsync(Warning)` |

**Constraint:** haptics require the app to be foregrounded. They cannot fire from the
background geofence task — the notification's vibration pattern is the only tactile
channel when the app is closed. Wire the last row through the foreground notification
listener, not the background task.

Respect the OS setting rather than vibrating unconditionally, and route everything through
one small `lib/haptics.ts` wrapper so it can be muted globally.

### 2.8 Remaining notification fixes

- **iOS action buttons (audit §3.4)** — move `categoryIdentifier` out of the Android-only
  spread (`notifications.ts:75`) so Done and Snooze render on iOS.
- **Done action (audit §3.5)** — replace the `console.log` at `app/_layout.tsx:46` with a
  real state mutation.
- **Snooze reliability (audit §3.11)** — with `SCHEDULE_EXACT_ALARM` declared in §1.4,
  confirm the 10-minute snooze fires on time on a physical Android device under Doze.
- **Delete dead code** — `sendFullScreenReminderNotification` (audit §3.10), `lib/config.ts`,
  and the `cachedReminders` effect at `app/add-reminder.tsx:556`.

### Day 2 acceptance
- Walking into a geofence fires **exactly one** notification; remaining inside fires none.
- The notification arrives on the `proxi-alarm-v2` channel — verified in Android's
  per-channel settings — at MAX importance, with the new sound, bypassing DND.
- On iOS the alert breaks through a Focus mode and shows Done and Snooze.
- Snooze fires within seconds of the 10-minute mark on a Dozing device.
- A `triggered` entry appears in the Activity tab.
- Haptics fire on toggle, save, and delete, and respect the system setting.

---

## Day 3 — Product consolidation and compliance features

Branch: `day3/screen-consolidation-and-compliance`

### 3.1 Merge Explorer into Home (audit §7)
- Delete `app/(tab)/explorer.tsx`.
- Port the detail modal, delete action, and stats row into `app/(tab)/home.tsx`.
- Remove the tab-bar margin hack in `app/(tab)/_layout.tsx` (`marginRight: 30`,
  `marginLeft: 30`) that existed only to dodge the floating action button.
- Result: Home / Activity / Settings + FAB, with zero "Coming soon" dead ends.

### 3.2 Routing fixes (audit §6.1)
- Delete `components/welcomeScreen.tsx` and `app/(auth)/index.tsx` — unreachable.
- Remove the broken `'/(auth)/index'` branches at `app/(auth)/login.tsx:9` and
  `app/(auth)/signup.tsx:11`, and narrow both `onNavigate` prop types.

### 3.3 Account deletion (audit §4.1) — **blocked on backend**

> **Action required outside this repo:** add `DELETE /api/auth/me` to the Railway API.
> Escalate on day 1 — iOS cannot ship without it and it is the only external dependency
> in this plan.

- `authApi.deleteAccount()` in `lib/api/auth.api.ts`
- Settings row with a confirmation dialog naming the consequence explicitly
- On success: clear SecureStore, clear AsyncStorage, stop geofencing, redirect to login

### 3.4 Session expiry (audit §3.6)
Give `lib/api/client.ts` a callback that `authContext` registers on mount, so a 401 clears
auth state and routes to login rather than leaving the user stranded.

### 3.5 Location handoff (audit §3.7)
Replace `router.back()` + `router.setParams()` with a `locationDraftContext`. Removes the
race **and** the dropped `selectedIcon` that causes every reminder to save as 📍.

### 3.6 UI consistency (audit §8)
- Unify the accent colour: one value in `tailwind.config.js`, replacing all 19 `#00D4AA`,
  9 `#00d4d4`, and 5 `#6366f1` hardcodes.
- Convert `app/location-picker.tsx` from `StyleSheet` + hand-rolled palettes to NativeWind.
- Remove `fontFamily: 'Courier'` (`location-picker.tsx:143`, `add-reminder.tsx:193`).
- Make the Settings notification toggle functional, or remove it.
- Give the Settings profile row an action, or remove its chevron.
- Remove the hardcoded 2-second splash delay at `app/_layout.tsx:107`.

### 3.7 Performance (audit §9)
- Hoist location to one shared source; stop each card calling `getCurrentPositionAsync`.
- Fix the doubled foreground permission request in `lib/location/permissions.ts:38`.
- Move permission requests from startup to contextual prompts (audit §4.7).

### Day 3 acceptance
- Three tabs, no "Coming soon" alerts, no inert controls.
- Account deletion works end to end.
- A reminder created from the picker keeps its chosen icon.
- One accent colour throughout, in both themes.

---

## Day 4 — Release preparation and enrollment

Branch: `day4/release-prep`

### 4.1 Compliance package (audit §4.6)
- Publish the privacy policy at a public URL. Must disclose precise background location
  collection, server-side storage, and retention.
- App Store privacy labels: Location (Precise, Background), Contact Info (email),
  Identifiers (user ID).
- Play Data Safety form, matching exactly — mismatches trigger rejection.
- Store listing copy, keywords, category, support URL, screenshots for all device sizes.

### 4.2 Physical-device QA

Background geofencing, on real hardware, in all four states:
- App foregrounded
- App backgrounded
- App terminated
- Device rebooted (validates `startOnBoot`)

Notification behaviour specifically:
- Alarm channel confirmed in Android per-channel settings
- DND bypass verified with DND actually enabled
- iOS `timeSensitive` verified with a Focus mode active
- Done and Snooze on **both** platforms
- Snooze accuracy under Doze
- `once` reminder completes and **stays** completed across a restart

### 4.3 Production build
- `eas build --profile production` for both platforms.
- **Restrict the Android Google Maps key** in Google Cloud Console to the package name and
  SHA-1 signing certificate before it ships in a public binary (audit §10).
- Confirm the Play Console target-API warning is absent.

### 4.4 Store enrollment
Scheduled here at the project owner's direction.

- Apple Developer Program — **enroll as an individual**, $99/yr. Organization enrollment
  requires a D-U-N-S number and adds 1–2 weeks.
- Google Play Console — $25 one-time, plus identity verification.

### Day 4 acceptance
- Production builds succeed for both platforms, targeting API 36.
- Compliance package complete; device QA passed; both enrollments submitted.

---

## After Day 4

| Milestone | Depends on | Expected |
|---|---|---|
| Apple account active | 24–48h after applying | Day 5–6 |
| iOS submitted for review | Active Apple account | Day 5–6 |
| iOS in review | Apple queue, longer for background-location apps | Day 6–8 |
| Play account verified | Google identity verification | Day 5–7 |
| Play closed test starts | Verified account + uploaded build | Day 6–7 |
| **Play production access** | **12 testers × 14 continuous days** | **~Day 21** |

Recruit the 12 Play testers **now**. That is wall-clock time, not work, and it is the
single longest lead item in the project. The 14 days do not begin until the closed test is
live with testers opted in.

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| **SDK 57 upgrade breaks the build** | Day 1 lost, cascades into every other day | Verification gate in §1.1 before any other work; documented fallback to `expo-build-properties` on SDK 54 |
| NativeWind breaks under RN 0.86 | Every screen loses styling | Check first when diagnosing; 4.2.6 declares no RN ceiling but hooks Babel/Metro |
| Reanimated 4.1→4.5 / Worklets 0.5→0.10 regressions | Animations break across all screens | Explicit animation check in the §1.1 gate |
| Backend `DELETE /api/auth/me` not delivered | Blocks iOS submission entirely | Escalate day 1; only external dependency |
| Apple enrollment verification delayed | Pushes submission past day 6 | Enroll as individual; have ID ready |
| Android channel cached from an old install | Alarm settings silently ignored in testing | New channel ID `proxi-alarm-v2` plus delete-old; test on a clean install |
| Native geocoder autocomplete disappoints | Weakens core flow | `GeocodingProvider` interface makes Google Places a one-file swap |
| Rejection under Guideline 5.1.5 | Days lost per round trip | Contextual prompts, precise purpose strings, demo video in review notes |
| Play target-API rule misread | Submission rejected outright | Confirm the required level in Play Console before building |

## Explicitly Out of Scope for Launch

Deferred deliberately. Each is a fast-follow, not a gap:

- **Android full-screen intent** — needs a custom config plugin, the Android 14+ restricted
  permission flow, and a Play policy declaration (audit §4.9, §5.5)
- **iOS AlarmKit** — iOS 26+ only, bespoke native module, strands older devices (audit §5.5)
- Google Places Autocomplete (interface is ready for it)
- Reminder edit, duplicate, share, archive
- `lucide-react-native` 0.x → 1.x major upgrade
- Overnight timeframe windows (audit §9.3)
- Activity feed filtering and `toggled` event noise (audit §9.4)
- Renaming the `(tab)` route group to `(tabs)` (audit §6.2)
- Deleting or restoring the archived `lib/simulation/` directory
