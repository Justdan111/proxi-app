# Proxi Launch Readiness Audit

Date: 21 August 2026
Project: Proxi (Expo SDK 54 / React Native 0.81 / expo-router v6)
Scope: Production readiness for Apple App Store and Google Play Store

This report supersedes the previous audit dated 23 April 2026. It is based on a
full read of all 37 source files, a TypeScript check, and verification of every
claim against the code.

Companion document: [LAUNCH_PLAN.md](LAUNCH_PLAN.md) — the prioritised fix plan
and day-by-day schedule.

## 1. Executive Summary

Current decision: **NO-GO**

The architecture is sound. Layering, optimistic state updates with rollback,
API error mapping, and the background-task design are all above-average work.
What is broken is concentrated at the **seams between modules** — four separate
places where two correct-looking components disagree about a shared contract.

Blockers fall into three groups:

1. **Functional defects** that make the core promise of the app fail — most
   critically, notification spam, `once` reminders that never complete, and an
   alarm notification channel that has never once been applied (§3.9).
2. **Store compliance gaps** — missing account deletion (a near-certain Apple
   rejection), missing `android.package`, a missing asset, an entitlement the app
   is not approved for, and an **Android target API level below Play's minimum
   from 31 August 2026** (§4.8).
3. **Account enrollment** — neither the Apple Developer Program nor Google Play
   Console account exists yet. This is the longest lead time in the project and
   is not something code can shorten.

Two findings deserve particular attention because they invert expectations:

- **The alarm behaviour is already built and simply never switched on.** The
  `proxi-alarm` channel is correctly configured with MAX importance, DND bypass,
  a custom sound, and a vibration pattern — but `channelId` is never passed, so
  every notification has always used Android's default channel. One missing
  property accounts for most of the gap between current behaviour and the intended
  alarm experience (§3.9).
- **The Expo upgrade is a release blocker, not maintenance.** SDK 54 targets
  Android API 35; Play requires API 36 for new apps from 31 August 2026, and this
  app's Play timeline lands well past that date (§4.8).

### Timeline reality

| Milestone | Blocking factor | Realistic date |
|---|---|---|
| Code complete | Engineering only — now includes the SDK 57 upgrade (§5.7) | Day 4 |
| Apple enrollment usable | 24–48h after applying, not compressible | Day 4–5 |
| iOS submitted for review | Requires active Apple account | Day 4–5 |
| Play closed testing starts | Requires verified Play account | Day 4–5 |
| Play production access | **12 testers × 14 continuous days** of closed testing | ~Day 18+ |

Enrollment has been scheduled for day 3 at the project owner's direction. The
consequence is recorded here for accuracy: day 3 ends with *code complete and
enrollment submitted*, not with an App Store submission. Google Play production
is approximately three weeks out regardless of engineering, because new personal
developer accounts must complete a 12-tester, 14-day closed test before they can
apply for production access.

Enroll with Apple as an **individual**, not an organization. Organization
enrollment requires a D-U-N-S number, which adds 1–2 weeks.

## 2. What Is Already Done

### 2.1 Architecture
Four cleanly separated layers, each with a clear responsibility:

| Layer | Location | Role |
|---|---|---|
| Routing | `app/` | expo-router file routes: `(auth)` and `(tab)` groups plus two detail screens |
| State | `context/` | `authContext`, `reminderContext`, `themeContext` — Context + hooks |
| Services | `lib/` | `api/`, `location/`, `notifications/` |
| UI | `components/` | Auth screens and the map component |

### 2.2 Genuinely good work
- **Auth bootstrap** ([context/authContext.tsx:28](context/authContext.tsx#L28)) shows
  the cached user immediately, refreshes `/me` in the background, and force-logs-out
  only on a confirmed 401 — never on transient network failure.
- **Optimistic updates with rollback** ([context/reminderContext.tsx:80](context/reminderContext.tsx#L80))
  — `toggleReminder` flips locally then reverts on error; `deleteReminder` snapshots
  the list before mutating.
- **API error mapping** ([lib/api/errors.ts](lib/api/errors.ts)) translates Axios
  failures into user-facing copy, distinguishing timeouts from offline from HTTP status.
- **Background geofencing design** — dual-task approach (location updates plus a
  15-minute backup poll) with an AsyncStorage mirror, correctly recognising that
  background tasks cannot read React context.
- **Haversine distance** ([lib/location/distance.ts](lib/location/distance.ts)) is
  correctly implemented.

### 2.3 Build infrastructure
EAS profiles exist for development, preview, and production, with production
auto-increment configured ([eas.json](eas.json)).

### 2.4 Type safety
`npx tsc --noEmit` reports **8 errors, none in live application code**:
- [app.config.ts:25](app.config.ts#L25) — `ExpoConfig.name` optionality mismatch
- 7 errors in `lib/simulation/` — archived code that still sits inside the tsconfig
  `include` and references a context shape that no longer exists

## 3. Critical Functional Defects

### 3.1 Notification spam for `always` reminders — P0
[lib/location/geofencing.ts:53](lib/location/geofencing.ts#L53)

`checkProximity` fires a notification on **every** location tick where the user is
inside the radius. There is no enter/exit edge detection and no dwell tracking.
Only `frequency: 'once'` is protected, via `markTriggered`.

Impact: a user sitting inside a 300m radius receives a MAX-priority,
DND-bypassing, vibrating alarm **once per minute** (the task's `timeInterval` is
60000ms). This is the most user-visible defect in the app and on its own would
generate one-star reviews.

Fix: track which geofences the user is currently inside in AsyncStorage, and
notify only on the *transition* from outside to inside. Add hysteresis — exit at
`radius × 1.15` — so GPS jitter at the boundary cannot re-fire the notification.

### 3.2 Background activity logging never executes — P0
[lib/location/geofencing.ts:81](lib/location/geofencing.ts#L81)

Two independent faults in the same block:

1. The JWT is read with `AsyncStorage.getItem('proxi_jwt_token')`, but the token is
   written to **SecureStore** ([lib/api/client.ts:53](lib/api/client.ts#L53)). The
   read always returns `null`, so the block never runs.
2. Even if it ran, line 83 uses `process.env.EXPO_PUBLIC_API_URL` directly, which is
   undefined in production builds, producing a request to `undefined/api/activities`.

Impact: `triggered` events never reach the Activity feed. The tab exists but can
only ever show create/toggle/delete events.

Fix: extract a shared `getAuthToken()` helper used by both the client and the
background task, and route the background request through the same base-URL
resolution as `lib/api/client.ts`.

### 3.3 `once` reminders never actually complete — P0
[lib/location/geofencing.ts:71](lib/location/geofencing.ts#L71)

The trigger is recorded only in a local AsyncStorage `Set`. The server's `triggered`
and `enabled` fields are never updated. Consequences:

- The "Completed" badge ([app/(tab)/home.tsx:121](app/(tab)/home.tsx#L121)) never appears.
- The UI's promise — *"Triggers once then auto-disables"*
  ([app/add-reminder.tsx:757](app/add-reminder.tsx#L757)) — is false.
- Clearing app data resurrects already-fired reminders.
- The state does not sync across devices, defeating the stated purpose of the backend.

### 3.4 iOS notification action buttons do not exist — P1
[lib/notifications/notifications.ts:75](lib/notifications/notifications.ts#L75)

`registerNotificationCategories()` runs on both platforms, but
`categoryIdentifier: 'reminder'` is spread into the notification content **only
inside the `Platform.OS === 'android'` branch**. On iOS the Done and Snooze
buttons never render.

### 3.5 The "Done" action is a stub — P1
[app/_layout.tsx:46](app/_layout.tsx#L46)

```js
console.log('Marked done:', reminderId);
```

Tapping Done does nothing. Reviewer-visible incomplete functionality.

### 3.6 Expired sessions strand the user — P1
[lib/api/client.ts:65](lib/api/client.ts#L65)

The 401 interceptor deletes the token but has no channel back to `authContext`.
`user` stays populated and `isAuthenticated` stays `true`, so the user remains on
a home screen where every request fails, with no path to re-authenticate short of
force-quitting the app.

### 3.7 Location handoff is racy and drops the icon — P1
[app/location-picker.tsx:1062](app/location-picker.tsx#L1062)

`confirmSelection` calls `router.back()` and *then* `router.setParams()` — ordering
that depends on navigation timing. It also never sends `selectedIcon`, which
[app/add-reminder.tsx:526](app/add-reminder.tsx#L526) reads. Result: **every reminder
is saved with the default 📍 icon**, regardless of place type.

### 3.8 Dead cache write — P2
[app/add-reminder.tsx:556](app/add-reminder.tsx#L556)

Writes to `cachedReminders`; the geofence reads `proxi_reminders_cache`.
`AppInitializer` already handles this correctly. The entire effect is wasted work
on every reminders change.

### 3.9 The alarm notification channel is never applied — P0
[lib/notifications/notifications.ts:22](lib/notifications/notifications.ts#L22)

`setupNotificationChannel()` creates a `proxi-alarm` channel with MAX importance,
`bypassDnd: true`, the custom sound, a vibration pattern, and lights. **None of it is
ever used.**

In `expo-notifications`, `channelId` is a property of the **trigger**, not the content.
`sendReminderNotification` never sets it, and `app.json` declares no `defaultChannel`
for the plugin. Every notification therefore lands on Android's *default* channel with
default importance, the default sound, and no DND bypass.

Impact: this is the primary reason notifications do not currently behave like an alarm.
The configuration exists and is correct — it is simply never referenced.

Fix: pass `channelId: 'proxi-alarm'` on the trigger, and set `defaultChannel` in the
`expo-notifications` plugin config as a safety net.

> **Android channel immutability:** once a channel is created on a device, its
> importance, sound, and vibration are **immutable** — later code changes are ignored for
> anyone who already installed the app. Any change to those properties requires a new
> channel ID (`proxi-alarm-v2`). Budget for this when iterating on the alert sound.

### 3.10 The full-screen notification helper does nothing — P2
[lib/notifications/notifications.ts:96](lib/notifications/notifications.ts#L96)

`sendFullScreenReminderNotification` is **never called**, and would not work if it were.
It sets `sticky: true` and a `data.fullScreen` flag, neither of which produces an Android
full-screen intent. `expo-notifications` exposes no full-screen intent API.

`USE_FULL_SCREEN_INTENT` is declared in [app.json](app.json#L43), which gives the
misleading impression the capability exists. Either delete the function or implement it
properly via a custom config plugin (see §5.5).

### 3.11 Snooze is unreliable on Android — P1
[lib/notifications/notifications.ts:151](lib/notifications/notifications.ts#L151)

`snoozeReminder` schedules a `TIME_INTERVAL` trigger 10 minutes out. `expo-notifications`
deliberately does **not** declare `SCHEDULE_EXACT_ALARM`; the consuming app must add it.
Without it, Android 12+ silently falls back to `setAndAllowWhileIdle`, which Doze can
defer indefinitely. A "remind me in 10 minutes" may arrive an hour later, or not until
the device is next unlocked.

The snooze also never sets a `channelId`, so it inherits the same defect as §3.9.

### 3.12 iOS interruption level requires an unobtainable entitlement — P0
[lib/notifications/notifications.ts:82](lib/notifications/notifications.ts#L82)

`interruptionLevel: 'critical'` requires the same Apple entitlement as §4.4 — weeks of
lead time, granted almost exclusively to medical and public-safety apps.

`'timeSensitive'` is available to **every** developer with no approval process, breaks
through Focus modes, and is the correct level for this app. See §5.6.

## 4. Store Compliance Blockers

### 4.1 No account deletion — P0, near-certain rejection
Apple Guideline 5.1.1(v) requires any app offering account creation to also offer
in-app account deletion. Proxi has signup but `app/(tab)/settings.tsx` provides
only logout.

**This requires a backend change.** No `DELETE /api/auth/me` endpoint exists in
[lib/api/auth.api.ts](lib/api/auth.api.ts), and the API is a separate service. The
endpoint must be added server-side before the client work can be completed.

### 4.2 Missing `android.package` — P0
[app.json](app.json) — Play Store release identity is incomplete. Cannot ship to Play.

### 4.3 Missing notification icon asset — P0
[app.json](app.json) references `./assets/notification-icon.png`. The file does not
exist; `assets/` contains only `images/` and `sounds/`.

### 4.4 Critical Alerts entitlement — P0
`UNAuthorizationOptionCriticalAlert` is enabled in [app.json](app.json) and
`allowCriticalAlerts: true` is requested in
[lib/notifications/notifications.ts:44](lib/notifications/notifications.ts#L44).

This entitlement requires a separate Apple approval process that takes weeks and is
granted almost exclusively to medical, public-safety, and home-security apps. Shipping
without approval risks rejection. Remove it — the app does not need it.

### 4.5 Duplicated background modes — P1
[app.json](app.json) declares `UIBackgroundModes: ["location", "fetch", "location", "fetch"]`.
Duplicated entries invite reviewer questions about background usage.

### 4.6 Compliance package incomplete — P0
No privacy policy artifact or URL in the repo. Required for both stores, and
mandatory given the app collects precise background location. Also outstanding:
App Store privacy labels, Play Data Safety declarations.

### 4.7 Background location justification — P1
Apple Guideline 5.1.5 scrutinises "Always" location. Permissions are currently
requested at startup ([app/_layout.tsx:64](app/_layout.tsx#L64)) rather than
contextually, which both weakens the justification and lowers grant rates. The
purpose strings in `app.json` are well written and should be kept.

### 4.8 Android target API level is below Play's minimum — P0
Expo SDK 54 defaults to **`targetSdkVersion` 35** (Android 15), confirmed in
`expo-modules-autolinking`'s Gradle plugin defaults.

Google Play requires new apps to target an API level released within the past year.
API 36 (Android 16) becomes mandatory for new submissions on **31 August 2026** — ten
days from this report. Play production access for this app is projected around day 20
(mid-September), comfortably past the cutoff.

Impact: submitting on API 35 after that date is rejected outright. This reclassifies the
Expo upgrade from optional maintenance to a **release blocker**.

Resolution: upgrade to **Expo SDK 57**, which targets API 36 natively. See §5.7.
Verify the current requirement in Play Console before submitting — it states the required
target level explicitly.

### 4.9 Full-screen intent is a restricted permission — P1
[app.json](app.json#L43) declares `USE_FULL_SCREEN_INTENT`. Since Android 14 (API 34) this
is a **restricted** permission: it is auto-granted only to apps whose core function is
alarms or calling. Everything else must route the user through
`ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT`, and Google Play requires a policy declaration
justifying it.

Since nothing in the app actually uses a full-screen intent (§3.10), this permission is
currently pure liability — it invites a Play policy question with no corresponding feature.
Remove it unless §5.5 is implemented.

## 5. Platform Migrations

### 5.1 Map stack decision
Migrate from `@rnmapbox/maps` to **`react-native-maps`** — Apple Maps on iOS,
Google Maps on Android.

Rationale:
- **iOS needs no API key and no billing account** — Apple Maps renders natively.
- Android uses Google Maps with a free-tier key.
- Official Expo config plugin, supported on SDK 53+ at v1.22+.
- Ships a native `<Circle radius={meters}>`, which fixes §5.3 for free.

`expo-maps` was evaluated and **rejected**: it is still alpha ("subject to breaking
changes"), unavailable in Expo Go, and requires a **minimum deployment target of
iOS 18.0**, which would exclude a large share of devices.

### 5.2 Geocoding
Place search and reverse geocoding move to **expo-location's native geocoder**
(`geocodeAsync` / `reverseGeocodeAsync`) — no keys, no billing, and already proven
in [app/(tab)/home.tsx:205](app/(tab)/home.tsx#L205).

This will sit behind a `GeocodingProvider` interface in a new
`lib/location/geocoding.ts`, so Google Places Autocomplete can be swapped in later
as a one-line change without any screen touching it.

### 5.3 The radius circle is currently wrong
[components/maps/ReminderMap.tsx:1340](components/maps/ReminderMap.tsx#L1340)

```js
function metresToPixels(metres: number): number { return metres / 10; }
```

A fixed pixel conversion that ignores both zoom level and latitude. The circle drawn
on screen does not match the actual geofence at any zoom but one — users cannot trust
what they see when setting a radius. `react-native-maps` `<Circle>` takes meters
natively and eliminates both this and `radiusToZoom`.

### 5.4 Migration surface
The existing prop interface (`center`, `radius`, `onLocationSelect`, `height`) is
already correct, so **only the component internals change** — neither caller needs
modification.

| Mapbox | react-native-maps |
|---|---|
| `<PointAnnotation>` | `<Marker>` |
| `<ShapeSource>` + `<CircleLayer>` | `<Circle radius={meters}>` |
| `<UserLocation visible animated />` | `showsUserLocation` prop |
| `<Camera centerCoordinate zoomLevel>` | `region` with computed deltas |
| `e.geometry.coordinates` | `e.nativeEvent.coordinate` |

Also remove: `Mapbox.setAccessToken` at [app/_layout.tsx:101](app/_layout.tsx#L101)
and [components/maps/ReminderMap.tsx:12](components/maps/ReminderMap.tsx#L12), the
`MAPBOX_DOWNLOADS_TOKEN` plugin dance in [app.config.ts](app.config.ts), and
`EXPO_PUBLIC_MAPBOX_TOKEN` from `.env`.

`react-native-maps` 1.29.0 declares `react-native >= 0.76.0`, so it is compatible with
the SDK 57 target in §5.7.

### 5.5 Alarm-style alerts: what each platform actually permits

The product goal is an alert that behaves like an alarm when the app is closed. The
platforms differ sharply in what they allow, and the distinction matters for scoping.

| Capability | Android | iOS |
|---|---|---|
| Heads-up alert over the current screen | Yes — MAX importance channel | No equivalent |
| Bypass Do Not Disturb / Focus | Yes — `bypassDnd` on the channel | Partial — `timeSensitive` breaks Focus |
| Custom sound up to 30s | Yes | Yes |
| Sustained vibration pattern | Yes | Fixed system patterns only |
| **Full-screen lock-screen takeover** | Possible, but restricted (§4.9) and needs native code | **Not available to third-party apps** |

**Conclusion:** a true full-screen alarm takeover is unavailable on iOS at any price. The
nearest equivalent, `AlarmKit`, requires iOS 26+ and a bespoke native module, which would
strand every user below iOS 26.

The achievable target — and it is close to the felt experience of an alarm — is a MAX
importance channel that bypasses DND, with a sustained custom sound and vibration, plus
`timeSensitive` on iOS. Critically, **most of this is already configured and simply never
applied** (§3.9). Fixing one missing `channelId` delivers the majority of the outcome.

Android full-screen intent is therefore **deferred**, not rejected. It requires a custom
config plugin, the Android 14+ restricted-permission flow, and a Play policy declaration
that can itself delay review — poor value on a launch critical path.

### 5.6 iOS interruption level
Replace `interruptionLevel: 'critical'` with `'timeSensitive'`
([lib/notifications/notifications.ts:82](lib/notifications/notifications.ts#L82)) and drop
`allowCriticalAlerts` from the permission request
([notifications.ts:44](lib/notifications/notifications.ts#L44)).

`timeSensitive` needs no Apple approval, breaks through Focus modes, and can be surfaced
to users in system settings. This resolves §4.4 and §3.12 together.

### 5.7 Expo SDK 54 → 57 upgrade
Required by §4.8. Latest stable is **57.0.15**; the project is on **54.0.33**.

This is a larger jump than the version numbers suggest — **React Native 0.81.5 → 0.86.2**,
five minor releases. Expo also moved to unified versioning at SDK 57, so every `expo-*`
package renumbers to `57.x`:

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
| `expo-location` | ~19.0.8 | ~57.0.12 |
| `expo-notifications` | ~0.32.16 | ~57.0.13 |
| `expo-router` | ~6.0.23 | ~57.0.15 |
| `expo-task-manager` | ~14.0.9 | ~57.0.12 |
| `expo-background-fetch` | ~14.0.9 | ~57.0.12 |

Packages outside Expo's management that need manual verification: `nativewind` (4.2.1,
latest 4.2.6 — declares no React Native ceiling), `@react-navigation/*` (v7, current range
already covers the latest), `lucide-react-native` (on `^0.563.0`; latest is 1.33.0, a major
bump — **leave pinned for launch**), `axios`, `lodash`.

The heaviest risk concentrates in Reanimated and Worklets, which the app uses on every
screen for entrance animations, and in NativeWind's Babel/Metro integration.

### 5.8 Alert sound is a chime, not an alarm
`assets/sounds/proxi-alert.wav` is 592KB of 16-bit stereo PCM at 44.1kHz — approximately
**3.36 seconds**. That reads as a notification chime; an alarm needs sustained sound.

iOS permits custom notification sounds up to **30 seconds**. Replace with a 20–30s
alarm-style tone. Converting to mono roughly halves the file size at no perceptible cost
for an alert tone.

Note the channel immutability constraint in §3.9: on Android the sound is baked into the
channel at creation, so changing it requires a new channel ID.

## 6. Routing Defects

### 6.1 WelcomeScreen is unreachable dead code — P1
`RootNavigator` sends unauthenticated users straight to `/(auth)/login`
([app/_layout.tsx:89](app/_layout.tsx#L89)), so the welcome screen is never the
landing route. The only paths to it are:

- [app/(auth)/login.tsx:9](app/(auth)/login.tsx#L9)
- [app/(auth)/signup.tsx:11](app/(auth)/signup.tsx#L11)

both of which push `'/(auth)/index'` — **not a valid expo-router href**. Index routes
resolve as `/(auth)`. So 89 lines of `components/welcomeScreen.tsx` are unreachable,
and the "back to welcome" affordance on both auth screens is broken.

Fix: delete the screen and the two dead navigation branches.

### 6.2 `(tab)` group naming
Singular `(tab)` rather than the conventional `(tabs)`. Cosmetic only; not worth the
churn before launch.

## 7. Screen Consolidation

**Decision: merge Explorer into Home; ship three tabs.**

`app/(tab)/explorer.tsx` (553 lines) and `app/(tab)/home.tsx` (454 lines) are
approximately 85% the same screen — both are a searchable reminder list showing live
distance, and **each opens its own independent `watchPositionAsync` subscription**.

Explorer's action sheet offers six actions, of which **four are `Alert.alert('Coming soon')`**
([explorer.tsx:243–252](app/(tab)/explorer.tsx#L243)) — edit, duplicate, share, archive.
Incomplete functionality is an explicit App Review rejection reason (Apple Guideline 2.1).

Its Filter and Sort buttons ([explorer.tsx:310–321](app/(tab)/explorer.tsx#L310)) are
inert: `filterCategory` and `sortBy` are declared without setters
([explorer.tsx:135](app/(tab)/explorer.tsx#L135)).

Merging carries Explorer's two genuinely useful features — the detail modal and delete
— into Home, and removes:
- 4 "Coming soon" dead ends
- 2 inert buttons
- 1 duplicate GPS subscription
- the tab-bar margin hack (`marginRight: 30` / `marginLeft: 30`) that exists only to
  dodge the floating action button

## 8. UI Inconsistencies

### 8.1 Three different accent colours
| Colour | Occurrences | Where |
|---|---|---|
| `#00D4AA` | 19 | Hardcoded throughout screens |
| `#00d4d4` | 9 | The Tailwind `accent` token and the tab bar |
| `#6366f1` | 5 | Notification LED, map circle |

The design token in [tailwind.config.js](tailwind.config.js) disagrees with what the
code actually renders. Consolidate to one value referenced through the token.

### 8.2 Styling approach diverges
[app/location-picker.tsx](app/location-picker.tsx) uses `StyleSheet.create` with
hand-rolled `dark`/`light` token objects, while every other screen uses NativeWind
classes. It also duplicates the theme palette that already exists in
`tailwind.config.js`. Convert to NativeWind.

### 8.3 Non-existent font
`fontFamily: 'Courier'` is hardcoded at
[app/location-picker.tsx:143](app/location-picker.tsx#L143) and
[app/add-reminder.tsx:193](app/add-reminder.tsx#L193). Android has no `Courier` and
falls back silently, so the two platforms render these headers differently. `expo-font`
is a dependency but no custom font is ever loaded.

### 8.4 Non-functional controls
- **Settings notification toggle** ([settings.tsx:450](app/(tab)/settings.tsx#L450))
  is local state only — flipping it changes nothing. Reviewer-visible.
- **Settings profile row** ([settings.tsx:364](app/(tab)/settings.tsx#L364)) is a
  `TouchableOpacity` with no `onPress` and a chevron implying navigation.

### 8.5 Blocking splash delay
[app/_layout.tsx:107](app/_layout.tsx#L107) hardcodes `setTimeout(resolve, 2000)`
before anything renders — two seconds added to every cold start for no functional reason.

## 9. Performance and Correctness

### 9.1 Redundant GPS requests
When `currentCoordinates` is null, **each reminder card independently calls
`getCurrentPositionAsync`** ([home.tsx:27](app/(tab)/home.tsx#L27),
[explorer.tsx:31](app/(tab)/explorer.tsx#L31)) — N parallel GPS requests for N cards.
Hoist to a single shared location source.

### 9.2 Doubled permission prompts
`requestAllPermissions` ([lib/location/permissions.ts:38](lib/location/permissions.ts#L38))
calls `requestForegroundLocation()` directly and then `requestBackgroundLocation()`,
which calls it again internally.

### 9.3 Overnight timeframes are impossible
Both the validator ([add-reminder.tsx:573](app/add-reminder.tsx#L573)) and
`isInTimeframe` ([geofencing.ts:40](lib/location/geofencing.ts#L40)) require
`start < end`, so a 22:00→06:00 window is rejected. A location reminder for a
night shift cannot be expressed.

### 9.4 Activity feed noise
Every toggle logs a `toggled` activity ([reminderContext.tsx:88](context/reminderContext.tsx#L88)).
Combined with the enable/disable switch on every card, the Activity tab will fill with
low-value events and bury the `triggered` entries that matter.

### 9.5 Dead configuration file
[lib/config.ts](lib/config.ts) is imported nowhere and contradicts the resolution logic
in `lib/api/client.ts` — it hardcodes `localhost:8080` for dev, which `client.ts`
deliberately avoids because it produces 404s in Expo Go. Delete it.

### 9.6 `expo-haptics` shipped but never used
`expo-haptics` is declared in [package.json](package.json) and bundled into every build,
but has **zero imports** anywhere in the codebase. The app ships the native module and uses
none of it.

This is a free win rather than a defect: haptic feedback is a dependency-free addition
because the dependency is already paid for. See LAUNCH_PLAN.md for where it applies.

One constraint worth recording: haptics require the app to be **foregrounded**. Feedback
cannot be triggered from the background geofence task — the notification's vibration
pattern is the only tactile channel available when the app is closed.

## 10. Security Review

No credential leaks found.

- `.env` is correctly gitignored and untracked.
- `EXPO_PUBLIC_*` variables are embedded in the bundle by design. This is expected and
  safe for a Mapbox public token, and will be equally safe for the Android Google Maps
  key **provided that key is restricted** in Google Cloud Console to the app's package
  name and SHA-1 signing certificate. Restricting it is mandatory, not optional.
- JWT storage uses `expo-secure-store` (Keychain/Keystore) — correct.
- The 401 interceptor clears the token on expiry — correct, though see §3.6 for the
  missing UI consequence.

## 11. Go-Live Criteria

1. All P0 defects in §3 resolved and verified on a physical device.
2. Account deletion implemented end-to-end, including the backend endpoint (§4.1).
3. `android.package` configured; notification icon asset present; Critical Alerts removed (§4.2–4.4).
4. **Expo SDK 57 upgrade complete; Android target API 36 confirmed in the build (§4.8, §5.7).**
5. Map migration complete and radius overlay verified accurate (§5.1–5.4).
6. **Notification channel verified applied on a physical device — MAX importance, DND
   bypass, custom sound (§3.9); iOS `timeSensitive` confirmed (§5.6).**
7. Privacy policy published at a public URL; App Privacy labels and Play Data Safety complete (§4.6).
8. Physical-device QA of background geofencing: app backgrounded, app terminated, device rebooted.
9. Apple Developer Program and Google Play Console accounts active.

## 12. Change Log Since 23 April 2026 Audit

**Corrected on `day4/release-prep` (30 August 2026):**
- **§4.6's framing was wrong.** It called for disclosing "precise background location
  collection, server-side storage, and retention". Tracing every outbound call shows the
  device's live position is never transmitted: `lib/location/geofencing.ts` compares
  on-device, and `LogActivityPayload` carries the reminder's label, not a position. Only
  the coordinates of user-saved places are sent, via `/api/reminders`. Precise Location is
  still declared as collected on both store forms — saved places are coordinates tied to an
  account — but the policy must not claim the app uploads the user's movements. See
  `release/DATA_DISCLOSURES.md`.
- §4.6 compliance package drafted in `release/`: privacy policy, both stores' disclosures,
  listing copy, device QA checklist, release runbook. Unpublished and unsubmitted.
- iOS privacy manifest checked: AsyncStorage and expo-file-system ship their own
  `PrivacyInfo.xcprivacy`, and the app uses no required-reason API directly, so no
  app-level `ios.privacyManifests` entry is needed.
- **Newly noted:** `supportsTablet: true` obliges iPad screenshots and iPad layout review.
  Not changed — it is a product decision.

**Resolved on `day3/screen-consolidation-and-compliance` (30 August 2026):**
- §7 — Explorer merged into Home. Detail modal, delete, and the stats row ported;
  the five "Coming soon" actions deleted rather than carried over. Three tabs, and the
  tab-bar margin hack that dodged the FAB is gone.
- §6.1 — `WelcomeScreen` and `app/(auth)/index.tsx` deleted. The `as Href` casts that hid
  the invalid `'/(auth)/index'` route are gone, so both auth routes now typecheck.
- §4.1 — account deletion implemented client-side: `authApi.deleteAccount`, a Settings row
  behind an explicit confirmation, and shared teardown. **Still blocked on the backend.**
- §3.6 — a 401 from any request now clears auth state via a handler registered on the
  client, instead of deleting the token and leaving the user stranded.
- §3.7 — the picker hands its result over through `LocationDraftProvider` instead of
  `router.back()` + `router.setParams()`. The icon defect is fixed at its root: nothing
  anywhere could set an icon, so an icon picker was added.
- §8.1 — one accent (#00D4AA). `lib/theme.ts` holds the value for props that need a real
  colour string; the Tailwind token holds it for classes.
- §8.2 — `location-picker` converted to NativeWind; its two hand-rolled palettes deleted.
- §8.3 — `fontFamily: 'Courier'` removed. §8.4 — the inert notifications switch now
  reflects real OS permission; the profile row's chevron-without-destination is gone.
- §8.5 — the fixed 2-second splash delay removed.
- §9.1 — cards no longer each call `getCurrentPositionAsync`; distance comes from the one
  watch the screen owns. §9.2 — the doubled foreground permission prompt fixed.
- §4.7 — permissions are no longer requested at launch. Startup only checks; the prompt
  moves to the first reminder save, with an explanation.

**Still open after day 3:**
- §4.1 — `DELETE /api/auth/me` does not exist. The client is complete and will 404.
- §5.8 / §2.6 — the alarm sound is still the 3.36s chime.
- §9.3 overnight timeframes, §9.4 activity feed noise, §6.2 `(tab)` naming — all
  explicitly out of scope for launch.

**Resolved on `day2/alarm-notifications-and-geofencing` (30 August 2026):**
- **§3.9 — the alarm channel now actually applies.** `channelId` moved to the trigger on
  both senders; the channel id is a constant and bumped to `proxi-alarm-v2`, with the
  superseded channel deleted.
- §3.1 — notification spam fixed. Occupancy tracking with a `radius x 1.15` exit ring;
  notifies only on the outside-to-inside transition.
- §3.2 — background activity logging now goes through the shared API client, so it reads
  the JWT from SecureStore rather than AsyncStorage and resolves the base URL correctly.
- §3.3 — `once` completion persists to the server (`triggered` and `enabled`), with a
  toggle fallback, plus a foreground re-fetch so the badge is not stale.
- §3.4 — `categoryIdentifier` moved out of the Android-only spread, so Done and Snooze
  render on iOS.
- §3.5 — the Done action performs a real mutation instead of a `console.log`.
- §3.8 — dead `cachedReminders` write removed.
- §3.10 — `sendFullScreenReminderNotification` deleted.
- §3.12 / §5.6 — iOS drops to `interruptionLevel: 'timeSensitive'`; `allowCriticalAlerts`
  removed from the permission request.
- §9.5 — unused `lib/config.ts` deleted.
- §9.6 — `expo-haptics` wired through a `lib/haptics.ts` wrapper.
- **Latent bug found while fixing §3.9:** the notification payload carried only
  `reminderId`, but the response listener destructures `reminderTitle`, `location`, and
  `icon` from it — so snoozing produced a notification with `undefined` fields. All four
  are now written.

**Still open after day 2:**
- §5.8 — the alert sound is still the 3.36s stereo chime. A 20–30s alarm tone is an
  audio asset that has to be produced outside this repo. **This blocks the channel id:**
  replacing the sound after `proxi-alarm-v2` exists on a device requires a `v3` bump,
  because Android freezes a channel's sound at creation.
- §3.11 — `SCHEDULE_EXACT_ALARM` is declared and snooze passes the channel, but the
  under-Doze timing check is physical-device work.

**Resolved on `day1/expo-57-upgrade` (30 August 2026):**
- Expo SDK 54 → 57, React Native 0.81.5 → 0.86.3; Android now targets API 36 via
  `expo-build-properties`, clearing Play's 31 August 2026 minimum (§4.8, §5.7).
- `android.package` declared (§4.2). Notification icon asset added (§4.3).
- Mapbox removed entirely; `react-native-maps` 1.27.2 in its place. The radius overlay
  is now a metre-based `<Circle>` and is geographically correct (§5.3, §5.1–5.4).
- Geocoding moved behind a `GeocodingProvider` interface backed by expo-location,
  absorbing all three raw Mapbox fetch calls (§5.2).
- Duplicated `UIBackgroundModes` deduped (§4.5).
- `UNAuthorizationOptionCriticalAlert` removed from app config (§4.4 — the
  `interruptionLevel` code change remains open in §3.12, scheduled for day 2).
- `USE_FULL_SCREEN_INTENT` removed (§4.9). `SCHEDULE_EXACT_ALARM` added, which is the
  configuration half of §3.11; the runtime scheduling change remains open.
- `tsc --noEmit` is now clean — the `ExpoConfig.name` error is fixed and the archived
  `lib/simulation/` directory is excluded from the build (§2.4, supersedes the note below).

**Resolved:**
- Location parameter contract between add-reminder and location-picker was reported
  corrected. It is **not** — see §3.7. Re-opened.

**Still open from the previous audit:**
- `android.package` missing (§4.2)
- Notification icon asset missing (§4.3)
- Critical Alerts enabled without entitlement (§4.4)
- Compliance package incomplete (§4.6)
- "Done" notification action incomplete (§3.5)
- Explorer placeholder actions (§7)

**Newly identified in this audit:**
- Notification spam for `always` reminders (§3.1)
- Background activity logging non-functional due to token storage mismatch (§3.2)
- `once` completion never syncs to server (§3.3)
- iOS notification actions never render (§3.4)
- Expired sessions strand the user (§3.6)
- Every reminder saves with the default icon (§3.7)
- **Missing account deletion — near-certain Apple rejection (§4.1)**
- WelcomeScreen unreachable via invalid href (§6.1)
- Three conflicting accent colours (§8.1)
- Radius circle geographically inaccurate (§5.3)
- Store accounts not yet enrolled — longest lead time in the project (§1)
- **The alarm notification channel is never applied — `channelId` is never set, so MAX
  importance, DND bypass, custom sound, and vibration have never once taken effect (§3.9)**
- **Android target API 35 is below Play's 31 August 2026 minimum of API 36 (§4.8)**
- `sendFullScreenReminderNotification` is non-functional and never called (§3.10)
- Snooze falls back to inexact scheduling on Android and can be delayed indefinitely (§3.11)
- iOS `interruptionLevel: 'critical'` requires an unobtainable entitlement (§3.12)
- `USE_FULL_SCREEN_INTENT` declared but unused — Play policy liability with no feature (§4.9)
- Alert sound is a 3.36s chime where an alarm tone is required (§5.8)
- `expo-haptics` bundled into every build with zero imports (§9.6)

**Superseded:**
- Mapbox release blockers from the April audit are void. The Mapbox dependency is being
  removed entirely; neither `MAPBOX_DOWNLOADS_TOKEN` nor `EXPO_PUBLIC_MAPBOX_TOKEN` will
  be required (§5.1–5.4).
- The April audit's "high-risk" framing of Critical Alerts (§4.1 in that report) is
  resolved by a different route than it proposed: rather than seeking the entitlement,
  the app drops to `timeSensitive`, which needs no approval and is the correct level
  for a location reminder (§5.6).
- The April audit's lint findings were re-checked. That audit recorded 8 TypeScript
  errors confined to `app.config.ts` and the archived `lib/simulation/` directory (§2.4).
  Both causes are fixed as of 30 August 2026; `tsc --noEmit` now reports none.

