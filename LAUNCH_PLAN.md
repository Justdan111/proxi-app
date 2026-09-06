# Proxi Priority Fix Plan & Launch Schedule

Written: 21 August 2026 · **Updated: 6 September 2026**
Companion to: [AUDIT_REPORT.md](AUDIT_REPORT.md)

> **Status: all four engineering days are merged. The plan below is now history for
> days 1–4 and live only from [The Path to Production](#the-path-to-production) onward.**
>
> Days 1–4 shipped as PRs #2–#8, followed by fix branches #9–#11 and the 31 August session
> as #12–#15. Nothing is open in the repository.
>
> **The schedule did not survive contact with reality, and the reason matters.** This plan
> assumed submission around day 5–6. It is day 16 and nothing has been submitted, because
> every remaining item is external — a deployment, two store accounts, a device — and none
> of them were started while the engineering days ran. The engineering finished roughly on
> time; the plan simply had no one working the external track in parallel.
>
> Read `AUDIT_REPORT.md` § *Remaining Work* for the defect-level view. This file holds the
> sequence and the dates.

## Working Agreement

- **One branch per day, one PR per day.** Nothing is merged without personal review.
- **Never push to `main`.** All work lands on a feature branch and opens a PR against `main`.
- Commit messages and PR bodies carry **no tool attribution** of any kind.
- Each PR must leave the app in a buildable state — a reviewer should be able to check
  out the branch and run it.

| Day | Branch | Status |
|---|---|---|
| 1 | `day1/expo-57-upgrade` | **Merged** — SDK 57, `react-native-maps`, API 36 |
| 2 | `day2/alarm-notifications-and-geofencing` | **Merged** — geofencing defects, alarm channel |
| 3 | `day3/screen-consolidation-and-compliance` | **Merged** — screens, routing, deletion client |
| 4 | `day4/release-prep` | **Merged** — release config and compliance drafts |
| — | `fix/*` (#9–#11) | **Merged** — re-audit P1s, geocoding volume, alarm sound |
| — | #12–#15 (31 Aug–3 Sep) | **Merged** — deletion wired, SDK 57 run for the first time, launch and signup fixes |

Every PR was reviewed personally and none carried tool attribution, as agreed.

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

> **Historical.** Nothing was cut — all of it shipped. The API-36 deadline this section was
> written around **took effect on 31 August 2026**; the app has targeted 36 since day 1, so
> the rule is satisfied and is now a confirmation step rather than a risk.

## Priority Ladder

| Priority | Meaning | Items |
|---|---|---|
| **P0** | Store rejection or core feature failure | §3.1, §3.2, §3.3, §3.9, §3.12, §4.1, §4.2, §4.3, §4.4, §4.6, §4.8 |
| **P1** | Reviewer-visible or materially degrades UX | §3.4, §3.5, §3.6, §3.7, §3.11, §4.5, §4.7, §4.9, §6.1, §7 |
| **P2** | Quality, consistency, performance | §3.8, §3.10, §8.x, §9.x |

Section numbers refer to [AUDIT_REPORT.md](AUDIT_REPORT.md).

> **As of 6 September, every P0 and P1 above is fixed in code.** What remains at P0 is not
> a defect but a deployment, two store accounts, and a device pass — see
> [The Path to Production](#the-path-to-production). The P2s that are still open are listed
> there too, and none of them gates a build.

## Sequencing Rationale

**The SDK upgrade must land before the map migration.** Validating `react-native-maps`
against RN 0.81 and then immediately jumping to RN 0.86 would mean doing the native
validation twice and debugging two variables at once. Upgrade first, confirm the existing
app still builds and runs, *then* swap the map.

Day 1 is therefore entirely native: upgrade, verify, migrate, build. Days 2 and 3 are
pure JavaScript and need no further native rebuilds.

---

## Day 1 — Expo SDK 57 upgrade and map migration

> **Shipped.** Merged as PR #2. `react-native-maps` pinned to 1.27.2 rather than the
> 1.29.0 named below — `expo install` resolves SDK 57's bundled-native-modules manifest,
> and 1.29.0 fails `expo-doctor`.

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

- Remove `@rnmapbox/maps`; add `react-native-maps`. **Landed at 1.27.2, not 1.29.0** —
  `expo install` pins the version in SDK 57's bundled-native-modules manifest, and 1.29.0
  fails `expo-doctor`.
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
  **Note:** the Android key must be passed as the plugin's own `androidGoogleMapsApiKey`
  prop. Setting `android.config.googleMaps.apiKey` does not work — the plugin removes the
  `geo.API_KEY` meta-data whenever its prop is absent. Leave `iosGoogleMapsApiKey` unset
  to keep iOS on Apple Maps and the GoogleMaps pod out of the build.
- `.env`: drop `EXPO_PUBLIC_MAPBOX_TOKEN`; add the Android Google Maps key as
  `GOOGLE_MAPS_ANDROID_API_KEY` — **not** `EXPO_PUBLIC_*`, which embeds it in the bundle.
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

> **Shipped.** Merged, with follow-ups on `fix/geofence-concurrency`,
> `fix/geofence-restart-and-activity-refresh` and `fix/alarm-sound`. **None of it has run
> on hardware**, which is what §4.2 below exists to fix.

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

> **Shipped.** Merged. §3.3's client was finished here; the endpoint it needed arrived on
> 31 August (PR #12).

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

### 3.3 Account deletion (audit §4.1) — **client done, endpoint done, deploy pending**

> **Resolved 31 August 2026.** `DELETE /api/auth/me` exists on the local API and is
> verified end-to-end (hard-deletes the user and their reminders; the email can be
> reused). The client is wired to it via `EXPO_PUBLIC_USE_LOCAL_API=true`.
>
> **Action still required outside this repo:** deploy the API. Railway currently returns
> `Application not found` for every route, so production has no working backend at all.

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

> **Partly shipped.** §4.1's compliance package is **drafted in `release/` but not
> submitted**; §4.2 device QA has **never been run**; §4.3 production build and §4.4
> enrolment have **not been started**. These are the live items — see The Path to
> Production.

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

## The Path to Production

Everything below is **outside this repository**. Ordered by what unblocks what, not by
effort — the two longest items are wall-clock and start the moment you begin them.

### Start these two today, in parallel

They are independent of each other and everything else waits on both.

| # | Action | Why it is first |
|---|---|---|
| **1** | **Deploy the API.** Railway currently answers `{"code":404,"message":"Application not found"}` on every route, `/api/auth/login` included | A production build cannot **sign in**. Not "cannot delete an account" — cannot sign in. Every item below needs a working backend to be tested against |
| **2** | **Enrol with Apple, as an individual** ($99/yr; organisation needs a D-U-N-S number and adds 1–2 weeks) | 24–48h to approve, and it gates more than submission — see below |

**Apple enrolment blocks device QA, not just shipping.** `eas.json`'s `development` profile
is `ios.simulator: true`, so EAS cannot build to physical hardware, and internal
distribution needs the paid account (audit §14.5). Since the entire verification surface
requires a device, enrolment sits upstream of it. This was not visible when the plan was
written and it is the single most under-rated item on the page.

### Then, in order

| # | Action | Depends on | Notes |
|---|---|---|---|
| **3** | **Recruit 12 Play testers** (aim for 15) | Nothing — start now | 14 **continuous** days once the closed test is live. Pure wall-clock. Dropping below 12 restarts the clock, which is why 15 |
| **4** | **Google Play Console** — $25 one-time plus identity verification | Nothing | Verification can take several days; it does not depend on 1 or 2 |
| **5** | **Run `release/DEVICE_QA.md`** — 63 checks | 1 and 2 | `npx expo prebuild --clean` first; the local `android/` is gitignored but stale. This is the whole verification surface and cannot be compressed |
| **6** | **Press the three unexercised paths** | 1 | Account deletion through Settings, History's *Set up again*, and the signup form. All implemented, none ever tapped. Minutes, not hours — but deletion is the Apple-critical one |
| **7** | **Publish the compliance package** | Nothing | Privacy policy at a public URL, App Store labels, Play Data Safety. Drafted in `release/`, none submitted. The two forms must agree with each other **and** with the app |
| **8** | **Restrict the Google Maps key** | Nothing | It is currently **unset**, so the Android map renders blank. Once set it ships inside a public binary — restrict by package name and release SHA-1 before any build leaves the machine |
| **9** | **Production build**, both platforms | 1–8 | Confirm the Play target-API warning is absent |
| **10** | **Start the Play closed test** | 3, 4, 9 | The 14 days begin here, not at upload |
| **11** | **Submit iOS** | 2, 5, 7, 9 | Expect a longer queue than usual: background-location apps draw more scrutiny |

### What sets the date

**The Play tester clock.** Fourteen continuous days from the moment the closed test goes
live with testers opted in — roughly three weeks to production access once it starts, and it
has not started. No amount of engineering shortens it, and it runs in parallel with
everything else, so **the cost of not starting it is a day-for-day slip of the Play date.**

iOS is not on that clock. If the API is deployed and enrolment goes through this week, iOS
can plausibly be in review before Play testing is halfway.

### Small code items, none blocking

They do not gate a tester build. Fold them in while waiting on the external track.

- **audit §13.2** — geofencing runs a foreground service and samples location with zero
  enabled reminders. Battery cost and a permanent notification for nothing
- **audit §13.5** — three `console.log` calls on swallowed error paths, two still `[v0]`
- A legacy `cachedReminders` key survives logout **and** account deletion —
  `clearLocalSession()` wipes `proxi_*` only. Deletion completeness is what 5.1.1(v) checks
- Decide `supportsTablet`, currently `true`. Setting it `false` removes an entire review
  surface and the iPad screenshots that come with it
- Reproduce the **address/coordinates mismatch**: an Eti-Osa address reported 536 km away
  from Eti-Osa. A geofence fires on coordinates, not the label — if the stored point is
  wrong, the core feature silently does not work. Settle this **before** the device pass, or
  it will be misread as a device-pass failure

## Risk Register

Updated 6 September 2026. Struck-through rows are closed; the notes say what actually
happened, because a risk that fired and was mitigated is worth more than one that never did.

### Live

| Risk | Impact | Mitigation |
|---|---|---|
| **The API is not deployed** | Blocks *everything* — production cannot even sign in | Railway serves `Application not found` on every route. Redeploy, then re-verify account deletion against production rather than a local instance |
| **Apple enrolment delayed** | Now blocks **device QA as well as submission** — EAS is configured simulator-only, so there is no route to hardware without it | Enrol as an individual, ID ready. Started today, this is 24–48h; started after the device pass is scheduled, it is the schedule |
| **Play tester clock has not started** | Sets the Play date outright, day for day | Recruit 15 now, before a build exists. The clock runs in parallel with everything else, so every day not started is a day added to the end |
| **Nothing has run on hardware** | Every behavioural claim in the audit is implemented and unverified | `release/DEVICE_QA.md`, 63 checks. Background geofencing and notification delivery cannot be checked in a simulator — it will show a notification and tell you nothing about which channel carried it |
| Android channel cached from an old install | Alarm settings silently ignored during testing | Channels are immutable after creation. Test on a **clean install**; a device that ran a local build after day 2 may still hold a `proxi-alarm-v2` channel with the old chime |
| Rejection under Guideline 5.1.5 | Days lost per round trip | Contextual prompts, precise purpose strings, demo video in the review notes |
| Native geocoder autocomplete disappoints | Weakens the core flow | `GeocodingProvider` makes Google Places a one-file swap. **Device check 1.7 decides this** — and the 536 km coordinate mismatch may already be evidence against it |

### Closed

| Risk | What actually happened |
|---|---|
| ~~SDK 57 upgrade breaks the build~~ | Landed clean. `tsc` went 8 errors → 0, `expo-doctor` 20/21 → 21/21 |
| ~~Backend `DELETE /api/auth/me` not delivered~~ | **Closed 31 Aug.** Written and verified end-to-end: hard-deletes the user and their reminders, refuses the old credentials, frees the email. Only deployment remains |
| ~~Reanimated 4.1→4.5 / Worklets 0.5→0.10 regressions~~ | Not observed once the app actually ran |
| ~~Play target-API rule misread~~ | Rule took effect 31 Aug; the app has targeted 36 since day 1 |
| ~~NativeWind breaks under RN 0.86~~ | **Fired — and the register sent us the wrong way.** Every screen did lose its styling, exactly as predicted. But NativeWind was fine: the cause was ours, five screens importing `SafeAreaView` from `react-native` when NativeWind only maps the `react-native-safe-area-context` one, so each page container's `className` was silently dropped (audit §14.6). Had we trusted this row we would have chased a dependency upgrade that fixed nothing. **A predicted symptom is not a diagnosis** |

### Added since the plan was written

| Risk | Impact | Mitigation |
|---|---|---|
| **A stale dev client masquerades as a code defect** | Cost a session. The April build was SDK 54 against an SDK 57 bundle and crashed with `ReferenceError: Property 'MessageQueue' doesn't exist` (audit §14.5) | Compare fingerprints before debugging a launch crash: `npx @expo/fingerprint .` against the build's recorded fingerprint. A mismatch means rebuild, not debug |
| **`className` on an unmapped component fails silently** | No error, no warning, no lint or typecheck signal — only running the app reveals it | When styling vanishes on one component but works on its neighbours, check NativeWind's mapping table before suspecting NativeWind |
| **Defects that only a running build can expose** | Four found in one session once the app finally ran (§14.6, §14.8, §14.9, §14.10) | Assume more remain. The device pass is where they surface, which is another reason not to leave it last |

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
